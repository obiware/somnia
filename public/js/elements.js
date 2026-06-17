import { Point, getVector } from "./utils.js";

export class Lane {
    constructor(left_position, right_position, left_origin, right_origin) {
        this.left_position = left_position;
        this.right_position = right_position;
        this.left_origin = left_origin;
        this.right_origin = right_origin;
        this.active = false;
    }

}

export class Star {
    constructor(positionPoint, size, intensity, scale) {
       this.position = positionPoint;
       this.size = size;    
       this.intensity = intensity;
       this.scale = scale;
       this.is_shiny = false;
       this.is_bright = false;
    }

    draw(ctx) {
        const width = ctx.canvas.width;
        const height = ctx.canvas.height;

        const x = this.position.x * width;
        const y = this.position.y * height;

        let base_color = [255, 255, 255]; // White color for the star
        
        if (this.is_shiny) {
            base_color = [253, 204, 13]; // Slightly yellowish for shiny stars
        }

        let rn = Math.random();

        if (!this.is_bright && rn < 0.005) {
            this.is_bright = true;
           
        } else if (this.is_bright && rn < 0.005) {
            this.is_bright = false;
            
        }

        let boost_bright = this.is_bright ? 1.2 : 1.0;
        let boost_shiny = this.is_shiny ? 1.2 : 1.0;
        
        const glowGradient = ctx.createRadialGradient(
        x, y, 0,           // Cercle de départ (centre)
        x, y, this.size * 1.5 * boost_shiny * boost_bright   // Cercle d'arrivée (taille du halo)
        );
    
        // Au centre : blanc très lumineux
        glowGradient.addColorStop(0, `rgba(${base_color[0]}, ${base_color[1]}, ${base_color[2]}, ${this.intensity * 0.80 })`);
        // À mi-chemin : la lumière décroît de manière exponentielle
        glowGradient.addColorStop(0.4, `rgba(${base_color[0]}, ${base_color[1]}, ${base_color[2]}, ${this.intensity * 0.40 })`);
        // Au bord : totalement invisible (fondu parfait)
        glowGradient.addColorStop(1, `rgba(${base_color[0]}, ${base_color[1]}, ${base_color[2]}, 0)`);

        ctx.fillStyle = glowGradient;
        ctx.beginPath();
        ctx.arc(x, y, this.size * 8, 0, Math.PI * 2);
        ctx.fill();
       
        // SPIKES 

        const outer = this.size * 2.8 * boost_bright * boost_shiny;
        const inner = this.size * 0.18;

        ctx.fillStyle = `rgba(${base_color[0]}, ${base_color[1]}, ${base_color[2]}, ${Math.min(1, this.intensity * 0.7 * boost_bright * boost_shiny)})`;
        ctx.beginPath();
        
        ctx.moveTo(x,         y - outer);
        ctx.bezierCurveTo(x + inner, y - inner, x + inner, y - inner, x + outer, y);
        ctx.bezierCurveTo(x + inner, y + inner, x + inner, y + inner, x,         y + outer);
        ctx.bezierCurveTo(x - inner, y + inner, x - inner, y + inner, x - outer, y);
        ctx.bezierCurveTo(x - inner, y - inner, x - inner, y - inner, x,         y - outer);
        ctx.closePath();
        ctx.fill();


        // ÉTAPE 3 : Le cœur lumineux 
        ctx.fillStyle = `rgba(${base_color[0]}, ${base_color[1]}, ${base_color[2]}, ${Math.min(1, this.intensity * 0.7 * boost_bright)})`;
        ctx.beginPath();
        ctx.arc(x, y, this.size * 0.6,0, Math.PI * 2);
        ctx.fill();
    }
}

