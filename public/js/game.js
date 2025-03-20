let socket;
let game;
let player;
let otherPlayers = new Map();
let cursors;
let chatInput;
let username;

const config = {
	type: Phaser.AUTO,
	width: 800,
	height: 600,
	parent: "game-container",
	physics: {
		default: "arcade",
		arcade: {
			gravity: { y: 0 },
			debug: false,
		},
	},
	scene: {
		preload: preload,
		create: create,
		update: update,
	},
};

document.addEventListener("DOMContentLoaded", function () {
	const savedUsername = localStorage.getItem("username");
	if (savedUsername) {
		document.getElementById("username").value = savedUsername;
	}

	// Add touch control event listeners outside of Phaser
	setupTouchControls();
});

function setupTouchControls() {
	document.getElementById("up").addEventListener("touchstart", e => {
		e.preventDefault();
		touchControls.up = true;
	});
	document.getElementById("up").addEventListener("touchend", e => {
		e.preventDefault();
		touchControls.up = false;
	});

	document.getElementById("down").addEventListener("touchstart", e => {
		e.preventDefault();
		touchControls.down = true;
	});
	document.getElementById("down").addEventListener("touchend", e => {
		e.preventDefault();
		touchControls.down = false;
	});

	document.getElementById("left").addEventListener("touchstart", e => {
		e.preventDefault();
		touchControls.left = true;
	});
	document.getElementById("left").addEventListener("touchend", e => {
		e.preventDefault();
		touchControls.left = false;
	});

	document.getElementById("right").addEventListener("touchstart", e => {
		e.preventDefault();
		touchControls.right = true;
	});
	document.getElementById("right").addEventListener("touchend", e => {
		e.preventDefault();
		touchControls.right = false;
	});
}

// Touch controls state
const touchControls = {
	up: false,
	down: false,
	left: false,
	right: false,
};

document.getElementById("username").addEventListener("keypress", function (event) {
	if (event.key === "Enter") {
		startGame();
	}
});

function startGame() {
	username = document.getElementById("username").value.trim();
	if (!username) {
		alert("Please enter a username");
		return;
	}

	// Save username to localStorage
	localStorage.setItem("username", username);

	document.getElementById("username-modal").style.display = "none";
	document.getElementById("chat-input").style.display = "block";

	game = new Phaser.Game(config);
}

function preload() {
	// Load game assets
	this.load.image("ground", "assets/ground.png");
	this.load.image("road", "assets/road.png");
	this.load.image("workingMan", "assets/working_man.png");
	this.load.image("workingWoman", "assets/working_woman.png");
	this.load.image("student", "assets/student.png");
	this.load.image("building", "assets/building.png");
}

function create() {
	// Initialize socket connection
	socket = io();
	const xRoadPosition = [352, 384, 416, 448];
	const yRoadPosition = [0, 32, 64, 96, 128, 160];
	// Create tiled ground
	for (let x = 0; x < 832; x += 32) {
		for (let y = 0; y < 632; y += 32) {
			if (xRoadPosition.includes(x) || yRoadPosition.includes(y)) {
				this.add.image(x, y, "road");
			} else {
				this.add.image(x, y, "ground");
			}
		}
	}

	// Create building
	this.add.image(400, 100, "building");

	// Randomly select an avatar
	const avatars = ["workingMan", "workingWoman"];
	const randomAvatar = avatars[Math.floor(Math.random() * avatars.length)];

	// Create player
	player = this.add.sprite(400, 300, randomAvatar);
	player.setScale(2);

	// Add username text above player
	player.usernameText = this.add.text(player.x, player.y - 35, username, {
		font: "14px Arial",
		color: "#000000",
		padding: { x: 5, y: 2 },
	});
	player.usernameText.setOrigin(0.5, 1);
	player.usernameText.setDepth(1000);

	// Setup controls
	cursors = this.input.keyboard.createCursorKeys();

	// Setup chat input
	chatInput = document.getElementById("chat-input");
	chatInput.addEventListener("keydown", e => {
		if (e.key === "Enter" && chatInput.value.trim()) {
			socket.emit("chatMessage", {
				message: chatInput.value.trim(),
			});
			chatInput.value = "";
			chatInput.blur(); // Remove focus from input
		}
		if (e.key === " ") {
			e.stopPropagation(); // Prevent space from triggering other game controls
		}
	});

	// Initialize chat bubbles container
	this.chatBubbles = {};

	// Socket event handlers
	socket.emit("newPlayer", {
		x: player.x,
		y: player.y,
		username: username,
		avatar: "student",
	});

	socket.on("playerList", playersList => {
		// Remove players that are no longer in the list
		otherPlayers.forEach((player, id) => {
			if (!playersList.some(p => p.id === id)) {
				player.destroy(); // Remove sprite
				player.usernameText.destroy(); // Remove username text
				otherPlayers.delete(id); // Remove from map
			}
		});

		// Add new players if they are not already added
		playersList.forEach(playerInfo => {
			if (playerInfo.id !== socket.id && !otherPlayers.has(playerInfo.id)) {
				addOtherPlayer(this, playerInfo);
			}
		});
	});

	socket.on("playerMoved", playerInfo => {
		if (otherPlayers.has(playerInfo.id)) {
			const otherPlayer = otherPlayers.get(playerInfo.id);
			otherPlayer.x = playerInfo.x;
			otherPlayer.y = playerInfo.y;
			// Update username position for other players
			otherPlayer.usernameText.setPosition(playerInfo.x, playerInfo.y - 35);
		}
	});

	socket.on("newMessage", messageData => {
		showChatBubble(this, messageData);
	});
}

