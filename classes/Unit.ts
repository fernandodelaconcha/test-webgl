import Tile from "./Tile";
import { UnitAI } from "./UnitAI";
import WorldMap from "./WorldMap";

export class Unit {
    id: string;
    team: number;
    type: string;
    maxHp: number;
    currentHp: number;
    AI: UnitAI;
    tile: Tile;
    verticalMovement: number;
    constructor(map: WorldMap, team: number, type: string, maxHp: number, verticalMovement: number) {
        this.team = team;
        this.type = type;
        this.maxHp = maxHp;
        this.currentHp = maxHp;
        this.AI = new UnitAI(map);
        this.AI.unit = this;
        this.verticalMovement = verticalMovement
    }
}