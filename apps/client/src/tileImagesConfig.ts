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
import { TileType } from 'shared';

export const TILE_IMAGES: Record<TileType, string> = {
  [TileType.START]: startTileImage,
  [TileType.MONASTERY_ROAD]: tile1Image,
  [TileType.MONASTERY]: tile2Image,
  [TileType.CITY_FULL]: tile3Image,
  [TileType.CITY_ONE_ROAD]: tile4Image,
  [TileType.CITY_ONE]: tile5Image,
  [TileType.CITY_TWO_FORTIFIED]: tile6Image,
  [TileType.CITY_TWO]: tile7Image,
  [TileType.CITY_TWO_OPPOSITE]: tile8Image,
  [TileType.CITY_TWO_ADJACENT]: tile9Image,
  [TileType.CITY_ONE_ROAD_BENT_RIGHT]: tile10Image,
  [TileType.CITY_ONE_ROAD_BENT_LEFT]: tile11Image,
  [TileType.CITY_ONE_CROSSROAD]: tile12Image,
  [TileType.CITY_CORNER_FORTIFIED]: tile13Image,
  [TileType.CITY_CORNER]: tile14Image,
  [TileType.CITY_CORNER_ROAD_FORTIFIED]: tile15Image,
  [TileType.CITY_CORNER_ROAD]: tile16Image,
  [TileType.CITY_THREE_FORTIFIED]: tile17Image,
  [TileType.CITY_THREE]: tile18Image,
  [TileType.CITY_THREE_ROAD_FORTIFIED]: tile19Image,
  [TileType.CITY_THREE_ROAD]: tile20Image,
  [TileType.ROAD_STRAIGHT]: tile21Image,
  [TileType.ROAD_CURVED]: tile22Image,
  [TileType.ROAD_THREE_CROSSROAD]: tile23Image,
  [TileType.ROAD_FOUR_CROSSROAD]: tile24Image,
};
