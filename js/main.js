/**
 * main.js — Entry point, input handling, resize, game initialization.
 */

import { Game } from './game.js';

const canvas = document.getElementById('game-canvas');
const game = new Game(canvas);

// Input handling — all three methods (keyboard, mouse, touch)
function handleInput(e) {
  if (e.type === 'keydown') {
    if (e.code === 'Space' || e.code === 'ArrowUp') {
      e.preventDefault();
      game.flap();
    }
  } else {
    if (e.type === 'touchstart') {
      e.preventDefault();
    }
    game.flap();
  }
}

window.addEventListener('keydown', handleInput);
canvas.addEventListener('mousedown', handleInput);
canvas.addEventListener('touchstart', handleInput, { passive: false });

// Prevent double-tap zoom on iOS
canvas.addEventListener('touchend', (e) => e.preventDefault(), { passive: false });

// ========== FIX: Click/tap anywhere on start screen to start ==========
const startScreen = document.getElementById('start-screen');
startScreen.addEventListener('click', (e) => {
  if (!e.target.closest('button')) {
    game.flap();
  }
});
startScreen.addEventListener('touchstart', (e) => {
  if (!e.target.closest('button')) {
    e.preventDefault();
    game.flap();
  }
}, { passive: false });

// ========== FIX: Click/tap anywhere on game over screen to restart ==========
const gameOverScreen = document.getElementById('gameover-screen');
gameOverScreen.addEventListener('click', (e) => {
  if (!e.target.closest('button')) {
    game.flap();
  }
});
gameOverScreen.addEventListener('touchstart', (e) => {
  if (!e.target.closest('button')) {
    e.preventDefault();
    game.flap();
  }
}, { passive: false });

// Window resize with debounce
let resizeTimeout;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => game._resize(), 150);
});

// Visibility change — reset delta to avoid huge jump on return
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    game.lastTime = 0;
  }
});

// Start the game loop
game.start();
