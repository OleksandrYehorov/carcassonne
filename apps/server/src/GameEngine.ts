import {
  CityEdge,
  CityEntity,
  Edge,
  MonasteryEntity,
  Orientation,
  PlacedTileEntity,
  Player,
  PlayerColor,
  Pos,
  RoadEdge,
  RoadEntity,
  TileEntity,
} from '@carcassonne/shared';
import { CARCASSONNE_DECK, shuffleDeck } from './deck';

export type BaseCompletedFeature = {
  id: string;
  positions: Pos[];
  score: number;
  winners: string[] | undefined;
};

export type CompletedRoad = BaseCompletedFeature & {
  type: 'road';
  meeplesCount: Map<string, number>;
  entitiesIds: Set<string>;
};

export type CompletedCity = BaseCompletedFeature & {
  type: 'city';
  meeplesCount: Map<string, number>;
  entitiesIds: Set<string>;
};

export type CompletedMonastery = BaseCompletedFeature & {
  type: 'monastery';
  playerId: string | undefined;
};

export type CompetedFeature = CompletedRoad &
  CompletedCity &
  CompletedMonastery;

export class GameEngine {
  public readonly gameId = crypto.randomUUID();
  private placedTiles: PlacedTileEntity[];
  private deck: TileEntity[];
  private currentRotations = 0;
  private players: Player[] = [];
  public readonly playersCount: number;
  private currentPlayerIndex = 0;
  private lastPlacedTilePos: Pos | null = { x: 0, y: 0 };
  private turnState: 'placeTile' | 'placeMeepleOrEnd' = 'placeMeepleOrEnd';

  constructor({ playersCount }: { playersCount: number }) {
    const [startTile, ...remainingDeck] = CARCASSONNE_DECK;

    if (!startTile) throw new Error('Deck is empty');

    this.placedTiles = [
      {
        ...startTile,
        position: { x: 0, y: 0 },
      },
    ];
    this.deck = shuffleDeck(remainingDeck);

    this.playersCount = playersCount;

    this.findValidTilePlacement();
  }

  public addPlayer(playerName: string):
    | {
        success: true;
        player: Player;
      }
    | {
        success: false;
        message?: string;
      } {
    if (this.players.length >= this.playersCount) {
      return { success: false, message: 'Game is already full.' };
    }

    const colors: PlayerColor[] = ['yellow', 'red', 'green', 'blue', 'black'];
    const color = colors.find(
      (color) => !this.players.some((player) => player.color === color)
    );

    if (!color) {
      return { success: false, message: 'No available colors left.' };
    }

    const player: Player = {
      id: crypto.randomUUID(),
      name: playerName,
      color,
      remainingMeeples: 7,
      score: 0,
      isHost: this.players.length === 0,
    };

    this.players.push(player);

    return { success: true, player };
  }

  private getEdgesFromEntities(
    entities: (RoadEntity | CityEntity | MonasteryEntity)[]
  ): [Edge, Edge, Edge, Edge] {
    const edges: [Edge, Edge, Edge, Edge] = [
      { type: 'grass' },
      { type: 'grass' },
      { type: 'grass' },
      { type: 'grass' },
    ];

    const edgeToIndex = {
      top: 0,
      right: 1,
      bottom: 2,
      left: 3,
    };

    entities.forEach((entity) => {
      if (entity.type === 'city') {
        entity.edges.forEach((edge) => {
          edges[edgeToIndex[edge]] = { type: 'city' };
        });
      } else if (entity.type === 'road') {
        if (entity.from !== 'deadEnd') {
          edges[edgeToIndex[entity.from]] = { type: 'road' };
        }
        if (entity.to !== 'deadEnd') {
          edges[edgeToIndex[entity.to]] = { type: 'road' };
        }
      }
    });

    return edges;
  }

  private getRotatedEdges(tile: TileEntity): [Edge, Edge, Edge, Edge] {
    const baseEdges = this.getEdgesFromEntities(tile.entities);
    if (tile.orientation === 'top') return baseEdges;

    const rotations = {
      right: 1,
      bottom: 2,
      left: 3,
    };

    const rotationCount = rotations[tile.orientation];
    const rotatedEdges = structuredClone(baseEdges);

    for (let i = 0; i < rotationCount; i++) {
      const popped = rotatedEdges.pop();
      if (popped) rotatedEdges.unshift(popped);
    }

    return rotatedEdges;
  }

