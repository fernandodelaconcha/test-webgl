import { Vector2 } from "three";
import Tile from "./Tile";
import { MapShape, TileStatus } from "../utils/Enums";
import { Pathfinding } from "./Pathfinding";
import { getGridPlacementByTeamIndex } from "../utils/Utils";
import { Unit } from "./Unit";


export default class WorldMap {
    shape: MapShape;
    size: number;
    seaLevel: number;
    maxHeight: number;
    tiles: Array<Tile>;
    pathfinding: Pathfinding;
    constructor(shape: MapShape, size: number = 15, seaLevel: number = 3, maxHeight: number = 10) {
        this.size = size;
        this.seaLevel = seaLevel;
        this.maxHeight = maxHeight;
        this.tiles = [];
    }
    setTiles(tiles: Array<Tile>): void {
        this.tiles = tiles;
        this.pathfinding = new Pathfinding(this.tiles);
    }
    getTileByIndex(index: Vector2): Tile {
        const tile: Tile | undefined = this.tiles.find((element) => {
            return element.index.x == index.x && element.index.y == index.y;
        });
        if (tile instanceof Tile) {
            return tile
        };

        return new Tile(new Vector2(999, 999), -99);
    }
    applyStatusToTiles(oldStatus: TileStatus, newStatus: TileStatus): void {
        this.tiles.forEach((element) => {
            if (element.status == oldStatus)
                element.setTileStatus(newStatus, true);
        })
    }
    clearStatusFromAllTiles() {
        this.tiles.forEach((element) => {
            element.setTileStatus(TileStatus.NORMAL, true);
        })
    }
    moveUnitToTile(origin: Tile, target: Tile) {
        const unit = origin.unit;
        this.removeUnit(origin);

        target.unit = unit as Unit;
        target.hasObstacle = true;
        target.unit.tile = target;
    }
    getRandomNonObstacleTileForTeam(teamIndex: number): Tile {
        const safeLimit = this.size - 5;
        let i: number;
        let j: number;
        [i, j] = getGridPlacementByTeamIndex(teamIndex, safeLimit);
        let tile: Tile = this.getTileByIndex(new Vector2(i, j));
        while(tile.height == -99 || tile.hasObstacle) {
            tile = this.getTileByIndex(new Vector2(i, j));
            i++;
            tile = this.getTileByIndex(new Vector2(i, j));
            j++;
        }
        return tile;
    }
    removeUnit(tile: Tile): void {
        tile.unit = null;
        tile.hasObstacle = false;
    }
    getAllTilesWithUnit(): Array<Tile> {
        const units : Array<Tile> = [];
        this.tiles.forEach(tile => {
            if (tile.unit) {
                units.push(tile);
            }
        })
        return units;
    }
    getEnemiesForUnit(unit: Unit): Array<Tile> {
        const units : Array<Tile> = [];
        this.tiles.forEach(tile => {
            if (tile.unit && tile.unit.team !== unit.team) {
                units.push(tile);
            }
        })
        return units;
    }
    getAlliesForUnit(unit: Unit): Array<Tile> {
        const units : Array<Tile> = [];
        this.tiles.forEach(tile => {
            if (tile.unit && tile.unit.team === unit.team) {
                units.push(tile);
            }
        })
        return units;
    }
};