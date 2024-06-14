import anime from 'animejs';
import { Game } from './Game';

let daytime = true;
let animating = false;

export class DayNightControls {

    animate(game: Game): void {
        const scenario: HTMLElement = document.querySelector("#bg") as HTMLElement;
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
                const color: string = `color-mix(in srgb, #0b1a2b ${obj.t * 100}% , rgb(255 219 158))`;
                const secondColor: string = `color-mix(in srgb, #3a6291 ${obj.t * 100}% , rgb(253 243 220))`;
                scenario.style.background = `linear-gradient(45deg, ${color}, ${secondColor})`;
            },
            easing: 'easeInOutSine',
            duration: 500,
        })
    }
}