  private isValidPlacement(
    tile1: PlacedTileEntity,
    pos: Pos,
    tile2: TileEntity
  ): boolean {
    const dx = pos.x - tile1.position.x;
    const dy = pos.y - tile1.position.y;

    if (Math.abs(dx) + Math.abs(dy) !== 1) return false;

    const tile2Edges = this.getRotatedEdges(tile2);
    const tile1Edges = this.getRotatedEdges(tile1);

    let edge1Index: number;
    let edge2Index: number;

    if (dx === 1) {
      edge1Index = 1; // right edge of tile1
      edge2Index = 3; // left edge of tile2
    } else if (dx === -1) {
      edge1Index = 3; // left edge of tile1
      edge2Index = 1; // right edge of tile2
    } else if (dy === 1) {
      edge1Index = 2; // bottom edge of tile1
      edge2Index = 0; // top edge of tile2
    } else {
      edge1Index = 0; // top edge of tile1
      edge2Index = 2; // bottom edge of tile2
    }

    return tile1Edges[edge1Index]?.type === tile2Edges[edge2Index]?.type;
  }

  public getValidPositions(): Pos[] {
    if (this.deck.length === 0) return [];
    const currentTile = this.deck[0];
    if (!currentTile) throw new Error('No current tile available');

    const validPositions: Pos[] = [];

    this.placedTiles.forEach((tile) => {
      const adjacentPositions = [
        { x: tile.position.x + 1, y: tile.position.y },
        { x: tile.position.x - 1, y: tile.position.y },
        { x: tile.position.x, y: tile.position.y + 1 },
        { x: tile.position.x, y: tile.position.y - 1 },
      ];

      adjacentPositions.forEach((pos) => {
        const isOccupied = this.placedTiles.some(
          (t) => t.position.x === pos.x && t.position.y === pos.y
        );
        if (isOccupied) return;

        if (validPositions.some((p) => p.x === pos.x && p.y === pos.y)) return;

        const adjacentTiles = this.placedTiles.filter((t) => {
          const dx = pos.x - t.position.x;
          const dy = pos.y - t.position.y;
          return (
            (Math.abs(dx) === 1 && dy === 0) || (Math.abs(dy) === 1 && dx === 0)
          );
        });

        const canPlace = adjacentTiles.every((adjTile) =>
          this.isValidPlacement(adjTile, pos, currentTile)
        );

        if (canPlace) {
          validPositions.push(pos);
        }
      });
    });

    return validPositions;
  }

  public rotateTile(): boolean {
    const currentTile = this.deck[0];
    if (!currentTile) return false;

    const nextOrientation: Record<Orientation, Orientation> = {
      top: 'right',
      right: 'bottom',
      bottom: 'left',
      left: 'top',
    };
    currentTile.orientation = nextOrientation[currentTile.orientation];

    this.currentRotations++;
    return true;
  }

  private checkCompletedRoads(position: Pos): CompletedRoad[] {
    const placedTile = this.placedTiles.find(
      (t) => t.position.x === position.x && t.position.y === position.y
    );
    if (!placedTile) return [];

    const roadEntities = placedTile.entities.filter((e) => e.type === 'road');
    // Use a Map to deduplicate completed roads by their unique set of visited tiles
    const uniqueRoads: Map<string, CompletedRoad> = new Map();

    for (const road of roadEntities) {
      const completedRoad = this.isRoadComplete(placedTile, road);

      if (completedRoad) {
        // Create an id based on sorted tile keys, which uniquely identifies a road
        // const roadId = Array.from(completedRoad.tiles).sort().join(',');
        if (!uniqueRoads.has(completedRoad.id)) {
          uniqueRoads.set(completedRoad.id, completedRoad);
        }
      }
    }

    const dedupedCompletedRoads = Array.from(uniqueRoads.values());
    // Increase the score only once per unique completed road
    for (const road of dedupedCompletedRoads) {
      this.awardPointsForFeature(road);
    }
    return dedupedCompletedRoads;
  }

