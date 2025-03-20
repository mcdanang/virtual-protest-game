const fs = require("fs");
const { createCanvas } = require("canvas");

// Create ground tile
const groundCanvas = createCanvas(32, 32);
const groundCtx = groundCanvas.getContext("2d");
groundCtx.fillStyle = "#4CAF50"; // Green color for grass
groundCtx.fillRect(0, 0, 32, 32);
groundCtx.strokeStyle = "#388E3C";
groundCtx.strokeRect(0, 0, 32, 32);

// Create player sprite
const playerCanvas = createCanvas(16, 24);
const playerCtx = playerCanvas.getContext("2d");
playerCtx.fillStyle = "#2196F3"; // Blue color for player
playerCtx.fillRect(4, 0, 8, 8); // Head
playerCtx.fillRect(2, 8, 12, 12); // Body
playerCtx.fillRect(0, 20, 4, 4); // Left leg
playerCtx.fillRect(12, 20, 4, 4); // Right leg

// Create building sprite
const buildingCanvas = createCanvas(64, 96);
const buildingCtx = buildingCanvas.getContext("2d");
buildingCtx.fillStyle = "#9E9E9E"; // Grey color for building
buildingCtx.fillRect(0, 0, 64, 96);
buildingCtx.fillStyle = "#FFFFFF";
buildingCtx.fillRect(8, 8, 16, 16); // Window 1
buildingCtx.fillRect(40, 8, 16, 16); // Window 2
buildingCtx.fillRect(8, 32, 16, 16); // Window 3
buildingCtx.fillRect(40, 32, 16, 16); // Window 4

// Save the images
const groundBuffer = groundCanvas.toBuffer("image/png");
const playerBuffer = playerCanvas.toBuffer("image/png");
const buildingBuffer = buildingCanvas.toBuffer("image/png");

fs.writeFileSync("public/assets/ground.png", groundBuffer);
fs.writeFileSync("public/assets/player.png", playerBuffer);
fs.writeFileSync("public/assets/building.png", buildingBuffer);

console.log("Assets generated successfully!");
