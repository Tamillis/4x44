//can a simple web based 4x game be made that's finishable in 44 minutes? Let's call that 50 'turns'
let debug;
let debugData = {};

let board;
let screen;
let worldGenerator;
let worldParams;

const BOARDSIZE = 40;
const BOARDSCALES = [10,25,50,100];

function preload() {
  worldParams = loadJSON("./worldParams.json");
}

function setup() {
  let cnv = createCanvas(400, 400);
  cnv.parent("main");
  document.getElementById("defaultCanvas0").oncontextmenu = (e) => false;

  debug = createCheckbox("Debug", false);
  debug.parent("main");

  worldGenerator = new WorldGenerator(worldParams);
  board = new Board(BOARDSIZE);
  resetBoard();
  screen = new Screen(BOARDSCALES, BOARDSIZE);
}

function draw() {
  background(120, 255, 120);

  //draw grid
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
  else screen.keyPressed();
}

function mousePressed(e) {
  if (mouseX < 0 || mouseX > width || mouseY < 0 || mouseY > height) return;
  else if (mouseButton === RIGHT) resetBoard();
  else screen.mousePressed(board.grid);
}

function resetBoard() {
  worldGenerator = new WorldGenerator(worldParams);
  board.grid = worldGenerator.genGrid(board.grid);
}
