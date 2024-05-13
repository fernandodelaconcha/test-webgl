import './style.css';
import * as THREE from 'three';
import { BufferGeometryUtils, RGBELoader, SimplexNoise } from 'three/examples/jsm/Addons.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

const scene = new THREE.Scene();
scene.background = new THREE.Color("#FFEECC");

const camera = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 0.1, 1000);
camera.position.set(-17, 31, 33);

const renderer = new THREE.WebGLRenderer({
  canvas: document.querySelector('#bg'),
  antialias: true,
});

renderer.setPixelRatio(devicePixelRatio);
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.physicallyCorrectLights = true;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const pointLight = new THREE.PointLight(new THREE.Color("#FFCB8E").convertSRGBToLinear(), 400, 200);
pointLight.position.set(10, 20, 10);
pointLight.castShadow = true;
pointLight.shadow.mapSize.width = 512;
pointLight.shadow.mapSize.height = 512;
pointLight.shadow.camera.near = .5;
pointLight.shadow.camera.far = 500;

scene.add(pointLight);

const controls = new OrbitControls(camera, renderer.domElement);
controls.dampingFactor = 0.05;
controls.enableDamping = true;

renderer.render(scene, camera);

let pmrem = new THREE.PMREMGenerator(renderer);
let envmapTexture = await new RGBELoader().setDataType(THREE.FloatType).loadAsync("assets/envmap.hdr");
let envmap = pmrem.fromEquirectangular(envmapTexture).texture;

let stoneGeometry = new THREE.BoxGeometry(0,0,0);
let dirtGeometry = new THREE.BoxGeometry(0,0,0);
let dirt2Geometry = new THREE.BoxGeometry(0,0,0);
let grassGeometry = new THREE.BoxGeometry(0,0,0);
let sandGeometry = new THREE.BoxGeometry(0,0,0);
let waterGeometry = new THREE.BoxGeometry(0,0,0);

const simplex = new SimplexNoise();
const MAX_HEIGHT = 10;
const STONE_HEIGHT = MAX_HEIGHT * .8;
const DIRT_HEIGHT = MAX_HEIGHT * .7;
const GRASS_HEIGHT = MAX_HEIGHT * .5;
const SAND_HEIGHT = MAX_HEIGHT * .3;
const DIRT2_HEIGHT = MAX_HEIGHT * 0;

let textures = {
  dirt: await new THREE.TextureLoader().loadAsync("assets/dirt.png"),
  dirt2: await new THREE.TextureLoader().loadAsync("assets/dirt2.jpg"),
  grass: await new THREE.TextureLoader().loadAsync("assets/grass.jpg"),
  sand: await new THREE.TextureLoader().loadAsync("assets/sand.jpg"),
  water: await new THREE.TextureLoader().loadAsync("assets/water.jpg"),
  stone: await new THREE.TextureLoader().loadAsync("assets/stone.png"),
}

for (let i = -15; i <= 15; i++) {
  for (let j = -15; j <=15; j++) {
    let position = new tileToPosition(i, j);

    if (position.length() > 16) continue;
    let noise = (simplex.noise(i * .1, j * .1) + 1) * .5;
    noise = Math.pow(noise, 1.5);
    makeHex(noise * MAX_HEIGHT, position);
  }
}

let stoneMesh = hexMesh(stoneGeometry, textures.stone);
let grassMesh = hexMesh(grassGeometry, textures.grass);
let dirtMesh = hexMesh(dirtGeometry, textures.dirt);
let dirt2Mesh = hexMesh(dirt2Geometry, textures.dirt2);
let sandMesh = hexMesh(sandGeometry, textures.sand);
scene.add(stoneMesh, grassMesh, dirtMesh, dirt2Mesh, sandMesh);

