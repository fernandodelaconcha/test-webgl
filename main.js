import './style.css';
import * as THREE from 'three';
import { RGBELoader } from 'three/examples/jsm/Addons.js';
import { PMREMGenerator } from 'three/src/extras/PMREMGenerator.js';
import MapGenerator from './classes/MapGenerator';
import { MapShape, TerrainType } from './utils/Enums';
import { Game } from './classes/Game';
import { Controls } from './classes/Controls';
import { getRandomIntInRange } from "./utils/Utils";

const FPS = 30;
const INTERVAL = 1000 / FPS;

let game = new Game(document.querySelector('#bg'), innerWidth / 1.5, innerHeight * .9 / 1.2);
let controls = new Controls(game);

const sizeInput = document.querySelector("#size");
const seaInput = document.querySelector("#seaLevel");
const maxHeightInput = document.querySelector("#maxHeight");
const minHeightInput = document.querySelector("#minHeight");
const seedInput = document.querySelector("#seed");
const shapeInput = document.querySelector('#circle')
const button = document.querySelector("#reset-world");

button.addEventListener('click', () => {
  let size = sizeInput.value != '' ? Number(sizeInput.value) : getRandomIntInRange(16, 30)
  let seaLevel = seaInput.value != '' ? Number(seaInput.value) : getRandomIntInRange(0, 5)
  let maxHeight = maxHeightInput.value != '' ? Number(maxHeightInput.value) : getRandomIntInRange(5, 10)
  let minHeight = minHeightInput.value != '' ? Number(minHeightInput.value) : getRandomIntInRange(0, 5);
  let shape = shapeInput.checked ? 1 : 0;
  let seed = seedInput.value;
  game.cleanScene();
  currentMap = mapGenerator.createMap(shape, TerrainType.PLAINS, size, seaLevel, maxHeight, minHeight, seed);
  controls.setMap(currentMap);
})  

//world generation
let pmrem = new PMREMGenerator(game.renderer);
let envmapTexture = await new RGBELoader().setDataType(THREE.FloatType).loadAsync("assets/textures/envmap.hdr");
const envmap = pmrem.fromEquirectangular(envmapTexture).texture
const mapGenerator = new MapGenerator(envmap, game.scene);
//plateau
//let currentMap = mapGenerator.createMap(MapShape.BOX, TerrainType.PLAINS, 20, 5, 10 ,10);

//circle hills no water
//let currentMap = mapGenerator.createMap(MapShape.CIRCLE, TerrainType.PLAINS, 16, 2, 10 , 3);

// circle islands
//let currentMap = mapGenerator.createMap(MapShape.CIRCLE, TerrainType.PLAINS, 16, 4, 10 , 2);

// all water floating rocks
//let currentMap = mapGenerator.createMap(MapShape.CIRCLE, TerrainType.PLAINS, 30, 5, 6, 2);

//kind of swamp
let currentMap = mapGenerator.createMap(MapShape.BOX, TerrainType.PLAINS, 28, 3, 5, 3);

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
    game.render(delta);
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
  controls.handleKeyDown(e);
}

gameLoop(0);