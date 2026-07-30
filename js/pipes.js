/**
 * Pipes — Obstacle system with standard and moving variants.
 * Speed increases by 20% of CURRENT speed every 10 points (compound).
 */

export class Pipe {
  constructor(x, gapY, gapHeight, width, isMoving = false) {
    this.x = x;
    this.gapY = gapY;
    this.gapHeight = gapHeight;
    this.width = width;
    this.isMoving = isMoving;
    this.passed = false;
    this.movePhase = Math.random() * Math.PI * 2;
    this.moveAmp = 40;
    this.moveSpeed = 0.002;
    this.baseGapY = gapY;
  }

  update(speed, dt, gameHeight) {
    this.x -= speed * dt;
    if (this.isMoving) {
      this.movePhase += this.moveSpeed * dt;
      this.gapY = this.baseGapY + Math.sin(this.movePhase) * this.moveAmp;
      const minGap = 60;
      const maxGap = gameHeight - 60 - this.gapHeight;
      this.gapY = Math.max(minGap, Math.min(maxGap, this.gapY));
    }
  }

  draw(ctx, gameHeight) {
    const capHeight = 24;
    const color = this.isMoving ? '#FF9800' : '#56AB2F';
    const darkColor = this.isMoving ? '#F57C00' : '#2E7D32';
    const capColor = this.isMoving ? '#FFB74D' : '#A5D6A7';

    const gapStart = this.gapY + capHeight;
    const gapEnd = gapStart + this.gapHeight;

    // TOP PIPE BODY — from y=0 to gapY (can be 0 height if gapY=0)
    if (this.gapY > 0) {
      ctx.fillStyle = color;
      ctx.fillRect(this.x, 0, this.width, this.gapY);
      
      // Highlight on pipe body
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      ctx.fillRect(this.x + 4, 0, 6, this.gapY);
    }
    
    // Top cap — always drawn at gapY (even if gapY=0, cap sits at top edge)
    ctx.fillStyle = capColor;
    ctx.fillRect(this.x - 2, this.gapY, this.width + 4, capHeight);
    ctx.strokeStyle = darkColor;
    ctx.lineWidth = 2;
    ctx.strokeRect(this.x - 2, this.gapY, this.width + 4, capHeight);

    // BOTTOM CAP
    ctx.fillStyle = capColor;
    ctx.fillRect(this.x - 2, gapEnd, this.width + 4, capHeight);
    ctx.strokeStyle = darkColor;
    ctx.strokeRect(this.x - 2, gapEnd, this.width + 4, capHeight);
    
    // BOTTOM PIPE BODY — from below cap to ground
    ctx.fillStyle = color;
    ctx.fillRect(this.x, gapEnd + capHeight, this.width, gameHeight - gapEnd - capHeight);

    // Highlight on bottom pipe
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.fillRect(this.x + 4, gapEnd + capHeight, 6, gameHeight - gapEnd - capHeight);
  }

  isOffScreen() {
    return this.x + this.width < -50;
  }
   collidesWith(hitbox) {
    const capHeight = 24;
    const pipeLeft = this.x;
    const pipeRight = this.x + this.width;
    const boxLeft = hitbox.x;
    const boxRight = hitbox.x + hitbox.w;
    const boxTop = hitbox.y;
    const boxBottom = hitbox.y + hitbox.h;

    // No collision if horizontally clear
    if (boxRight <= pipeLeft || boxLeft >= pipeRight) return false;

    // Gap boundaries (the SAFE zone)
    const gapStart = this.gapY + capHeight; // bottom of top cap
    const gapEnd = gapStart + this.gapHeight; // top of bottom cap

    // Hit top pipe or its cap? (anything above gapStart)
    if (boxTop < gapStart) return true;
    
    // Hit bottom pipe or its cap? (anything below gapEnd)
    if (boxBottom > gapEnd) return true;

    return false;
  }
}

