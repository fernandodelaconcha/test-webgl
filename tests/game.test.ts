import { expect } from 'chai';
import { Game } from '../classes/Game';

describe('game', () => {
    it('game constructor to be called', () => {
        const canvas = new HTMLCanvasElement();
        const game = new Game(canvas, 400, 400, .1, 1000);
        expect(game).to.be.true;
    });

});