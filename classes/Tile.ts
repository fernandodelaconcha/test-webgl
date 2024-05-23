import { Vector2 } from "three";
import { TextureType, TileStatus } from "../utils/Enums";
import { Unit } from "./Unit";

export default class Tile {
    id: string;
    index: Vector2;
    height: number;
    texture: TextureType;
    hasObstacle: boolean;
    status: TileStatus;
    unit: null | Unit;
    constructor(index: Vector2, height: number) {
        this.index = index;
        this.height = Math.round(height);
        this.hasObstacle = false;
        this.status = TileStatus.NORMAL;
    };
    setTileStatus(status: TileStatus, force?: boolean) {
        if (status > this.status || force) {
            this.status = status;
        }
    }
}