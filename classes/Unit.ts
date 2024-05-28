export class Unit {
    id: string;
    team: number;
    type: string;
    maxHp: number;
    currentHp: number;
    constructor(team: number, type: string, maxHp: number) {
        this.team = team;
        this.type = type;
        this.maxHp = maxHp;
        this.currentHp = maxHp;
    }
}