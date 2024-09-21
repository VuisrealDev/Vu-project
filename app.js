const exp = require("constants");
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

var players = [];

//Lets create a function which will help us to create multiple players
function newPlayer() {
  this.name;
  this.id = 1;
  this.x = Math.random() * 500;
  this.y = Math.random() * 500;
  
  //Random colors
  var r = (Math.random() * 255) >> 0;
  var g = (Math.random() * 255) >> 0;
  var b = (Math.random() * 255) >> 0;
  this.color = "rgba(" + r + ", " + g + ", " + b + ", 0.5)";

  //Random size
  this.radius = Math.random() * 15 + 15;
  this.speed = 5;

  return {
    name: this.name,
    x: this.x,
    y: this.y,
    color: this.color,
    radius: this.radius,
    speed: this.speed,
  };
}

const io = require('socket.io')(serv, {})

//calls to the server and tracking connection of each new user
io.sockets.on("connection", function (socket) {
  var currentPlayer = new newPlayer(); //new player made
  players.push(currentPlayer); //push player object into array

  //create the players Array
  socket.broadcast.emit("currentUsers", players);
  socket.emit("welcome", currentPlayer, players);

  //disconnected
  socket.on("disconnect", function () {
    players.splice(players.indexOf(currentPlayer), 1);
    socket.broadcast.emit("playerLeft", players);
  });

  socket.on("pressed", function (key) {
    if (key === 'keyW') {
      currentPlayer.y -= currentPlayer.speed;
      socket.emit("PlayersMoving", players);
      socket.broadcast.emit("PlayersMoving", players);
    }
    if (key === 'keyS') {
      currentPlayer.y += currentPlayer.speed;
      socket.emit("PlayersMoving", players);
      socket.broadcast.emit("PlayersMoving", players);
    }
    if (key === 'keyA') {
      currentPlayer.x -= currentPlayer.speed;
      socket.emit("PlayersMoving", players);
      socket.broadcast.emit("PlayersMoving", players);
    }
    if (key === 'keyD') {
      currentPlayer.x += currentPlayer.speed;
      socket.emit("PlayersMoving", players);
      socket.broadcast.emit("PlayersMoving", players);
    }
  });
});

serv.listen(2000, function () {
  console.log("Server started at port*: 2000");
});
