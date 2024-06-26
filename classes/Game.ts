import { ACESFilmicToneMapping, Color, DirectionalLight, MeshPhysicalMaterial, PerspectiveCamera, Scene, Vector3, WebGLRenderer } from "three";
import Tile from "./Tile";
import { TileStatus } from "../utils/Enums";
import { Mesh } from "three";
import { Unit } from "./Unit";
import { pendingMovement } from "../utils/Utils";
import { Player } from "./Player";

export class Game {

  scene: Scene;
  camera: PerspectiveCamera;
  renderer: WebGLRenderer;
  sunLight: DirectionalLight;
  moonLight: DirectionalLight;
  isGameOver: boolean;
  players: Array<Player> = [];

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
    this.setRendererOptions(innerWidth, innerHeight);
    this.sunLight = this.addLight("#FFCB8E", 3.5, new Vector3(10, 20, 10));
    this.moonLight = this.addLight("#77ccff", 0, new Vector3(-10, 20, 10));
    this.addPlayer('Player');
    this.addPlayer('Enemy');
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
    this.scene.children.forEach((object) => {
      if (!(object instanceof Mesh)) return;
      if (object.userData instanceof Tile) {
        this.updateTileColor(object);
      } else if (object.userData.pendingMovements && object.userData.pendingMovements.length > 0) {
        this.updateUnitMovement(object, delta);
      }
    });
    this.renderer.render(this.scene, this.camera);
  }
  updateTileColor(object: Mesh) {
    const material = object.material as MeshPhysicalMaterial;
    switch (object.userData.status) {
      case TileStatus.FOV:
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
  updateUnitMovement(object: Mesh, delta: number) {
    const pendingMovements: Array<pendingMovement> = object.userData.pendingMovements
    const pendingMovement = pendingMovements[0];
    object.lookAt(pendingMovement.target)

    pendingMovement.start.lerp(pendingMovement.path, pendingMovement.alpha)
    object.position.x += (pendingMovement.start.x / 6);
    object.position.y += (pendingMovement.start.y / 6);
    object.position.z += (pendingMovement.start.z / 6);

    if (pendingMovement.alpha < 1) {
      pendingMovement.alpha += delta / 100;
    } else {
      
      object.position.x += (pendingMovement.start.x - pendingMovement.path.x)
      object.position.y += (pendingMovement.start.y - pendingMovement.path.y)
      object.position.z += (pendingMovement.start.z - pendingMovement.path.z)

      object.userData.pendingMovements.shift();
    }
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
      target: new Vector3(targetTileMesh['position'].x, targetTileMesh['position'].y * 2, targetTileMesh['position'].z)
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