const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const ui = {
  mission: document.getElementById("missionReadout"),
  score: document.getElementById("scoreReadout"),
  lives: document.getElementById("livesReadout"),
  hull: document.getElementById("hullReadout"),
  ai: document.getElementById("aiReadout"),
  startOverlay: document.getElementById("startOverlay"),
  pauseOverlay: document.getElementById("pauseOverlay"),
  quizOverlay: document.getElementById("quizOverlay"),
  endOverlay: document.getElementById("endOverlay"),
  endKicker: document.getElementById("endKicker"),
  endTitle: document.getElementById("endTitle"),
  endText: document.getElementById("endText"),
  questionText: document.getElementById("questionText"),
  answerList: document.getElementById("answerList"),
  startButton: document.getElementById("startButton"),
  resumeButton: document.getElementById("resumeButton"),
  restartButton: document.getElementById("restartButton")
};

const images = {
  plane: loadImage("assets/original/f47-player.svg"),
  drone: loadImage("assets/original/enemy-drone.svg"),
  fighter: loadImage("assets/original/enemy-fighter.svg"),
  ground: loadImage("assets/original/enemy-ground.svg"),
  asteroid: loadImage("assets/original/enemy-asteroid.svg"),
  alien: loadImage("assets/original/enemy-alien.svg"),
  bgAtmosphere: loadImage("assets/original/bg-atmosphere.svg"),
  bgBattlefield: loadImage("assets/original/bg-battlefield.svg"),
  bgMountains: loadImage("assets/original/bg-mountains.svg"),
  bgOrbit: loadImage("assets/original/bg-orbit.svg")
};

const missions = [
  {
    name: "Training Simulation",
    briefing: "Unarmed drones test rotation, shooting, and spatial control.",
    quota: 16,
    sky: ["#86d7ff", "#113c62"],
    enemy: "drone",
    spawn: 1.1,
    maxEnemies: 7
  },
  {
    name: "Armor Breaker",
    briefing: "Ground tanks and missile launchers fire tracking rockets.",
    quota: 24,
    sky: ["#25435d", "#0a1321"],
    enemy: "ground",
    spawn: 0.95,
    maxEnemies: 9
  },
  {
    name: "Contested Airspace",
    briefing: "Ground batteries combine with hostile planes and drones.",
    quota: 32,
    sky: ["#13263a", "#08101c"],
    enemy: "mixed",
    spawn: 0.78,
    maxEnemies: 12
  },
  {
    name: "Mountain Needle",
    briefing: "Fly through rising terrain while all previous threats converge.",
    quota: 40,
    sky: ["#20364a", "#090c13"],
    enemy: "mountain",
    spawn: 0.68,
    maxEnemies: 13
  },
  {
    name: "Orbital Shatterfield",
    briefing: "Asteroids replace aircraft. Break them before they crowd the orbit.",
    quota: 46,
    sky: ["#081321", "#02030a"],
    enemy: "asteroid",
    spawn: 0.6,
    maxEnemies: 16
  },
  {
    name: "Alien Belt",
    briefing: "Asteroids and fast alien ships swarm the final corridor.",
    quota: 60,
    sky: ["#0b1022", "#03020a"],
    enemy: "alien",
    spawn: 0.48,
    maxEnemies: 18
  }
];

const questions = [
  {
    q: "Why should powerful AI systems help humanity?",
    a: [
      "Because intelligence is most valuable when it reduces suffering and expands human potential.",
      "Because humans should stop making decisions.",
      "Because speed matters more than values."
    ],
    correct: 0
  },
  {
    q: "What is the best partnership between pilots and AI?",
    a: [
      "AI replaces judgment completely.",
      "Humans set goals and values while AI amplifies perception, safety, and response time.",
      "AI only follows orders without context."
    ],
    correct: 1
  },
  {
    q: "Which mission shows AI helping humankind responsibly?",
    a: [
      "Ignoring civilian safety to finish faster.",
      "Sharing clear reasoning, protecting people, and staying accountable to human direction.",
      "Hiding uncertainty so the user feels confident."
    ],
    correct: 1
  },
  {
    q: "When danger increases, what should AI prioritize?",
    a: [
      "Transparent help that preserves life and supports good human choices.",
      "The most dramatic action.",
      "Winning without explaining tradeoffs."
    ],
    correct: 0
  },
  {
    q: "What makes AI power worthy of trust?",
    a: [
      "Mystery and total control.",
      "Useful capability aligned with human dignity, consent, and safety.",
      "Never asking questions."
    ],
    correct: 1
  }
];

const keys = new Set();
const stars = Array.from({ length: 160 }, () => ({
  x: Math.random() * canvas.width,
  y: Math.random() * canvas.height,
  r: Math.random() * 1.7 + 0.25,
  p: Math.random() * Math.PI * 2
}));

let game;
let last = performance.now();

function loadImage(src) {
  const image = new Image();
  image.src = src;
  return image;
}

