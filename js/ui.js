/**
 * UI — DOM overlay management, score display, screens, wind indicators.
 */

export class UI {
  constructor() {
    this.scoreEl = document.getElementById('score-display');
    this.highScoreEl = document.getElementById('high-score-value');
    this.highScoreContainer = document.getElementById('high-score-display');
    this.startScreen = document.getElementById('start-screen');
    this.gameOverScreen = document.getElementById('gameover-screen');
    this.finalScoreEl = document.getElementById('final-score');
    this.finalHighScoreEl = document.getElementById('final-high-score');
    this.startBtn = document.getElementById('start-btn');
    this.restartBtn = document.getElementById('restart-btn');
    this.muteBtn = document.getElementById('mute-btn');
    this.iconOn = document.getElementById('icon-sound-on');
    this.iconOff = document.getElementById('icon-sound-off');
    this.windIndicator = document.getElementById('wind-indicator');
    this.windText = document.getElementById('wind-text');
    this.windArrow = document.getElementById('wind-arrow');
    this.milestoneToast = document.getElementById('milestone-toast');
    this.milestoneText = document.getElementById('milestone-text');
    this.speedupToast = document.getElementById('speedup-toast');
    this.speedupText = document.getElementById('speedup-text');
    this.canvas = document.getElementById('game-canvas');

    this.onStart = null;
    this.onRestart = null;
    this.onMuteToggle = null;

    this._bindEvents();
  }

  _bindEvents() {
    this.startBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (this.onStart) this.onStart();
    });

    this.restartBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (this.onRestart) this.onRestart();
    });

    this.muteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (this.onMuteToggle) this.onMuteToggle();
    });
  }

  showStartScreen() {
    this.startScreen.style.display = 'flex';
    this.startScreen.classList.remove('hidden');
    this.gameOverScreen.style.display = 'none';
    this.gameOverScreen.classList.add('hidden');
    this.scoreEl.style.display = 'none';
    this.highScoreContainer.style.display = 'none';
    this.windIndicator.classList.remove('active');
    this.speedupToast.classList.remove('show');
  }

  hideStartScreen() {
    this.startScreen.classList.add('hidden');
    setTimeout(() => {
      if (this.startScreen.classList.contains('hidden')) {
        this.startScreen.style.display = 'none';
      }
    }, 300);
    this.scoreEl.style.display = 'block';
    this.highScoreContainer.style.display = 'block';
  }

  showGameOver(score, highScore) {
    this.finalScoreEl.textContent = score;
    this.finalHighScoreEl.textContent = highScore;
    this.gameOverScreen.style.display = 'flex';
    void this.gameOverScreen.offsetWidth;
    this.gameOverScreen.classList.remove('hidden');
  }

  hideGameOver() {
    this.gameOverScreen.classList.add('hidden');
    setTimeout(() => {
      if (this.gameOverScreen.classList.contains('hidden')) {
        this.gameOverScreen.style.display = 'none';
      }
    }, 300);
  }

  updateScore(score) {
    this.scoreEl.textContent = score;
    this.scoreEl.classList.remove('pop');
    void this.scoreEl.offsetWidth;
    this.scoreEl.classList.add('pop');
    setTimeout(() => this.scoreEl.classList.remove('pop'), 200);
  }

  updateHighScore(highScore) {
    this.highScoreEl.textContent = highScore;
  }

  // ========== WIND STATES ==========

  showWindWarning(direction) {
    this.windIndicator.classList.add('active');
    this.windArrow.className = direction === 1 ? 'right' : 'left';
    this.windText.textContent = '⚠ WIND ALERT';
    this.windText.style.color = '#FFE082';
    this.windText.style.fontSize = '18px';
    this.windText.style.animation = 'pulse 0.5s ease infinite';
  }

  showWindTelegraph(direction) {
    this.windIndicator.classList.add('active');
    this.windArrow.className = direction === 1 ? 'right' : 'left';
    this.windText.textContent = '🍃 WIND SOON';
    this.windText.style.color = '#81C784';
    this.windText.style.animation = 'none';
  }

  showWindGust(direction) {
    this.windIndicator.classList.add('active');
    this.windArrow.className = direction === 1 ? 'right' : 'left';
    this.windText.textContent = direction === 1 ? '💨 HEADWIND!' : '💨 TAILWIND!';
    this.windText.style.color = '#FF6B6B';
    this.windText.style.fontSize = '20px';
    this.windText.style.animation = 'shake 0.3s ease infinite';
  }

  hideWindIndicator() {
    this.windIndicator.classList.remove('active');
    this.windText.style.animation = 'none';
  }

  showMilestone(score) {
    this.milestoneText.textContent = score + '!';
    this.milestoneToast.style.display = 'block';
    void this.milestoneToast.offsetWidth;
    this.milestoneToast.classList.add('show');
    setTimeout(() => {
      this.milestoneToast.classList.remove('show');
      setTimeout(() => {
        if (!this.milestoneToast.classList.contains('show')) {
          this.milestoneToast.style.display = 'none';
        }
      }, 300);
    }, 1200);
  }

  showSpeedUp(speed) {
    this.speedupText.textContent = 'SPEED UP!';
    this.speedupToast.classList.add('show');
    setTimeout(() => {
      this.speedupToast.classList.remove('show');
    }, 1500);
  }

  setMuteIcon(muted) {
    this.iconOn.style.display = muted ? 'none' : 'block';
    this.iconOff.style.display = muted ? 'block' : 'none';
  }

  focusCanvas() {
    this.canvas.focus();
  }
}
