const fs = require("fs");
const { createCanvas } = require("canvas");

function createPlayerSprite(colorShirt, colorPants, colorHair) {
	const canvas = createCanvas(16, 24);
	const ctx = canvas.getContext("2d");

	// Head
	ctx.fillStyle = colorHair;
	ctx.fillRect(4, 0, 8, 8);

	// Body
	ctx.fillStyle = colorShirt;
	ctx.fillRect(2, 8, 12, 12);

	// Legs
	ctx.fillStyle = colorPants;
	ctx.fillRect(0, 20, 4, 4); // Left leg
	ctx.fillRect(12, 20, 4, 4); // Right leg

	return canvas.toBuffer("image/png");
}

// Define avatars
const avatars = [
	{ name: "working_man", shirt: "#2196F3", pants: "#000000", hair: "#663300" },
	{ name: "working_woman", shirt: "#E91E63", pants: "#000000", hair: "#330000" },
	{ name: "student", shirt: "#FFFFFF", pants: "#BBBBBB", hair: "#222222" },
];

// Generate and save avatars
avatars.forEach(({ name, shirt, pants, hair }) => {
	const buffer = createPlayerSprite(shirt, pants, hair);
	fs.writeFileSync(`public/assets/${name}.png`, buffer);
});

console.log("Avatars generated successfully!");
