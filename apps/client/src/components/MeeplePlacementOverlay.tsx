import { Button } from '@/components/ui/button/button';
import { CELL_SIZE } from '@/utils/constants';
import {
  calculateMeeplePosition,
  capitalize,
  getRotation,
} from '@/utils/helpers';
import { trpc } from '@/utils/trpc';
import { MeeplePosition, Pos, TileEntity } from '@carcassonne/shared';
import { skipToken } from '@tanstack/react-query';
import { Dispatch, FC, SetStateAction, useCallback, useEffect } from 'react';
import { toast } from 'sonner';

// Update getMeeplePositions to use the API response
const getMeeplePositions = (
  currentTile: TileEntity | null,
  validEntityIds: string[]
): { entityId: string; position: MeeplePosition }[] => {
  if (!currentTile) return [];

  return currentTile.entities
    .filter((entity) => validEntityIds.includes(entity.id))
    .map((entity) => ({
      entityId: entity.id,
      position: calculateMeeplePosition(entity),
    }));
};

export const MeeplePlacementOverlay: FC<{
  gameId: string | undefined;
  setShowMeeplePlacement: Dispatch<SetStateAction<boolean>>;
  lastPlacedTilePos: Pos | null;
  setLastPlacedTilePos: Dispatch<SetStateAction<Pos | null>>;
  pos: Pos;
}> = ({
  gameId,
  pos,
  setShowMeeplePlacement,
  lastPlacedTilePos,
  setLastPlacedTilePos,
}) => {
  const utils = trpc.useUtils();

  // Get game state query
  const gameStateQuery = trpc.game.getGameState.useQuery(gameId ?? skipToken);

  const lastPlacedTile = gameStateQuery.data?.placedTiles.find(
    (tile) =>
      tile.position.x === lastPlacedTilePos?.x &&
      tile.position.y === lastPlacedTilePos?.y
  );

  // Mutations for game actions
  const { mutateAsync: placeMeeple } = trpc.game.placeMeeple.useMutation();
  const { mutateAsync: skipMeeplePlacement } =
    trpc.game.skipMeeplePlacement.useMutation();

  // Add query for valid meeple positions
  const validMeeplePositionsQuery = trpc.game.getValidMeeplePositions.useQuery(
    gameId && lastPlacedTilePos
      ? {
          gameId,
          position: lastPlacedTilePos,
        }
      : skipToken
  );

  // Add meeple placement handler
  const handleMeeplePlacement = useCallback(
    async (entityId: string) => {
      if (!gameId || !lastPlacedTilePos) return;

      const result = await placeMeeple(
        {
          gameId,
          entityId,
        },
        {
          onSuccess: () => {
            utils.game.getGameState.invalidate();
            setShowMeeplePlacement(false);
            setLastPlacedTilePos(null);
          },
        }
      );

      const currentPlayerId = gameStateQuery.data?.currentPlayer?.id;
      if (!currentPlayerId) return;

      result.completedFeatures?.forEach((feature) => {
        if (!feature.winners) return;

        if (feature.type === 'road') {
          const playerColors = feature.winners
            .map((id) => {
              const color = gameStateQuery.data?.players.find(
                (p) => p.id === id
              )?.color;
              return color ? capitalize(color) : null;
            })
            .filter((color) => typeof color === 'string');

          if (playerColors.length === 1) {
            toast.success('Road Completed!', {
              description: `${playerColors[0]} scored ${feature.score} points!`,
              position: 'top-center',
            });
          } else {
            toast.success('Road Completed!', {
              description: `${playerColors.join(' and ')} share ${
                feature.score
              } points!`,
              position: 'top-center',
            });
          }
        }

        if (feature.type === 'city') {
          const playerColors = feature.winners
            .map((id) => {
              const color = gameStateQuery.data?.players.find(
                (p) => p.id === id
              )?.color;
              return color ? capitalize(color) : null;
            })
            .filter((color) => typeof color === 'string');

          if (playerColors.length === 1) {
            toast.success('City Completed!', {
              description: `${playerColors[0]} scored ${feature.score} points!`,
              position: 'top-center',
            });
          } else {
            toast.success('City Completed!', {
              description: `${playerColors.join(' and ')} share ${
                feature.score
              } points!`,
              position: 'top-center',
            });
          }
        }

        if (feature.type === 'monastery') {
          const playerColor = gameStateQuery.data?.players.find(
            (p) => p.id === feature.winners?.[0]
          )?.color;

          if (playerColor) {
            toast.success('Monastery Completed!', {
              description: `${capitalize(playerColor)} scored ${
                feature.score
              } points!`,
              position: 'top-center',
            });
          }
        }
      });
    },
    [
      gameId,
      gameStateQuery.data?.currentPlayer?.id,
      gameStateQuery.data?.players,
      lastPlacedTilePos,
      placeMeeple,
      setLastPlacedTilePos,
      setShowMeeplePlacement,
      utils.game.getGameState,
    ]
  );

  // Add useEffect to auto-end turn when no valid positions
  useEffect(() => {
    if (
      validMeeplePositionsQuery.data &&
      validMeeplePositionsQuery.data.length === 0 &&
      gameId &&
      lastPlacedTilePos
    ) {
      skipMeeplePlacement(gameId, {
        onSuccess: () => {
          utils.game.getGameState.invalidate();
          setShowMeeplePlacement(false);
          setLastPlacedTilePos(null);
        },
      });
    }
  }, [
    validMeeplePositionsQuery.data,
    gameId,
    lastPlacedTilePos,
    skipMeeplePlacement,
    utils.game.getGameState,
    setShowMeeplePlacement,
    setLastPlacedTilePos,
  ]);

  // Add end turn handler
  const handleEndTurnHandler = useCallback(async () => {
    if (!gameId) return;

    await skipMeeplePlacement(gameId, {
      onSuccess: () => {
        utils.game.getGameState.invalidate();
        setShowMeeplePlacement(false);
        setLastPlacedTilePos(null);
      },
    });
  }, [
    gameId,
    skipMeeplePlacement,
    setShowMeeplePlacement,
    setLastPlacedTilePos,
    utils.game.getGameState,
  ]);

  const meeplePositions = getMeeplePositions(
    lastPlacedTile ?? null,
    validMeeplePositionsQuery.data ?? []
  );

  return (
    <div
      className="absolute"
      style={{
        transform: `translate(${pos.x * CELL_SIZE}px, ${pos.y * CELL_SIZE}px)`,
        width: CELL_SIZE,
        height: CELL_SIZE,
      }}
    >
      {/* Meeple placement buttons */}
      <div
        className="absolute left-0 top-0 right-0 bottom-0"
        style={{
          transform: `rotate(${getRotation(
            lastPlacedTile?.orientation ?? 'top'
          )}deg)`,
        }}
      >
        {meeplePositions.map((meeplePos, index) => (
          <button
            key={index}
            className="absolute block w-6 h-6 text-[0px] rounded-full border-2 border-white bg-transparent hover:bg-white/20"
            style={{
              left: `${meeplePos.position.x}%`,
              top: `${meeplePos.position.y}%`,
              transform: `translate(-50%, -50%)`,
            }}
            onClick={() => {
              handleMeeplePlacement(meeplePos.entityId);
            }}
            data-testid={`meeple-${meeplePos.entityId}`}
          />
        ))}
      </div>
      <Button
        variant="default"
        onClick={handleEndTurnHandler}
        data-testid="end-turn"
        className="absolute -bottom-9 left-1/2 -translate-x-1/2 p-2 h-[unset] text-xs"
      >
        End Turn
      </Button>
    </div>
  );
};
