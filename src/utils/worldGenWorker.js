import { WorldGenerator } from "../lib/WorldGen/worldGen.js";
import "./func.js";

self.addEventListener("message", (e) => {
    let worldGenerator = new WorldGenerator(e.data.worldParams, e.data.board, e.data.seed, e.data.debug);
    let grid = worldGenerator.genGrid(e.data.board.grid);
    self.postMessage({grid: grid, wind: worldGenerator.wind, message: "Done"});
});