import { createNoise2D } from 'simplex-noise';
import Tile from './Tile';
import Map from './Map';
import { Vector2, CylinderGeometry, Color, SphereGeometry, Mesh, MeshPhysicalMaterial, Scene, DoubleSide, TextureLoader, MeshStandardMaterial, MeshBasicMaterial, Texture } from 'three';
import { BufferGeometryUtils } from 'three/examples/jsm/Addons.js';
import Alea from 'alea';
import { TextureType } from './Enums';

const STONE_CONSTANT = .8;
const DIRT_CONSTANT = .7;
const GRASS_CONSTANT = .5;
const SAND_CONSTANT = .3;

const STONE_TEXTURE: Texture = await new TextureLoader().loadAsync("assets/stone.png");
const DIRT_TEXTURE: Texture = await new TextureLoader().loadAsync("assets/dirt.png");
const GRASS_TEXTURE: Texture = await new TextureLoader().loadAsync("assets/grass.jpg");
const SAND_TEXTURE: Texture = await new TextureLoader().loadAsync("assets/sand.jpg");
const DIRT2_TEXTURE: Texture = await new TextureLoader().loadAsync("assets/dirt2.jpg");
const WATER_TEXTURE: Texture = await new TextureLoader().loadAsync("assets/water.jpg");

export function tileToPosition(tileX: number, tileY: number) {
  return new Vector2((tileX + (tileY % 2) * .5) * 1.77, tileY * 1.535)
}
export default class MapGenerator {
  envmap: Texture;
  scene: Scene;
  constructor(envmap: Texture, scene: Scene) {
    this.envmap = envmap;
    this.scene = scene;
  }
  createMap(size: number = 15, seaLevel: number = 3, maxHeight: number = 10, minHeight: number = 0): Map {
    const seed = window.crypto.randomUUID();
    const noise2D = createNoise2D(Alea(seed));
    const map = new Map(size, seaLevel, maxHeight);
    for (let i = 0 - size; i < size; i++) {
      for (let j = 1 - size; j < size; j++) {
        const position = tileToPosition(i, j);

        if (position.length() > size) continue;
        let noise = (noise2D(i * 0.1, j * 0.1) + 1) * 0.5;
        noise = Math.pow(noise, 1.5);

        const height = Math.round(noise * maxHeight + minHeight);
        if (height < seaLevel) continue;

        const tile = new Tile(new Vector2(i, j), height);
        const textureType = this.getRandomTexture(height, maxHeight);
        tile.texture = textureType;
        this.createObstacle(textureType, tile, height);
        map.tiles.push(tile);

        const mesh = this.createTile(tile, this.createMaterial(textureType));
        this.scene.add(mesh);
      }
    }
    this.createSea(size, seaLevel);
    this.createContainer(size, seaLevel);
    this.createFloor(size, maxHeight);
    this.createClouds(Math.floor(Math.pow(Math.random(), .45) * size / 3), size);
    
    return map;
  }
  createTile(tile: Tile, material: MeshPhysicalMaterial): Mesh {
    let position = tileToPosition(tile.index.x, tile.index.y);
    let geo = new CylinderGeometry(1, 1, tile.height, 6, 1, false);
    geo.translate(position.x, tile.height * 0.5, position.y);

    let mesh = new Mesh(geo, material as unknown as MeshBasicMaterial);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.name = 'Tile';
    mesh.userData = tile;

    return mesh;
  }

  createMaterial(textureType: TextureType): MeshPhysicalMaterial {
    let map = this.getTextureFromTextureType(textureType);
    let material = new MeshPhysicalMaterial({
      envMap: this.envmap,
      envMapIntensity: 0.135,
      flatShading: true,
      map
    });

    return material;
  }

  createSea(size: number, seaLevel: number): void {
    let texture = this.getTextureFromTextureType(TextureType.WATER_TEXTURE);
    let seaMesh: Mesh = new Mesh(
      new CylinderGeometry(size + 1, size + 1, seaLevel + 0.1, 50),
      new MeshPhysicalMaterial({
        envMap: this.envmap,
        color: new Color("#55aaff").convertSRGBToLinear().multiplyScalar(3),
        ior: 1.4,
        transmission: 1,
        transparent: true,
        thickness: 1.5,
        envMapIntensity: 0.2,
        roughness: 1,
        metalness: 0.025,
        roughnessMap: texture,
        metalnessMap: texture,
      }) as unknown as MeshBasicMaterial
    );
    seaMesh.receiveShadow = true;
    seaMesh['position'].set(0, seaLevel - 1, 0);
    this.scene.add(seaMesh);
  }
  createContainer(size: number, seaLevel: number): void {
    let mapContainer = new Mesh(
      new CylinderGeometry(size + 1.1, size + 1.1, seaLevel + 1, 50, 1, true),
      new MeshPhysicalMaterial({
        envMap: this.envmap,
        map: this.getTextureFromTextureType(TextureType.DIRT_TEXTURE),
        envMapIntensity: 0.2,
        side: DoubleSide,
      }) as unknown as MeshBasicMaterial
    );
    mapContainer.receiveShadow = true;
    mapContainer['position'].set(0, seaLevel - 1, 0);
    this.scene.add(mapContainer);
  }
  createFloor(size: number, maxHeight: number): void {
    let mapFloor = new Mesh(
      new CylinderGeometry(size + 2.5, size + 2.5, maxHeight * 0.1, 50),
      new MeshPhysicalMaterial({
        envMap: this.envmap,
        map: this.getTextureFromTextureType(TextureType.DIRT2_TEXTURE),
        envMapIntensity: 0.1,
        side: DoubleSide,
      }) as unknown as MeshBasicMaterial
    );
    mapFloor.receiveShadow = true;
    mapFloor['position'].set(0, - maxHeight * .05, 0);
    this.scene.add(mapFloor);
  }
  createTree(height: number, position: Vector2): void {
    const treeHeight = Math.random() * 1 + 1.25;

    const geo1 = new CylinderGeometry(0, 1.5, treeHeight, 3);
    geo1.translate(position.x, height + treeHeight * 0 + 1, position.y);
    const geo2 = new CylinderGeometry(0, 1.15, treeHeight, 3);
    geo2.translate(position.x, height + treeHeight * 0.6 + 1, position.y);
    const geo3 = new CylinderGeometry(0, 0.8, treeHeight, 3);
    geo3.translate(position.x, height + treeHeight * 1.25 + 1, position.y);

    const geo = BufferGeometryUtils.mergeGeometries([geo1, geo2, geo3]);
    const mesh = new Mesh(
      geo,
      new MeshPhysicalMaterial({
        envMap: this.envmap,
        envMapIntensity: 0.75,
        flatShading: true,
        map: this.getTextureFromTextureType(TextureType.GRASS_TEXTURE)
      }) as unknown as MeshBasicMaterial
    );
    mesh.name = "Tree";
    this.scene.add(mesh);
  }

