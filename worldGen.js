//responsible for how the world is generated, constuctor takes in parameters used to tweak generation

export class WorldGenerator {
    constructor(params, BOARDSIZE, noise, noiseSeed) {
        //load world generator information

        //TODO set up seed

        this.BOARDSIZE = BOARDSIZE;
        this.noise = noise;
        this.noiseSeed = noiseSeed;
        this.noiseProfiles = [Math.random() * 100, Math.random() * 100, Math.random() * 100];

        Object.keys(params).forEach(k => {
            this[k] = params[k];
        });
    }

    getVectorForce(forceMax = 100, forceMin = 0) {
        let forceDir = Math.random() * 2 * Math.PI;
        let forceStr = forceMin + Math.random() * (forceMax - forceMin);
        return { x: Math.floor(forceStr * Math.sin(forceDir)), y: Math.floor(forceStr * Math.cos(forceDir)) };
    }

    genGrid(grid) {
        //generate regions from continent generator sketch
        let regionGen = new RegionGenerator(this.BOARDSIZE, this.BOARDSIZE, this.regions);
        regionGen.debug = debug;
        regionGen.createRegions();

        //generate initial tile data from perlin noise & latitude and wind
        for (let i = 0; i < this.BOARDSIZE; i++) {
            for (let j = 0; j < this.BOARDSIZE; j++) {
                let tile = new Tile(i, j);
                grid[i][j] = tile;
                grid[i][j].id = `${j * grid[i].length + i}`;
                grid[i][j].region = regionGen.data[i][j];
                grid[i][j].ridgeAlt = 0;
            }
        }

        console.log("initial tile data done");

        //altitude
        for (let i = 0; i < this.BOARDSIZE; i++) {
            for (let j = 0; j < this.BOARDSIZE; j++) {
                let tile = grid[i][j];
                this.noiseSeed(this.noiseProfiles[0]);
                let altNoise = Math.floor(this.noise(i * this.roughness, j * this.roughness) * 50)
                let altIslandBias = Math.floor(50 - (50 / (this.BOARDSIZE / 2)) * Math.sqrt(((i - this.BOARDSIZE / 2) * (i - this.BOARDSIZE / 2) + (j - this.BOARDSIZE / 2) * (j - this.BOARDSIZE / 2) + 1)));
                let alt = altNoise + altIslandBias;
                tile.altVal = alt;
            }
        }

        console.log("initial alts done");

        //adjust heights by generating ridges and troughs from regions and smoothing them out, using it as a mask
        let regionDriftForces = {};
        for (let i = 0; i < this.regions; i++) regionDriftForces[i + 1] = this.getVectorForce(this.ridges.driftForceMax, this.ridges.driftForceMin);

        //only for tiles that have neighbours
        for (let i = 1; i < this.BOARDSIZE - 1; i++) {
            for (let j = 1; j < this.BOARDSIZE - 1; j++) {
                //compare this cell to each of its neighbours. If a neighbour is of a different region, do calc:
                //also only doing the four directions, not diagonals
                let tile = grid[i][j];
                let otherTiles = [grid[i - 1][j], grid[i + 1][j], grid[i][j - 1], grid[i][j + 1]];

                for (let n = 0; n < otherTiles.length; n++) {
                    if (tile.region !== otherTiles[n].region) {
                        let vecs = {
                            tx: regionDriftForces[tile.region].x,
                            ty: regionDriftForces[tile.region].y,
                            otx: regionDriftForces[otherTiles[n].region].x,
                            oty: regionDriftForces[otherTiles[n].region].y
                        }
                        tile.ridgeAlt += vecs.tx * vecs.otx + vecs.ty * vecs.oty;
                    }
                }
            }
        }

        //and smooth
        for (let i = 0; i < this.ridges.smoothing; i++) this.smoothVals(grid, "ridgeAlt");

        //scale ridgeAlt values from shallowest-tallest to 0-100
        let tallestRidge = 0, shallowestTrough = 0;
        for (let i = 0; i < this.BOARDSIZE; i++) {
            for (let j = 0; j < this.BOARDSIZE; j++) {
                if (grid[i][j].ridgeAlt < shallowestTrough) shallowestTrough = grid[i][j].ridgeAlt;
                if (grid[i][j].ridgeAlt > tallestRidge) tallestRidge = grid[i][j].ridgeAlt;
            }
        }

        for (let i = 0; i < this.BOARDSIZE; i++) {
            for (let j = 0; j < this.BOARDSIZE; j++) {
                grid[i][j].ridgeAlt = 50 / (tallestRidge - shallowestTrough) * (grid[i][j].ridgeAlt);
            }
        }

        //adjust alt vals
        for (let i = 0; i < this.BOARDSIZE; i++) {
            for (let j = 0; j < this.BOARDSIZE; j++) {
                grid[i][j].altVal = Math.floor(grid[i][j].altVal + grid[i][j].ridgeAlt);
            }
        }

        console.log("ridges calculated and applied");

        //temperature
        for (let i = 0; i < this.BOARDSIZE; i++) {
            for (let j = 0; j < this.BOARDSIZE; j++) {
                let tile = grid[i][j];

                //temperature should vary primarily by latitude, although unfortunately with the island style this doesn't work as there's never snow and only ice in the deepsea
                //se switching to a simple north-col south-hot and altitude model
                //a quadratic distribution for temps so midrange tiles are hottest and top and bottom are coldest,
                //no matter the range of j's, but always between 0 and 50
                //-(200/(dims*dims))*(j-dims)j = temp

                this.noiseSeed(this.noiseProfiles[2]);
                /*
                let temp =
                  floor(-(200 / (this.BOARDSIZE * this.BOARDSIZE)) * (j - this.BOARDSIZE) * j +
                    noise(i * this.roughness, j * this.roughness) * 50);
                */

                let temp = Math.floor(20 + j * 35 / this.BOARDSIZE + (this.noise(i * this.roughness, j * this.roughness) * 50) - Math.pow(tile.altVal - this.alts.seaLevel, 2) / 35);
                //make sea tiles warmer
                if (tile.altVal < this.alts.seaLevel) temp += 10;
                tile.tempVal = temp;
            }
        }

        console.log("temp data done");

        //wetness
        for (let i = 0; i < this.BOARDSIZE; i++) {
            for (let j = 0; j < this.BOARDSIZE; j++) {
                let tile = grid[i][j];
                this.noiseSeed(this.noiseProfiles[1]);
                //made water distribution have less roughness than land because seems right
                let wet = Math.floor(this.noise(i * this.roughness * 0.8, j * this.roughness * 0.8) * 100);
                tile.wetVal = wet;
            }
        }

        console.log("wet data done");

        //now that alt, wet and temp values are all sorted, tile types can properly be assigned
        for (let i = 0; i < this.BOARDSIZE; i++) {
            for (let j = 0; j < this.BOARDSIZE; j++) {
                this.setTileType(grid[i][j]);
            }
        }

        console.log("tile types set")

        //finally set water tiles to wet 100
        for (let i = 0; i < this.BOARDSIZE; i++) {
            for (let j = 0; j < this.BOARDSIZE; j++) {
                grid[i][j].wetVal = grid[i][j].water ? 100 : grid[i][j].wetVal;
            }
        }

        // TODO set outside water to saltwater with a floodfill algorithm

        //process tiles using neighbouring information
        for (let i = 0; i < this.BOARDSIZE; i++) {
            for (let j = 0; j < this.BOARDSIZE; j++) {
                let { top, right, bottom, left } = this.getNeighbouringTileCoords(i, j);
                let tile = grid[i][j], topTile = grid[top.x][top.y], rightTile = grid[right.x][right.y], bottomTile = grid[bottom.x][bottom.y], leftTile = grid[left.x][left.y];

                if (!tile.water && tile.alt !== this.alts.mountains) {
                    //set tiles significantly altitudially different to their neighbours as "hills"
                    let changes = 0, altDiff = 3, reqDiffNbrs = 2;
                    if (Math.abs(topTile.altVal - tile.altVal) > altDiff) changes++;
                    if (Math.abs(rightTile.altVal - tile.altVal) > altDiff) changes++;
                    if (Math.abs(bottomTile.altVal - tile.altVal) > altDiff) changes++;
                    if (Math.abs(leftTile.altVal - tile.altVal) > altDiff) changes++;
                    if (changes >= reqDiffNbrs) tile.hilly = true;
                }

                //set coastal tiles
                if (
                    (topTile.water == "saltwater" ||
                        bottomTile.water == "saltwater" ||
                        leftTile.water == "saltwater" ||
                        rightTile.water == "saltwater") &&
                    grid[i][j].water !== "saltwater"
                ) {
                    grid[i][j].coastal = grid[i][j].hilly ? "cliffs" : "coast";
                }

                //drag heat and wetness with the wind, basic fluid sim? alt will block / cause build-up TODO
            }
        }

        console.log("coastal tiles and hills done");

        //do a game of life pass on wether tiles are forested
        let forestAdjustments = [];
        for (let i = 0; i < this.BOARDSIZE; i++) {
            forestAdjustments[i] = [];
            for (let j = 0; j < this.BOARDSIZE; j++) {
                forestAdjustments[i][j] = grid[i][j].forest ? true : false;
            }
        }

        for (let i = 1; i < this.BOARDSIZE - 1; i++) {
            for (let j = 1; j < this.BOARDSIZE - 1; j++) {
                let { top, right, bottom, left } = this.getNeighbouringTileCoords(i, j);
                let forestNbrsCount = 0;
                if (forestAdjustments[top.x][top.y]) forestNbrsCount++;
                if (forestAdjustments[right.x][right.y]) forestNbrsCount++;
                if (forestAdjustments[bottom.x][bottom.y]) forestNbrsCount++;
                if (forestAdjustments[left.x][left.y]) forestNbrsCount++;

                if (forestNbrsCount <= 1) grid[i][j].forest = false;
                if (forestNbrsCount >= 3) grid[i][j].forest = this.assignForest(grid[i][j]);
            }
        }

        console.log("forests adjusted");

        //run rivers
        for (let i = 0; i < this.BOARDSIZE; i++) {
            for (let j = 0; j < this.BOARDSIZE; j++) {
                if (grid[i][j].waterSource) this.runRiver(grid, grid[i][j]);
            }
        }

        console.log("rivers run");

        //check world meets this.reqs
        console.log("checking reqs");
        grid = this.checkReqs(grid);

        return grid;
    }

