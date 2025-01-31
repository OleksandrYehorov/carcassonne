import { FC, useCallback, useRef, useState } from 'react';
import { CARCASSONNE_DECK, shuffleDeck, TileEntity } from './deck';
import { produce } from 'immer';
import { Tile } from './Tile';
import { getEdgesFromEntities } from './helpers';

export interface Position {
  x: number;
  y: number;
}

export type EdgeType = 'city' | 'road' | 'grass';
export type TileOrientation = 'top' | 'right' | 'bottom' | 'left';
export type CityEdge = 'top' | 'right' | 'bottom' | 'left';
export type RoadEdge = 'top' | 'right' | 'bottom' | 'left' | 'center';

export interface Edge {
  type: EdgeType;
}

export interface RoadEntity {
  type: 'road';
  from: RoadEdge;
  to: RoadEdge;
}

export interface CityEntity {
  type: 'city';
  edges: CityEdge[];
  isFortified: boolean;
}

interface GridTileEntity extends TileEntity {
  position: Position;
}

// Constants
export const CELL_SIZE = 80;
export const GRID_COLOR = '#ddd';
export const ZOOM_SPEED = 0.1;
export const MIN_ZOOM = 0.5;
export const MAX_ZOOM = 2;
export const GRID_CELLS = 50;

