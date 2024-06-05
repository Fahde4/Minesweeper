window.addEventListener('load', () => {
    Minesweeper.init();
});

const Minesweeper = {

    gameType: [
        { name: 'small', size: 9, mines: 10 },
        { name: 'medium', size: 16, mines: 40 },
        { name: 'large', size: 24, mines: 150 }
    ],

    init() {
        this.logic = localLogic;
        this.bodyFunction();
        this.newGame('small');
    },

    bodyFunction() {
        const body = document.body;

        const content = document.createElement("div");
        content.classList.add("content");

        body.appendChild(content);

        const title = this.getHeader();
        content.appendChild(title);

        const playfield = this.getPlayfield();
        content.appendChild(playfield);

        const buttonBar = this.getButtonHolder();
        content.appendChild(buttonBar);

        const footer = this.getFooter();
        content.appendChild(footer);
    },

    getHeader() {
        const head = document.createElement("div");
        head.classList.add("header");

        const title = document.createElement("h1");
        title.classList.add("title");
        title.innerText = "Minesweeper";

        const subtitle = document.createElement("h2");
        subtitle.classList.add("subtitle");
        subtitle.innerText = "by Thamilinian Ranganathan";

        head.appendChild(title);
        head.appendChild(subtitle);

        return head;
    },

    getPlayfield() {
        const field = document.createElement("div");
        field.id = "playfield";
        return field;
    },

    getButtonHolder() {
        const bar = document.createElement("div");
        bar.classList.add("buttonholder");
        bar.id = 'bar';

        const small = document.createElement("button");
        small.addEventListener('click', () => { this.newGame('small'); });
        bar.appendChild(small);
        small.innerText = "small";
        small.id = "small";

        const medium = document.createElement("button");
        medium.addEventListener('click', () => { this.newGame('medium'); });
        bar.appendChild(medium);
        medium.innerText = "medium";
        medium.id = "medium";

        const large = document.createElement("button");
        large.addEventListener('click', () => { this.newGame('large'); });
        bar.appendChild(large);
        large.innerText = "large";
        large.id = "large";

        return bar;
    },

    getFooter() {
        const foot = document.createElement("div");
        foot.classList.add("footer");
        foot.innerText = "@ 2024 by Thamilinian Ranganathan";
        return foot;
    },

    generatePlayfield(size) {
        const playfield = document.querySelector("#playfield");
        playfield.innerText = '';

        for (let row = 0; row < size; row++) {
            for (let column = 0; column < size; column++) {
                playfield.appendChild(this.cellFunction(row, column));
            }
        }
    },

    cellFunction(row, column) {
        const cell = document.createElement("div");
        cell.classList.add('cell');
        cell.classList.add('covered');

        cell.dataset.x = column;
        cell.dataset.y = row;

        const style = `calc(100% / ${this.size} - var(--shadowsize) * 2)`;

        cell.style.width = style;
        cell.style.paddingBottom = style;

        cell.addEventListener("click", (event) => { this.leftClickHandler(event); });
        cell.addEventListener("contextmenu", (event) => { this.rightClickHandler(event); });
        cell.addEventListener("touchstart", (event) => { this.touchStartFunction(event); });
        cell.addEventListener("touchend", (event) => { this.touchEndFunction(event); });

        return cell;
    },

    newGame(gameType) {
        for (const mode of this.gameType) {
            if (mode.name === gameType) {
                this.size = mode.size;
                this.mines = mode.mines;
            }
        }

        this.generatePlayfield(this.size);
        this.logic.init(this.size, this.mines);

        const existingOverlay = document.querySelector("#overlay");
        if (existingOverlay) {
            existingOverlay.remove();
        }
    },

    leftClickHandler(event) {
        event.preventDefault();

        const x = event.target.dataset.x;
        const y = event.target.dataset.y;

        const result = this.logic.sweep(x, y);
        const mineHit = result.mineHit;
        const minesAround = result.minesAround;
        const emptyCells = result.emptyCells;
        const mines = result.mines;

        if (mineHit) {
            this.logic.gameLost(event, mines);
        } else {
            this.logic.uncoverCell(x, y, minesAround);
            for (const cell of emptyCells) {
                this.logic.uncoverCell(cell.x, cell.y, cell.minesAround);
            }
            if (this.logic.winCondition()) {
                this.logic.gameWon();
            }
        }
    },

    rightClickHandler(event) {
        event.preventDefault();
        event.target.classList.add('symbol_flag');
    },

    touchStartFunction(event) {
        event.preventDefault();
        this.touchStartTime = new Date().getTime();
    },

    touchEndFunction(event) {
        event.preventDefault();
        const touchDuration = new Date().getTime() - this.touchStartTime;
        if (touchDuration < 500) {
            this.leftClickHandler(event);
        } else {
            this.rightClickHandler(event);
        }
    },

    displayOverlay(text) {
        const overlay = document.createElement("div");
        overlay.id = "overlay";
        overlay.style.position = "absolute";
        overlay.style.top = "0";
        overlay.style.left = "0";
        overlay.style.width = "100%";
        overlay.style.height = "100%";
        overlay.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
        overlay.style.color = "white";
        overlay.style.display = "flex";
        overlay.style.justifyContent = "center";
        overlay.style.alignItems = "center";
        overlay.style.pointerEvents = "none"; // Allow clicks to pass through

        const textHolder = document.createElement("div");
        textHolder.innerText = text;
        overlay.appendChild(textHolder);

        const playfield = document.querySelector("#playfield");
        playfield.appendChild(overlay);
        playfield.style.position = "relative"; // Ensure the playfield has a relative position for the absolute overlay
    },

    disablePlayfield() {
        const cells = document.querySelectorAll('.cell');
        cells.forEach(cell => {
            const newCell = cell.cloneNode(true);
            cell.parentNode.replaceChild(newCell, cell);
        });
    }
};

