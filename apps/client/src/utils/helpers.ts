import {
  CityEntity,
  Edge,
  RoadEntity,
  MonasteryEntity,
} from '@carcassonne/shared';

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
