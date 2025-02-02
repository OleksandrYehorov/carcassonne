import {
  CityEdge,
  CityEntity,
  Edge,
  Orientation,
  PlacedTile,
  Pos,
  RoadEdge,
  RoadEntity,
  TileEntity,
} from '@carcassonne/shared';
import { produce } from 'immer';
import { shuffleDeck } from './deck';

interface CompletedRoad {
  length: number;
  tiles: Set<string>;
  positions: Pos[];
}

export class GameEngine {
  private placedTiles: PlacedTile[];
  private deck: TileEntity[];
  private currentRotations = 0;
  private score = 0;
  private completedRoads: CompletedRoad[] = [];

  constructor(startTile: TileEntity, deck: TileEntity[]) {
    // Initialize with start tile at center
    this.placedTiles = [
      {
        ...startTile,
        position: { x: 0, y: 0 },
      },
    ];
    this.deck = shuffleDeck(deck);
  }

  private getEdgesFromEntities(
    entities: (RoadEntity | CityEntity)[]
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
    tile1: PlacedTile,
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

    return tile1Edges[edge1Index].type === tile2Edges[edge2Index].type;
  }

  public getValidPositions(): Pos[] {
    if (this.deck.length === 0) return [];
    const currentTile = this.deck[0];
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
    if (this.deck.length === 0) return false;

    this.deck = produce(this.deck, (draft) => {
      const nextOrientation: Record<Orientation, Orientation> = {
        top: 'right',
        right: 'bottom',
        bottom: 'left',
        left: 'top',
      };
      draft[0].orientation = nextOrientation[draft[0].orientation];
    });

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
        const roadId = Array.from(completedRoad.tiles).sort().join(',');
        if (!uniqueRoads.has(roadId)) {
          uniqueRoads.set(roadId, completedRoad);
        }
      }
    }

    const dedupedCompletedRoads = Array.from(uniqueRoads.values());
    // Increase the score only once per unique completed road
    for (const road of dedupedCompletedRoads) {
      this.score += road.length;
    }
    return dedupedCompletedRoads;
  }

  private isRoadComplete(
    startTile: PlacedTile,
    startRoad: RoadEntity
  ): CompletedRoad | null {
    const visitedTiles = new Set<string>();
    const visitedEdges = new Set<string>();
    const edgesToVisit: Array<{
      tile: PlacedTile;
      road: RoadEntity;
      edge: RoadEdge;
    }> = [];

    // Add initial road's endpoints to visit
    const rotatedFrom = this.rotateEdge(startRoad.from, startTile.orientation);
    const rotatedTo = this.rotateEdge(startRoad.to, startTile.orientation);
    edgesToVisit.push({ tile: startTile, road: startRoad, edge: rotatedFrom });
    edgesToVisit.push({ tile: startTile, road: startRoad, edge: rotatedTo });

    let centerEndCount = 0;
    let isCircular = false;

    while (edgesToVisit.length > 0) {
      const current = edgesToVisit.pop();
      if (!current) continue;

      const tileKey = `${current.tile.position.x},${current.tile.position.y}`;
      const edgeKey = `${tileKey}-${current.edge}`;

      if (visitedEdges.has(edgeKey)) {
        if (visitedEdges.size > 1) {
          isCircular = true;
          continue;
        }
      }
      visitedEdges.add(edgeKey);

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

      const connectingRoad = this.findConnectingRoad(nextTile, current.edge);
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

    // A road is complete if it has exactly 2 center endpoints OR if it's circular
    if (centerEndCount === 2 || isCircular) {
      return {
        length: visitedTiles.size,
        tiles: visitedTiles,
        positions: Array.from(visitedTiles).map((tile) => {
          const [x, y] = tile.split(',').map(Number);
          return { x, y };
        }),
      };
    }
    return null;
  }

  private findConnectingRoad(
    tile: PlacedTile,
    fromEdge: CityEdge
  ): RoadEntity | undefined {
    const oppositeEdge = this.getOppositeEdge(fromEdge);
    const roadEntity = tile.entities
      .filter((e) => e.type === 'road')
      .find((road) => {
        const rotatedFrom = this.rotateEdge(road.from, tile.orientation);
        const rotatedTo = this.rotateEdge(road.to, tile.orientation);
        return rotatedFrom === oppositeEdge || rotatedTo === oppositeEdge;
      });

    return roadEntity;
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
    const newIndex = (currentIndex + rotationCount) % 4;
    return edges[newIndex];
  }

  private getOppositeEdge(edge: CityEdge): CityEdge {
    const oppositeEdges = {
      top: 'bottom',
      right: 'left',
      bottom: 'top',
      left: 'right',
    } as const;
    return oppositeEdges[edge];
  }

  public placeTile(
    position: Pos
  ): { success: true; completedRoads: CompletedRoad[] } | { success: false } {
    if (this.deck.length === 0) return { success: false };

    const validPositions = this.getValidPositions();
    const isValidPosition = validPositions.some(
      (pos) => pos.x === position.x && pos.y === position.y
    );

    if (!isValidPosition) return { success: false };

    const [currentTile, ...remainingDeck] = this.deck;
    this.placedTiles.push({
      ...currentTile,
      position,
    });
    this.deck = remainingDeck;
    this.currentRotations = 0;

    const completedRoads = this.checkCompletedRoads(position);
    if (completedRoads.length > 0) {
      this.completedRoads.push(...completedRoads);
    }

    return { success: true, completedRoads };
  }

  public getCurrentTile(): TileEntity | null {
    return this.deck[0] || null;
  }

  public getPlacedTiles(): PlacedTile[] {
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

    this.deck = produce(this.deck, (draft) => {
      const [currentTile] = draft.splice(0, 1);
      currentTile.orientation = 'top';
      const insertIndex = Math.floor(Math.random() * draft.length);
      draft.splice(insertIndex, 0, currentTile);
    });

    this.currentRotations = 0;
  }

  public getScore(): number {
    return this.score;
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

  public getCompletedRoads(): CompletedRoad[] {
    return [...this.completedRoads];
  }
}