  private isRoadComplete(
    startTile: PlacedTileEntity,
    startRoad: RoadEntity
  ): CompletedRoad | null {
    const visitedTiles = new Set<string>();
    const visitedRoadEntities = new Set<string>();
    const entitiesIds = new Set<string>();
    const edgesToVisit: Array<{
      tile: PlacedTileEntity;
      road: RoadEntity;
      edge: RoadEdge;
    }> = [];
    const meeplesCount = new Map<string, number>();
    // const entitiesIds = new Set<string>();

    const rotatedFrom = this.rotateEdge(startRoad.from, startTile.orientation);
    const rotatedTo = this.rotateEdge(startRoad.to, startTile.orientation);
    edgesToVisit.push({ tile: startTile, road: startRoad, edge: rotatedFrom });
    edgesToVisit.push({ tile: startTile, road: startRoad, edge: rotatedTo });

    let centerEndCount = 0;
    let isCircular = false;

    while (edgesToVisit.length > 0) {
      const current = edgesToVisit.pop();
      if (!current) continue;

      // Check if current road has a meeple
      if (current.road.meeple) {
        meeplesCount.set(
          current.road.meeple.playerId,
          (meeplesCount.get(current.road.meeple.playerId) ?? 0) + 1
        );
      }

      const tileKey = `${current.tile.position.x},${current.tile.position.y}`;
      const roadEntityId = current.road.id; // Ensure RoadEntity has an 'id' property
      const edgeKey = `${tileKey}-${roadEntityId}-${current.edge}`;

      entitiesIds.add(roadEntityId);

      if (visitedRoadEntities.has(edgeKey)) {
        if (visitedRoadEntities.size > 1) {
          isCircular = true;
        }
        continue;
      }

      visitedRoadEntities.add(edgeKey);
      visitedTiles.add(tileKey);

      if (current.edge === 'deadEnd') {
        centerEndCount++;
        continue;
      }

      const nextTilePos = this.getAdjacentPosition(
        current.tile.position,
        current.edge
      );
      const nextTile = this.placedTiles.find(
        (t) => t.position.x === nextTilePos.x && t.position.y === nextTilePos.y
      );

      if (!nextTile) continue;

      const connectingRoad = this.findConnectingRoad(
        nextTile,
        current.edge,
        current.road.id
      );
      if (connectingRoad) {
        const rotatedFrom = this.rotateEdge(
          connectingRoad.from,
          nextTile.orientation
        );
        const rotatedTo = this.rotateEdge(
          connectingRoad.to,
          nextTile.orientation
        );
        const oppositeEdge = this.getOppositeEdge(current.edge);

        if (rotatedFrom === oppositeEdge) {
          edgesToVisit.push({
            tile: nextTile,
            road: connectingRoad,
            edge: rotatedTo,
          });
        } else if (rotatedTo === oppositeEdge) {
          edgesToVisit.push({
            tile: nextTile,
            road: connectingRoad,
            edge: rotatedFrom,
          });
        }
      }
    }

    return centerEndCount === 2 || isCircular
      ? {
          id: crypto.randomUUID(),
          type: 'road',
          // length: visitedTiles.size,
          // tiles: visitedTiles,
          positions: Array.from(visitedTiles).map((tile) => {
            const [x, y] = tile.split(',').map(Number);

            if (x === undefined || y === undefined) {
              throw new Error('Invalid tile coordinates');
            }

            return { x, y };
          }),
          score: visitedTiles.size,
          meeplesCount,
          entitiesIds,
          winners: undefined,
        }
      : null;
  }

  private findConnectingRoad(
    tile: PlacedTileEntity,
    fromEdge: RoadEdge,
    currentRoadId: string
  ): RoadEntity | undefined {
    const oppositeEdge = this.getOppositeEdge(fromEdge);
    return tile.entities
      .filter((e) => e.type === 'road')
      .filter((e) => e.id !== currentRoadId)
      .find((road) => {
        const rotatedFrom = this.rotateEdge(road.from, tile.orientation);
        const rotatedTo = this.rotateEdge(road.to, tile.orientation);
        return rotatedFrom === oppositeEdge || rotatedTo === oppositeEdge;
      });
  }

  private rotateEdge(edge: RoadEdge, orientation: Orientation): RoadEdge {
    if (edge === 'deadEnd' || orientation === 'top') return edge;

    const rotations = {
      right: 1,
      bottom: 2,
      left: 3,
    };

    const edges = ['top', 'right', 'bottom', 'left'] as const;
    const currentIndex = edges.indexOf(edge);
    if (currentIndex === -1) return edge;

    const rotationCount = rotations[orientation];
    const newIndex = ((currentIndex + rotationCount) % 4) as 0 | 1 | 2 | 3;

    return edges[newIndex];
  }