function update() {
	if (!player) return;

	// Player movement
	const speed = 4;
	let moved = false;
	let newX = player.x;
	let newY = player.y;

	// Handle keyboard controls
	if (cursors.left.isDown || touchControls.left) {
		newX -= speed;
		moved = true;
	}
	if (cursors.right.isDown || touchControls.right) {
		newX += speed;
		moved = true;
	}
	if (cursors.up.isDown || touchControls.up) {
		newY -= speed;
		moved = true;
	}
	if (cursors.down.isDown || touchControls.down) {
		newY += speed;
		moved = true;
	}

	// Boundary checks
	const playerWidth = player.width * player.scale;
	const playerHeight = player.height * player.scale;

	newX = Phaser.Math.Clamp(newX, playerWidth / 2, 800 - playerWidth / 2);
	newY = Phaser.Math.Clamp(newY, playerHeight / 2, 600 - playerHeight / 2);

	// Update position if within bounds
	player.x = newX;
	player.y = newY;
	// Update username position
	player.usernameText.setPosition(newX, newY - 35);

	// Emit movement to server
	if (moved) {
		socket.emit("playerMove", {
			x: player.x,
			y: player.y,
		});
	}
}

function addOtherPlayer(scene, playerInfo) {
	const otherPlayer = scene.add.sprite(playerInfo.x, playerInfo.y, "student");
	otherPlayer.setScale(2);

	// Add username text above other players
	otherPlayer.usernameText = scene.add.text(playerInfo.x, playerInfo.y - 35, playerInfo.username, {
		font: "14px Arial",
		color: "#000000",
		padding: { x: 5, y: 2 },
	});
	otherPlayer.usernameText.setOrigin(0.5, 1);
	otherPlayer.usernameText.setDepth(1000);

	otherPlayers.set(playerInfo.id, otherPlayer);
}

function showChatBubble(scene, messageData) {
	// Remove existing bubble if any
	if (scene.chatBubbles[messageData.id]) {
		scene.chatBubbles[messageData.id].destroy();
	}

	// Get target player position
	let targetX, targetY;
	if (messageData.id === socket.id) {
		targetX = player.x;
		targetY = player.y;
	} else if (otherPlayers.has(messageData.id)) {
		const otherPlayer = otherPlayers.get(messageData.id);
		targetX = otherPlayer.x;
		targetY = otherPlayer.y;
	} else {
		return; // Player not found
	}

	// Bubble dimensions
	const bubbleWidth = 220;
	const bubbleHeight = 50;
	const cornerRadius = 12;
	const padding = 10;

	// Create a rounded rectangle for the bubble background
	const bubbleBackground = scene.add.graphics();
	bubbleBackground.fillStyle(0xffffff, 1); // White background
	bubbleBackground.fillRoundedRect(0, 0, bubbleWidth, bubbleHeight, cornerRadius);
	bubbleBackground.lineStyle(1, 0x000000, 1); // Black outline
	bubbleBackground.strokeRoundedRect(0, 0, bubbleWidth, bubbleHeight, cornerRadius);

	// Create the text inside the bubble
	const bubbleText = scene.add.text(
		bubbleWidth / 2, // Center horizontally within the bubble
		bubbleHeight / 2, // Center vertically within the bubble
		messageData.message,
		{
			font: "12px Arial",
			color: "#000000",
			wordWrap: { width: bubbleWidth - 2 * padding },
			align: "center",
		}
	);
	bubbleText.setOrigin(0.5, 0.5); // Ensure text is centered inside the bubble

	// Create a container to group background and text together
	const bubble = scene.add.container(targetX - bubbleWidth / 2, targetY - bubbleHeight - 55, [
		bubbleBackground,
		bubbleText,
	]);
	bubble.setDepth(1000);

	// Store bubble reference
	scene.chatBubbles[messageData.id] = bubble;

	// Function to update the bubble position
	const updateBubblePosition = playerInfo => {
		if (playerInfo.id === messageData.id && scene.chatBubbles[messageData.id]) {
			const bubbleX = playerInfo.id === socket.id ? player.x : otherPlayers.get(playerInfo.id).x;
			const bubbleY = playerInfo.id === socket.id ? player.y : otherPlayers.get(playerInfo.id).y;
			scene.chatBubbles[messageData.id].setPosition(
				bubbleX - bubbleWidth / 2,
				bubbleY - bubbleHeight - 55
			);
		}
	};

	// Listen for player movement
	socket.on("playerMoved", updateBubblePosition);

	// // Remove bubble after 5 seconds
	// scene.time.delayedCall(5000, () => {
	// 	if (scene.chatBubbles[messageData.id]) {
	// 		scene.chatBubbles[messageData.id].destroy();
	// 		delete scene.chatBubbles[messageData.id];
	// 		socket.off("playerMoved", updateBubblePosition);
	// 	}
	// });
}
