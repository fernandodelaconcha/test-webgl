import { Texture, Vector2, CylinderGeometry, Mesh, MeshNormalMaterial } from "three";

export default class Tile {
    index: Vector2;
    height: number;
    material: MeshNormalMaterial;
    hasObstacle: boolean;
    constructor (index: Vector2, height: number){
        this.index = index;
        this.height = Math.round(height);
        this.hasObstacle = false;
    };
}