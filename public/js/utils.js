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
    let delta = Math.trunc((b-a) * t);
    return a + delta; 
}




export class PerspectiveEngine {
    constructor(originPoint, topLeftPoint, topRightPoint, bottomLeftPoint, bottomRightPoint) {
        this.origin = originPoint;
        this.lines = [];
        //this.lines.push(new Line(originPoint, topLeftPoint));
        //this.lines.push(new Line(originPoint, topRightPoint));
        this.lines.push(new Line(originPoint, bottomLeftPoint));
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

    drawPerspectives(ctx) {
         let width = ctx.canvas.width;
         let height = ctx.canvas.height;

        for (let line of this.lines) {
            let gradient = ctx.createLinearGradient(
                line.startPoint.x * width, 
                line.startPoint.y * height, 
                line.endPoint.x * width, 
                line.endPoint.y * height);
            gradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
            gradient.addColorStop(1, 'rgba(255, 255, 255, 1)');
            
            ctx.strokeStyle = gradient;
            ctx.lineWidth = 3; // L'épaisseur générale de tes lignes
            ctx.lineCap = "round";
            
            ctx.beginPath();
            ctx.moveTo(line.startPoint.x*width, line.startPoint.y*height);
            ctx.lineTo(line.endPoint.x*width, line.endPoint.y*height);
            ctx.stroke();   
        
        }

    }
}  