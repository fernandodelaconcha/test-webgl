import { Vector2 } from "three";
import Tile from "./Tile";
import { TileStatus } from "./Enums";

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
    getCostBetweenTwoTiles(start: Tile, target: Tile): number {
        let resultX = Math.floor(Math.abs(start.index.x - target.index.x));
        let resultY = Math.floor(Math.abs(start.index.y - target.index.y));
        const result = resultX + resultY;
        
        return result;
    }
    findPath(start: Tile, goal: Tile, heightDifference: number) {
        const path = this.discoverPath(start, goal, heightDifference);
        const ret: Array<Tile> = []
        
        const filteredPath = path
        // const filteredPath = path?.filter((value, index, self) =>
        //     index === self.findIndex((t) => (
        //       t.estimate === value.estimate && t.cost === value.cost
        //     ))
        //   )
        filteredPath?.forEach((e: any) => {
            ret.push(e.state as Tile)
        })
        
        return ret;

    }
    discoverPath(start: Tile, goal: Tile, heightDifference: number) {
        // Create an empty data structure to store the explored paths
        let explored: Array<any> = [];
        // Create a data structure to store the paths that are being explored
        let frontier = [{
        state: start,
        cost: 0,
        estimate: this.getCostBetweenTwoTiles(start, goal)
        }];
    
        // While there are paths being explored
        while (frontier.length > 0) {
        // Sort the paths in the frontier by cost, with the lowest-cost paths first
        frontier.sort(function(a, b) {
            return a.estimate- b.estimate;
        })

        // Choose the lowest-cost path from the frontier
        let node = frontier.shift();

        if (!node) return;
    
        // Add this nodeto the explored paths
        explored.push(node);
        // If this nodereaches the goal, return thenode 
        if (node.state.index.x == goal.index.x && node.state.index.y == goal.index.y) {
            return explored
        }
    
        // Generate the possible next steps from this node's state
        let next = this.getTileNeighbors(node.state, heightDifference).map(e => {
            return {
                state: e,
                cost: 1,
            }
        });
    
        // For each possible next step
        for (let i = 0; i < next.length; i++) {
            // Calculate the cost of the next step by adding the step's cost to the node's cost
            let step = next[i];
            let cost = step.cost + node.cost;
    
            // Check if this step has already been explored
            let isExplored = (explored.find( e => {
                return e.state.index.x == step.state.index.x && 
                    e.state.index.y == step.state.index.y
            }))

            //avoid repeated nodes during the calculation of neighbors
            let isFrontier = (frontier.find( e => {
                return e.state.index.x == step.state.index.x && 
                    e.state.index.y == step.state.index.y
            }))


            // If this step has not been explored
            if (!isExplored && !isFrontier) {
                let estimate = cost + this.getCostBetweenTwoTiles(step.state, goal)
            // Add the step to the frontier, using the cost and the heuristic function to estimate the total cost to reach the goal
            frontier.push({
                state: step.state,
                cost: cost,
                estimate
            });
            }
        }
        }
        // If there are no paths left to explore, return null to indicate that the goal cannot be reached
        return null;
    }
};