import {calcProgress, lerp, PerspectiveEngine, Point} from './utils.js';
import {Lane, Star, StarCollection, Constellation, Player, Coin, CoinGenerator, CoinCollection} from './elements.js';

 var GameState = {
    background_color: [0, 0, 0],
    star_collection: null,
    constellation: null,
    player: null,
    coin_collection: null,
}


export class Game {
    constructor(config, canvas_ctx) {
        this.config = config;
        this.ctx = canvas_ctx;
        this.perspectiveEngine = new PerspectiveEngine(
            {x: 0.5, y: 0.50}, // origin
            {x: 0.1, y: 0},     // top left
            {x: 0.9, y: 0},     // top right
            {x: 0, y: 0.90},     // bottom left
            {x: 1, y: 0.90}      // bottom right
        );
        this.initState();

    }

    run(tick) {
        this.runState(tick);
        this.displayState();
    }

    runState(tick) {
        this.runProgressBackground(tick);
        //this.tempAddRandomStarToConstellation(tick);
        this.runConstellation(tick);
        this.runPlayer(tick);
        this.runCoins(tick);
        this.checkCollisions();
    }

    displayState(){
        this.ctx.reset();
        
        this.displayBackground();
        this.displayStars();
        this.displayConstellation();

        this.perspectiveEngine.drawPerspectives(this.ctx);
        this.displayCoins();
        this.displayPlayer();
    }

    initState() {
        this.state = GameState;
        this.state.background_color = [...this.config.BG_START_COLOR];
        this.state.star_collection = new StarCollection(
            this.config.NB_STARS, 
            this.config.STARS_X_MAX_SPACE,
            this.config.STARS_Y_MAX_SPACE,
            this.perspectiveEngine);
        this.state.constellation = new Constellation(this.config.CONSTELLATION_MAX_LIFETIME_TICKS, this.config.CONSTELLATION_PATH_DURATION_TICKS);
        
        const positionPlayer = new Point(this.config.PLAYER_X_SLOTS[1], this.config.PLAYER_Y_POSITION);
        this.state.player = new Player(positionPlayer, this.config.PLAYER_X_SLOTS, this.config.PLAYER_RADIUS);
        this.state.player.setListeners(this.ctx.canvas);
        
        //Generate four Point from the four COIN_SLOTS using PLAYER_Y_POSITION as y coordinate
        const coinTargets = this.config.COIN_SLOTS.map(x => new Point(x, this.config.PLAYER_Y_POSITION));

        const coinGenerator = new CoinGenerator(
            this.perspectiveEngine.origin,
            coinTargets,
            this.config.COIN_RADIUS, 
            this.config.COIN_SPEED, 
            this.config.COIN_INTERVAL_TICKS);
        this.state.coin_collection = new CoinCollection(coinGenerator, this.config.COIN_INTERVAL_TICKS);
    }

    runProgressBackground(tick) {
        if (tick > this.config.MAX_TICK) { return; }

        let progress = calcProgress(tick, this.config.MAX_TICK);
        this.state.background_color[0] = lerp(this.config.BG_START_COLOR[0], this.config.BG_END_COLOR[0], progress);
        this.state.background_color[1] = lerp(this.config.BG_START_COLOR[1], this.config.BG_END_COLOR[1], progress);
        this.state.background_color[2] = lerp(this.config.BG_START_COLOR[2], this.config.BG_END_COLOR[2], progress);
        
    }

    displayBackground() {
        const skyGrad = this.ctx.createLinearGradient(0, 0, 0, this.ctx.canvas.height);

        const r = this.state.background_color[0];
        const g = this.state.background_color[1];
        const b = this.state.background_color[2];

        skyGrad.addColorStop(1,   `rgb(${Math.min(255, r + 36)},${Math.min(255, g + 48)},${Math.min(255, b + 60)})`);
        skyGrad.addColorStop(0.5, `rgb(${r},${g},${b})`);
        skyGrad.addColorStop(0,   `rgb(${Math.max(0, r - 6)},${Math.max(0, g - 8)},${Math.max(0, b - 12)})`);

        this.ctx.fillStyle = skyGrad;
        this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    }

    displayStars() {
        this.state.star_collection.drawStars(this.ctx);
    }

    runConstellation(tick) {
        this.state.constellation.run(tick);
    }

    displayConstellation() {
        this.state.constellation.draw(this.ctx);
    }

    AddRandomStarToConstellation() {
        
        const randomStar = this.state.star_collection.getRandomStar();
        
        if (randomStar) {
            this.state.constellation.addStar(randomStar);
        }

        // If it was the first start, we quickly add a second to draw the first path
        if (this.state.constellation.connections.length == 1) {
            const randomStar = this.state.star_collection.getRandomStar();
            if (randomStar) {
                this.state.constellation.addStar(randomStar);
            }
        }
       
    }

    displayPlayer() {
        this.state.player.draw(this.ctx);
    }

    runPlayer(tick) {
        this.state.player.run();
    }

    displayCoins() {
        this.state.coin_collection.draw(this.ctx);
    }

    runCoins(tick) {
        this.state.coin_collection.run();
        
    }

    checkCollisions() {
        const player = this.state.player;
        const coins = this.state.coin_collection.coins;
        
        for (let i = 0; i < coins.length; i++) {
            if (this.isColliding(player, coins[i])) {
                coins[i].is_captured = true;
                this.AddRandomStarToConstellation();
                player.setSuccess(this.config.PLAYER_LIFETIME_SUCCESS_TICKS);
            }
        }
    }

    isColliding(player, coin) {
        if (coin.is_captured) {
            return false;
        }
        const dx = player.position.x - coin.current_position.x; // noramlized coordinates
        const dy = player.position.y - coin.current_position.y;
        const distance = Math.sqrt(dx * dx + dy * dy); // normalized distance
        const combinedRadius = (player.radius + coin.radius) / (this.ctx.canvas.width*2);
        return distance < combinedRadius;
    }

    
}