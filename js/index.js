const canvas = document.getElementById("canvas1");
const ctx = canvas.getContext("2d");

//GLOBAL VARIABLES
const cellSize = 100;
const cellGap = 3;
let numberOfResources = 300;
let enemiesInterval = 600;
let frame = 0;
let gameOver = false;
let score = 0;
const winningScore = 50;

const gameGrid = [];
const defenders = [];
const enemies = [];
const enemyPositions = [];
const projectiles = [];
const resources = [];

//MOUSE ON THE SCREEN
const mouse = {
  x: 10,
  y: 10,
  width: 0.1,
  height: 0.1,
};
let canvasPosition = canvas.getBoundingClientRect();
canvas.addEventListener("mousemove", function (e) {
  mouse.x = e.x - canvasPosition.left;
  mouse.y = e.y - canvasPosition.top;
});
canvas.addEventListener("mouseleave", function () {
  mouse.x = undefined;
  mouse.y = undefined;
});

//GAME LAYOUT
const controlsBar = {
  width: canvas.width,
  height: cellSize,
};
class Cell {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = cellSize;
    this.height = cellSize;
  }
  draw() {
    if (mouse.x && mouse.y && collision(this, mouse)) {
      ctx.strokeStyle = "grey";
      ctx.strokeRect(this.x, this.y, this.width, this.height);
    }
  }
}

function creatGrid() {
  for (let y = cellSize; y < canvas.height; y += cellSize) {
    for (let x = 0; x < canvas.width; x += cellSize) {
      gameGrid.push(new Cell(x, y));
    }
  }
}
creatGrid();

function handleGameGrid() {
  for (let i = 0; i < gameGrid.length; i++) {
    gameGrid[i].draw();
  }
}

//MISSILES
class Projectile {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 5;
    this.height = 5;
    this.power = 20;
    this.speed = 5;
  }
  update() {
    this.x += this.speed;
  }
  draw() {
    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.width, 0, Math.PI * 2);
    ctx.fill();
  }
}
function handleProjectiles() {
  for (let i = 0; i < projectiles.length; i++) {
    projectiles[i].update();
    projectiles[i].draw();

    for (let j = 0; j < enemies.length; j++) {
      if (
        enemies[j] &&
        projectiles[i] &&
        collision(projectiles[i], enemies[j])
      ) {
        enemies[j].health -= projectiles[i].power;
        projectiles.splice(i, 1);
        i--;
      }
    }

    if (projectiles[i] && projectiles[i].x > canvas.width - cellSize) {
      projectiles.splice(i, 1);
      i--;
    }
  }
}
// DEFENDERS
const defender = new Image();
defender.src = "./docs/images/defender.png";
class Defender {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = cellSize - cellGap * 2;
    this.height = cellSize - cellGap * 2;
    this.shooting = false;
    this.shootNow = false;
    this.health = 100;
    this.projectiles = [];
    this.timer = 0;
    this.frameX = 0;
    this.frameY = 0;
    this.spriteWidth = 194;
    this.spriteHeight = 194;
    this.minFrame = 0;
    this.maxFrame = 25;
  }
  draw() {
    ctx.fillStyle = "transparent";
    ctx.fillRect(this.x, this.y, this.width, this.height);
    // ctx.fillStyle = "green";
    ctx.font = "20px Orbitron";
    ctx.fillText(Math.floor(this.health), this.x + 15, this.y + 30);
    ctx.drawImage(
      defender,
      this.frameX * this.spriteWidth,
      0,
      this.spriteWidth,
      this.spriteHeight,
      this.x,
      this.y,
      this.width,
      this.height
    );
  }
  update() {
    if (frame % 5 === 0) {
      if (this.frameX < this.maxFrame) this.frameX++;
      else this.frameX = this.minFrame;
      if (this.frameX === 15) this.shootNow = true;
    }
    if (this.shooting) {
      this.minFrame = 0;
      this.maxFrame = 22;
    } else {
      this.minFrame = 19;
      this.maxFrame = 25;
    }

    if (this.shooting && this.shootNow) {
      projectiles.push(new Projectile(this.x + 70, this.y + 50));
      this.shootNow = false;
    }
  }
}

