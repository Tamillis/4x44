//holds classes to do with the function of the visible board

export class Screen {
  constructor(p5, scales = [5, 10, 25, 50], dims = 50) {
    //screen coords
    this.x = 0;
    this.y = 0;
    this.scales = scales;
    this.scaleStep = 0;
    this.scale = scales[this.scaleStep];
    this.dims = dims;
    this.border = this.scale * 4; //amount of white space around the map visible in px
    this.moveStep = 2; //amount to move per movekey in cells
    this.p5 = p5;
    this.buffer = p5.createGraphics(p5.width, p5.height);
    this.mode = "geo";
    this.priorMode = "geo";

    this.unknown = "#888";
    this.ocean = "#2B65EC";
    this.deepocean = "#204FBD";
    this.sand = "#C2B280";
    this.grass = "#7CFC00";
    this.hills = "#8C8F56";
    this.woods = "#2A7E19";
    this.rock = "#5A4D41";
    this.ice = "#A5F2F3";
    this.river = "#00CAF1";
    this.snow = "#fffafa";
    this.jungle = "#29ab46";
  }

  draw(grid) {
    //draw the cells passed in via the 2D grid

    //use a p5js createGraphics renderer object as an offscreen buffer
    let buffer = this.buffer;
    buffer.textAlign(this.p5.CENTER, this.p5.CENTER);
    buffer.noStroke();

    //only render on screen tiles
    for (let i = 0; i < this.p5.width / this.scale; i++) {
      for (let j = 0; j < this.p5.height / this.scale; j++) {
        let x = i + this.x;
        let y = j + this.y;
        //don't try to render tiles that don't exist or don't need to be rendered
        if (x >= this.dims || x < 0 || y >= this.dims || y < 0) {
          buffer.fill(120, 255, 120);
          buffer.rect(i * this.scale, j * this.scale, this.scale, this.scale);
          continue;
        }

        //only need to redraw cells that have changed, i.e. set to active by the engine
        if (!grid[x][y].active) continue;

        //draw base tile colour
        buffer.fill(this.getTileFill(grid[x][y]));
        buffer.rect(i * this.scale, j * this.scale, this.scale, this.scale);

        //below are special draw calls for geo mode only
        if (this.mode == "geo") this.drawGeoFeatures(buffer, grid[x][y], i, j);
      }
    }

    this.p5.image(buffer, 0, 0);

    //draw highlight border
    let { x, y } = this.pxToBoardCoords(this.p5.mouseX, this.p5.mouseY);
    if (!(x < 0 || x >= this.dims || y < 0 || y >= this.dims)) {
      this.p5.push();
      this.p5.fill(0, 0, 0, 0);
      this.p5.stroke(255, 0, 0);
      this.p5.strokeWeight(2);
      x -= this.x;
      y -= this.y;
      this.p5.rect(x * this.scale, y * this.scale, this.scale, this.scale);
      this.p5.pop();
    }
  }

  drawGeoFeatures(buffer, tile, i, j) {   
    //draw hills line
    if (tile.hilly && tile.coastal !== "cliffs") {
      buffer.push();
      buffer.strokeWeight(1);
      buffer.stroke(0);
      buffer.line(i * this.scale, j * this.scale, (i + 1) * this.scale, (j + 1) * this.scale);
      buffer.pop();
    }

    //draw river lines
    if (tile.river) {
      buffer.push();
      buffer.strokeWeight(2);
      buffer.stroke(this.river);
      if (tile.river.includes("N")) {
        buffer.line((i + 0.5) * this.scale, j * this.scale, (i + 0.5) * this.scale, (j + 0.5) * this.scale);
      }
      if (tile.river.includes("S")) {
        buffer.line((i + 0.5) * this.scale, (j + 0.5) * this.scale, (i + 0.5) * this.scale, (j + 1) * this.scale);
      }
      if (tile.river.includes("E")) {
        buffer.line((i + 0.5) * this.scale, (j + 0.5) * this.scale, (i + 1) * this.scale, (j + 0.5) * this.scale);
      }
      if (tile.river.includes("W")) {
        buffer.line((i + 0.5) * this.scale, (j + 0.5) * this.scale, (i) * this.scale, (j + 0.5) * this.scale);
      }
      buffer.pop();
    }

    //draw water source
    if (tile.waterSource) {
      buffer.push();
      buffer.strokeWeight(8);
      buffer.stroke(this.river);
      buffer.point((i+0.5)*this.scale, (j+0.5)*this.scale);
      buffer.pop();
    }
  }

  rerender(grid) {
    for (let i = 0; i < this.dims; i++) {
      for (let j = 0; j < this.dims; j++) {
        grid[i][j].active = true;
      }
    }
    this.draw(grid);
  }

