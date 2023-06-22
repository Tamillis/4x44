//file for generic js functions used by the game / page
function setSelectedMode(radioElementClicked) {
    screen.mode = radioElementClicked.value;
    rerenderBoard();
}

function getMode() {
    let radioBtns = document.getElementsByName("mode");
    let mode = "geo";

    for (let btn of radioBtns) {
        if (btn.checked) mode = btn.value;
    }

    return mode;
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