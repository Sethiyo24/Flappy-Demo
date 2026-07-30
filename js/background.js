/**
 * Background — Parallax scrolling layers.
 * FIXED: No jitter, random sized clouds. Trees enabled on mobile.
 */

export class Background {
  constructor(gameWidth, gameHeight, groundHeight = 10) {
    this.w = gameWidth;
    this.h = gameHeight;
    this.groundHeight = groundHeight;
    this.layers = [];
    this.clouds = [];
    this.initClouds();
    this.initLayers();
  }

  initClouds() {
    // Generate random clouds once, they persist
    const cloudCount = 6; // Reduced from many
    for (let i = 0; i < cloudCount; i++) {
      this.clouds.push({
        x: Math.random() * this.w * 2, // Spread across 2 screens for wrapping
        y: 20 + Math.random() * (this.h * 0.35), // Upper 35% of screen
        size: 25 + Math.random() * 40, // Random size 25-65
        speed: 0.1 + Math.random() * 0.3, // Random drift speed
        opacity: 0.3 + Math.random() * 0.4
      });
    }
  }

  initLayers() {
    this.layers.push({
      speed: 0.5,
      offset: 0,
      draw: (ctx, w, h, off) => this.drawHills(ctx, w, h, off),
      enabled: true
    });

    this.layers.push({
      speed: 0.8,
      offset: 0,
      draw: (ctx, w, h, off) => this.drawTrees(ctx, w, h, off),
      enabled: true
    });
  }

  update(speed, dt) {
    // Update parallax layers
    for (const layer of this.layers) {
      if (!layer.enabled) continue;
      layer.offset -= speed * layer.speed * dt;
      // Use modulo for seamless wrap — NO jitter
      layer.offset = ((layer.offset % this.w) + this.w) % this.w;
    }

    // Update clouds (independent drift)
    for (const cloud of this.clouds) {
      cloud.x -= (speed * 0.2 + cloud.speed) * dt;
      // Wrap clouds
      if (cloud.x + cloud.size * 2 < 0) {
        cloud.x = this.w + cloud.size + Math.random() * 100;
        cloud.y = 20 + Math.random() * (this.h * 0.35);
      }
    }
  }

  draw(ctx) {
    // Draw clouds first (behind everything)
    for (const cloud of this.clouds) {
      this._drawCloudShape(ctx, cloud.x, cloud.y, cloud.size, cloud.opacity);
    }

    // Draw parallax layers
    for (const layer of this.layers) {
      if (!layer.enabled) continue;
      // Draw at current offset and offset + width for seamless wrap
      layer.draw(ctx, this.w, this.h, layer.offset);
      layer.draw(ctx, this.w, this.h, layer.offset - this.w);
    }
  }

  _drawCloudShape(ctx, x, y, size, opacity) {
    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.fillStyle = '#FFFFFF';
    
    // Simple puffy cloud using 3 overlapping circles
    ctx.beginPath();
    ctx.arc(x, y, size * 0.5, 0, Math.PI * 2);
    ctx.arc(x + size * 0.35, y - size * 0.15, size * 0.4, 0, Math.PI * 2);
    ctx.arc(x + size * 0.6, y, size * 0.45, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
  }

  drawHills(ctx, w, h, off) {
    ctx.save();
    ctx.fillStyle = '#81C784';
    ctx.globalAlpha = 0.6;
    
    ctx.beginPath();
    ctx.moveTo(off, h);
    // Use consistent points based on width — no random jitter
    const points = [
      { x: 0, y: h - 80 },
      { x: w * 0.33, y: h - 40 },
      { x: w * 0.66, y: h - 100 },
      { x: w, y: h - 60 },
      { x: w * 1.33, y: h - 90 },
      { x: w * 1.66, y: h - 50 }
    ];
    
    ctx.moveTo(off, h);
    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      const nextP = points[(i + 1) % points.length];
      const cpX = (p.x + nextP.x) / 2;
      ctx.quadraticCurveTo(off + p.x, p.y, off + (p.x + nextP.x) / 2, (p.y + nextP.y) / 2);
    }
    ctx.lineTo(off + w * 2, h);
    ctx.closePath();
    ctx.fill();

    // Second hill layer
    ctx.fillStyle = '#66BB6A';
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    ctx.moveTo(off, h);
    const points2 = [
      { x: 0, y: h - 60 },
      { x: w * 0.4, y: h - 120 },
      { x: w * 0.8, y: h - 70 },
      { x: w * 1.2, y: h - 50 },
      { x: w * 1.6, y: h - 90 }
    ];
    for (let i = 0; i < points2.length; i++) {
      const p = points2[i];
      const nextP = points2[(i + 1) % points2.length];
      ctx.quadraticCurveTo(off + p.x, p.y, off + (p.x + nextP.x) / 2, (p.y + nextP.y) / 2);
    }
    ctx.lineTo(off + w * 2, h);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  drawTrees(ctx, w, h, off) {
    ctx.save();
    ctx.globalAlpha = 0.7;
    const treePositions = [0.12, 0.28, 0.45, 0.62, 0.78, 0.92];
    for (const pos of treePositions) {
      const x = off + pos * w;
      // TALLER trees: 55–85px range
      const treeH = 55 + (pos * 31) % 30;
      this._drawTree(ctx, x, h - this.groundHeight, treeH);
    }
    ctx.restore();
  }

  _drawTree(ctx, x, y, height) {
    // Thicker trunk
    ctx.fillStyle = '#795548';
    ctx.fillRect(x - 4, y - height * 0.3, 8, height * 0.3);
    
    // Larger foliage layers
    ctx.fillStyle = '#4CAF50';
    ctx.beginPath();
    ctx.moveTo(x, y - height);
    ctx.lineTo(x - 20, y - height * 0.25);
    ctx.lineTo(x + 20, y - height * 0.25);
    ctx.closePath();
    ctx.fill();
    
    ctx.fillStyle = '#66BB6A';
    ctx.beginPath();
    ctx.moveTo(x, y - height * 0.75);
    ctx.lineTo(x - 16, y - height * 0.15);
    ctx.lineTo(x + 16, y - height * 0.15);
    ctx.closePath();
    ctx.fill();
  }

  setMobileMode(isMobile) {
    // Trees are now enabled on all devices including mobile
    if (this.layers.length >= 2) {
      this.layers[1].enabled = true;
    }
  }
}