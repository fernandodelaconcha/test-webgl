import anime from 'animejs';
import { Game } from './Game';

let daytime = true;
let animating = false;

export class DayNightControls {
    
    animate(game: Game): void {
        const scenario: HTMLElement = document.querySelector(".scenario") as HTMLElement;
        if (animating) return;
        let anim: Array<number>;
        if (!daytime) {
            anim = [1, 0];
        } else {
            anim = [0, 1];
        }
        animating = true;
        const obj = { t: 0 };
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
                scenario.style.background = !daytime ? 'linear-gradient(45deg, rgb(255 219 158), rgb(253 243 220))' : 'linear-gradient(313deg, #0b1a2b 33%, #3a6291 111%)';
            },
            easing: 'easeInOutSine',
            duration: 500,
        })
    }
}