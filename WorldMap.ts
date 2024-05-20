import { Vector2 } from "three";
import Tile from "./Tile";
import { TileStatus } from "./Enums";
import { Comparator, PriorityQueue, priorityTile } from "./Queue";


export default class WorldMap {
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
        if (tile.index.y % 2 == 0) {
            this.tiles.forEach(element => {
                if (
                    element.index.x == tile.index.x - 1 && element.index.y == tile.index.y - 1 ||
                    element.index.x == tile.index.x - 1 && element.index.y == tile.index.y ||
                    element.index.x == tile.index.x - 1 && element.index.y == tile.index.y  + 1 ||
                    element.index.x == tile.index.x && element.index.y == tile.index.y + 1 ||
                    element.index.x == tile.index.x + 1 && element.index.y == tile.index.y ||
                    element.index.x == tile.index.x && element.index.y == tile.index.y - 1
                 ){
                    if (!element.hasObstacle && Math.abs(element.height - tile.height) < heightDifference)
                        neighbors.push(element);
                }
            });
        } else {
            this.tiles.forEach(element => {
                if (
                    element.index.x == tile.index.x && element.index.y == tile.index.y - 1 ||
                    element.index.x == tile.index.x - 1 && element.index.y == tile.index.y ||
                    element.index.x == tile.index.x && element.index.y == tile.index.y  + 1 ||
                    element.index.x == tile.index.x + 1 && element.index.y == tile.index.y + 1 ||
                    element.index.x == tile.index.x + 1 && element.index.y == tile.index.y ||
                    element.index.x == tile.index.x + 1 && element.index.y == tile.index.y - 1
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
    convertToAxial(index: Vector2) {
        const q: number= index.x - (index.y - (index.y&1)) / 2;
        const r: number = index.y;
    
        return new Vector2(q, r)
    }
    getCostBetweenTwoTiles(start: Tile, target: Tile): number {
        let starto: Vector2 = this.convertToAxial(start.index);
        let endo: Vector2 = this.convertToAxial(target.index);
        let dx: number = Math.abs(starto.x - endo.x);
        let dy: number = Math.abs(starto.y - endo.y);
        let dz: number = Math.abs(starto.x + starto.y - endo.x - endo.y);

        return Math.floor((dx + dy + dz) / 2)
    }
    discoverPath(start: Tile, goal: Tile, heightDifference: number): Map<Tile, Tile|null> {
        const numberComparator: Comparator<any> = (A: priorityTile, B: priorityTile) => {
            return  B.priority - A.priority;
          };
        let frontier = new PriorityQueue(numberComparator);
        frontier.add(new priorityTile(start, 0));
        const came_from: Map<Tile, Tile|null> = new Map()
        const cost_so_far: Map<Tile, number> = new Map()
        came_from.set(start, null)
        cost_so_far.set(start, 0)

        while(frontier.size > 0){
            const current: Tile = frontier.poll().tile;

            if (current == goal)
                break
            
            this.getTileNeighbors(current, heightDifference).forEach((next) => {
                const new_cost = (cost_so_far.get(current) || 0) + this.getCostBetweenTwoTiles(current, next);
                let cost: number = cost_so_far.get(next) as number;
                if (!cost_so_far.has(next) || new_cost < cost) {
                    cost_so_far.set(next, new_cost);
                    const priority = new_cost + this.getCostBetweenTwoTiles(goal, next)
                    frontier.add(new priorityTile(next, priority))
                    came_from.set(next,current)
                }
            })
        }
        return came_from
        
    }
    findPath(start: Tile, goal: Tile, heightDifference: number): Array<Tile> {
        const came_from: Map<Tile, Tile | null> = this.discoverPath(start, goal, heightDifference)
        const path: Array<Tile> = [];
        let current = goal;
        if (!came_from.has(goal)) {
            return path; // no path can be found
        }
        while (current != start) {
            path.push(current);
            current = came_from.get(current) as Tile;
        }
        return path;
    }
};