  private getOppositeEdge(edge: RoadEdge): RoadEdge {
    const oppositeEdges = {
      top: 'bottom',
      right: 'left',
      bottom: 'top',
      left: 'right',
      deadEnd: 'deadEnd',
    } as const;
    return oppositeEdges[edge];
  }

  private checkAndAwardCompletedFeatures(
    position: Pos
  ): (CompletedRoad | CompletedCity | CompletedMonastery)[] {
    return [
      ...this.checkCompletedRoads(position),
      ...this.checkCompletedCities(position),
      ...this.checkCompletedMonasteries(position),
    ];
  }

  public placeTile(position: Pos): { success: true } | { success: false } {
    if (this.deck.length === 0) return { success: false };

    const currentTile = this.deck[0] as TileEntity;
    const validPositions = this.getValidPositions();

    if (!validPositions.some((p) => p.x === position.x && p.y === position.y)) {
      return { success: false };
    }

    this.placedTiles = [
      ...this.placedTiles,
      {
        ...currentTile,
        position,
      },
    ];

    this.deck = this.deck.slice(1);

    this.currentRotations = 0;
    this.lastPlacedTilePos = position;
    this.turnState = 'placeMeepleOrEnd';

    this.findValidTilePlacement();
    return { success: true };
  }

  public getCurrentTile(): TileEntity | null {
    return this.deck[0] || null;
  }

  public getPlacedTiles(): PlacedTileEntity[] {
    return [...this.placedTiles];
  }

  public getDeckSize(): number {
    return this.deck.length;
  }

  public getCurrentRotations(): number {
    return this.currentRotations;
  }

  public shuffleCurrentTile(): void {
    if (this.deck.length === 0) return;

    const [currentTile] = this.deck.slice(0, 1);
    if (currentTile) {
      const remainingDeck = this.deck.slice(1);
      currentTile.orientation = 'top';
      const insertIndex = Math.floor(Math.random() * remainingDeck.length);
      this.deck = [
        ...remainingDeck.slice(0, insertIndex),
        currentTile,
        ...remainingDeck.slice(insertIndex),
      ];
    }

    this.currentRotations = 0;
    this.findValidTilePlacement();
  }

  private getAdjacentPosition(pos: Pos, edge: RoadEdge): Pos {
    switch (edge) {
      case 'top':
        return { x: pos.x, y: pos.y - 1 };
      case 'right':
        return { x: pos.x + 1, y: pos.y };
      case 'bottom':
        return { x: pos.x, y: pos.y + 1 };
      case 'left':
        return { x: pos.x - 1, y: pos.y };
      default:
        return pos;
    }
  }

  private checkCompletedCities(position: Pos): CompletedCity[] {
    const placedTile = this.placedTiles.find(
      (t) => t.position.x === position.x && t.position.y === position.y
    );
    if (!placedTile) return [];

    const cityEntities = placedTile.entities.filter((e) => e.type === 'city');
    const uniqueCities: Map<string, CompletedCity> = new Map();

    for (const city of cityEntities) {
      const completedCity = this.isCityComplete(placedTile, city);
      if (completedCity) {
        if (!uniqueCities.has(completedCity.id)) {
          uniqueCities.set(completedCity.id, completedCity);
        }
      }
    }

    const dedupedCompletedCities = Array.from(uniqueCities.values());
    // Increase the score only once per unique completed road
    for (const city of dedupedCompletedCities) {
      this.awardPointsForFeature(city);
    }
    return dedupedCompletedCities;
  }

