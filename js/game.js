/**
 * Game — Core engine, state machine, loop, and coordination.
 * FIXED: Game freezes on death, pixel-perfect collision, wind animation.
 */

import { Bird } from './bird.js';
import { PipeManager } from './pipes.js';
import { WindSystem } from './wind.js';
import { Background } from './background.js';
import { ParticleSystem } from './particles.js';
import { AudioManager } from './audio.js';
import { UI } from './ui.js';

export class Game {
constructor(canvas) {
  this.canvas = canvas;
  this.ctx = canvas.getContext('2d');

  // Derive world height from the real screen aspect BEFORE building
  // Bird/PipeManager/Background, since they store GAME_W/GAME_H internally.
  const rect = canvas.parentElement.getBoundingClientRect();
  this.GAME_W = 480;
  this.GAME_H = Math.round(this.GAME_W * (rect.height / rect.width));

    this.GRAVITY = 0.25;
    this.MAX_FALL_SPEED = 6.0;
    this.FLAP_IMPULSE = -4.5;

    // TALLER ground
    this.groundHeight = 35;

    this.state = 'START';
    this.score = 0;
    this.highScore = this._loadHighScore();
    this.lastTime = 0;
    this.shakeTimer = 0;
    this.shakeIntensity = 0;
    this.flashTimer = 0;
    this.frameCount = 0;
    this.isMobile = window.innerWidth <= 480;
    this.gameOverFrame = 0; // Track frames since game over

    this.audio = new AudioManager();
    this.ui = new UI();
    // Pass groundHeight to Bird & Background
    this.bird = new Bird(this.GAME_W, this.GAME_H, this.groundHeight);
    this.pipes = new PipeManager(this.GAME_W, this.GAME_H);
    this.wind = new WindSystem(this.GAME_W, this.GAME_H);
    this.bg = new Background(this.GAME_W, this.GAME_H, this.groundHeight);
    this.particles = new ParticleSystem();

    this.pipes.onSpeedUp = (speed) => {
      this.ui.showSpeedUp(speed);
    };

    this.ui.onStart = () => this.startGame();
    this.ui.onRestart = () => this.startGame();
    this.ui.onMuteToggle = () => this.toggleMute();

    this.ui.updateHighScore(this.highScore);
    this.ui.setMuteIcon(this.audio.muted);
    this.ui.showStartScreen();

    this._resize();
    this.bg.setMobileMode(this.isMobile);

    this._loop = this._loop.bind(this);
  }

  _loadHighScore() {
    try {
      const val = localStorage.getItem('flappy_high_score');
      return val ? parseInt(val, 10) : 0;
    } catch (e) {
      return 0;
    }
  }

  _saveHighScore() {
    try {
      localStorage.setItem('flappy_high_score', this.highScore.toString());
    } catch (e) {}
  }

  toggleMute() {
    const muted = this.audio.toggleMute();
    this.ui.setMuteIcon(muted);
  }

  startGame() {
    this.audio.init();
    this.audio.resume();
    this.state = 'PLAYING';
    this.score = 0;
    this.frameCount = 0;
    this.gameOverFrame = 0;
    this.shakeTimer = 0;
    this.flashTimer = 0;

    this.bird.reset();
    this.pipes.reset();
    this.wind.reset();
    this.particles = new ParticleSystem();

    this.ui.updateScore(0);
    this.ui.updateHighScore(this.highScore);
    this.ui.hideStartScreen();
    this.ui.hideGameOver();
    this.ui.hideWindIndicator();
    this.ui.focusCanvas();
  }

  gameOver() {
    if (this.state !== 'PLAYING') return;
    this.state = 'GAMEOVER';
    this.bird.alive = false;
    this.gameOverFrame = this.frameCount;

    this.shakeTimer = 12;
    this.shakeIntensity = 5;
    this.flashTimer = 6;

    this.particles.spawnBurst(this.bird.x, this.bird.y, 30);

    this.audio.playCrash();
    setTimeout(() => this.audio.playGameOver(), 200);

    if (this.score > this.highScore) {
      this.highScore = this.score;
      this._saveHighScore();
    }

    setTimeout(() => {
      this.ui.showGameOver(this.score, this.highScore);
    }, 600);
  }

