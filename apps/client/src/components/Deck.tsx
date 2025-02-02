import { Button } from '@/components/ui/button/button';
import { trpc } from '../utils/trpc';
import { Tile } from '@/components/Tile';
import { skipToken } from '@tanstack/react-query';

interface DeckProps {
  gameId: string | undefined;
  showLabels: boolean;
  setShowLabels: (show: boolean) => void;
  handleRotateTile: () => void;
  handleRestart: () => void;
}

export const Deck: React.FC<DeckProps> = ({
  gameId,
  showLabels,
  setShowLabels,
  handleRotateTile,
  handleRestart,
}) => {
  const gameStateQuery = trpc.game.getGameState.useQuery(gameId ?? skipToken);

  return (
    <div
      className="w-24 bg-gray-100 flex flex-col gap-2 p-2"
      data-testid="deck"
    >
      <div className="text-center font-bold text-lg" data-testid="score">
        Score: {gameStateQuery.data?.score ?? 0}
      </div>
      <div
        className="text-center mb-2 font-semibold"
        data-testid="tile-counter"
      >
        Tiles left: {gameStateQuery.data?.deckSize ?? 0}
      </div>
      {gameStateQuery.data?.currentTile && (
        <div
          data-testid="current-tile"
          data-tile-id={gameStateQuery.data.currentTile.id}
          className="w-20 h-20 border-2 flex items-center justify-center relative cursor-pointer hover:bg-gray-50 border-green-500 bg-green-200"
          onClick={handleRotateTile}
        >
          <Tile
            tile={gameStateQuery.data.currentTile}
            pos={{ x: 0, y: 0 }}
            showLabels={showLabels}
            data-testid="deck-tile"
          />
          <Button
            data-testid="rotate-button"
            variant={'link'}
            onClick={(e) => {
              e.stopPropagation();
              handleRotateTile();
            }}
          >
            ⟳
          </Button>
        </div>
      )}
      <Button
        data-testid="toggle-labels-button"
        variant={'outline'}
        onClick={() => setShowLabels(!showLabels)}
      >
        {showLabels ? 'Hide' : 'Show'} Labels
      </Button>
      <Button
        data-testid="restart-button"
        variant={'destructive'}
        onClick={handleRestart}
      >
        Restart Game
      </Button>
    </div>
  );
};
