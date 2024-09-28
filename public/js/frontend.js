const canvas = document.querySelector("canvas");
const c = canvas.getContext("2d");

const socket = io();

var chatBody = document.querySelector(".chat-body");
var chatContent = document.querySelector(".chat-content");

var inpName = document.querySelector("#usernameInput");
var btnSubmitName = document.querySelector("#btn-submit-name");

var inpChat = document.querySelector("#input-chat");
var btnChat = document.querySelector(".btn-chat");

var actChat = document.querySelector(".active-chat-of-btn1");

var btnChatActived = true;
var typedName = false

canvas.width = innerWidth;
canvas.height = innerHeight;

actChat.addEventListener("click", (e) => {
  if (btnChatActived) {
    chatBody.style.display = "none";
    btnChatActived = false;
  } else {
    chatBody.style.display = "block";
    btnChatActived = true;
  }
});

inpName.addEventListener("keydown", (e) => {
  if (e.code == "Enter" && inpName.value != '' && inpName.value != ' ' && inpName.value) {
    socket.emit("userConnected", { username: inpName.value });
  }
});

function do_send_chat() {
  socket.emit("sendChat", { username: inpName.value, message: inpChat.value });
}

inpChat.addEventListener("keydown", (e) => {
  if (e.code == "Enter" && inpChat.value) {
    do_send_chat();
    inpChat.value = "";
  }
});

btnChat.addEventListener("click", () => {
  do_send_chat();
  inpChat.value = "";
});

socket.on("userConnected", function (data) {
  let item = document.createElement("div");
  let sender = document.createElement("div");
  let message = document.createElement("div");

  item.classList.add("chat-item");
  sender.classList.add("chat-sender");
  message.classList.add("chat-message");

  sender.innerText = "VUISREAL (real)";
  message.textContent = "Tài khoản " + data.username + " vừa đăng nhập";

  sender.style.color = "red";

  item.append(sender);
  item.append(message);

  chatContent.appendChild(item);
});

socket.on("sendChat", function (data) {
  let item = document.createElement("div");
  let sender = document.createElement("div");
  let message = document.createElement("div");

  item.classList.add("chat-item");
  sender.classList.add("chat-sender");
  message.classList.add("chat-message");

  sender.innerText = data.username;
  message.innerHTML = data.message;

  item.append(sender);
  item.append(message);

  let text = "" + data.message;

  chatContent.appendChild(item);
});

const scoreEl = document.querySelector("#scoreEl");

const devicePixelRatio = window.devicePixelRatio || 1;

canvas.width = 1024 * devicePixelRatio;
canvas.height = 576 * devicePixelRatio;

c.scale(devicePixelRatio, devicePixelRatio);

const x = canvas.width / 2;
const y = canvas.height / 2;

const frontEndPlayers = {};
const frontEndProjectiles = {};

socket.on("updateProjectiles", (backEndProjectiles) => {
  for (const id in backEndProjectiles) {
    const backEndProjectile = backEndProjectiles[id];

    if (!frontEndProjectiles[id]) {
      frontEndProjectiles[id] = new Projectile({
        x: backEndProjectile.x,
        y: backEndProjectile.y,
        radius: 5,
        color: frontEndPlayers[backEndProjectile.playerId]?.color,
        velocity: backEndProjectile.velocity,
      });
    } else {
      frontEndProjectiles[id].x += backEndProjectiles[id].velocity.x;
      frontEndProjectiles[id].y += backEndProjectiles[id].velocity.y;
    }
  }

  for (const frontEndProjectileId in frontEndProjectiles) {
    if (!backEndProjectiles[frontEndProjectileId]) {
      delete frontEndProjectiles[frontEndProjectileId];
    }
  }
});

