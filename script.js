const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const livesEl = document.getElementById('lives');
const levelEl = document.getElementById('level');
const mainMenu = document.getElementById('main-menu');
const gameOverMenu = document.getElementById('game-over-menu');
const winMenu = document.getElementById('win-menu');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');
const winRestartBtn = document.getElementById('win-restart-btn');
const finalScoreEl = document.getElementById('final-score');
const cheatToast = document.getElementById('cheat-toast');

const mainHighScoreEl = document.getElementById('main-highscore');
const gameOverHighScoreEl = document.getElementById('gameover-highscore');

canvas.width = 800;
canvas.height = 600;

let gameState = 'START';
let lives = 3;
let currentLevel = 1;
let animationId;
const MAX_LEVEL = 10;

let highscore = Math.min(parseInt(localStorage.getItem('neon_bounce_highscore') || '1'), MAX_LEVEL);

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playSound(type) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    const now = audioCtx.currentTime;
    
    if (type === 'jump') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(600, now + 0.1);
        gainNode.gain.setValueAtTime(0.1, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
    } else if (type === 'hit') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(50, now + 0.2);
        gainNode.gain.setValueAtTime(0.2, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
    } else if (type === 'portal') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.linearRampToValueAtTime(800, now + 0.3);
        osc.frequency.linearRampToValueAtTime(600, now + 0.5);
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(0.2, now + 0.2);
        gainNode.gain.linearRampToValueAtTime(0, now + 0.5);
        osc.start(now);
        osc.stop(now + 0.5);
    } else if (type === 'powerup') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(500, now);
        osc.frequency.setValueAtTime(800, now + 0.1);
        gainNode.gain.setValueAtTime(0.2, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
    }
}

const bgm = new Audio('assets/backsound.mp3');
bgm.loop = true;
bgm.volume = 0.4;

const GRAVITY = 0.55;
const FRICTION = 0.8;
const JUMP_FORCE = -11;
const SPEED = 5;

const keys = {
    ArrowLeft: false,
    ArrowRight: false,
    ArrowUp: false,
    a: false,
    d: false,
    w: false,
    ' ': false
};

const keysPressed = {
    ArrowUp: false,
    w: false,
    ' ': false
};

let typedCode = '';
const secretCode = 'kebal';
let isCheatActive = false;

window.addEventListener('keydown', (e) => {
    if (keys.hasOwnProperty(e.key)) {
        if (!keys[e.key] && keysPressed.hasOwnProperty(e.key)) {
            keysPressed[e.key] = true;
        }
        keys[e.key] = true;
        
        if (e.key === ' ') {
            e.preventDefault();
        }
    }
    
    typedCode += e.key.toLowerCase();
    
    if (typedCode.length > 10) {
        typedCode = typedCode.substring(typedCode.length - 10);
    }
    
    if (gameState === 'PLAYING') {
        if (typedCode.endsWith(secretCode) && !isCheatActive) {
            activateCheat();
        } else if (typedCode.endsWith('normal') && isCheatActive) {
            deactivateCheat();
        }
    }
});

window.addEventListener('keyup', (e) => {
    if (keys.hasOwnProperty(e.key)) {
        keys[e.key] = false;
    }
});

const btnLeft = document.getElementById('btn-left');
const btnRight = document.getElementById('btn-right');
const btnJump = document.getElementById('btn-jump');


function handleTouchStart(key) {
    if (keys.hasOwnProperty(key)) {
        if (!keys[key] && keysPressed.hasOwnProperty(key)) {
            keysPressed[key] = true;
        }
        keys[key] = true;
    }
}

function handleTouchEnd(key) {
    if (keys.hasOwnProperty(key)) {
        keys[key] = false;
    }
}

btnLeft.addEventListener('touchstart', (e) => { e.preventDefault(); handleTouchStart('ArrowLeft'); });
btnLeft.addEventListener('touchend', (e) => { e.preventDefault(); handleTouchEnd('ArrowLeft'); });
btnLeft.addEventListener('touchcancel', (e) => { e.preventDefault(); handleTouchEnd('ArrowLeft'); });

