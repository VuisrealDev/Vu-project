const express = require("express");
const app = express();

// socket.io setup
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server, { pingInterval: 2000, pingTimeout: 5000 });

const port = 3000;

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/view/index.html");
});

const SOCKET_LIST = {};

io.on("connection", (socket) => {
  SOCKET_LIST[socket.id] = socket;

  socket.on("userConnected", function (data) {
    io.emit("userConnected", data);
    console.log("User connected.");
  });

  socket.on("sendChat", function (data) {
    io.emit("sendChat", data);
  });

  socket.on("disconnect", () => {
    delete SOCKET_LIST[socket.id];
  });
});

server.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
