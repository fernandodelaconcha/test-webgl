import { ACESFilmicToneMapping, Color, DirectionalLight, PerspectiveCamera, Scene, WebGLRenderer } from "three";
import Tile from "./Tile";
import { TileStatus } from "../Enums";
import { Mesh } from "three";

export class Game {

  scene: Scene
  camera: PerspectiveCamera
  renderer: WebGLRenderer
  lights: {
    sunLight: DirectionalLight
    moonLight: DirectionalLight
  }
  isGameOver: boolean

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
    this.addLights();
  }
  setRendererOptions(innerWidth: number, innerHeight: number): void {
    this.renderer.setPixelRatio(devicePixelRatio);
    this.renderer.setSize(innerWidth, innerHeight);
    this.renderer.toneMapping = ACESFilmicToneMapping;
  }
  addLights(): void {
    const sunLight = new DirectionalLight(new Color("#FFCB8E").convertSRGBToLinear(), 3.5);
    sunLight.translateZ(10);
    sunLight.translateY(20);
    sunLight.translateZ(10);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 512;
    sunLight.shadow.mapSize.height = 512;
    sunLight.shadow.camera.near = .5;
    sunLight.shadow.camera.far = 100;
    sunLight.shadow.camera.left = -10;
    sunLight.shadow.camera.bottom = -10;
    sunLight.shadow.camera.top = 10;
    sunLight.shadow.camera.right = 10;

    const moonLight = new DirectionalLight(new Color("#77ccff").convertSRGBToLinear(), 0);
    moonLight.translateZ(-10);
    moonLight.translateY(20);
    moonLight.translateZ(10);
    moonLight.castShadow = true;
    moonLight.shadow.mapSize.width = 512;
    moonLight.shadow.mapSize.height = 512;
    moonLight.shadow.camera.near = .5;
    moonLight.shadow.camera.far = 100;
    moonLight.shadow.camera.left = -10;
    moonLight.shadow.camera.bottom = -10;
    moonLight.shadow.camera.top = 10;
    moonLight.shadow.camera.right = 10;

    this.scene.add(sunLight);
    this.scene.add(moonLight);
    this.lights = {
      sunLight: sunLight,
      moonLight: moonLight
    }
  }
  render(): void {
    this.renderer.render(this.scene, this.camera);
    this.scene.children.forEach((object) => {
      if (object instanceof Mesh && object.userData instanceof Tile) {
        switch (object.userData.status) {
          case TileStatus.FOV:
            object.material.color.set(0x000000);
            break;
          case TileStatus.TARGET:
            object.material.color.set(0x0000ff);
            break;
          case TileStatus.PATH:
            object.material.color.set(0xC5E223);
            break;
          case TileStatus.REACHABLE:
            object.material.color.set(0x03adfc);
            break;
          case TileStatus.SELECTED:
            object.material.color.set(0xff0000);
            break;
          case TileStatus.HOVERED:
            object.material.color.set(0xffff00);
            break;
          default:
            object.material.color.set("white");
            break;
        }
      }
    });
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