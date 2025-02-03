import { Button } from '@/components/ui/button/button';
import { CELL_SIZE } from '@/utils/constants';
import { calculateMeeplePosition, getRotation } from '@/utils/helpers';
import { trpc } from '@/utils/trpc';
import { MeeplePosition, Pos, TileEntity } from '@carcassonne/shared';
import { skipToken } from '@tanstack/react-query';
import { Dispatch, FC, SetStateAction, useCallback } from 'react';

// Calculate meeple positions based on entity type and orientation
const getMeeplePositions = (
  currentTile: TileEntity | null
): { entityId: string; position: MeeplePosition }[] => {
  if (!currentTile) return [];

  return currentTile.entities.map((entity) => ({
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

  // Add skipMeeplePlacement mutation
  const { mutateAsync: skipMeeplePlacement } =
    trpc.game.skipMeeplePlacement.useMutation();

  // Add meeple placement handler
  const handleMeeplePlacement = useCallback(
    async (entityId: string) => {
      if (!gameId || !lastPlacedTilePos) return;

      await placeMeeple(
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
    },
    [
      gameId,
      lastPlacedTilePos,
      placeMeeple,
      setLastPlacedTilePos,
      setShowMeeplePlacement,
      utils.game.getGameState,
    ]
  );

  // Update skip meeple placement handler
  const handleSkipMeeple = useCallback(async () => {
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
    setLastPlacedTilePos,
    setShowMeeplePlacement,
    utils.game.getGameState,
  ]);

  // const validPositions = gameStateQuery.data?.validMeeplePositions ?? [];
  // const lastPlacedTile =
  //   gameStateQuery.data?.placedTiles[
  //     gameStateQuery.data.placedTiles.length - 1
  //   ];
  const meeplePositions = getMeeplePositions(lastPlacedTile ?? null);
  console.log('overlay', meeplePositions);

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
            className="absolute w-6 h-6"
            style={{
              left: `${meeplePos.position.x}%`,
              top: `${meeplePos.position.y}%`,
              transform: `translate(-50%, -50%)`,
            }}
            onClick={() => {
              handleMeeplePlacement(meeplePos.entityId);
            }}
            data-testid={`meeple-${meeplePos.entityId}`}
          >
            ●
          </Button>
        ))}
      </div>

      {/* Skip button */}
      <Button
        className="absolute -bottom-8 left-1/2 -translate-x-1/2"
        onClick={handleSkipMeeple}
        variant="secondary"
        data-testid="skip-meeple"
      >
        Skip
      </Button>
    </div>
  );
};
