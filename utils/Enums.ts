export enum TextureType {
    STONE_TEXTURE,
    DIRT_TEXTURE,
    GRASS_TEXTURE,
    SAND_TEXTURE,
    DIRT2_TEXTURE,
    WATER_TEXTURE
}

export enum MapShape {
    BOX,
    CIRCLE
}

export enum TerrainType {
    SWAMP,
    PLAINS,
    MOUNTAIN,
    ISLAND,
    FOREST,
    DESERT
}

export enum TileStatus {
    NORMAL,
    HOVERED,
    REACHABLE,
    PATH,
    SELECTED,
    ATTACKZONE,
    ATTACKTARGET,
    TARGET,
    FOV
}

export enum Action {
    NONE,
    SELECT_TILE,
    MOVE_UNIT,
    ATTACK
}

export enum AIProfile {
    AGGRESIVE,
    RANGED,
    SUPPORT,
    COWARD
}