//Some simple global functionality

export function floodFill(grid, i, j, prop, newVal) {
    let oldVal = grid[i][j][prop];

    if (oldVal === newVal) return;

    let q = new Queue();

    q.enqueue([i, j]);

    while (!q.isEmpty) {
        [i, j] = q.dequeue();

        //escape border cells or if the same as the newVal
        if (i < 0 || i >= grid.length || j < 0 || j >= grid[i].length || grid[i][j][prop] !== oldVal) continue;
        else {
            grid[i][j][prop] = newVal;
            q.enqueue([i + 1, j]);
            q.enqueue([i - 1, j]);
            q.enqueue([i, j + 1]);
            q.enqueue([i, j - 1]);
        }
    }
}

export function getRandomVectorForce(forceMax = 100, forceMin = 0, forceDir = null) {
    if (forceDir == null) forceDir = Utils.rnd() * 2 * Math.PI;
    let forceStr = forceMin + Utils.rnd() * (forceMax - forceMin);
    return { x: forceStr * Math.cos(forceDir), y: forceStr * Math.sin(forceDir) };
}

export function getDotProd(x1, y1, x2, y2) {
    return x1 * x2 + y1 * y2;
}

export function smoothVals(grid, prop) {
    let oldVals = [];
    for (let i = 0; i < grid.length; i++) {
        oldVals[i] = [];
        for (let j = 0; j < grid[i].length; j++) {
            oldVals[i][j] = grid[i][j][prop];
        }
    }

    for (let i = 1; i < grid.length - 1; i++) {
        for (let j = 1; j < grid[i].length - 1; j++) {
            grid[i][j][prop] = Math.floor((oldVals[i][j] + oldVals[i - 1][j] + oldVals[i + 1][j] + oldVals[i - 1][j + 1] + oldVals[i][j - 1]) / 5);
        }
    }
}

export function highestTileVal(tiles, prop) {
    let highest = tiles[0][prop];
    for (let i = 1; i < tiles.length; i++) if (tiles[i][prop] > highest) highest = tiles[i][prop];
    return highest;
}

export class Utils {
    static seed = "";

    static init(seed) {
        this.seed = seed == "" ? Math.floor(Math.random() * 1_000_000) : seed;

        // taken & modified from https://stackoverflow.com/questions/521295/seeding-the-random-number-generator-in-javascript

        // Create cyrb128 state:
        let seedHash = this.cyrb128(String(seed));
        // Four 32-bit component hashes provide the seed for sfc32.
        this.random = this.sfc32(seedHash[0], seedHash[1], seedHash[2], seedHash[3]);
    }

    static dist = (x1, y1, x2, y2) => Math.sqrt((x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2));

    static rnd(upperBound = 1, lowerBound = 0) {
        if (Array.isArray(upperBound)) return this.randomMember(upperBound);
        return this.random() * (upperBound - lowerBound) + lowerBound;
    }

    static randomMember(arr) {
        return arr[Math.floor(this.random()*arr.length)];
    }

    static cyrb128(str) {
        // taken & modified from https://stackoverflow.com/questions/521295/seeding-the-random-number-generator-in-javascript
        let h1 = 1779033703, h2 = 3144134277,
            h3 = 1013904242, h4 = 2773480762;
        for (let i = 0, k; i < str.length; i++) {
            k = str.charCodeAt(i);
            h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
            h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
            h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
            h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
        }
        h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
        h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
        h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213);
        h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);
        return [(h1 ^ h2 ^ h3 ^ h4) >>> 0, (h2 ^ h1) >>> 0, (h3 ^ h1) >>> 0, (h4 ^ h1) >>> 0];
    }

    static sfc32(a, b, c, d) {
        // taken & modified from https://stackoverflow.com/questions/521295/seeding-the-random-number-generator-in-javascript
        return function () {
            a >>>= 0; b >>>= 0; c >>>= 0; d >>>= 0;
            var t = (a + b) | 0;
            a = b ^ b >>> 9;
            b = c + (c << 3) | 0;
            c = (c << 21 | c >>> 11);
            d = d + 1 | 0;
            t = t + d | 0;
            c = c + t | 0;
            return (t >>> 0) / 4294967296;
        }
    }

    static getNeighbouringTiles(tile, grid) {
        //selects only neighbouring tiles, ignoring borders
        let neighbours = [];

        //top neighbour
        if (tile.y - 1 >= 0) neighbours.push(grid[tile.x][tile.y - 1]);

        //right neighbour
        if (tile.x + 1 < grid.length) neighbours.push(grid[tile.x + 1][tile.y]);

        //bottom neighbour
        if (tile.y + 1 < grid.length) neighbours.push(grid[tile.x][tile.y + 1]);

        //left neighbour
        if (tile.x - 1 >= 0) neighbours.push(grid[tile.x - 1][tile.y]);

        return neighbours;
    }
}