  private isCityComplete(
    startTile: PlacedTileEntity,
    startCity: CityEntity
  ): CompletedCity | null {
    const visitedTiles = new Set<string>();
    const visitedCityEntities = new Set<string>();
    const entitiesIds = new Set<string>();
    const edgesToVisit: Array<{
      tile: PlacedTileEntity;
      city: CityEntity;
      edge: CityEdge;
    }> = [];
    const meeplesCount = new Map<string, number>();

    // Add initial city's edges to visit
    startCity.edges.forEach((edge) => {
      const rotatedEdge = this.rotateEdge(edge, startTile.orientation);
      edgesToVisit.push({
        tile: startTile,
        city: startCity,
        edge: rotatedEdge as CityEdge,
      });
    });

    let score = 0;

    while (edgesToVisit.length > 0) {
      const current = edgesToVisit.pop();
      if (!current) continue;
      current.city.id;

      // Check if current road has a meeple
      if (current.city.meeple) {
        meeplesCount.set(
          current.city.meeple.playerId,
          (meeplesCount.get(current.city.meeple.playerId) ?? 0) + 1
        );
      }

      const tileKey = `${current.tile.position.x},${current.tile.position.y}`;
      const cityEntityId = current.city.id; // Ensure CityEntity has an 'id' property
      const edgeKey = `${tileKey}-${cityEntityId}-${current.edge}`;

      if (visitedCityEntities.has(edgeKey)) {
        continue;
      }

      entitiesIds.add(cityEntityId);
      visitedCityEntities.add(edgeKey);
      visitedTiles.add(tileKey);

      const nextTilePos = this.getAdjacentPosition(
        current.tile.position,
        current.edge
      );
      const nextTile = this.placedTiles.find(
        (t) => t.position.x === nextTilePos.x && t.position.y === nextTilePos.y
      );

      if (!nextTile) {
        return null; // Incomplete city - edge not connected
      }

      const connectingCity = this.findConnectingCity(
        nextTile,
        current.edge,
        current.city.id
      );
      if (!connectingCity) {
        return null; // Incomplete city - no matching city edge
      }

      // Add the connecting city's other edges to visit
      connectingCity.edges.forEach((edge) => {
        const rotatedEdge = this.rotateEdge(edge, nextTile.orientation);
        edgesToVisit.push({
          tile: nextTile,
          city: connectingCity,
          edge: rotatedEdge as CityEdge,
        });
      });
    }

    // Calculate the score based on visited city tiles and their properties
    score = Array.from(visitedTiles).reduce((total, tileKey) => {
      const [x, y] = tileKey.split(',').map(Number);
      const tile = this.placedTiles.find(
        (t) => t.position.x === x && t.position.y === y
      );
      if (!tile) return total;
      const cityEntity = tile.entities.find((e) => e.type === 'city');
      if (!cityEntity) return total;
      return total + (cityEntity.isFortified ? 4 : 2);
    }, 0);

    return {
      id: crypto.randomUUID(),
      type: 'city',
      positions: Array.from(visitedTiles).map((tile) => {
        const [x, y] = tile.split(',').map(Number);

        if (x === undefined || y === undefined) {
          throw new Error('Invalid tile coordinates');
        }

        return { x, y };
      }),
      score,
      meeplesCount,
      entitiesIds,
      winners: undefined,
    };
  }

  private findConnectingCity(
    tile: PlacedTileEntity,
    fromEdge: CityEdge,
    currentCityId: string
  ): CityEntity | undefined {
    const oppositeEdge = this.getOppositeEdge(fromEdge);
    return tile.entities
      .filter((e) => e.type === 'city')
      .filter((e) => e.id !== currentCityId)
      .find((city) =>
        city.edges.some(
          (edge) => this.rotateEdge(edge, tile.orientation) === oppositeEdge
        )
      );
  }

  private checkCompletedMonasteries(newTilePos: Pos): CompletedMonastery[] {
    const completedMonasteries: CompletedMonastery[] = [];

    // Get all positions that could have a monastery affected by this tile placement
    const positionsToCheck = [
      newTilePos, // Center
      // Top row
      { x: newTilePos.x - 1, y: newTilePos.y - 1 },
      { x: newTilePos.x, y: newTilePos.y - 1 },
      { x: newTilePos.x + 1, y: newTilePos.y - 1 },
      // Middle row
      { x: newTilePos.x - 1, y: newTilePos.y },
      { x: newTilePos.x + 1, y: newTilePos.y },
      // Bottom row
      { x: newTilePos.x - 1, y: newTilePos.y + 1 },
      { x: newTilePos.x, y: newTilePos.y + 1 },
      { x: newTilePos.x + 1, y: newTilePos.y + 1 },
    ];

    // Check each position for a monastery
    positionsToCheck.forEach((pos) => {
      const tile = this.placedTiles.find(
        (t) => t.position.x === pos.x && t.position.y === pos.y
      );

      if (!tile) return;

      // Check if this tile has a monastery
      const hasMonastery = tile.entities.some((e) => e.type === 'monastery');
      if (!hasMonastery) return;

      // Get all surrounding positions for the monastery
      const surroundingPositions = [
        { x: pos.x - 1, y: pos.y - 1 },
        { x: pos.x, y: pos.y - 1 },
        { x: pos.x + 1, y: pos.y - 1 },
        { x: pos.x - 1, y: pos.y },
        { x: pos.x + 1, y: pos.y },
        { x: pos.x - 1, y: pos.y + 1 },
        { x: pos.x, y: pos.y + 1 },
        { x: pos.x + 1, y: pos.y + 1 },
      ];

      // Check if all surrounding positions have tiles
      const surroundingTiles = surroundingPositions.map((p) =>
        this.placedTiles.find(
          (t) => t.position.x === p.x && t.position.y === p.y
        )
      );

      if (surroundingTiles.every((t) => t !== undefined)) {
        completedMonasteries.push({
          id: crypto.randomUUID(),
          type: 'monastery',
          positions: [pos, ...surroundingPositions],
          score: 9, // 1 point for monastery + 8 surrounding tiles
          playerId: tile.entities.find((e) => e.type === 'monastery')?.meeple
            ?.playerId,
          winners: undefined,
        });
      }
    });

    // Increase the score only once per unique completed road
    for (const monastery of completedMonasteries) {
      this.awardPointsForFeature(monastery);
    }

    return completedMonasteries;
  }

