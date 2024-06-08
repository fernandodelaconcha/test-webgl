import { AIProfile } from "../utils/Enums";
import Tile from "./Tile";
import { Unit } from "./Unit";
import WorldMap from "./WorldMap";

export class UnitAI {
    profile: AIProfile
    unit: Unit
    map: WorldMap;
    preferredRange: number;
    constructor(map: WorldMap, profile: AIProfile = AIProfile.AGGRESIVE) {
        this.profile = profile;
        this.map = map;
    }

    findAlliesInMap(): Array<Tile> {
        return this.map.getAlliesForUnit(this.unit);
    }

    findEnemiesInMap(): Array<Tile> {
        return this.map.getEnemiesForUnit(this.unit);
    }

    findClosestIndexToTargets(reachables: Array<Tile>, targets: Array<Tile>): Tile {
        let closestIndex: Tile = reachables[0];
        let minDistance: number = 999;
        reachables.forEach(reachable => {
            targets.forEach(target => {
                const distance = this.map.pathfinding.getCostBetweenTwoTiles(reachable, target);
                if (distance < minDistance && distance > this.preferredRange){
                    minDistance = distance;
                    closestIndex = reachable;
                }
            })
        })
        return closestIndex;
    }
    
    findFarthestIndexFromTargets(reachables: Array<Tile>, targets: Array<Tile>): Tile {
        let farthestIndex: Tile = reachables[0];
        let maxDistance: number = 0;
        reachables.forEach(reachable => {
            targets.forEach(target => {
                const distance = this.map.pathfinding.getCostBetweenTwoTiles(reachable, target);
                if (distance > maxDistance){
                    maxDistance = distance;
                    farthestIndex = reachable;
                }
            })
        })
        return farthestIndex;
    }

    getBestIndexInReachables(reachables: Array<Tile>): Tile{
        let targets: Array<Tile>;
        switch (this.profile) {
            case AIProfile.AGGRESIVE:
                targets = this.findEnemiesInMap();
                return this.findClosestIndexToTargets(reachables, targets);
            case AIProfile.RANGED:
                targets = this.findEnemiesInMap();
                this.preferredRange = 3;
                return this.findClosestIndexToTargets(reachables, targets);
            case AIProfile.SUPPORT:
                targets = this.findAlliesInMap();
                return this.findClosestIndexToTargets(reachables, targets);
            case AIProfile.COWARD:
                targets = this.findEnemiesInMap();
                return this.findFarthestIndexFromTargets(reachables, targets);
            default:
                return this.unit.tile;
        }
    }

}