//holds classes to do with the function of the visible board

class Screen {
  constructor(scales = [5, 10, 25, 50], dims = 50) {
    //screen coords
    this.x = 0;
    this.y = 0;
    this.scales = scales;
    this.scaleStep = 0;
    this.scale = scales[this.scaleStep];
    this.dims = dims;
    this.border = this.scale * 4; //amount of white space around the map visible in px
    this.moveStep = 2; //amount to move per movekey in cells
    this.buffer = createGraphics(width, height);
    this.mode = "geo";
  }

  draw(grid) {
    //draw the cells passed in via the 2D grid
    //background(120, 255, 120);

    //use a p5js createGraphics renderer object as an offscreen buffer
    let buffer = this.buffer;
    buffer.textAlign(CENTER, CENTER);
    buffer.noStroke();

    //only render on screen tiles
    for (let i = 0; i < width / this.scale; i++) {
      for (let j = 0; j < height / this.scale; j++) {
        let x = i + this.x;
        let y = j + this.y;
        //don't try to render tiles that don't exist or don't need to be rendered
        if (x >= this.dims || x < 0 || y >= this.dims || y < 0) {
          buffer.fill(120, 255, 120);
          buffer.rect(i * this.scale, j * this.scale, this.scale, this.scale);
          continue;
        }

        if (!grid[x][y].active) continue;

        buffer.fill(this.renderTile(grid[x][y]));

        buffer.rect(i * this.scale, j * this.scale, this.scale, this.scale);
      }
    }

    image(buffer, 0, 0);

    //draw highlight border
    let { x, y } = this.pxToBoardCoords(mouseX, mouseY);
    if (!(x < 0 || x >= BOARDSIZE || y < 0 || y >= BOARDSIZE)) {
      push();
      fill(0, 0, 0, 0);
      stroke(255, 0, 0);
      strokeWeight(2);
      x -= this.x;
      y -= this.y;
      rect(x * this.scale, y * this.scale, this.scale, this.scale);
      pop();
    }
  }

  renderTile(tile) {
    //the Screen renders tiles based on the screen's current mode
    const unknown = "#555";
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
        if (tile.alt == "sea") return ocean;
        if (tile.alt == "deepsea") return deepocean;

        if (tile.water == "freshwater") return river;

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
        return color(30, 60, 2.55 * tile.wetVal);

      case "height":
        return color(2.55 * tile.altVal);

      case "temp":
        return color(2.55 * tile.tempVal, 2.55 * tile.tempVal, 120);
      
      case "region":
        switch(tile.region) {
          case 1:
            return ocean;
          case 2:
            return sand;
          case 3:
            return grass;
          case 4:
            return snow;
          case 5:
            return rock;
          case 6:
            return river;
        }

        break;
    }
    return grass;
  }

  keyPressed() {
    //handle movement interactions
    if (keyCode === LEFT_ARROW) this.x -= this.moveStep;
    else if (keyCode === UP_ARROW) this.y -= this.moveStep;
    else if (keyCode === DOWN_ARROW) this.y += this.moveStep;
    else if (keyCode === RIGHT_ARROW) this.x += this.moveStep;
    else if (key == "+") this.adjustScale(1);
    else if (key == "-") this.adjustScale(-1);

    //and correct camera position at edges
    this.checkBounds();
  }

  adjustScale(step) {
    //don't if at either end of the scales array
    if (this.scaleStep + step >= this.scales.length || this.scaleStep + step < 0) return;

    //translate
    let { x, y } = this.pxToBoardCoords(mouseX, mouseY);
    this.x = x;
    this.y = y;

    //zoom
    this.scaleStep += step;
    this.scale = this.scales[this.scaleStep];

    //adjust
    this.x -= Math.floor(width / this.scale / 2);
    this.y -= Math.floor(height / this.scale / 2);

    this.border = this.scale * 4;
  }

  mousePressed() {
    if (mouseButton === LEFT) {
      //left mouse button for movement. Centre tile

      let { x, y } = this.pxToBoardCoords(mouseX, mouseY);
      this.x = x - Math.floor(width / 2 / this.scale);
      this.y = y - Math.floor(height / 2 / this.scale);
    }
    this.checkBounds();
  }

  checkBounds() {
    let x = this.x * this.scale;
    let y = this.y * this.scale;

    //if the game bord in px + 2 * border is less than the width or height, instead centre the screen
    let maxBoardLength = BOARDSIZE * this.scale;

    if (maxBoardLength < width || maxBoardLength < height) {
      this.x = -Math.floor(((width - maxBoardLength) / 2) / this.scale);
      this.y = -Math.floor(((height - maxBoardLength) / 2) / this.scale);
      return;
    }

    let toCoord = (val) => Math.floor(val / this.scale);

    if (x < -this.border) this.x = toCoord(-this.border);
    if (y < -this.border) this.y = toCoord(-this.border);
    if (x > this.dims * this.scale - width + this.border)
      this.x = toCoord(this.dims * this.scale - width + this.border);
    if (y > this.dims * this.scale - height + this.border)
      this.y = toCoord(this.dims * this.scale - height + this.border);
  }

  //screen pixels to board coordinates
  pxToBoardCoords(x, y) {
    return {
      x: floor(x / this.scale) + this.x,
      y: floor(y / this.scale) + this.y,
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
