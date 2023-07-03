import { Utils } from "../../utils/func.js";

export class RiverMaker {
    constructor(params) {
        this.nextRiverId = 1;
        this.riverStack = [];

        Object.keys(params).forEach(k => {
            this[k] = params[k];
        });
    }

    makeRivers(grid) {
        for (let i = 0; i < grid.length; i++) {
            for (let j = 0; j < grid[i].length; j++) {
                if (grid[i][j].waterSource) {
                    this.runRiver(grid[i][j], grid);
                    this.nextRiverId++;
                }
            }
        }
    }

    runRiver(currTile, grid) {
        currTile.riverId = this.nextRiverId;
        //get neighbour tiles 
        let nbrs = Utils.getNeighbouringTiles(currTile, grid);
        //but ignore ones that have the same river id
        let notThisRiverNbrs = nbrs.filter(t => t.riverId !== currTile.riverId);

        //if nbrs is empty, all neighbouring tiles are of the same river. Convert currTile to water.
        if (notThisRiverNbrs.length == 0) {
            //if next to saltwater, be saltwater
            let isNextToSea = false;
            nbrs.forEach(n => isNextToSea = n.altVal < this.alts.seaLevel || isNextToSea);

            if(isNextToSea) currTile.water = this.waters.saltwater;
            else currTile.water = this.waters.freshwater;

            return;
        }

        //filter nbrs that are lower than the current river endpoint tile
        let lowerNbrs = notThisRiverNbrs.filter(t => t.altVal < currTile.altVal);

        //if no neighbouring tiles are lower, cut lowest neighbouring tile to currTile.altVal
        if (lowerNbrs.length == 0) {
            let lowestNbr = notThisRiverNbrs.reduce((lowestTileSoFar, nextTile) => nextTile.altVal < lowestTileSoFar.altVal ? nextTile : lowestTileSoFar);

            //sometimes the alt is stepped down, cutting into the land
            lowestNbr.altVal = currTile.altVal - (Utils.rnd() > this.waters.cutRate ? 0 : 1);

            //if height of new lowest neighbour is below sea level, convert it to a water
            if (lowestNbr.altVal < this.alts.seaLevel) lowestNbr.water = this.waters.freshwater;
            
            //and make it a lowerNbrs
            lowerNbrs.push(lowestNbr);
        }

        //choose one randomly
        let nextTile = Utils.rnd(lowerNbrs);

        let nextTileIsAlreadyRiver = nextTile.river;
        this.setTilesToRiver(currTile, nextTile);

        //if nextTile is already a water tile or was already a river, can just return out
        if (nextTile.water || nextTileIsAlreadyRiver) return;

        //call run river on the new tile
        return this.runRiver(nextTile, grid);
    }

    setTilesToRiver(currTile, nextTile) {
        //Set tile river information correctly
        //flow toward it
        if (!currTile.water && currTile.temp !== this.temps.frozen) {
            if (nextTile.x < currTile.x) currTile.river += "W";
            else if (nextTile.x > currTile.x) currTile.river += "E";
            else if (nextTile.y < currTile.y) currTile.river += "N";
            else if (nextTile.y > currTile.y) currTile.river += "S";
        }

        //if next tile is water, return out
        if (nextTile.water) return;
        //set that tile to river too, flow from currTile
        if (nextTile.x < currTile.x) nextTile.river += "E";
        else if (nextTile.x > currTile.x) nextTile.river += "W";
        else if (nextTile.y < currTile.y) nextTile.river += "S";
        else if (nextTile.y > currTile.y) nextTile.river += "N";
        nextTile.riverId = nextTile.riverId ? nextTile.riverId : this.nextRiverId;
    }
}