    checkReqs(grid) {
        let mountainCount = 0, landCount = 0, hillCount = 0;
        for (let i = 0; i < this.BOARDSIZE; i++) {
            for (let j = 0; j < this.BOARDSIZE; j++) {
                if (grid[i][j].alt == this.alts.mountains) mountainCount++;
                if (grid[i][j].water !== this.waters.saltwater) landCount++;
                if (grid[i][j].hilly) hillCount++;
            }
        }

        let landRatio = landCount / (this.BOARDSIZE * this.BOARDSIZE);
        let hillRatio = hillCount / landCount;
        if (debug) console.log(`mountainCount ${mountainCount}`, `landRatio ${landRatio}`, `hillRatio ${hillRatio}`);

        if (landRatio < this.reqs.minLandRatio ||
            landRatio > this.reqs.maxLandRatio ||
            mountainCount < this.reqs.minMountains ||
            mountainCount > this.reqs.maxMountains ||
            hillRatio < this.reqs.minHillRatio ||
            hillRatio > this.reqs.maxHillRatio) {
            if (debug) console.warn("Regen-ing");
            grid = this.genGrid(grid);
        }

        return grid;
    }

    assignForest(tile) {
        if (tile.temp !== "frozen" && tile.temp !== "hot") return "forest";
        else if (tile.temp == "hot") return "jungle";
        else return false;
    }

