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

export enum TileStatus {
    NORMAL,
    HOVERED,
    REACHABLE,
    PATH,
    SELECTED,
    TARGET,
    FOV
}

export enum Action {
    NONE,
    SELECT_TILE,
    MOVE_UNIT
}

export enum AIProfile {
    AGGRESIVE,
    RANGED,
    SUPPORT
}