import { TileEntity } from '@carcassonne/shared';

export const startTile: TileEntity = {
  id: crypto.randomUUID(),
  tileType: 'START',
  entities: [
    {
      id: crypto.randomUUID(),
      type: 'city',
      edges: ['top'],
      isFortified: false,
    },
    { id: crypto.randomUUID(), type: 'road', from: 'left', to: 'right' },
  ],
  orientation: 'top',
};

export const CARCASSONNE_DECK: TileEntity[] = [
  startTile,

  // 2 monasteries with a road
  ...Array(2)
    .fill(null)
    .map<TileEntity>(() => ({
      id: crypto.randomUUID(),
      tileType: 'MONASTERY_ROAD',
      entities: [
        { id: crypto.randomUUID(), type: 'monastery' },
        {
          id: crypto.randomUUID(),
          type: 'road',
          from: 'bottom',
          to: 'deadEnd',
        },
      ],
      orientation: 'top',
    })),

  // 4 monasteries without roads
  ...Array(4)
    .fill(null)
    .map<TileEntity>(() => ({
      id: crypto.randomUUID(),
      tileType: 'MONASTERY',
      entities: [{ id: crypto.randomUUID(), type: 'monastery' }],
      orientation: 'top',
    })),

  // 1 full city tile
  ...Array(1)
    .fill(null)
    .map<TileEntity>(() => ({
      id: crypto.randomUUID(),
      tileType: 'CITY_FULL',
      entities: [
        {
          id: crypto.randomUUID(),
          type: 'city',
          edges: ['top', 'right', 'bottom', 'left'],
          isFortified: true,
        },
      ],
      orientation: 'top',
    })),

  //4 Single edge cities with a straight road
  ...Array(4)
    .fill(null)
    .map<TileEntity>(() => ({
      id: crypto.randomUUID(),
      tileType: 'CITY_ONE_ROAD',
      entities: [
        {
          id: crypto.randomUUID(),
          type: 'city',
          edges: ['top'],
          isFortified: false,
        },
        { id: crypto.randomUUID(), type: 'road', from: 'left', to: 'right' },
      ],
      orientation: 'top',
    })),

  // 5 Single edge cities
  ...Array(5)
    .fill(null)
    .map<TileEntity>(() => ({
      id: crypto.randomUUID(),
      tileType: 'CITY_ONE',
      entities: [
        {
          id: crypto.randomUUID(),
          type: 'city',
          edges: ['top'],
          isFortified: false,
        },
      ],
      orientation: 'top',
    })),

  // 2 Fortified long city
  ...Array(2)
    .fill(null)
    .map<TileEntity>(() => ({
      id: crypto.randomUUID(),
      tileType: 'CITY_TWO_FORTIFIED',
      entities: [
        {
          id: crypto.randomUUID(),
          type: 'city',
          edges: ['left', 'right'],
          isFortified: true,
        },
      ],
      orientation: 'top',
    })),

  // 1 Long city tiles
  ...Array(1)
    .fill(null)
    .map<TileEntity>(() => ({
      id: crypto.randomUUID(),
      tileType: 'CITY_TWO',
      entities: [
        {
          id: crypto.randomUUID(),
          type: 'city',
          edges: ['left', 'right'],
          isFortified: false,
        },
      ],
      orientation: 'top',
    })),

  // 3 Edge-cities on opposite edges
  ...Array(3)
    .fill(null)
    .map<TileEntity>(() => ({
      id: crypto.randomUUID(),
      tileType: 'CITY_TWO_OPPOSITE',
      entities: [
        {
          id: crypto.randomUUID(),
          type: 'city',
          edges: ['top'],
          isFortified: false,
        },
        {
          id: crypto.randomUUID(),
          type: 'city',
          edges: ['bottom'],
          isFortified: false,
        },
      ],
      orientation: 'top',
    })),

  // 2 Edge-cities on adjacent edges
  ...Array(2)
    .fill(null)
    .map<TileEntity>(() => ({
      id: crypto.randomUUID(),
      tileType: 'CITY_TWO_ADJACENT',
      entities: [
        {
          id: crypto.randomUUID(),
          type: 'city',
          edges: ['top'],
          isFortified: false,
        },
        {
          id: crypto.randomUUID(),
          type: 'city',
          edges: ['left'],
          isFortified: false,
        },
      ],
      orientation: 'top',
    })),

  // 3 Single edge cities with a diagonal road (right to bottom)
  ...Array(3)
    .fill(null)
    .map<TileEntity>(() => ({
      id: crypto.randomUUID(),
      tileType: 'CITY_ONE_ROAD_BENT_RIGHT',
      entities: [
        {
          id: crypto.randomUUID(),
          type: 'city',
          edges: ['top'],
          isFortified: false,
        },
        { id: crypto.randomUUID(), type: 'road', from: 'right', to: 'bottom' },
      ],
      orientation: 'top',
    })),

  // 3 Single edge cities with a diagonal road (left to bottom)
  ...Array(3)
    .fill(null)
    .map<TileEntity>(() => ({
      id: crypto.randomUUID(),
      tileType: 'CITY_ONE_ROAD_BENT_LEFT',
      entities: [
        {
          id: crypto.randomUUID(),
          type: 'city',
          edges: ['top'],
          isFortified: false,
        },
        { id: crypto.randomUUID(), type: 'road', from: 'left', to: 'bottom' },
      ],
      orientation: 'top',
    })),

  // 3 Single edge cities with a "3-edge" crossroad (mini village where roads end)
  ...Array(3)
    .fill(null)
    .map<TileEntity>(() => ({
      id: crypto.randomUUID(),
      tileType: 'CITY_ONE_CROSSROAD',
      entities: [
        {
          id: crypto.randomUUID(),
          type: 'city',
          edges: ['top'],
          isFortified: false,
        },
        { id: crypto.randomUUID(), type: 'road', from: 'left', to: 'deadEnd' },
        { id: crypto.randomUUID(), type: 'road', from: 'right', to: 'deadEnd' },
        {
          id: crypto.randomUUID(),
          type: 'road',
          from: 'bottom',
          to: 'deadEnd',
        },
      ],
      orientation: 'top',
    })),

  // 2 Fortified corner cities
  ...Array(2)
    .fill(null)
    .map<TileEntity>(() => ({
      id: crypto.randomUUID(),
      tileType: 'CITY_CORNER_FORTIFIED',
      entities: [
        {
          id: crypto.randomUUID(),
          type: 'city',
          edges: ['top', 'right'],
          isFortified: true,
        },
      ],
      orientation: 'top',
    })),

  // 3 Fortified corner cities
  ...Array(3)
    .fill(null)
    .map<TileEntity>(() => ({
      id: crypto.randomUUID(),
      tileType: 'CITY_CORNER',
      entities: [
        {
          id: crypto.randomUUID(),
          type: 'city',
          edges: ['top', 'right'],
          isFortified: false,
        },
      ],
      orientation: 'top',
    })),

  // 2 corner cities with a road
  ...Array(2)
    .fill(null)
    .map<TileEntity>(() => ({
      id: crypto.randomUUID(),
      tileType: 'CITY_CORNER_ROAD_FORTIFIED',
      entities: [
        {
          id: crypto.randomUUID(),
          type: 'city',
          edges: ['top', 'left'],
          isFortified: true,
        },
        { id: crypto.randomUUID(), type: 'road', from: 'right', to: 'bottom' },
      ],
      orientation: 'top',
    })),

  // 3 corner cities with a road
  ...Array(3)
    .fill(null)
    .map<TileEntity>(() => ({
      id: crypto.randomUUID(),
      tileType: 'CITY_CORNER_ROAD',
      entities: [
        {
          id: crypto.randomUUID(),
          type: 'city',
          edges: ['top', 'left'],
          isFortified: false,
        },
        { id: crypto.randomUUID(), type: 'road', from: 'right', to: 'bottom' },
      ],
      orientation: 'top',
    })),

  // 1 "3-edge" cities
  ...Array(1)
    .fill(null)
    .map<TileEntity>(() => ({
      id: crypto.randomUUID(),
      tileType: 'CITY_THREE_FORTIFIED',
      entities: [
        {
          id: crypto.randomUUID(),
          type: 'city',
          edges: ['top', 'left', 'right'],
          isFortified: true,
        },
      ],
      orientation: 'top',
    })),

  // 3 "3-edge" cities
  ...Array(3)
    .fill(null)
    .map<TileEntity>(() => ({
      id: crypto.randomUUID(),
      tileType: 'CITY_THREE',
      entities: [
        {
          id: crypto.randomUUID(),
          type: 'city',
          edges: ['top', 'left', 'right'],
          isFortified: false,
        },
      ],
      orientation: 'top',
    })),

  // 2 "3-edge" fortified cities with a road
  ...Array(2)
    .fill(null)
    .map<TileEntity>(() => ({
      id: crypto.randomUUID(),
      tileType: 'CITY_THREE_ROAD_FORTIFIED',
      entities: [
        {
          id: crypto.randomUUID(),
          type: 'city',
          edges: ['top', 'left', 'right'],
          isFortified: true,
        },
        {
          id: crypto.randomUUID(),
          type: 'road',
          from: 'bottom',
          to: 'deadEnd',
        },
      ],
      orientation: 'top',
    })),

  // 1 "3-edge" cities with a road
  ...Array(1)
    .fill(null)
    .map<TileEntity>(() => ({
      id: crypto.randomUUID(),
      tileType: 'CITY_THREE_ROAD',
      entities: [
        {
          id: crypto.randomUUID(),
          type: 'city',
          edges: ['top', 'left', 'right'],
          isFortified: false,
        },
        {
          id: crypto.randomUUID(),
          type: 'road',
          from: 'bottom',
          to: 'deadEnd',
        },
      ],
      orientation: 'top',
    })),

  // 8 straight roads
  ...Array(8)
    .fill(null)
    .map<TileEntity>(() => ({
      id: crypto.randomUUID(),
      tileType: 'ROAD_STRAIGHT',
      entities: [
        { id: crypto.randomUUID(), type: 'road', from: 'top', to: 'bottom' },
      ],
      orientation: 'top',
    })),

  // 9 curved roads
  ...Array(9)
    .fill(null)
    .map<TileEntity>(() => ({
      id: crypto.randomUUID(),
      tileType: 'ROAD_CURVED',
      entities: [
        { id: crypto.randomUUID(), type: 'road', from: 'left', to: 'bottom' },
      ],
      orientation: 'top',
    })),

  // 3 "3-edge" crossroads (mini village where roads end)
  ...Array(3)
    .fill(null)
    .map<TileEntity>(() => ({
      id: crypto.randomUUID(),
      tileType: 'ROAD_THREE_CROSSROAD',
      entities: [
        { id: crypto.randomUUID(), type: 'road', from: 'left', to: 'deadEnd' },
        { id: crypto.randomUUID(), type: 'road', from: 'right', to: 'deadEnd' },
        {
          id: crypto.randomUUID(),
          type: 'road',
          from: 'bottom',
          to: 'deadEnd',
        },
      ],
      orientation: 'top',
    })),

  // 1 "4-edge" crossroad (mini village where roads end)
  ...Array(1)
    .fill(null)
    .map<TileEntity>(() => ({
      id: crypto.randomUUID(),
      tileType: 'ROAD_FOUR_CROSSROAD',
      entities: [
        { id: crypto.randomUUID(), type: 'road', from: 'top', to: 'deadEnd' },
        { id: crypto.randomUUID(), type: 'road', from: 'right', to: 'deadEnd' },
        {
          id: crypto.randomUUID(),
          type: 'road',
          from: 'bottom',
          to: 'deadEnd',
        },
        { id: crypto.randomUUID(), type: 'road', from: 'left', to: 'deadEnd' },
      ],
      orientation: 'top',
    })),
];

// Replace the immer-based shuffle with a pure function
export const shuffleDeck = (deck: TileEntity[]): TileEntity[] => {
  // Create a copy of the deck to maintain immutability
  const shuffled = [...deck];

  // Fisher-Yates shuffle algorithm
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j]!, shuffled[i]!];
  }

  return shuffled;
};