let seaMesh = new THREE.Mesh(
  new THREE.CylinderGeometry(17, 17, MAX_HEIGHT * .2, 50),
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
seaMesh.position.set(0, MAX_HEIGHT * .1, 0)
scene.add(seaMesh);

let mapContainer = new THREE.Mesh(
  new THREE.CylinderGeometry(17.1, 17.1, MAX_HEIGHT * .25, 50, 1, true),
  new THREE.MeshPhysicalMaterial({
    envMap: envmap,
    map: textures.dirt,
    envMapIntensity: .2,
    side: THREE.DoubleSide,
  })
);
mapContainer.receiveShadow = true;
mapContainer.position.set(0, MAX_HEIGHT * .125, 0)
scene.add(mapContainer);

let mapFloor = new THREE.Mesh(
  new THREE.CylinderGeometry(18.5, 18.5, MAX_HEIGHT * .1, 50),
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

clouds();

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}

animate();

function hexGeometry(height, position) {
  let geo = new THREE.CylinderGeometry(1, 1, height, 6, 1, false);
  geo.translate(position.x, height * 0.5, position.y);

  return geo;
}

function makeHex(height, position) {
  let geo = hexGeometry(height, position);

  if (height > STONE_HEIGHT) {
    stoneGeometry = BufferGeometryUtils.mergeGeometries([geo, stoneGeometry]);
    if (Math.random() > .8) {
      stoneGeometry = BufferGeometryUtils.mergeGeometries([stoneGeometry, stone(height, position)])
    }

  } else if (height > DIRT_HEIGHT) {
    dirtGeometry = BufferGeometryUtils.mergeGeometries([geo, dirtGeometry]);

    if (Math.random() > .8) {
      grassGeometry = BufferGeometryUtils.mergeGeometries([grassGeometry, tree(height, position)])
    }
  } else if (height > GRASS_HEIGHT) {
    grassGeometry = BufferGeometryUtils.mergeGeometries([geo, grassGeometry]);

    if (Math.random() > .8) {
      grassGeometry = BufferGeometryUtils.mergeGeometries([grassGeometry, tree(height, position)])
    }
  } else if (height > SAND_HEIGHT) {
    sandGeometry = BufferGeometryUtils.mergeGeometries([geo, sandGeometry]);

    if (Math.random() > .8) {
      stoneGeometry = BufferGeometryUtils.mergeGeometries([stoneGeometry, stone(height, position)])
    }
  } else if (height > DIRT2_HEIGHT) {
    dirt2Geometry = BufferGeometryUtils.mergeGeometries([geo, dirt2Geometry]);
  } else {

  } 
}

function hexMesh(geometry, map) {
  let material = new THREE.MeshPhysicalMaterial({
    envMap: envmap,
    envMapIntensity: .135,
    flatShading: true,
    map
  })

  let mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;

  return mesh;
}

function tileToPosition(tileX, tileY) {
  return new THREE.Vector2((tileX + (tileY % 2) * .5) * 1.77, tileY * 1.535)
}

function stone(height, position) {
  const px = Math.random() * .4;
  const pz = Math.random() * .4;

  const geo = new THREE.SphereGeometry(Math.random() * .3 + .1, 7, 7);
  geo.translate(position.x + px, height, position.y + pz);

  return geo
}

function tree(height, position) {
  const treeHeight = Math.random() * 1 + 1.25;

  const geo1 = new THREE.CylinderGeometry(0, 1.5, treeHeight, 3);
  geo1.translate(position.x, height + treeHeight * 0 + 1, position.y);
  const geo2 = new THREE.CylinderGeometry(0, 1.15, treeHeight, 3);
  geo2.translate(position.x, height + treeHeight * 0.6 + 1, position.y);
  const geo3 = new THREE.CylinderGeometry(0, .8, treeHeight, 3);
  geo3.translate(position.x, height + treeHeight * 1.25 + 1, position.y);

  return BufferGeometryUtils.mergeGeometries([geo1, geo2, geo3]);
}

function clouds() {
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
  scene.add(mesh);
}