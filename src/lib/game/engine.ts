export type GameCallbacks = {
  onScoreChange?: (score: number) => void;
  onLivesChange?: (lives: number) => void;
  onWaveChange?: (wave: number) => void;
  onGameOver?: (finalScore: number) => void;
};

type Rect = { x: number; y: number; w: number; h: number };
type Alien = Rect & { alive: boolean; row: number };

const GAME_WIDTH = 480;
const GAME_HEIGHT = 640;

const PLAYER_WIDTH = 32;
const PLAYER_HEIGHT = 16;
const PLAYER_SPEED = 240;
const PLAYER_COOLDOWN = 0.35;

const BULLET_WIDTH = 3;
const BULLET_HEIGHT = 10;
const PLAYER_BULLET_SPEED = 420;
const ALIEN_BULLET_SPEED = 220;
const MAX_ALIEN_BULLETS = 3;

const ALIEN_ROWS = 5;
const ALIEN_COLS = 8;
const ALIEN_WIDTH = 28;
const ALIEN_HEIGHT = 18;
const ALIEN_H_GAP = 12;
const ALIEN_V_GAP = 14;
const ALIEN_TOP_MARGIN = 60;
const ALIEN_SIDE_MARGIN = 24;
const ALIEN_STEP_DOWN = 18;
const ALIEN_BASE_SPEED = 40;
const ALIEN_WAVE_SPEED_STEP = 8;
const ALIEN_FIRE_INTERVAL_BASE = 1.1;

const STARTING_LIVES = 3;
const ROW_SCORE = [40, 30, 30, 20, 10];
const INVULNERABILITY_MS = 1500;

function rectsOverlap(a: Rect, b: Rect) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

// Framework-agnostic game loop; React only owns the canvas ref and key events.
export class GameEngine {
  static readonly WIDTH = GAME_WIDTH;
  static readonly HEIGHT = GAME_HEIGHT;

  private ctx: CanvasRenderingContext2D;
  private callbacks: GameCallbacks;

  private player: Rect = { x: 0, y: 0, w: PLAYER_WIDTH, h: PLAYER_HEIGHT };
  private playerBullets: Rect[] = [];
  private alienBullets: Rect[] = [];
  private aliens: Alien[] = [];
  private alienDir = 1;
  private alienSpeed = ALIEN_BASE_SPEED;
  private fireTimer = 0;
  private shootCooldown = 0;
  private score = 0;
  private lives = STARTING_LIVES;
  private wave = 1;
  private running = false;
  private rafId = 0;
  private lastTime = 0;
  private keys = new Set<string>();
  private invulnerableUntil = 0;