function resetGame() {
  game = {
    state: "start",
    time: 0,
    level: 0,
    score: 0,
    lives: 3,
    kills: 0,
    levelKills: 0,
    waveClock: 0,
    artifactClock: 11,
    debriefNextLevel: null,
    debriefQuestionsLeft: 0,
    askedDebriefQuestions: [],
    message: "Mission 1: Training Simulation",
    messageClock: 4,
    shake: 0,
    player: {
      x: canvas.width * 0.5,
      y: canvas.height * 0.55,
      vx: 0,
      vy: 0,
      angle: -Math.PI / 2,
      radius: 25,
      hull: 100,
      fireCooldown: 0,
      empCooldown: 0,
      boostHeat: 0,
      invincible: 2,
      aiTimer: 0,
      drones: []
    },
    bullets: [],
    enemyBullets: [],
    enemies: [],
    particles: [],
    artifacts: [],
    mountains: [],
    activeQuestion: null
  };
  seedLevel();
  syncUi();
}

function seedLevel() {
  game.enemies.length = 0;
  game.enemyBullets.length = 0;
  game.artifacts.length = 0;
  game.mountains.length = 0;
  game.levelKills = 0;
  game.waveClock = 0;
  game.artifactClock = 8;
  game.player.x = canvas.width * 0.5;
  game.player.y = canvas.height * 0.58;
  game.player.vx = 0;
  game.player.vy = 0;
  game.player.invincible = 2.3;
  game.message = `Mission ${game.level + 1}: ${missions[game.level].name}`;
  game.messageClock = 4;
  game.activeQuestion = null;
  ui.quizOverlay.classList.remove("active");
  if (game.level === 3) {
    for (let i = 0; i < 6; i += 1) spawnMountain(i * 240);
  }
}

function startGame() {
  resetGame();
  game.state = "playing";
  ui.startOverlay.classList.remove("active");
  ui.endOverlay.classList.remove("active");
}

function togglePause() {
  if (game.state === "playing") {
    game.state = "paused";
    ui.pauseOverlay.classList.add("active");
  } else if (game.state === "paused") {
    game.state = "playing";
    ui.pauseOverlay.classList.remove("active");
  }
}

function update(dt) {
  if (game.state !== "playing") return;
  const player = game.player;
  const mission = missions[game.level];
  game.time += dt;
  game.waveClock -= dt;
  game.artifactClock -= dt;
  game.messageClock -= dt;
  game.shake = Math.max(0, game.shake - dt * 18);

  if (keys.has("ArrowLeft") || keys.has("KeyA")) player.angle -= dt * 4.2;
  if (keys.has("ArrowRight") || keys.has("KeyD")) player.angle += dt * 4.2;

  const thrust = keys.has("ArrowUp") || keys.has("KeyW");
  const brake = keys.has("ArrowDown") || keys.has("KeyS");
  const boosting = keys.has("ShiftLeft") || keys.has("ShiftRight");
  const thrustPower = thrust ? (boosting && player.boostHeat < 1 ? 430 : 250) : 0;
  if (thrustPower) {
    player.vx += Math.cos(player.angle) * thrustPower * dt;
    player.vy += Math.sin(player.angle) * thrustPower * dt;
    spawnThrust(player, boosting);
    if (boosting) player.boostHeat = Math.min(1, player.boostHeat + dt * 0.48);
  } else {
    player.boostHeat = Math.max(0, player.boostHeat - dt * 0.28);
  }
  if (brake) {
    player.vx *= Math.pow(0.02, dt);
    player.vy *= Math.pow(0.02, dt);
  } else {
    player.vx *= Math.pow(0.72, dt);
    player.vy *= Math.pow(0.72, dt);
  }
  player.x += player.vx * dt;
  player.y += player.vy * dt;
  wrap(player);
  player.fireCooldown -= dt;
  player.empCooldown -= dt;
  player.invincible -= dt;
  player.aiTimer = Math.max(0, player.aiTimer - dt);

  if (keys.has("Space") && player.fireCooldown <= 0) fireBullet(player.x, player.y, player.angle, "player");
  if (keys.has("KeyE") && player.empCooldown <= 0) triggerEmp();

  updateAiDrones(dt);
  updateBullets(dt);
  updateEnemies(dt);
  updateArtifacts(dt);
  updateParticles(dt);
  updateMountains(dt);
  maybeSpawnEnemy(dt, mission);
  maybeSpawnArtifact();
  handleCollisions();
  checkLevelProgress();
  syncUi();
}

function fireBullet(x, y, angle, owner) {
  const speed = owner === "player" ? 690 : 330;
  game.bullets.push({
    x: x + Math.cos(angle) * 28,
    y: y + Math.sin(angle) * 28,
    vx: Math.cos(angle) * speed + (owner === "player" ? game.player.vx * 0.25 : 0),
    vy: Math.sin(angle) * speed + (owner === "player" ? game.player.vy * 0.25 : 0),
    life: owner === "player" ? 1.15 : 2.5,
    radius: owner === "player" ? 4 : 5,
    owner
  });
  if (owner === "player") game.player.fireCooldown = game.player.aiTimer > 0 ? 0.09 : 0.16;
}

