import { z } from 'zod';
import { publicProcedure, router } from './trpc';
import { TRPCError } from '@trpc/server';
import { GameEngine } from './GameEngine';
import { CARCASSONNE_DECK } from './deck';

// In-memory storage for game instances
const gameInstances = new Map<string, GameEngine>();

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

export const gameRouter = router({
  // Create a new game
  createGame: publicProcedure.mutation(() => {
    const [startTile, ...remainingDeck] = CARCASSONNE_DECK.filter(
      // TODO: TEMPORARY!!!! remove tiles that dont have roads
      (tile) => tile.entities.some((e) => e.type === 'road')
    );
    const gameId = crypto.randomUUID();
    const game = new GameEngine(startTile, remainingDeck);
    gameInstances.set(gameId, game);
    return { gameId };
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
      score: game.getScore(),
    };
  }),

  // Rotate current tile
  rotateTile: publicProcedure
    .input(z.string())
    .mutation(({ input: gameId }) => {
      const game = getGameInstance(gameId);
      const success = game.rotateTile();
      return {
        success,
        currentTile: game.getCurrentTile(),
        validPositions: game.getValidPositions(),
      };
    }),

  // Place tile at position
  placeTile: publicProcedure
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
      const success = game.placeTile(input.position);

      if (!success) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message:
            'Failed to place tile. Try rotating the tile or choosing a different position.',
        });
      }

      return {
        currentTile: game.getCurrentTile(),
        placedTiles: game.getPlacedTiles(),
        deckSize: game.getDeckSize(),
        validPositions: game.getValidPositions(),
        score: game.getScore(),
      };
    }),

  // Shuffle current tile back into deck
  shuffleCurrentTile: publicProcedure
    .input(z.string())
    .mutation(({ input: gameId }) => {
      const game = getGameInstance(gameId);
      game.shuffleCurrentTile();
      return {
        currentTile: game.getCurrentTile(),
        deckSize: game.getDeckSize(),
        validPositions: game.getValidPositions(),
      };
    }),
});
