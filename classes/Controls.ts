import { OrbitControls } from "three/examples/jsm/Addons.js";
import { Game } from "./Game";
import { MOUSE, Mesh } from "three";
import Tile from "./Tile";
import { Actions, TileStatus } from "../utils/Enums";
import { getRandomIntInRange, getMeshFromRaycast } from "../utils/Utils";
import WorldMap from "./WorldMap";
import anime from 'animejs';

const MOVEMENT = 4;
let daytime = true;
let animating = false;

export class Controls {
  game: Game;
  orbitControls: OrbitControls;
  currentMap: WorldMap;
  selectedTile: Mesh;
  selectedAction: Actions = Actions.SELECT_TILE;
  currentPath: Array<Tile>
  constructor(game: Game) {
    this.game = game;
    this.orbitControls = new OrbitControls(game.camera, game.renderer.domElement);
    this.orbitControls.dampingFactor = 0.05;
    this.orbitControls.enableDamping = true;
    this.orbitControls.listenToKeyEvents(window)
    this.orbitControls.mouseButtons = {
      LEFT: 0,
      MIDDLE: MOUSE.ROTATE,
      RIGHT: 0,
    }
  }
  update(): void {
    this.orbitControls.update();
  }
  setMap(currentMap: WorldMap): void {
    this.currentMap = currentMap;
  }
  handlePointerMove(event: PointerEvent): void {
    this.game.scene.children.forEach((element) => {
      if (element.userData instanceof Tile) {
        if (element.userData.status == TileStatus.HOVERED) {
          element.userData.setTileStatus(TileStatus.NORMAL, true);
        } else if (element.userData.status == TileStatus.TARGET) {
          element.userData.setTileStatus(TileStatus.REACHABLE, true);
        }
      }
    })
    const hoveredMesh = getMeshFromRaycast(event, this.game);
    let hovered = hoveredMesh?.userData as Tile
    if (!(hovered instanceof Tile) || (hovered.hasObstacle && !hovered.unit)) return;
    if (hovered.status == TileStatus.REACHABLE || hovered.status == TileStatus.PATH) {
      this.currentMap.applyStatusToTiles(TileStatus.PATH, TileStatus.REACHABLE);
      hovered.setTileStatus(TileStatus.TARGET);
      this.currentPath = this.currentMap.pathfinding.findPath(this.selectedTile.userData as Tile, hovered, 2)
      this.currentPath.forEach(element => {
        element.setTileStatus(TileStatus.PATH)
      });
    } else {
      hovered.setTileStatus(TileStatus.HOVERED);
      this.currentPath = [];
      this.currentMap.applyStatusToTiles(TileStatus.PATH, TileStatus.REACHABLE)
    }
  }
  handleMouseDown(event: MouseEvent): void {
    if (event.which == 1) {
      const originTile = this.selectedTile;
      this.selectedTile = getMeshFromRaycast(event, this.game) as Mesh;
      if (originTile && originTile.userData instanceof Tile) {
        originTile.userData.setTileStatus(TileStatus.NORMAL, true);
        this.currentMap.applyStatusToTiles(TileStatus.REACHABLE, TileStatus.NORMAL);
      };
      if (this.selectedTile.userData instanceof Tile) {
        if (this.selectedAction == Actions.MOVE_UNIT && this.selectedTile.userData.status == TileStatus.TARGET) {
          this.game.moveUnitMeshToTile(originTile, this.selectedTile);
          this.currentMap.moveUnitToTile(originTile.userData as Tile, this.selectedTile.userData);
          this.currentMap.clearStatusFromAllTiles();
          this.selectedAction = Actions.SELECT_TILE;
          return;
        }
        else if (this.selectedAction == Actions.SELECT_TILE && this.selectedTile.userData.unit) {
          this.selectedTile.userData.setTileStatus(TileStatus.SELECTED);
          const reachables = this.currentMap.pathfinding.getReachables(this.selectedTile.userData, MOVEMENT, 2);
          reachables.forEach((reachable) => {
            reachable.setTileStatus(TileStatus.REACHABLE);
          })
          this.selectedAction = Actions.MOVE_UNIT;
        } else {
          this.selectedAction = Actions.SELECT_TILE;
        }
      }
    }
  }
  handleKeyDown(event: KeyboardEvent): boolean {
    let sunBackground: HTMLElement = document.querySelector(".sun-background") as HTMLElement;
    let moonBackground: HTMLElement = document.querySelector(".moon-background") as HTMLElement;
    switch (event.key) {
      case 'Escape':
        this.game.quitGame();
        break;
      case 'r':
        this.game.cleanScene();
        let size = getRandomIntInRange(16, 30)
        let seaLevel = getRandomIntInRange(0, 5)
        let maxHeight = getRandomIntInRange(5, 10)
        let minHeight = getRandomIntInRange(0, 5);
        console.log({ size, seaLevel, maxHeight, minHeight })
        return true;

      case 'Enter':
        if (animating) return false;
        let anim;
        if (!daytime) {
          anim = [1, 0];
        } else {
          anim = [0, 1];
        }
        animating = true;
        let obj = { t: 0 };
        anime({
          targets: obj,
          t: anim,
          complete: () => {
            animating = false;
            daytime = !daytime;
          },
          update: () => {
            this.game.lights.sunLight.intensity = 3.5 * (1 - obj.t);
            this.game.lights.moonLight.intensity = 3.5 * obj.t;

            this.game.lights.sunLight.translateY(20 * (1 - obj.t));
            this.game.lights.moonLight.translateY(20 * obj.t);

            sunBackground.style.opacity = Number(1 - obj.t).toString();
            moonBackground.style.opacity = Number(obj.t).toString();
          },
          easing: 'easeInOutSine',
          duration: 500,
        })
        break;
      default:
        break;
    }
    return false;
  }
}