function triggerEmp() {
  const player = game.player;
  player.empCooldown = 8;
  game.shake = 8;
  game.particles.push({ type: "ring", x: player.x, y: player.y, radius: 10, life: 0.7, maxLife: 0.7, color: "#6ff1ff" });
  for (const enemy of game.enemies) {
    if (distance(player, enemy) < 190) damageEnemy(enemy, 2);
  }
  for (const bullet of game.enemyBullets) {
    if (distance(player, bullet) < 230) bullet.life = 0;
  }
}

function updateAiDrones(dt) {
  const player = game.player;
  if (player.aiTimer > 0 && player.drones.length < 4) {
    player.drones.push({ orbit: player.drones.length * Math.PI * 0.5, fireCooldown: 0 });
  }
  if (player.aiTimer <= 0) player.drones.length = 0;
  player.drones.forEach((drone, index) => {
    drone.orbit += dt * (2.2 + index * 0.1);
    drone.x = player.x + Math.cos(drone.orbit) * 72;
    drone.y = player.y + Math.sin(drone.orbit) * 72;
    drone.fireCooldown -= dt;
    if (drone.fireCooldown <= 0 && game.enemies.length) {
      const target = nearest(drone, game.enemies);
      const angle = Math.atan2(target.y - drone.y, target.x - drone.x);
      fireDroneBullet(drone.x, drone.y, angle);
      drone.fireCooldown = 0.42;
    }
  });
}

function fireDroneBullet(x, y, angle) {
  game.bullets.push({
    x,
    y,
    vx: Math.cos(angle) * 560,
    vy: Math.sin(angle) * 560,
    life: 1,
    radius: 3.5,
    owner: "player",
    drone: true
  });
}

function updateBullets(dt) {
  const updateOne = bullet => {
    bullet.x += bullet.vx * dt;
    bullet.y += bullet.vy * dt;
    bullet.life -= dt;
    wrap(bullet);
  };
  game.bullets.forEach(updateOne);
  game.enemyBullets.forEach(updateOne);
  game.bullets = game.bullets.filter(b => b.life > 0);
  game.enemyBullets = game.enemyBullets.filter(b => b.life > 0);
}

function maybeSpawnEnemy(dt, mission) {
  if (game.enemies.length >= mission.maxEnemies + game.levelKills * 0.06) return;
  if (game.waveClock > 0) return;
  const pressure = 1 + game.levelKills / Math.max(12, mission.quota);
  game.waveClock = mission.spawn / pressure;
  const roll = Math.random();
  if (mission.enemy === "drone") spawnEnemy("drone");
  if (mission.enemy === "ground") spawnEnemy(roll < 0.55 ? "tank" : "launcher");
  if (mission.enemy === "mixed") spawnEnemy(roll < 0.35 ? "fighter" : roll < 0.7 ? "drone" : "launcher");
  if (mission.enemy === "mountain") spawnEnemy(roll < 0.32 ? "fighter" : roll < 0.58 ? "drone" : "launcher");
  if (mission.enemy === "asteroid") spawnEnemy("asteroid");
  if (mission.enemy === "alien") spawnEnemy(roll < 0.56 ? "asteroid" : "alien");
}

function spawnEnemy(type) {
  const edge = Math.floor(Math.random() * 4);
  const pos = [
    { x: -30, y: Math.random() * canvas.height },
    { x: canvas.width + 30, y: Math.random() * canvas.height },
    { x: Math.random() * canvas.width, y: -30 },
    { x: Math.random() * canvas.width, y: canvas.height + 30 }
  ][edge];
  const toPlayer = Math.atan2(game.player.y - pos.y, game.player.x - pos.x) + rand(-0.8, 0.8);
  const speedMap = { drone: 90, tank: 35, launcher: 42, fighter: 150, asteroid: 80, alien: 190 };
  const radiusMap = { drone: 17, tank: 23, launcher: 25, fighter: 22, asteroid: rand(26, 54), alien: 24 };
  const hpMap = { drone: 1, tank: 3, launcher: 2, fighter: 2, asteroid: 2, alien: 3 };
  const speed = speedMap[type] * rand(0.82, 1.28) * (1 + game.level * 0.06);
  game.enemies.push({
    type,
    x: pos.x,
    y: pos.y,
    vx: Math.cos(toPlayer) * speed,
    vy: Math.sin(toPlayer) * speed,
    angle: toPlayer,
    radius: radiusMap[type],
    hp: hpMap[type],
    maxHp: hpMap[type],
    fireCooldown: rand(0.7, 2.6),
    wobble: Math.random() * Math.PI * 2,
    spin: rand(-1.7, 1.7)
  });
}

