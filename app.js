const express = require("express");
const app = express();

// socket.io setup
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server, {});

const port = 3000;

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/view/index.html");
});

let users = new Set();
let sockets = {};

const SOCKET_LIST = {};

io.on("connection", (socket) => {
  // SOCKET_LIST[socket.id] = socket;
  // socket.on("userConnected", function (data) {
  //   io.emit("userConnected", data);
  //   console.log("User connected.");
  // });
  // socket.on("sendChat", function (data) {
  //   io.emit("sendChat", data);
  // });
  console.log("A user connected");

  socket.on("user online", (username) => {
    users.add(username);
    sockets[username] = socket; // Store the socket by username
    socket.username = username; // Store the username in the socket object
    socket.emit("current user online", username);
    socket.broadcast.emit("user online", username);
    updateUserCount();
  });

  socket.on("set admin", (password) => {
    const secretPassword = "1234"; // Change this to your desired password
    if (password === secretPassword) {
      socket.isAdmin = true; // Mark the socket as admin
      socket.emit("admin status", true);
    } else {
      socket.emit("admin status", false);
    }
  });

  socket.on("chat message", ({ username, msg }) => {
    if (socket.isAdmin) {
      io.emit("chat message", { username: username, msg, isAdmin: true });
    } else {
      io.emit("chat message", { username, msg });
    }
  });

  socket.on("kick user", (username) => {
    if (socket.isAdmin) {
      const userSocket = sockets[username]; // Get the socket for the username
      if (userSocket) {
        userSocket.emit("kicked"); // Emit a kick event to the user
        userSocket.disconnect(true); // Disconnect the user
      }
      socket.broadcast.emit("user kicked", username);
      users.delete(username); // Remove user from the set
      delete sockets[username]; // Remove user socket
      updateUserCount();
    }
  });

  socket.on("disconnect", () => {
    if (socket.username) {
      users.delete(socket.username); // Remove user from the set
      delete sockets[socket.username]; // Remove user socket
      socket.broadcast.emit("user offline", socket.username);
      updateUserCount();
    }
    console.log("User disconnected");
  });

  function updateUserCount() {
    io.emit("user count", users.size);
  }
});

server.listen(port, () => {
  console.log(`Server running at port: ${port}`);
});
