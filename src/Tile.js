//the Game Object of a tile
export default class Tile {
    constructor(x, y) {
        //most of these are assigned later but defining them here too for readability, with default values

        //geographic properties
        this.x = x;
        this.y = y;
        this.region = 0;
        this.altVal = 50;
        this.tempVal = 50;
        this.wetVal = 50;
        this.water = false;
        this.waterSource = false;
        this.forest = false;
        this.coastal = false;
        this.hilly = false;
        this.river = ""; //other values are strings containing "N" "E" "S" "W", denoting how to render the river
        this.riverId = 0;   //so rivers cannot flow back onto themselves. 0 is not a river

        //game engine properties
        this.id = "x";
        this.active = true;
        this.discovered = false;
        this.gems = false;
        this.entities = [];
        this.selected = false;
    }
}