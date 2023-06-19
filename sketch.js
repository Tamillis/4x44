//can a simple web based 4x game be made that's finishable in 44 minutes? Let's call that 50 'turns'
let debug;
let radio;
let debugData = {};

let board;
let screen;
let engine;
let worldGenerator;
let worldParams;

const BOARDSIZE = 100;
const BOARDSCALES = [5, 10, 25, 50, 100];

function preload() {
  worldParams = loadJSON("./worldParams.json");
}

function setup() {
  let cnv = createCanvas(BOARDSIZE * 6, BOARDSIZE * 6);
  cnv.parent("main");
  document.getElementById("defaultCanvas0").oncontextmenu = (e) => false; //disables right click menu

  frameRate(120);

  debug = createCheckbox("Debug", false);
  debug.parent("main");

  radio = createRadio();
  radio.option('geo');
  radio.selected("geo");
  radio.option('water');
  radio.option('temp');
  radio.option('height');
  radio.parent("main");

  worldGenerator = new WorldGenerator(worldParams);
  board = new Board(BOARDSIZE);
  resetBoard();

  screen = new Screen(BOARDSCALES, BOARDSIZE);
  screen.draw(board.grid);

  engine = new Engine();
}

function draw() {
  document.getElementById("framerate").innerHTML = Math.floor(frameRate());

  //background(120, 255, 120);

  let mouseCoords = screen.pxToBoardCoords(mouseX, mouseY);
  engine.setActiveTiles(board.grid, mouseCoords.x, mouseCoords.y);

  //draw grid
  screen.mode = radio.value();
  screen.draw(board.grid);

  if (debug.checked()) {
    loadDebugData();
    drawDebugBox();
  }
}

function loadDebugData() {
  // debugData.screenX = screen.x;
  // debugData.screenY = screen.y;

  let { x, y } = screen.pxToBoardCoords(mouseX, mouseY);
  if (x < 0 || x >= BOARDSIZE || y < 0 || y >= BOARDSIZE) return;
  debugData.x = board.grid[x][y].x;
  debugData.y = board.grid[x][y].y;
  debugData.alt = board.grid[x][y].alt + " - " + board.grid[x][y].altVal;
  debugData.wet = board.grid[x][y].wet + " - " + board.grid[x][y].wetVal;
  debugData.temp = board.grid[x][y].temp + " - " + board.grid[x][y].tempVal;
  debugData.water = board.grid[x][y].water;
  debugData.forest = board.grid[x][y].forest;
  debugData.coastal = board.grid[x][y].coastal;
}

function drawDebugBox() {
  push();
  textAlign(LEFT, CENTER);
  fill(255);
  strokeWeight(1);
  rect(15, 15, width / 2 - 15, Object.keys(debugData).length * 18);
  fill(0);
  strokeWeight(2);
  Object.keys(debugData).forEach((k, i) => {
    text(k + " : " + debugData[k], 25, 25 + i * 18);
  });
  pop();
}

function keyPressed() {
  if (key == "r") resetBoard();
  else if ([LEFT_ARROW, UP_ARROW, DOWN_ARROW, RIGHT_ARROW].includes(keyCode) || ["+", "-"].includes(key)) {
    screen.keyPressed();
    rerenderBoard();
  }


}

function mousePressed(e) {
  if (mouseX < 0 || mouseX > width || mouseY < 0 || mouseY > height) return;
  else if (mouseButton === RIGHT) {
    resetBoard();
    rerenderBoard();
  }
  else {
    screen.mousePressed(board.grid);
    //set all tiles to active to rerender them.
    rerenderBoard()
  }
}

function resetBoard() {
  worldGenerator = new WorldGenerator(worldParams);
  board.grid = worldGenerator.genGrid(board.grid);
}

function rerenderBoard() {
  for (let i = 0; i < BOARDSIZE; i++) {
    for (let j = 0; j < BOARDSIZE; j++) {
      board.grid[i][j].active = true;
    }
  }
  screen.draw(board.grid);
}