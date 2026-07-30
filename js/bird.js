/**
 * Bird — Physics, drawing, animation.
 */

export class Bird {
  constructor(gameWidth, gameHeight, groundHeight = 10) {
    this.gameW = gameWidth;
    this.gameH = gameHeight;
    this.groundHeight = groundHeight;
    this.reset();
  }

  reset() {
    this.x = this.gameW * 0.25;
    this.y = this.gameH * 0.4;
    this.vy = 0;
    this.width = 34;
    this.height = 26;
    this.rotation = 0;
    this.targetRotation = 0;
    this.flapTimer = 0;
    this.wingAngle = 0;
    this.alive = true;
    this.idleTime = 0;
    // Wind effect
    this.windOffsetX = 0;
    this.windWobblePhase = 0;
    this.windWobbleAmp = 0;
  }

  flap() {
    if (!this.alive) return;
    this.vy = -4.5;
    this.flapTimer = 8;
    this.targetRotation = -25 * (Math.PI / 180);
  }

  /**
   * Apply wind force — pushes bird back + adds up/down wobble
   * @param {number} direction - 1 = headwind (from right), -1 = tailwind (from left)
   * @param {number} strength - 0 to 1 (1 = max wind)
   */
  applyWind(direction, strength) {
    // Push bird back (opposite to wind direction)
    // Headwind (dir=1): pushes bird left (negative x)
    // Tailwind (dir=-1): pushes bird right (positive x)
    const pushForce = direction * -1 * strength * 2.5;
    this.windOffsetX += pushForce;

    // Clamp wind offset so bird doesn't go off screen
    this.windOffsetX = Math.max(-80, Math.min(80, this.windOffsetX));

    // Up/down wobble (2-3 small oscillations)
    this.windWobbleAmp = strength * 3;
    this.windWobblePhase += 0.15;
  }

  update(gravity, maxFallSpeed, dt, isIdle = false, isWindy = false) {
    if (isIdle) {
      this.idleTime += dt;
      this.y = this.gameH * 0.4 + Math.sin(this.idleTime * 0.05) * 10;
      this.vy = 0;
      this.rotation = Math.sin(this.idleTime * 0.05) * 0.1;
      this.wingAngle = Math.sin(this.idleTime * 0.1) * 0.3;
      this.windOffsetX *= 0.95;
      return;
    }

    if (!this.alive) return;

    // Apply wind wobble to Y position
    if (isWindy && this.windWobbleAmp > 0) {
      this.windWobblePhase += 0.12 * dt;
      this.y += Math.sin(this.windWobblePhase) * this.windWobbleAmp * dt;
    }

    this.vy += gravity * dt;
    if (this.vy > maxFallSpeed) this.vy = maxFallSpeed;
    this.y += this.vy * dt;

    // Floor collision — BIRD DIES when touching ground
    if (this.y + this.height / 2 >= this.gameH - this.groundHeight) {
      this.y = this.gameH - this.groundHeight - this.height / 2;
      this.alive = false;
    }

    // Ceiling collision
    if (this.y - this.height / 2 <= 0) {
      this.y = this.height / 2;
      this.vy = 0;
    }

    // Rotation follows velocity
    this.targetRotation = Math.min(90, Math.max(-25, this.vy * 8)) * (Math.PI / 180);
    this.rotation += (this.targetRotation - this.rotation) * 0.15 * dt;

    // Flap animation
    if (this.flapTimer > 0) {
      this.flapTimer -= dt;
      this.wingAngle = -0.8 * Math.min(1, this.flapTimer / 5);
    } else {
      this.wingAngle += (0.3 - this.wingAngle) * 0.1 * dt;
    }

    // Decay wind offset when not windy
    if (!isWindy) {
      this.windOffsetX *= 0.92;
      this.windWobbleAmp *= 0.9;
    }
  }

  getHitbox() {
    // NO shrink — pixel-perfect collision, if bird touches pipe = DEAD
    return {
      x: this.x + this.windOffsetX - this.width / 2,
      y: this.y - this.height / 2,
      w: this.width,
      h: this.height
    };
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x + this.windOffsetX, this.y);
    ctx.rotate(this.rotation);

    // Body
    ctx.fillStyle = '#FFD93D';
    ctx.beginPath();
    ctx.ellipse(0, 0, this.width / 2, this.height / 2, 0, 0, Math.PI * 2);
    ctx.fill();

    // Body highlight
    ctx.fillStyle = '#FFE082';
    ctx.beginPath();
    ctx.ellipse(-3, -3, this.width / 2.8, this.height / 2.8, -0.2, 0, Math.PI * 2);
    ctx.fill();

    // Wing
    ctx.save();
    ctx.translate(-4, 2);
    ctx.rotate(this.wingAngle);
    ctx.fillStyle = '#FFC107';
    ctx.beginPath();
    ctx.ellipse(0, 0, 10, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Eye
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(8, -5, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1A1A2E';
    ctx.beginPath();
    ctx.arc(10, -5, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(11, -6, 1, 0, Math.PI * 2);
    ctx.fill();

    // Beak
    ctx.fillStyle = '#FF6B35';
    ctx.beginPath();
    ctx.moveTo(14, -1);
    ctx.lineTo(24, 2);
    ctx.lineTo(14, 5);
    ctx.closePath();
    ctx.fill();

    // Outline
    ctx.strokeStyle = '#F9A825';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(0, 0, this.width / 2, this.height / 2, 0, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }
}