// the classes that handle how the game works

// for now the engine is pretty simple, each key press is handled by the Engine
// sometimes stepping forward a "turn"
// moving the AI agents at the end of a turn

//the game object that is the entire board, responsible for the 2x2 array of tiles and any properties true for the entire board (like wind)
export class Board {
  constructor(dims = 25) {
    this.dims = dims;
    this.grid = [];
    this.wind = { x: 0, y: 0 };

    for (let i = 0; i < dims; i++) this.grid[i] = [];
  }
}

//object responsible for game rules
export class Engine {
  setActiveTiles(grid, mx, my) {
    //set all tiles to inactive initially
    for (let i = 0; i < grid.length; i++) {
      for (let j = 0; j < grid[i].length; j++) {
        grid[i][j].active = grid[i][j].underMouse(mx, my);
      }
    }

    //other events may set tiles to active, i/e to re-render
  }
}