btnRight.addEventListener('touchstart', (e) => { e.preventDefault(); handleTouchStart('ArrowRight'); });
btnRight.addEventListener('touchend', (e) => { e.preventDefault(); handleTouchEnd('ArrowRight'); });
btnRight.addEventListener('touchcancel', (e) => { e.preventDefault(); handleTouchEnd('ArrowRight'); });

btnJump.addEventListener('touchstart', (e) => { e.preventDefault(); handleTouchStart('ArrowUp'); });
btnJump.addEventListener('touchend', (e) => { e.preventDefault(); handleTouchEnd('ArrowUp'); });
btnJump.addEventListener('touchcancel', (e) => { e.preventDefault(); handleTouchEnd('ArrowUp'); });

function activateCheat() {
    isCheatActive = true;
    player.invulnerable = true;
    playSound('powerup');
    

    cheatToast.classList.remove('hidden');
    cheatToast.querySelector('.msg').innerText = "GOD MODE ACTIVATED";
    
    document.body.style.setProperty('--neon-blue', '#ffd700'); 
    
    setTimeout(() => {
        cheatToast.classList.add('hidden');
    }, 3000);
}

function deactivateCheat() {
    isCheatActive = false;
    player.invulnerable = false;
    playSound('hit');
    
    cheatToast.classList.remove('hidden');
    cheatToast.querySelector('.msg').innerText = "GOD MODE DEACTIVATED";
    cheatToast.querySelector('.icon').innerText = "❌";
    
    document.body.style.setProperty('--neon-blue', '#00f3ff');
    
    setTimeout(() => {
        cheatToast.classList.add('hidden');
        setTimeout(() => cheatToast.querySelector('.icon').innerText = "⚡", 500); 
    }, 3000);
}


class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 15;
        this.vx = 0;
        this.vy = 0;
        this.isGrounded = false;
        this.invulnerable = false;
        this.color = '#00f3ff';
    }

    update() {

        this.vy += GRAVITY;
        

        if (keys.ArrowLeft || keys.a) {
            this.vx = -SPEED;
        } else if (keys.ArrowRight || keys.d) {
            this.vx = SPEED;
        } else {
            this.vx *= FRICTION; 
        }
        

        if ((keysPressed.ArrowUp || keysPressed.w || keysPressed[' ']) && this.isGrounded) {
            this.vy = JUMP_FORCE;
            this.isGrounded = false;
            playSound('jump');
            createParticles(this.x, this.y + this.radius, 10, '#ffffff'); 
        }
        

        keysPressed.ArrowUp = false;
        keysPressed.w = false;
        keysPressed[' '] = false;
        

        if (this.vy > 15) this.vy = 15;


        this.x += this.vx;
        this.y += this.vy;
        

        if (this.x - this.radius < 0) this.x = this.radius;
        if (this.x + this.radius > canvas.width) this.x = canvas.width - this.radius;
        

        if (this.y - this.radius > canvas.height) {
            if(!this.invulnerable) handleDeath();
            else {

                this.vy = 0;
                this.y = 0; 
                this.x = 50;
            }
        }
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        
        if (this.invulnerable) {
            ctx.fillStyle = '#ffd700';
            ctx.shadowColor = '#ffd700';
            ctx.shadowBlur = 20;
        } else {
            ctx.fillStyle = this.color;
            ctx.shadowColor = this.color;
            ctx.shadowBlur = 15;
        }
        
        ctx.fill();
        ctx.shadowBlur = 0; 
        ctx.closePath();
    }
}

class Platform {
    constructor(x, y, w, h, type = 'normal') {
        this.x = x;
        this.y = y;
        this.width = w;
        this.height = h;
        this.type = type; 
    }