socket.on("updatePlayers", (backEndPlayers) => {
  for (const id in backEndPlayers) {
    const backEndPlayer = backEndPlayers[id];

    if (!frontEndPlayers[id]) {
      frontEndPlayers[id] = new Player({
        x: backEndPlayer.x,
        y: backEndPlayer.y,
        radius: 10,
        color: backEndPlayer.color,
        username: backEndPlayer.username,
      });

      document.querySelector(
        "#playerLabels"
      ).innerHTML += `<div data-id="${id}" data-score="${backEndPlayer.score}">${backEndPlayer.username}: ${backEndPlayer.score}</div>`;
    } else {
      document.querySelector(
        `div[data-id="${id}"]`
      ).innerHTML = `${backEndPlayer.username}: ${backEndPlayer.score}`;

      document
        .querySelector(`div[data-id="${id}"]`)
        .setAttribute("data-score", backEndPlayer.score);

      // sorts the players divs
      const parentDiv = document.querySelector("#playerLabels");
      const childDivs = Array.from(parentDiv.querySelectorAll("div"));

      childDivs.sort((a, b) => {
        const scoreA = Number(a.getAttribute("data-score"));
        const scoreB = Number(b.getAttribute("data-score"));

        return scoreB - scoreA;
      });

      // removes old elements
      childDivs.forEach((div) => {
        parentDiv.removeChild(div);
      });

      // adds sorted elements
      childDivs.forEach((div) => {
        parentDiv.appendChild(div);
      });

      frontEndPlayers[id].target = {
        x: backEndPlayer.x,
        y: backEndPlayer.y,
      };

      if (id === socket.id) {
        const lastBackendInputIndex = playerInputs.findIndex((input) => {
          return backEndPlayer.sequenceNumber === input.sequenceNumber;
        });

        if (lastBackendInputIndex > -1)
          playerInputs.splice(0, lastBackendInputIndex + 1);

        playerInputs.forEach((input) => {
          frontEndPlayers[id].target.x += input.dx;
          frontEndPlayers[id].target.y += input.dy;
        });
      }
    }
  }

  // this is where we delete frontend players
  for (const id in frontEndPlayers) {
    if (!backEndPlayers[id]) {
      const divToDelete = document.querySelector(`div[data-id="${id}"]`);
      divToDelete.parentNode.removeChild(divToDelete);

      if (id === socket.id) {
        document.querySelector("#usernameForm").style.display = "block";
      }

      delete frontEndPlayers[id];
    }
  }
});

let animationId;
function animate() {
  animationId = requestAnimationFrame(animate);
  // c.fillStyle = 'rgba(0, 0, 0, 0.1)'
  c.clearRect(0, 0, canvas.width, canvas.height);

  for (const id in frontEndPlayers) {
    const frontEndPlayer = frontEndPlayers[id];

    // linear interpolation
    if (frontEndPlayer.target) {
      frontEndPlayers[id].x +=
        (frontEndPlayers[id].target.x - frontEndPlayers[id].x) * 0.5;
      frontEndPlayers[id].y +=
        (frontEndPlayers[id].target.y - frontEndPlayers[id].y) * 0.5;
    }

    frontEndPlayer.draw();
  }

  for (const id in frontEndProjectiles) {
    const frontEndProjectile = frontEndProjectiles[id];
    frontEndProjectile.draw();
  }

  // for (let i = frontEndProjectiles.length - 1; i >= 0; i--) {
  //   const frontEndProjectile = frontEndProjectiles[i]
  //   frontEndProjectile.update()
  // }
}

animate();

const keys = {
  w: {
    pressed: false,
  },
  a: {
    pressed: false,
  },
  s: {
    pressed: false,
  },
  d: {
    pressed: false,
  },
};

const SPEED = 5;
const playerInputs = [];
let sequenceNumber = 0;
setInterval(() => {
  if (keys.w.pressed) {
    sequenceNumber++;
    playerInputs.push({ sequenceNumber, dx: 0, dy: -SPEED });
    // frontEndPlayers[socket.id].y -= SPEED
    socket.emit("keydown", { keycode: "KeyW", sequenceNumber });
  }

  if (keys.a.pressed) {
    sequenceNumber++;
    playerInputs.push({ sequenceNumber, dx: -SPEED, dy: 0 });
    // frontEndPlayers[socket.id].x -= SPEED
    socket.emit("keydown", { keycode: "KeyA", sequenceNumber });
  }

  if (keys.s.pressed) {
    sequenceNumber++;
    playerInputs.push({ sequenceNumber, dx: 0, dy: SPEED });
    // frontEndPlayers[socket.id].y += SPEED
    socket.emit("keydown", { keycode: "KeyS", sequenceNumber });
  }

  if (keys.d.pressed) {
    sequenceNumber++;
    playerInputs.push({ sequenceNumber, dx: SPEED, dy: 0 });
    // frontEndPlayers[socket.id].x += SPEED
    socket.emit("keydown", { keycode: "KeyD", sequenceNumber });
  }
}, 15);

document.addEventListener("keydown", (event) => {
  if (!frontEndPlayers[socket.id]) return;

  switch (event.code) {
    case "KeyW":
      keys.w.pressed = true;
      break;

    case "KeyA":
      keys.a.pressed = true;
      break;

    case "KeyS":
      keys.s.pressed = true;
      break;

    case "KeyD":
      keys.d.pressed = true;
      break;
  }
});

document.addEventListener("keyup", (event) => {
  if (!frontEndPlayers[socket.id]) return;

  switch (event.code) {
    case "KeyW":
      keys.w.pressed = false;
      break;

    case "KeyA":
      keys.a.pressed = false;
      break;

    case "KeyS":
      keys.s.pressed = false;
      break;

    case "KeyD":
      keys.d.pressed = false;
      break;
  }
});

document.querySelector("#usernameForm").addEventListener("submit", (event) => {
  event.preventDefault();
  document.querySelector("#usernameForm").style.display = "none";
  socket.emit("initGame", {
    width: canvas.width,
    height: canvas.height,
    devicePixelRatio,
    username: document.querySelector("#usernameInput").value,
  });
});
