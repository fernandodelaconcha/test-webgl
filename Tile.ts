import { Texture, Vector2, CylinderGeometry, Mesh, MeshNormalMaterial } from "three";

export default class Tile {
    index: Vector2;
    texture: Texture;
    height: number;
    material: MeshNormalMaterial;
    hasObstacle: boolean;
    constructor (index: Vector2, height: number){
        this.index = index;
        this.height = Math.round(height);
    };
    tileToPosition(tileX: number, tileY: number) {
      return new Vector2((tileX + (tileY % 2) * .5) * 1.77, tileY * 1.535)
    }

    createMesh(material: MeshNormalMaterial) {
        let position = this.tileToPosition(this.index.x, this.index.y)
        let geo = new CylinderGeometry(1, 1, this.height, 6, 1, false);
        geo.translate(position.x, this.height * 0.5, position.y);
            
        let mesh = new Mesh(geo, material);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.name = 'Tile';
    
        return mesh;
    }
}