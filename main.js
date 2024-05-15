import './style.css';
import * as THREE from 'three';
import anime from 'animejs';
import Alea from 'alea';
import { BufferGeometryUtils, RGBELoader, SimplexNoise } from 'three/examples/jsm/Addons.js';
import { OrbitControls } from 'three/examples/jsm/Addons.js';
import Tile from './Tile';
import { createNoise2D } from 'simplex-noise';

let sunBackground = document.querySelector(".sun-background");
let moonBackground = document.querySelector(".moon-background");
let canvas = document.querySelector('#bg');

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

renderer.render(scene, camera);

let pmrem = new THREE.PMREMGenerator(renderer);
let envmapTexture = await new RGBELoader().setDataType(THREE.FloatType).loadAsync("assets/envmap.hdr");
let envmap = pmrem.fromEquirectangular(envmapTexture).texture;

const MAX_HEIGHT = 10;
const MAP_SIZE = 15;
const SEA_LEVEL = 3;
const STONE_HEIGHT = MAX_HEIGHT * .8;
const DIRT_HEIGHT = MAX_HEIGHT * .7;
const GRASS_HEIGHT = MAX_HEIGHT * .5;
const SAND_HEIGHT = MAX_HEIGHT * .3;
const DIRT2_HEIGHT = MAX_HEIGHT * 0;

const seed = window.crypto.randomUUID()
const noise2D = createNoise2D(Alea(seed));

let textures = {
  dirt: await new THREE.TextureLoader().loadAsync("assets/dirt.png"),
  dirt2: await new THREE.TextureLoader().loadAsync("assets/dirt2.jpg"),
  grass: await new THREE.TextureLoader().loadAsync("assets/grass.jpg"),
  sand: await new THREE.TextureLoader().loadAsync("assets/sand.jpg"),
  water: await new THREE.TextureLoader().loadAsync("assets/water.jpg"),
  stone: await new THREE.TextureLoader().loadAsync("assets/stone.png"),
}

const treeMaterial = new THREE.MeshStandardMaterial({
  envMap: envmap,
  envMapIntensity: .75,
  flatShading: true,
  map: textures.grass
})
const stoneMaterial = new THREE.MeshStandardMaterial({
  envMap: envmap,
  envMapIntensity: .75,
  flatShading: true,
  map: textures.stone
})

const tiles = [];
for (let i = 1 - MAP_SIZE; i < MAP_SIZE; i++) {
  for (let j = 1 - MAP_SIZE; j < MAP_SIZE; j++) {
    const position = new tileToPosition(i, j);

    if (position.length() > MAP_SIZE) continue;
    let noise = (noise2D(i * .1, j * .1) + 1) * .5;
    noise = Math.pow(noise, 1.5);
    
    const height = noise * MAX_HEIGHT;
    if (height < SEA_LEVEL) continue;
    const tile = new Tile(new THREE.Vector2(i, j), height);
    const texture = getRandomTexture(height, position);
    const mesh = createTile(tile, createMaterial(texture));
    tiles.push(tile);
    scene.add(mesh)
  }
}

let seaMesh = new THREE.Mesh(
  new THREE.CylinderGeometry(MAP_SIZE + 1, MAP_SIZE + 1, SEA_LEVEL + .1, 50),
  new THREE.MeshPhysicalMaterial({
    envMap: envmap,
    color: new THREE.Color("#55aaff").convertSRGBToLinear().multiplyScalar(3),
    ior: 1.4,
    transmission: 1,
    transparent: true,
    thickness: 1.5,
    envMapIntensity: .2,
    roughness: 1,
    metalness: .025,
    roughnessMap: textures.water,
    metalnessMap: textures.water,
  })
);
seaMesh.receiveShadow = true;
seaMesh.position.set(0, SEA_LEVEL - 1, 0)
scene.add(seaMesh);

let mapContainer = new THREE.Mesh(
  new THREE.CylinderGeometry(MAP_SIZE + 1.1, MAP_SIZE + 1.1, SEA_LEVEL + 1, 50, 1, true),
  new THREE.MeshPhysicalMaterial({
    envMap: envmap,
    map: textures.dirt,
    envMapIntensity: .2,
    side: THREE.DoubleSide,
  })
);
mapContainer.receiveShadow = true;
mapContainer.position.set(0, SEA_LEVEL - 1, 0)
scene.add(mapContainer);

let mapFloor = new THREE.Mesh(
  new THREE.CylinderGeometry(MAP_SIZE + 2.5, MAP_SIZE + 2.5, MAX_HEIGHT * .1, 50),
  new THREE.MeshPhysicalMaterial({
    envMap: envmap,
    map: textures.dirt2,
    envMapIntensity: .1,
    side: THREE.DoubleSide,
  })
);
mapFloor.receiveShadow = true;
mapFloor.position.set(0, -MAX_HEIGHT * .05, 0)
scene.add(mapFloor);

spawn_clouds();

const clock = new THREE.Clock();
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2(0, 0);
let daytime = true;
let animating = false;