    draw() {
        if (this.type === 'bounce') {

            ctx.fillStyle = 'rgba(255, 0, 234, 0.4)';
            ctx.strokeStyle = '#ff00ea';
            ctx.shadowColor = '#ff00ea';
        } else {

            ctx.fillStyle = 'rgba(10, 20, 40, 0.8)';
            ctx.strokeStyle = '#00f3ff';
            ctx.shadowColor = '#00f3ff';
        }
        
        ctx.lineWidth = 2;
        ctx.shadowBlur = 10;
        

        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.strokeRect(this.x, this.y, this.width, this.height);
        

        if (this.type === 'bounce') {
            ctx.fillStyle = 'rgba(255, 0, 234, 0.6)';
            ctx.fillRect(this.x + 5, this.y + 5, this.width - 10, 2);
            ctx.fillStyle = '#ff00ea';
            ctx.font = "bold 12px Orbitron";
            ctx.fillText('↑', this.x + this.width/2 - 4, this.y + this.height/2 + 5);
        } else {
            ctx.fillStyle = 'rgba(0, 243, 255, 0.3)';
            ctx.fillRect(this.x + 5, this.y + 5, this.width - 10, 2);
        }
        
        ctx.shadowBlur = 0; 
    }
}

class Spike {
    constructor(x, y, count) {
        this.x = x;
        this.y = y;
        this.width = 20 * count;
        this.height = 20;
        this.count = count;
    }

    draw() {
        ctx.fillStyle = '#ff2a2a';
        ctx.shadowColor = '#ff2a2a';
        ctx.shadowBlur = 15;
        

        ctx.beginPath();
        for (let i = 0; i < this.count; i++) {
            let startX = this.x + (i * 20);
            ctx.moveTo(startX, this.y);
            ctx.lineTo(startX + 10, this.y - this.height);
            ctx.lineTo(startX + 20, this.y);
        }
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;
    }
}

class Portal {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 25;
        this.angle = 0;
    }

    draw() {
        this.angle += 0.05;
        
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        
        ctx.beginPath();

        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.shadowColor = '#ff00ea';
        ctx.shadowBlur = 25;
        ctx.fill();
        

        ctx.beginPath();
        ctx.arc(0, 0, this.radius + 10, 0, Math.PI * 1.5);
        ctx.strokeStyle = '#39ff14';
        ctx.lineWidth = 4;
        ctx.stroke();
        
        ctx.restore();
    }
}


let particles = [];
function createParticles(x, y, count, color) {
    for (let i = 0; i < count; i++) {
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 5,
            vy: (Math.random() - 0.5) * 5,
            life: 1.0,
            color: color
        });
    }
}

function updateDrawParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        let p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.05;
        
        if (p.life <= 0) {
            particles.splice(i, 1);
            continue;
        }
        
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3, 0, Math.PI*2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
    }
}


let player;
let platforms = [];
let spikes = [];
let portal;


