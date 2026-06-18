export class Point {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
}

export class Line {
    constructor(startPoint, endPoint) {
        this.startPoint = startPoint;
        this.endPoint = endPoint;
        this.nb_tick_success = 0;
        this.is_shiny = false;
    }   

    isSuccess() {
        if (this.nb_tick_success > 0) {
            this.nb_tick_success--;
        }
        return this.nb_tick_success > 0;
    }


    // if line is success, you have 10% chance that shiny status changes to inverse. To make a scintillement,
    // if line is not succes, return false;
    isShiny() {
        // if (this.isSuccess()) {
        //     if (Math.random() < 0.1) {
        //         this.is_shiny = !this.is_shiny;
        //     }
            
        // } else {
        //     this.is_shiny = false;
        // }

        //return this.is_shiny;
        return this.isSuccess();
    }


    setSuccess(nb_tick_success) {
        this.nb_tick_success = nb_tick_success;
    }


}

export function calcProgress(current_t, max_t) {
    let p = current_t / max_t;
    return parseFloat(p.toFixed(2));
}

export function getVector(pointA, pointB) {
    return new Point(pointB.x - pointA.x, pointB.y - pointA.y);
}

export function lerp(a, b, t)   {
    let delta = (b-a) * t;
    return a + delta; 
}




export class PerspectiveEngine {
    constructor(originPoint, topLeftPoint, topRightPoint, bottomLeftPoint, bottomRightPoint) {
        this.origin = originPoint;
        this.topLeftPoint = topLeftPoint;
        this.topRightPoint = topRightPoint;
        this.bottomLeftPoint = bottomLeftPoint;
        this.bottomRightPoint = bottomRightPoint;
        this.lines = [];
        //this.lines.push(new Line(originPoint, topLeftPoint));
        //this.lines.push(new Line(originPoint, topRightPoint));
        this.lines.push(new Line(originPoint, bottomLeftPoint));
        let projection1 = this.projectLineOfSight(originPoint, new Point(0.25, bottomLeftPoint.y), 1);
        this.lines.push(new Line(originPoint, projection1));
        let projection2 = this.projectLineOfSight(originPoint, new Point(0.5, bottomLeftPoint.y), 1);
        this.lines.push(new Line(originPoint, projection2));
        let projection3 = this.projectLineOfSight(originPoint, new Point(0.75, bottomLeftPoint.y), 1);
        this.lines.push(new Line(originPoint, projection3));
        this.lines.push(new Line(originPoint, bottomRightPoint));
        

    
    }

    isOnTheWay(x, y) { 
        // We have a triangle with origin, bottomLeft and bottomRight. We want to check if the point (x,y) is inside this triangle.
        let A = this.origin;
        let B = this.lines[0].endPoint;
        let C = this.lines[1].endPoint;

        // Using barycentric coordinates to check if the point is inside the triangle
        let v0 = {x: C.x - A.x, y: C.y - A.y};
        let v1 = {x: B.x - A.x, y: B.y - A.y};
        let v2 = {x: x - A.x, y: y - A.y};

        let dot00 = v0.x * v0.x + v0.y * v0.y;
        let dot01 = v0.x * v1.x + v0.y * v1.y;
        let dot02 = v0.x * v2.x + v0.y * v2.y;
        let dot11 = v1.x * v1.x + v1.y * v1.y;
        let dot12 = v1.x * v2.x + v1.y * v2.y;

        let invDenom = 1 / (dot00 * dot11 - dot01 * dot01);
        let u = (dot11 * dot02 - dot01 * dot12) * invDenom;
        let v = (dot00 * dot12 - dot01 * dot02) * invDenom;

        return (u >= 0) && (v >= 0) && (u + v < 1); 

    }

    setSuccessSlot(slot, nb_tick_success) {
        
        if (slot == 0) {
            this.lines[0].setSuccess(nb_tick_success);
            this.lines[1].setSuccess(nb_tick_success);
        }
        if (slot == 1) {
            this.lines[1].setSuccess(nb_tick_success);
            this.lines[2].setSuccess(nb_tick_success);
        }
        if (slot == 2) {
            this.lines[2].setSuccess(nb_tick_success);
            this.lines[3].setSuccess(nb_tick_success);
        }
        if (slot == 3) {
            this.lines[3].setSuccess(nb_tick_success);
            this.lines[4].setSuccess(nb_tick_success);
        }

    }

    drawPerspectives(ctx) {
        ctx.save();
         let width = ctx.canvas.width;
         let height = ctx.canvas.height;
        
        ctx.setLineDash([20, 10]);
        ctx.strokeStyle = "white";
        ctx.lineWidth = 2;
        
        for (let line of this.lines) {
            let is_shiny = line.isShiny();
            const background_color_start = is_shiny ? 'rgba(255, 255, 0, 0.1)' : 'rgba(255, 255, 255, 0)';
            // if shiny, gradient end with yellow bright else normal gradient to white
            const background_color_end = is_shiny ? 'rgba(255, 255, 0, 1)' : 'rgba(255, 255, 255, 1)';

            let gradient = ctx.createLinearGradient(
                line.startPoint.x * width, 
                line.startPoint.y * height, 
                line.endPoint.x * width, 
                line.endPoint.y * height);
            gradient.addColorStop(0, background_color_start);
            gradient.addColorStop(1, background_color_end);
            
            ctx.strokeStyle = gradient;
            ctx.lineWidth = 3; // L'épaisseur générale de tes lignes
            ctx.lineCap = "round";
            
            ctx.beginPath();
            ctx.moveTo(line.startPoint.x*width, line.startPoint.y*height);
            ctx.lineTo(line.endPoint.x*width, line.endPoint.y*height);
            ctx.stroke();   
        
        }

        
        ctx.restore(); 

    }



    projectLineOfSight(A, B, targetY) {
    // Sécurité : éviter la division par zéro si A et B ont le même Y
    if (B.y === A.y) {
        return { x: B.x, y: targetY };
    }

    // Calcul de la pente inverse (le ratio de décalage horizontal par pixel vertical)
    const slopeX = (B.x - A.x) / (B.y - A.y);

    // Calcul du nouveau X
    const targetX = B.x + (targetY - B.y) * slopeX;

    return {
        x: targetX,
        y: targetY
    };
}

}  

