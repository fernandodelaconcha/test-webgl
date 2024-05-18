import { Vector2 } from "three";
import Tile from "./Tile";

export default class Map {
    size: number;
    seaLevel: number;
    maxHeight: number;
    tiles: Array<Tile>;
    constructor(size: number = 15, seaLevel: number = 3, maxHeight: number = 10) {
        this.size = size;
        this.seaLevel = seaLevel;
        this.maxHeight = maxHeight;
        this.tiles = [];
    }
    getTileByIndex(index: Vector2): Tile {
        let tile: Tile | undefined = this.tiles.find((element) => {
            return element.index.x == index.x && element.index.y == index.y;
        });
        if (tile instanceof Tile) {
            return tile
        };

        return new Tile(new Vector2(999,999), -99);
    }
    getTileNeighbors(tile: Tile, heightDifference: number): Array<Tile> {
        let neighbors: Array<Tile> = [];
        if (tile.index.y == 0) {
            this.tiles.forEach(element => {
                if (
                    element.index.x == tile.index.x && element.index.y == tile.index.y + 1 ||
                    element.index.x == tile.index.x && element.index.y == tile.index.y - 1 ||
                    element.index.x == tile.index.x + 1 && element.index.y == tile.index.y - 1 ||
                    element.index.x == tile.index.x + 1 && element.index.y == tile.index.y ||
                    element.index.x == tile.index.x - 1 && element.index.y == tile.index.y ||
                    element.index.x == tile.index.x - 1 && element.index.y == tile.index.y + 1
                 ){
                    if (!element.hasObstacle && Math.abs(element.height - tile.height) < heightDifference)
                        neighbors.push(element);
                }
            });
        }
        else if (tile.index.y % 2 == 1 || (tile.index.y < 0 && tile.index.y % 2 == 0)) {
            this.tiles.forEach(element => {
                if (
                    element.index.x == tile.index.x && element.index.y == tile.index.y + 1 ||
                    element.index.x == tile.index.x && element.index.y == tile.index.y - 1 ||
                    element.index.x == tile.index.x + 1 && element.index.y == tile.index.y - 1 ||
                    element.index.x == tile.index.x + 1 && element.index.y == tile.index.y ||
                    element.index.x == tile.index.x - 1 && element.index.y == tile.index.y ||
                    element.index.x == tile.index.x + 1 && element.index.y == tile.index.y + 1
                 ){
                    if (!element.hasObstacle && Math.abs(element.height - tile.height) < heightDifference)
                        neighbors.push(element);
                }
            });
        } else {
            this.tiles.forEach(element => {
                if (
                    element.index.x == tile.index.x - 1 && element.index.y == tile.index.y - 1 ||
                    element.index.x == tile.index.x - 1 && element.index.y == tile.index.y ||
                    element.index.x == tile.index.x - 1 && element.index.y == tile.index.y + 1 ||
                    element.index.x == tile.index.x && element.index.y == tile.index.y + 1||
                    element.index.x == tile.index.x + 1 && element.index.y == tile.index.y ||
                    element.index.x == tile.index.x && element.index.y == tile.index.y - 1
                 ){
                    if (!element.hasObstacle && Math.abs(element.height - tile.height) < heightDifference)
                        neighbors.push(element);
                }
            });
        }
        return neighbors;
    }
};