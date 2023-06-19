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

    this.mode = "geo";
  }

  draw(grid) {
    //draw the cells passed in via the 2D grid

    textAlign(CENTER, CENTER);
    strokeWeight(1);

    //draw the entire screen
    for (let i = 0; i < width / this.scale; i++) {
      for (let j = 0; j < height / this.scale; j++) {
        //don't try to render cells that don't exist
        if ((i + this.x >= this.dims || i + this.x < 0) ||
          (j + this.y >= this.dims || j + this.y < 0)) {
          push();
          noStroke();
          fill(255, 200, 200);
          rect(i * this.scale, j * this.scale, this.scale, this.scale);
          pop();
          continue;
        }

        if (!grid[i + this.x][j + this.y].active) continue;

        //get cell to render
        let cell = grid[i + this.x][j + this.y];
        let { x, y } = this.pxToBoardCoords(mouseX, mouseY);

        //draw the cell, screen's responsibility to place it correctly on the screen
        push();
        //simple red highlight border
        cell.underMouse(x, y) ? stroke(255, 0, 0) : noStroke();
        fill(this.renderTile(cell));
        rect(i * this.scale, j * this.scale, this.scale, this.scale);
        pop();
      }
    }
  }

  renderTile(tile) {
    //the Screen renders tiles based on the screen's current mode
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

    switch (this.mode) {
      case "geo":
        if (tile.temp == "frozen") return ice;
        if (tile.alt == "sea") return ocean;
        if (tile.alt == "deepsea") return deepocean;

        if (tile.water == "freshwater") return river;

        if (tile.forest == "forest") return woods;
        if (tile.forest == "jungle") return jungle;

        if (tile.coastal == "coast") return sand;
        if (tile.coastal == "cliffs") return rock;

        if (tile.temp == "cold") return snow;

        if (tile.alt == "highlands") return hills;
        if (tile.alt == "mountains") return rock;

        if (tile.wet == "desert") return sand;
        break;
      case "water":
        return color(30, 60, 2.55 * tile.wetVal);

      case "height":
        return color(2.55 * tile.altVal);

      case "temp":
        return color(2.55 * tile.tempVal, 2.55 * tile.tempVal, 120);

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
    this.x -= floor(width / this.scale / 2);
    this.y -= floor(height / this.scale / 2);

    this.border = this.scale * 4;
  }

  mousePressed() {
    if (mouseButton === LEFT) {
      //left mouse button for movement. Centre tile

      let { x, y } = this.pxToBoardCoords(mouseX, mouseY);
      this.x = x - floor(width / 2 / this.scale);
      this.y = y - floor(height / 2 / this.scale);
    }
    this.checkBounds();
  }

  checkBounds() {
    let x = this.x * this.scale;
    let y = this.y * this.scale;

    let toCoord = (val) => floor(val / this.scale);

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
