const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});
const path = require("path");

app.use(express.static(path.join(__dirname, "../public")));

io.on("connection", (socket) => {
  console.log("User connected");

  // Store username & socketId
  socket.on("new-user", (username) => {
    socket.username = username;
    socket.broadcast.emit("user-joined", username);
  });

  // Receive message + broadcast to all
  socket.on("chat-message", (msg) => {
    io.emit("chat-message", {
      username: socket.username,
      message: msg,
      time: new Date().toLocaleTimeString()
    });
  });

  // 🔥 Seen / Delivered feature
  socket.on("message-seen", (sender) => {
    socket.broadcast.emit("seen-confirmation", {
      seenBy: socket.username,
      sender: sender
    });
  });

  // 🔥 Typing indicator feature
  socket.on("typing", () => {
    socket.broadcast.emit("show-typing", socket.username);
  });

  socket.on("stop-typing", () => {
    socket.broadcast.emit("hide-typing");
  });

  // User disconnected
  socket.on("disconnect", () => {
    if (socket.username) {
      io.emit("user-left", socket.username);
    }
  });
});

http.listen(3000, () => {
  console.log("Server running: http://localhost:3000");
});
