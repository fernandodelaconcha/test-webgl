import { Vector2 } from "three";
import { TextureType, TileStatus } from "./Enums";

export default class Tile {
    index: Vector2;
    height: number;
    texture: TextureType;
    hasObstacle: boolean;
    status: TileStatus;
    constructor (index: Vector2, height: number){
        this.index = index;
        this.height = Math.round(height);
        this.hasObstacle = false;
        this.resetTileStatus()
    };
    setTileStatus(status: TileStatus) {
        if (status > this.status) {
            this.status = status;
        }
    }
    resetTileStatus() {
        this.status = TileStatus.NORMAL;
    }
}