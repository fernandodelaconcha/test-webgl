import './style.css';
import * as THREE from 'three';
import anime from 'animejs';
import { RGBELoader } from 'three/examples/jsm/Addons.js';
import { OrbitControls } from 'three/examples/jsm/Addons.js';
import Tile from './Tile';
import { PMREMGenerator } from 'three/src/extras/PMREMGenerator.js';
import MapGenerator from './MapGenerator';
import { Actions, TileStatus } from './Enums';
import { getTileFromRaycast } from './Utils'

let sunBackground = document.querySelector(".sun-background");
let moonBackground = document.querySelector(".moon-background");
let canvas = document.querySelector('#bg');

const MOVEMENT = 4;

// let sunBackground : HTMLElement = document.querySelector(".sun-background") as HTMLElement;
// let moonBackground : HTMLElement = document.querySelector(".moon-background") as HTMLElement;

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 0.1, 1000);
camera.position.set(0, 25, 25);

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: true
});

let currentMap;
let currentAction = Actions.SELECT_TILE;
let selectedTile;

renderer.setPixelRatio(devicePixelRatio);
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.physicallyCorrectLights = true;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const sunLight = new THREE.DirectionalLight(new THREE.Color("#FFCB8E").convertSRGBToLinear(), 3.5);
sunLight.position.set(10, 20, 10);
sunLight.castShadow = true;
sunLight.shadow.mapSize.width = 512;
sunLight.shadow.mapSize.height = 512;
sunLight.shadow.camera.near = .5;
sunLight.shadow.camera.far = 100;
sunLight.shadow.camera.left = -10;
sunLight.shadow.camera.bottom = -10;
sunLight.shadow.camera.top = 10;
sunLight.shadow.camera.right = 10;

const moonLight = new THREE.DirectionalLight(new THREE.Color("#77ccff").convertSRGBToLinear(), 0);
moonLight.position.set(-10, 20, 10);
moonLight.castShadow = true;
moonLight.shadow.mapSize.width = 512;
moonLight.shadow.mapSize.height = 512;
moonLight.shadow.camera.near = .5;
moonLight.shadow.camera.far = 100;
moonLight.shadow.camera.left = -10;
moonLight.shadow.camera.bottom = -10;
moonLight.shadow.camera.top = 10;
moonLight.shadow.camera.right = 10;

scene.add(sunLight);

const controls = new OrbitControls(camera, renderer.domElement);
controls.dampingFactor = 0.05;
controls.enableDamping = true;
controls.listenToKeyEvents(window)
controls.mouseButtons= {
	MIDDLE: THREE.MOUSE.ROTATE
}

renderer.render(scene, camera);
let pmrem = new PMREMGenerator(renderer);
let envmapTexture = await new RGBELoader().setDataType(THREE.FloatType).loadAsync("assets/envmap.hdr");
const envmap = pmrem.fromEquirectangular(envmapTexture).texture
const mapGenerator = new MapGenerator(envmap, scene);
//currentMap = mapGenerator.createMap(20, 0, 0 ,1);
currentMap = mapGenerator.createMap();

const clock = new THREE.Clock();
let daytime = true;
let animating = false;

function onPointerMove(event) {
  scene.children.forEach((element) => {
    if (element.userData instanceof Tile){
      if (element.userData.status == TileStatus.HOVERED) {
        element.userData.setTileStatus(TileStatus.NORMAL, true);
      } else if (element.userData.status == TileStatus.TARGET){
        element.userData.setTileStatus(TileStatus.REACHABLE, true);
      }
    }
  })
  let hovered = getTileFromRaycast(event, canvas, camera, scene);
  if (!hovered || hovered.hasObstacle) return;
  if (hovered.status == TileStatus.REACHABLE || hovered.status == TileStatus.PATH) {
    currentMap.applyStatusToTiles(TileStatus.PATH, TileStatus.REACHABLE);
    hovered.setTileStatus(TileStatus.TARGET);
    const path = currentMap.pathfinding.findPath(selectedTile, hovered, 2)
    path.forEach(element => {
      element.setTileStatus(TileStatus.PATH)
    });
  } else {
    hovered.setTileStatus(TileStatus.HOVERED);
  }
}

function onMouseDown(event) {
  if (event.which == 1) {
  const originTile = selectedTile;
  selectedTile = getTileFromRaycast(event, canvas, camera, scene);
  if (originTile) {
    originTile.setTileStatus(TileStatus.NORMAL, true);
    currentMap.applyStatusToTiles(TileStatus.REACHABLE, TileStatus.NORMAL);
  };
  if (selectedTile  instanceof Tile && !selectedTile.hasObstacle ) {
    onTileClicked(originTile, selectedTile)
    }
  }
}

function onTileClicked(origin, target) {
  origin?.setTileStatus(TileStatus.NORMAL)
  if (target.status == TileStatus.TARGET) {
    currentMap.clearStatusFromAllTiles();
    return;
  }
  target.setTileStatus(TileStatus.SELECTED);
  const reachables = currentMap.pathfinding.getReachables(target, MOVEMENT, 2);
  reachables.forEach((reachable) => {
    reachable.setTileStatus(TileStatus.REACHABLE);
  })
}

function onKeyPress(event) {
  switch (event.key) {
    case 'r':
      let objects = scene.getObjectsByProperty('name','Tile');
      objects = objects.concat(scene.getObjectsByProperty('name','Cloud'));
      objects = objects.concat(scene.getObjectsByProperty('name','Tree'));
      objects = objects.concat(scene.getObjectsByProperty('name','Stone'));
      for (let i = 0; i < objects.length; i++) {
        scene.remove(objects[i]);
      }
      currentMap = mapGenerator.createMap();
      break;

    case 'Enter':
      if (animating) return;
      let anim;
      if (!daytime) {
        anim = [1, 0];
      } else {
        anim = [0, 1];
      }
      animating = true;
      let obj = {t: 0};
      anime({
        targets: obj,
        t: anim,
        complete: () => {
          animating = false;
          daytime = !daytime;
        },
        update: () => {
          sunLight.intensity = 3.5 * (1 - obj.t);
          moonLight.intensity = 3.5 * obj.t;
          
          sunLight.position.setY(20 * (1 - obj.t));
          moonLight.position.setY(20 * obj.t);
    
          sunBackground.style.opacity = 1 - obj.t;
          moonBackground.style.opacity = obj.t;
        },
        easing: 'easeInOutSine',
        duration: 500,
      })
        break;
  
    default:
      break;
  }
}

function gameLoop() {
  let delta = clock.getDelta();
  requestAnimationFrame(gameLoop);
  controls.update();
  renderer.render(scene, camera);
  
  scene.children.forEach(object => {
    if (object.userData instanceof Tile) {
      switch (object.userData.status) {
        case TileStatus.FOV:
          object.material.color.set( 0x000000 );
          break;
        case TileStatus.TARGET:
          object.material.color.set( 0x0000ff );
          break;  
        case TileStatus.PATH:
          object.material.color.set( 0xC5E223 );
          break;
        case TileStatus.REACHABLE:
          object.material.color.set( 0x03adfc );
          break;
        case TileStatus.SELECTED:
          object.material.color.set( 0xff0000 );
          break;
        case TileStatus.HOVERED:
          object.material.color.set( 0xffff00 );
          break;
        default:
          object.material.color.set("white")
          break;
      }
    }
  });
}

window.addEventListener('pointermove', onPointerMove );
window.addEventListener('keypress', onKeyPress);
window.addEventListener('mousedown', onMouseDown);

gameLoop();