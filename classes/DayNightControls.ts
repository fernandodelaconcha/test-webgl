import anime from 'animejs';
import { Game } from './Game';

let daytime = true;
let animating = false;

export class DayNightControls {
    
    animate(game: Game): void {
        let sunBackground: HTMLElement = document.querySelector(".sun-background") as HTMLElement;
        let moonBackground: HTMLElement = document.querySelector(".moon-background") as HTMLElement;
        if (animating) return;
        let anim: Array<number>;
        if (!daytime) {
            anim = [1, 0];
        } else {
            anim = [0, 1];
        }
        animating = true;
        let obj = { t: 0 };
        anime({
            targets: obj,
            t: anim,
            complete: () => {
                animating = false;
                daytime = !daytime;
            },
            update: () => {
                game.sunLight.intensity = 3.5 * (1 - obj.t);
                game.moonLight.intensity = 3.5 * obj.t;

                game.sunLight.translateY(20 * (1 - obj.t));
                game.moonLight.translateY(20 * obj.t);

                sunBackground.style.opacity = Number(1 - obj.t).toString();
                moonBackground.style.opacity = Number(obj.t).toString();
            },
            easing: 'easeInOutSine',
            duration: 500,
        })
    }
}