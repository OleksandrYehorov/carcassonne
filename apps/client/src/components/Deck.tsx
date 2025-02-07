import { Tile } from '@/components/Tile';
import { skipToken } from '@tanstack/react-query';
import { useCallback } from 'react';
import { trpc } from '../utils/trpc';
import { usePreloadTileImages } from '@/hooks/usePreloadTileImages';

interface DeckProps {
  gameId: string | undefined;
}

export const Deck: React.FC<DeckProps> = ({ gameId }) => {
  usePreloadTileImages();

  const utils = trpc.useUtils();

  const { mutate: rotateTile } = trpc.game.rotateTile.useMutation();

  const gameStateQuery = trpc.game.getGameState.useQuery(gameId ?? skipToken);

  // Handle tile rotation
  const handleRotateTile = useCallback(() => {
    if (!gameId) return;
    rotateTile(gameId, {
      onSuccess: () => {
        utils.game.getGameState.invalidate();
      },
    });
  }, [gameId, rotateTile, utils.game.getGameState]);

  return (
    <div
      className="w-24 h-screen bg-gray-100 flex flex-col gap-2 p-2"
      data-testid="deck"
    >
      <div
        className="text-center mb-2 font-semibold"
        data-testid="tile-counter"
      >
        Tiles left: {gameStateQuery.data?.deckSize ?? 0}
      </div>
      {gameStateQuery.data?.currentTile &&
        gameStateQuery.data?.turnState === 'placeTile' && (
          <div
            data-testid="current-tile"
            data-tile-id={gameStateQuery.data.currentTile.id}
            className="w-20 h-20 border-2 flex items-center justify-center relative cursor-pointer hover:bg-gray-50 border-green-500 bg-green-200"
            onClick={handleRotateTile}
          >
            <Tile
              gameId={gameId}
              tile={gameStateQuery.data.currentTile}
              pos={{ x: 0, y: 0 }}
              data-testid="deck-tile"
            />
          </div>
        )}
    </div>
  );
};
