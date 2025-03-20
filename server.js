const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);

// Serve static files from the public directory
app.use(express.static("public"));

// Store connected players
const players = new Map();

io.on("connection", socket => {
	console.log("A player connected");

	// Handle new player joining
	socket.on("newPlayer", playerData => {
		players.set(socket.id, {
			id: socket.id,
			x: playerData.x,
			y: playerData.y,
			username: playerData.username,
			avatar: playerData.avatar,
		});
		io.emit("playerList", Array.from(players.values()));
	});

	// Handle player movement
	socket.on("playerMove", movementData => {
		const player = players.get(socket.id);
		if (player) {
			player.x = movementData.x;
			player.y = movementData.y;
			io.emit("playerMoved", player);
		}
	});

	// Handle chat messages
	socket.on("chatMessage", messageData => {
		const player = players.get(socket.id);
		if (player) {
			io.emit("newMessage", {
				id: socket.id,
				username: player.username,
				message: messageData.message,
				x: player.x,
				y: player.y,
			});
		}
	});

	// Handle player disconnection
	socket.on("disconnect", () => {
		console.log("A player disconnected");
		players.delete(socket.id);
		io.emit("playerList", Array.from(players.values()));
	});
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`);
});
