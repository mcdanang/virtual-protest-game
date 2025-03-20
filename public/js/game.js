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

function startGame() {
	username = document.getElementById("username").value.trim();
	if (!username) {
		alert("Please enter a username");
		return;
	}
	document.getElementById("username-modal").style.display = "none";
	game = new Phaser.Game(config);
}

function preload() {
	// Load game assets
	this.load.image("ground", "assets/ground.png");
	this.load.image("player", "assets/player.png");
	this.load.image("building", "assets/building.png");
}

function create() {
	// Initialize socket connection
	socket = io();

	// Create tiled ground
	for (let x = 0; x < 832; x += 32) {
		for (let y = 0; y < 632; y += 32) {
			this.add.image(x, y, "ground");
		}
	}

	// Create building
	this.add.image(400, 100, "building");

	// Create player
	player = this.add.sprite(400, 300, "player");
	player.setScale(2);

	// Add username text above player
	player.usernameText = this.add.text(player.x, player.y - 35, username, {
		font: "14px Arial",
		color: "#000000",
		backgroundColor: "#ffffff",
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
		avatar: "player",
	});

	socket.on("playerList", players => {
		players.forEach(playerInfo => {
			if (playerInfo.id !== socket.id) {
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
	// Player movement
	const speed = 4;
	let moved = false;
	let newX = player.x;
	let newY = player.y;

	if (cursors.left.isDown) {
		newX -= speed;
		moved = true;
	}
	if (cursors.right.isDown) {
		newX += speed;
		moved = true;
	}
	if (cursors.up.isDown) {
		newY -= speed;
		moved = true;
	}
	if (cursors.down.isDown) {
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
	const otherPlayer = scene.add.sprite(playerInfo.x, playerInfo.y, "player");
	otherPlayer.setScale(2);

	// Add username text above other players
	otherPlayer.usernameText = scene.add.text(playerInfo.x, playerInfo.y - 35, playerInfo.username, {
		font: "14px Arial",
		color: "#000000",
		backgroundColor: "#ffffff",
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

	// Create new bubble
	const bubble = scene.add.text(
		targetX,
		targetY - 50, // Position above player
		`${messageData.message}`,
		{
			font: "16px Arial",
			color: "#000000",
			backgroundColor: "#ffffff",
			padding: { x: 10, y: 5 },
			fixedWidth: 200,
			align: "center",
		}
	);

	// Center the bubble above player
	bubble.setOrigin(0.5, 1);
	bubble.setDepth(1000);

	// Store bubble reference
	scene.chatBubbles[messageData.id] = bubble;

	// Update bubble position when player moves
	const updateBubblePosition = playerInfo => {
		if (playerInfo.id === messageData.id && scene.chatBubbles[messageData.id]) {
			const bubbleX = playerInfo.id === socket.id ? player.x : otherPlayers.get(playerInfo.id).x;
			const bubbleY = playerInfo.id === socket.id ? player.y : otherPlayers.get(playerInfo.id).y;
			scene.chatBubbles[messageData.id].setPosition(bubbleX, bubbleY - 50);
		}
	};

	// Listen for player movement
	socket.on("playerMoved", updateBubblePosition);

	// Remove bubble after 5 seconds
	scene.time.delayedCall(5000, () => {
		if (scene.chatBubbles[messageData.id]) {
			scene.chatBubbles[messageData.id].destroy();
			delete scene.chatBubbles[messageData.id];
			socket.off("playerMoved", updateBubblePosition);
		}
	});
}
