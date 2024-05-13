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

const controls = new OrbitControls(camera, renderer.domElement);
controls.dampingFactor = 0.05;
controls.enableDamping = true;

renderer.render(scene, camera);

const pointLight = new THREE.PointLight(0xffffff);
pointLight.position.set(5, 5, 5);

const ambientLight = new THREE.AmbientLight(0xffffff);
scene.add(pointLight, ambientLight);

let hexagonGeometries = new THREE.BoxGeometry(0,0,0);
let pmrem = new THREE.PMREMGenerator(renderer);
let envmapTexture = await new RGBELoader().setDataType(THREE.FloatType).loadAsync("assets/envmap.hdr");
let envmap = pmrem.fromEquirectangular(envmapTexture).texture;

const simplex = new SimplexNoise();
const MAX_HEIGHT = 10;

for (let i = -15; i <= 15; i++) {
  for (let j = -15; j <=15; j++) {
    let position = new tileToPosition(i, j);

    if (position.length() > 16) continue;
    let noise = (simplex.noise(i * .1, j * .1) + 1) * .5;
    noise = Math.pow(noise, 1.5);
    makeHex(noise * MAX_HEIGHT, position);
  }
}

let hexMesh = new THREE.Mesh(
  hexagonGeometries,
  new THREE.MeshStandardMaterial({
    envMap: envmap,
    flatShading: true,
  })
)
scene.add(hexMesh);

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
  hexagonGeometries = BufferGeometryUtils.mergeGeometries([hexagonGeometries, geo]);
}

function tileToPosition(tileX, tileY) {
  return new THREE.Vector2((tileX + (tileY % 2) * .5) * 1.77, tileY * 1.535)
}