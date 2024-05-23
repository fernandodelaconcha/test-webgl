import './style.css';
import * as THREE from 'three';
import { RGBELoader } from 'three/examples/jsm/Addons.js';
import { PMREMGenerator } from 'three/src/extras/PMREMGenerator.js';
import MapGenerator from './classes/MapGenerator';
import { MapShape } from './utils/Enums';
import { Game } from './classes/Game';
import { Controls } from './classes/Controls';
import { getRandomIntInRange } from "./utils/Utils";

const FPS = 30;
const INTERVAL = 1000 / FPS;

let game = new Game(document.querySelector('#bg'), innerWidth, innerHeight);
let controls = new Controls(game);

//world generation
let pmrem = new PMREMGenerator(game.renderer);
let envmapTexture = await new RGBELoader().setDataType(THREE.FloatType).loadAsync("assets/envmap.hdr");
const envmap = pmrem.fromEquirectangular(envmapTexture).texture
const mapGenerator = new MapGenerator(envmap, game.scene);
//plateau
//let currentMap = mapGenerator.createMap(MapShape.BOX, 20, 5, 10 ,10);

//circle hills no water
//let currentMap = mapGenerator.createMap(MapShape.CIRCLE, 16, 2, 10 , 3);

// circle islands
//let currentMap = mapGenerator.createMap(MapShape.CIRCLE, 16, 4, 10 , 2);

// all water floating rocks
//let currentMap = mapGenerator.createMap(MapShape.CIRCLE, 30, 5, 6, 2);

//kind of swamp
let currentMap = mapGenerator.createMap(MapShape.BOX, 28, 3, 5, 3);

//let currentMap = mapGenerator.createMap(MapShape.CIRCLE);
//let currentMap = mapGenerator.createMap(MapShape.BOX);
controls.setMap(currentMap);

//game loop
let timer = 0;
let lastTime = 0;
function gameLoop(timeStamp = 0) {
  const delta = timeStamp - lastTime;
  lastTime = timeStamp;
  if (timer > INTERVAL) {
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

//inputs mapping TODO:maybe add return types to functions to handle inputs elsewhere
window.addEventListener('pointermove', onPointerMove);
window.addEventListener('keydown', onKeyDown);
window.addEventListener('mousedown', onMouseDown);

function onPointerMove(e) {
  controls.handlePointerMove(e);
}
function onMouseDown(e) {
  controls.handleMouseDown(e);
}
function onKeyDown(e) {
  const shouldResetWorld = controls.handleKeyDown(e)
  if (shouldResetWorld){
    let size = getRandomIntInRange(16, 30)
    let seaLevel = getRandomIntInRange(0, 5)
    let maxHeight = getRandomIntInRange(5, 10)
    let minHeight = getRandomIntInRange(0, 5);
    console.log ({size,seaLevel, maxHeight, minHeight})
    currentMap = mapGenerator.createMap(getRandomIntInRange(0, 1),size, seaLevel, maxHeight, minHeight);
    controls.setMap(currentMap);
  };
}

gameLoop(0);