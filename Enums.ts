export enum TextureType {
    STONE_TEXTURE,
    DIRT_TEXTURE,
    GRASS_TEXTURE,
    SAND_TEXTURE,
    DIRT2_TEXTURE,
    WATER_TEXTURE
}

export enum TileStatus {
    NORMAL,
    HOVERED,
    SELECTED,
    REACHABLE,
    TARGET,
    FOV
}

export enum Actions {
    SELECT_TILE,
    MOVE_UNIT
}