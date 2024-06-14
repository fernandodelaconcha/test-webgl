import { AIProfile } from "../utils/Enums";
import Tile from "./Tile";
import { UnitAI } from "./UnitAI";
import WorldMap from "./WorldMap";

export class Unit {
    id: string;
    team: number;
    type: string;
    attack: number;
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
        this.attack = 2;
        this.AI = new UnitAI(map, AIProfile.AGGRESIVE);
        this.AI.unit = this;
        this.verticalMovement = verticalMovement
    }
    displayUnitOnInterface(){
        const name: HTMLElement = document.querySelector("#name") as HTMLElement;
        const health: HTMLElement = document.querySelector("#health") as HTMLElement;
        const attack: HTMLElement = document.querySelector("#attack") as HTMLElement;
        const items: HTMLElement = document.querySelector("#items") as HTMLElement;

        name.innerText = this.type;
        health.innerText = `${this.currentHp} / ${this.maxHp}`;
        attack.innerText = this.attack.toString();
    }
}