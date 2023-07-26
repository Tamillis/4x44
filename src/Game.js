// the classes that handle how the game works

// for now the engine is pretty simple, each key press is handled by the Engine
// sometimes stepping forward a "turn"
// moving the AI agents at the end of a turn

import { Utils } from "./utils/func.js";
import Tile from "./Tile.js";

//the game object that is the entire board, responsible for the 2x2 array of tiles and any properties true for the entire board, like wind
export class Board {
  constructor(dims = 25) {
    this.dims = dims;
    this.grid = [];

    for (let i = 0; i < dims; i++) this.grid[i] = [];

    this.wind;
  }

  discoverAll() {
    for (let i = 0; i < this.grid.length; i++) {
      for (let j = 0; j < this.grid.length; j++) {
        this.grid[i][j].discovered = true;
      }
    }
  }
}

//object responsible for game rules
export class Engine {
  constructor() {
    this.startPos = { x: NaN, y: NaN };
    this.entities = [];
    this.selectedEntity = null;
    this.selectedEntities = [];
    this.activeTiles = [];
    this.entityUpdated = false;

    this.priorTile = false;
  }

  setActiveTiles(grid, mx, my) {
    //set all tiles to inactive initially
    for (let i = 0; i < grid.length; i++) {
      for (let j = 0; j < grid[i].length; j++) {
        let tile = grid[i][j];
        tile.active = false;
      }
    }

    //set tiles in activeTiles list to active
    for (let n = 0; n < this.activeTiles.length; n++) {
      let x = this.activeTiles[n][0];
      let y = this.activeTiles[n][1];
      grid[x][y].active = true;
    }

    //set tile under mouse to active
    grid[mx][my].active = true;

    //clear this.activeTiles
    this.activeTiles = [];
  }

  spawnPlayer(grid) {
    //get all coastal tiles, pick one at random
    let coastalTiles = [];
    for (let i = 0; i < grid.length; i++) {
      for (let j = 0; j < grid[i].length; j++) {
        if (grid[i][j].coastal) coastalTiles.push(grid[i][j]);
      }
    }

    let startTile = Utils.rnd(coastalTiles);

    this.startPos.x = startTile.x;
    this.startPos.y = startTile.y;

    let scout = new Unit("scout", startTile.x, startTile.y, 3);
    scout.vision = 4;
    scout.selected = true;

    this.selectedEntity = scout;
    this.entities.push(scout);

    return { x: startTile.x, y: startTile.y };
  }

  revealTiles(grid, x = null, y = null) {
    //this whole system is suss and will probably change drastically

    //make tiles "visible" from whatever entities should reveal, specifically at x y or the whole list of entities
    let entities = x == null && y == null ? this.entities : this.entities.filter(e => e.x == x && e.y == y);
    if (entities.length == 0) return;

    entities.forEach(e => {
      let visionRange = e.vision;
      if (grid[e.x][e.y].hilly) visionRange++;
      this.setDiscoveredTiles(grid, e.x, e.y, visionRange);
    });
  }

  setDiscoveredTiles(grid, x, y, visionRange, first = true) {
    if (visionRange < 1 || x < 0 || y < 0 || x >= grid.length || y >= grid.length) return;

    grid[x][y].discovered = true;
    this.activeTiles.push([x, y]);
    let val = this.getObstruction(grid[x][y]);
    if (!first) visionRange -= 1 + val;

    this.setDiscoveredTiles(grid, x - 1, y, visionRange, false);
    this.setDiscoveredTiles(grid, x + 1, y, visionRange, false);
    this.setDiscoveredTiles(grid, x, y - 1, visionRange, false);
    this.setDiscoveredTiles(grid, x, y + 1, visionRange, false);
  }

  getObstruction(tile) {
    let val = 0;
    if (tile.alt == "mountains") return 3;
    if (tile.hilly) val++;
    if (tile.forested) val++;
    return val;
  }

  select(grid, x, y) {
    if (this.priorTile == grid[x][y]) {
      grid[x][y].selected = !grid[x][y].selected;
      if (!grid[x][y].selected) this.selectedEntities = [];
      else this.selectedEntities = this.getEntitiesAtTile(grid, x, y);
    }
    else {
      grid[x][y].selected = true;
      this.selectedEntities = this.getEntitiesAtTile(grid, x, y);

      if (this.priorTile) this.priorTile.selected = false;
      this.priorTile = grid[x][y];
    }

    document.getElementById("selectedEntities").innerHTML = JSON.stringify(this.selectedEntities);
  }

  moveSelectedEntity(x, y) {
    //set old position to active
    this.activeTiles.push([this.selectedEntity.x, this.selectedEntity.y]);

    //update its position
    this.selectedEntity.x += x;
    this.selectedEntity.y += y;

    //set new position to active
    this.activeTiles.push([this.selectedEntity.x, this.selectedEntity.y]);

    //change engine state so external renderer can notice and update entities
    this.entityUpdated = true;
  }

  getEntitiesAtTile(grid, x, y) {
    let entities = [];
    for (let i = 0; i < grid.length; i++) {
      for (let j = 0; j < grid[i].length; j++) {
        if (i == x && j == y) grid[i][j].entities.forEach(e=> entities.push(e));
      }
    }

    this.entities.forEach(e => {
      if(e.x == x && e.y == y) entities.push(e);
    });

    return entities;
  }
}

export class Entity {
  constructor(type, x, y) {
    this.type = type;
    this.x = x;
    this.y = y;
    this.vision = 0;
    this.selected = false;
  }
}

export class Unit extends Entity {
  //entities that are supposed to move around the board
  constructor(type, x, y, mov = 0) {
    super(type, x, y);
    this.movement = mov;
  }
}

export class Feature extends Entity {
  //entities that are supposed to be static features or improvements of a tile
  constructor(type, x, y) {
    super(type, x, y);
  }
}

export class EntityManager {
  spawnEntity(type, x, y) {
    let newEntity = new Entity(type, x, y);

  }
}