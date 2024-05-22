import './style.css';
import * as THREE from 'three';
import anime from 'animejs';
import { RGBELoader } from 'three/examples/jsm/Addons.js';
import { OrbitControls } from 'three/examples/jsm/Addons.js';
import Tile from './Tile';
import { PMREMGenerator } from 'three/src/extras/PMREMGenerator.js';
import MapGenerator from './MapGenerator';
import { Actions, MapShape, TileStatus } from './Enums';
import { getRandomIntInRange, getTileFromRaycast } from './Utils'
import { Game } from './Game';

let sunBackground = document.querySelector(".sun-background");
let moonBackground = document.querySelector(".moon-background");
let canvas = document.querySelector('#bg');

const fps = 30;
const interval = 1000/fps
let timer = 0;
let lastTime = 0;

const MOVEMENT = 4;
let currentMap;
let currentAction = Actions.SELECT_TILE;
let selectedTile;

let daytime = true;
let animating = false;

let game = new Game(canvas, innerWidth, innerHeight);

// let sunBackground : HTMLElement = document.querySelector(".sun-background") as HTMLElement;
// let moonBackground : HTMLElement = document.querySelector(".moon-background") as HTMLElement;

const controls = new OrbitControls(game.camera, canvas);
controls.dampingFactor = 0.05;
controls.enableDamping = true;
controls.listenToKeyEvents(window)
controls.mouseButtons= {
  MIDDLE: THREE.MOUSE.ROTATE
}

game.render();
gameLoop(0);

let pmrem = new PMREMGenerator(game.renderer);
let envmapTexture = await new RGBELoader().setDataType(THREE.FloatType).loadAsync("assets/envmap.hdr");
const envmap = pmrem.fromEquirectangular(envmapTexture).texture
const mapGenerator = new MapGenerator(envmap, game.scene);
//plateau
//currentMap = mapGenerator.createMap(MapShape.BOX, 20, 5, 10 ,10);

//circle hills no water
//currentMap = mapGenerator.createMap(MapShape.CIRCLE, 16, 2, 10 , 3);

// circle islands
//currentMap = mapGenerator.createMap(MapShape.CIRCLE, 16, 4, 10 , 2);

// all water floating rocks
//currentMap = mapGenerator.createMap(MapShape.CIRCLE, 29, 5, 6, 2);

//currentMap = mapGenerator.createMap(MapShape.CIRCLE);
currentMap = mapGenerator.createMap(MapShape.BOX);

function onPointerMove(event) {
  game.scene.children.forEach((element) => {
    if (element.userData instanceof Tile){
      if (element.userData.status == TileStatus.HOVERED) {
        element.userData.setTileStatus(TileStatus.NORMAL, true);
      } else if (element.userData.status == TileStatus.TARGET){
        element.userData.setTileStatus(TileStatus.REACHABLE, true);
      }
    }
  })
  let hovered = getTileFromRaycast(event, canvas, game.camera, game.scene);
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
  selectedTile = getTileFromRaycast(event, canvas, game.camera, game.scene);
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
    case 'Escape':
      game.quitGame();
    break;
    case 'r':
      game.cleanScene();
      let size = getRandomIntInRange(16, 30)
      let seaLevel = getRandomIntInRange(0, 5)
      let maxHeight = getRandomIntInRange(5, 10)
      let minHeight = getRandomIntInRange(0, 5);
      console.log ({size,seaLevel, maxHeight, minHeight})
      currentMap = mapGenerator.createMap(getRandomIntInRange(0, 1),size, seaLevel, maxHeight, minHeight);
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
          game.lights.sunLight.intensity = 3.5 * (1 - obj.t);
          game.lights.moonLight.intensity = 3.5 * obj.t;
          
          game.lights.sunLight.position.setY(20 * (1 - obj.t));
          game.lights.moonLight.position.setY(20 * obj.t);
    
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
function gameLoop(timeStamp = 0) {
  const delta = timeStamp - lastTime;
  lastTime = timeStamp;
  if (timer > interval) {
    timer = 0;
    controls.update();
    game.render();
  }
  timer += delta;
  if (game.isGameOver) {
    cancelAnimationFrame(gameLoop);
  } else {
    requestAnimationFrame(gameLoop);
  }
}

window.addEventListener('pointermove', onPointerMove );
window.addEventListener('keydown', onKeyPress);
window.addEventListener('mousedown', onMouseDown);
