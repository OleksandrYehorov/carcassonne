import { produce } from 'immer';
import {
  CityEntity,
  Edge,
  Orientation,
  PlacedTile,
  Pos,
  RoadEntity,
  TileEntity,
} from './types';
import { shuffleDeck } from './deck';

export class GameEngine {
  private placedTiles: PlacedTile[];
  private deck: TileEntity[];
  private currentRotations: number;

  constructor(startTile: TileEntity, deck: TileEntity[]) {
    // Initialize with start tile at center
    this.placedTiles = [
      {
        ...startTile,
        position: { x: 0, y: 0 },
      },
    ];
    this.deck = shuffleDeck(deck);
    this.currentRotations = 0;
  }

  private getEdgesFromEntities(
    entities: (RoadEntity | CityEntity)[]
  ): [Edge, Edge, Edge, Edge] {
    const edges: Edge[] = [
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
        if (entity.from !== 'center') {
          edges[edgeToIndex[entity.from]] = { type: 'road' };
        }
        if (entity.to !== 'center') {
          edges[edgeToIndex[entity.to]] = { type: 'road' };
        }
      }
    });

    return edges as [Edge, Edge, Edge, Edge];
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
    const rotatedEdges = [...baseEdges];

    for (let i = 0; i < rotationCount; i++) {
      rotatedEdges.unshift(rotatedEdges.pop()!);
    }

    return rotatedEdges as [Edge, Edge, Edge, Edge];
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

  public placeTile(position: Pos): boolean {
    if (this.deck.length === 0) return false;

    const validPositions = this.getValidPositions();
    const isValidPosition = validPositions.some(
      (pos) => pos.x === position.x && pos.y === position.y
    );

    if (!isValidPosition) return false;

    const [currentTile, ...remainingDeck] = this.deck;
    this.placedTiles.push({
      ...currentTile,
      position,
    });
    this.deck = remainingDeck;
    this.currentRotations = 0;

    return true;
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
}