export class PipeManager {
  constructor(gameWidth, gameHeight) {
    this.gameW = gameWidth;
    this.gameH = gameHeight;
    this.pipes = [];
    this.spawnTimer = 0;
    this.spawnInterval = 130;
    this.baseSpeed = 2.5;
    this.speed = this.baseSpeed;
    this.pipeWidth = 60;
    this.score = 0;
    this.currentTier = 0;
    this.onSpeedUp = null; // callback for speed up animation
  }

  reset() {
    this.pipes = [];
    this.spawnTimer = 0;
    this.spawnInterval = 130;
    this.baseSpeed = 2.5;
    this.speed = this.baseSpeed;
    this.score = 0;
    this.currentTier = 0;
  }

  /**
   * Compound speed increase: +20% of CURRENT speed every 10 points
   * 0-9: 2.5
   * 10-19: 2.5 * 1.2 = 3.0
   * 20-29: 3.0 * 1.2 = 3.6
   * 30-39: 3.6 * 1.2 = 4.32
   */
  updateSpeedForScore(score) {
    const tier = Math.floor(score / 10);
    if (tier > this.currentTier) {
      this.currentTier = tier;
      // Compound: multiply current speed by 1.2
      this.baseSpeed *= 1.2;
      // Reduce spawn interval slightly
      this.spawnInterval = Math.max(80, this.spawnInterval * 0.92);

      // Trigger speed up animation
      if (this.onSpeedUp) {
        this.onSpeedUp(this.baseSpeed);
      }
    }
  }

  update(dt, bird) {
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      this.spawnPipe();
      this.spawnTimer = this.spawnInterval + Math.random() * 20;
    }

    for (let i = this.pipes.length - 1; i >= 0; i--) {
      const pipe = this.pipes[i];
      pipe.update(this.speed, dt, this.gameH);

      if (!pipe.passed && pipe.x + pipe.width < bird.x) {
        pipe.passed = true;
        this.score++;
      }

      if (pipe.isOffScreen()) {
        this.pipes.splice(i, 1);
      }
    }
  }
spawnPipe() {
   const capHeight = 24;

    // Hard floor: the smallest gap the bird can ever be asked to fly
    // through, no matter how many tiers have passed. Tune this against
    // the bird's actual hitbox height (see bird.js) — this assumes a
    // ~34px sprite with an 8% hitbox shrink, plus room to maneuver.
    const MIN_PLAYABLE_GAP = 95; // world units, at the 640px design baseline

    const heightScale = this.gameH / 640;

    // Gap shrinks every tier (every 10 score) but never below the floor.
    const startingGap = 170;
    const shrinkPerTier = 6;
    const maxGap = Math.max(MIN_PLAYABLE_GAP + 30, startingGap - this.currentTier * shrinkPerTier) * heightScale;
    const minGap = Math.max(MIN_PLAYABLE_GAP, maxGap / heightScale - 40) * heightScale;

    const gapHeight = minGap + Math.random() * (maxGap - minGap);
    // Restrict where the gap can spawn to the middle 80% of the screen
    // (10% margin top and bottom) so the bird can always physically reach
    // the next gap from wherever the previous one left it.
    const margin = this.gameH * 0.1;
    const minGapY = margin;
    const maxGapY = this.gameH - margin - gapHeight - capHeight * 2;
    const gapY = minGapY + Math.random() * Math.max(0, maxGapY - minGapY);

    const isMoving = this.score >= 10 && Math.random() < Math.min(0.6, 0.3 + this.currentTier * 0.1);
    this.pipes.push(new Pipe(this.gameW + 20, gapY, gapHeight, this.pipeWidth, isMoving));
  }

  collidesWith(hitbox) {
    for (const pipe of this.pipes) {
      if (pipe.collidesWith(hitbox)) return true;
    }
    return false;
  }

  draw(ctx) {
    for (const pipe of this.pipes) {
      pipe.draw(ctx, this.gameH);
    }
  }

  setSpeedMultiplier(multiplier) {
    this.speed = this.baseSpeed * multiplier;
  }

  getNextPipeX() {
    for (const pipe of this.pipes) {
      if (!pipe.passed) return pipe.x;
    }
    return this.gameW;
  }
}
