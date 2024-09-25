const { deepEqual } = require("assert");
const exp = require("constants");
const { setFips } = require("crypto");
const express = require("express");
const { platform } = require("os");
const { sourceMapsEnabled } = require("process");
const app = express();
const serv = require("http").Server(app);

app.get("/", function (req, res) {
  res.sendFile(__dirname + "/index.html");
});

app.use(express.static(__dirname));

const SOCKET_LIST = {};
let players = {};

const io = require("socket.io")(serv, {});

io.sockets.on("connection", function (socket) {
  socket.id = Math.random();

  SOCKET_LIST[socket.id] = socket;

  socket.on("userConnected", function (data) {
    io.emit("userConnected", data);
    console.log("User connected.");
  });

  socket.on("sendChat", function (data) {
    io.emit("sendChat", data);
  });

  players[socket.id] = {
    x: Math.random() * 800,
    y: Math.random() * 600,
  };

  socket.on("currentPlayers", function(player) {
    io.emit('currentPlayers', player)
  });

  socket.on("newPlayer", function(data) {
    io.emit('newPlayer', { id: socket.id, ...players[socket.id] })
  });

  socket.on("playerMovement", (movementData) => {
    if (players[socket.id]) {
      players[socket.id].x += movementData.x;
      players[socket.id].y += movementData.y;
      socket.broadcast.emit("playerMoved", {
        id: socket.id,
        ...players[socket.id],
      });
    }
  });

  socket.on("disconnect", () => {
    delete players[socket.id];
    io.emit("disconnected", socket.id);
  });
});

serv.listen(2000, function () {
  console.log("Server started at port*: 2000");
});
