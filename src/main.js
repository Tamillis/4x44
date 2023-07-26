import { Screen } from "./Screen.js";
import { Board, Engine } from "./Game.js";
import "./lib/p5.js";
import "./utils/func.js";
import { Utils } from "./utils/func.js";
import InputController from "./InputController.js";
import UIController from "./UIController.js";

//can a simple web based 4x game be made that's finishable in 44 minutes? Let's call that 50 'turns'

//TODO phase out p5 for my own custom renderer.

//for some reason utils as a static class wasn't running its static initialiser first, so a manual .init() is used to force initialisation
Utils.init(document.getElementById("seed").value);

let game = (s) => {
  let debugData = {};
  let debug = false;

  //game objects
  let uiController;
  let inputController;
  let board;
  let screen;
  let engine;

  //world generation objects & variable
  let worldParams;
  let worldGenWorker;
  let worldGenerating = false;
  let latestMessage = "P5 Loading";

  //game constants
  const BOARDSIZE = 100;
  const SCREENSIZE = 600;
  const BOARDSCALES = [5, 10, 25, 50, 100];

  s.preload = function () {
    worldParams = s.loadJSON("./src/assets/worldParams.json");
  }

  s.setup = function () {
    debug = document.getElementById("debug").checked;
    let cnv = s.createCanvas(SCREENSIZE, SCREENSIZE);
    cnv.parent("canvas-container");
    document.getElementById("defaultCanvas0").oncontextmenu = (e) => false; //disables right click menu

    board = new Board(BOARDSIZE);
    engine = new Engine(board.grid);
    s.resetBoard();

    screen = new Screen(s, BOARDSCALES, BOARDSIZE);
    screen.checkBounds();
    screen.priorMode = s.getMode();
    screen.mode = s.getMode();

    inputController = new InputController(screen, board, engine);
    inputController.debug = debug;

    uiController = new UIController();
  }

  s.draw = function () {
    document.getElementById("framerate").innerHTML = Math.floor(s.frameRate());

    if (worldGenerating) {
      s.drawLoadScreen();
      return;
    }

    //refresh active tiles
    let mouseCoords = screen.pxToBoardCoords(s.mouseX, s.mouseY);
    if (mouseCoords.x < 0 || mouseCoords.x >= BOARDSIZE || mouseCoords.y < 0 || mouseCoords.y >= BOARDSIZE) { }
    else {
      if(engine.entityUpdated) {
        engine.entityUpdated = false;
        engine.revealTiles(board.grid);
      }
      engine.setActiveTiles(board.grid, mouseCoords.x, mouseCoords.y);
    }

    //draw grid & entities
    screen.mode = s.getMode();

    if (screen.priorMode !== screen.mode) screen.rerender(board.grid, engine.entities);
    else screen.draw(board.grid, engine.entities);
    screen.priorMode = screen.mode;

    debug = document.getElementById("debug").checked;
    inputController.debug = debug;

    //TODO put in screen class
    let { x, y } = screen.pxToBoardCoords(s.mouseX, s.mouseY);
    if (debug && x >= 0 && y >= 0 && x < BOARDSIZE && y < BOARDSIZE) {
      s.loadDebugData(x, y);
      s.drawDebugBox();
    }
  }

  s.drawLoadScreen = function () {
    s.background(255);
    let w = latestMessage.length * 8;
    s.fill(255);
    s.rect(s.width / 2 - w / 2, s.height / 2 - 10, w, 20);
    s.fill(0);
    s.textAlign(s.CENTER, s.CENTER);
    s.text(latestMessage, s.width / 2, s.height / 2);
  }

  s.loadDebugData = function (x, y) {
    // debugData.screenX = screen.x;
    // debugData.screenY = screen.y;
    debugData.x = board.grid[x][y].x;
    debugData.y = board.grid[x][y].y;
    debugData.alt = board.grid[x][y].alt + " - " + board.grid[x][y].altVal;
    debugData.wet = board.grid[x][y].wet + " - " + board.grid[x][y].wetVal;
    debugData.temp = board.grid[x][y].temp + " - " + board.grid[x][y].tempVal;
    debugData.water = board.grid[x][y].water;
    debugData.waterSource = board.grid[x][y].waterSource;
    debugData.river = board.grid[x][y].river;
    debugData.riverId = board.grid[x][y].riverId;
    debugData.forest = board.grid[x][y].forest;
    debugData.coastal = board.grid[x][y].coastal;
    debugData.region = board.grid[x][y].region;
    //debugData.hilly = board.grid[x][y].hilly;
    //debugData.entities = board.grid[x][y].entities.length > 0 ? board.grid[x][y].entities.reduce((acc, curr) => acc += " " + curr.type, "") : "";
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
    //TODO remake resetBoard functionality in a way that makes it not awfully tightly knit to this p5 closure, probs when getting rid of p5
    if (s.key == inputController.resetKey && debug) {
      s.resetBoard();
      return;
    }
    
    inputController.handleInput(s.key);
    uiController.update(engine.selectedEntities);
  }

  s.mousePressed = function () {
    if (s.mouseX < 0 || s.mouseX > s.width || s.mouseY < 0 || s.mouseY > s.height || worldGenerating) return;
    else {
      //just before I remove p5 this is a little conversion from p5 language back to Mozilla mouse button values
      let keyCode = -1;
      if(s.mouseButton === s.LEFT) keyCode = 0;
      else if(s.mouseButton === s.CENTER) keyCode = 1;
      else if(s.mouseButton === s.RIGHT) keyCode = 2;

      inputController.handleInput(keyCode, true, s.mouseX, s.mouseY);
      uiController.update(engine.selectedEntities);
    }
  }

  s.resetBoard = function () {
    Utils.init(document.getElementById("seed").value);
    if (debug) console.log("Seed: ", Utils.seed);

    worldGenerating = true;
    latestMessage = "Generating";

    worldGenWorker = new Worker("/src/utils/worldGenWorker.js", { type: "module" });

    worldGenWorker.addEventListener("message", (e) => {
      latestMessage = e.data.message;
      if (debug) console.log(latestMessage);
      if (latestMessage == "Done") {
        //setup the game, TODO put this somewhere more appropriate???
        board.grid = e.data.grid;
        board.wind = e.data.wind;
        let player = engine.spawnPlayer(board.grid);
        engine.spawnGems(board.grid, worldParams.alts.seaLevel, worldParams.alts.highlandsLevel);
        engine.revealTiles(board.grid, player.x, player.y);
        screen.setScale(BOARDSCALES.length - 1);
        screen.focus(engine.startPos.x, engine.startPos.y);
        screen.rerender(board.grid, engine.entities);
        worldGenerating = false;
      }
    });

    worldGenWorker.postMessage({ worldParams: worldParams, board: board, seed: Utils.seed, debug: debug });
  }

  s.getMode = function () {
    let radioBtns = document.getElementsByName("mode");
    let mode = "geo";

    for (let btn of radioBtns) {
      if (btn.checked) mode = btn.value;
    }

    return mode;
  }
}


const P5 = new p5(game);