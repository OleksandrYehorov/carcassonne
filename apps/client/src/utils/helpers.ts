import {
  CityEntity,
  Edge,
  RoadEntity,
  MonasteryEntity,
  TileEntity,
  Orientation,
  GameEntity,
  MeeplePosition,
  CityEdge,
} from '@carcassonne/shared';
import { produce } from 'immer';

export const getEdgesFromEntities = (
  entities: (RoadEntity | CityEntity | MonasteryEntity)[]
): [Edge, Edge, Edge, Edge] => {
  // Initialize all edges as grass

  const edges: Edge[] = [
    { type: 'grass' },
    { type: 'grass' },
    { type: 'grass' },
    { type: 'grass' },
  ];

  // Map edge names to indices
  const edgeToIndex = {
    top: 0,
    right: 1,
    bottom: 2,
    left: 3,
  };

  entities.forEach((entity) => {
    if (entity.type === 'city') {
      // For cities, mark each edge in the edges array
      entity.edges.forEach((edge) => {
        edges[edgeToIndex[edge]] = { type: 'city' };
      });
    } else if (entity.type === 'road') {
      // For roads, mark both the 'from' and 'to' edges if they're not center
      if (entity.from !== 'deadEnd') {
        edges[edgeToIndex[entity.from]] = { type: 'road' };
      }
      if (entity.to !== 'deadEnd') {
        edges[edgeToIndex[entity.to]] = { type: 'road' };
      }
    }
    // Monasteries don't affect edges
  });

  return edges as [Edge, Edge, Edge, Edge];
};

export const getRotatedEdges = (
  tile: TileEntity,
  orientation: Orientation
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
  const rotatedEdges = produce(baseEdges, (draft) => {
    for (let i = 0; i < rotationCount; i++) {
      const last = draft[draft.length - 1]!;
      draft.unshift(last);
      draft.pop();
    }
  });

  return rotatedEdges;
};

export const rotatePosition = (
  pos: { x: number; y: number },
  orientation: Orientation
): { x: number; y: number } => {
  switch (orientation) {
    case 'top':
      return pos;
    case 'right':
      return { x: 100 - pos.y, y: pos.x };
    case 'bottom':
      return { x: 100 - pos.x, y: 100 - pos.y };
    case 'left':
      return { x: pos.y, y: 100 - pos.x };
  }
};

export const calculateRoadPosition = (entity: RoadEntity): MeeplePosition => {
  let pos: { x: number; y: number };

  const { from, to } = entity;

  // For straight roads
  if (
    (from === 'top' && to === 'bottom') ||
    (from === 'bottom' && to === 'top') ||
    (from === 'left' && to === 'right') ||
    (from === 'right' && to === 'left')
  ) {
    pos = { x: 50, y: 50 };
  }
  // For roads with deadEnd
  else if (from === 'deadEnd' || to === 'deadEnd') {
    const edge = from === 'deadEnd' ? to : from;
    switch (edge) {
      case 'top':
        pos = { x: 50, y: 20 };
        break;
      case 'right':
        pos = { x: 80, y: 50 };
        break;
      case 'bottom':
        pos = { x: 50, y: 80 };
        break;
      case 'left':
        pos = { x: 20, y: 50 };
        break;
      default:
        pos = { x: 50, y: 50 };
        break;
    }
  }
  // For curved roads
  else {
    const positions: Record<string, { x: number; y: number }> = {
      'left-bottom': { x: 40, y: 60 },
      'bottom-left': { x: 40, y: 60 },
      'left-top': { x: 40, y: 40 },
      'top-left': { x: 40, y: 40 },
      'right-bottom': { x: 60, y: 60 },
      'bottom-right': { x: 60, y: 60 },
      'right-top': { x: 60, y: 40 },
      'top-right': { x: 60, y: 40 },
    };

    const key = `${from}-${to}`;
    pos = positions[key] || { x: 50, y: 50 };
  }

  return pos;
};

export const calculateCityPosition = (entity: CityEntity): MeeplePosition => {
  const edges = entity.edges;
  if (edges.length === 1) {
    // Single edge city - position closer to the edge
    const positions: Record<CityEdge, MeeplePosition> = {
      top: { x: 50, y: 25 },
      right: { x: 75, y: 50 },
      bottom: { x: 50, y: 75 },
      left: { x: 25, y: 50 },
    };
    return positions[edges[0]!];
  }

  if (edges.length === 2) {
    // Determine if it's a corner city (adjacent edges) or a long city (opposite edges)
    const edgeSet = new Set(edges);
    const isCornerCity =
      (edgeSet.has('top') && edgeSet.has('right')) ||
      (edgeSet.has('right') && edgeSet.has('bottom')) ||
      (edgeSet.has('bottom') && edgeSet.has('left')) ||
      (edgeSet.has('left') && edgeSet.has('top'));

    const isLongCity =
      (edgeSet.has('top') && edgeSet.has('bottom')) ||
      (edgeSet.has('left') && edgeSet.has('right'));

    if (isCornerCity) {
      // For corner cities, position diagonally between the edges
      const x = edgeSet.has('right') ? 65 : edgeSet.has('left') ? 35 : 50;
      const y = edgeSet.has('bottom') ? 65 : edgeSet.has('top') ? 35 : 50;
      return { x, y };
    }

    if (isLongCity) {
      // For long cities spanning opposite sides, position in center
      return { x: 50, y: 50 };
    }
  }

  if (edges.length === 3) {
    // For three edges, position towards the missing edge
    const missingEdge = (['top', 'right', 'bottom', 'left'] as const).find(
      (edge) => !edges.includes(edge)
    );
    const positions: Record<string, MeeplePosition> = {
      top: { x: 50, y: 65 }, // Missing top, position lower
      right: { x: 35, y: 50 }, // Missing right, position left
      bottom: { x: 50, y: 35 }, // Missing bottom, position higher
      left: { x: 65, y: 50 }, // Missing left, position right
    };
    return positions[missingEdge!]!;
  }

  // For 4 edges, place in center
  return { x: 50, y: 50 };
};

export const calculateMeeplePosition = (entity: GameEntity) => {
  switch (entity.type) {
    case 'road':
      return calculateRoadPosition(entity);
    case 'city':
      return calculateCityPosition(entity);
    case 'monastery':
      return { x: 50, y: 50 };
    default:
      return { x: 50, y: 50 };
  }
};

// Helper to get rotation angle based on orientation
export const getRotation = (orientation: Orientation) => {
  switch (orientation) {
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

export const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
