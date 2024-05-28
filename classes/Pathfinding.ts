import { Vector2 } from "three";
import Tile from "./Tile";
import { Comparator, PriorityQueue, priorityTile } from "../utils/Queue";
import { isNeighborForEvenTile, isNeighborForOddTile } from "../utils/Utils";

export class Pathfinding {
    tiles: Array<Tile>;
    constructor(tiles: Array<Tile>) {
        this.tiles = tiles;
    }
    getTileNeighbors(target: Tile, heightDifference: number, includeObstacles?: boolean): Array<Tile> {
        let neighbors: Array<Tile> = [];
        if (target.index.y % 2 == 0) {
            this.tiles.forEach(tile => {
                if (isNeighborForEvenTile(tile, target) && (includeObstacles || !tile.hasObstacle) && Math.abs(tile.height - target.height) < heightDifference) {
                    neighbors.push(tile);
                }
            });
        } else {
            this.tiles.forEach(tile => {
                if (isNeighborForOddTile(tile, target) && (includeObstacles || !tile.hasObstacle) && Math.abs(tile.height - target.height) < heightDifference) {
                    neighbors.push(tile);
                }
            });
        }
        return neighbors;
    }
    getReachables(tile: Tile, pathLength: number, heightDifference: number): Array<Tile> {
        const reachables: Array<Tile> = [];
        this.findReachablesRecursively(tile, pathLength, heightDifference, reachables);
        return reachables;
    }
    findReachablesRecursively(tile: Tile, pathLength: number, heightDifference: number, reachables: Array<Tile>) {
        while (pathLength > 0) {
            pathLength--;
            this.getTileNeighbors(tile, heightDifference).forEach((neighbor: Tile) => {
                if (reachables.indexOf(neighbor) == -1) {
                    reachables.push(neighbor);
                }
                this.findReachablesRecursively(neighbor, pathLength, heightDifference, reachables);
            });
        }
    }
    convertToAxial(index: Vector2) {
        const q: number = index.x - (index.y - (index.y & 1)) / 2;
        const r: number = index.y;

        return new Vector2(q, r)
    }
    getCostBetweenTwoTiles(start: Tile, target: Tile): number {
        let axialStart: Vector2 = this.convertToAxial(start.index);
        let axialEnd: Vector2 = this.convertToAxial(target.index);
        let dx: number = Math.abs(axialStart.x - axialEnd.x);
        let dy: number = Math.abs(axialStart.y - axialEnd.y);
        let dz: number = Math.abs(axialStart.x + axialStart.y - axialEnd.x - axialEnd.y);

        return Math.floor((dx + dy + dz) / 2)
    }
    discoverPath(start: Tile, goal: Tile, heightDifference: number): Map<Tile, Tile | null> {
        const numberComparator: Comparator<any> = (A: priorityTile, B: priorityTile) => {
            return B.priority - A.priority;
        };
        let frontier = new PriorityQueue(numberComparator);
        frontier.add(new priorityTile(start, 0));
        const cameFrom: Map<Tile, Tile | null> = new Map();
        const costSoFar: Map<Tile, number> = new Map();
        cameFrom.set(start, null);
        costSoFar.set(start, 0);

        while (frontier.size > 0) {
            const current: Tile = frontier.poll().tile;
            if (current == goal)
                break;

            this.getTileNeighbors(current, heightDifference).forEach((next) => {
                const oldCost: number = (costSoFar.get(current) || 0);
                const newCost = oldCost + this.getCostBetweenTwoTiles(current, next);
                if (!costSoFar.has(next) || newCost < oldCost) {
                    costSoFar.set(next, newCost);
                    const priority = newCost + this.getCostBetweenTwoTiles(goal, next);
                    frontier.add(new priorityTile(next, priority));
                    cameFrom.set(next, current);
                }
            })
        }
        return cameFrom;

    }
    findPath(start: Tile, goal: Tile, heightDifference: number): Array<Tile> {
        const cameFrom: Map<Tile, Tile | null> = this.discoverPath(start, goal, heightDifference)
        const path: Array<Tile> = [];
        let current = goal;
        if (!cameFrom.has(goal)) {
            return path;
        }
        while (current != start) {
            path.push(current);
            current = cameFrom.get(current) as Tile;
        }
        path.push(start);
        return path.reverse();
    }
}