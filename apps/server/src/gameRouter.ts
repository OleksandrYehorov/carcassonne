import { z } from 'zod';
import { protectedProcedure, publicProcedure, router } from './trpc';
import { tracked, TRPCError } from '@trpc/server';
import { GameEngine } from './GameEngine';
import { EventEmitter, on } from 'events';
import { zAsyncIterable } from './zAsyncIterable';
import { Player, Pos, TileEntity } from '@carcassonne/shared';
import { PlacedTileEntity } from '@carcassonne/shared';
import { serialize } from 'cookie';

export type GameState = {
  currentTile: TileEntity | null;
  placedTiles: PlacedTileEntity[];
  deckSize: number;
  currentRotations: number;
  validPositions: Pos[];
  currentPlayer: Player;
  players: Player[];
  playersCount: number;
  turnState: 'placeTile' | 'placeMeepleOrEnd';
};

// Create an event emitter for game updates
const gameUpdateEmitter = new EventEmitter();

// In-memory storage for game instances
const gameInstances = new Map<string, GameEngine>();

// Add session storage
const playerSessions = new Map<string, { gameId: string; playerId: string }>();

// Helper to get game instance or throw tRPC error
const getGameInstance = (gameId: string) => {
  const game = gameInstances.get(gameId);
  if (!game) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: `Game with ID ${gameId} not found`,
    });
  }
  return game;
};

// Helper to emit game updates
const emitGameUpdate = (gameId: string) => {
  const game = gameInstances.get(gameId);
  if (game) {
    gameUpdateEmitter.emit(`update:${gameId}`, {
      gameId,
      state: {
        currentTile: game.getCurrentTile(),
        placedTiles: game.getPlacedTiles(),
        deckSize: game.getDeckSize(),
        currentRotations: game.getCurrentRotations(),
        validPositions: game.getValidPositions(),
        currentPlayer: game.getCurrentPlayer(),
        players: game.getPlayers(),
        turnState: game.getTurnState(),
        playersCount: game.playersCount,
      } satisfies GameState,
    });
  }
};