function onPointerMove(event) {
  event.preventDefault();
  scene.children.forEach(object => {
    if (object.name == "Tile")
      object.material.color.set("white");
  });

  pointer.x = ( (event.clientX + canvas.offsetLeft) / canvas.width ) * 2 - 1;
  pointer.y = - ( (event.clientY - canvas.offsetTop) / canvas.height ) * 2 + 1;

  // pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
  // pointer.y = (event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera( pointer, camera );
	const intersects = raycaster.intersectObjects( scene.children );
  
  if (intersects.length > 0 && intersects[0].object && intersects[0].object.name == "Tile") {
    intersects[0].object.material.color.set( 0xff0000 );
    if (!intersects[0].object.userData instanceof Tile) return;
    console.log(intersects[0].object.userData.hasObstacle)
  }
}

function onKeyPress(event) {
  if (event.key != "Enter") return;

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
}

function gameLoop() {  
  let delta = clock.getDelta();
  requestAnimationFrame(gameLoop);
  controls.update();
  renderer.render(scene, camera);
}

window.addEventListener('pointermove', onPointerMove );
window.addEventListener('keypress', onKeyPress);
gameLoop();

function createTile(tile, material) {
    let position = tileToPosition(tile.index.x, tile.index.y)
    let geo = new THREE.CylinderGeometry(1, 1, tile.height, 6, 1, false);
    geo.translate(position.x, tile.height * 0.5, position.y);
        
    let mesh = new THREE.Mesh(geo, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.name = 'Tile';
    mesh.userData = tile;

    return mesh;
}

function createMaterial(map) {
  let material = new THREE.MeshPhysicalMaterial({
    envMap: envmap,
    envMapIntensity: .135,
    flatShading: true,
    map
  })

  return material;
}

function tileToPosition(tileX, tileY) {
  return new THREE.Vector2((tileX + (tileY % 2) * .5) * 1.77, tileY * 1.535)
}

function spawn_stone(height, position) {
  const px = Math.random() * .4;
  const pz = Math.random() * .4;

  const geo = new THREE.SphereGeometry(Math.random() * .3 + .1, 7, 7);
  geo.translate(position.x + px, height, position.y + pz);
  const mesh = new THREE.Mesh(
    geo,
    stoneMaterial
  );
  mesh.name = "Stone";
  scene.add(mesh);
}

function spawn_tree(height, position) {
  const treeHeight = Math.random() * 1 + 1.25;

  const geo1 = new THREE.CylinderGeometry(0, 1.5, treeHeight, 3);
  geo1.translate(position.x, height + treeHeight * 0 + 1, position.y);
  const geo2 = new THREE.CylinderGeometry(0, 1.15, treeHeight, 3);
  geo2.translate(position.x, height + treeHeight * 0.6 + 1, position.y);
  const geo3 = new THREE.CylinderGeometry(0, .8, treeHeight, 3);
  geo3.translate(position.x, height + treeHeight * 1.25 + 1, position.y);

  const geo = BufferGeometryUtils.mergeGeometries([geo1, geo2, geo3]);
  const mesh = new THREE.Mesh(
    geo,
    treeMaterial,
  );
  mesh.name = "Tree";
  scene.add(mesh);
}

function spawn_clouds() {
  let geo = new THREE.SphereGeometry(0, 0, 0);
  let count = Math.floor(Math.pow(Math.random(), .45) * 4);

  for (let i = 0; i < count; i++) {
    const puff1 = new THREE.SphereGeometry(1.2, 7, 7);
    const puff2 = new THREE.SphereGeometry(1.5, 7, 7);
    const puff3 = new THREE.SphereGeometry(.9, 7, 7);

    puff1.translate(-1.85, Math.random() * .3, 0);
    puff2.translate(0, Math.random() * .3, 0);
    puff3.translate(1.85, Math.random() * .3, 0);

    const cloudGeo = BufferGeometryUtils.mergeGeometries([puff1, puff2, puff3]);
    cloudGeo.translate(
      Math.random() * 20 - 10,
      Math.random() * 4 + 15,
      Math.random() * 20 - 10,
    )
    cloudGeo.rotateY(Math.random() * Math.PI * 2);

    geo = BufferGeometryUtils.mergeGeometries([geo, cloudGeo])
  }

  const mesh = new THREE.Mesh(
    geo,
    new THREE.MeshStandardMaterial({
      envMap: envmap,
      envMapIntensity: .75,
      flatShading: true,
    })
  );
  mesh.name = "Cloud";
  scene.add(mesh);
}

function getRandomTexture(height, position) {
  if (height > STONE_HEIGHT) {
    if (Math.random() > .8) {
      spawn_stone(Math.round(height), position);
    }
    return textures.stone
  } else if (height > DIRT_HEIGHT) {
    if (Math.random() > .8) {
      spawn_tree(Math.round(height), position);
    }
    return textures.dirt
  } else if (height > GRASS_HEIGHT) {
    if (Math.random() > .8) {
      spawn_tree(Math.round(height), position);
    }
    return textures.grass
  } else if (height > SAND_HEIGHT) {
    if (Math.random() > .8) {
      spawn_stone(Math.round(height), position);
    }
    return textures.sand
  } else if (height > DIRT2_HEIGHT) {
    return textures.dirt2
  }
}