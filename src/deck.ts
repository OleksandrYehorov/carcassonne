import { produce } from 'immer';
import startTileImage from './assets/tiles/New_rules_start_tile.png';
import tile1Image from './assets/tiles/Base_Game_C3_Tile_A.png';
import tile2Image from './assets/tiles/Base_Game_C3_Tile_B.png';
import tile3Image from './assets/tiles/Base_Game_C3_Tile_C.png';
import tile4Image from './assets/tiles/Base_Game_C3_Tile_D.png';
import tile5Image from './assets/tiles/Base_Game_C3_Tile_E.png';
import tile6Image from './assets/tiles/Base_Game_C3_Tile_F.png';
import tile7Image from './assets/tiles/Base_Game_C3_Tile_G.png';
import tile8Image from './assets/tiles/Base_Game_C3_Tile_H.png';
import tile9Image from './assets/tiles/Base_Game_C3_Tile_I.png';
import tile10Image from './assets/tiles/Base_Game_C3_Tile_J.png';
import tile11Image from './assets/tiles/Base_Game_C3_Tile_K.png';
import tile12Image from './assets/tiles/Base_Game_C3_Tile_L.png';
import tile13Image from './assets/tiles/Base_Game_C3_Tile_M.png';
import tile14Image from './assets/tiles/Base_Game_C3_Tile_N.png';
import tile15Image from './assets/tiles/Base_Game_C3_Tile_O.png';
import tile16Image from './assets/tiles/Base_Game_C3_Tile_P.png';
import tile17Image from './assets/tiles/Base_Game_C3_Tile_Q.png';
import tile18Image from './assets/tiles/Base_Game_C3_Tile_R.png';
import tile19Image from './assets/tiles/Base_Game_C3_Tile_S.png';
import tile20Image from './assets/tiles/Base_Game_C3_Tile_T.png';
import tile21Image from './assets/tiles/Base_Game_C3_Tile_U.png';
import tile22Image from './assets/tiles/Base_Game_C3_Tile_V.png';
import tile23Image from './assets/tiles/Base_Game_C3_Tile_W.png';
import tile24Image from './assets/tiles/Base_Game_C3_Tile_X.png';

export type Orientation = 'top' | 'right' | 'bottom' | 'left';
export type CityEdge = 'top' | 'right' | 'bottom' | 'left';
export type RoadEdge = 'top' | 'right' | 'bottom' | 'left' | 'center';

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

export interface TileEntity {
  id: string;
  entities: (RoadEntity | CityEntity)[];
  image: string;
  orientation: Orientation;
}

export const startTile: TileEntity = {
  id: crypto.randomUUID(),
  entities: [
    { type: 'city', edges: ['top'], isFortified: false },
    { type: 'road', from: 'left', to: 'right' },
  ],
  image: startTileImage,
  orientation: 'top',
};

