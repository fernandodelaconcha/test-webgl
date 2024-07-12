import { ACESFilmicToneMapping, AnimationClip, AnimationMixer, Color, DirectionalLight, Group, MeshPhysicalMaterial, Object3D, Object3DEventMap, PerspectiveCamera, Scene, Vector3, WebGLRenderer } from "three";
import Tile from "./Tile";
import { TileStatus, UnitType } from "../utils/Enums";
import { Mesh } from "three";
import { Unit } from "./Unit";
import { Player } from "./Player";
import { GLTFLoader, SkeletonUtils } from "three/examples/jsm/Addons.js";
import WorldMap from "./WorldMap";
import { meshesToImport } from "../utils/Utils";

export class Game {
  scene: Scene;
  camera: PerspectiveCamera;
  renderer: WebGLRenderer;
  sunLight: DirectionalLight;
  moonLight: DirectionalLight;
  isGameOver: boolean;
  players: Array<Player> = [];
  mixers: Array<AnimationMixer> = [];
  animations: Map<UnitType, Array<AnimationClip>>;
  models: Map<UnitType, Group<Object3DEventMap>>;

  constructor(canvas: HTMLElement, innerWidth: number, innerHeight: number, near: number = .1, far: number = 1000) {
    this.scene = new Scene();
    this.camera = new PerspectiveCamera(45, innerWidth / innerHeight, near, far);
    this.camera.translateY(25);
    this.camera.translateZ(25);
    this.renderer = new WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true
    });
    this.animations = new Map();
    this.models = new Map();
    this.setRendererOptions(innerWidth, innerHeight);
    this.sunLight = this.addLight("#FFCB8E", 3.5, new Vector3(10, 20, 10));
    this.moonLight = this.addLight("#77ccff", 0, new Vector3(-10, 20, 10));
    this.addPlayer('Player');
    this.addPlayer('Enemy');
  }

  async loadModels(): Promise<void> {
    await Promise.all(meshesToImport.map(async (mesh) => {
      const loader = new GLTFLoader();
      const gltf = await loader.loadAsync(mesh.path, (xhr) => {
        console.log(`model: ${UnitType[mesh.type]} loading: ${(xhr.loaded / xhr.total * 100)}% loaded`);
      });
      const animations: Map<string, AnimationClip> = new Map();
      gltf.animations.forEach((animation: AnimationClip) => {
        animations.set(animation.name, animation);
      })
      this.models.set(mesh.type, gltf.scene);
      this.animations.set(mesh.type, gltf.animations);
    }));
  }

  setRendererOptions(innerWidth: number, innerHeight: number): void {
    this.renderer.setPixelRatio(devicePixelRatio);
    this.renderer.setSize(innerWidth, innerHeight);
    this.renderer.toneMapping = ACESFilmicToneMapping;
  }
  addLight(color: string, intensity: number, position: Vector3): DirectionalLight {
    const light = new DirectionalLight(new Color(color).convertSRGBToLinear(), intensity);
    light.translateX(position.x);
    light.translateY(position.y);
    light.translateZ(position.z);
    light.castShadow = true;
    light.shadow.mapSize.width = 512;
    light.shadow.mapSize.height = 512;
    light.shadow.camera.near = .5;
    light.shadow.camera.far = 100;
    light.shadow.camera.left = -10;
    light.shadow.camera.bottom = -10;
    light.shadow.camera.top = 10;
    light.shadow.camera.right = 10;
    this.scene.add(light);

    return light;
  }

  addPlayer(playerName: string): void {
    this.players.push(new Player(playerName, this.players.length));
  }

  removePlayer(playerTeam: number): void {
    const index = this.players.findIndex((player) => {
      return player.team == playerTeam
    });
    this.players.splice(index, 1);
  }

  getMeshById(id: string): Mesh {
    return this.scene.getObjectByProperty('uuid', id) as Mesh
  }
  render(delta: number): void {
    delta /= 100;
    this.scene.children.forEach((object) => {
      if (object.userData instanceof Tile) {
        this.updateTileColor(object as Mesh);
      } else if (object.userData instanceof Unit) {
        object.userData.render(object as Mesh, delta);
      }
    });
    this.renderer.render(this.scene, this.camera);
  }
  updateTileColor(object: Mesh) {
    const material = object.material as MeshPhysicalMaterial;
    switch (object.userData.status) {
      case TileStatus.FOW:
        material.color.setHex(0x000000);
        break;
      case TileStatus.TARGET:
        material.color.setHex(0x0000ff);
        break;
      case TileStatus.ATTACKTARGET:
        material.color.setHex(0xff0000);
        break;
      case TileStatus.ATTACKZONE:
        material.color.setHex(0xf57373);
        break;
      case TileStatus.PATH:
        material.color.setHex(0xC5E223);
        break;
      case TileStatus.REACHABLE:
        material.color.setHex(0x03adfc);
        break;
      case TileStatus.SELECTED:
        material.color.setHex(0x477344);
        break;
      case TileStatus.HOVERED:
        material.color.setHex(0xffff00);
        break;
      default:
        material.color.setHex(0xffffff);
        break;
    }
  }
  createUnit(unitType: UnitType, currentMap: WorldMap, team: number): void {
    let tile = currentMap.getRandomNonObstacleTileForTeam(team);
    if (tile.height == -99) tile = currentMap.getRandomNonObstacleTileForTeam(team);
    const position: Vector3 = this.getMeshById(tile.id)['position'];

    const mesh = meshesToImport.find(unit => unit.type == unitType);
    if (!mesh) return;
    tile.unit = new Unit(currentMap, team, unitType, 30, 2);
    tile.unit.tile = tile;
    tile.hasObstacle = true;
    const model: Object3D = SkeletonUtils.clone(this.models.get(unitType) as Object3D);

    tile.unit.createModelData(model, position)
    tile.unit.createAnimationData(this.animations.get(unitType) as AnimationClip[])

    this.scene.add(model);
  }

  moveUnitMeshToTile(tiles: Array<Tile>) {
    const unit: Unit = tiles[0].unit as Unit;
    let originTileMesh: Mesh;
    tiles.forEach(tile => {
      const tileMesh = this.getMeshById(tile.id);
      if (originTileMesh) {
        this.moveUnitMesh(unit, originTileMesh, tileMesh)
      }
      originTileMesh = tileMesh;
    })
  }
  moveUnitMesh(unit: Unit, originTileMesh: Mesh, targetTileMesh: Mesh) {
    const unitMesh = this.getMeshById(unit.id);
    const originIndex: Vector3 = new Vector3(originTileMesh['position'].x, originTileMesh['position'].y * 2, originTileMesh['position'].z);
    const targetIndex: Vector3 = new Vector3(targetTileMesh['position'].x, targetTileMesh['position'].y * 2, targetTileMesh['position'].z);

    unitMesh.userData.pendingMovements.push({
      path: targetIndex.sub(originIndex),
      start: new Vector3(),
      alpha: 0,
      target: targetTileMesh.position
    })
  }
  cleanUnitMesh(id: string): void {
    const unit = this.getMeshById(id);
    this.scene.remove(unit);
  }
  cleanScene(): void {
    let objects = this.scene.getObjectsByProperty('name', 'Tile');
    objects = objects.concat(this.scene.getObjectsByProperty('name', 'Cloud'));
    objects = objects.concat(this.scene.getObjectsByProperty('name', 'Tree'));
    objects = objects.concat(this.scene.getObjectsByProperty('name', 'Stone'));
    objects = objects.concat(this.scene.getObjectsByProperty('name', 'Container'));
    for (let i = 0; i < objects.length; i++) {
      this.scene.remove(objects[i]);
    }
  }
  quitGame(): void {
    this.cleanScene();
    this.renderer.render(this.scene, this.camera);
    this.isGameOver = true;
  }
}