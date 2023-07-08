import { WorldGenerator } from "../lib/WorldGen/worldGen.js";
import "./func.js";

let worldGenerator;

self.addEventListener("message", (e) => {
    worldGenerator = new WorldGenerator(e.data.worldParams, e.data.board, e.data.seed, e.data.debug);
    let grid = genGrid(e.data.board.grid);

    //TODO worldGenMessage DTO?
    self.postMessage({ grid: grid, wind: worldGenerator.wind, message: "Done" });
});

function genGrid(grid) {

    self.postMessage({ message: worldGenerator.genInitialDataAndRegions(grid) });
    self.postMessage({ message: worldGenerator.genInitialAlts(grid) });
    self.postMessage({ message: worldGenerator.adjustAltsPerRegion(grid) });
    self.postMessage({ message: worldGenerator.genRidgeForces(grid) });
    self.postMessage({ message: worldGenerator.genInitialWetness(grid) });
    self.postMessage({ message: worldGenerator.genWaterSources(grid) });
    self.postMessage({ message: worldGenerator.genRivers(grid) });
    self.postMessage({ message: worldGenerator.setAltTypes(grid) });
    self.postMessage({ message: worldGenerator.setWaters(grid) });
    self.postMessage({ message: worldGenerator.adjustWetValues(grid) });
    self.postMessage({ message: worldGenerator.setWetTypes(grid) });
    self.postMessage({ message: worldGenerator.genInitialTemps(grid) });
    self.postMessage({ message: worldGenerator.adjustTempValues(grid) });
    self.postMessage({ message: worldGenerator.setTempTypes(grid) });
    self.postMessage({ message: worldGenerator.genCoastAndHills(grid) });
    self.postMessage({ message: worldGenerator.genInitialForests(grid) });
    self.postMessage({ message: worldGenerator.adjustForests(grid) });
    self.postMessage({ message: worldGenerator.scatterGems(grid) });

    if(!worldGenerator.checkReqs(grid)) grid = genGrid(grid);

    return grid;
}