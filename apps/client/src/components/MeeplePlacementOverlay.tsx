import { Button } from '@/components/ui/button/button';
import { CELL_SIZE } from '@/utils/constants';
import { calculateMeeplePosition, getRotation } from '@/utils/helpers';
import { trpc } from '@/utils/trpc';
import { MeeplePosition, Pos, TileEntity } from '@carcassonne/shared';
import { skipToken } from '@tanstack/react-query';
import { Dispatch, FC, SetStateAction, useCallback, useEffect } from 'react';

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

      console.log('result.completedFeatures', result.completedFeatures);

      // Show completion messages for all completed features
      // result.completedFeatures?.completedRoads.forEach((road) => {
      //   const playerNames = road.playerIds
      //     .map(
      //       (id) => gameStateQuery.data?.players.find((p) => p.id === id)?.color
      //     )
      //     .filter(Boolean)
      //     .join(' and ');

      //   if (road.playerIds.length > 0) {
      //     toast.success('Road Completed!', {
      //       description: `${playerNames} scored ${road.length} points!`,
      //       duration: 5000,
      //       className: 'bg-green-500 text-white',
      //       position: 'top-center',
      //     });
      //   }
      // });

      // result.completedFeatures?.completedCities.forEach((city) => {
      //   // const playerNames = city.playerIds
      //   //   .map(
      //   //     (id) => gameStateQuery.data?.players.find((p) => p.id === id)?.color
      //   //   )
      //   //   .filter(Boolean)
      //   //   .join(' and ');

      //   if (city.playerIds.length > 0) {
      //     toast.success('City Completed!', {
      //       description: `${playerNames} scored ${city.score} points!`,
      //       duration: 5000,
      //       className: 'bg-blue-500 text-white',
      //       position: 'top-center',
      //     });
      //   }
      // });

      // result.completedFeatures?.completedMonasteries.forEach((monastery) => {
      //   const playerNames = monastery.playerIds
      //     .map(
      //       (id) => gameStateQuery.data?.players.find((p) => p.id === id)?.color
      //     )
      //     .filter(Boolean)
      //     .join(' and ');

      //   if (monastery.playerIds.length > 0) {
      //     toast.success('Monastery Completed!', {
      //       description: `${playerNames} scored ${monastery.score} points!`,
      //       duration: 5000,
      //       className: 'bg-purple-500 text-white',
      //       position: 'top-center',
      //     });
      //   }
      // });
    },
    [
      gameId,
      gameStateQuery.data?.currentPlayer?.id,
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
          <Button
            key={index}
            className="absolute block w-6 h-6 rounded-full border-2 border-current bg-transparent hover:bg-white/20"
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
    </div>
  );
};