  public getCurrentPlayer(): Player {
    return this.players[this.currentPlayerIndex] as Player;
  }

  private nextTurn(): void {
    this.currentPlayerIndex =
      (this.currentPlayerIndex + 1) % this.players.length;
  }

  public getPlayers(): Player[] {
    return [...this.players];
  }

  // Add these helper methods to check if an entity is already claimed
  private isRoadClaimed(
    startTile: PlacedTileEntity,
    startRoad: RoadEntity
  ): boolean {
    const visitedTiles = new Set<string>();
    const edgesToVisit: Array<{
      tile: PlacedTileEntity;
      road: RoadEntity;
      edge: RoadEdge;
    }> = [];

    // Add initial road's endpoints to visit
    const rotatedFrom = this.rotateEdge(startRoad.from, startTile.orientation);
    const rotatedTo = this.rotateEdge(startRoad.to, startTile.orientation);
    edgesToVisit.push({ tile: startTile, road: startRoad, edge: rotatedFrom });
    edgesToVisit.push({ tile: startTile, road: startRoad, edge: rotatedTo });

    while (edgesToVisit.length > 0) {
      const current = edgesToVisit.pop();
      if (!current) continue;

      const tileKey = `${current.tile.position.x},${current.tile.position.y}`;
      visitedTiles.add(tileKey);

      // Check if current road has a meeple
      if (current.road.meeple) {
        return true;
      }

      if (current.edge === 'deadEnd') continue;

      const nextTilePos = this.getAdjacentPosition(
        current.tile.position,
        current.edge
      );
      const nextTile = this.placedTiles.find(
        (t) => t.position.x === nextTilePos.x && t.position.y === nextTilePos.y
      );

      if (!nextTile) continue;

      const connectingRoad = this.findConnectingRoad(
        nextTile,
        current.edge,
        current.road.id
      );
      if (connectingRoad) {
        const rotatedFrom = this.rotateEdge(
          connectingRoad.from,
          nextTile.orientation
        );
        const rotatedTo = this.rotateEdge(
          connectingRoad.to,
          nextTile.orientation
        );
        const oppositeEdge = this.getOppositeEdge(current.edge);

        if (rotatedFrom === oppositeEdge) {
          edgesToVisit.push({
            tile: nextTile,
            road: connectingRoad,
            edge: rotatedTo,
          });
        } else if (rotatedTo === oppositeEdge) {
          edgesToVisit.push({
            tile: nextTile,
            road: connectingRoad,
            edge: rotatedFrom,
          });
        }
      }
    }

    return false;
  }

