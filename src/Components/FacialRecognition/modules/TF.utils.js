import * as posenet from "@tensorflow-models/posenet";
// import * as tf from "@tensorflow/tfjs";

const color = "aqua";
const lineWidth = 2;
const boundingBoxColor = "red";

export const isAndroid = () => {
    return /Android/i.test(navigator.userAgent);
};

export const isiOS = () => {
    return /iPhone|iPad|iPod/i.test(navigator.userAgent);
};

export const isMobile = () => {
    return isAndroid() || isiOS();
};

export const toTuple = ({ y, x }) => {
    return [y, x];
};

export const drawKeypoints = (keypoints, minConfidence, ctx, scale = 1) => {
    for (let i = 0; i < keypoints.length; i++) {
        const keypoint = keypoints[i];

        if (keypoint.score < minConfidence) {
            continue;
        }

        const { y, x } = keypoint.position;
        drawPoint(ctx, y * scale, x * scale, 3, color);
    }
};

export const drawPoint = (ctx, y, x, r, color) => {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, 2 * Math.PI);
    ctx.fillStyle = color;
    ctx.fill();
};

export const drawPath = (ctx, points, closePath) => {
    ctx.strokeStyle = color;
    const region = new Path2D();
    region.moveTo(points[0][0], points[0][1]);
    for (let i = 1; i < points.length; i++) {
        const point = points[i];
        region.lineTo(point[0], point[1]);
    }

    if (closePath) {
        region.closePath();
    }
    ctx.stroke(region);
};

export const drawSegment = ([ay, ax], [by, bx], color, scale, ctx) => {
    ctx.beginPath();
    ctx.moveTo(ax * scale, ay * scale);
    ctx.lineTo(bx * scale, by * scale);
    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = color;
    ctx.stroke();
};

export const drawSkeleton = (keypoints, minConfidence, ctx, scale = 1) => {
    const adjacentKeyPoints = posenet.getAdjacentKeyPoints(keypoints, minConfidence);

    adjacentKeyPoints.forEach((keypoints) => {
        drawSegment(toTuple(keypoints[0].position), toTuple(keypoints[1].position), color, scale, ctx);
    });
};

export const drawBoundingBox = (keypoints, ctx) => {
    const boundingBox = posenet.getBoundingBox(keypoints);

    ctx.rect(boundingBox.minX, boundingBox.minY, boundingBox.maxX - boundingBox.minX, boundingBox.maxY - boundingBox.minY);

    ctx.strokeStyle = boundingBoxColor;
    ctx.stroke();
};
