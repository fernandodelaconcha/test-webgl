import { Game } from "./Game";
import { Vector3, AnimationClip, AnimationMixer, MeshBasicMaterial, Clock } from "three";
import Tile from "./Tile";
import { Action, TileStatus, UnitType } from "../utils/Enums";
import WorldMap from "./WorldMap";
import { Player } from "./Player";
import { Unit } from "./Unit";
import { GLTFLoader } from "three/examples/jsm/Addons.js";

import { getColorByTeamIndex, meshesToImport } from "../utils/Utils";

//move with unit fatigue
const MOVEMENT = 4;

export class CombatSystem {
    game: Game;
    players: Array<Player> = [];
    currentMap: WorldMap;
    turnOrder: Array<Tile>;
    selectedTile: Tile;
    selectedAction: Action = Action.SELECT_TILE;
    currentPath: Array<Tile>;
    currentUnitIndex: number;
    clock: Clock;

    constructor(game: Game) {
        this.game = game;
        this.clock = new Clock()
    }
    async setMap(currentMap: WorldMap): Promise<void> {
        // GLTFLoader is asynchronous. Either you pass callbacks around, or one uses loadAsync + async/await.
        // Here the second approach is used and await until everything is loaded
        this.currentMap = currentMap;

        this.players.push(new Player('heroes', 0));
        //this.players.push(new Player('antiheroes', 1));
        await this.createUnit(UnitType.WOMEN, currentMap, 0);
        await this.createUnit(UnitType.FROG, currentMap, 1);
        await this.createUnit(UnitType.SKELETON,currentMap, 1);
        await this.createUnit(UnitType.FROG,currentMap, 1);
        await this.createUnit(UnitType.DRAGON,currentMap, 1);
        this.unitCombatTurn();
    }
    cleanCurrentPath() {
        this.currentPath = [];
        this.currentMap?.applyStatusToTiles(TileStatus.PATH, TileStatus.REACHABLE)
    }
    setPathStatus(hovered: Tile) {
        const unit = this.selectedTile.unit as Unit;
        this.currentPath = this.currentMap.pathfinding.findPath(this.selectedTile, hovered, unit.verticalMovement);
        this.currentPath.forEach(element => {
            element.setTileStatus(TileStatus.PATH)
        });
    }
    async createUnit(unitType: UnitType, currentMap: WorldMap, team: number): Promise<void> {
        let tile = currentMap.getRandomNonObstacleTileForTeam(team);
        if (tile.height == -99) tile = currentMap.getRandomNonObstacleTileForTeam(team);
        const position: Vector3 = this.game.getMeshById(tile.id)['position'];
        const loader = new GLTFLoader();

        const mesh = meshesToImport.find(unit => unit.type == unitType);
        if (!mesh) return;

        const gltf = await loader.loadAsync(mesh.path, (xhr) => { console.log((xhr.loaded / xhr.total * 100) + '% loaded'); });
        gltf.animations.forEach((animation: AnimationClip) => {
            this.game.mixer = new AnimationMixer(gltf.scene);
            const clip = this.game.mixer.clipAction(animation);
            clip.reset().play();
        })
        
        tile.unit = new Unit(this.currentMap, team, unitType, 30, 2);
        tile.unit.tile = tile;
        tile.hasObstacle = true;
        gltf.scene.userData = tile.unit;
        const color = getColorByTeamIndex(team);
        const material = new MeshBasicMaterial({ color });
        gltf.scene.castShadow = true;
        gltf.scene.receiveShadow = true;
        gltf.scene.name = 'Unit';
        gltf.scene['position'].set(position.x, tile.height, position.z);
        gltf.scene.userData['pendingMovements'] = []
        tile.unit.id = gltf.scene.uuid;

        this.game.scene.add(gltf.scene);
    }
    moveUnit(originTile: Tile, targetTile: Tile): void {
        this.game.moveUnitMeshToTile(this.currentPath);
        this.currentMap.moveUnitToTile(originTile, targetTile);
        this.currentMap.clearStatusFromAllTiles();
        this.selectedAction = Action.SELECT_TILE;
        this.selectedTile = targetTile;
    }
    unitCombatTurn(): void {
        this.setCurrentUnitAndIndex();
        const unit = this.selectedTile.unit as Unit;
        if (!(unit instanceof Unit)) {
            return;
        }
        const reachables = this.currentMap.pathfinding.getReachables(this.selectedTile, MOVEMENT, unit.verticalMovement);
        this.unitMovement(unit, reachables);
    }
    setCurrentUnitAndIndex(): void {
        if (!this.selectedTile || this.currentUnitIndex == this.turnOrder.length - 1) {
            this.turnOrder = this.currentMap.getAllTilesWithUnit();
            this.selectedTile = this.turnOrder[0];
            this.currentUnitIndex = 0;
        }
        else {
            this.currentUnitIndex++;
            this.selectedTile = this.turnOrder[this.currentUnitIndex]
        }
    }
    unitMovement(unit: Unit, reachables: Array<Tile>): void {
        if (this.players.findIndex(player => player.team == unit.team) !== -1) {
            this.selectedTile.setTileStatus(TileStatus.SELECTED);
            reachables.forEach((reachable) => {
                reachable.setTileStatus(TileStatus.REACHABLE);
            })
            this.selectedAction = Action.MOVE_UNIT;
        }
        else {
            const targetTile: Tile = unit.AI.getBestIndexInReachables(reachables) as Tile;
            this.currentPath = this.currentMap.pathfinding.findPath(this.selectedTile, targetTile, unit.verticalMovement);
            this.moveUnit(this.selectedTile, targetTile as Tile);

            setTimeout(() => {
                const target: Tile = this.currentMap.pathfinding.getTileNeighbors(targetTile, unit.verticalMovement, true).find(neighbor => neighbor.unit?.team != unit.team) as Tile;
                this.unitAttack(unit, target.unit as Unit);
            }, 1000);
        }
    }
    unitGetAttackRange(unit: Unit): void {
        if (this.players.findIndex(player => player.team == unit.team) !== -1) {
            this.currentMap.pathfinding.getTileNeighbors(unit.tile, unit.verticalMovement, true).forEach((reachable) => {
                reachable.setTileStatus(TileStatus.ATTACKZONE);
            })
            this.selectedAction = Action.ATTACK;
        }
    }
    unitAttack(origin: Unit, target: Unit): void {
        if (origin && target) {
            this.game.cleanUnitMesh(target.id as string);
            this.currentMap.removeUnit(target.tile);
        }
        this.unitCombatTurn();
    }
}
