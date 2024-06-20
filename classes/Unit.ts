import { BufferGeometry, Mesh, MeshBasicMaterial, SphereGeometry, Vector2 } from "three";
import { getColorByTeamIndex } from "../utils/Utils";
import { AIProfile, UnitType } from "../utils/Enums";
import Tile from "./Tile";
import { UnitAI } from "./UnitAI";
import WorldMap from "./WorldMap";

export class Unit {
    id: string;
    team: number;
    type: UnitType;
    attack: number;
    maxHp: number;
    currentHp: number;
    AI: UnitAI;
    tile: Tile;
    verticalMovement: number;
    geometry: BufferGeometry;
    constructor(map: WorldMap, team: number, type: UnitType, maxHp: number, verticalMovement: number) {
        this.team = team;
        this.type = type;
        this.maxHp = maxHp;
        this.currentHp = maxHp;
        this.attack = 2;
        this.AI = new UnitAI(map, AIProfile.AGGRESIVE);
        this.AI.unit = this;
        this.verticalMovement = verticalMovement;
    }
    displayUnitOnInterface() {
        const name: HTMLElement = document.querySelector("#name") as HTMLElement;
        const health: HTMLElement = document.querySelector("#health") as HTMLElement;
        const attack: HTMLElement = document.querySelector("#attack") as HTMLElement;
        const items: HTMLElement = document.querySelector("#items") as HTMLElement;

        name.innerText = UnitType[this.type].toString();
        health.innerText = `${this.currentHp} / ${this.maxHp}`;
        attack.innerText = this.attack.toString();
    }
    createMesh(geometry: BufferGeometry, position: Vector2): Mesh {
        const geo = geometry;
        const color = getColorByTeamIndex(this.team);
        const mesh = new Mesh(geo, new MeshBasicMaterial({ color }));
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.name = 'Tile';
        mesh['position'].set(position.x, this.tile.height + .5, position.y);
        mesh.userData = {
            pendingMovements: []
        }
        return mesh;
    }
}