export const Field: FC = () => {
  const [offset, setOffset] = useState<Position>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<Position>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);

  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize deck without the start tile
  const [deck, setDeck] = useState<TileEntity[]>(() => {
    const shuffledDeck = shuffleDeck(CARCASSONNE_DECK.slice(1)); // Skip the start tile
    return shuffledDeck;
  });

  // Initialize placed tiles with the start tile at the center
  const [placedTiles, setPlacedTiles] = useState<GridTileEntity[]>(() => {
    const centerX = Math.floor(window.innerWidth / (2 * CELL_SIZE));
    const centerY = Math.floor(window.innerHeight / (2 * CELL_SIZE));

    return [
      {
        ...CARCASSONNE_DECK[0],
        position: { x: centerX, y: centerY },
      },
    ];
  });

  // Add rotation count state
  const [currentRotations, setCurrentRotations] = useState(0);

  const getNextOrientation = (
    orientation: TileOrientation
  ): TileOrientation => {
    return orientation === 'top'
      ? 'right'
      : orientation === 'right'
      ? 'bottom'
      : orientation === 'bottom'
      ? 'left'
      : 'top';
  };

  // Update rotateTile to track rotations
  const rotateTile = useCallback(() => {
    setDeck(
      produce((draft) => {
        if (draft[0]) {
          draft[0].orientation = getNextOrientation(draft[0].orientation);
        }
      })
    );
    setCurrentRotations((prev) => prev + 1);
  }, []);

  // Add function to shuffle current tile back into deck
  const shuffleCurrentTile = useCallback(() => {
    setDeck(
      produce((draft) => {
        if (draft.length > 0) {
          const [currentTile] = draft.splice(0, 1);
          currentTile.orientation = 'top'; // Reset orientation
          const insertIndex = Math.floor(Math.random() * draft.length);
          draft.splice(insertIndex, 0, currentTile);
        }
      })
    );
    setCurrentRotations(0); // Reset rotation count
  }, []);

  const getRotatedEdges = useCallback(
    (
      tile: TileEntity,
      orientation: TileOrientation
    ): [Edge, Edge, Edge, Edge] => {
      // Get the base edges first
      const baseEdges = getEdgesFromEntities(tile.entities);

      // If orientation is top, return the base edges
      if (orientation === 'top') return baseEdges;

      // For other orientations, rotate the edges array
      const rotations = {
        right: 1,
        bottom: 2,
        left: 3,
      };

      const rotationCount = rotations[orientation];
      const rotatedEdges = [...baseEdges];

      // Rotate the array by shifting elements
      for (let i = 0; i < rotationCount; i++) {
        rotatedEdges.unshift(rotatedEdges.pop()!);
      }

      return rotatedEdges as [Edge, Edge, Edge, Edge];
    },
    []
  );

  const isValidPlacement = useCallback(
    (tile1: GridTileEntity, pos: Position, tile2: TileEntity): boolean => {
      const dx = pos.x - tile1.position.x;
      const dy = pos.y - tile1.position.y;

      if (Math.abs(dx) + Math.abs(dy) !== 1) return false;

      // Get edges for both tiles, considering their orientations
      const tile2Edges = getRotatedEdges(tile2, tile2.orientation);
      const tile1Edges = getRotatedEdges(tile1, tile1.orientation);

      let edge1Index: number;
      let edge2Index: number;

      if (dx === 1) {
        // tile2 is to the right of tile1
        edge1Index = 1; // right edge of tile1
        edge2Index = 3; // left edge of tile2
      } else if (dx === -1) {
        // tile2 is to the left of tile1
        edge1Index = 3; // left edge of tile1
        edge2Index = 1; // right edge of tile2
      } else if (dy === 1) {
        // tile2 is below tile1
        edge1Index = 2; // bottom edge of tile1
        edge2Index = 0; // top edge of tile2
      } else {
        // tile2 is above tile1
        edge1Index = 0; // top edge of tile1
        edge2Index = 2; // bottom edge of tile2
      }

      return tile1Edges[edge1Index].type === tile2Edges[edge2Index].type;
    },
    [getRotatedEdges]
  );

  // Update getValidPositions to handle rotation limits
  const getValidPositions = useCallback(() => {
    if (deck.length === 0) return [];

    const validPositions: Position[] = [];

    // If no tiles have been placed yet, calculate center position
    if (placedTiles.length === 0) {
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        const centerX = Math.floor(
          (-offset.x + rect.width / 2) / (CELL_SIZE * zoom)
        );
        const centerY = Math.floor(
          (-offset.y + rect.height / 2) / (CELL_SIZE * zoom)
        );
        validPositions.push({ x: centerX, y: centerY });
        return validPositions;
      }
    }

    placedTiles.forEach((tile) => {
      const adjacentPositions = [
        { x: tile.position.x + 1, y: tile.position.y },
        { x: tile.position.x - 1, y: tile.position.y },
        { x: tile.position.x, y: tile.position.y + 1 },
        { x: tile.position.x, y: tile.position.y - 1 },
      ];

      adjacentPositions.forEach((pos) => {
        // Check if the position is already occupied
        const isOccupied = placedTiles.some(
          (t) => t.position.x === pos.x && t.position.y === pos.y
        );
        if (isOccupied) return;

        // Check if this position is already considered valid
        if (validPositions.some((p) => p.x === pos.x && p.y === pos.y)) return;

        // Get all adjacent tiles to this position
        const adjacentTiles = placedTiles.filter((t) => {
          const dx = pos.x - t.position.x;
          const dy = pos.y - t.position.y;
          return (
            (Math.abs(dx) === 1 && dy === 0) || (Math.abs(dy) === 1 && dx === 0)
          );
        });

        // Check if the selected tile matches all adjacent tiles
        const canPlace = adjacentTiles.every((adjTile) =>
          isValidPlacement(adjTile, pos, deck[0])
        );

        if (canPlace) {
          validPositions.push(pos);
        }
      });
    });

    // If no valid positions found, rotate the tile or shuffle it back
    if (validPositions.length === 0 && deck[0]) {
      if (currentRotations < 3) {
        console.log('rotating tile', currentRotations);
        rotateTile();
      } else {
        console.log('shuffling tile', currentRotations);
        shuffleCurrentTile();
      }
    }

    return validPositions;
  }, [
    deck,
    isValidPlacement,
    placedTiles,
    offset.x,
    offset.y,
    zoom,
    rotateTile,
    currentRotations,
    shuffleCurrentTile,
  ]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) return; // Only left click

      // Don't start dragging if clicking on a valid placement position
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect && deck[0]) {
        const mouseX = (e.clientX - rect.left - offset.x) / zoom;
        const mouseY = (e.clientY - rect.top - offset.y) / zoom;
        const gridX = Math.floor(mouseX / CELL_SIZE);
        const gridY = Math.floor(mouseY / CELL_SIZE);

        const isValidPos = getValidPositions().some(
          (pos) => pos.x === gridX && pos.y === gridY
        );
        if (isValidPos) return;
      }

      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
    },
    [deck, getValidPositions, offset.x, offset.y, zoom]
  );

  // Clamp offset to prevent seeing placed tiles and add buffer zone
  const clampOffset = useCallback(
    (newOffset: Position): Position => {
      // Calculate the visible area dimensions
      const getVisibleArea = () => {
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return { width: 0, height: 0 };
        return {
          width: rect.width,
          height: rect.height,
        };
      };

      const { width, height } = getVisibleArea();

      // Find the bounds of placed tiles
      if (placedTiles.length === 0) {
        // Allow free movement if no tiles are placed
        return {
          x: Math.max(Math.min(newOffset.x, width / 2), -width / 2),
          y: Math.max(Math.min(newOffset.y, height / 2), -height / 2),
        };
      }

      const bounds = placedTiles.reduce(
        (acc, tile) => ({
          minX: Math.min(acc.minX, tile.position.x),
          maxX: Math.max(acc.maxX, tile.position.x),
          minY: Math.min(acc.minY, tile.position.y),
          maxY: Math.max(acc.maxY, tile.position.y),
        }),
        {
          minX: 0,
          maxX: 0,
          minY: 0,
          maxY: 0,
        }
      );

      // Add a larger buffer zone (3 tiles)
      const bufferTiles = 3;
      bounds.minX -= bufferTiles;
      bounds.maxX += bufferTiles;
      bounds.minY -= bufferTiles;
      bounds.maxY += bufferTiles;

      // Ensure a portion of the viewport shows placed tiles
      const viewportBuffer = 0.25;
      const minX = -bounds.maxX * CELL_SIZE * zoom + width * viewportBuffer;
      const maxX =
        width * (1 - viewportBuffer) - bounds.minX * CELL_SIZE * zoom;
      const minY = -bounds.maxY * CELL_SIZE * zoom + height * viewportBuffer;
      const maxY =
        height * (1 - viewportBuffer) - bounds.minY * CELL_SIZE * zoom;

      return {
        x: Math.max(Math.min(newOffset.x, maxX), minX),
        y: Math.max(Math.min(newOffset.y, maxY), minY),
      };
    },
    [placedTiles, zoom]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging) return;

      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;

      setOffset(
        produce((prev) => {
          const newOffset = { x: prev.x + dx, y: prev.y + dy };
          const clamped = clampOffset(newOffset);
          prev.x = clamped.x;
          prev.y = clamped.y;
        })
      );
      setDragStart({ x: e.clientX, y: e.clientY });
    },
    [isDragging, dragStart, clampOffset]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();

      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      // Get mouse position relative to container
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      // Calculate position relative to content before zoom
      const contentX = (mouseX - offset.x) / zoom;
      const contentY = (mouseY - offset.y) / zoom;

      // Calculate new zoom
      const delta = Math.sign(e.deltaY) * ZOOM_SPEED;
      const newZoom = Math.min(Math.max(zoom - delta, MIN_ZOOM), MAX_ZOOM);

      // Calculate new offset to keep the point under cursor in the same place
      const newOffset = {
        x: mouseX - contentX * newZoom,
        y: mouseY - contentY * newZoom,
      };

      // Update zoom and offset
      setZoom(newZoom);
      setOffset(clampOffset(newOffset));
    },
    [zoom, offset.x, offset.y, clampOffset]
  );

  const handleDeckClick = useCallback(
    (tile: TileEntity) => {
      if (tile === deck[0]) {
        rotateTile();
      }
    },
    [deck, rotateTile]
  );

  const handleGridClick = useCallback(
    (e: React.MouseEvent) => {
      // Remove the drag detection check since it's preventing valid clicks
      if (deck.length === 0 || isDragging) return;

      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const mouseX = (e.clientX - rect.left - offset.x) / zoom;
      const mouseY = (e.clientY - rect.top - offset.y) / zoom;

      const gridX = Math.floor(mouseX / CELL_SIZE);
      const gridY = Math.floor(mouseY / CELL_SIZE);

      // Check if this is a valid position
      const isValidPosition = getValidPositions().some(
        (pos) => pos.x === gridX && pos.y === gridY
      );

      if (!isValidPosition) return;

      const isOccupied = placedTiles.some(
        (tile) => tile.position.x === gridX && tile.position.y === gridY
      );

      if (isOccupied) return;

      // If we have no tiles placed yet, or if the position is adjacent to existing tiles
      if (
        placedTiles.length === 0 ||
        getValidPositions().some((pos) => pos.x === gridX && pos.y === gridY)
      ) {
        setPlacedTiles(
          produce((draft) => {
            draft.push({
              ...deck[0],
              position: { x: gridX, y: gridY },
            });
          })
        );
        setDeck(
          produce((draft) => {
            draft.shift();
          })
        );
      }
    },
    [deck, isDragging, offset.x, offset.y, placedTiles, zoom, getValidPositions]
  );

  // Update handleRestart to reset rotation count
  const handleRestart = useCallback(() => {
    setCurrentRotations(0);
    setDeck(shuffleDeck(CARCASSONNE_DECK.slice(1)));

    // Reset placed tiles to just the start tile
    const centerX = Math.floor(window.innerWidth / (2 * CELL_SIZE));
    const centerY = Math.floor(window.innerHeight / (2 * CELL_SIZE));

    setPlacedTiles([
      {
        ...CARCASSONNE_DECK[0],
        position: { x: centerX, y: centerY },
      },
    ]);

    // Center the view on the start tile
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      setOffset({
        x: rect.width / 2 - centerX * CELL_SIZE * zoom,
        y: rect.height / 2 - centerY * CELL_SIZE * zoom,
      });
    }
  }, [zoom]);

  const generateGridBackground = () => {
    const totalSize = CELL_SIZE * GRID_CELLS * 2;
    return {
      width: totalSize,
      height: totalSize,
      left: -totalSize / 2,
      top: -totalSize / 2,
    };
  };

  // Function to generate grid cell styles
  const generateCellStyle = (pos: Position) => {
    const borderStyles = {
      borderTop: '1px solid ' + GRID_COLOR,
      borderRight: '1px solid ' + GRID_COLOR,
      borderBottom: '1px solid ' + GRID_COLOR,
      borderLeft: '1px solid ' + GRID_COLOR,
    };

    return {
      position: 'absolute',
      width: CELL_SIZE,
      height: CELL_SIZE,
      transform: `translate(
        ${pos.x * CELL_SIZE}px,
        ${pos.y * CELL_SIZE}px
      )`,
      ...borderStyles,
    } as const;
  };

  // Update the renderTile function

  return (
    <div className="flex h-screen w-screen">
      <div
        ref={containerRef}
        className="flex-1 relative overflow-hidden cursor-move"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onClick={handleGridClick}
      >
        <div
          className="absolute origin-top-left"
          style={{
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
          }}
        >
          <div className="absolute" style={generateGridBackground()}>
            {/* Grid cells for placed tiles */}
            {placedTiles.map((tile) => (
              <div
                key={`grid-${tile.position.x}-${tile.position.y}`}
                style={generateCellStyle(tile.position)}
              />
            ))}

            {/* Grid cells for valid positions */}
            {deck[0] &&
              getValidPositions().map((pos) => (
                <div
                  key={`valid-${pos.x}-${pos.y}`}
                  style={generateCellStyle(pos)}
                />
              ))}
          </div>

          {/* Valid placement indicators */}
          {deck[0] &&
            getValidPositions().map((pos) => (
              <div
                key={`${pos.x},${pos.y}`}
                data-testid="valid-position"
                className="absolute flex items-center justify-center border-2 border-green-500 bg-green-200 opacity-50 z-10"
                style={{
                  width: CELL_SIZE,
                  height: CELL_SIZE,
                  transform: `translate(
                    ${pos.x * CELL_SIZE}px,
                    ${pos.y * CELL_SIZE}px
                  )`,
                }}
              />
            ))}

          {/* Placed Tiles */}
          {placedTiles.map((tile) => (
            <Tile
              key={tile.id}
              tile={tile}
              pos={tile.position}
              data-testid="tile"
            />
          ))}
        </div>
      </div>
      <div
        className="w-24 bg-gray-100 flex flex-col gap-2 p-2"
        data-testid="deck"
      >
        <div
          className="text-center mb-2 font-semibold"
          data-testid="tile-counter"
        >
          Tiles left: {deck.length}
        </div>
        {deck.length > 0 && (
          <div
            data-testid="current-tile"
            data-tile-id={deck[0]?.id}
            className="w-20 h-20 border-2 flex items-center justify-center relative cursor-pointer hover:bg-gray-50 border-green-500 bg-green-200"
            onClick={() => handleDeckClick(deck[0])}
          >
            <Tile tile={deck[0]} pos={{ x: 0, y: 0 }} data-testid="deck-tile" />
            <button
              data-testid="rotate-button"
              className="absolute top-0 right-0 bg-blue-500 text-white p-1 rounded-bl text-xs"
              onClick={(e) => {
                e.stopPropagation();
                rotateTile();
              }}
            >
              ⟳
            </button>
          </div>
        )}
        <button
          data-testid="restart-button"
          className="mt-2 bg-red-500 text-white p-2 rounded text-sm hover:bg-red-600"
          onClick={handleRestart}
        >
          Restart Game
        </button>
      </div>
    </div>
  );
};
