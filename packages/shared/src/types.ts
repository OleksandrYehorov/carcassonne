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

export interface MeeplePosition {
  x: number; // percentage from left
  y: number; // percentage from top
}

export type Edge = {
  type: EdgeType;
};

export type PlayerColor = 'yellow' | 'red' | 'green' | 'blue' | 'black';

export interface Player {
  id: string;
  color: PlayerColor;
  meeples: number; // Number of available meeples (starts with 7)
  score: number;
}

export type MeepleInfo = {
  playerId: string;
  // position: MeeplePosition;
  // color: PlayerColor;
};

export type BaseGameEntity = {
  id: string;
  meeple?: MeepleInfo;
};

export type RoadEntity = BaseGameEntity & {
  type: 'road';
  from: RoadEdge;
  to: RoadEdge;
};

export type CityEntity = BaseGameEntity & {
  type: 'city';
  edges: CityEdge[];
  isFortified: boolean;
};

export type MonasteryEntity = BaseGameEntity & {
  type: 'monastery';
};

export type GameEntity = RoadEntity | CityEntity | MonasteryEntity;

export type TileEntity = {
  id: string;
  entities: (RoadEntity | CityEntity | MonasteryEntity)[];
  tileType: TileType;
  orientation: Orientation;
};

export type PlacedTileEntity = TileEntity & {
  position: Pos;
};

export type EdgeType = 'city' | 'road' | 'grass';