const LEVELS = [

    {
        player: { x: 50, y: 400 },
        platforms: [
            { x: 0, y: 550, w: 800, h: 50 },
            { x: 150, y: 450, w: 150, h: 20 },
            { x: 350, y: 350, w: 100, h: 20 },
            { x: 500, y: 250, w: 100, h: 20 }
        ],
        spikes: [
            { x: 300, y: 550, count: 3 }
        ],
        portal: { x: 550, y: 190 }
    },

    {
        player: { x: 50, y: 500 },
        platforms: [
            { x: 0, y: 550, w: 200, h: 50 },
            { x: 250, y: 550, w: 100, h: 50, type: 'bounce' },
            { x: 350, y: 380, w: 100, h: 20 },
            { x: 200, y: 280, w: 100, h: 20 },
            { x: 80, y: 180, w: 100, h: 20 },
            { x: 220, y: 100, w: 300, h: 20 }
        ],
        spikes: [
            { x: 200, y: 550, count: 2 },
            { x: 350, y: 550, count: 20 }
        ],
        portal: { x: 450, y: 50 }
    },

    {
        player: { x: 50, y: 500 },
        platforms: [
            { x: 0, y: 550, w: 100, h: 50 },
            { x: 120, y: 480, w: 80, h: 20 },
            { x: 220, y: 400, w: 80, h: 20 },
            { x: 320, y: 320, w: 80, h: 20 },
            { x: 420, y: 240, w: 80, h: 20 },
            { x: 520, y: 160, w: 80, h: 20 },
            { x: 620, y: 100, w: 100, h: 20 }
        ],
        spikes: [
            { x: 100, y: 550, count: 35 }
        ],
        portal: { x: 670, y: 50 }
    },

    {
        player: { x: 50, y: 400 },
        platforms: [
            { x: 0, y: 550, w: 200, h: 50 },
            { x: 260, y: 550, w: 100, h: 50, type: 'bounce' },
            { x: 420, y: 550, w: 150, h: 50 },
            { x: 200, y: 350, w: 120, h: 20 },
            { x: 450, y: 250, w: 100, h: 20 }
        ],
        spikes: [
            { x: 200, y: 550, count: 3 },
            { x: 360, y: 550, count: 3 }
        ],
        portal: { x: 500, y: 200 }
    },

    {
        player: { x: 350, y: 500 },
        platforms: [
            { x: 300, y: 550, w: 150, h: 50 },
            { x: 200, y: 480, w: 100, h: 20 },
            { x: 400, y: 410, w: 100, h: 20 },
            { x: 250, y: 340, w: 100, h: 20, type: 'bounce' },
            { x: 400, y: 150, w: 100, h: 20 }
        ],
        spikes: [
            { x: 0, y: 580, count: 40 }
        ],
        portal: { x: 450, y: 80 }
    },

    {
        player: { x: 50, y: 200 },
        platforms: [
            { x: 0, y: 250, w: 150, h: 20 },
            { x: 200, y: 350, w: 150, h: 20 },
            { x: 400, y: 450, w: 150, h: 20 },
            { x: 600, y: 550, w: 150, h: 50 }
        ],
        spikes: [
            { x: 0, y: 600, count: 40 },
            { x: 200, y: 350, count: 2 }
        ],
        portal: { x: 650, y: 490 }
    },

    {
        player: { x: 50, y: 500 },
        platforms: [
            { x: 0, y: 550, w: 150, h: 50 },
            { x: 150, y: 450, w: 100, h: 20 },
            { x: 50, y: 350, w: 100, h: 20 },
            { x: 150, y: 250, w: 100, h: 20 },
            { x: 50, y: 150, w: 100, h: 20 },
            { x: 200, y: 150, w: 500, h: 20 }
        ],
        spikes: [
            { x: 150, y: 550, count: 35 },
            { x: 300, y: 150, count: 3 },
            { x: 450, y: 150, count: 3 },
            { x: 600, y: 150, count: 3 }
        ],
        portal: { x: 680, y: 90 }
    },

    {
        player: { x: 50, y: 500 },
        platforms: [
            { x: 0, y: 550, w: 80, h: 50 },
            { x: 120, y: 500, w: 80, h: 100 },
            { x: 240, y: 450, w: 80, h: 150 },
            { x: 360, y: 400, w: 80, h: 200 },
            { x: 480, y: 350, w: 80, h: 250 },
            { x: 600, y: 300, w: 80, h: 300 }
        ],
        spikes: [
            { x: 0, y: 600, count: 40 }
        ],
        portal: { x: 640, y: 240 }
    },

    {
        player: { x: 50, y: 500 },
        platforms: [
            { x: 0, y: 550, w: 150, h: 50 },
            { x: 200, y: 350, w: 400, h: 20 },
            { x: 200, y: 550, w: 80, h: 50 },
            { x: 330, y: 550, w: 80, h: 50 },
            { x: 460, y: 550, w: 80, h: 50 },
            { x: 600, y: 550, w: 150, h: 50 }
        ],
        spikes: [
            { x: 150, y: 580, count: 3 },
            { x: 280, y: 550, count: 3 },
            { x: 410, y: 550, count: 3 },
            { x: 540, y: 550, count: 3 }
        ],
        portal: { x: 700, y: 490 }
    },

    {
        player: { x: 50, y: 500 },
        platforms: [
            { x: 0, y: 550, w: 100, h: 50 },
            { x: 120, y: 480, w: 60, h: 20 },
            { x: 200, y: 410, w: 60, h: 20, type: 'bounce' },
            { x: 100, y: 300, w: 60, h: 20 },
            { x: 200, y: 200, w: 60, h: 20 },
            { x: 320, y: 150, w: 60, h: 20 },
            { x: 440, y: 250, w: 60, h: 20 },
            { x: 560, y: 350, w: 150, h: 250 }
        ],
        spikes: [
            { x: 100, y: 600, count: 40 }
        ],
        portal: { x: 650, y: 300 }
    }
];

