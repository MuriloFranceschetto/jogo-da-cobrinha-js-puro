'use strict'

const SIZE_BOARD = 21;
let game;
let foodGenerator;

window.onload = () => {
    newGame();
};

function newGame() {
    game = new Game();
}

class Game {
    
    board;
    snake;
    foodGenerator;
    
    tick;
    lastKeyboardEvent = {
        name: null,
        fn: null,
    }
    
    constructor() {
        this.board = new Board();
        this.snake = new Snake();
        this.foodGenerator = new FoodGenerator(this.board, this.snake);
        this.foodGenerator.createFoodRandomBox();
        this.createEvents();
        this.startTick();
    }
    
    startTick() {
        this.tick = setInterval(() => this.tick200ms(), 300);
    }
    
    tick200ms() {
        this.lastKeyboardEvent.fn?.();
        this.renderSnake();
    }
    
    renderSnake() {
        for (let bodyPart of this.snake.body) {
            let box = this.board.getBox(bodyPart.line, bodyPart.column);
            if (!box) continue;
            box.appendChild(bodyPart.bodyElement);
        }
    }
    
    createEvents() {
        const events = {
            'ArrowUp': () => {
                let {line, column} = this.snake.head;
                this.moveBodySnake();
                this.moveHeadSnake(line - 1, column);
            },
            'ArrowDown': () => {
                let {line, column} = this.snake.head;
                this.moveBodySnake();
                this.moveHeadSnake(line + 1, column);
            },
            'ArrowLeft': () => {
                let {line, column} = this.snake.head;
                this.moveBodySnake();
                this.moveHeadSnake(line, column - 1);
            },
            'ArrowRight': () => {
                let {line, column} = this.snake.head;
                this.moveBodySnake();
                this.moveHeadSnake(line, column + 1);
            },
        }
        
        document.addEventListener('keydown', ({key}) => {
            if (!events[key]) return; 
            
            // PODE IGNORAR AS REGRAS DE MUDANÇA PARA A DIREÇÃO CONTRÁRIA SE SÓ TIVER 1 CORPINHO
            if (this.snake.body.length > 1) {
                if ((this.lastKeyboardEvent.name === 'ArrowUp' && key === 'ArrowDown') ||
                (this.lastKeyboardEvent.name === 'ArrowDown' && key === 'ArrowUp') ||
                (this.lastKeyboardEvent.name === 'ArrowLeft' && key === 'ArrowRight') ||
                (this.lastKeyboardEvent.name === 'ArrowRight' && key === 'ArrowLeft')) {
                    return;
                }
            }
            
            this.lastKeyboardEvent.name = key;
            this.lastKeyboardEvent.fn = events[key];
        });
    }
    
    moveHeadSnake(lineIndex, columnIndex) {
        // COBRINHA NÃO PODE BATER DE CARA NA PAREDE
        if (lineIndex < 0 || lineIndex >= SIZE_BOARD || columnIndex < 0 || columnIndex >= SIZE_BOARD) {
            this.gameOver();
        }
        
        // COBRINHA NÃO PODE SE COMER
        if (this.snake.body.find(bodyPart => bodyPart.line === lineIndex && bodyPart.column === columnIndex)) {
            this.gameOver();
        }

        if (this.foodGenerator.currentLocation.line == lineIndex && this.foodGenerator.currentLocation.column == columnIndex) {
            this.snake.addBodyPart();
            this.board.getBox(lineIndex, columnIndex).innerHTML = '';
            this.foodGenerator.createFoodRandomBox();
        }

        this.snake.head.setPosition(lineIndex, columnIndex);
    }
    
    moveBodySnake() {
        for (let i = this.snake.body.length - 1; i > 0; i--) {
            let previousBodyPart = this.snake.body[i - 1];
            this.snake.body[i].setPosition(previousBodyPart.line, previousBodyPart.column);
        }
    }
    
    gameOver() {
        new Promise(async (resolve) => {
            clearInterval(this.tick);
            resolve();
        }).then(() => {
            this.tick = null;
            this.lastKeyboardEvent = {
                name: null,
                fn: null,
            };
            confirm('AHAHHAHHAHAHAHA VOCÊ PERDEU.');
            newGame()
        })
    }
    
}

class Board {
    
    get mapElement() {
        return document.getElementById('map');
    }
    
    constructor() {
        // zera o mapa
        this.mapElement.innerHTML = '';
                
        for (let i = 0; i < SIZE_BOARD; i++) {
            const line = this.createLine(i);
            this.mapElement.appendChild(line);
            
            for (let j = 0; j < SIZE_BOARD; j++) {
                line.appendChild(this.createBox(i, j));
            }
        }
    }
    
    createLine(indexLine) {
        const row = document.createElement('tr');
        row.id = 'line-' + indexLine;
        return row;
    }
    
    createBox(indexLine, indexCol) {
        const section = document.createElement('td');
        section.classList.add('block');
        section.id = this.getIdBox(indexLine, indexCol);
        return section;
    }
    
    getBox(indexLine, indexCol) {
        return document.getElementById(this.getIdBox(indexLine, indexCol));
    }
    
    getIdBox(line, column) {
        return `box-${line}-${column}`;
    }
    
}

class Snake {
    
    body = [];
    
    constructor() {
        this.body = [
            new BodyPart(
                Math.floor(SIZE_BOARD / 2), 
                Math.floor(SIZE_BOARD / 2), 
                true
            ),
        ];   
    }
    
    get head() {
        return this.body.find(bodyPart => bodyPart.head);
    }
    
    addBodyPart(line, column) {
        this.body.push(new BodyPart(line, column));
    }
}

class BodyPart {
    
    bodyElement = document.createElement('div');
    
    constructor(line, column, head) {
        this.line = line;
        this.column = column;
        this.head = head ?? false;
        
        this.bodyElement.classList.add('snake');
        if (this.head) {
            this.bodyElement.classList.add('head');
        }
    }
    
    setPosition(line, column) {
        this.line = line;
        this.column = column;
    }
}

class FoodGenerator {

    board;
    snake;

    currentLocation = {
        line: null,
        column: null,
    };

    constructor(board, snake) {
        this.board = board;
        this.snake = snake;
    }


    // Pega a lista de quadradinhos
    // Filtra os que tem cobrinha em cima
    // Faz um random com o index desses que restaram
    // O index sorteado vai aparecer a comidinha
    createFoodRandomBox() {
        let boxs = [...document.getElementsByTagName('td')];
        for (let bodyPart of this.snake.body) {
            let fullBoxIndex = boxs.findIndex(el => el.id === this.board.getIdBox(bodyPart.line, bodyPart.column));
            if (fullBoxIndex > -1) {
                boxs.splice(fullBoxIndex, 1);
            }
        }

        let min = 0,
            max = boxs.length;
        let drawnIndex = Math.round((Math.random() * (max - min) + min));

        let [, line, column] = boxs[drawnIndex].id.split('-');

        let food = document.createElement('span');
        food.innerHTML = '🍖';
        this.board.getBox(line, column).appendChild(food);
        this.currentLocation.line = line;
        this.currentLocation.column = column;
    }

}