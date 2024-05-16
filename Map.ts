import Tile from "./Tile";

export default class Map {
    size: number;
    seaLevel: number;
    maxHeight: number;
    tiles: Array<Tile>;
    constructor(size: number = 15, seaLevel: number = 3, maxHeight: number = 10) {
        this.size = size;
        this.seaLevel = seaLevel;
        this.maxHeight = maxHeight;
    }
};