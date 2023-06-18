// the classes that handle how the game works

// for now the engine is pretty simple, each key press is handled by the Engine
// sometimes stepping forward a "turn"
// moving the AI agents at the end of a turn

//the Game Object of a tile
class Tile {
  constructor(x, y) {
    //most of these are assigned later but defining them here too for readability, with default values
    this.x = x;
    this.y = y;
    this.id = "x";
    this.alt = 50;
    this.temp = 50;
    this.wet = 50;
    this.water = false;
    this.forest = false;
    this.coastal = false;
  }

  underMouse(mouseXCoord, mouseYCoord) {
    return mouseXCoord == this.x && mouseYCoord == this.y;
  }
}

//the game object that is the entire board, responsible for the 2x2 array of tiles only
class Board {
  constructor(dims = 25) {
    this.dims = dims;
    this.grid = [];

    for (let i = 0; i < dims; i++) this.grid[i] = [];
  }
}

//responsible for how the world is generated, constuctor takes in parameters used to tweak generation
class WorldGenerator {
  constructor(params) {
    this.noiseProfiles = [random(100), random(100), random(100)];
    Object.keys(params).forEach(k => {
      this[k] = params[k];
    });
  }

  genGrid(grid) {
    //generate initial tile data from perlin noise & latitude and wind
    for (let i = 0; i < BOARDSIZE; i++) {
      for (let j = 0; j < BOARDSIZE; j++) {
        let tile = this.genNewTile(i, j);
        grid[i][j] = tile;
        grid[i][j].id = `${j * grid[i].length + i}`;
      }
    }

    //generate mountain ridges & sea trenches (using continent data??)

    //process tiles using neighbouring information
    for (let i = 0; i < BOARDSIZE; i++) {
      for (let j = 0; j < BOARDSIZE; j++) {
        //make tiles next to saltwater coastal
        let { top, right, bottom, left } = this.getNeighbouringTiles(i, j);

        //set coastal tiles
        if (
          (grid[i][top].water == "saltwater" ||
            grid[i][bottom].water == "saltwater" ||
            grid[left][j].water == "saltwater" ||
            grid[right][j].water == "saltwater") &&
          grid[i][j].water !== "saltwater"
        ) {
          grid[i][j].coastal = grid[i][j].altVal > this.alts.lowlandsLevel ? "cliffs" : "coast";
        }
      }
    }

    //do a game of life pass on wether tiles are forested  TODO

    return grid;
  }

  getNeighbouringTiles(i, j) {
    let top = j - 1 < 0 ? j : j - 1;
    let right = i + 1 >= BOARDSIZE ? i : i + 1;
    let bottom = j + 1 >= BOARDSIZE ? j : j + 1;
    let left = i - 1 < 0 ? i : i - 1;

    return { top, right, bottom, left };
  }

  genNewTile(i, j) {
    let tile = new Tile(i, j);

    noiseSeed(this.noiseProfiles[0]);
    let alt = floor(noise(i * this.roughness, j * this.roughness) * 100);
    tile.altVal = alt;
    if (alt < this.alts.deepseaLevel) tile.alt = this.alts.deepsea;
    else if (alt < this.alts.seaLevel) tile.alt = this.alts.sea;
    else if (alt < this.alts.lowlandsLevel) tile.alt = this.alts.lowlands;
    else if (alt < this.alts.highlandsLevel) tile.alt = this.alts.highlands;
    else tile.alt = this.alts.mountains;

    noiseSeed(this.noiseProfiles[1]);
    //made water distribution have less roughness than land because seems right
    let wet = alt < this.alts.seaLevel ? 100 : floor(
      noise(i * this.roughness * 0.8, j * this.roughness * 0.8) * 100
    );
    tile.wetVal = wet;
    if (wet < this.wets.desertLevel) tile.wet = this.wets.desert;
    else if (wet < this.wets.dryLevel) tile.wet = this.wets.dry;
    else tile.wet = this.wets.wet;

    //temperature should vary primarily by latitude
    //a quadratic distribution for temps so midrange tiles are hottest and top and bottom are coldest,
    //no matter the range of j's, but always between 0 and 50
    //-(200/(dims*dims))*(j-dims)j = temp

    noiseSeed(this.noiseProfiles[2]);
    let temp =
    floor(-(200 / (BOARDSIZE * BOARDSIZE)) * (j - BOARDSIZE) * j +
      noise(i * this.roughness, j * this.roughness) * 50);
    tile.tempVal = temp;
    if (temp < this.temps.frozenLevel) tile.temp = this.temps.frozen;
    else if (temp < this.temps.coldLevel) tile.temp = this.temps.cold;
    else if (temp < this.temps.mildLevel) tile.temp = this.temps.mild;
    else if (temp < this.temps.warmLevel) tile.temp = this.temps.warm;
    else tile.temp = this.temps.hot;

    //set water tiles
    if (tile.alt == "deepsea" || tile.alt == "sea") tile.water = "saltwater";
    else if ((tile.wet == "desert") & (random() < this.hydration / 4))
      tile.water = "freshwater";
    else if ((tile.wet == "dry") & (random() < this.hydration / 2))
      tile.water = "freshwater";
    else if ((tile.wet == "wet") & (random() < this.hydratrion))
      tile.water = "freshwater";

    //set forestation
    if (
      tile.water == false &&
      tile.alt !== "mountain" &&
      tile.wet !== "desert" &&
      random() < this.forestation
    ) {
      if (tile.temp !== "frozen" && tile.temp !== "hot") tile.forest = "forest";
      else if (tile.temp == "hot") tile.forest = "jungle";
    }

    return tile;
  }
}

//object responsible for game rules
class Engine { }
