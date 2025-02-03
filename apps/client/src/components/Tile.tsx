import { TILE_IMAGES } from '@/utils/tileImagesConfig';
import { trpc } from '@/utils/trpc';
import { PlacedTileEntity, Pos, TileEntity } from '@carcassonne/shared';
import { skipToken } from '@tanstack/react-query';
import { FC, memo } from 'react';
import { CELL_SIZE } from '../utils/constants';
import {
  calculateMeeplePosition,
  getEdgesFromEntities,
  getRotation,
} from '../utils/helpers';

interface TileProps {
  gameId: string | undefined;
  tile: PlacedTileEntity | TileEntity;
  pos: Pos;
  showLabels?: boolean;
  'data-testid'?: string;
}

export const Tile: FC<TileProps> = memo(
  ({ tile, pos, showLabels = true, gameId, ...rest }) => {
    const edges = getEdgesFromEntities(tile.entities);

    const gameStateQuery = trpc.game.getGameState.useQuery(gameId ?? skipToken);

    const hasCenter = tile.entities.some(
      (entity) =>
        entity.type === 'monastery' ||
        (entity.type === 'road' &&
          (entity.from === 'deadEnd' || entity.to === 'deadEnd'))
    );

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

    console.log(
      'meeple',
      tile.entities.filter((e) => e.meeple)
    );

    return (
      <div
        {...rest}
        className="absolute flex items-center justify-center"
        style={{
          width: CELL_SIZE,
          height: CELL_SIZE,
          transform: `translate(
          ${pos.x * CELL_SIZE}px,
          ${pos.y * CELL_SIZE}px
        ) rotate(${getRotation(tile.orientation)}deg)`,
        }}
      >
        {/* Tile content */}
        <img
          src={TILE_IMAGES[tile.tileType]}
          alt={`Tile ${tile.id}`}
          className="absolute inset-0 w-full h-full object-cover"
          draggable={false}
        />

        {/* Labels */}
        {showLabels &&
          edges.map((edge, index) => {
            let positionStyle: React.CSSProperties = {};
            switch (index) {
              case 0: // Top
                positionStyle = {
                  top: '4px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                };
                break;
              case 1: // Right
                positionStyle = {
                  top: '50%',
                  right: '4px',
                  transform: 'translateY(-50%) rotate(90deg)',
                };
                break;
              case 2: // Bottom
                positionStyle = {
                  bottom: '4px',
                  left: '50%',
                  transform: 'translateX(-50%) rotate(180deg)',
                };
                break;
              case 3: // Left
                positionStyle = {
                  top: '50%',
                  left: '4px',
                  transform: 'translateY(-50%) rotate(270deg)',
                };
                break;
            }

            const textColorClass =
              edge.type === 'city'
                ? 'text-orange-500'
                : edge.type === 'road'
                ? 'text-gray-200'
                : 'text-white';

            return (
              <div
                key={index}
                className={`absolute text-xs font-bold ${textColorClass} bg-black/50 px-1 rounded`}
                style={positionStyle}
              >
                {edge.type === 'city' ? 'C' : edge.type === 'road' ? 'R' : ''}
              </div>
            );
          })}

        {/* Center Label */}
        {showLabels && hasCenter && (
          <div
            className="absolute text-xs font-bold text-gray-100 bg-black/50 px-1 rounded"
            style={{
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
            }}
          >
            {tile.entities.some((e) => e.type === 'monastery') ? 'M' : '•'}
          </div>
        )}

        {/* Add meeple visualization */}
        {tile.entities.map((entity, index) => {
          if (!entity.meeple) return null;
          return (
            <div
              key={`meeple-${index}`}
              style={{
                position: 'absolute',
                transform: 'translate(-50%, -50%)',
                width: '20px', // Size for meeple
                height: '20px',
                borderRadius: '50%',
                zIndex: 10,
                backgroundColor: gameStateQuery.data?.players.find(
                  (p) => p.id === entity.meeple?.playerId
                )?.color,
                ...getMeepleStyles(entity.id),
              }}
              className="shadow-md"
            />
          );
        })}
      </div>
    );
  }
);
