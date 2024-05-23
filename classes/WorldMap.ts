import { Vector2 } from "three";
import Tile from "./Tile";
import { MapShape, TileStatus } from "../utils/Enums";
import { Pathfinding } from "./Pathfinding";


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
        let tile: Tile | undefined = this.tiles.find((element) => {
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
        origin.unit = null;
        origin.hasObstacle = false;

        target.unit = unit;
        target.hasObstacle = true;        
    }
};