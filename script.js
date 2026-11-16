
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const W = canvas.width;
const H = canvas.height;
const ground = 375;

let running = false;
let keys = {};
let score = 0;
let ghostLives = 3;
let jasonLives = 3;
let attackCooldown = 0;
let hitCooldown = 0;
let frame = 0;

let trees = [];

const ghost = {
  x: 100, y: ground - 65,
  w: 35, h: 65,
  vx: 0, vy: 0,
  speed: 3.5,
  jump: false,
  facing: 1
};

const jason = {
  x: 700, y: ground - 75,
  w: 43, h: 75,
  vx: 0, vy: 0,
  speed: 1.8,
  facing: -1
};

for (let i = 0; i < 35; i++) {
  trees.push({
    x: i * 170 + Math.random() * 100,
    y: 180 + Math.random() * 90,
    size: 35 + Math.random() * 35
  });
}

function drawForest() {
  ctx.fillStyle = "#101b15";
  ctx.fillRect(0, 0, W, H);

  // Luna
  ctx.fillStyle = "#c8c8a8";
  ctx.beginPath();
  ctx.arc(730, 75, 30, 0, Math.PI * 2);
  ctx.fill();

  // Niebla
  for (let i = 0; i < 8; i++) {
    ctx.fillStyle = "rgba(160,180,160,0.035)";
    ctx.fillRect(
      (i * 130 + frame * 0.3) % W,
      250 + i * 10, 150, 35
    );
  }

  // Árboles
  trees.forEach(t => {
    ctx.fillStyle = "#30251b";
    ctx.fillRect(t.x % W, t.y, 18, 120);

    ctx.fillStyle = "#123d24";
    ctx.beginPath();
    ctx.moveTo(t.x % W - t.size, t.y + 40);
    ctx.lineTo(t.x % W + 9, t.y - t.size);
    ctx.lineTo(t.x % W + t.size + 9, t.y + 40);
    ctx.fill();
  });

  // Suelo
  ctx.fillStyle = "#33291c";
  ctx.fillRect(0, ground, W, H - ground);

  ctx.fillStyle = "#1d3a20";
  ctx.fillRect(0, ground, W, 8);

  ctx.fillStyle = "#526d32";
  for (let i = 0; i < W; i += 25) {
    ctx.fillRect(i, ground + 12, 5, 4);
  }
}

function drawCharacter(p, type) {
  const x = p.x;
  const y = p.y;

  if (type === "ghost") {
    // Cuerpo
    ctx.fillStyle = "#080808";
    ctx.fillRect(x + 7, y + 25, 23, 40);

    // Cabeza
    ctx.fillStyle = "#eeeeee";
    ctx.fillRect(x + 6, y + 1, 25, 30);

    // Capucha
    ctx.fillStyle = "#050505";
    ctx.fillRect(x + 3, y, 31, 8);

    // Ojos
    ctx.fillStyle = "#050505";
    ctx.fillRect(x + 11, y + 11, 6, 9);
    ctx.fillRect(x + 22, y + 11, 6, 9);

    // Boca
    ctx.fillStyle = "#600000";
    ctx.fillRect(x + 16, y + 21, 7, 8);

    // Cuchillo
    ctx.fillStyle = "#bbbbbb";
    ctx.fillRect(
      x + (p.facing === 1 ? 30 : -10),
      y + 32, 16, 5
    );

    // Piernas
    ctx.fillStyle = "#050505";
    ctx.fillRect(x + 8, y + 55, 8, 10);
    ctx.fillRect(x + 21, y + 55, 8, 10);

  } else {
    // Cuerpo de Jason
    ctx.fillStyle = "#34452d";
    ctx.fillRect(x + 5, y + 30, 34, 42);

    // Cabeza
    ctx.fillStyle = "#d5b68c";
    ctx.fillRect(x + 7, y + 3, 29, 29);

    // Máscara
    ctx.fillStyle = "#c9b28c";
    ctx.fillRect(x + 7, y + 7, 29, 24);

    // Ojos
    ctx.fillStyle = "#181818";
    ctx.fillRect(x + 12, y + 14, 5, 5);
    ctx.fillRect(x + 26, y + 14, 5, 5);

    // Marcas
    ctx.fillStyle = "#a00000";
    ctx.fillRect(x + 19, y + 10, 4, 5);
    ctx.fillRect(x + 19, y + 23, 4, 5);

    // Piernas
    ctx.fillStyle = "#171717";
    ctx.fillRect(x + 8, y + 65, 10, 10);
    ctx.fillRect(x + 25, y + 65, 10, 10);
  }
}