let twoToOneD = (x, y, dims = 16) => x + y * dims;
let oneToTwoD = (n, dims = 16) => { return { x: Math.floor(n % dims), y: Math.floor(n / dims) } };

export class Perlin {
    //my own perlin noise class
    constructor() {
        this.seed();
        this.dims = 516;
    }

    seed() {
        this.grid = [];
    }

    noise(x, y) {
        //my own implmentation of perlin noise

        //throw error if x or y negative
        if (x < 0 || y < 0) throw new RangeError("X and Y must be positive values");

        //given point xy, what are the corresponding nodes?
        let x0 = Math.floor(x);
        let x1 = x0 + 1;
        let y0 = Math.floor(y);
        let y1 = y0 + 1;

        //load nodes & dynamically get new nodes if necessary
        let topLeftNode = this.grid[twoToOneD(x0, y0, this.dims )];
        if (topLeftNode == null) topLeftNode = this.makeNewNode(twoToOneD(x0, y0, this.dims ));
        let topRightNode = this.grid[twoToOneD(x1, y0, this.dims )];
        if (topRightNode == null) topRightNode = this.makeNewNode(twoToOneD(x1, y0, this.dims ));
        let bottomLeftNode = this.grid[twoToOneD(x0, y1, this.dims )];
        if (bottomLeftNode == null) bottomLeftNode = this.makeNewNode(twoToOneD(x0, y1, this.dims ));
        let bottomRightNode = this.grid[twoToOneD(x1, y1, this.dims )];
        if (bottomRightNode == null) bottomRightNode = this.makeNewNode(twoToOneD(x1, y1, this.dims ));

        //calc the dot product from each node to a point relative to that node 
        //as if it were rx ry and the top left one each time
        let fromTopLeftNode = getDotProd(x - x0, y - y0, topLeftNode.x, topLeftNode.y);
        let fromTopRightNode = getDotProd(x - x1, y - y0, topRightNode.x, topRightNode.y);
        let fromBottomLeftNode = getDotProd(x - x0, y - y1, bottomLeftNode.x, bottomLeftNode.y);
        let fromBottomRightNode = getDotProd(x - x1, y - y1, bottomRightNode.x, bottomRightNode.y);

        //interpolate between top nodes and bottoms nodes, 
        //and then between those two interpolated values (i.e. in the vertical)
        let xt = this.interpolate(x - x0, fromTopLeftNode, fromTopRightNode);
        let xb = this.interpolate(x - x0, fromBottomLeftNode, fromBottomRightNode);
        let vertical = this.interpolate(y - y0, xt, xb);

        //the interpolation produces values from -1 to 1, so add 1 and divide by 2 to map to 0-1
        let val = (vertical + 1) / 2;
        return val;
    }

    makeNewNode(n) {
        this.grid[n] = getRandomVectorForce(1, 1);
        return this.grid[n];
    }

    interpolate(proportion, bottomVal, topVal) {
        return bottomVal + this.smootherStep(proportion) * (topVal - bottomVal);
    }

    smootherStep(proportion) {
        //Perlin's smootherStep equation
        return 6 * proportion ** 5 - 15 * proportion ** 4 + 10 * proportion ** 3;
    }
}

class Queue {
    constructor() {
        this.head = 0;
        this.tail = 0;
        this.elements = {};
    }

    enqueue(element) {
        this.elements[this.tail] = element;
        this.tail++;
    }

    dequeue() {
        const element = this.elements[this.head];
        delete this.elements[this.head];
        this.head++;
        return element;
    }

    peek() {
        return this.elements[this.head];
    }

    get length() {
        return this.tail - this.head;
    }

    get isEmpty() {
        return this.length === 0;
    }
}