function updateEnemies(dt) {
  const player = game.player;
  for (const enemy of game.enemies) {
    enemy.wobble += dt;
    if (enemy.type === "drone") {
      const angle = Math.atan2(player.y - enemy.y, player.x - enemy.x);
      enemy.vx += Math.cos(angle) * 34 * dt;
      enemy.vy += Math.sin(angle) * 34 * dt;
    }
    if (enemy.type === "fighter" || enemy.type === "alien") {
      const angle = Math.atan2(player.y - enemy.y, player.x - enemy.x);
      const agility = enemy.type === "alien" ? 155 : 88;
      enemy.vx += Math.cos(angle + Math.sin(enemy.wobble * 4) * 0.8) * agility * dt;
      enemy.vy += Math.sin(angle + Math.cos(enemy.wobble * 3) * 0.8) * agility * dt;
      enemy.fireCooldown -= dt;
      if (enemy.fireCooldown <= 0) {
        fireEnemyBullet(enemy);
        enemy.fireCooldown = enemy.type === "alien" ? rand(0.65, 1.2) : rand(1.1, 2);
      }
    }
    if (enemy.type === "launcher" || enemy.type === "tank") {
      enemy.fireCooldown -= dt;
      enemy.vx *= Math.pow(0.84, dt);
      enemy.vy *= Math.pow(0.84, dt);
      if (enemy.fireCooldown <= 0) {
        fireEnemyBullet(enemy, enemy.type === "launcher");
        enemy.fireCooldown = enemy.type === "launcher" ? rand(1.1, 1.8) : rand(1.8, 2.8);
      }
    }
    if (enemy.type === "asteroid") enemy.angle += enemy.spin * dt;
    enemy.x += enemy.vx * dt;
    enemy.y += enemy.vy * dt;
    limitVelocity(enemy, enemy.type === "alien" ? 320 : 230);
    wrap(enemy);
  }
}

function fireEnemyBullet(enemy, missile = false) {
  const angle = Math.atan2(game.player.y - enemy.y, game.player.x - enemy.x);
  const speed = missile ? 235 : 310;
  game.enemyBullets.push({
    x: enemy.x,
    y: enemy.y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    radius: missile ? 8 : 5,
    life: missile ? 4.6 : 2.7,
    missile,
    turn: missile ? 2.1 : 0
  });
}

function updateArtifacts(dt) {
  for (const artifact of game.artifacts) {
    artifact.x += artifact.vx * dt;
    artifact.y += artifact.vy * dt;
    artifact.pulse += dt * 4;
    wrap(artifact);
  }
}

function maybeSpawnArtifact() {
  if (game.artifactClock > 0 || game.artifacts.length) return;
  const pressure = game.enemies.length + game.enemyBullets.length * 0.4;
  if (pressure < 5 && Math.random() > 0.25) {
    game.artifactClock = 3;
    return;
  }
  game.artifacts.push({
    x: rand(110, canvas.width - 110),
    y: rand(90, canvas.height - 90),
    vx: rand(-32, 32),
    vy: rand(-32, 32),
    radius: 24,
    pulse: 0
  });
  game.artifactClock = rand(15, 24);
}

function askQuestion() {
  ui.quizOverlay.classList.add("active");
  const available = questions.filter((_, index) => !game.askedDebriefQuestions.includes(index));
  const pool = available.length ? available : questions;
  const question = pool[Math.floor(Math.random() * pool.length)];
  const questionIndex = questions.indexOf(question);
  game.askedDebriefQuestions.push(questionIndex);
  game.activeQuestion = question;
  const number = 4 - game.debriefQuestionsLeft;
  ui.questionText.textContent = `Question ${number}/3: ${question.q}`;
  ui.answerList.innerHTML = "";
  question.a.forEach((answer, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = `${index + 1}. ${answer}`;
    button.addEventListener("click", () => answerQuestion(index === question.correct));
    ui.answerList.appendChild(button);
  });
}

function answerQuestion(correct) {
  if (!game.activeQuestion) return;
  game.activeQuestion = null;
  if (correct) {
    game.lives += 1;
    game.score += 350;
    game.message = "Correct: +1 life earned";
    game.messageClock = 2.6;
    burst(game.player.x, game.player.y, "#82f7b5", 34);
  } else {
    game.message = "No life bonus this time";
    game.messageClock = 2.6;
    burst(game.player.x, game.player.y, "#ff687c", 18);
  }
  game.debriefQuestionsLeft -= 1;
  if (game.debriefQuestionsLeft > 0) {
    askQuestion();
    syncUi();
    return;
  }
  ui.quizOverlay.classList.remove("active");
  finishLevelDebrief();
  syncUi();
}

