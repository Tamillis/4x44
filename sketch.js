//can a simple web based 4x game be made that's finishable in 44 minutes? Let's call that 50 'turns'
let debugData = {};
let debug = false;

let board;
let screen;
let engine;
let worldGenerator;
let worldParams;

const BOARDSIZE = 100;
const SCREENSIZE = 600;
const BOARDSCALES = [5, 10, 25, 50, 100];

function preload() {
  worldParams = loadJSON("./worldParams.json");
}

function setSelectedMode(radioElementClicked) {
  screen.mode = radioElementClicked.value;
  rerenderBoard();
}

function getMode() {
  let radioBtns = document.getElementsByName("mode");
  let mode = "";

  for(let btn of radioBtns) {
    if(btn.checked) mode = btn.value;
  }

  return mode;
}

function setup() {
  debug = document.getElementById("debug").checked;
  let cnv = createCanvas(SCREENSIZE, SCREENSIZE);
  cnv.parent("canvas-container");
  document.getElementById("defaultCanvas0").oncontextmenu = (e) => false; //disables right click menu

  worldGenerator = new WorldGenerator(worldParams);
  board = new Board(BOARDSIZE);
  resetBoard();

  screen = new Screen(BOARDSCALES, BOARDSIZE);
  screen.checkBounds();
  screen.mode = this.getMode();
  screen.draw(board.grid);

  engine = new Engine();
}

function draw() {
  document.getElementById("framerate").innerHTML = Math.floor(frameRate());

  let mouseCoords = screen.pxToBoardCoords(mouseX, mouseY);
  engine.setActiveTiles(board.grid, mouseCoords.x, mouseCoords.y);

  //draw grid
  screen.draw(board.grid);
  debug = document.getElementById("debug").checked;

  if (debug) {
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
  debugData.region = board.grid[x][y].region;
  debugData.hilly = board.grid[x][y].hilly;
}

function drawDebugBox() {
  //basic debug info for tile under mouse
  const border = 15;
  let x = border, y = border;
  const w = width / 4 + x * 2;
  const tSize = 12;
  const h = Object.keys(debugData).length * (tSize + 2);

  if (mouseX >= x && mouseX <= x + w && mouseY >= y && mouseY <= y + h) x = width - w - border;

  push();
  textSize(tSize);
  textAlign(LEFT, TOP);
  fill(255);
  strokeWeight(1);
  rect(x, y, w, h);
  fill(0);
  strokeWeight(2);
  Object.keys(debugData).forEach((k, i) => {
    text(k + " : " + debugData[k], x + 5, y + 5 + i * (tSize + 1));
  });

  //wind indicator crosshair
  let crosshair = { x: x + w - border * 2, y: y + h / 2 };
  textAlign(CENTER, CENTER);
  noStroke(1);
  text("Wind:", crosshair.x, crosshair.y - border * 3);

  strokeWeight(2);
  stroke(0);
  line(crosshair.x - border * 2, crosshair.y, crosshair.x + border * 2, crosshair.y);
  line(crosshair.x, crosshair.y - border * 2, crosshair.x, crosshair.y + border * 2);

  strokeWeight(4);
  stroke("#AAA");
  line(crosshair.x, crosshair.y, 0.25 * board.wind.x + crosshair.x, 0.25 * board.wind.y + crosshair.y);
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
  board.wind = worldGenerator.getVectorForce(100, 50);
}

function rerenderBoard() {
  for (let i = 0; i < BOARDSIZE; i++) {
    for (let j = 0; j < BOARDSIZE; j++) {
      board.grid[i][j].active = true;
    }
  }
  screen.draw(board.grid);
}