const localLogic = {
    init(size, mines) {
        this.size = size;
        this.mines = mines;
        this.moves = 0;
        this.uncoveredCells = [];
        this.field = [];

        for (let i = 0; i < size; i++) {
            const row = [];
            for (let j = 0; j < size; j++) {
                row.push(false);
            }
            this.field.push(row);
        }
        for (let i = 0; i < size; i++) {
            const row = [];
            for (let j = 0; j < size; j++) {
                row.push(false);
            }
            this.uncoveredCells.push(row);
        }
    },

    sweep(x, y) {
        x = parseInt(x);
        y = parseInt(y);

        const mineHit = this.field[x][y];

        let minesAround;
        if (!mineHit) {
            minesAround = this.countMinesAround(x, y);
        }

        if (this.moves === 0) {
            this.placeMines(x, y);
        }
        this.moves++;

        return {
            mineHit: mineHit,
            minesAround: minesAround,
            emptyCells: minesAround === 0 ? this.getEmptyCells(x, y) : [],
            mines: mineHit ? this.collectMines() : []
        };
    },

    placeMines(x, y) {
        for (let i = 0; i < this.mines; i++) {
            this.placeOneMine(x, y);
        }
    },

    placeOneMine(x, y) {
        while (true) {
            const tryX = Math.floor(Math.random() * this.size);
            const tryY = Math.floor(Math.random() * this.size);

            if (tryX === x && tryY === y || this.field[tryX][tryY]) {
                continue;
            }

            this.field[tryX][tryY] = true;
            return;
        }
    },

    getCell(x, y) {
        return document.querySelector(`[data-x="${x}"][data-y="${y}"]`);
    },

    uncoverCell(x, y, symbol) {
        const cell = this.getCell(x, y);
        cell.classList.remove('covered');

        if (symbol) {
            cell.classList.add(`symbol_${symbol}`);
        }

        this.uncoveredCells[x][y] = true;
    },

    countMinesAround(x, y) {
        let count = 0;

        for (let dX = -1; dX <= 1; dX++) {
            for (let dY = -1; dY <= 1; dY++) {
                if (this.safeAccess(x + dX, y + dY)) {
                    count++;
                }
            }
        }
        return count;
    },

    safeAccess(x, y) {
        if (x < 0 || x >= this.size || y < 0 || y >= this.size) {
            return undefined;
        } else {
            return this.field[x][y];
        }
    },

    getEmptyCells(x, y) {
        const listToDo = [{ x: x, y: y, minesAround: 0 }];
        const listDone = [];

        listDone.push({ x: x, y: y, minesAround: 0 });

        while (listToDo.length) {
            const actual = listToDo.shift();
            listDone.push(actual);

            const listNeighbors = this.getNeighbors(actual.x, actual.y);
            for (const n of listNeighbors) {
                if (this.inList(listDone, n)) {
                    continue;
                }
                if (n.minesAround) {
                    listDone.push(n);
                    continue;
                }
                if (!this.inList(listToDo, n)) {
                    listToDo.push(n);
                }
            }
        }
        return listDone;
    },

    getNeighbors(x, y) {
        const neighbors = [];

        for (let dX = -1; dX <= 1; dX++) {
            for (let dY = -1; dY <= 1; dY++) {
                const cell = this.safeAccess(x + dX, y + dY);
                if (cell === false) {
                    neighbors.push({
                        x: x + dX,
                        y: y + dY,
                        minesAround: this.countMinesAround(x + dX, y + dY)
                    });
                }
            }
        }

        return neighbors;
    },

    inList(list, element) {
        return list.some(item => item.x === element.x && item.y === element.y);
    },

    collectMines() {
        const mines = [];

        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                if (this.field[i][j]) {
                    mines.push({ x: i, y: j });
                }
            }
        }

        return mines;
    },

    winCondition() {
        let count = 0;

        for (let x = 0; x < this.size; x++) {
            for (let y = 0; y < this.size; y++) {
                if (this.uncoveredCells[x][y]) {
                    count++;
                }
            }
        }

        return count === this.size * this.size - this.mines;
    },

    gameLost(event, mines) {
        event.target.classList.add('symbol_mine');
        for (const n of mines) {
            this.uncoverCell(n.x, n.y, 'mine');
        }
        Minesweeper.disablePlayfield();
        Minesweeper.displayOverlay('-- Rizz');
    },

    gameWon() {
        Minesweeper.disablePlayfield();
        Minesweeper.displayOverlay('Green FN');
    }
};