    smoothVals(grid, value) {
        let oldVals = [];
        for (let i = 0; i < this.BOARDSIZE; i++) {
            oldVals[i] = [];
            for (let j = 0; j < this.BOARDSIZE; j++) {
                oldVals[i][j] = grid[i][j][value];
            }
        }

        for (let i = 1; i < this.BOARDSIZE - 1; i++) {
            for (let j = 1; j < this.BOARDSIZE - 1; j++) {
                grid[i][j][value] = Math.floor((oldVals[i][j] + oldVals[i - 1][j] + oldVals[i + 1][j] + oldVals[i - 1][j + 1] + oldVals[i][j - 1]) / 5);
            }
        }
    }

    getNeighbouringTileCoords(i, j) {
        //selects current tile if at the edge/corner

        let top = { x: i, y: j - 1 < 0 ? j : j - 1 };
        let right = { x: i + 1 >= this.BOARDSIZE ? i : i + 1, y: j };
        let bottom = { x: i, y: j + 1 >= this.BOARDSIZE ? j : j + 1 };
        let left = { x: i - 1 < 0 ? i : i - 1, y: j };

        return { top, right, bottom, left };
    }

    getNeighbouringTiles(tile, grid) {
        //selects only neighbouring tiles, ignoring borders
        let neighbours = [];

        //top neighbour
        if (tile.y - 1 >= 0) neighbours.push(grid[tile.x][tile.y - 1]);

        //right neighbour
        if (tile.x + 1 < this.BOARDSIZE) neighbours.push(grid[tile.x + 1][tile.y]);

        //bottom neighbour
        if (tile.y + 1 < this.BOARDSIZE) neighbours.push(grid[tile.x][tile.y + 1]);

        //left neighbour
        if (tile.x - 1 >= 0) neighbours.push(grid[tile.x - 1][tile.y]);

        return neighbours;
    }

