import { FC } from 'react';
import { Pos, TileEntity } from '@carcassonne/shared';
import { getEdgesFromEntities } from '../utils/helpers';
import { TILE_IMAGES } from '../utils/tileImagesConfig';
import { CELL_SIZE } from '../utils/constants';

interface TileProps {
  tile: TileEntity;
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
      entity.type === 'road' &&
      (entity.from === 'deadEnd' || entity.to === 'deadEnd')
  );

  // Calculate rotation angle based on orientation
  const rotationDegrees = {
    top: 0,
    right: 90,
    bottom: 180,
    left: 270,
  }[tile.orientation];

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
        ) rotate(${rotationDegrees}deg)`,
      }}
    >
      {/* Tile content */}
      <img
        src={TILE_IMAGES[tile.tileType]}
        alt="Tile"
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
          •
        </div>
      )}
    </div>
  );
};
