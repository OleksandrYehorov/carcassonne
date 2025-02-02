import { Dispatch, FC, SetStateAction, useCallback } from 'react';
import { Button } from '@/components/ui/button/button';
import { CELL_SIZE } from '@/utils/constants';
import { trpc } from '@/utils/trpc';
import { Pos } from '@carcassonne/shared';
import { skipToken } from '@tanstack/react-query';

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

  // Mutations for game actions
  const { mutateAsync: placeMeeple } = trpc.game.placeMeeple.useMutation();

  // Add skipMeeplePlacement mutation
  const { mutateAsync: skipMeeplePlacement } =
    trpc.game.skipMeeplePlacement.useMutation();

  // Add meeple placement handler
  const handleMeeplePlacement = useCallback(
    async (position: 'top' | 'right' | 'bottom' | 'left' | 'center') => {
      console.log(1);
      if (!gameId || !lastPlacedTilePos) return;
      console.log(2);

      await placeMeeple(
        {
          gameId,
          position,
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

  const validPositions = gameStateQuery.data?.validMeeplePositions ?? [];

  return (
    <div
      className="absolute"
      style={{
        transform: `translate(${pos.x * CELL_SIZE}px, ${pos.y * CELL_SIZE}px)`,
        width: CELL_SIZE,
        height: CELL_SIZE,
      }}
    >
      {/* Top */}
      <Button
        className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-6"
        onClick={() => {
          console.log('place top meeple');
          handleMeeplePlacement('top');
        }}
        disabled={!validPositions.includes('top')}
        data-testid="meeple-top"
      >
        ▲
      </Button>

      {/* Right */}
      <Button
        className="absolute top-1/2 right-0 -translate-y-1/2 w-6 h-6"
        onClick={() => {
          console.log('place right meeple');
          handleMeeplePlacement('right');
        }}
        disabled={!validPositions.includes('right')}
        data-testid="meeple-right"
      >
        ▶
      </Button>

      {/* Bottom */}
      <Button
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-6"
        onClick={() => {
          console.log('place bottom meeple');
          handleMeeplePlacement('bottom');
        }}
        disabled={!validPositions.includes('bottom')}
        data-testid="meeple-bottom"
      >
        ▼
      </Button>

      {/* Left */}
      <Button
        className="absolute top-1/2 left-0 -translate-y-1/2 w-6 h-6"
        onClick={() => {
          console.log('place left meeple');
          handleMeeplePlacement('left');
        }}
        disabled={!validPositions.includes('left')}
        data-testid="meeple-left"
      >
        ◀
      </Button>

      {/* Center */}
      <Button
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6"
        onClick={() => {
          console.log('place center meeple');
          handleMeeplePlacement('center');
        }}
        disabled={!validPositions.includes('center')}
        data-testid="meeple-center"
      >
        ●
      </Button>

      {/* Skip button */}
      <Button
        className="absolute -bottom-8 left-1/2 -translate-x-1/2"
        onClick={() => {
          console.log('skip meeple');
          handleSkipMeeple();
        }}
        variant="secondary"
        data-testid="skip-meeple"
      >
        Skip
      </Button>
    </div>
  );
};
