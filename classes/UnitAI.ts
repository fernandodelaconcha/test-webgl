import { AIProfile } from "../utils/Enums";
import Tile from "./Tile";
import { Unit } from "./Unit";
import WorldMap from "./WorldMap";

import { Vector2 } from "three";

export class UnitAI {
    profile: AIProfile
    unit: Unit
    map: WorldMap;
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
        return reachables[6];
    }

    findClosestIndexToTargetsAvoidMelee(reachables: Array<Tile>, targets: Array<Tile>): Tile {
        return {} as Tile;
    }
    
    findFarthestIndexFromTargets(reachables: Array<Tile>, targets: Array<Tile>): Tile {
        return {} as Tile;
    }

    getBestIndexInReachables(reachables: Array<Tile>): Tile{
        let targets: Array<Tile>;
        switch (this.profile) {
            case AIProfile.AGGRESIVE:
                targets = this.findEnemiesInMap();
                return this.findClosestIndexToTargets(reachables, targets);
            case AIProfile.RANGED:
                targets = this.findEnemiesInMap();
                return this.findClosestIndexToTargetsAvoidMelee(reachables, targets);
            case AIProfile.SUPPORT:
                targets = this.findAlliesInMap();
                return this.findClosestIndexToTargets(reachables, targets);
            default:
                return this.unit.tile;
        }
    }

}