    setTileType(tile) {
        if (tile.altVal < this.alts.deepseaLevel) tile.alt = this.alts.deepsea;
        else if (tile.altVal < this.alts.seaLevel) tile.alt = this.alts.sea;
        else if (tile.altVal < this.alts.lowlandsLevel) tile.alt = this.alts.lowlands;
        else if (tile.altVal < this.alts.highlandsLevel) tile.alt = this.alts.highlands;
        else tile.alt = this.alts.mountains;

        if (tile.wetVal < this.wets.desertLevel) tile.wet = this.wets.desert;
        else if (tile.wetVal < this.wets.dryLevel) tile.wet = this.wets.dry;
        else tile.wet = this.wets.wet;

        if (tile.tempVal < this.temps.frozenLevel) tile.temp = this.temps.frozen;
        else if (tile.tempVal < this.temps.coldLevel) tile.temp = this.temps.cold;
        else if (tile.tempVal < this.temps.mildLevel) tile.temp = this.temps.mild;
        else if (tile.tempVal < this.temps.warmLevel) tile.temp = this.temps.warm;
        else tile.temp = this.temps.hot;

        //set freshwater lake tiles, TODO: assume freshwater initially with a sea-water flood-fill pass coming after, meaning sealevel lakes can be freshwater too
        if (tile.alt == "deepsea" || tile.alt == "sea") tile.water = this.waters.saltwater;
        else if (tile.coastal) {
            //do nothing
        }
        else if ((tile.wet == "desert") & (Math.random() < this.hydration / 4)) {
            tile.water = "freshwater";
            tile.waterSource = true;
        }
        else if ((tile.wet == "dry") & (Math.random() < this.hydration / 2)) {
            tile.water = "freshwater";
            tile.waterSource = true;
        }
        else if ((tile.wet == "wet") & (Math.random() < this.hydratrion)) {
            tile.water = "freshwater";
            tile.waterSource = true;
        }

        //set pure river water sources
        if (tile.alt == "deepsea" || tile.alt == "sea") tile.water = this.waters.saltwater;
        else if (tile.water == "freshwater" || tile.water == "saltwater" || tile.coastal) {
            // do nothing for tiles already water
        }
        else if ((tile.wet == "desert") & (Math.random() < this.hydration / 8)) {
            tile.waterSource = true;
        }
        else if ((tile.wet == "dry") & (Math.random() < this.hydration / 4)) {
            tile.waterSource = true;
        }
        else if ((tile.wet == "wet") & (Math.random() < this.hydratrion / 2)) {
            tile.waterSource = true;
        }

        //set forestation
        if (
            tile.water == false &&
            tile.alt !== "mountain" &&
            tile.wet !== "desert" &&
            Math.random() < this.forestation
        ) {
            tile.forest = this.assignForest(tile);
        }
    }

    runRiver(grid, currTile) {
        //initially called because tile is a water source

        //get neighbour tiles that are lower than the current river endpoint tile
        let nbrs = this.getNeighbouringTiles(currTile, grid);
        let lowerNbrs = nbrs.filter(t => t.altVal < currTile.altVal);

        //if no neighbouring tiles are lower, convert this tile to a freshwater square and return
        if (lowerNbrs.length == 0) {
            currTile.water = this.waters.freshwater;
            currTile.river = false;
            return;
        }

        //choose one randomly
        let nextTile = randomMember(lowerNbrs);

        //flow toward it
        if(currTile.water || currTile.temp == this.temps.frozen) {
            //do nothing
        }
        else if (nextTile.x < currTile.x) currTile.river += "W";
        else if (nextTile.x > currTile.x) currTile.river += "E";
        else if (nextTile.y < currTile.y) currTile.river += "N";
        else if (nextTile.y > currTile.y) currTile.river += "S";

        //if next tile is water, return out
        if (nextTile.water) return;
        
        //if nextTile is already a river tile flag
        let nextTileIsRiver = nextTile.river ? true : false;

        //set that tile to river too, flow from currTile
        if (nextTile.x < currTile.x) nextTile.river += "E";
        else if (nextTile.x > currTile.x) nextTile.river += "W";
        else if (nextTile.y < currTile.y) nextTile.river += "S";
        else if (nextTile.y > currTile.y) nextTile.river += "N";

        //if nextTile is already a river, can just return out
        if (nextTileIsRiver) return;

        //call run river on the new tile
        this.runRiver(grid, nextTile);
    }
}

