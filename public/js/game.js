import {calcProgress, lerp, PerspectiveEngine} from './utils.js';
import {Lane, Star, StarCollection, Constellation} from './elements.js';

 var GameState = {
    background_color: [0, 0, 0],
    star_collection: null,
    constellation: null,
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
        this.tempAddRandomStarToConstellation(tick);
        this.runConstellation(tick);
    }

    displayState(){
        this.ctx.reset();
        
        this.displayBackground();
        this.displayStars();
        this.displayConstellation();

        this.perspectiveEngine.drawPerspectives(this.ctx);
        
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

    tempAddRandomStarToConstellation(tick) {
        if (tick % 180 !== 0) { return; } // 
        
        const randomStar = this.state.star_collection.getRandomStar();
        if (randomStar) {
            this.state.constellation.addStar(randomStar);
        }
    }


}