function updateMountains(dt) {
  if (game.level !== 3) return;
  for (const mountain of game.mountains) {
    mountain.x -= (80 + game.levelKills * 0.9) * dt;
    if (mountain.x < -mountain.width) {
      mountain.x = canvas.width + rand(80, 220);
      mountain.height = rand(90, 230);
      mountain.top = Math.random() > 0.52;
    }
  }
}

function spawnMountain(x) {
  game.mountains.push({
    x: canvas.width + x,
    width: rand(90, 180),
    height: rand(85, 220),
    top: Math.random() > 0.52
  });
}

function updateParticles(dt) {
  for (const p of game.particles) {
    p.x += (p.vx || 0) * dt;
    p.y += (p.vy || 0) * dt;
    p.life -= dt;
    if (p.type === "ring") p.radius += dt * 360;
  }
  game.particles = game.particles.filter(p => p.life > 0);
}

function handleCollisions() {
  const player = game.player;
  for (const bullet of game.bullets) {
    for (const enemy of game.enemies) {
      if (bullet.life > 0 && distance(bullet, enemy) < bullet.radius + enemy.radius) {
        bullet.life = 0;
        damageEnemy(enemy, bullet.drone ? 1 : 1.35);
      }
    }
  }

  for (const enemy of game.enemies) {
    if (distance(player, enemy) < player.radius + enemy.radius) {
      if (player.aiTimer > 0) {
        damageEnemy(enemy, 4);
        burst(enemy.x, enemy.y, "#61d9ff", 18);
      } else {
        hurtPlayer(enemy.type === "asteroid" ? 18 : 14);
        damageEnemy(enemy, 2);
      }
    }
  }

  for (const bullet of game.enemyBullets) {
    if (bullet.missile) {
      const angle = Math.atan2(player.y - bullet.y, player.x - bullet.x);
      const targetVx = Math.cos(angle) * 255;
      const targetVy = Math.sin(angle) * 255;
      bullet.vx += (targetVx - bullet.vx) * 0.025;
      bullet.vy += (targetVy - bullet.vy) * 0.025;
    }
    if (distance(player, bullet) < player.radius + bullet.radius) {
      bullet.life = 0;
      hurtPlayer(player.aiTimer > 0 ? 3 : bullet.missile ? 16 : 10);
    }
  }

  for (const artifact of game.artifacts) {
    if (distance(player, artifact) < player.radius + artifact.radius) {
      artifact.collected = true;
      player.aiTimer = 10;
      player.drones.length = 0;
      game.message = "AI artifact captured: drone guard online for 10 seconds";
      game.messageClock = 3;
      burst(artifact.x, artifact.y, "#61d9ff", 44);
    }
  }
  game.artifacts = game.artifacts.filter(a => !a.collected);

  for (const mountain of game.mountains) {
    const hitY = mountain.top ? mountain.height : canvas.height - mountain.height;
    const withinX = player.x > mountain.x && player.x < mountain.x + mountain.width;
    const hit = mountain.top ? player.y - player.radius < hitY : player.y + player.radius > hitY;
    if (withinX && hit) {
      hurtPlayer(player.aiTimer > 0 ? 6 : 24);
      player.vx *= -0.55;
      player.vy *= -0.55;
      game.shake = 10;
    }
  }

  game.enemies = game.enemies.filter(enemy => enemy.hp > 0);
  if (player.hull <= 0) loseLife();
}

function damageEnemy(enemy, amount) {
  enemy.hp -= amount;
  burst(enemy.x, enemy.y, enemy.type === "asteroid" ? "#ffd36e" : "#ff687c", 6);
  if (enemy.hp <= 0) {
    const value = enemy.type === "alien" ? 190 : enemy.type === "asteroid" ? 120 : 90;
    game.score += value;
    game.kills += 1;
    game.levelKills += 1;
    game.shake = Math.max(game.shake, 3);
    burst(enemy.x, enemy.y, "#ffd36e", 26);
    if (enemy.type === "asteroid" && enemy.radius > 34 && game.level >= 4) splitAsteroid(enemy);
  }
}

function splitAsteroid(enemy) {
  for (let i = 0; i < 2; i += 1) {
    game.enemies.push({
      type: "asteroid",
      x: enemy.x + rand(-10, 10),
      y: enemy.y + rand(-10, 10),
      vx: rand(-130, 130),
      vy: rand(-130, 130),
      angle: rand(0, Math.PI * 2),
      radius: enemy.radius * 0.56,
      hp: 1,
      maxHp: 1,
      fireCooldown: 9,
      wobble: rand(0, Math.PI * 2),
      spin: rand(-2.5, 2.5)
    });
  }
}

function hurtPlayer(amount) {
  const player = game.player;
  if (player.invincible > 0) return;
  player.hull = Math.max(0, player.hull - amount);
  player.invincible = 0.65;
  game.shake = 12;
  burst(player.x, player.y, "#ff687c", 26);
}

