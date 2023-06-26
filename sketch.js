import { WorldGenerator } from "./worldGen.js";
import {Screen} from "./Screen.js";
import { Board, Engine } from "./Game.js";
import "./p5.js";

//can a simple web based 4x game be made that's finishable in 44 minutes? Let's call that 50 'turns'

let game = (s) => {
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

  s.preload = function () {
    worldParams = s.loadJSON("./worldParams.json");
  }

  s.setup = function () {
    //TODO setup the entire sketch in a worker so that mapgen can have a loading screen

    debug = document.getElementById("debug").checked;
    let cnv = s.createCanvas(SCREENSIZE, SCREENSIZE);
    cnv.parent("canvas-container");
    document.getElementById("defaultCanvas0").oncontextmenu = (e) => false; //disables right click menu

    board = new Board(BOARDSIZE);
    s.resetBoard();
    
    screen = new Screen(s, BOARDSCALES, BOARDSIZE);
    screen.checkBounds();
    screen.priorMode = s.getMode();
    screen.mode = s.getMode();
    screen.rerender(board.grid);

    engine = new Engine();
  }

  s.draw = function () {
    document.getElementById("framerate").innerHTML = Math.floor(s.frameRate());

    let mouseCoords = screen.pxToBoardCoords(s.mouseX, s.mouseY);
    engine.setActiveTiles(board.grid, mouseCoords.x, mouseCoords.y);

    //draw grid
    screen.mode = s.getMode();
    if (screen.priorMode !== screen.mode) screen.rerender(board.grid);
    else screen.draw(board.grid);
    screen.priorMode = screen.mode;
    
    debug = document.getElementById("debug").checked;

    if (debug) {
      s.loadDebugData();
      s.drawDebugBox();
    }
  }

  s.loadDebugData = function () {
    // debugData.screenX = screen.x;
    // debugData.screenY = screen.y;

    let { x, y } = screen.pxToBoardCoords(s.mouseX, s.mouseY);
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

  s.drawDebugBox = function () {
    //basic debug info for tile under mouse
    const border = 15;
    let x = border, y = border;
    const w = s.width / 4 + x * 2;
    const tSize = 12;
    const h = Object.keys(debugData).length * (tSize + 2);

    if (s.mouseX >= x && s.mouseX <= x + w && s.mouseY >= y && s.mouseY <= y + h) x = s.width - w - border;

    s.push();
    s.textSize(tSize);
    s.textAlign(s.LEFT, s.TOP);
    s.fill(255);
    s.strokeWeight(1);
    s.rect(x, y, w, h);
    s.fill(0);
    s.strokeWeight(2);
    Object.keys(debugData).forEach((k, i) => {
      s.text(k + " : " + debugData[k], x + 5, y + 5 + i * (tSize + 1));
    });

    //wind indicator crosshair
    let crosshair = { x: x + w - border * 2, y: y + h / 2 };
    s.textAlign(s.CENTER, s.CENTER);
    s.noStroke(1);
    s.text("Wind:", crosshair.x, crosshair.y - border * 3);

    s.strokeWeight(2);
    s.stroke(0);
    s.line(crosshair.x - border * 2, crosshair.y, crosshair.x + border * 2, crosshair.y);
    s.line(crosshair.x, crosshair.y - border * 2, crosshair.x, crosshair.y + border * 2);

    s.strokeWeight(4);
    s.stroke("#AAA");
    s.line(crosshair.x, crosshair.y, 0.25 * board.wind.x + crosshair.x, 0.25 * board.wind.y + crosshair.y);
    s.pop();
  }

  s.keyPressed = function () {
    if (s.key == "r") s.resetBoard();
    else if ([s.LEFT_ARROW, s.UP_ARROW, s.DOWN_ARROW, s.RIGHT_ARROW].includes(s.keyCode) || ["+", "-"].includes(s.key)) {
      screen.keyPressed();
      screen.rerender(board.grid);
    }


  }

  s.mousePressed = function (e) {
    if (s.mouseX < 0 || s.mouseX > s.width || s.mouseY < 0 || s.mouseY > s.height) return;
    else if (s.mouseButton === s.RIGHT) {
      s.resetBoard();
      screen.rerender(board.grid);
    }
    else {
      screen.mousePressed();
      screen.rerender(board.grid)
    }
  }

  s.resetBoard = function () {
    worldGenerator = new WorldGenerator(worldParams, BOARDSIZE, s.noise, s.noiseSeed);
    board.grid = worldGenerator.genGrid(board.grid);
    board.wind = getRandomVectorForce(100, 50);
  }

  s.getMode = function() {
    let radioBtns = document.getElementsByName("mode");
    let mode = "geo";

    for (let btn of radioBtns) {
        if (btn.checked) mode = btn.value;
    }

    return mode;
}
}


const P5 = new p5(game);