  private isCityClaimed(
    startTile: PlacedTileEntity,
    startCity: CityEntity
  ): boolean {
    const visitedTiles = new Set<string>();
    const visitedEdges = new Set<string>();
    const edgesToVisit: Array<{
      tile: PlacedTileEntity;
      city: CityEntity;
      edge: CityEdge;
    }> = [];

    // Add initial city's edges to visit
    startCity.edges.forEach((edge) => {
      const rotatedEdge = this.rotateEdge(edge, startTile.orientation);
      edgesToVisit.push({
        tile: startTile,
        city: startCity,
        edge: rotatedEdge as CityEdge,
      });
    });

    while (edgesToVisit.length > 0) {
      const current = edgesToVisit.pop();
      if (!current) {
        continue;
      }

      if (current.city.meeple) {
        return true;
      }

      const tileKey = `${current.tile.position.x},${current.tile.position.y}`;
      const edgeKey = `${tileKey}-${current.edge}`;

      if (visitedEdges.has(edgeKey)) {
        continue;
      }
      visitedEdges.add(edgeKey);
      visitedTiles.add(tileKey);

      const nextTilePos = this.getAdjacentPosition(
        current.tile.position,
        current.edge
      );
      const nextTile = this.placedTiles.find(
        (t) => t.position.x === nextTilePos.x && t.position.y === nextTilePos.y
      );

      if (!nextTile) {
        continue;
      }

      const connectingCity = this.findConnectingCity(
        nextTile,
        current.edge,
        current.city.id
      );
      if (!connectingCity) {
        continue;
      }

      // Add the connecting city's other edges to visit
      connectingCity.edges.forEach((edge) => {
        const rotatedEdge = this.rotateEdge(edge, nextTile.orientation);
        edgesToVisit.push({
          tile: nextTile,
          city: connectingCity,
          edge: rotatedEdge as CityEdge,
        });
      });
    }

    return false;
  }

  private isMonasteryClaimed(tile: PlacedTileEntity): boolean {
    // For monastery, we just need to check if this monastery already has a meeple
    const monastery = tile.entities.find((e) => e.type === 'monastery');
    return monastery?.meeple !== undefined;
  }

  // Modify skipMeeplePlacement to check completions at end of turn
  public skipMeeplePlacement(): {
    success: boolean;
    completedFeatures?: (CompletedCity | CompletedMonastery | CompletedRoad)[];
  } {
    if (this.turnState !== 'placeMeepleOrEnd') {
      return { success: false };
    }

    const completedFeatures = this.lastPlacedTilePos
      ? this.checkAndAwardCompletedFeatures(this.lastPlacedTilePos)
      : undefined;

    this.lastPlacedTilePos = null;
    this.turnState = 'placeTile';
    this.nextTurn();

    return {
      success: true,
      completedFeatures,
    };
  }

  // Modify placeMeeple to check completions at end of turn
  public placeMeeple(entityId: string): {
    success: boolean;
    completedFeatures?: (CompletedRoad | CompletedCity | CompletedMonastery)[];
  } {
    if (this.turnState !== 'placeMeepleOrEnd') {
      return { success: false };
    }

    const lastPlacedTile = this.placedTiles.find(
      (tile) =>
        tile.position.x === this.lastPlacedTilePos?.x &&
        tile.position.y === this.lastPlacedTilePos?.y
    );
    const currentPlayer = this.getCurrentPlayer();

    if (!lastPlacedTile) return { success: false };
    const entity = lastPlacedTile.entities.find((e) => e.id === entityId);
    if (!entity) return { success: false };
    if (currentPlayer.remainingMeeples <= 0) return { success: false };

    // Check if the entity is already claimed
    if (entity.type === 'road' && this.isRoadClaimed(lastPlacedTile, entity)) {
      return { success: false };
    }
    if (entity.type === 'city' && this.isCityClaimed(lastPlacedTile, entity)) {
      return { success: false };
    }
    if (
      entity.type === 'monastery' &&
      this.isMonasteryClaimed(lastPlacedTile)
    ) {
      return { success: false };
    }

    // Update the placed tiles array with the new meeple
    this.placedTiles = this.placedTiles.map((tile) => {
      if (
        tile.position.x === this.lastPlacedTilePos?.x &&
        tile.position.y === this.lastPlacedTilePos?.y
      ) {
        return {
          ...tile,
          entities: tile.entities.map((e) =>
            e.id === entityId
              ? { ...e, meeple: { playerId: currentPlayer.id } }
              : e
          ),
        };
      }
      return tile;
    });

    // Update player meeples
    this.players = this.players.map((player, index) =>
      index === this.currentPlayerIndex
        ? { ...player, remainingMeeples: player.remainingMeeples - 1 }
        : player
    );

    const completedFeatures = this.lastPlacedTilePos
      ? this.checkAndAwardCompletedFeatures(this.lastPlacedTilePos)
      : undefined;

    this.lastPlacedTilePos = null;
    this.turnState = 'placeTile';
    this.nextTurn();

    return {
      success: true,
      completedFeatures,
    };
  }