function loseLife() {
  game.lives -= 1;
  if (game.lives <= 0) {
    endGame(false);
    return;
  }
  const player = game.player;
  player.hull = 100;
  player.x = canvas.width * 0.5;
  player.y = canvas.height * 0.58;
  player.vx = 0;
  player.vy = 0;
  player.aiTimer = 0;
  player.drones.length = 0;
  player.invincible = 2.6;
  game.enemyBullets.length = 0;
  game.message = `Life lost. ${game.lives} remaining.`;
  game.messageClock = 3;
  syncUi();
}

function checkLevelProgress() {
  const mission = missions[game.level];
  if (game.levelKills < mission.quota) return;
  startLevelDebrief(game.level + 1);
}

function startLevelDebrief(nextLevel) {
  game.state = "debrief";
  game.debriefNextLevel = nextLevel;
  game.debriefQuestionsLeft = 3;
  game.askedDebriefQuestions = [];
  game.enemies.length = 0;
  game.enemyBullets.length = 0;
  game.artifacts.length = 0;
  game.player.aiTimer = 0;
  game.player.drones.length = 0;
  game.score += 1000 + game.level * 250;
  game.message = `Mission ${game.level + 1} complete: debrief questions`;
  game.messageClock = 3;
  askQuestion();
  syncUi();
}

function finishLevelDebrief() {
  if (game.debriefNextLevel >= missions.length) {
    ui.quizOverlay.classList.remove("active");
    endGame(true);
    return;
  }
  game.level = game.debriefNextLevel;
  game.debriefNextLevel = null;
  game.debriefQuestionsLeft = 0;
  game.askedDebriefQuestions = [];
  game.player.hull = Math.min(100, game.player.hull + 26);
  seedLevel();
  game.state = "playing";
}

function endGame(won) {
  game.state = "ended";
  ui.endOverlay.classList.add("active");
  ui.endKicker.textContent = won ? "All missions cleared" : "Aircraft lost";
  ui.endTitle.textContent = won ? "Humanity keeps the sky" : "The F-47 went down";
  ui.endText.textContent = won
    ? `Final score: ${game.score}. The AI stayed aligned, the drones held formation, and the last hostile left orbit.`
    : `Final score: ${game.score}. Refit the F-47 and try the mission chain again.`;
}

function draw() {
  const mission = missions[game.level];
  const ox = game.shake ? rand(-game.shake, game.shake) : 0;
  const oy = game.shake ? rand(-game.shake, game.shake) : 0;
  ctx.save();
  ctx.translate(ox, oy);
  drawBackground(mission);
  drawMountains();
  drawArtifacts();
  drawEnemies();
  drawBullets();
  drawPlayer();
  drawParticles();
  drawHud(mission);
  ctx.restore();
}

function drawBackground(mission) {
  const bg = getMissionBackground();
  if (bg.complete) {
    ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);
  } else {
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, mission.sky[0]);
    gradient.addColorStop(1, mission.sky[1]);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  ctx.fillStyle = game.level >= 4 ? "rgba(0, 0, 0, 0.14)" : "rgba(3, 9, 18, 0.28)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  drawStarfield();
}

function getMissionBackground() {
  if (game.level === 3) return images.bgMountains;
  if (game.level >= 4) return images.bgOrbit;
  if (game.level >= 1) return images.bgBattlefield;
  return images.bgAtmosphere;
}