  flap() {
    if (this.state === 'START') {
      this.startGame();
      return;
    }
    if (this.state === 'GAMEOVER') {
      // Require at least 1 second after game over before restart
      if (this.frameCount - this.gameOverFrame > 60) {
        this.startGame();
      }
      return;
    }
    if (this.state === 'PLAYING') {
      this.bird.flap();
      this.audio.playFlap();
    }
  }

_resize() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const container = this.canvas.parentElement;
  const rect = container.getBoundingClientRect();

  this.canvas.style.width = rect.width + 'px';
  this.canvas.style.height = rect.height + 'px';

  this.canvas.width = Math.floor(rect.width * dpr);
  this.canvas.height = Math.floor(rect.height * dpr);

  // Re-derive world height in case aspect ratio changed (rotation, desktop resize)
  this.GAME_H = Math.round(this.GAME_W * (rect.height / rect.width));

  this.renderScale = this.canvas.width / this.GAME_W;
  this.offsetX = 0;
  this.offsetY = 0;

  this.dpr = dpr;
  this.isMobile = window.innerWidth <= 480;
  this.bg.setMobileMode(this.isMobile);
}

  _loop(timestamp) {
    requestAnimationFrame(this._loop);

    if (!this.lastTime) this.lastTime = timestamp;
    const rawDelta = timestamp - this.lastTime;
    this.lastTime = timestamp;

    const dt = Math.min(rawDelta / 16.667, 3);
    this.frameCount += dt;

    this.update(dt);
    this.draw();
  }

  update(dt) {
    // Background: only scroll during PLAYING, freeze during GAMEOVER
    const bgSpeed = this.state === 'PLAYING' ? this.pipes.speed : 
                    this.state === 'START' ? 0.5 : 0;
    this.bg.update(bgSpeed, dt);

    // Particles: always update positions (for falling effect), but don't spawn new ones in GAMEOVER
    this.particles.update(dt);

    if (this.state === 'START') {
      this.bird.update(this.GRAVITY, this.MAX_FALL_SPEED, dt, true);
      return;
    }

    if (this.state === 'PLAYING') {
      // Wind with WARNING phase
      this.wind.update(dt,
        (dir) => {
          this.ui.showWindWarning(dir);
        },
        (dir) => {
          this.particles.spawnWindLeaves(dir, this.GAME_W, this.GAME_H);
          this.particles.spawnWindLeaves(dir, this.GAME_W, this.GAME_H);
          this.ui.showWindTelegraph(dir);
          this.audio.playWind();
        },
        (dir, mult) => {
          this.pipes.setSpeedMultiplier(mult);
          this.ui.showWindGust(dir);
        },
        () => {
          this.pipes.setSpeedMultiplier(1.0);
          this.ui.hideWindIndicator();
        }
      );

      // Apply wind physics to bird
      if (this.wind.isActive()) {
        this.bird.applyWind(this.wind.getDirection(), this.wind.getWindStrength());
      }

      // Spawn leaves during telegraph
      if (this.wind.isTelegraph() && Math.random() < 0.2 * dt) {
        this.particles.spawnWindLeaves(this.wind.getDirection(), this.GAME_W, this.GAME_H);
      }

      // Bird
      this.bird.update(this.GRAVITY, this.MAX_FALL_SPEED, dt, false, this.wind.isGust());

      // Trail particles during play
      if (this.frameCount % 3 < dt) {
        this.particles.spawnTrail(this.bird.x - 10, this.bird.y);
      }

      // Pipes
      const prevScore = this.pipes.score;
      this.pipes.update(dt, this.bird);

      if (this.pipes.score > prevScore) {
        this.score = this.pipes.score;
        this.ui.updateScore(this.score);
        this.audio.playScore();
        this.pipes.updateSpeedForScore(this.score);

        const nextX = this.pipes.getNextPipeX();
        this.particles.spawnScoreConfetti(nextX + 30, this.GAME_H / 2);

        if (this.score % 10 === 0) {
          this.ui.showMilestone(this.score);
        }
      }

      // Collisions
      if (this.pipes.collidesWith(this.bird.getHitbox())) {
        this.gameOver();
      }
      // Use this.groundHeight for ground collision
      if (this.bird.y + this.bird.height / 2 >= this.GAME_H - this.groundHeight) {
        this.gameOver();
      }

      if (this.shakeTimer > 0) this.shakeTimer -= dt;
      if (this.flashTimer > 0) this.flashTimer -= dt;
      return; // END OF PLAYING BLOCK
    }

    // GAMEOVER STATE — FREEZE EVERYTHING
    if (this.state === 'GAMEOVER') {
      // Only bird falls to ground, nothing else moves/spawns
      this.bird.update(this.GRAVITY, this.MAX_FALL_SPEED, dt);

      // Decay effects
      if (this.shakeTimer > 0) this.shakeTimer -= dt;
      if (this.flashTimer > 0) this.flashTimer -= dt;

      // Stop wind immediately
      this.wind.windStrength = 0;
      this.wind.speedMultiplier = 1.0;

      // Reset wind state to prevent animations
      this.wind.state = 'IDLE';
    }
  }

  draw() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    ctx.clearRect(0, 0, w, h);
    ctx.save();

    if (this.shakeTimer > 0) {
      const intensity = this.shakeIntensity * (this.shakeTimer / 12);
      ctx.translate(
        (Math.random() - 0.5) * intensity * 2,
        (Math.random() - 0.5) * intensity * 2
      );
    }

    ctx.translate(this.offsetX, this.offsetY);
    ctx.scale(this.renderScale, this.renderScale);

    this.bg.draw(ctx);

    // Draw taller ground using this.groundHeight
    ctx.fillStyle = '#795548';
    ctx.fillRect(-100, this.GAME_H - this.groundHeight, this.GAME_W + 200, this.groundHeight);
    ctx.fillStyle = '#8D6E63';
    ctx.fillRect(-100, this.GAME_H - this.groundHeight, this.GAME_W + 200, Math.max(3, this.groundHeight * 0.15));

    // Only draw pipes if playing or just died (show final state)
    this.pipes.draw(ctx);
    this.bird.draw(ctx);
    this.particles.draw(ctx);

    // Wind warning border flash — ONLY during PLAYING
    if (this.state === 'PLAYING' && this.wind.isWarning()) {
      this._drawWindWarning(ctx);
    }

    // Wind streaks during gust — ONLY during PLAYING
    if (this.state === 'PLAYING' && this.wind.isGust()) {
      this._drawWindStreaks(ctx);
    }

    // Wind text on canvas — ONLY during PLAYING
    if (this.state === 'PLAYING' && (this.wind.isTelegraph() || this.wind.isGust())) {
      this._drawWindText(ctx);
    }

    ctx.restore();

    if (this.flashTimer > 0) {
      ctx.save();
      ctx.fillStyle = `rgba(255, 255, 255, ${0.3 * (this.flashTimer / 6)})`;
      ctx.fillRect(0, 0, w, h);
      ctx.restore();
    }
  }

  _drawWindWarning(ctx) {
    const progress = this.wind.getWarningProgress();
    const alpha = 0.3 * Math.sin(progress * Math.PI * 4);
    ctx.save();
    ctx.strokeStyle = `rgba(255, 255, 0, ${Math.abs(alpha) + 0.2})`;
    ctx.lineWidth = 6;
    ctx.strokeRect(3, 3, this.GAME_W - 6, this.GAME_H - 6);

    const cornerSize = 20 + Math.sin(progress * Math.PI * 8) * 10;
    ctx.fillStyle = `rgba(255, 200, 0, ${Math.abs(alpha) + 0.3})`;

    ctx.beginPath();
    ctx.moveTo(0, cornerSize);
    ctx.lineTo(0, 0);
    ctx.lineTo(cornerSize, 0);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(this.GAME_W - cornerSize, 0);
    ctx.lineTo(this.GAME_W, 0);
    ctx.lineTo(this.GAME_W, cornerSize);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(0, this.GAME_H - cornerSize);
    ctx.lineTo(0, this.GAME_H);
    ctx.lineTo(cornerSize, this.GAME_H);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(this.GAME_W - cornerSize, this.GAME_H);
    ctx.lineTo(this.GAME_W, this.GAME_H);
    ctx.lineTo(this.GAME_W, this.GAME_H - cornerSize);
    ctx.fill();

    ctx.restore();
  }

  _drawWindText(ctx) {
    const dir = this.wind.getDirection();
    const isTelegraph = this.wind.isTelegraph();
    const isGust = this.wind.isGust();

    ctx.save();
    ctx.font = 'bold 28px system-ui, sans-serif';
    ctx.textAlign = 'center';

    if (isTelegraph) {
      const alpha = 0.6 + Math.sin(this.frameCount * 0.1) * 0.3;
      ctx.fillStyle = `rgba(255, 230, 100, ${alpha})`;
      ctx.fillText('⚠ WIND COMING!', this.GAME_W / 2, this.GAME_H * 0.25);
    } else if (isGust) {
      const alpha = 0.7 + Math.sin(this.frameCount * 0.15) * 0.2;
      const text = dir === 1 ? '💨 HEADWIND!' : '💨 TAILWIND!';
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.fillText(text, this.GAME_W / 2, this.GAME_H * 0.25);
    }

    ctx.restore();
  }

  // Two completely distinct air animations:
  // Headwind = fast, warm, aggressive streaks blowing LEFT → RIGHT
  // Tailwind = smooth, cool, slower streaks blowing RIGHT → LEFT
  _drawWindStreaks(ctx) {
    const dir = this.wind.getDirection();
    const progress = this.wind.getGustProgress();
    const alpha = 0.5 * (1 - progress);
    ctx.save();

    if (dir === 1) {
      // HEADWIND: air going LEFT → RIGHT
      // Fast, aggressive, warm, many streaks + dust particles
      ctx.fillStyle = `rgba(255, 200, 100, ${0.08 * (1 - progress)})`;
      ctx.fillRect(0, 0, this.GAME_W, this.GAME_H);

      ctx.strokeStyle = `rgba(255, 240, 200, ${alpha})`;
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';

      for (let i = 0; i < 30; i++) {
        const y = (i / 30) * this.GAME_H + Math.sin(this.frameCount * 0.05 + i * 2.7) * 40;
        const speed = 12;
        const offset = (this.frameCount * speed) % (this.GAME_W + 400);
        const x1 = offset - 200;
        const x2 = x1 + 80 + Math.sin(this.frameCount * 0.03 + i) * 20;
        const y2 = y + 8 + Math.sin(this.frameCount * 0.04 + i * 1.3) * 6;

        ctx.beginPath();
        ctx.moveTo(x1, y);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }

      // Dust particles for headwind
      ctx.fillStyle = `rgba(255, 220, 150, ${alpha * 0.6})`;
      for (let i = 0; i < 15; i++) {
        const y = (i / 15) * this.GAME_H + Math.sin(this.frameCount * 0.06 + i * 4) * 50;
        const speed = 10;
        const offset = (this.frameCount * speed + i * 67) % (this.GAME_W + 100);
        const x = offset - 50;
        ctx.beginPath();
        ctx.arc(x, y, 1.5 + Math.sin(this.frameCount * 0.1 + i), 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      // TAILWIND: air going RIGHT → LEFT
      // Smooth, cool, slower, fewer streaks + feather particles
      ctx.fillStyle = `rgba(150, 200, 255, ${0.08 * (1 - progress)})`;
      ctx.fillRect(0, 0, this.GAME_W, this.GAME_H);

      ctx.strokeStyle = `rgba(200, 230, 255, ${alpha})`;
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';

      for (let i = 0; i < 18; i++) {
        const y = (i / 18) * this.GAME_H + Math.cos(this.frameCount * 0.03 + i * 2.2) * 45;
        const speed = 7;
        const offset = (this.frameCount * speed) % (this.GAME_W + 400);
        const x1 = this.GAME_W + 200 - offset;
        const x2 = x1 - 100 - Math.cos(this.frameCount * 0.02 + i) * 25;
        const y2 = y - 6 + Math.cos(this.frameCount * 0.03 + i * 1.5) * 5;

        ctx.beginPath();
        ctx.moveTo(x1, y);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }

      // Feather particles for tailwind
      ctx.fillStyle = `rgba(180, 220, 255, ${alpha * 0.5})`;
      for (let i = 0; i < 10; i++) {
        const y = (i / 10) * this.GAME_H + Math.cos(this.frameCount * 0.04 + i * 3.5) * 60;
        const speed = 6;
        const offset = (this.frameCount * speed + i * 89) % (this.GAME_W + 100);
        const x = this.GAME_W + 50 - offset;
        ctx.beginPath();
        ctx.arc(x, y, 2 + Math.cos(this.frameCount * 0.08 + i) * 0.8, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  }

  start() {
    requestAnimationFrame(this._loop);
  }
}