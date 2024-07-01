import { Raycaster, Vector2, Vector3 } from "three";
import Tile from "../classes/Tile";
import { Game } from "../classes/Game";
import { MapShape, UnitType } from "./Enums";

export interface pendingMovement {
  path: Vector3,
  start: Vector3,
  alpha: number,
  target: Vector3
}

export interface MeshToImport {
  type: UnitType,
  path: string,
}

export function getTileFromRaycast(event: MouseEvent, game: Game): Tile {
  const canvas = game.renderer.domElement;
  const raycaster = new Raycaster();
  const pointer = new Vector2(0, 0);
  pointer.x = ((event.clientX + canvas.offsetLeft) / canvas.width) * 2 - 1;
  pointer.y = - ((event.clientY - canvas.offsetTop) / canvas.height) * 2 + 1;

  raycaster.setFromCamera(pointer, game.camera);
  const intersects = raycaster.intersectObjects(game.scene.children);
  if (intersects.length > 0 && intersects[0].object && intersects[0].object.name == "Tile") {
    const tile = intersects[0].object.userData;
    if (tile instanceof Tile) {
      return tile;
    }
  }
  return {} as Tile;
}

export function isNeighborForEvenTile(tile: Tile, target: Tile): boolean {
  return tile.index.x == target.index.x - 1 && tile.index.y == target.index.y - 1 ||
    tile.index.x == target.index.x - 1 && tile.index.y == target.index.y ||
    tile.index.x == target.index.x - 1 && tile.index.y == target.index.y + 1 ||
    tile.index.x == target.index.x && tile.index.y == target.index.y + 1 ||
    tile.index.x == target.index.x + 1 && tile.index.y == target.index.y ||
    tile.index.x == target.index.x && tile.index.y == target.index.y - 1
}


export function isNeighborForOddTile(tile: Tile, target: Tile): boolean {
  return tile.index.x == target.index.x && tile.index.y == target.index.y - 1 ||
    tile.index.x == target.index.x - 1 && tile.index.y == target.index.y ||
    tile.index.x == target.index.x && tile.index.y == target.index.y + 1 ||
    tile.index.x == target.index.x + 1 && tile.index.y == target.index.y + 1 ||
    tile.index.x == target.index.x + 1 && tile.index.y == target.index.y ||
    tile.index.x == target.index.x + 1 && tile.index.y == target.index.y - 1
}

export function getRandomIntInRange(min: number, max: number): number {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function tileToPosition(tileX: number, tileY: number, shape: MapShape, size: number): Vector2 {
  let col: number;
  let row: number;
  if (shape == MapShape.CIRCLE) {
    col = tileX + (tileY & 1) / 2
    row = tileY
  } else {
    const x = tileX - size / 2
    const y = tileY - size / 2
    col = x + (y & 1) / 2
    row = y
  }
  return new Vector2(col * 1.77, row * 1.535);
}

export function getColorByTeamIndex(teamIndex: number): string {
  switch (teamIndex) {
    case 0:
      return 'blue'
    case 1:
      return 'red'
    case 2:
      return 'yellow'
    case 3:
      return 'green'
    case 4:
      return 'violet'
    case 5:
      return 'grey'
    case 6:
      return 'brown'
    default:
      return 'black'
  }
}

//receive instead of size max row and max col to better placement
export function getGridPlacementByTeamIndex(teamIndex: number, size: number): Vector2 {
  let i: number;
  let j: number;
  switch (teamIndex) {
    case 0:
      i = getRandomIntInRange(0, size / 4);
      j = getRandomIntInRange(0, size / 4);
      break;
    case 1:
      i = getRandomIntInRange(size * 3 / 4, size);
      j = getRandomIntInRange(size * 3 / 4, size);
      break;
    case 2:
      i = getRandomIntInRange(size * 3 / 4, size);
      j = getRandomIntInRange(0, size / 4);
      break;
    case 3:
      i = getRandomIntInRange(size / 2, size * 3 / 4);
      j = getRandomIntInRange(size / 2, size * 3 / 4);
      break;
    case 4:
      i = getRandomIntInRange(0, size / 4);
      j = getRandomIntInRange(size * 3 / 4, size);
      break;
    default:
      i = getRandomIntInRange(size, size);
      j = getRandomIntInRange(size, size);
      break;
  }
  return new Vector2(i, j);
}

export const meshesToImport: Array<MeshToImport> = [
  { type: UnitType.FROG, path: 'assets/meshes/toadder.glb' },
  { type: UnitType.HUMAN, path: 'assets/meshes/human.glb' },
  { type: UnitType.DRAGON, path: 'assets/meshes/dragon.glb' },
  { type: UnitType.SKELETON, path: 'assets/meshes/skeleton.glb' },
  { type: UnitType.WOMEN, path: 'assets/meshes/women.glb' }
];