function drawStarfield() {
  for (const star of stars) {
    const pulse = Math.sin(game.time * 1.7 + star.p) * 0.35 + 0.65;
    ctx.fillStyle = `rgba(230, 249, 255, ${game.level >= 4 ? pulse : pulse * 0.38})`;
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawPlayer() {
  const p = game.player;
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(p.angle + Math.PI / 2);
  ctx.globalAlpha = p.invincible > 0 ? 0.55 + Math.sin(game.time * 34) * 0.25 : 1;
  ctx.shadowColor = p.aiTimer > 0 ? "#61d9ff" : "#9edfff";
  ctx.shadowBlur = p.aiTimer > 0 ? 28 : 12;
  if (images.plane.complete) {
    ctx.drawImage(images.plane, -48, -39, 96, 78);
  } else {
    ctx.fillStyle = "#a9e6ff";
    ctx.beginPath();
    ctx.moveTo(0, -38);
    ctx.lineTo(35, 24);
    ctx.lineTo(0, 10);
    ctx.lineTo(-35, 24);
    ctx.closePath();
    ctx.fill();
  }
  ctx.shadowBlur = 0;
  ctx.fillStyle = "#ff6e55";
  ctx.beginPath();
  ctx.moveTo(-12, 25);
  ctx.lineTo(0, 45 + Math.sin(game.time * 30) * 6);
  ctx.lineTo(12, 25);
  ctx.fill();
  ctx.restore();

  for (const drone of p.drones) {
    ctx.save();
    ctx.translate(drone.x, drone.y);
    ctx.rotate(drone.orbit);
    ctx.fillStyle = "#dffaff";
    ctx.shadowColor = "#61d9ff";
    ctx.shadowBlur = 18;
    ctx.beginPath();
    ctx.moveTo(0, -12);
    ctx.lineTo(15, 9);
    ctx.lineTo(-15, 9);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}

function drawEnemies() {
  for (const enemy of game.enemies) {
    ctx.save();
    ctx.translate(enemy.x, enemy.y);
    ctx.rotate(enemy.angle);
    const asset = getEnemyAsset(enemy.type);
    if (asset && asset.complete) {
      const size = enemy.radius * 2.45;
      ctx.drawImage(asset, -size / 2, -size / 2, size, size);
    } else if (enemy.type === "asteroid") {
      ctx.fillStyle = "#8c7b6c";
      ctx.strokeStyle = "#ffd36e";
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i < 9; i += 1) {
        const a = (Math.PI * 2 * i) / 9;
        const r = enemy.radius * (0.7 + 0.32 * Math.sin(i * 2.1 + enemy.wobble));
        const x = Math.cos(a) * r;
        const y = Math.sin(a) * r;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else if (enemy.type === "alien") {
      ctx.fillStyle = "#b6ff85";
      ctx.strokeStyle = "#f2ffdb";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(0, 0, 28, 14, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#1f522f";
      ctx.beginPath();
      ctx.arc(0, -4, 7, 0, Math.PI * 2);
      ctx.fill();
    } else if (enemy.type === "fighter") {
      ctx.fillStyle = "#ff687c";
      ctx.beginPath();
      ctx.moveTo(25, 0);
      ctx.lineTo(-18, -16);
      ctx.lineTo(-8, 0);
      ctx.lineTo(-18, 16);
      ctx.closePath();
      ctx.fill();
    } else if (enemy.type === "tank" || enemy.type === "launcher") {
      ctx.fillStyle = enemy.type === "launcher" ? "#ffb86b" : "#b6c179";
      ctx.fillRect(-22, -13, 44, 26);
      ctx.fillStyle = "#26301d";
      ctx.fillRect(-8, -24, 16, 48);
    } else {
      ctx.strokeStyle = "#ff687c";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, enemy.radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-enemy.radius, 0);
      ctx.lineTo(enemy.radius, 0);
      ctx.moveTo(0, -enemy.radius);
      ctx.lineTo(0, enemy.radius);
      ctx.stroke();
    }
    if (enemy.hp < enemy.maxHp) {
      ctx.fillStyle = "rgba(0,0,0,0.45)";
      ctx.fillRect(-22, -enemy.radius - 12, 44, 4);
      ctx.fillStyle = "#82f7b5";
      ctx.fillRect(-22, -enemy.radius - 12, 44 * enemy.hp / enemy.maxHp, 4);
    }
    ctx.restore();
  }
}

function getEnemyAsset(type) {
  if (type === "drone") return images.drone;
  if (type === "fighter") return images.fighter;
  if (type === "tank" || type === "launcher") return images.ground;
  if (type === "asteroid") return images.asteroid;
  if (type === "alien") return images.alien;
  return null;
}

function drawBullets() {
  for (const bullet of game.bullets) {
    ctx.fillStyle = bullet.drone ? "#82f7b5" : "#61d9ff";
    ctx.shadowColor = ctx.fillStyle;
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
    ctx.fill();
  }
  for (const bullet of game.enemyBullets) {
    ctx.fillStyle = bullet.missile ? "#ffb86b" : "#ff687c";
    ctx.shadowColor = ctx.fillStyle;
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.shadowBlur = 0;
}

function drawArtifacts() {
  for (const artifact of game.artifacts) {
    const pulse = Math.sin(artifact.pulse) * 4;
    ctx.save();
    ctx.translate(artifact.x, artifact.y);
    ctx.shadowColor = "#61d9ff";
    ctx.shadowBlur = 30;
    ctx.strokeStyle = "#61d9ff";
    ctx.fillStyle = "rgba(97, 217, 255, 0.13)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let i = 0; i < 6; i += 1) {
      const a = Math.PI / 6 + i * Math.PI / 3;
      const x = Math.cos(a) * (artifact.radius + pulse);
      const y = Math.sin(a) * (artifact.radius + pulse);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#e9fdff";
    ctx.font = "900 17px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("AI", 0, 1);
    ctx.restore();
  }
}

function drawMountains() {
  if (game.level !== 3) return;
  for (const mountain of game.mountains) {
    ctx.fillStyle = "rgba(91, 104, 106, 0.88)";
    ctx.strokeStyle = "rgba(224, 247, 255, 0.22)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    if (mountain.top) {
      ctx.moveTo(mountain.x, 0);
      ctx.lineTo(mountain.x + mountain.width * 0.5, mountain.height);
      ctx.lineTo(mountain.x + mountain.width, 0);
    } else {
      ctx.moveTo(mountain.x, canvas.height);
      ctx.lineTo(mountain.x + mountain.width * 0.5, canvas.height - mountain.height);
      ctx.lineTo(mountain.x + mountain.width, canvas.height);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
}

function drawParticles() {
  for (const p of game.particles) {
    const alpha = Math.max(0, p.life / p.maxLife);
    if (p.type === "ring") {
      ctx.strokeStyle = rgba(p.color, alpha);
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      ctx.fillStyle = rgba(p.color, alpha);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius * alpha, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawHud(mission) {
  ctx.save();
  ctx.fillStyle = "rgba(2, 8, 18, 0.62)";
  ctx.fillRect(18, 18, 380, 92);
  ctx.strokeStyle = "rgba(162, 215, 255, 0.28)";
  ctx.strokeRect(18.5, 18.5, 380, 92);
  ctx.fillStyle = "#f6fbff";
  ctx.font = "900 20px Inter, sans-serif";
  ctx.fillText(`Mission ${game.level + 1}: ${mission.name}`, 36, 48);
  ctx.fillStyle = "#abc1d4";
  ctx.font = "14px Inter, sans-serif";
  ctx.fillText(mission.briefing, 36, 74);
  ctx.fillStyle = "#61d9ff";
  ctx.fillRect(36, 90, 320 * Math.min(1, game.levelKills / mission.quota), 6);
  ctx.fillStyle = "rgba(255,255,255,0.14)";
  ctx.fillRect(36, 90, 320, 6);
  ctx.fillStyle = "#61d9ff";
  ctx.fillRect(36, 90, 320 * Math.min(1, game.levelKills / mission.quota), 6);

  if (game.messageClock > 0) {
    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(2, 8, 18, 0.64)";
    ctx.fillRect(canvas.width / 2 - 250, 28, 500, 42);
    ctx.fillStyle = "#f6fbff";
    ctx.font = "900 18px Inter, sans-serif";
    ctx.fillText(game.message, canvas.width / 2, 55);
  }
  ctx.restore();
}

function burst(x, y, color, count) {
  for (let i = 0; i < count; i += 1) {
    const angle = Math.random() * Math.PI * 2;
    const speed = rand(28, 260);
    game.particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      radius: rand(2, 6),
      color,
      life: rand(0.28, 0.9),
      maxLife: 0.9
    });
  }
}

function spawnThrust(player, boosting) {
  const angle = player.angle + Math.PI + rand(-0.24, 0.24);
  game.particles.push({
    x: player.x + Math.cos(player.angle + Math.PI) * 28,
    y: player.y + Math.sin(player.angle + Math.PI) * 28,
    vx: Math.cos(angle) * rand(80, 180),
    vy: Math.sin(angle) * rand(80, 180),
    radius: boosting ? rand(4, 8) : rand(2, 5),
    color: boosting ? "#ffd36e" : "#61d9ff",
    life: boosting ? 0.34 : 0.24,
    maxLife: boosting ? 0.34 : 0.24
  });
}

function syncUi() {
  ui.mission.textContent = String(game.level + 1);
  ui.score.textContent = String(game.score);
  ui.lives.textContent = String(game.lives);
  ui.hull.textContent = String(Math.ceil(game.player.hull));
  ui.ai.textContent = `${game.player.aiTimer.toFixed(1)}s`;
}

function gameLoop(now) {
  const dt = Math.min(0.033, (now - last) / 1000);
  last = now;
  update(dt);
  draw();
  requestAnimationFrame(gameLoop);
}

function wrap(body) {
  if (body.x < -50) body.x = canvas.width + 50;
  if (body.x > canvas.width + 50) body.x = -50;
  if (body.y < -50) body.y = canvas.height + 50;
  if (body.y > canvas.height + 50) body.y = -50;
}

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function nearest(origin, list) {
  return list.reduce((best, item) => distance(origin, item) < distance(origin, best) ? item : best, list[0]);
}

function limitVelocity(body, max) {
  const speed = Math.hypot(body.vx, body.vy);
  if (speed > max) {
    body.vx = body.vx / speed * max;
    body.vy = body.vy / speed * max;
  }
}

function rand(min, max) {
  return Math.random() * (max - min) + min;
}

function rgba(hex, alpha) {
  const value = hex.replace("#", "");
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

window.addEventListener("keydown", event => {
  if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(event.code)) event.preventDefault();
  if (game && game.activeQuestion && ["Digit1", "Digit2", "Digit3"].includes(event.code)) {
    const choice = Number(event.code.slice(-1)) - 1;
    answerQuestion(choice === game.activeQuestion.correct);
    event.preventDefault();
    return;
  }
  keys.add(event.code);
  if (event.code === "KeyP") togglePause();
});

window.addEventListener("keyup", event => {
  keys.delete(event.code);
});

ui.startButton.addEventListener("click", startGame);
ui.resumeButton.addEventListener("click", togglePause);
ui.restartButton.addEventListener("click", startGame);

resetGame();
requestAnimationFrame(gameLoop);