export const gameRouter = router({
  // Create a new game
  createGame: publicProcedure
    .input(
      z.object({
        hostPlayerName: z.string().min(2).max(50),
        playersCount: z.number().min(2).max(5),
      })
    )
    .mutation(({ input: { hostPlayerName, playersCount }, ctx }) => {
      console.log('CREATE GAME');

      const game = new GameEngine({ playersCount });
      gameInstances.set(game.gameId, game);

      const addPlayerResult = game.addPlayer(hostPlayerName);

      if (addPlayerResult.success == false) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: addPlayerResult.message ?? 'Failed to add player to game',
        });
      }

      const sessionId = crypto.randomUUID();
      playerSessions.set(sessionId, {
        gameId: game.gameId,
        playerId: addPlayerResult.player.id,
      });

      const cookie = serialize('playerSession', sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24, // 1 day
        path: '/',
      });

      console.log('createGame -> ctx.resHeaders.set', { sessionId }, cookie);

      ctx.resHeaders.set('Set-Cookie', cookie);

      emitGameUpdate(game.gameId);
      return { gameId: game.gameId };
    }),

  // Get current game state
  getGameState: publicProcedure.input(z.string()).query(({ input: gameId }) => {
    const game = getGameInstance(gameId);
    return {
      currentTile: game.getCurrentTile(),
      placedTiles: game.getPlacedTiles(),
      deckSize: game.getDeckSize(),
      currentRotations: game.getCurrentRotations(),
      validPositions: game.getValidPositions(),
      currentPlayer: game.getCurrentPlayer(),
      players: game.getPlayers(),
      turnState: game.getTurnState(),
      playersCount: game.playersCount,
    } satisfies GameState;
  }),

  // Rotate current tile
  rotateTile: protectedProcedure
    .input(z.string())
    .mutation(({ input: gameId }) => {
      const game = getGameInstance(gameId);
      const success = game.rotateTile();
      emitGameUpdate(gameId);
      return {
        success,
        currentTile: game.getCurrentTile(),
        validPositions: game.getValidPositions(),
      };
    }),

  // Place tile at position
  placeTile: protectedProcedure
    .input(
      z.object({
        gameId: z.string(),
        position: z.object({
          x: z.number(),
          y: z.number(),
        }),
      })
    )
    .mutation(({ input }) => {
      const game = getGameInstance(input.gameId);
      const result = game.placeTile(input.position);

      if (!result.success) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message:
            'Failed to place tile. Try rotating the tile or choosing a different position.',
        });
      }

      emitGameUpdate(input.gameId);

      return {
        currentTile: game.getCurrentTile(),
        placedTiles: game.getPlacedTiles(),
        deckSize: game.getDeckSize(),
        validPositions: game.getValidPositions(),
      };
    }),

  skipMeeplePlacement: protectedProcedure
    .input(z.string())
    .mutation(({ input: gameId }) => {
      const game = getGameInstance(gameId);
      const result = game.skipMeeplePlacement();

      if (!result.success) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Cannot skip meeple placement at this time',
        });
      }

      emitGameUpdate(gameId);

      return {
        currentTile: game.getCurrentTile(),
        placedTiles: game.getPlacedTiles(),
        players: game.getPlayers(),
        currentPlayer: game.getCurrentPlayer(),
        completedFeatures: result.completedFeatures
          ? result.completedFeatures.map((feature) => ({
              ...feature,
              winners: feature.winners,
            }))
          : [],
      };
    }),

  // Update placeMeeple endpoint
  placeMeeple: protectedProcedure
    .input(
      z.object({
        gameId: z.string(),
        entityId: z.string(),
      })
    )
    .mutation(({ input: { entityId, gameId } }) => {
      const game = getGameInstance(gameId);
      const result = game.placeMeeple(entityId);

      if (!result.success) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message:
            'Failed to place meeple. Invalid position or no meeples remaining.',
        });
      }

      emitGameUpdate(gameId);

      return {
        currentTile: game.getCurrentTile(),
        placedTiles: game.getPlacedTiles(),
        players: game.getPlayers(),
        currentPlayer: game.getCurrentPlayer(),
        completedFeatures: result.completedFeatures
          ? result.completedFeatures.map((feature) => ({
              ...feature,
              winners: feature.winners,
            }))
          : [],
      };
    }),

  // Add endpoint to get current player
  getCurrentPlayer: protectedProcedure
    .input(z.string())
    .query(({ input: gameId }) => {
      const game = getGameInstance(gameId);
      return game.getCurrentPlayer();
    }),

  // Add endpoint to get all players
  getPlayers: protectedProcedure
    .input(z.string())
    .query(({ input: gameId }) => {
      const game = getGameInstance(gameId);
      return game.getPlayers();
    }),

  // Add endpoint to get valid meeple positions
  getValidMeeplePositions: protectedProcedure
    .input(
      z.object({
        gameId: z.string(),
        position: z.object({
          x: z.number(),
          y: z.number(),
        }),
      })
    )
    .query(({ input }) => {
      const game = getGameInstance(input.gameId);
      return game.getValidMeeplePositions(input.position);
    }),

  // Join an existing game
  joinGame: publicProcedure
    .input(
      z.object({
        gameId: z.string(),
        playerName: z.string().min(2).max(50),
      })
    )
    .mutation(({ input: { gameId, playerName }, ctx }) => {
      const game = gameInstances.get(gameId);
      if (!game) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Game with ID ${gameId} not found`,
        });
      }

      // Check if player name already exists in the game
      const existingPlayer = game
        .getPlayers()
        .find(
          (player) => player.name.toLowerCase() === playerName.toLowerCase()
        );
      if (existingPlayer) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Player name already taken in this game.',
        });
      }

      const result = game.addPlayer(playerName);
      if (!result.success) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: result.message || 'Failed to join the game.',
        });
      }

      // Create session
      const sessionId = crypto.randomUUID();
      playerSessions.set(sessionId, { gameId, playerId: result.player.id });

      const cookie = serialize('playerSession', sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24, // 1 day
        path: '/',
      });

      console.log('joinGame -> ctx.resHeaders.set', { sessionId }, cookie);

      ctx.resHeaders.set('Set-Cookie', cookie);

      emitGameUpdate(gameId);

      return {
        playerId: result.player?.id,
        color: result.player?.color,
        gameId,
      };
    }),

  // Add a new endpoint to get player session
  // getPlayerSession: publicProcedure.query(({ ctx }) => {
  //   if (!ctx.req.headers) {
  //     throw new TRPCError({
  //       code: 'UNAUTHORIZED',
  //       message: 'No active player session',
  //     });
  //   }

  //   const session = playerSessions.get(ctx.playerSession!);
  //   if (!session) {
  //     throw new TRPCError({
  //       code: 'UNAUTHORIZED',
  //       message: 'Invalid player session',
  //     });
  //   }

  //   return session;
  // }),

  // Add subscription for game updates
  onGameUpdate: publicProcedure
    .input(z.object({ gameId: z.string() }))
    .output(
      zAsyncIterable({
        yield: z.object({
          gameId: z.string(),
          state: z
            .object({})
            .catchall(z.any()) as unknown as z.ZodType<GameState>,
        }),
        tracked: true,
      })
    )
    .subscription(async function* ({ signal, input: { gameId } }) {
      const game = getGameInstance(gameId);
      const gameState = {
        currentTile: game.getCurrentTile(),
        placedTiles: game.getPlacedTiles(),
        deckSize: game.getDeckSize(),
        currentRotations: game.getCurrentRotations(),
        validPositions: game.getValidPositions(),
        currentPlayer: game.getCurrentPlayer(),
        players: game.getPlayers(),
        turnState: game.getTurnState(),
        playersCount: game.playersCount,
      } satisfies GameState;

      yield tracked(game.gameId, {
        gameId: game.gameId,
        state: gameState,
      });

      // listen for new events
      for await (const [data] of on(gameUpdateEmitter, `update:${gameId}`, {
        // Passing the AbortSignal from the request automatically cancels the event emitter when the request is aborted
        signal,
      })) {
        yield tracked(data.gameId, data);
      }
    }),

  // Add this after the onGameUpdate subscription
  onGameStart: publicProcedure
    .input(z.object({ gameId: z.string() }))
    .subscription(async function* ({ input: { gameId } }) {
      const game = getGameInstance(gameId);

      // Check if all players are connected
      if (game.getPlayers().length === game.playersCount) {
        yield { gameId, canStart: true };
      }

      // Listen for game updates
      for await (const [data] of on(gameUpdateEmitter, `update:${gameId}`)) {
        if (data.state.players.length === data.state.playersCount) {
          yield { gameId, canStart: true };
        }
      }
    }),
});
