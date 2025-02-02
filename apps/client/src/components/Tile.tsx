import { PlacedTileEntity, Pos, TileEntity } from '@carcassonne/shared';
import { FC } from 'react';
import { CELL_SIZE } from '../utils/constants';
import { getEdgesFromEntities } from '../utils/helpers';
import { TILE_IMAGES } from '@/utils/tileImagesConfig';

interface TileProps {
  tile: PlacedTileEntity | TileEntity;
  pos: Pos;
  showLabels?: boolean;
  'data-testid'?: string;
}

export const Tile: FC<TileProps> = ({
  tile,
  pos,
  showLabels = true,
  ...rest
}) => {
  const edges = getEdgesFromEntities(tile.entities);

  const hasCenter = tile.entities.some(
    (entity) =>
      entity.type === 'monastery' ||
      (entity.type === 'road' &&
        (entity.from === 'deadEnd' || entity.to === 'deadEnd'))
  );

  // Helper to get rotation angle based on orientation
  const getRotation = () => {
    switch (tile.orientation) {
      case 'right':
        return 90;
      case 'bottom':
        return 180;
      case 'left':
        return 270;
      default:
        return 0;
    }
  };

  // Helper to get meeple position styles
  const getMeepleStyles = (
    position: 'top' | 'right' | 'bottom' | 'left' | 'center'
  ) => {
    const baseStyles = {
      position: 'absolute',
      width: '20px',
      height: '20px',
      borderRadius: '50%',
    } as const;

    const positionStyles = {
      top: { top: '5px', left: '50%', transform: 'translateX(-50%)' },
      right: { top: '50%', right: '5px', transform: 'translateY(-50%)' },
      bottom: { bottom: '5px', left: '50%', transform: 'translateX(-50%)' },
      left: { top: '50%', left: '5px', transform: 'translateY(-50%)' },
      center: { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' },
    }[position];

    return { ...baseStyles, ...positionStyles };
  };

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
        ) rotate(${getRotation()}deg)`,
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
              ...getMeepleStyles(entity.meeple.position),
              backgroundColor: entity.meeple.color,
            }}
            className="shadow-md"
          />
        );
      })}
    </div>
  );
};