function handleDefenders() {
  for (let i = 0; i < defenders.length; i++) {
    defenders[i].draw();
    defenders[i].update();
    if (enemyPositions.indexOf(defenders[i].y) !== -1) {
      defenders[i].shooting = true;
    } else {
      defenders[i].shooting = false;
    }
    for (let j = 0; j < enemies.length; j++) {
      if (defenders[i] && collision(defenders[i], enemies[j])) {
        enemies[j].movement = 0;
        defenders[i].health -= 0.2;
      }
      if (defenders[i] && defenders[i].health <= 0) {
        defenders.splice(i, 1);
        i--;
        enemies[j].movement = enemies[j].speed;
      }
    }
  }
}
// FLOATING MESSAGES
const floatingMessages = [];
class floatingMessage {
  constructor(value, x, y, size, color) {
    this.value = value;
    this.x = x;
    this.y = y;
    this.size = size;
    this.lifeSpan = 0;
    this.color = color;
    this.opacity = 1;
  }
  update() {
    this.y -= 0.3;
    this.lifeSpan += 1;
    if (this.opacity > 0.03) this.opacity -= 0.03;
  }
  draw() {
    ctx.globalAlpha = this.opacity;
    ctx.fillStyle = this.color;
    ctx.font = this.size + "px Orbitron";
    ctx.fillText(this.value, this.x, this.y);
    ctx.globalAlpha = 1;
  }
}
function handleFloatingMessages() {
  for (let i = 0; i < floatingMessages.length; i++) {
    floatingMessages[i].update();
    floatingMessages[i].draw();
    if (floatingMessages[i].lifeSpan >= 50) {
      floatingMessages.splice(i, 1);
      i--;
    }
  }
}
//ENEMIES
const enemyTypes = [];
const enemy1 = new Image();
enemy1.src = "./docs/images/enemy1.png";
enemyTypes.push(enemy1);
const enemy2 = new Image();
enemy2.src = "./docs/images/enemy2.png";
enemyTypes.push(enemy2);

class Enemy {
  constructor(verticalPosition) {
    this.x = canvas.width;
    this.y = verticalPosition;
    this.width = cellSize - cellGap * 2;
    this.height = cellSize - cellGap * 2;
    this.speed = Math.random() * 0.2 + 0.4;
    this.movement = this.speed;
    this.health = 100;
    this.maxHealth = this.health;
    this.enemyType = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
    this.frameX = 0;
    this.frameY = 0;
    this.minFrame = 0;
    this.maxFrame = 4;
    this.spriteWidth = 256;
    this.spriteHeight = 256;
  }
  update() {
    this.x -= this.movement;
    if (frame % 10 === 0) {
      if (this.frameX < this.maxFrame) this.frameX++;
      else this.frameX = this.minFrame;
    }
  }
  draw() {
    //ctx.fillStyle = "red";
    //ctx.fillRect(this.x, this.y, this.width, this.height);
    ctx.fillStyle = "#E52D2D";
    ctx.font = "20px Orbitron";
    ctx.fillText(Math.floor(this.health), this.x + 15, this.y + 30);
    //ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
    ctx.drawImage(
      this.enemyType,
      this.frameX * this.spriteWidth,
      0,
      this.spriteWidth,
      this.spriteHeight,
      this.x,
      this.y,
      this.width,
      this.height
    );
  }
}

function handleEnemies() {
  for (let i = 0; i < enemies.length; i++) {
    enemies[i].update();
    enemies[i].draw();
    if (enemies[i].x < 0) {
      gameOver = true;
    }
    if (enemies[i].health <= 0) {
      let gainedResourses = enemies[i].maxHealth / 10;
      floatingMessages.push(
        new floatingMessage(
          "+" + gainedResourses,
          enemies[i].x,
          enemies[i].y,
          20,
          "white"
        )
      );
      floatingMessages.push(
        new floatingMessage("+" + gainedResourses, 250, 50, 30, "white")
      );

      numberOfResources += gainedResourses;
      score += gainedResourses;

      const findThisIndex = enemyPositions.indexOf(enemies[i].y);
      enemyPositions.splice(findThisIndex, 1);
      enemies.splice(i, 1);
      i--;
    }
  }
  if (frame % enemiesInterval === 0 && score < winningScore) {
    let verticalPosition =
      Math.floor(Math.random() * 5 + 1) * cellSize + cellGap;
    enemies.push(new Enemy(verticalPosition));
    enemyPositions.push(verticalPosition);
    if (enemiesInterval > 120) enemiesInterval -= 50;
  }
}

// RESOURCES