export class RegionGenerator {
    constructor(i, j, regions) {
        //this is a class wrapper to the continent generator algorithm
        //it produces a 2D array of the given i j dimensions
        //and fills it with ID's ranging from 1 to the number of continents provided

        this.data = [];
        this.totalRegions = regions;
        this.width = i;
        this.height = j;
        this.noiseFactor = 5;
        this.smoothness = 3;

        this.debug = false;

        this.create2Darray();
    }

    create2Darray() {
        //creates a 2D array of the correct dimensions with null "0" data
        for (let i = 0; i < this.width; i++) {
            this.data[i] = [];
            for (let j = 0; j < this.height; j++) {
                this.data[i][j] = 0;
            }
        }
    }

    //creates and fills the data array with splotches of ID integers that correspond to
    //the continents, thereby providing continent generation and data
    createRegions() {
        //first reset the data array to blanks of the current i j dimensions
        this.create2Darray();

        //get random starting positions, having checked for no overlap
        let startCells = this.pickStarts();

        for (let i = 0; i < startCells.length; i++) {
            this.data[startCells[i][0]][startCells[i][1]] = i + 1; //+1 since 0 is null white
        }

        //assign according to nearest id, passing in start coordinates
        this.assignNearest(startCells);

        //make sure that the continents are contiguous
        this.makeContiguous();
    }

    pickStarts() {
        //pick starting positions, checking for overlap

        //create the starts array with the first index already done
        let starts = [[Math.floor(Math.random() * this.width), Math.floor(Math.random() * this.height)]];

        //loop from 1 (since first index is already set)
        for (let n = 1; n < this.totalRegions; n++) {
            //each time a new start is to be added per continent, loop through all existing starts
            //to check if the new pair overlap, setting overlap to true and forcing the while loop
            //to go over again, generating a new pair and checking the new pair for overlaps, etc.

            //set to true initially so that the while loop runs at least once
            let overlap = true;

            while (overlap) {
                //immediately reset the flag, no thanks infinite loop
                overlap = false;

                //generate new start coordinates
                let x = Math.floor(Math.random() * this.width);
                let y = Math.floor(Math.random() * this.height);

                //loop through existing starts array
                for (let i = 0; i < starts.length; i++) {
                    if (x == starts[i][0] && y == starts[i][1]) {
                        //if the x AND y match then there's a conflict so overlap is true
                        overlap = true;
                        if (debug) console.log("RegionGenerator: Overlap detected, retrying");
                        //break for efficiency
                        break;
                    }
                }

                //if overlap is false after checking the array, add a new element of the coord pair to it
                if (!overlap) {
                    starts.push([x, y]);
                }
            }
        }

        //return the coords
        return starts;
    }

    assignNearest(startCells) {
        //go through each cell and get the nearest ID if its not a start cell
        //and assign its ID to that nearest one

        for (let i = 0; i < this.width; i++) {
            for (let j = 0; j < this.height; j++) {
                //skip if it is already an assigned cell, i.e. start cells
                if (this.data[i][j] != 0) continue;
                //get the nearest ID for this i j cell
                let nearestID = this.getNearestID(i, j, startCells);
                //and set this cell's ID to that
                this.data[i][j] = nearestID;
            }
        }
    }

