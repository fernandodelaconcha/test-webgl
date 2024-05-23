export class Unit {
    id: string;
    type: string;
    maxHp: number;
    currentHp: number;
    constructor(type: string, maxHp: number) {
        this.type = type;
        this.maxHp = maxHp;
        this.currentHp = maxHp;
    }
}