const amounts = [20, 30, 40];
class Resource {
  constructor() {
    this.img = new Image();
    this.x = Math.random() * (canvas.width - cellSize);
    this.y = (Math.floor(Math.random() * 5) + 1) * cellSize + 25;
    this.width = cellSize * 0.9;
    this.height = cellSize * 0.9;
    this.amount = amounts[Math.floor(Math.random() * amounts.length)];
  }
  draw() {
    this.img.src = "./docs/images/money.PNG";
    ctx.drawImage(this.img, this.x, this.y, 100, 100);

    // ctx.fillStyle = "yellow";
    //ctx.fillRect(this.x, this.y, this.width, this.height);

    ctx.fillStyle = "white";
    ctx.font = "15px Orbitron";
    ctx.fillText(this.amount, this.x + 15, this.y + 25);
  }
}
function handleResources() {
  if (frame % 500 === 0 && score < winningScore) {
    resources.push(new Resource());
  }
  for (let i = 0; i < resources.length; i++) {
    resources[i].draw();
    if (resources[i] && mouse.x && mouse.y && collision(resources[i], mouse)) {
      numberOfResources += resources[i].amount;
      floatingMessages.push(
        new floatingMessage(
          "+" + resources[i].amount,
          resources[i].x,
          resources[i].y,
          30,
          "black"
        )
      );
      floatingMessages.push(
        new floatingMessage("+" + resources[i].amount, 250, 30, 30, "gold")
      );
      resources.splice(i, 1);
      i--;
    }
  }
}
//GAME OVER / WINS
function handleGameStatus() {
  ctx.fillStyle = "#A4D7E5 ";
  ctx.font = "20px Orbitron";
  ctx.fillText("Score: " + score, 700, 40);
  ctx.fillText("💰💰: " + numberOfResources, 700, 80);
  if (gameOver) {
    ctx.fillStyle = "white";
    ctx.font = "90px Orbitron";
    ctx.fillText("GAME OVER", 115, 300);
  }
  if (score >= winningScore && enemies.length === 0) {
    ctx.fillStyle = "white";
    ctx.font = "60px Orbitron ";
    ctx.fillText("LEVEL    COMPLETE", 130, 300);
    ctx.font = "30px Orbitron";
    ctx.fillText("You win with " + score + " points", 134, 340);
  }
}

canvas.addEventListener("click", function () {
  const gridPositionX = mouse.x - (mouse.x % cellSize) + cellGap;
  const gridPositionY = mouse.y - (mouse.y % cellSize) + cellGap;
  if (gridPositionY < cellSize) return;
  for (let i = 0; i < defenders.length; i++) {
    if (defenders[i].x === gridPositionX && defenders[i].y === gridPositionY)
      return;
  }
  let defenderCost = 100;
  if (numberOfResources >= defenderCost) {
    defenders.push(new Defender(gridPositionX, gridPositionY));
    numberOfResources -= defenderCost;
  } else {
    floatingMessages.push(
      new floatingMessage("need more resources", mouse.x, mouse.y, 20, "white")
    );
  }
});

function animate() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#33455C";
  ctx.fillRect(0, 0, controlsBar.width, controlsBar.height);
  handleGameGrid();
  handleDefenders();
  handleResources();
  handleProjectiles();
  handleEnemies();
  handleGameStatus();
  handleFloatingMessages();
  frame++;
  if (!gameOver) requestAnimationFrame(animate);
}
//animate();

function collision(first, second) {
  if (
    !(
      first.x > second.x + second.width ||
      first.x + first.width < second.x ||
      first.y > second.y + second.height ||
      first.y + first.height < second.y
    )
  ) {
    return true;
  }
}
window.addEventListener("resize", function () {
  canvasPosition = canvas.getBoundingClientRect();
});

const canvas1 = document.getElementById("canvas1");
const text = document.getElementById("text");
const btn = document.getElementById("start-button");
window.onload = () => {
  document.getElementById("start-button").onclick = () => {
    animate();
    canvas.style.display = "initial";
    btn.style.display = "none";
    text.style.display = "none";
  };
};

//flex or initial

// const canvas = document.getElementById("canvas1");
// const text = document.getElementById("text");
// const btn = document.getElementById("start-button");

// window.onload = () => {
//   document.getElementById("start-button").onclick = () => {
//     btn.style.display = "none";
//     text.style.display = "none";
//     canvas.style.display = "flex";
//     animate();
//   };
// };