export class StarCollection {
    constructor(nb_stars, max_x_space, max_y_space, perspectiveEngine) {
        this.nb_stars = nb_stars;
        this.max_x_space = max_x_space;
        this.max_y_space = max_y_space;
        this.perspectiveEngine = perspectiveEngine;
        this.stars = [];
        
        for (let i = 0; i < nb_stars; i++) {
            const x = Math.random() * max_x_space;
            const y = Math.random() * max_y_space;

            if (this.perspectiveEngine.isOnTheWay(x,y)){continue;}

            const size = Math.random() * 4 + 0.5;
            const intensity = Math.random() * 0.5 + 0.5;
            const scale = Math.random() * 0.5 + 0.5;
            this.stars.push(new Star(new Point(x, y), size, intensity, scale));
        }
    }

    getRandomStar() {
        const randomIndex = Math.floor(Math.random() * this.stars.length);
        return this.stars[randomIndex];
    }

    drawStars(ctx) {
        for (let star of this.stars) {
            star.draw(ctx);
        }   
    }
}

class StarConnection {
    constructor(star1, star2, lifeTime_ticks, path_duration_ticks) {
        this.origin_star = star1;
        this.target_star = star2;
        this.current_position = new Point(star1.position.x, star1.position.y);
        this.lifeTime_ticks = lifeTime_ticks;
        this.is_completed = false;
        let direction = getVector(star1.position, star2.position);
        
        this.speed = new Point(direction.x / path_duration_ticks, direction.y / path_duration_ticks); // pixel by tick
        
    }

    
    run() {
        
        this.lifeTime_ticks--;
        if (this.lifeTime_ticks <= 0) {
            this.origin_star.is_shiny = false;
            this.target_star.is_shiny = false;
        }

        if (!this.is_completed) {
            this.current_position.x += this.speed.x;
            this.current_position.y += this.speed.y;

            

            if (Math.abs(this.current_position.x - this.target_star.position.x) < 0.01 && Math.abs(this.current_position.y - this.target_star.position.y) < 0.01) {
                this.is_completed = true;
                this.current_position.x = this.target_star.position.x;
                this.current_position.y = this.target_star.position.y;
            }   
        }

        
    }
}

export class Constellation {

    constructor(max_lifetime_ticks, path_duration_ticks) {
        this.max_lifetime_ticks = max_lifetime_ticks;
        this.path_duration_ticks = path_duration_ticks;
        this.connections = [];
    }

    addStar(star) {

        if (this.connections.length > 0) {
            const lastConnection = this.connections[this.connections.length - 1];
            const newConnection = new StarConnection(lastConnection.target_star, star, this.max_lifetime_ticks, this.path_duration_ticks);
            this.connections.push(newConnection);
        } else {
            // If it's the first star, we create a connection with itself
            const newConnection = new StarConnection(star, star, this.max_lifetime_ticks, this.path_duration_ticks);
            this.connections.push(newConnection);
        }
    }

    run(tick) {
        // Decrease the lifetime of each connection
        for (let connection of this.connections) {
            connection.run();
        }
        
        this.connections = this.connections.filter(connection => connection.lifeTime_ticks > 0);
    }

    draw(ctx) {
        
        for (let connection of this.connections) {
            const shiny_color = [253, 245, 234];
            connection.origin_star.is_shiny = true;
            connection.origin_star.is_bright = true;
            connection.target_star.is_shiny = connection.is_completed;
            connection.target_star.is_bright = true;
            let intensity_factor = Math.min(connection.lifeTime_ticks / this.max_lifetime_ticks, 1.0);
            ctx.strokeStyle = `rgba(${shiny_color[0]}, ${shiny_color[1]}, ${shiny_color[2]}, ${0.7 * intensity_factor})`;
            ctx.lineWidth = 1.5 * intensity_factor;
            ctx.beginPath();
            ctx.moveTo(connection.origin_star.position.x * ctx.canvas.width, connection.origin_star.position.y * ctx.canvas.height);
            ctx.lineTo(connection.current_position.x * ctx.canvas.width, connection.current_position.y * ctx.canvas.height);
            ctx.stroke();

        }   


    }

}