import { path } from "ghost-cursor";
import { Vector } from "ghost-cursor/lib/math";

function buildPath(
  startingPoint: Vector,
  endPoint: Vector,
  route: Vector[] = []
) {
  const currentPoint =
    route.length === 0 ? startingPoint : route[route.length - 1];
  const remainingPoints = 50 - route.length;

  if (remainingPoints <= 0) {
    route.push(endPoint);
    return route;
  }

  const intermediatePoint = {
    x: currentPoint.x + (endPoint.x - startingPoint.x) / 50,
    y: currentPoint.y + (endPoint.y - startingPoint.y) / 50,
  };

  route.push(intermediatePoint);

  if (remainingPoints > 1) {
    // Generate a random endpoint for the remaining points
    const randomEndPoint = {
      x: Math.random() * 1000, // Adjust the range as needed
      y: Math.random() * 1000,
    };
    return buildPath(intermediatePoint, randomEndPoint, route);
  } else {
    return buildPath(intermediatePoint, endPoint, route);
  }
}

const startingPoint = { x: 100, y: 100 };
const endPoint = { x: 600, y: 700 };
const mousePath = buildPath(startingPoint, endPoint);

console.log(mousePath);
