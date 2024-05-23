import { Vector2 } from "three";
import { TextureType, TileStatus } from "./Enums";

export default class Tile {
    index: Vector2;
    height: number;
    texture: TextureType;
    hasObstacle: boolean;
    status: TileStatus;
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