    getNearestID(i, j, startCells) {
        //go through each start position and calc the dist, keeping the shortest
        let shortest = dist(0, 0, this.width, this.height); //dummy data that is the max possible dist
        let nearestID = 0;

        for (let n = 0; n < startCells.length; n++) {
            let startPositionX = startCells[n][0];
            let startPositionY = startCells[n][1];

            //to wrap around the left-right edges, use three calcs:
            //The current one, one at plus world width and one at minus world width
            //and introduce some variation to the otherwise straight lines
            let noise = Math.random() * 2 * this.noiseFactor - this.noiseFactor;
            let d0 = dist(i, j, startPositionX, startPositionY) + noise;
            let dLeft =
                dist(i, j, startPositionX - this.width, startPositionY) + noise;
            let dRight =
                dist(i, j, startPositionX + this.width, startPositionY) + noise;

            //if one is the shortest, set the ID to the ID of that start position
            if (d0 < shortest) {
                shortest = d0;
                nearestID = this.data[startPositionX][startPositionY];
            }
            if (dLeft < shortest) {
                shortest = dLeft;
                nearestID = this.data[startPositionX][startPositionY];
            }
            if (dRight < shortest) {
                shortest = dRight;
                nearestID = this.data[startPositionX][startPositionY];
            }
        }
        //return the shortest dist position ID
        return nearestID;
    }

    makeContiguous() {
        //if the cell doesn't have enough neighbours of the same ID, change its ID to a random neighbour
        let enough = this.smoothness;

        //changed starts true to ensure the WHILE loop runs at least once
        let changed = true;
        //stop while loops getting locked in
        let justInCase = 0;
        while (changed && justInCase < 1000) {
            //while changed is untrue, there was no changes made to the array, so the program can stop checking
            changed = false;
            //check every cell   
            for (let i = 0; i < this.width; i++) {
                for (let j = 0; j < this.height; j++) {
                    //if not enough of the neighbour cells are of the same ID, change it

                    //get an array of the neighbouring ID's, wrapping or not
                    let neighbourIDs = this.getNeighbourIDs(i, j);

                    //get the number of neighbouring matching ID's
                    let matchingNeighbours = 0;
                    for (let n = 0; n < neighbourIDs.length; n++) {
                        //if that neighbour matches, up the count
                        if (this.data[i][j] == neighbourIDs[n]) matchingNeighbours++;
                    }
                    //check if there aren't enough neighbours
                    if (matchingNeighbours < enough) {
                        //set the cell to a random neighbour ID
                        this.data[i][j] = randomMember(neighbourIDs);

                        //and then set changed to true, as there was a change
                        changed = true;
                    }
                }
            }

            //and loop again if there was a change,
            //to make sure all of the new cells have enough neighbours

            //but make sure the loop doesn't get stuck, breaking out after X number of tries
            justInCase++;
        }
    }

    getNeighbourIDs(i, j) {
        //makes an array and returns it
        //the array contains a list of all the neighbouring ID's
        //it wraps left right for those neighbours, and ignores top bottom ones

        //create the array to be returned
        let neighbourIDs = [];

        //just a quick array to reference the neighbours coords
        let neighbourRefs = [
            [-1, -1], //top left
            [-1, 0], //left
            [-1, 1], //bottom left
            [0, -1], //above
            [0, 1], //below
            [1, -1], //top right
            [1, 0], //right
            [1, 1], //bottom right
        ];
        //for each entry of the neighbourRef array passed in
        for (let n = 0; n < neighbourRefs.length; n++) {
            //calc the coord of that neighbour as x y
            let x = i + neighbourRefs[n][0];
            let y = j + neighbourRefs[n][1];

            //for the top and bottom ones, do continue to ignore those cells
            if (y < 0 || y >= this.height) continue;

            //for the left, get the rightmost ID
            if (x < 0) x = this.width - 1;
            //for the right, get the leftmost
            if (x >= this.width) x = 0;

            //and append the corresponding ID to the list
            neighbourIDs.push(this.data[x][y]);
        }
        return neighbourIDs;
    }

    getData() {
        return this.data;
    }
}

//the Game Object of a tile
class Tile {
    constructor(x, y) {
        //most of these are assigned later but defining them here too for readability, with default values

        //geographic properties
        this.x = x;
        this.y = y;
        this.alt = 50;
        this.temp = 50;
        this.wet = 50;
        this.water = false;
        this.waterSource = false;
        this.forest = false;
        this.coastal = false;
        this.hilly = false;
        this.river = ""; //other values are strings containing "N" "E" "S" "W", denoting how to render the river

        //game engine properties
        this.id = "x";
        this.active = true;
        this.discovered = true;
    }

    underMouse(mouseXCoord, mouseYCoord) {
        return mouseXCoord == this.x && mouseYCoord == this.y;
    }
}