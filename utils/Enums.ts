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

export enum Actions {
    NONE,
    SELECT_TILE,
    MOVE_UNIT
}