function loadLevel(num) {
    platforms = [];
    spikes = [];
    particles = [];
    
    const lvlIndex = num - 1;
    if (lvlIndex >= 0 && lvlIndex < LEVELS.length) {
        const lvl = LEVELS[lvlIndex];
        player = new Player(lvl.player.x, lvl.player.y);
        lvl.platforms.forEach(p => {
            platforms.push(new Platform(p.x, p.y, p.w, p.h, p.type || 'normal'));
        });
        lvl.spikes.forEach(s => {
            spikes.push(new Spike(s.x, s.y, s.count));
        });
        portal = new Portal(lvl.portal.x, lvl.portal.y);
    } else {

        player = new Player(50, 400);
        platforms.push(new Platform(0, 550, 800, 50));
        portal = new Portal(750, 500);
    }
}


function checkCollisions() {
    player.isGrounded = false;
    
    platforms.forEach(plat => {

        let closestX = Math.max(plat.x, Math.min(player.x, plat.x + plat.width));
        let closestY = Math.max(plat.y, Math.min(player.y, plat.y + plat.height));
        
        let dx = player.x - closestX;
        let dy = player.y - closestY;
        let distanceSquared = (dx * dx) + (dy * dy);
        
        if (distanceSquared < (player.radius * player.radius)) {
            let distance = Math.sqrt(distanceSquared);
            let nx = 0;
            let ny = 0;
            let overlap = 0;
            
            if (distance > 0) {
                nx = dx / distance;
                ny = dy / distance;
                overlap = player.radius - distance;
            } else {

                let leftDist = player.x - plat.x;
                let rightDist = (plat.x + plat.width) - player.x;
                let topDist = player.y - plat.y;
                let bottomDist = (plat.y + plat.height) - player.y;
                
                let minDist = Math.min(leftDist, rightDist, topDist, bottomDist);
                if (minDist === topDist) {
                    ny = -1;
                    overlap = player.radius + topDist;
                } else if (minDist === bottomDist) {
                    ny = 1;
                    overlap = player.radius + bottomDist;
                } else if (minDist === leftDist) {
                    nx = -1;
                    overlap = player.radius + leftDist;
                } else {
                    nx = 1;
                    overlap = player.radius + rightDist;
                }
            }
            

            player.x += nx * overlap;
            player.y += ny * overlap;
            

            if (ny < -0.7) { 
                player.vy = 0;
                if (plat.type === 'bounce') {
                    player.vy = JUMP_FORCE * 1.6; 
                    playSound('jump');
                    createParticles(player.x, plat.y, 20, '#ff00ea');
                } else {
                    player.isGrounded = true;
                }
            } else if (ny > 0.7) { 
                player.vy = 0;
            }
            
            if (Math.abs(nx) > 0.7) { 
                player.vx = 0;
            }
        }
    });
    

    if (!player.invulnerable) {
        spikes.forEach(s => {
            if (player.x + player.radius > s.x + 5 && 
                player.x - player.radius < s.x + s.width - 5 &&
                player.y + player.radius > s.y - s.height &&
                player.y - player.radius < s.y) {
                    handleDeath();
            }
        });
    }


    if (portal) {
        let dx = player.x - portal.x;
        let dy = player.y - portal.y;
        if (Math.sqrt(dx*dx + dy*dy) < player.radius + portal.radius) {
            playSound('portal');
            levelComplete();
        }
    }
}


function updateUI() {
    let hearts = '';
    for (let i = 0; i < 3; i++) {
        hearts += (i < lives) ? '❤️' : '🖤';
    }
    livesEl.innerText = hearts;
    levelEl.innerText = currentLevel;
}

function updateHighScores() {
    mainHighScoreEl.innerText = highscore;
    gameOverHighScoreEl.innerText = highscore;
}

function drawBackground() {

    ctx.strokeStyle = 'rgba(0, 243, 255, 0.05)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 0; x < canvas.width; x += 40) {
        ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height);
    }
    for (let y = 0; y < canvas.height; y += 40) {
        ctx.moveTo(0, y); ctx.lineTo(canvas.width, y);
    }
    ctx.stroke();
}