function attack() {
  if (attackCooldown > 0) return;

  attackCooldown = 35;

  const dx = Math.abs(
    (ghost.x + ghost.w / 2) -
    (jason.x + jason.w / 2)
  );

  if (dx < 65 && Math.abs(ghost.y - jason.y) < 35) {
    jasonLives--;
    score += 100;

    jason.x += ghost.facing * 45;
    jason.speed = Math.min(jason.speed + 0.7, 5);

    if (jasonLives <= 0) {
      endGame(true);
    }
  }
}

function update() {
  if (!running) return;

  frame++;

  if (attackCooldown > 0) attackCooldown--;
  if (hitCooldown > 0) hitCooldown--;

  // Ghostface
  ghost.vx = 0;

  if (keys["ArrowLeft"] || keys["a"]) {
    ghost.vx = -ghost.speed;
    ghost.facing = -1;
  }

  if (keys["ArrowRight"] || keys["d"]) {
    ghost.vx = ghost.speed;
    ghost.facing = 1;
  }

  ghost.x += ghost.vx;
  ghost.x = Math.max(0, Math.min(W - ghost.w, ghost.x));

  // Salto
  if ((keys["ArrowUp"] || keys["w"]) && !ghost.jump) {
    ghost.vy = -11;
    ghost.jump = true;
  }

  ghost.y += ghost.vy;
  ghost.vy += 0.55;

  if (ghost.y + ghost.h >= ground) {
    ghost.y = ground - ghost.h;
    ghost.vy = 0;
    ghost.jump = false;
  }

  // Inteligencia artificial de Jason
  const distance = ghost.x - jason.x;

  if (Math.abs(distance) < 330) {
    jason.vx = distance > 0
      ? -jason.speed
      : jason.speed;
  } else {
    jason.vx = Math.sin(frame / 50) * jason.speed;
  }

  if (Math.random() < 0.012) {
    jason.vy = -7;
  }

  jason.x += jason.vx;
  jason.y += jason.vy || 0;
  jason.vy = (jason.vy || 0) + 0.5;

  if (jason.y + 75 >= ground) {
    jason.y = ground - 75;
    jason.vy = 0;
  }

  jason.x = Math.max(0, Math.min(W - jason.w, jason.x));

  // Contraataque de Jason
  const close = Math.abs(ghost.x - jason.x) < 38;

  if (close && hitCooldown <= 0 &&
      !ghost.jump && !jason.vy) {
    ghostLives--;
    hitCooldown = 90;
    ghost.x -= ghost.facing * 45;

    if (ghostLives <= 0) {
      endGame(false);
    }
  }

  document.getElementById("ghostLives").textContent = ghostLives;
  document.getElementById("jasonLives").textContent = jasonLives;
  document.getElementById("score").textContent = score;
}

function draw() {
  drawForest();

  drawCharacter(ghost, "ghost");
  drawCharacter(jason, "jason");

  const gradient = ctx.createRadialGradient(
    W / 2, H / 2, 100,
    W / 2, H / 2, 550
  );

  gradient.addColorStop(0, "rgba(0,0,0,0)");
  gradient.addColorStop(1, "rgba(0,0,0,0.65)");

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, W, H);
}

function loop() {
  update();
  draw();

  if (running) {
    requestAnimationFrame(loop);
  }
}

function startGame() {
  score = 0;
  ghostLives = 3;
  jasonLives = 3;
  attackCooldown = 0;
  hitCooldown = 0;
  frame = 0;

  Object.assign(ghost, {
    x: 100,
    y: ground - 65,
    vx: 0,
    vy: 0,
    speed: 3.5,
    jump: false,
    facing: 1
  });

  Object.assign(jason, {
    x: 700,
    y: ground - 75,
    vx: 0,
    vy: 0,
    speed: 1.8,
    facing: -1
  });

  document.getElementById("menu").classList.add("hidden");
  document.getElementById("message").classList.add("hidden");

  running = true;
  loop();
}

function endGame(win) {
  running = false;

  document.getElementById("result").textContent =
    win ? "¡GHOSTFACE GANA!" : "¡JASON GANA!";

  document.getElementById("finalScore").textContent =
    "Puntuación final: " + score;

  document.getElementById("message").classList.remove("hidden");
}

// Controles
document.addEventListener("keydown", e => {
  const key = e.key.toLowerCase();

  if ([" ", "arrowup", "arrowleft", "arrowright"].includes(key)) {
    e.preventDefault();
  }

  keys[key] = true;

  if (e.code === "Space" && running) {
    attack();
  }
});

document.addEventListener("keyup", e => {
  keys[e.key.toLowerCase()] = false;
});

// Botones
document.getElementById("start").onclick = startGame;
document.getElementById("restart").onclick = startGame;

// Dibujar pantalla inicial
draw();
