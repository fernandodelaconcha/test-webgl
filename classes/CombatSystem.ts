import { Game } from "./Game";
import { Mesh, MeshBasicMaterial, SphereGeometry, Vector2, Vector3 } from "three";
import Tile from "./Tile";
import { Action, TileStatus } from "../utils/Enums";
import { getColorByTeamIndex } from "../utils/Utils";
import WorldMap from "./WorldMap";
import { Player } from "./Player";
import { Unit } from "./Unit";

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

    constructor(game: Game) {
        this.game = game;
    }
    setMap(currentMap: WorldMap): void {
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
        this.currentMap.applyStatusToTiles(TileStatus.PATH, TileStatus.REACHABLE)
    }
    setPathStatus(hovered: Tile) {
        const unit = this.selectedTile.unit as Unit;
        this.currentPath = this.currentMap.pathfinding.findPath(this.selectedTile, hovered, unit.verticalMovement);
        this.currentPath.forEach(element => {
            element.setTileStatus(TileStatus.PATH)
        });
    }
    spawnUnit(currentMap: WorldMap, team: number) {
        let randomTile = currentMap.getRandomNonObstacleTileForTeam(team);
        if (randomTile.height == -99) randomTile = currentMap.getRandomNonObstacleTileForTeam(team);
        const position: Vector3 = this.game.getMeshById(randomTile.id)['position']
        this.createUnit(randomTile, team, new Vector2(position.x, position.z))
    }
    createUnit(tile: Tile, team: number, position: Vector2): void {
        tile.unit = new Unit(this.currentMap, team, 'unit', 30, 2);
        tile.unit.tile = tile;
        tile.hasObstacle = true;
        let geo = new SphereGeometry(.5);

        const color = getColorByTeamIndex(team);
        let mesh = new Mesh(geo, new MeshBasicMaterial({ color }));
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.name = 'Tile';
        mesh['position'].set(position.x, tile.height + .5, position.y);
        mesh.userData = {
            pendingMovements: []
        }
        tile.unit.id = mesh.uuid;
        this.game.scene.add(mesh);
    }
    moveUnit(originTile: Tile, targetTile: Tile) {
        this.game.moveUnitMeshToTile(this.currentPath);
        this.currentMap.moveUnitToTile(originTile, targetTile);
        this.currentMap.clearStatusFromAllTiles();
        this.selectedAction = Action.SELECT_TILE;
        this.selectedTile = targetTile;
    }
    unitCombatTurn() {
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
    unitMovement(unit: Unit, reachables: Array<Tile>) {
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
    unitGetAttackRange(unit: Unit) {
        if (this.players.findIndex(player => player.team == unit.team) !== -1) {
            this.currentMap.pathfinding.getTileNeighbors(unit.tile, unit.verticalMovement, true).forEach((reachable) => {
                reachable.setTileStatus(TileStatus.ATTACKZONE);
            })
            this.selectedAction = Action.ATTACK;
        }
    }
    unitAttack(origin: Unit, target: Unit) {
        if (origin && target) {
            this.game.cleanUnitMesh(target.id as string);
            this.currentMap.removeUnit(target.tile);
        }
        this.unitCombatTurn();
    }
}