import { Vector2 } from "three";
import Tile from "./Tile";
import { TileStatus } from "./Enums";

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
    getReachables(tile: Tile, pathLength: number, heightDifference: number): void {
        while (pathLength > 0) {
            pathLength--;
            let neighbors = this.getTileNeighbors(tile, heightDifference);
            neighbors.forEach((neighbor: Tile) => {
                    neighbor.setTileStatus(TileStatus.REACHABLE); 
                    this.getReachables(neighbor, pathLength, heightDifference);
            });
        }
    }
    applyStatusToTiles(oldStatus: TileStatus.REACHABLE, newStatus: TileStatus): void {
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
    getCostBetweenTwoTiles(start: Tile, target: Tile): number {
        //there is still a problem with diff on axis y and x on calculating cost (adds up 1 extra)

        let resultAX = (start.index.x + (start.index.y % 2) * .5)
        let resultAY = start.index.y
        let resultBX = (target.index.x + (target.index.y % 2) * .5)
        let resultBY = target.index.y
        let resultX = Math.floor(Math.abs(resultAX - resultBX));
        let resultY = Math.floor(Math.abs(resultAY - resultBY));
        const result = resultX + resultY;
        return result;
    }
    findPath(length: number, start: Tile, target: Tile): Array<Tile> {
        const path: Array<Tile> = [];
        let lastPosition = start;

        for (let i = 0; i < length; i++) {
            lastPosition = this.getBestNeighbor(lastPosition, target);
            path.push(lastPosition)
        }
        return path;
    }
    getBestNeighbor(start: Tile, target: Tile): Tile {
        let efford = this.getCostBetweenTwoTiles(start, target);
        const neighbors = this.getTileNeighbors(start, 99);
        let bestNeighbor: Tile = neighbors[0];
        neighbors.forEach(neighbor => {
            let neighborEfford = this.getCostBetweenTwoTiles(neighbor, target);
            if (neighborEfford < efford){
                bestNeighbor = neighbor;
                efford = neighborEfford
            }
        })
        return bestNeighbor;
    }
};