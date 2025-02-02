import {
  Edge,
  Orientation,
  PlacedTile,
  Pos,
  TileEntity,
} from '@carcassonne/shared';
import { skipToken } from '@tanstack/react-query';
import { produce } from 'immer';
import { FC, useCallback, useEffect, useRef, useState } from 'react';
import { Tile } from './Tile';
import { getEdgesFromEntities } from './helpers';
import { trpc } from './utils/trpc';
import {
  CELL_SIZE,
  GRID_CELLS,
  GRID_COLOR,
  MAX_ZOOM,
  MIN_ZOOM,
  ZOOM_SPEED,
} from './constants';

export const Field: FC = () => {
  const utils = trpc.useUtils();
  const createGameMutation = trpc.game.createGame.useMutation();
  const gameId = createGameMutation.data?.gameId;

  // Get game state query
  const gameStateQuery = trpc.game.getGameState.useQuery(gameId ?? skipToken);

  // Mutations for game actions
  const rotateTileMutation = trpc.game.rotateTile.useMutation();
  const placeTileMutation = trpc.game.placeTile.useMutation();
  const shuffleTileMutation = trpc.game.shuffleCurrentTile.useMutation();

  // Create game on component mount
  useEffect(() => {
    createGameMutation.mutate();
  }, []);

  const [offset, setOffset] = useState<Pos>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<Pos>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [showLabels, setShowLabels] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // Add a useEffect to center the board on initial load
  useEffect(() => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      setOffset({
        x: rect.width / 2,
        y: rect.height / 2,
      });
    }
  }, []);

  // Handle tile rotation
  const handleRotateTile = useCallback(() => {
    if (!gameId) return;
    rotateTileMutation.mutate(gameId, {
      onSuccess: () => {
        utils.game.getGameState.invalidate();
      },
    });
  }, [gameId]);

  // Handle tile placement
  const handlePlaceTile = useCallback(
    (position: Pos) => {
      if (!gameId) return;
      placeTileMutation.mutate(
        { gameId, position },
        {
          onSuccess: () => {
            utils.game.getGameState.invalidate();
          },
        }
      );
    },
    [gameId]
  );

  // Handle shuffling current tile
  const handleShuffleTile = useCallback(() => {
    if (!gameId) return;
    shuffleTileMutation.mutate(gameId, {
      onSuccess: () => {
        utils.game.getGameState.invalidate();
      },
    });
  }, [gameId]);

  const getRotatedEdges = useCallback(
    (tile: TileEntity, orientation: Orientation): [Edge, Edge, Edge, Edge] => {
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
    (tile1: PlacedTile, pos: Pos, tile2: TileEntity): boolean => {
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

  // Modify getValidPositions to use absolute coordinates for the first tile
  const getValidPositions = useCallback(() => {
    const currentTile = gameStateQuery.data?.currentTile;
    if (!currentTile) return [];

    const validPositions: Pos[] = [];

    // If no tiles have been placed yet, return (0,0) as the only valid position
    if (gameStateQuery.data?.placedTiles.length === 0) {
      validPositions.push({ x: 0, y: 0 });
      return validPositions;
    }

    gameStateQuery.data?.placedTiles.forEach((tile) => {
      const adjacentPositions = [
        { x: tile.position.x + 1, y: tile.position.y },
        { x: tile.position.x - 1, y: tile.position.y },
        { x: tile.position.x, y: tile.position.y + 1 },
        { x: tile.position.x, y: tile.position.y - 1 },
      ];

      adjacentPositions.forEach((pos) => {
        // Check if the position is already occupied
        const isOccupied = gameStateQuery.data?.placedTiles.some(
          (t) => t.position.x === pos.x && t.position.y === pos.y
        );
        if (isOccupied) return;

        // Check if this position is already considered valid
        if (validPositions.some((p) => p.x === pos.x && p.y === pos.y)) return;

        // Get all adjacent tiles to this position
        const adjacentTiles = gameStateQuery.data?.placedTiles.filter((t) => {
          const dx = pos.x - t.position.x;
          const dy = pos.y - t.position.y;
          return (
            (Math.abs(dx) === 1 && dy === 0) || (Math.abs(dy) === 1 && dx === 0)
          );
        });

        // Check if the selected tile matches all adjacent tiles
        const canPlace = adjacentTiles.every((adjTile) =>
          isValidPlacement(adjTile, pos, currentTile)
        );

        if (canPlace) {
          validPositions.push(pos);
        }
      });
    });

    return validPositions;
  }, [gameStateQuery.data, isValidPlacement]);

  // Add a separate effect to handle auto-rotation/shuffle
  useEffect(() => {
    const currentTile = gameStateQuery.data?.currentTile;
    if (!currentTile) return;

    const validPositions = getValidPositions();
    if (validPositions.length === 0) {
      if ((gameStateQuery.data?.currentRotations ?? 0) < 3) {
        handleRotateTile();
      } else {
        handleShuffleTile();
      }
    }
  }, [
    gameStateQuery.data,
    getValidPositions,
    handleRotateTile,
    handleShuffleTile,
  ]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) return; // Only left click

      // Don't start dragging if clicking on a valid placement position
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect && gameStateQuery.data?.currentTile) {
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
    [gameStateQuery.data, getValidPositions, offset.x, offset.y, zoom]
  );

  // Clamp offset to prevent seeing placed tiles and add buffer zone
  const clampOffset = useCallback(
    (newOffset: Pos): Pos => {
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
      if (gameStateQuery.data?.placedTiles.length === 0) {
        // Allow free movement if no tiles are placed
        return {
          x: Math.max(Math.min(newOffset.x, width / 2), -width / 2),
          y: Math.max(Math.min(newOffset.y, height / 2), -height / 2),
        };
      }

      const bounds = (gameStateQuery.data?.placedTiles ?? []).reduce(
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
    [gameStateQuery.data, zoom]
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

      // Calculate new zoom using the actual deltaY value for smoother zoom
      const zoomFactor = 1 - e.deltaY * ZOOM_SPEED;
      const newZoom = Math.min(Math.max(zoom * zoomFactor, MIN_ZOOM), MAX_ZOOM);

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

  const handleGridClick = useCallback(
    (e: React.MouseEvent) => {
      if (!gameStateQuery.data?.currentTile || isDragging) return;

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

      handlePlaceTile({ x: gridX, y: gridY });
    },
    [gameStateQuery.data, isDragging, offset.x, offset.y, zoom, handlePlaceTile]
  );

  // Handle restart game
  const handleRestart = useCallback(() => {
    createGameMutation.mutate();
  }, []);

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
  const generateCellStyle = (pos: Pos) => {
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
            {gameStateQuery.data?.placedTiles.map((tile) => (
              <div
                key={`grid-${tile.position.x}-${tile.position.y}`}
                style={generateCellStyle(tile.position)}
              />
            ))}

            {/* Grid cells for valid positions */}
            {gameStateQuery.data?.currentTile &&
              getValidPositions().map((pos) => (
                <div
                  key={`valid-${pos.x}-${pos.y}`}
                  style={generateCellStyle(pos)}
                />
              ))}
          </div>

          {/* Valid placement indicators */}
          {gameStateQuery.data?.currentTile &&
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
          {gameStateQuery.data?.placedTiles.map((tile) => (
            <Tile
              key={tile.id}
              tile={tile}
              pos={tile.position}
              showLabels={showLabels}
              data-testid="tile"
            />
          ))}
        </div>
      </div>
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
            <button
              data-testid="rotate-button"
              className="absolute top-0 right-0 bg-blue-500 text-white p-1 rounded-bl text-xs"
              onClick={(e) => {
                e.stopPropagation();
                handleRotateTile();
              }}
            >
              ⟳
            </button>
          </div>
        )}
        <button
          data-testid="toggle-labels-button"
          className="mt-2 bg-blue-500 text-white p-2 rounded text-sm hover:bg-blue-600"
          onClick={() => setShowLabels(!showLabels)}
        >
          {showLabels ? 'Hide' : 'Show'} Labels
        </button>
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
