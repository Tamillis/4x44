//Some simple global functionality

function randomMember(arr) {
    return arr[Math.floor(Math.random()*arr.length)];
}

//setup a distance function
let dist = (x1, y1, x2, y2) => Math.sqrt((x1-x2)*(x1-x2) + (y1-y2)*(y1-y2));

function floodFill(grid, i, j, prop, newVal) {
    let oldVal = grid[i][j][prop];

    if(oldVal === newVal) return;

    let q = new Queue();

    q.enqueue([i, j]);

    while (!q.isEmpty) {
        [i,j] = q.dequeue();

        //escape border cells or if the same as the newVal
        if (i < 0 || i >= grid.length || j < 0 || j >= grid[i].length || grid[i][j][prop] !== oldVal) continue;
        else {
            grid[i][j][prop] = newVal;
            q.enqueue([i+1, j]);
            q.enqueue([i-1, j]);
            q.enqueue([i, j+1]);
            q.enqueue([i, j-1]);
        }
    }
}

function getRandomVectorForce(forceMax = 100, forceMin = 0, forceDir = null) {
    if(forceDir == null) forceDir = Math.random() * 2 * Math.PI;
    let forceStr = forceMin + Math.random() * (forceMax - forceMin);
    return { x: Math.floor(forceStr * Math.sin(forceDir)), y: Math.floor(forceStr * Math.cos(forceDir)) };
}

function smoothVals(grid, prop) {
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

function highestTileVal(tiles, prop) {
    let highest = tiles[0][prop];
    for(let i = 1; i < tiles.length; i++) if(tiles[i][prop] > highest) highest = tiles[i][prop];
    return highest;
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

//TODO make a flood fill algorithm using the queue