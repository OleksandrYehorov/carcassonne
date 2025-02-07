import { Player } from '@carcassonne/shared';
import { FC } from 'react';

export const PlayerInfo: FC<{ player: Player; isCurrentPlayer: boolean }> = ({
  player,
  isCurrentPlayer,
}) => {
  return (
    <div
      className={`flex items-center gap-2 p-2 rounded-lg ${
        isCurrentPlayer ? 'bg-green-100 border-2 border-green-500' : ''
      }`}
      data-testid={
        isCurrentPlayer ? 'current-player' : `player-${player.color}`
      }
    >
      <div
        className="w-4 h-4 rounded-full"
        style={{ backgroundColor: player.color }}
      />
      <div className="flex flex-col">
        <span className="font-semibold">Player {player.color}</span>
        <span className="text-sm">
          Meeples: {player.remainingMeeples} | Score: {player.score}
        </span>
      </div>
    </div>
  );
};