export const CARCASSONNE_DECK: TileEntity[] = [
  startTile,

  // 2 monasteries with a road
  ...Array(2)
    .fill(null)
    .map<TileEntity>(() => ({
      id: crypto.randomUUID(),
      entities: [{ type: 'road', from: 'bottom', to: 'center' }],
      image: tile1Image,
      orientation: 'top',
    })),

  // 4 monasteries without roads
  ...Array(4)
    .fill(null)
    .map<TileEntity>(() => ({
      id: crypto.randomUUID(),
      entities: [],
      image: tile2Image,
      orientation: 'top',
    })),

  // 1 full city tile
  ...Array(1)
    .fill(null)
    .map<TileEntity>(() => ({
      id: crypto.randomUUID(),
      entities: [
        {
          type: 'city',
          edges: ['top', 'right', 'bottom', 'left'],
          isFortified: true,
        },
      ],
      image: tile3Image,
      orientation: 'top',
    })),

  //4 Single edge cities with a straight road
  ...Array(4)
    .fill(null)
    .map<TileEntity>(() => ({
      id: crypto.randomUUID(),
      entities: [
        { type: 'city', edges: ['top'], isFortified: false },
        { type: 'road', from: 'left', to: 'right' },
      ],
      image: tile4Image,
      orientation: 'top',
    })),

  // 5 Single edge cities
  ...Array(5)
    .fill(null)
    .map<TileEntity>(() => ({
      id: crypto.randomUUID(),
      entities: [{ type: 'city', edges: ['top'], isFortified: false }],
      image: tile5Image,
      orientation: 'top',
    })),

  // 2 Fortified long city
  ...Array(2)
    .fill(null)
    .map<TileEntity>(() => ({
      id: crypto.randomUUID(),
      entities: [{ type: 'city', edges: ['left', 'right'], isFortified: true }],
      image: tile6Image,
      orientation: 'top',
    })),

  // 1 Long city tiles
  ...Array(1)
    .fill(null)
    .map<TileEntity>(() => ({
      id: crypto.randomUUID(),
      entities: [
        { type: 'city', edges: ['left', 'right'], isFortified: false },
      ],
      image: tile7Image,
      orientation: 'top',
    })),

  // 3 Edge-cities on opposite edges
  ...Array(3)
    .fill(null)
    .map<TileEntity>(() => ({
      id: crypto.randomUUID(),
      entities: [
        { type: 'city', edges: ['top'], isFortified: false },
        { type: 'city', edges: ['bottom'], isFortified: false },
      ],
      image: tile8Image,
      orientation: 'top',
    })),

  // 2 Edge-cities on adjacent edges
  ...Array(2)
    .fill(null)
    .map<TileEntity>(() => ({
      id: crypto.randomUUID(),
      entities: [
        { type: 'city', edges: ['top'], isFortified: false },
        { type: 'city', edges: ['left'], isFortified: false },
      ],
      image: tile9Image,
      orientation: 'top',
    })),

  // 3 Single edge cities with a diagonal road (right to bottom)
  ...Array(3)
    .fill(null)
    .map<TileEntity>(() => ({
      id: crypto.randomUUID(),
      entities: [
        { type: 'city', edges: ['top'], isFortified: false },
        { type: 'road', from: 'right', to: 'bottom' },
      ],
      image: tile10Image,
      orientation: 'top',
    })),

  // 3 Single edge cities with a diagonal road (left to bottom)
  ...Array(3)
    .fill(null)
    .map<TileEntity>(() => ({
      id: crypto.randomUUID(),
      entities: [
        { type: 'city', edges: ['top'], isFortified: false },
        { type: 'road', from: 'left', to: 'bottom' },
      ],
      image: tile11Image,
      orientation: 'top',
    })),

  // 3 Single edge cities with a "3-edge" crossroad (mini village where roads end)
  ...Array(3)
    .fill(null)
    .map<TileEntity>(() => ({
      id: crypto.randomUUID(),
      entities: [
        { type: 'city', edges: ['top'], isFortified: false },
        { type: 'road', from: 'left', to: 'center' },
        { type: 'road', from: 'right', to: 'center' },
        { type: 'road', from: 'bottom', to: 'center' },
      ],
      image: tile12Image,
      orientation: 'top',
    })),

  // 2 Fortified corner cities
  ...Array(2)
    .fill(null)
    .map<TileEntity>(() => ({
      id: crypto.randomUUID(),
      entities: [{ type: 'city', edges: ['top', 'right'], isFortified: true }],
      image: tile13Image,
      orientation: 'top',
    })),

  // 3 Fortified corner cities
  ...Array(3)
    .fill(null)
    .map<TileEntity>(() => ({
      id: crypto.randomUUID(),
      entities: [{ type: 'city', edges: ['top', 'right'], isFortified: false }],
      image: tile14Image,
      orientation: 'top',
    })),

  // 2 corner cities with a road
  ...Array(2)
    .fill(null)
    .map<TileEntity>(() => ({
      id: crypto.randomUUID(),
      entities: [
        { type: 'city', edges: ['top', 'left'], isFortified: true },
        { type: 'road', from: 'right', to: 'bottom' },
      ],
      image: tile15Image,
      orientation: 'top',
    })),

  // 3 corner cities with a road
  ...Array(3)
    .fill(null)
    .map<TileEntity>(() => ({
      id: crypto.randomUUID(),
      entities: [
        { type: 'city', edges: ['top', 'left'], isFortified: false },
        { type: 'road', from: 'right', to: 'bottom' },
      ],
      image: tile16Image,
      orientation: 'top',
    })),

  // 1 "3-edge" cities
  ...Array(1)
    .fill(null)
    .map<TileEntity>(() => ({
      id: crypto.randomUUID(),
      entities: [
        {
          type: 'city',
          edges: ['top', 'left', 'right'],
          isFortified: true,
        },
      ],
      image: tile17Image,
      orientation: 'top',
    })),

  // 3 "3-edge" cities
  ...Array(3)
    .fill(null)
    .map<TileEntity>(() => ({
      id: crypto.randomUUID(),
      entities: [
        {
          type: 'city',
          edges: ['top', 'left', 'right'],
          isFortified: false,
        },
      ],
      image: tile18Image,
      orientation: 'top',
    })),

  // 2 "3-edge" fortified cities with a road
  ...Array(2)
    .fill(null)
    .map<TileEntity>(() => ({
      id: crypto.randomUUID(),
      entities: [
        {
          type: 'city',
          edges: ['top', 'left', 'right'],
          isFortified: true,
        },
        { type: 'road', from: 'bottom', to: 'center' },
      ],
      image: tile19Image,
      orientation: 'top',
    })),

  // 1 "3-edge" cities with a road
  ...Array(1)
    .fill(null)
    .map<TileEntity>(() => ({
      id: crypto.randomUUID(),
      entities: [
        {
          type: 'city',
          edges: ['top', 'left', 'right'],
          isFortified: false,
        },
        { type: 'road', from: 'bottom', to: 'center' },
      ],
      image: tile20Image,
      orientation: 'top',
    })),

  // 8 straight roads
  ...Array(8)
    .fill(null)
    .map<TileEntity>(() => ({
      id: crypto.randomUUID(),
      entities: [{ type: 'road', from: 'top', to: 'bottom' }],
      image: tile21Image,
      orientation: 'top',
    })),

  // 9 curved roads
  ...Array(9)
    .fill(null)
    .map<TileEntity>(() => ({
      id: crypto.randomUUID(),
      entities: [{ type: 'road', from: 'left', to: 'bottom' }],
      image: tile22Image,
      orientation: 'top',
    })),

  // 3 "3-edge" crossroads (mini village where roads end)
  ...Array(3)
    .fill(null)
    .map<TileEntity>(() => ({
      id: crypto.randomUUID(),
      entities: [
        { type: 'road', from: 'left', to: 'center' },
        { type: 'road', from: 'right', to: 'center' },
        { type: 'road', from: 'bottom', to: 'center' },
      ],
      image: tile23Image,
      orientation: 'top',
    })),

  // 1 "4-edge" crossroad (mini village where roads end)
  ...Array(1)
    .fill(null)
    .map<TileEntity>(() => ({
      id: crypto.randomUUID(),
      entities: [
        { type: 'road', from: 'top', to: 'center' },
        { type: 'road', from: 'right', to: 'center' },
        { type: 'road', from: 'bottom', to: 'center' },
        { type: 'road', from: 'left', to: 'center' },
      ],
      image: tile24Image,
      orientation: 'top',
    })),
];

// Shuffle function using Fisher-Yates algorithm
export const shuffleDeck = (deck: TileEntity[]): TileEntity[] => {
  return produce(deck, (draft) => {
    for (let i = draft.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [draft[i], draft[j]] = [draft[j], draft[i]];
    }
  });
};