  // Add getter for lastPlacedTilePos
  public getLastPlacedTilePos(): Pos | null {
    return this.lastPlacedTilePos;
  }

  // Add this new method
  private findValidTilePlacement(): void {
    // Check if current tile has valid placements, if not try rotating or shuffling
    while (this.deck.length > 0 && this.getValidPositions().length === 0) {
      // Try rotating current tile up to 3 times
      let rotationsAttempted = 0;
      while (rotationsAttempted < 3) {
        this.rotateTile();
        rotationsAttempted++;
        if (this.getValidPositions().length > 0) {
          break;
        }
      }

      // If no valid position found after rotations, shuffle current tile
      if (this.getValidPositions().length === 0) {
        this.shuffleCurrentTile();
      }
    }
  }

  public getTurnState(): 'placeTile' | 'placeMeepleOrEnd' {
    return this.turnState;
  }

  // Add helper method to award points to players
  private awardPointsForFeature(
    completedFeature: CompletedCity | CompletedRoad | CompletedMonastery
  ): void {
    if (completedFeature.type === 'city' || completedFeature.type === 'road') {
      const meepleOwners = completedFeature.meeplesCount;
      if (meepleOwners.size === 0) return;

      const maxMeeples = Math.max(...meepleOwners.values());
      const winners = Array.from(meepleOwners.entries())
        .filter(([_, count]) => count === maxMeeples)
        .map(([playerId]) => playerId);

      completedFeature.winners = winners;

      // Update players scores and meeples
      this.players = this.players.map((player) => {
        if (winners.includes(player.id)) {
          const points =
            completedFeature.type === 'city'
              ? completedFeature.score
              : completedFeature.positions.length;
          return {
            ...player,
            score: player.score + points,
            remainingMeeples: player.remainingMeeples + maxMeeples,
          };
        }
        return player;
      });

      // Remove meeples only from completed entities
      this.placedTiles = this.placedTiles.map((tile) => {
        if (
          completedFeature.positions.find(
            ({ x, y }) => x === tile.position.x && y === tile.position.y
          )
        ) {
          return {
            ...tile,
            entities: tile.entities.map((entity) => {
              // Only remove meeple if entity is part of the completed feature
              if (entity.type === completedFeature.type) {
                const isPartOfCompletedFeature =
                  completedFeature.entitiesIds.has(entity.id);

                if (isPartOfCompletedFeature) {
                  return { ...entity, meeple: undefined };
                }
              }
              return entity;
            }),
          };
        }
        return tile;
      });
    } else {
      // handle monasteries
      if (!completedFeature.playerId) return;

      // Add winner for monastery
      completedFeature.winners = completedFeature.playerId
        ? [completedFeature.playerId]
        : undefined;

      // Find the player who owns the monastery
      this.players = this.players.map((player) => {
        if (player.id === completedFeature.playerId) {
          return {
            ...player,
            score: player.score + completedFeature.score,
            remainingMeeples: player.remainingMeeples + 1, // Return 1 meeple from monastery
          };
        }
        return player;
      });

      // Remove meeple from the monastery tile
      this.placedTiles = this.placedTiles.map((tile) => {
        if (
          completedFeature.positions.find(
            ({ x, y }) => x === tile.position.x && y === tile.position.y
          )
        ) {
          return {
            ...tile,
            entities: tile.entities.map((entity) => {
              if (
                entity.type === completedFeature.type &&
                entity.meeple?.playerId === completedFeature.playerId
              ) {
                return { ...entity, meeple: undefined };
              }
              return entity;
            }),
          };
        }
        return tile;
      });
    }
  }

  // Add a method to get valid meeple positions
  public getValidMeeplePositions(pos: Pos): string[] {
    const tile = this.placedTiles.find(
      (t) => t.position.x === pos.x && t.position.y === pos.y
    );
    const currentPlayer = this.getCurrentPlayer();
    if (!tile || currentPlayer.remainingMeeples === 0) return [];

    return tile.entities
      .filter((entity) => {
        if (entity.type === 'road' && !this.isRoadClaimed(tile, entity)) {
          return true;
        }
        if (entity.type === 'city' && !this.isCityClaimed(tile, entity)) {
          return true;
        }
        if (entity.type === 'monastery' && !this.isMonasteryClaimed(tile)) {
          return true;
        }
        return false;
      })
      .map((entity) => entity.id);
  }
}
