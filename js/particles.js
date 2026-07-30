/**
 * Particle System — Trail, burst, wind leaves, and score confetti.
 */

export class Particle {
  constructor() {
    this.reset();
  }

  reset() {
    this.x = 0;
    this.y = 0;
    this.vx = 0;
    this.vy = 0;
    this.life = 0;
    this.maxLife = 0;
    this.size = 0;
    this.color = '';
    this.type = 'circle';
    this.rotation = 0;
    this.rotSpeed = 0;
    this.active = false;
  }

  spawn(x, y, vx, vy, life, size, color, type = 'circle', rotation = 0, rotSpeed = 0) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.life = life;
    this.maxLife = life;
    this.size = size;
    this.color = color;
    this.type = type;
    this.rotation = rotation;
    this.rotSpeed = rotSpeed;
    this.active = true;
  }

  update(dt) {
    if (!this.active) return;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.rotation += this.rotSpeed * dt;
    this.life -= dt;
    if (this.life <= 0) this.active = false;
  }

  draw(ctx) {
    if (!this.active) return;
    const alpha = Math.max(0, this.life / this.maxLife);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);
    ctx.fillStyle = this.color;

    if (this.type === 'circle') {
      ctx.beginPath();
      ctx.arc(0, 0, this.size, 0, Math.PI * 2);
      ctx.fill();
    } else if (this.type === 'square') {
      ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
    } else if (this.type === 'leaf') {
      ctx.beginPath();
      ctx.ellipse(0, 0, this.size, this.size * 0.5, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}

export class ParticleSystem {
  constructor(maxParticles = 400) {
    this.particles = [];
    for (let i = 0; i < maxParticles; i++) {
      this.particles.push(new Particle());
    }
  }

  _getInactive() {
    for (const p of this.particles) {
      if (!p.active) return p;
    }
    return null;
  }

  spawn(x, y, vx, vy, life, size, color, type, rotation, rotSpeed) {
    const p = this._getInactive();
    if (p) {
      p.spawn(x, y, vx, vy, life, size, color, type, rotation, rotSpeed);
    }
  }

  spawnTrail(x, y) {
    this.spawn(
      x + (Math.random() - 0.5) * 6,
      y + (Math.random() - 0.5) * 6,
      -1 - Math.random(),
      (Math.random() - 0.5) * 0.5,
      20 + Math.random() * 15,
      2 + Math.random() * 2,
      '#FFD93D',
      'circle'
    );
  }

  spawnBurst(x, y, count = 20) {
    const colors = ['#FFD93D', '#FF6B35', '#FF4757', '#4FACFE', '#56AB2F', '#FFFFFF'];
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      const speed = 2 + Math.random() * 4;
      this.spawn(
        x, y,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        30 + Math.random() * 20,
        3 + Math.random() * 4,
        colors[Math.floor(Math.random() * colors.length)],
        Math.random() > 0.5 ? 'circle' : 'square',
        Math.random() * Math.PI * 2,
        (Math.random() - 0.5) * 0.2
      );
    }
  }

  spawnWindLeaves(direction, gameWidth, gameHeight) {
    const startX = direction === 1 ? gameWidth + 30 : -30;
    const colors = ['#A8E6CF', '#DCEDC1', '#81C784', '#C8E6C9', '#B2DFDB'];
    for (let i = 0; i < 20; i++) {
      this.spawn(
        startX + (Math.random() - 0.5) * 80,
        Math.random() * gameHeight,
        direction * (2 + Math.random() * 3),
        (Math.random() - 0.5) * 1.5,
        50 + Math.random() * 50,
        5 + Math.random() * 6,
        colors[Math.floor(Math.random() * colors.length)],
        'leaf',
        Math.random() * Math.PI * 2,
        (Math.random() - 0.5) * 0.2
      );
    }
  }

  spawnScoreConfetti(x, y) {
    const colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'];
    for (let i = 0; i < 10; i++) {
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.5;
      const speed = 1.5 + Math.random() * 2.5;
      this.spawn(
        x, y,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        25 + Math.random() * 20,
        3 + Math.random() * 3,
        colors[Math.floor(Math.random() * colors.length)],
        'square',
        Math.random() * Math.PI,
        (Math.random() - 0.5) * 0.3
      );
    }
  }

  update(dt) {
    for (const p of this.particles) {
      p.update(dt);
    }
  }

  draw(ctx) {
    for (const p of this.particles) {
      p.draw(ctx);
    }
  }
}
