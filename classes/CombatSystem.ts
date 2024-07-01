import { Game } from "./Game";
import { BufferGeometry, Vector2, Vector3, Object3D } from "three";
import Tile from "./Tile";
import { Action, TileStatus, UnitType } from "../utils/Enums";
import WorldMap from "./WorldMap";
import { Player } from "./Player";
import { Unit } from "./Unit";
import { GLTFLoader } from "three/examples/jsm/Addons.js";
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';

import { meshesToImport } from "../utils/Utils";

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
    geometries: Map<UnitType, BufferGeometry>

    constructor(game: Game) {
        this.game = game;
        this.geometries = new Map();
    }
    async setMap(currentMap: WorldMap): Promise<void> {
        // GLTFLoader is asynchronous. Either you pass callbacks around, or one uses loadAsync + async/await.
        // Here the second approach is used and await until everything is loaded
        await this.instantiateMeshes();
        this.currentMap = currentMap;

        this.players.push(new Player('heroes', 0));
        //this.players.push(new Player('antiheroes', 1));
        this.spawnUnit(currentMap, 0);
        this.spawnUnit(currentMap, 1);
        this.spawnUnit(currentMap, 1);
        this.spawnUnit(currentMap, 1);
        this.spawnUnit(currentMap, 1);
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
    async instantiateMeshes(): Promise<void> {
        const loader = new GLTFLoader();
        // Make explicit the scope "this" refers to (inside the arrow function + Promise (async) is not clear what "this" refers to) 
        // For each mesh, create a Promise (with async), inside it wait until loaded the file, and await for all the meshes to be loaded
        await Promise.all(meshesToImport.map(async (mesh) => {
            console.log(mesh.path)
            const gltf = await loader.loadAsync(mesh.path, (xhr) => { console.log((xhr.loaded / xhr.total * 100) + '% loaded'); });
            // Collect all the per-file BufferGeometries by traversing all the scene(s) in the file, and then  
            // merge them into one single BufferGeometry that is stored in the geometries map
            const bufferGeoms: BufferGeometry[] = [];
            const traverseCb = (obj: Object3D) => {
                if (obj['geometry'] && obj['geometry'].isBufferGeometry){
                    bufferGeoms.push(obj['geometry']);
                }
            };
            gltf.scenes.forEach((scene) => scene.traverse((obj) => traverseCb(obj)));
            // console.log(bufferGeoms); // Here you will see each file has multiple BufferGeometries in it
            const merged = BufferGeometryUtils.mergeGeometries(bufferGeoms, false);
            // console.log('Merged BufferGeometry: ', merged);
            this.geometries.set(mesh.type, merged);
        }));
    }
    spawnUnit(currentMap: WorldMap, team: number): void {
        let randomTile = currentMap.getRandomNonObstacleTileForTeam(team);
        if (randomTile.height == -99) randomTile = currentMap.getRandomNonObstacleTileForTeam(team);
        const position: Vector3 = this.game.getMeshById(randomTile.id)['position']
        this.createUnit(randomTile, team, new Vector2(position.x, position.z))
    }
    createUnit(tile: Tile, team: number, position: Vector2): void {
        tile.unit = new Unit(this.currentMap, team, UnitType.DRAGON, 30, 2);
        tile.unit.tile = tile;
        tile.hasObstacle = true;
        const geometry = this.geometries.get(tile.unit.type);
        if (!geometry) return;
        const mesh = tile.unit.createMesh(geometry, position);
        tile.unit.id = mesh.uuid;
        this.game.scene.add(mesh);
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
