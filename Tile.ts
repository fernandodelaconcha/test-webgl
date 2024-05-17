import { Vector2 } from "three";
import { TextureType } from "./Enums";

export default class Tile {
    index: Vector2;
    height: number;
    texture: TextureType;
    hasObstacle: boolean;
    constructor (index: Vector2, height: number){
        this.index = index;
        this.height = Math.round(height);
        this.hasObstacle = false;
    };
}