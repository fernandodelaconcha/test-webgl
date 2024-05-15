import { Texture, Vector2, CylinderGeometry, SphereGeometry, MeshBasicMaterial, Mesh } from "three";
import { BufferGeometryUtils } from 'three/examples/jsm/Addons.js';

export default class Tile {
    index: Vector2;
    texture: Texture;
    height: number;
    constructor (index: Vector2, height: number){
        this.index = index;
        this.height = height;
    };
    tileToPosition(tileX: number, tileY: number) {
      return new Vector2((tileX + (tileY % 2) * .5) * 1.77, tileY * 1.535)
    }

    createMesh() {
        let position = this.tileToPosition(this.index.x, this.index.y)
        let geo = new CylinderGeometry(1, 1, this.height, 6, 1, false);
        geo.translate(position.x, this.height * 0.5, position.y);
        
        let material = new MeshBasicMaterial({
            color: 'white'
        })
    
        let mesh = new Mesh(geo, material);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
    
        return mesh;
    }
}