// modules
const http = require("http");
const path = require("path");
const express = require("express");
const socketIO = require("socket.io");

// classes
const Game = require("./game/Game");

const FRAME_TIME = Math.floor(1000 / 60);

var app = express();
var server = http.Server(app);
var io = socketIO(server, { pingInterval: 1000 });
let game = new Game(io); // initialize game

app.use("/img", express.static(__dirname + "/img"));
app.use("/build", express.static(__dirname + "/build"));

// Routing
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "./views/index.html"));
});

io.on("connection", function (socket) {
  socket.on("userConnected", function (data) {
    io.emit("userConnected", data);
  });
  socket.on('sendChat', function(data) {
    io.emit('sendChat', data)
  })
});

// GAME CLOCK
setInterval(function () {
  if (game) {
    game.update();
    game.sendState();
  }
}, FRAME_TIME);

// Start the server
server.listen(2000, () => console.log(`Listening on port: 2000`));