  createStone(height: number, position: Vector2, count: number): void {
    let geos: Array<SphereGeometry> = [];
    for (let i = 0; i < count; i++) {
      const geo1 = new SphereGeometry(Math.random() * .4 + .3, 7, 7, 0,  Math.PI*2, 0, Math.PI / 2);
      const displacementX = Math.random() * .5 * (Math.round(Math.random()) ? 1 : -1);
      const displacementY = Math.random() * .5 * (Math.round(Math.random()) ? 1 : -1);
      geo1.translate(position.x + displacementX, height, position.y + displacementY);
      geos.push(geo1);
    }
    const geo = BufferGeometryUtils.mergeGeometries(geos) as SphereGeometry;
    const mesh = new Mesh(
      geo,
      new MeshPhysicalMaterial({
        envMap: this.envmap,
        envMapIntensity: 0.75,
        flatShading: true,
        map: this.getTextureFromTextureType(TextureType.STONE_TEXTURE),
      }) as unknown as MeshBasicMaterial
    );
    mesh.name = "Stone";
    this.scene.add(mesh);
  }

  createClouds(count: number, mapSize: number): void {
    let geo = new SphereGeometry(0, 0, 0);
    for (let i = 0; i < count; i++) {
      const puff1 = new SphereGeometry(1.2, 7, 7);
      const puff2 = new SphereGeometry(1.5, 7, 7);
      const puff3 = new SphereGeometry(.9, 7, 7);
  
      puff1.translate(-1.85, Math.random() * .3, 0);
      puff2.translate(0, Math.random() * .3, 0);
      puff3.translate(1.85, Math.random() * .3, 0);
  
      const cloudGeo = BufferGeometryUtils.mergeGeometries([puff1, puff2, puff3]);
      cloudGeo.translate(
        Math.random() * mapSize - 10,
        Math.random() * 4 + 15,
        Math.random() * mapSize - 10,
      );
      cloudGeo.rotateY(Math.random() * Math.PI * 2);
      geo = BufferGeometryUtils.mergeGeometries([geo, cloudGeo]) as SphereGeometry;
    }
  
    const mesh = new Mesh(
      geo,
      new MeshStandardMaterial({
        envMap: this.envmap,
        envMapIntensity: .75,
        flatShading: true,
      }) as unknown as MeshBasicMaterial
    );
    mesh.name = "Cloud";
    this.scene.add(mesh);
  }

  getRandomTexture(height: number, maxHeight: number): TextureType {
    if (height > STONE_CONSTANT * maxHeight) {
      return TextureType.STONE_TEXTURE;
    } else if (height > DIRT_CONSTANT * maxHeight) {
      return TextureType.DIRT_TEXTURE;
    } else if (height > GRASS_CONSTANT * maxHeight) {
      return TextureType.GRASS_TEXTURE;
    } else if (height > SAND_CONSTANT * maxHeight) {
      return TextureType.SAND_TEXTURE;
    } else 
      return TextureType.DIRT2_TEXTURE;
  }
  
  getTextureFromTextureType(textureType: TextureType): Texture {
    switch (textureType) {
      case TextureType.STONE_TEXTURE:
        return STONE_TEXTURE;
      case TextureType.DIRT_TEXTURE:
        return DIRT_TEXTURE;
      case TextureType.GRASS_TEXTURE:
        return GRASS_TEXTURE;
      case TextureType.SAND_TEXTURE:
        return SAND_TEXTURE;
      case TextureType.DIRT2_TEXTURE:
        return DIRT2_TEXTURE;
      case TextureType.WATER_TEXTURE:
        return WATER_TEXTURE;
    }
  }

  createObstacle(textureType: TextureType, tile: Tile, height: number): void {
    let position = tileToPosition(tile.index.x, tile.index.y);
    if (Math.random() > 0.8) {
      switch(textureType){
        case (TextureType.SAND_TEXTURE):
        case (TextureType.STONE_TEXTURE):
          this.createStone(Math.round(height), position, Math.floor(Math.pow(Math.random(), .45) * 3 + 1));
          tile.hasObstacle = true;
          break;
        case (TextureType.DIRT_TEXTURE):
        case (TextureType.GRASS_TEXTURE):
          this.createTree(Math.round(height), position);
          tile.hasObstacle = true;
          break;
      }
    }
  }
}
