import { AnimationAction, AnimationClip, AnimationMixer, Mesh, Object3D, Vector3 } from "three";
import { AIProfile, AnimationType, UnitType } from "../utils/Enums";
import Tile from "./Tile";
import { UnitAI } from "./UnitAI";
import WorldMap from "./WorldMap";
import { pendingMovement } from "../utils/Utils";

export class Unit {
  id: string;
  team: number;
  type: UnitType;
  attack: number;
  maxHp: number;
  currentHp: number;
  AI: UnitAI;
  tile: Tile;
  verticalMovement: number;
  pendingMovements: Array<pendingMovement> = [];

  animationMixer: AnimationMixer
  animationsMap: Map<AnimationType, AnimationAction> = new Map();
  currentAnimation: AnimationAction

  constructor(map: WorldMap, team: number, type: UnitType, maxHp: number, verticalMovement: number) {
    this.team = team;
    this.type = type;
    this.maxHp = maxHp;
    this.currentHp = maxHp;
    this.attack = 2;
    this.AI = new UnitAI(map, AIProfile.AGGRESIVE);
    this.AI.unit = this;
    this.verticalMovement = verticalMovement;
  }

  createModelData(model: Object3D, position: Vector3) {
    this.animationMixer = new AnimationMixer(model);
    model.userData = this;
    // const color = getColorByTeamIndex(team);
    // const material = new MeshBasicMaterial({ color });
    model.castShadow = true;
    model.receiveShadow = true;
    model.name = 'Unit';
    model['position'].set(position.x, this.tile.height, position.z);
    model.userData['pendingMovements'] = [];
    this.id = model.uuid;
  }
  
  createAnimationData(animations: Array<AnimationClip>) {
    animations.forEach((animation: AnimationClip) => {
      const clip: AnimationAction = this.animationMixer.clipAction(animation);
      if (AnimationType[animation.name] > -1) {
        this.animationsMap.set(AnimationType[animation.name], clip);
      }
    })
  }

  playAnimation(animationType: AnimationType) {
    const clip = this.animationsMap.get(animationType);
    if (!clip) return;
    clip.reset().play();
  }

  displayUnitOnInterface() {
    const name: HTMLElement = document.querySelector("#name") as HTMLElement;
    const health: HTMLElement = document.querySelector("#health") as HTMLElement;
    const attack: HTMLElement = document.querySelector("#attack") as HTMLElement;
    //const items: HTMLElement = document.querySelector("#items") as HTMLElement;

    name.innerText = UnitType[this.type].toString();
    health.innerText = `${this.currentHp} / ${this.maxHp}`;
    attack.innerText = this.attack.toString();
  }
  updateUnitMovement(object: Mesh, delta: number) {
    const pendingMovements: Array<pendingMovement> = object.userData.pendingMovements;
    if (!pendingMovements || pendingMovements.length == 0) return;
    const pendingMovement = pendingMovements[0];
    object.lookAt(pendingMovement.target.x, object.position.y, pendingMovement.target.z);

    pendingMovement.start.lerp(pendingMovement.path, pendingMovement.alpha)
    object.position.x += (pendingMovement.start.x / 6);
    object.position.y += (pendingMovement.start.y / 6);
    object.position.z += (pendingMovement.start.z / 6);

    if (pendingMovement.alpha < 1) {
      pendingMovement.alpha += delta;
    } else {

      object.position.x += (pendingMovement.start.x - pendingMovement.path.x);
      object.position.y += (pendingMovement.start.y - pendingMovement.path.y);
      object.position.z += (pendingMovement.start.z - pendingMovement.path.z);

      object.userData.pendingMovements.shift();
    }
  }

  render(object: Mesh, delta: number) {
    if (object.userData.pendingMovements && object.userData.pendingMovements.length > 0) {
      this.updateUnitMovement(object, delta);
    }
  }

}