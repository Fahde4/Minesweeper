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
        this.logic = remoteLogic;
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
                playfield.appendChild(this.createCell(row, column));
            }
        }
    },

    createCell(row, column) {

        const cell = document.createElement("div");
        cell.classList.add('cell');
        cell.classList.add('covered');

        cell.dataset.x = column;
        cell.dataset.y = row;

        const style = `calc(100% / ${this.size} - var(--shadowsize) * 2)`;

        cell.style.width = style;
        cell.style.paddingBottom = style;

        this.cellEventListeners(cell);

        return cell;
    },

    cellEventListeners(cell){
        cell.addEventListener('click', (event) => { this.cellLeftClickHandler(event); });
        cell.addEventListener('contextmenu', (event) => { this.cellRightClickHandler(event); });
        cell.addEventListener('touchstart', (event) => { this.touchStartFunction(event); });
        cell.addEventListener('touchend', (event) => { this.touchEndFunction(event); });
    },

    async newGame(gameType) {
        for (const mode of this.gameType) {
            if (mode.name === gameType) {
                this.size = mode.size;
                this.mines = mode.mines;
            }
        }

        this.generatePlayfield(this.size);

        await this.logic.init(this.size, this.mines);

    },

    async cellLeftClickHandler(event) {

        event.preventDefault();

        const x = event.target.dataset.x;
        const y = event.target.dataset.y;

        const result = await this.logic.sweep(x, y);
        
        if (result.minehit) {
            this.logic.gameLost(event, result.mines);
        } else {
            this.logic.uncoverCell(x, y, result.minesAround);
                for (cell of result.emptyCells) {
                    this.logic.uncoverCell(cell.x, cell.y, cell.minesAround);
                }
                if (result.userwins) {
                    this.logic.gameWon();
                }
        }
    },

    cellRightClickHandler(event) {
        event.preventDefault();
        event.target.classList.add('symbol_flag');
    },

    cellTouchStartFunction(event) {
        event.preventDefault();
        this.touchStartTime = new Date().getTime();
    },

    cellTouchEndFunction(event) {
        event.preventDefault();

        const touchDuration = new Date().getTime() - this.touchStartTime;
        if (touchDuration < 500) {
            this.leftClickHandler(event);
        } else {
            this.rightClickHandler(event);
        }
    },
}

   

const remoteLogic={

    async init(size, mines){
        this.serverURL = `https://www2.hs-esslingen.de/~melcher/it/minesweeper/?`;
        const request = `request=init&size=${size}&mines=${mines}&userid=thrait02`;
        const response = await this.fetchAndDecode(request);
        this.token = response.token;
    },

    async fetchAndDecode(FAD){
        return fetch(this.serverURL + FAD).then(response=> response.json());
    },

    async sweep(x,y){
        const request = `request=sweep&token=${this.token}&x=${x}&y=${y}`;
        return this.fetchAndDecode(request);
    },

    getCell(x, y) {
        return document.querySelector(`[data-x="${x}"][data-y="${y}"]`);
    },

    uncoverCell(x, y, symbol) {
        this.getCell(x, y).classList.remove('covered');

        if (symbol) {
            this.getCell(x, y).classList.add(`symbol_${symbol}`);
        }
    },
        
    

    gameLost(event, mines) {
        event.target.classList.add('symbol_mine');
        for (const mine of mines) {
            this.uncoverCell(mine.x, mine.y, 'mine');
        }
        this.displayOverlay('--RIZZ')
    },

    gameWon() {
        this.displayOverlay('Green FN')
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
        overlay.style.pointerEvents = "none"; 
        const textHolder = document.createElement("div");
        textHolder.innerText = text;
        overlay.appendChild(textHolder);

        const playfield = document.querySelector("#playfield");
        playfield.appendChild(overlay);
        playfield.style.position = "relative"; 
    },

};
