import { OrbitControls } from "three/examples/jsm/Addons.js";
import { Game } from "./Game";
import { MOUSE } from "three";
import Tile from "./Tile";
import { TileStatus } from "./Enums";
import { getRandomIntInRange, getTileFromRaycast } from "./Utils";
import WorldMap from "./WorldMap";
import anime from 'animejs';

const MOVEMENT = 4;
let daytime = true;
let animating = false;

export class Controls {
  game: Game
  orbitControls: OrbitControls
  currentMap: WorldMap
  selectedTile: Tile
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
    let hovered = getTileFromRaycast(event, this.game);
    if (!hovered || hovered.hasObstacle) return;
    if (hovered.status == TileStatus.REACHABLE || hovered.status == TileStatus.PATH) {
      this.currentMap.applyStatusToTiles(TileStatus.PATH, TileStatus.REACHABLE);
      hovered.setTileStatus(TileStatus.TARGET);
      const path = this.currentMap.pathfinding.findPath(this.selectedTile, hovered, 2)
      path.forEach(element => {
        element.setTileStatus(TileStatus.PATH)
      });
    } else {
      hovered.setTileStatus(TileStatus.HOVERED);
    }
  }
  handleMouseDown(event: MouseEvent): void {
    if (event.which == 1) {
      const originTile = this.selectedTile;
      this.selectedTile = getTileFromRaycast(event, this.game) as Tile;
      if (originTile) {
        originTile.setTileStatus(TileStatus.NORMAL, true);
        this.currentMap.applyStatusToTiles(TileStatus.REACHABLE, TileStatus.NORMAL);
      };
      if (this.selectedTile instanceof Tile && !this.selectedTile.hasObstacle) {
        originTile?.setTileStatus(TileStatus.NORMAL)
        if (this.selectedTile.status == TileStatus.TARGET) {
          this.currentMap.clearStatusFromAllTiles();
          return;
        }
        this.selectedTile.setTileStatus(TileStatus.SELECTED);
        const reachables = this.currentMap.pathfinding.getReachables(this.selectedTile, MOVEMENT, 2);
        reachables.forEach((reachable) => {
          reachable.setTileStatus(TileStatus.REACHABLE);
        })
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