  constructor(canvas: HTMLCanvasElement, callbacks: GameCallbacks = {}) {
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D context unavailable");
    this.ctx = ctx;
    this.callbacks = callbacks;
    this.resetPlayer();
    this.spawnWave();
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    this.rafId = requestAnimationFrame(this.loop);
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.rafId);
  }

  handleKeyDown(key: string) {
    this.keys.add(key);
  }

  handleKeyUp(key: string) {
    this.keys.delete(key);
  }

  private resetPlayer() {
    this.player.x = GAME_WIDTH / 2 - PLAYER_WIDTH / 2;
    this.player.y = GAME_HEIGHT - PLAYER_HEIGHT - 24;
  }

  private spawnWave() {
    this.aliens = [];
    const totalRowWidth = ALIEN_COLS * ALIEN_WIDTH + (ALIEN_COLS - 1) * ALIEN_H_GAP;
    const startX = (GAME_WIDTH - totalRowWidth) / 2;
    for (let row = 0; row < ALIEN_ROWS; row++) {
      for (let col = 0; col < ALIEN_COLS; col++) {
        this.aliens.push({
          x: startX + col * (ALIEN_WIDTH + ALIEN_H_GAP),
          y: ALIEN_TOP_MARGIN + row * (ALIEN_HEIGHT + ALIEN_V_GAP),
          w: ALIEN_WIDTH,
          h: ALIEN_HEIGHT,
          alive: true,
          row,
        });
      }
    }
    this.alienDir = 1;
    this.alienSpeed = ALIEN_BASE_SPEED + this.wave * ALIEN_WAVE_SPEED_STEP;
    this.playerBullets = [];
    this.alienBullets = [];
    this.fireTimer = ALIEN_FIRE_INTERVAL_BASE;
  }

  private loop = (time: number) => {
    if (!this.running) return;
    const dt = Math.min((time - this.lastTime) / 1000, 0.05);
    this.lastTime = time;
    this.update(dt);
    this.render();
    this.rafId = requestAnimationFrame(this.loop);
  };

  private update(dt: number) {
    this.updatePlayer(dt);
    this.updateBullets(dt);

    const aliveAliens = this.aliens.filter((a) => a.alive);
    if (aliveAliens.length === 0) {
      this.wave += 1;
      this.callbacks.onWaveChange?.(this.wave);
      this.spawnWave();
      return;
    }

    this.updateAliens(dt, aliveAliens);

    const lowestY = Math.max(...aliveAliens.map((a) => a.y + a.h));
    if (lowestY >= this.player.y) {
      this.endGame();
      return;
    }

    this.handleCollisions(aliveAliens);
  }

  private updatePlayer(dt: number) {
    const left = this.keys.has("ArrowLeft") || this.keys.has("a") || this.keys.has("A");
    const right = this.keys.has("ArrowRight") || this.keys.has("d") || this.keys.has("D");
    if (left) this.player.x -= PLAYER_SPEED * dt;
    if (right) this.player.x += PLAYER_SPEED * dt;
    this.player.x = Math.max(0, Math.min(GAME_WIDTH - this.player.w, this.player.x));

    this.shootCooldown -= dt;
    const wantsToShoot = this.keys.has(" ") || this.keys.has("Spacebar");
    if (wantsToShoot && this.shootCooldown <= 0) {
      this.playerBullets.push({
        x: this.player.x + this.player.w / 2 - BULLET_WIDTH / 2,
        y: this.player.y - BULLET_HEIGHT,
        w: BULLET_WIDTH,
        h: BULLET_HEIGHT,
      });
      this.shootCooldown = PLAYER_COOLDOWN;
    }
  }

  private updateBullets(dt: number) {
    for (const b of this.playerBullets) b.y -= PLAYER_BULLET_SPEED * dt;
    this.playerBullets = this.playerBullets.filter((b) => b.y + b.h > 0);

    for (const b of this.alienBullets) b.y += ALIEN_BULLET_SPEED * dt;
    this.alienBullets = this.alienBullets.filter((b) => b.y < GAME_HEIGHT);
  }

  private updateAliens(dt: number, aliveAliens: Alien[]) {
    let hitEdge = false;
    for (const alien of aliveAliens) {
      const nextX = alien.x + this.alienDir * this.alienSpeed * dt;
      if (nextX <= ALIEN_SIDE_MARGIN || nextX + alien.w >= GAME_WIDTH - ALIEN_SIDE_MARGIN) {
        hitEdge = true;
      }
    }
    if (hitEdge) {
      this.alienDir *= -1;
      for (const alien of aliveAliens) alien.y += ALIEN_STEP_DOWN;
    } else {
      for (const alien of aliveAliens) alien.x += this.alienDir * this.alienSpeed * dt;
    }

    const total = ALIEN_ROWS * ALIEN_COLS;
    const speedRamp = 1 + (total - aliveAliens.length) / total;
    this.alienSpeed = (ALIEN_BASE_SPEED + this.wave * ALIEN_WAVE_SPEED_STEP) * speedRamp;

    this.fireTimer -= dt;
    const fireInterval = ALIEN_FIRE_INTERVAL_BASE * (aliveAliens.length / total) + 0.3;
    if (this.fireTimer <= 0 && this.alienBullets.length < MAX_ALIEN_BULLETS) {
      const shooter = aliveAliens[Math.floor(Math.random() * aliveAliens.length)];
      this.alienBullets.push({
        x: shooter.x + shooter.w / 2 - BULLET_WIDTH / 2,
        y: shooter.y + shooter.h,
        w: BULLET_WIDTH,
        h: BULLET_HEIGHT,
      });
      this.fireTimer = fireInterval;
    }
  }

  private handleCollisions(aliveAliens: Alien[]) {
    for (const bullet of this.playerBullets) {
      for (const alien of aliveAliens) {
        if (!alien.alive || bullet.y < -100) continue;
        if (rectsOverlap(bullet, alien)) {
          alien.alive = false;
          bullet.y = -9999;
          this.score += ROW_SCORE[alien.row] ?? 10;
          this.callbacks.onScoreChange?.(this.score);
        }
      }
    }
    this.playerBullets = this.playerBullets.filter((b) => b.y > -100);

    if (performance.now() > this.invulnerableUntil) {
      for (const bullet of this.alienBullets) {
        if (rectsOverlap(bullet, this.player)) {
          bullet.y = GAME_HEIGHT + 999;
          this.loseLife();
          break;
        }
      }
      this.alienBullets = this.alienBullets.filter((b) => b.y < GAME_HEIGHT + 500);
    }
  }

  private loseLife() {
    this.lives -= 1;
    this.callbacks.onLivesChange?.(this.lives);
    if (this.lives <= 0) {
      this.endGame();
    } else {
      this.resetPlayer();
      this.invulnerableUntil = performance.now() + INVULNERABILITY_MS;
    }
  }

  private endGame() {
    this.running = false;
    cancelAnimationFrame(this.rafId);
    this.callbacks.onGameOver?.(this.score);
  }

  private render() {
    const ctx = this.ctx;
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    const flashing =
      performance.now() < this.invulnerableUntil && Math.floor(performance.now() / 100) % 2 === 0;
    ctx.fillStyle = flashing ? "#0a6b33" : "#22e06e";
    ctx.fillRect(this.player.x, this.player.y, this.player.w, this.player.h);

    ctx.fillStyle = "#e0e022";
    for (const alien of this.aliens) {
      if (!alien.alive) continue;
      ctx.fillRect(alien.x, alien.y, alien.w, alien.h);
    }

    ctx.fillStyle = "#ffffff";
    for (const b of this.playerBullets) ctx.fillRect(b.x, b.y, b.w, b.h);

    ctx.fillStyle = "#ff4444";
    for (const b of this.alienBullets) ctx.fillRect(b.x, b.y, b.w, b.h);
  }
}
