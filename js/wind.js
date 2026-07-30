/**
 * WindSystem — Periodic gusts with visual telegraphing.
 * States: IDLE → WARNING (alert) → TELEGRAPH (leaves) → GUST (full wind) → COOLDOWN
 */

export class WindSystem {
  constructor(gameWidth, gameHeight) {
    this.w = gameWidth;
    this.h = gameHeight;
    this.state = 'IDLE';
    this.timer = 0;
    this.cooldownTimer = 0;
    this.direction = 1;
    this.speedMultiplier = 1.0;
    this.nextGustTime = this._randomGustInterval();

    // Durations (in frames at 60fps)
    this.warningDuration = 90;    // ~1.5s - ALERT phase
    this.telegraphDuration = 120; // ~2s - leaves drifting
    this.gustDuration = 240;      // ~4s - full wind
    this.cooldownDuration = 180;  // ~3s

    this.windStrength = 0;
  }

  _randomGustInterval() {
    return 360 + Math.random() * 300; // 6-11 seconds
  }

  reset() {
    this.state = 'IDLE';
    this.timer = 0;
    this.cooldownTimer = 0;
    this.speedMultiplier = 1.0;
    this.windStrength = 0;
    this.nextGustTime = this._randomGustInterval();
  }

  update(dt, onWarning, onTelegraph, onGustStart, onGustEnd) {
    switch (this.state) {
      case 'IDLE':
        this.nextGustTime -= dt;
        this.windStrength *= 0.9;
        if (this.nextGustTime <= 0) {
          this.state = 'WARNING';
          this.timer = this.warningDuration;
          this.direction = Math.random() < 0.5 ? 1 : -1;
          if (onWarning) onWarning(this.direction);
        }
        break;

      case 'WARNING':
        this.timer -= dt;
        this.windStrength = 0.1;
        if (this.timer <= 0) {
          this.state = 'TELEGRAPH';
          this.timer = this.telegraphDuration;
          if (onTelegraph) onTelegraph(this.direction);
        }
        break;

      case 'TELEGRAPH':
        this.timer -= dt;
        this.windStrength = 0.3 * (1 - this.timer / this.telegraphDuration);
        if (this.timer <= 0) {
          this.state = 'GUST';
          this.timer = this.gustDuration;
          this.windStrength = 1.0;
          this.speedMultiplier = this.direction === 1 ? 1.5 : 0.6;
          if (onGustStart) onGustStart(this.direction, this.speedMultiplier);
        }
        break;

      case 'GUST':
        this.timer -= dt;
        this.windStrength = 1.0 * (this.timer / this.gustDuration);
        if (this.timer <= 0) {
          this.state = 'COOLDOWN';
          this.cooldownTimer = this.cooldownDuration;
          this.windStrength = 0;
          this.speedMultiplier = 1.0;
          if (onGustEnd) onGustEnd();
        }
        break;

      case 'COOLDOWN':
        this.cooldownTimer -= dt;
        this.windStrength *= 0.9;
        if (this.cooldownTimer <= 0) {
          this.state = 'IDLE';
          this.nextGustTime = this._randomGustInterval();
        }
        break;
    }
  }

  isWarning() { return this.state === 'WARNING'; }
  isTelegraph() { return this.state === 'TELEGRAPH'; }
  isGust() { return this.state === 'GUST'; }
  isActive() { return this.state === 'WARNING' || this.state === 'TELEGRAPH' || this.state === 'GUST'; }
  getState() { return this.state; }
  getDirection() { return this.direction; }
  getSpeedMultiplier() { return this.speedMultiplier; }
  getWindStrength() { return this.windStrength; }

  getWarningProgress() {
    if (this.state !== 'WARNING') return 0;
    return 1 - (this.timer / this.warningDuration);
  }

  getTelegraphProgress() {
    if (this.state !== 'TELEGRAPH') return 0;
    return 1 - (this.timer / this.telegraphDuration);
  }

  getGustProgress() {
    if (this.state !== 'GUST') return 0;
    return 1 - (this.timer / this.gustDuration);
  }
}