function gameLoop() {
    if (gameState === 'GAME_OVER' || gameState === 'START') return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    drawBackground();
    
    if (gameState === 'PLAYING') {
        player.update();
        checkCollisions();
    }
    

    platforms.forEach(p => p.draw());
    spikes.forEach(s => s.draw());
    if (portal) portal.draw();
    if (gameState === 'PLAYING') player.draw(); 
    updateDrawParticles();
    
    if (gameState === 'PLAYING') updateUI();
    
    animationId = requestAnimationFrame(gameLoop);
}


function startGame() {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    bgm.play().catch(e => console.log('BGM Play error (interaction required):', e));
    
    gameState = 'PLAYING';
    lives = 3;
    currentLevel = 1;
    typedCode = ''; 
    

    isCheatActive = false;
    document.body.style.setProperty('--neon-blue', '#00f3ff');
    cheatToast.classList.add('hidden');
    
    loadLevel(currentLevel);
    
    mainMenu.classList.add('hidden');
    gameOverMenu.classList.add('hidden');
    winMenu.classList.add('hidden');
    
    if (animationId) cancelAnimationFrame(animationId);
    gameLoop();
}

function handleDeath() {
    playSound('hit');
    createParticles(player.x, player.y, 30, '#ff2a2a');
    
    lives--;
    
    if (lives <= 0) {
        gameOver();
    } else {
        gameState = 'RESPAWNING'; 
        
        setTimeout(() => {
            loadLevel(currentLevel);

            if (isCheatActive) player.invulnerable = true;
            gameState = 'PLAYING';
        }, 1000); 
    }
}

function gameOver() {
    gameState = 'GAME_OVER';
    bgm.pause();
    bgm.currentTime = 0;
    

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    platforms.forEach(p => p.draw());
    spikes.forEach(s => s.draw());
    updateDrawParticles();
    

    const scoreToSave = Math.min(currentLevel, MAX_LEVEL);
    if (scoreToSave > highscore) {
        highscore = scoreToSave;
        localStorage.setItem('neon_bounce_highscore', highscore.toString());
    }
    updateHighScores();
    
    setTimeout(() => {
        gameOverMenu.classList.remove('hidden');
        finalScoreEl.innerText = currentLevel;
    }, 500);
}

function levelComplete() {
    currentLevel++;
    

    const scoreToSave = Math.min(currentLevel, MAX_LEVEL);
    if (scoreToSave > highscore) {
        highscore = scoreToSave;
        localStorage.setItem('neon_bounce_highscore', highscore.toString());
    }
    

    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.fillRect(0,0, canvas.width, canvas.height);
    
    if (currentLevel > MAX_LEVEL) {

        gameState = 'WIN';
        bgm.pause();
        bgm.currentTime = 0;
        playSound('powerup');
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        platforms.forEach(p => p.draw());
        player.draw();
        
        winMenu.classList.remove('hidden');
    } else {
        loadLevel(currentLevel);

        if (isCheatActive) player.invulnerable = true;
    }
}


startBtn.addEventListener('click', () => {
    startBtn.blur(); 
    startGame();
});
restartBtn.addEventListener('click', () => {
    restartBtn.blur();
    startGame();
});
winRestartBtn.addEventListener('click', () => {
    winRestartBtn.blur();
    startGame();
});


updateHighScores();


ctx.fillStyle = '#111122';
ctx.fillRect(0, 0, canvas.width, canvas.height);
drawBackground();


let savedAudioTime = 0;
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        if (gameState === 'PLAYING') {
            savedAudioTime = bgm.currentTime;
            bgm.pause();
            bgm.removeAttribute('src');
            bgm.load();
        }
        if (audioCtx.state === 'running') audioCtx.suspend();
        
        if ('mediaSession' in navigator) {
            navigator.mediaSession.playbackState = 'none';
        }
    } else {
        if (gameState === 'PLAYING') {
            if (!bgm.src || bgm.src === '' || !bgm.src.includes('backsound.mp3')) {
                bgm.src = 'assets/backsound.mp3';
                bgm.currentTime = savedAudioTime;
            }
            bgm.play().catch(e => console.log('Resume blocked:', e));
        }
        if (audioCtx.state === 'suspended') audioCtx.resume();
        
        if ('mediaSession' in navigator && gameState === 'PLAYING') {
            navigator.mediaSession.playbackState = 'playing';
        }
    }
});
