export type Orientation = 'top' | 'right' | 'bottom' | 'left';
export type CityEdge = 'top' | 'right' | 'bottom' | 'left';
export type RoadEdge = 'top' | 'right' | 'bottom' | 'left' | 'deadEnd';

// Replace TileType enum with union type
export type TileType =
  | 'START'
  | 'MONASTERY_ROAD'
  | 'MONASTERY'
  | 'CITY_FULL'
  | 'CITY_ONE_ROAD'
  | 'CITY_ONE'
  | 'CITY_TWO_FORTIFIED'
  | 'CITY_TWO'
  | 'CITY_TWO_OPPOSITE'
  | 'CITY_TWO_ADJACENT'
  | 'CITY_ONE_ROAD_BENT_RIGHT'
  | 'CITY_ONE_ROAD_BENT_LEFT'
  | 'CITY_ONE_CROSSROAD'
  | 'CITY_CORNER_FORTIFIED'
  | 'CITY_CORNER'
  | 'CITY_CORNER_ROAD_FORTIFIED'
  | 'CITY_CORNER_ROAD'
  | 'CITY_THREE_FORTIFIED'
  | 'CITY_THREE'
  | 'CITY_THREE_ROAD_FORTIFIED'
  | 'CITY_THREE_ROAD'
  | 'ROAD_STRAIGHT'
  | 'ROAD_CURVED'
  | 'ROAD_THREE_CROSSROAD'
  | 'ROAD_FOUR_CROSSROAD';

export type Pos = {
  x: number;
  y: number;
};

export type Edge = {
  type: EdgeType;
};

export type RoadEntity = {
  type: 'road';
  from: RoadEdge;
  to: RoadEdge;
};

export type CityEntity = {
  type: 'city';
  edges: CityEdge[];
  isFortified: boolean;
};

export type TileEntity = {
  id: string;
  entities: (RoadEntity | CityEntity)[];
  tileType: TileType;
  orientation: Orientation;
};

export type PlacedTile = TileEntity & {
  position: Pos;
};

export type EdgeType = 'city' | 'road' | 'grass';
