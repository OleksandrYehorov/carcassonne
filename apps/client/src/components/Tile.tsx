import { TILE_IMAGES } from '@/utils/tileImagesConfig';
import { trpc } from '@/utils/trpc';
import { PlacedTileEntity, Pos, TileEntity } from '@carcassonne/shared';
import { skipToken } from '@tanstack/react-query';
import { FC, memo } from 'react';
import { CELL_SIZE } from '../utils/constants';
import { calculateMeeplePosition, getRotation } from '../utils/helpers';

interface TileProps {
  gameId: string | undefined;
  tile: PlacedTileEntity | TileEntity;
  pos: Pos;
  'data-testid'?: string;
}

export const Tile: FC<TileProps> = memo(({ tile, pos, gameId, ...rest }) => {
  const gameStateQuery = trpc.game.getGameState.useQuery(gameId ?? skipToken);

  // Helper to get meeple position styles
  const getMeepleStyles = (entityId: string) => {
    const entity = tile.entities.find((e) => e.id === entityId);
    if (!entity) return null;

    const position = calculateMeeplePosition(entity);
    if (!position) return null;

    // Convert position percentages to pixel values
    const left = `${position.x}%`;
    const top = `${position.y}%`;

    // Return styles object for meeple positioning
    return {
      left,
      top,
    } as const;
  };

  return (
    <div
      {...rest}
      className="absolute flex items-center justify-center"
      style={{
        width: CELL_SIZE,
        height: CELL_SIZE,
        transform: `
            translate(${pos.x * CELL_SIZE}px, ${pos.y * CELL_SIZE}px)
            rotate(${getRotation(tile.orientation)}deg)
          `,
      }}
    >
      {/* Tile content */}
      <img
        src={TILE_IMAGES[tile.tileType]}
        alt={`Tile ${tile.id}`}
        className="absolute inset-0 w-full h-full object-cover"
        draggable={false}
      />

      {/* Add meeple visualization */}
      {tile.entities.map((entity, index) => {
        if (!entity.meeple) return null;
        return (
          <div
            key={`meeple-${index}`}
            style={{
              backgroundColor: gameStateQuery.data?.players.find(
                (p) => p.id === entity.meeple?.playerId
              )?.color,
              ...getMeepleStyles(entity.id),
            }}
            className="shadow-md w-5 h-5 absolute -translate-x-1/2 -translate-y-1/2 rounded-full z-10"
          />
        );
      })}
    </div>
  );
});