  getTileFill(tile) {
    //the Screen renders tiles based on the screen's current mode
    const unknown = "#888";
    const ocean = "#2B65EC";
    const deepocean = "#204FBD";
    const sand = "#C2B280";
    const grass = "#7CFC00";
    const hills = "#8C8F56";
    const woods = "#2A7E19";
    const rock = "#5A4D41";
    const ice = "#A5F2F3";
    const river = "#00CAF1";
    const snow = "#fffafa";
    const jungle = "#29ab46";

    if (!tile.discovered) return unknown;

    switch (this.mode) {
      case "geo":
        if (tile.alt == "mountains") return rock;
        if (tile.temp == "frozen") return ice;
        if (tile.water == "freshwater") return river;
        if (tile.alt == "sea") return ocean;
        if (tile.alt == "deepsea") return deepocean;


        if (tile.forest == "forest") return woods;
        if (tile.forest == "jungle") return jungle;

        if (tile.coastal == "coast") return sand;
        if (tile.coastal == "cliffs") return rock;

        if (tile.alt == "highlands") {
          if (tile.wet == "desert") return hills;
          if (tile.temp == "cold") return snow;
          return hills;
        }

        if (tile.wet == "desert") return sand;

        if (tile.temp == "cold") return snow;

        break;
      case "water":
        return this.p5.color(30, 60, 2.55 * tile.wetVal);

      case "height":
        return this.p5.color(2.55 * tile.altVal);

      case "temp":
        return this.p5.color(2.55 * tile.tempVal, 2.55 * tile.tempVal, 120);

      case "region":
        return this.renderById(tile.region);

      case "landregion":
        if (tile.water) {
          if (tile.water == "freshwater") return river;
          else if (tile.alt == "sea") return ocean;
          else return deepocean;
        }
        else {
          return this.renderById(tile.region);
        }
    }
    return grass;
  }

  renderById(id) {
    const unknown = "#888";
    const sand = "#C2B280";
    const grass = "#7CFC00";
    const hills = "#8C8F56";
    const woods = "#2A7E19";
    const rock = "#5A4D41";
    const ice = "#A5F2F3";
    const river = "#00CAF1";
    const snow = "#fffafa";
    const jungle = "#29ab46";

    switch (id) {
      case 1:
        return unknown;
      case 2:
        return snow;
      case 3:
        return jungle;
      case 4:
        return sand;
      case 5:
        return grass;
      case 6:
        return hills;
      case 7:
        return woods;
      case 8:
        return rock;
      case 9:
        return ice;
      case 10:
        return river;
      default:
        return "#333"
    }
  }

  keyPressed() {
    //handle movement interactions
    if (this.p5.keyCode === this.p5.LEFT_ARROW) this.x -= this.moveStep;
    else if (this.p5.keyCode === this.p5.UP_ARROW) this.y -= this.moveStep;
    else if (this.p5.keyCode === this.p5.DOWN_ARROW) this.y += this.moveStep;
    else if (this.p5.keyCode === this.p5.RIGHT_ARROW) this.x += this.moveStep;
    else if (this.p5.key == "+") this.adjustScale(1);
    else if (this.p5.key == "-") this.adjustScale(-1);

    //and correct camera position at edges
    this.checkBounds();
  }

  adjustScale(step) {
    //don't if at either end of the scales array
    if (this.scaleStep + step >= this.scales.length || this.scaleStep + step < 0) return;

    //translate
    let { x, y } = this.pxToBoardCoords(this.p5.mouseX, this.p5.mouseY);
    this.x = x;
    this.y = y;

    //zoom
    this.scaleStep += step;
    this.scale = this.scales[this.scaleStep];

    //adjust
    this.x -= Math.floor(this.p5.width / this.scale / 2);
    this.y -= Math.floor(this.p5.height / this.scale / 2);

    this.border = this.scale * 4;
  }

  mousePressed() {
    if (this.p5.mouseButton === this.p5.LEFT) {
      //left mouse button for movement. Centre tile

      let { x, y } = this.pxToBoardCoords(this.p5.mouseX, this.p5.mouseY);
      this.x = x - Math.floor(this.p5.width / 2 / this.scale);
      this.y = y - Math.floor(this.p5.height / 2 / this.scale);
    }
    this.checkBounds();
  }

  checkBounds() {
    let x = this.x * this.scale;
    let y = this.y * this.scale;

    //if the game bord in px + 2 * border is less than the width or height, instead centre the screen
    let maxBoardLength = this.dims * this.scale;

    if (maxBoardLength < this.p5.width || maxBoardLength < this.p5.height) {
      this.x = -Math.floor(((this.p5.width - maxBoardLength) / 2) / this.scale);
      this.y = -Math.floor(((this.p5.height - maxBoardLength) / 2) / this.scale);
      return;
    }

    let toCoord = (val) => Math.floor(val / this.scale);

    if (x < -this.border) this.x = toCoord(-this.border);
    if (y < -this.border) this.y = toCoord(-this.border);
    if (x > this.dims * this.scale - this.p5.width + this.border)
      this.x = toCoord(this.dims * this.scale - this.p5.width + this.border);
    if (y > this.dims * this.scale - this.p5.height + this.border)
      this.y = toCoord(this.dims * this.scale - this.p5.height + this.border);
  }

  //screen pixels to board coordinates
  pxToBoardCoords(x, y) {
    return {
      x: Math.floor(x / this.scale) + this.x,
      y: Math.floor(y / this.scale) + this.y,
    };
  }

  //board coordinates to screen pixels
  boardToPxCoords(x, y) {
    return {
      x: (x - this.x) * this.scale,
      y: (y - this.y) * this.scale,
    };
  }
}
