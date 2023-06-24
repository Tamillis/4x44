//Some simple global functionality

function randomMember(arr) {
    return arr[Math.floor(Math.random()*arr.length)];
}

//setup a distance function
let dist = (x1, y1, x2, y2) => Math.sqrt((x1-x2)*(x1-x2) + (y1-y2)*(y1-y2));

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