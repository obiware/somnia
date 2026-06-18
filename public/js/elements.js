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

       

        let boost_bright = this.is_bright ? 1.4 : 1.0;
        let boost_shiny = this.is_shiny ? 1.4 : 1.0;
        
        ctx.save();

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
        ctx.restore();

         if (!this.is_bright && rn < 0.001) {
            this.is_bright = true;
           
        } else if (this.is_bright && rn < 0.005) {
            this.is_bright = false;
            
        }
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

            const size = Math.random() * 1.5 + 0.7;
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
        
        this.target_star.is_shiny = true;
        this.target_star.is_bright = true;
    }


    run() {
        
        this.lifeTime_ticks--;
        if (this.lifeTime_ticks <= 0) {
            this.origin_star.is_shiny = false;
           
        }

        if (!this.is_completed) {
            this.current_position.x += this.speed.x;
            this.current_position.y += this.speed.y;

            

            if (Math.abs(this.current_position.x - this.target_star.position.x) < 0.01 && Math.abs(this.current_position.y - this.target_star.position.y) < 0.01) {
                this.is_completed = true;
                this.origin_star.is_shiny = false;
                this.origin_star.is_bright = false;
                this.current_position.x = this.target_star.position.x;
                this.current_position.y = this.target_star.position.y;
            }   
        }

        this.origin_star.is_bright = true;
        this.target_star.is_bright = true;

        
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

export class Player {

    constructor(position, x_slots, radius) {
        this.origin_src = new Point(0.5, 0.5);
        this.position = position;
        this.dragging = false;
        this.dragOffsetX = 0;
        this.touchId = null; // To track the touch identifier
        this.mouseTouch = false;
        this.x_slots = x_slots // User can drag horizontally the cursor but once he release it, the cursor will snap to the closest slot
        this.radius = radius;
        this.lifetimeSuccessTick = 0; // Counter for the success effect
        this.max_lifetime_success_ticks = 0;
        this.nb_success = 0; // Counter for the number of successes
    }

    setListeners (canvas) {
     
        canvas.addEventListener('mousedown', (e) => {
           
        
            this.dragging = true;
            this.dragOffsetX = e.offsetX - (this.position.x * canvas.width);
            this.mouseTouch = true;
          
        });

        canvas.addEventListener('mousemove', (e) => {
            
            if (!this.dragging && !this.mouseTouch) return;
            let newX = e.offsetX - this.dragOffsetX;
            this.position.x = newX / canvas.width;
            this.position.x = Math.max(0, Math.min(1, this.position.x)); // Clamp between 0 and 1
            
        });

        window.addEventListener('mouseup', () => {
            
            this.dragging = false;
            this.mouseTouch = false;
            this.snapToClosestSlot();
        });

        canvas.addEventListener('touchstart', e => {
            e.preventDefault();
            if (this.dragging) return;
            const t = e.changedTouches[0];
            this.dragging    = true;
            this.touchId     = t.identifier;
            this.dragOffsetX = t.clientX - this.position.x * canvas.width;
        }, { passive: false });

        canvas.addEventListener('touchmove', e => {
            e.preventDefault();
            for (const t of e.changedTouches) {
            if (t.identifier !== this.touchId) continue;
            this.position.x = (t.clientX - this.dragOffsetX) / canvas.width;
            this.position.x = Math.max(0, Math.min(1, this.position.x)); // Clamp between 0 and 1
            }
        }, { passive: false });

        canvas.addEventListener('touchend', e => {
            for (const t of e.changedTouches) {
            if (t.identifier === this.touchId) {
                this.dragging = false;
                this.touchId  = null;
                 this.snapToClosestSlot();
            }
            }
        });




    }

    snapToClosestSlot() {
        let closestSlot = this.x_slots.reduce((prev, curr) => {
            return (Math.abs(curr - this.position.x) < Math.abs(prev - this.position.x) ? curr : prev);
        });

        this.position.x = closestSlot;
    }

    run() {
        if (this.lifetimeSuccessTick > 0) {
            this.lifetimeSuccessTick--;
        }
    }

    setSuccess(lifetimeSuccessTicks) {
        this.max_lifetime_success_ticks = lifetimeSuccessTicks;
        this.lifetimeSuccessTick = lifetimeSuccessTicks;
        this.nb_success++;
    }

    draw(ctx) {


       
        const width = ctx.canvas.width;
        const height = ctx.canvas.height;
        ctx.save();
        ctx.font = "bold 18px sans-serif";
        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        ctx.fillStyle = "white";   
        let score = `${this.nb_success}`;     
        ctx.fillText(score, 25, 25);
        ctx.restore();


       
        let cursorColor = "rgb(0, 0, 0)";     // Bleu Néon par défaut
        let innerColor = "rgb(18, 34, 207)";  // Centre bleu clair
        let shadowColor = "rgba(254, 254, 254, 1)"; // Ombre noire semi-transparente
        let shadowColorSuccess = "rgb(222, 130, 55)"; // Ombre dorée pour le succès
        let isSuccess = this.lifetimeSuccessTick > 0;

        let pulse = 1;
        let boostStretch = 0;

        if (isSuccess) {
            const targetTick = this.max_lifetime_success_ticks / 2; 

            // 2. On ajuste la largeur de la cloche (spread) par rapport à la durée totale
            // Diviser par 3 ou 4 permet à la courbe de bien démarrer proche de 0 et de finir proche de 0
            const spread = this.max_lifetime_success_ticks / 3.5;     

            // 3. Calcul de la distribution normale (Gaussienne)
            const gauss = Math.exp(-Math.pow((this.lifetimeSuccessTick - targetTick) / spread, 2));

            // 4. Application dynamique sur le pulse et la propulsion
            pulse = 1 + gauss * 0.35;        // Le vaisseau gonfle au milieu de l'animation
            boostStretch = gauss * 45;
        }


        const cx = this.position.x * width;
        const cy = this.position.y * height;

        const ox = this.origin_src.x * width;
        const oy = this.origin_src.y * height;

        // Math.atan2(y, x) donne l'angle vers la cible. 
        // On ajoute Math.PI / 2 (90°) car ton triangle dessiné de base pointe vers le HAUT.
        const targetAngle = Math.atan2(oy - cy, ox - cx) + Math.PI / 2;

        const attenuation = 0.30; // 0.40 = 40% de la rotation max. Ajuste entre 0 et 1 !

        // On s'assure de linéariser l'angle pour éviter les sauts brusques à Math.PI
        const angle = targetAngle * attenuation;
        // --- 4. Application de la matrice de Transformation ---
        // On déplace le repère au centre du vaisseau, puis on tourne
        
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(angle);

        const currentHeight = this.radius ;
        const distanceToTop = (2 / 3) * currentHeight;
        const distanceToBottom = (1 / 3) * currentHeight;
        const halfBase = currentHeight / Math.sqrt(3); // Écartement horizontal (~0.577 * height)

            // Les coordonnées deviennent relatives à (0,0) !
        const ax = 0;
        const ay = -distanceToTop;

        const bx = -halfBase;
        const by = distanceToBottom;

        const cx_point = halfBase;
        const cy_point = distanceToBottom;

            // ==========================================
        // RENDER 1 : La Coque Principale (Arrondie)
        // ==========================================
        ctx.lineJoin = "round"; // C'est ICI qu'on arrondit les angles !
        ctx.lineWidth = currentHeight * 0.15; // L'épaisseur de l'arrondi
        
        ctx.shadowColor = shadowColor; // Ombre noire semi-transparente
        ctx.shadowBlur = 6;                    // Un léger flou pour faire réaliste
        ctx.shadowOffsetX = Math.sin(angle) * 6; 
        ctx.shadowOffsetY = Math.cos(angle) * 3; // Décalage vertical basé sur la rotation


        if (isSuccess) {
            ctx.shadowColor = shadowColorSuccess; // same yellowish as coin
            ctx.shadowBlur = 6 - boostStretch * 1.2;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = Math.cos(angle) * (6 + boostStretch * 0.1);
        } 

        ctx.strokeStyle = cursorColor;
        ctx.fillStyle = innerColor;

        ctx.beginPath();
        ctx.moveTo(ax, ay);         // On va au sommet du haut
        ctx.lineTo(bx, by);         // Ligne vers le bas-gauche
        ctx.lineTo(cx_point, cy_point); // Ligne vers le bas-droit
        ctx.closePath();            // Ferme le triangle (ligne retour au sommet)
        ctx.stroke();
        ctx.fill();
        

        ctx.restore();
    }
    
}

export class Coin {
    constructor(origin, target, radius, speed) {
        this.origin = origin;
        this.target = target;
        this.radius = radius;
        this.speed = speed; // pixels per tick
        this.current_position = new Point(origin.x, origin.y);
       
        this.direction = getVector(origin, target);
        
        this.is_captured = false;
    }

    run() {
       
        this.current_position.x += this.direction.x * this.speed;
        this.current_position.y += this.direction.y * this.speed;
        
    }

    draw(ctx) {
        const width = ctx.canvas.width;
        const height = ctx.canvas.height;
        
        const x = this.current_position.x * width;
        const y = this.current_position.y * height;

        let rad = this.getCurrentRadius();
        ctx.save();
        // Draw the coin as a simple yellow circle for now
        ctx.fillStyle = "rgba(255, 215, 0, 1)";     
        ctx.beginPath();
        ctx.arc(x, y, rad, 0, 2 * Math.PI);
        ctx.fill();
        ctx.restore();
    }

    //calculate current radius based on distance to target starting to 0
    getCurrentRadius() {
        const totalDistance = Math.sqrt(Math.pow(this.target.x - this.origin.x, 2) + Math.pow(this.target.y - this.origin.y, 2));
        const currentDistance = Math.sqrt(Math.pow(this.target.x - this.current_position.x, 2) + Math.pow(this.target.y - this.current_position.y, 2));
        const progress = 1 - (currentDistance / totalDistance);
        return this.radius * progress;
    }
}

export class CoinGenerator {
    constructor(origin, targets, radius, speed) {
        this.origin = origin; // Point(x,y);
        this.targets = targets; // Array of Point(x,y);
        this.radius = radius;
        this.speed = speed;
        this.current_side = 0; // if 0, has to chose between 0 and 1 slot, if 1, has to chose between 2 and 3

    }

    // Just return a new coin
    generateCoin() {
        
        let targetIndex;
        if (this.current_side === 0) {
            targetIndex = Math.floor(Math.random() * 2); // 0 or 1
        } else {
            targetIndex = Math.floor(Math.random() * 2) + 2; // 2 or 3
        }

        const target = this.targets[targetIndex];
        const coin = new Coin(this.origin, target, this.radius, this.speed);
        this.current_side = 1 - this.current_side; // Toggle side for next coin
        
        return coin;
    }

}

export class CoinCollection {
    constructor(coinGenerator, coin_interval_ticks) {
        this.coinGenerator = coinGenerator;
        this.coin_interval_ticks = coin_interval_ticks;
        this.ticks_since_last_coin = coin_interval_ticks; // Initialize to allow immediate coin generation
        this.coins = [];
    }

    run() {
        
        this.ticks_since_last_coin++;
        if (this.ticks_since_last_coin >= this.coin_interval_ticks) {
            this.ticks_since_last_coin = 0;
            const coin = this.coinGenerator.generateCoin();
            this.coins.push(coin);
        }

        this.coins.forEach(coin => coin.run());

        
        // remove coins that have reached their target by checking if the y is above 1 (out of the screen)
        this.coins = this.coins.filter(coin => {
            if (coin.current_position.y > 1) {
                return false;
            }
            return true;
        });
    }

    draw(ctx) {
        this.coins.forEach(coin => coin.draw(ctx));
    }
}