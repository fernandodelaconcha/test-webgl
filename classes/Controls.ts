import { OrbitControls } from "three/examples/jsm/Addons.js";
import { Game } from "./Game";
import { MOUSE, Object3D } from "three";
import Tile from "./Tile";
import { Action, TileStatus } from "../utils/Enums";
import { getTileFromRaycast } from "../utils/Utils";
import WorldMap from "./WorldMap";
import { DayNightControls } from "./DayNightControls";
import { CombatSystem } from "./CombatSystem";
import { Unit } from "./Unit";

export class Controls {
  game: Game;
  combatSystem: CombatSystem;
  orbitControls: OrbitControls;
  dayNightControls: DayNightControls;

  constructor(game: Game) {
    this.game = game;
    this.combatSystem = new CombatSystem(game);
    this.orbitControls = new OrbitControls(game.camera, game.renderer.domElement);
    this.orbitControls.dampingFactor = 0.05;
    this.orbitControls.enableDamping = true;
    this.orbitControls.listenToKeyEvents(window)
    this.orbitControls.mouseButtons = {
      LEFT: 0,
      MIDDLE: MOUSE.ROTATE,
      RIGHT: 0,
    }
    this.dayNightControls = new DayNightControls();
  }
  update(): void {
    this.orbitControls.update();
  }
  setMap(currentMap: WorldMap): void {
    this.combatSystem.setMap(currentMap);
  }
  handlePointerMove(event: PointerEvent): void {
    this.cleanTileStatesFromScene();
    const hoveredMesh = getTileFromRaycast(event, this.game);
    const hovered = hoveredMesh as Tile
    if (!(hovered instanceof Tile)) return;
    this.combatSystem.cleanCurrentPath()
    if (hovered.status == TileStatus.REACHABLE || hovered.status == TileStatus.PATH) {
      hovered.setTileStatus(TileStatus.TARGET);
      this.combatSystem.setPathStatus(hovered);
    } else if (hovered.status == TileStatus.ATTACKZONE) {
      hovered.setTileStatus(TileStatus.ATTACKTARGET);
    } else {
      hovered.setTileStatus(TileStatus.HOVERED);
    }
  }
  handleMouseDown(event: MouseEvent): void {
    if (event.which == 1) {
      const originTile = this.combatSystem.selectedTile;
      const targetTile = getTileFromRaycast(event, this.game);
      if (this.combatSystem.selectedAction == Action.MOVE_UNIT && targetTile.status == TileStatus.TARGET) {
        this.combatSystem.moveUnit(originTile, targetTile);
        this.combatSystem.unitGetAttackRange(targetTile.unit as Unit);
      } else if (this.combatSystem.selectedAction == Action.ATTACK && targetTile.status == TileStatus.ATTACKTARGET) {
        this.combatSystem.unitAttack(originTile.unit as Unit, targetTile.unit as Unit);
      }
    }
  }
  handleKeyDown(event: KeyboardEvent): void {
    switch (event.key) {
      case 'Escape':
        this.game.quitGame();
        break;
      case 'Enter':
        this.dayNightControls.animate(this.game);
        break;
      default:
        break;
    }
  }
  cleanTileStatesFromScene(): void {
    this.game.scene.children.forEach((element: Object3D) => {
      if (element.userData instanceof Tile) {
        if (element.userData.status == TileStatus.HOVERED) {
          element.userData.setTileStatus(TileStatus.NORMAL, true);
        } else if (element.userData.status == TileStatus.TARGET) {
          element.userData.setTileStatus(TileStatus.REACHABLE, true);
        } else if (element.userData.status == TileStatus.ATTACKTARGET) {
          element.userData.setTileStatus(TileStatus.ATTACKZONE, true);
        }
      }
    })
  }
}