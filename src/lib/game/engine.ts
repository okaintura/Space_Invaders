export type GameCallbacks = {
  onScoreChange?: (score: number) => void;
  onLivesChange?: (lives: number) => void;
  onWaveChange?: (wave: number) => void;
  onGameOver?: (finalScore: number) => void;
};

type Rect = { x: number; y: number; w: number; h: number };
type Alien = Rect & { alive: boolean; row: number };
type Minion = Rect & { alive: boolean; fireTimer: number };
type Asteroid = Rect & { vy: number; hp: number; maxHp: number };
type Missile = Rect & { vx: number; vy: number };
type Orb = Rect & { vy: number };
type AngledBullet = Rect & { vx: number; vy: number };

type Boss1Phase = "telegraph" | "acting" | "cooldown";
type Boss1 = {
  x: number;
  y: number;
  w: number;
  h: number;
  dir: number;
  health: number;
  maxHealth: number;
  phase: Boss1Phase;
  phaseTimer: number;
  attackIndex: number;
  laserThird: number;
  enraged: boolean;
};

type Boss2 = {
  x: number;
  y: number;
  w: number;
  h: number;
  health: number;
  maxHealth: number;
  shielded: boolean;
  shieldTimer: number;
  fireTimer: number;
  bobAngle: number;
  wanderOffset: number;
  wanderTimer: number;
  laserState: "idle" | "charging" | "firing";
  laserTimer: number;
  laserCooldown: number;
  laserX: number;
  missileCooldown: number;
  orbSpawnTimer: number;
  orbsDestroyed: number;
};

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
const ALIEN_WAVE_SPEED_STEP = 4;
const ALIEN_SPEED_RAMP_CAP = 0.5;
const ALIEN_FIRE_INTERVAL_BASE = 1.1;

const STARTING_LIVES = 3;
const ROW_SCORE = [40, 30, 30, 20, 10];
const INVULNERABILITY_MS = 1500;

const BOSS_WAVE_INTERVAL = 5;
const BOSS_ATTACK_GAP = 2;
const BOSS_WARNING_TIME = 2.5;
const BOSS_CLEAR_EXPLOSION_TIME = 1.2;
const BOSS_CLEAR_REST_TIME = 1.5;
const BOSS_CLEAR_TOTAL_TIME = BOSS_CLEAR_EXPLOSION_TIME + BOSS_CLEAR_REST_TIME;
const EXPLOSION_PARTICLE_COUNT = 40;

const BOSS1_WIDTH = 140;
const BOSS1_HEIGHT = 50;
const BOSS1_MAX_HEALTH = 100;
const BOSS1_SPEED = 60;
const BOSS1_LASER_TELEGRAPH_TIME = 1;
const BOSS1_LASER_FIRE_TIME = 0.6;
const BOSS1_SPREAD_COUNT = 6;
const BOSS1_SUMMON_COUNT = 3;
const BOSS1_BULLET_SPEED = 200;
const BOSS1_KILL_SCORE = 1000;
const BOSS1_RAGE_HEALTH_RATIO = 0.35;
const BOSS1_RAGE_SPEED_MULTIPLIER = 1.6;
const BOSS1_RAGE_ATTACK_GAP = 1;
const BOSS1_RAGE_TELEGRAPH_MULTIPLIER = 0.6;
const BOSS1_RAGE_SPREAD_COUNT = 10;
const BOSS1_RAGE_BULLET_SPEED_MULTIPLIER = 1.3;

const BOSS2_WIDTH = 34;
const BOSS2_HEIGHT = 22;
const BOSS2_MAX_HEALTH = 5;
const BOSS2_SPEED = 140;
const BOSS2_WANDER_INTERVAL = 1.2;
const BOSS2_DODGE_SPEED = 260;
const BOSS2_DODGE_LOOKAHEAD = 110;
const BOSS2_DODGE_MARGIN = 26;
const BOSS2_SHIELD_TIME = 5;
const BOSS2_FIRE_INTERVAL = 1.2;
const BOSS2_BULLET_SPEED = 200;
const BOSS2_BURST_COUNT = 8;
const BOSS2_BURST_SPEED = 150;
const BOSS2_KILL_SCORE = 500;
const BOSS2_LASER_HEALTH_THRESHOLD = 2;
const BOSS2_FINAL_HEALTH_THRESHOLD = 1;
const BOSS2_LASER_CHARGE_TIME = 1;
const BOSS2_LASER_FIRE_TIME = 0.4;
const BOSS2_LASER_COOLDOWN = 3.5;
const BOSS2_LASER_WIDTH = 18;
const BOSS2_MISSILE_COOLDOWN = 4;
const BOSS2_MISSILE_SPEED = 150;
const BOSS2_MISSILE_TURN_RATE = 2.5;
const BOSS2_MISSILE_SIZE = 10;
const BOSS2_ORB_SIZE = 20;
const BOSS2_ORB_SPEED = 90;
const BOSS2_ORB_SPAWN_INTERVAL = 2.6;
const BOSS2_ORBS_REQUIRED = 4;
const ASTEROID_SPAWN_INTERVAL = 0.8;
const ASTEROID_MIN_SPEED = 70;
const ASTEROID_MAX_SPEED = 160;
const ASTEROID_MIN_SIZE = 18;
const ASTEROID_MAX_SIZE = 36;
const ASTEROID_HIT_POINTS = 3;

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
  private bossBullets: AngledBullet[] = [];
  private aliens: Alien[] = [];
  private alienDir = 1;
  private alienSpeed = ALIEN_BASE_SPEED;
  private fireTimer = 0;
  private shootCooldown = 0;
  private score = 0;
  private lives = STARTING_LIVES;
  private wave = 1;
  private waveKind: "normal" | "boss1" | "boss2" | "warning" | "clear" = "normal";
  private pendingBossKind: "boss1" | "boss2" = "boss1";
  private transitionTimer = 0;
  private explosionParticles: { x: number; y: number; vx: number; vy: number; life: number; maxLife: number }[] = [];
  private boss1: Boss1 | null = null;
  private boss2: Boss2 | null = null;
  private minions: Minion[] = [];
  private asteroids: Asteroid[] = [];
  private asteroidSpawnTimer = 0;
  private missiles: Missile[] = [];
  private orbs: Orb[] = [];
  private running = false;
  private rafId = 0;
  private lastTime = 0;
  private keys = new Set<string>();
  private invulnerableUntil = 0;

  constructor(canvas: HTMLCanvasElement, callbacks: GameCallbacks = {}, options: { startWave?: number } = {}) {
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D context unavailable");
    this.ctx = ctx;
    this.callbacks = callbacks;
    this.wave = Math.max(1, Math.floor(options.startWave ?? 1));
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
    this.playerBullets = [];
    this.alienBullets = [];
    this.bossBullets = [];
    this.minions = [];
    this.asteroids = [];
    this.missiles = [];
    this.orbs = [];
    this.boss1 = null;
    this.boss2 = null;

    if (this.wave % BOSS_WAVE_INTERVAL === 0) {
      const bossNumber = this.wave / BOSS_WAVE_INTERVAL;
      this.pendingBossKind = bossNumber % 2 === 1 ? "boss2" : "boss1";
      this.waveKind = "warning";
      this.transitionTimer = BOSS_WARNING_TIME;
      return;
    }

    this.waveKind = "normal";
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
    this.fireTimer = ALIEN_FIRE_INTERVAL_BASE;
  }

  private spawnBoss() {
    if (this.waveKind === "boss1") {
      this.boss1 = {
        x: GAME_WIDTH / 2 - BOSS1_WIDTH / 2,
        y: 50,
        w: BOSS1_WIDTH,
        h: BOSS1_HEIGHT,
        dir: 1,
        health: BOSS1_MAX_HEALTH,
        maxHealth: BOSS1_MAX_HEALTH,
        phase: "cooldown",
        phaseTimer: BOSS_ATTACK_GAP,
        attackIndex: 0,
        laserThird: 0,
        enraged: false,
      };
    } else {
      this.boss2 = {
        x: GAME_WIDTH / 2 - BOSS2_WIDTH / 2,
        y: 90,
        w: BOSS2_WIDTH,
        h: BOSS2_HEIGHT,
        health: BOSS2_MAX_HEALTH,
        maxHealth: BOSS2_MAX_HEALTH,
        shielded: false,
        shieldTimer: 0,
        fireTimer: BOSS2_FIRE_INTERVAL,
        bobAngle: 0,
        wanderOffset: 0,
        wanderTimer: BOSS2_WANDER_INTERVAL,
        laserState: "idle",
        laserTimer: 0,
        laserCooldown: BOSS2_LASER_COOLDOWN,
        laserX: 0,
        missileCooldown: BOSS2_MISSILE_COOLDOWN,
        orbSpawnTimer: BOSS2_ORB_SPAWN_INTERVAL,
        orbsDestroyed: 0,
      };
      this.asteroidSpawnTimer = ASTEROID_SPAWN_INTERVAL;
    }
  }

  private startBossClearTransition(x: number, y: number, w: number, h: number) {
    const cx = x + w / 2;
    const cy = y + h / 2;
    this.explosionParticles = [];
    for (let i = 0; i < EXPLOSION_PARTICLE_COUNT; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 60 + Math.random() * 180;
      this.explosionParticles.push({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: BOSS_CLEAR_EXPLOSION_TIME,
        maxLife: BOSS_CLEAR_EXPLOSION_TIME,
      });
    }
    this.waveKind = "clear";
    this.transitionTimer = BOSS_CLEAR_TOTAL_TIME;
  }

  private updateExplosionParticles(dt: number) {
    for (const p of this.explosionParticles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
    }
    this.explosionParticles = this.explosionParticles.filter((p) => p.life > 0);
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

    if (this.waveKind === "warning") {
      this.transitionTimer -= dt;
      if (this.transitionTimer <= 0) {
        this.waveKind = this.pendingBossKind;
        this.spawnBoss();
      }
      return;
    }

    if (this.waveKind === "clear") {
      this.updateExplosionParticles(dt);
      this.transitionTimer -= dt;
      if (this.transitionTimer <= 0) {
        this.wave += 1;
        this.callbacks.onWaveChange?.(this.wave);
        this.spawnWave();
      }
      return;
    }

    if (this.waveKind === "boss1") {
      this.updateBoss1(dt);
      return;
    }
    if (this.waveKind === "boss2") {
      this.updateBoss2(dt);
      return;
    }

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

    for (const b of this.bossBullets) {
      b.x += b.vx * dt;
      b.y += b.vy * dt;
    }
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
    const speedRamp = 1 + ((total - aliveAliens.length) / total) * ALIEN_SPEED_RAMP_CAP;
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

  // ============================================================
  // Boss 1: mothership — laser / spread-shot / summon attack cycle
  // ============================================================
  private updateBoss1(dt: number) {
    const boss = this.boss1;
    if (!boss) return;

    if (!boss.enraged && boss.health <= boss.maxHealth * BOSS1_RAGE_HEALTH_RATIO) {
      boss.enraged = true;
    }

    const speed = boss.enraged ? BOSS1_SPEED * BOSS1_RAGE_SPEED_MULTIPLIER : BOSS1_SPEED;
    boss.x += boss.dir * speed * dt;
    if (boss.x <= 20 || boss.x + boss.w >= GAME_WIDTH - 20) boss.dir *= -1;
    boss.x = Math.max(20, Math.min(GAME_WIDTH - 20 - boss.w, boss.x));

    this.updateMinions(dt);

    boss.phaseTimer -= dt;
    switch (boss.phase) {
      case "cooldown":
        if (boss.phaseTimer <= 0) this.startNextBoss1Attack(boss);
        break;
      case "telegraph":
        if (boss.phaseTimer <= 0) {
          boss.phase = "acting";
          boss.phaseTimer = BOSS1_LASER_FIRE_TIME;
        }
        break;
      case "acting":
        if (boss.attackIndex % 3 === 0) this.checkLaserHit(boss);
        if (boss.phaseTimer <= 0) {
          boss.phase = "cooldown";
          boss.phaseTimer = boss.enraged ? BOSS1_RAGE_ATTACK_GAP : BOSS_ATTACK_GAP;
          boss.attackIndex += 1;
        }
        break;
    }

    this.handleBoss1Collisions(boss);
  }

  private startNextBoss1Attack(boss: Boss1) {
    const attack = boss.attackIndex % 3;
    if (attack === 0) {
      boss.laserThird = Math.floor(Math.random() * 3);
      boss.phase = "telegraph";
      boss.phaseTimer = boss.enraged
        ? BOSS1_LASER_TELEGRAPH_TIME * BOSS1_RAGE_TELEGRAPH_MULTIPLIER
        : BOSS1_LASER_TELEGRAPH_TIME;
    } else if (attack === 1) {
      this.fireBoss1Spread(boss);
      boss.phase = "acting";
      boss.phaseTimer = 0.3;
    } else {
      this.summonMinions(boss);
      boss.phase = "acting";
      boss.phaseTimer = 0.3;
    }
  }

  private checkLaserHit(boss: Boss1) {
    if (performance.now() <= this.invulnerableUntil) return;
    const thirdWidth = GAME_WIDTH / 3;
    const laserX = boss.laserThird * thirdWidth;
    if (this.player.x + this.player.w > laserX && this.player.x < laserX + thirdWidth) {
      this.loseLife();
    }
  }

  private fireBoss1Spread(boss: Boss1) {
    const count: number = boss.enraged ? BOSS1_RAGE_SPREAD_COUNT : BOSS1_SPREAD_COUNT;
    const bulletSpeed = boss.enraged ? BOSS1_BULLET_SPEED * BOSS1_RAGE_BULLET_SPEED_MULTIPLIER : BOSS1_BULLET_SPEED;
    const spreadAngle = Math.PI / 2.2;
    for (let i = 0; i < count; i++) {
      const t = count === 1 ? 0 : i / (count - 1);
      const angle = Math.PI / 2 - spreadAngle / 2 + t * spreadAngle;
      this.bossBullets.push({
        x: boss.x + boss.w / 2 - BULLET_WIDTH / 2,
        y: boss.y + boss.h,
        w: BULLET_WIDTH,
        h: BULLET_HEIGHT,
        vx: Math.cos(angle) * bulletSpeed,
        vy: Math.sin(angle) * bulletSpeed,
      });
    }
  }

  private summonMinions(boss: Boss1) {
    for (let i = 0; i < BOSS1_SUMMON_COUNT; i++) {
      const x = boss.x + (boss.w / (BOSS1_SUMMON_COUNT + 1)) * (i + 1) - ALIEN_WIDTH / 2;
      this.minions.push({
        x,
        y: boss.y + boss.h + 10,
        w: ALIEN_WIDTH,
        h: ALIEN_HEIGHT,
        alive: true,
        fireTimer: 1 + Math.random(),
      });
    }
  }

  private updateMinions(dt: number) {
    for (const m of this.minions) {
      if (!m.alive) continue;
      m.y += 25 * dt;
      m.fireTimer -= dt;
      if (m.fireTimer <= 0 && this.alienBullets.length < MAX_ALIEN_BULLETS + 3) {
        this.alienBullets.push({
          x: m.x + m.w / 2 - BULLET_WIDTH / 2,
          y: m.y + m.h,
          w: BULLET_WIDTH,
          h: BULLET_HEIGHT,
        });
        m.fireTimer = 1.5 + Math.random();
      }
      if (m.y > GAME_HEIGHT) m.alive = false;
    }
    this.minions = this.minions.filter((m) => m.alive);
  }

  private handleBoss1Collisions(boss: Boss1) {
    for (const bullet of this.playerBullets) {
      if (bullet.y < -100) continue;
      if (rectsOverlap(bullet, boss)) {
        bullet.y = -9999;
        boss.health -= 2;
        this.score += 5;
        this.callbacks.onScoreChange?.(this.score);
      }
      for (const m of this.minions) {
        if (!m.alive || bullet.y < -100) continue;
        if (rectsOverlap(bullet, m)) {
          m.alive = false;
          bullet.y = -9999;
          this.score += 20;
          this.callbacks.onScoreChange?.(this.score);
        }
      }
    }
    this.playerBullets = this.playerBullets.filter((b) => b.y > -100);
    this.minions = this.minions.filter((m) => m.alive);

    if (performance.now() > this.invulnerableUntil) {
      let hit = false;
      for (const bullet of this.alienBullets) {
        if (rectsOverlap(bullet, this.player)) {
          bullet.y = GAME_HEIGHT + 999;
          hit = true;
          break;
        }
      }
      if (!hit) {
        for (const bullet of this.bossBullets) {
          if (rectsOverlap(bullet, this.player)) {
            bullet.x = -9999;
            hit = true;
            break;
          }
        }
      }
      if (hit) this.loseLife();
    }
    this.alienBullets = this.alienBullets.filter((b) => b.y < GAME_HEIGHT + 500);
    this.bossBullets = this.bossBullets.filter(
      (b) => b.x > -50 && b.x < GAME_WIDTH + 50 && b.y > -50 && b.y < GAME_HEIGHT + 50,
    );

    if (boss.health <= 0) {
      this.score += BOSS1_KILL_SCORE;
      this.callbacks.onScoreChange?.(this.score);
      this.startBossClearTransition(boss.x, boss.y, boss.w, boss.h);
      this.boss1 = null;
      this.minions = [];
      this.bossBullets = [];
    }
  }

  // ============================================================
  // Boss 2: rival ship dogfight through an asteroid field
  // ============================================================
  private updateBoss2(dt: number) {
    const boss = this.boss2;
    if (!boss) return;

    const phase = boss.health <= BOSS2_FINAL_HEALTH_THRESHOLD ? 3 : boss.health <= BOSS2_LASER_HEALTH_THRESHOLD ? 2 : 1;

    boss.bobAngle += dt;
    boss.y = 90 + Math.sin(boss.bobAngle) * 40;

    // dodge incoming player bullets instead of always sitting directly above the player
    let dodgeDir = 0;
    for (const b of this.playerBullets) {
      if (b.y > boss.y + boss.h || b.y < boss.y - BOSS2_DODGE_LOOKAHEAD) continue;
      const bulletCenter = b.x + b.w / 2;
      const bossCenter = boss.x + boss.w / 2;
      if (Math.abs(bulletCenter - bossCenter) < boss.w / 2 + BOSS2_DODGE_MARGIN) {
        dodgeDir = bulletCenter < bossCenter ? 1 : -1;
        break;
      }
    }

    if (dodgeDir !== 0) {
      boss.x += dodgeDir * BOSS2_DODGE_SPEED * dt;
    } else {
      boss.wanderTimer -= dt;
      if (boss.wanderTimer <= 0) {
        boss.wanderOffset = (Math.random() * 2 - 1) * 100;
        boss.wanderTimer = BOSS2_WANDER_INTERVAL;
      }
      const targetX = this.player.x + this.player.w / 2 - boss.w / 2 + boss.wanderOffset;
      const maxStep = BOSS2_SPEED * dt;
      boss.x += Math.max(-maxStep, Math.min(maxStep, targetX - boss.x));
    }
    boss.x = Math.max(0, Math.min(GAME_WIDTH - boss.w, boss.x));

    if (phase === 3) {
      // shield stays up until the orbs are cleared, then a normal hit finishes the boss off
      boss.shielded = boss.orbsDestroyed < BOSS2_ORBS_REQUIRED;
    } else if (boss.shielded) {
      boss.shieldTimer -= dt;
      if (boss.shieldTimer <= 0) boss.shielded = false;
    }

    boss.fireTimer -= dt;
    if (boss.fireTimer <= 0) {
      const dxp = this.player.x + this.player.w / 2 - (boss.x + boss.w / 2);
      const dyp = this.player.y - (boss.y + boss.h);
      const dist = Math.hypot(dxp, dyp) || 1;
      this.bossBullets.push({
        x: boss.x + boss.w / 2 - BULLET_WIDTH / 2,
        y: boss.y + boss.h,
        w: BULLET_WIDTH,
        h: BULLET_HEIGHT,
        vx: (dxp / dist) * BOSS2_BULLET_SPEED,
        vy: (dyp / dist) * BOSS2_BULLET_SPEED,
      });
      boss.fireTimer = BOSS2_FIRE_INTERVAL;
    }

    if (phase >= 2) {
      this.updateBoss2Laser(boss, dt);

      boss.missileCooldown -= dt;
      if (boss.missileCooldown <= 0) {
        this.fireBoss2Missiles(boss);
        boss.missileCooldown = BOSS2_MISSILE_COOLDOWN;
      }
    }

    if (phase === 3 && boss.orbsDestroyed < BOSS2_ORBS_REQUIRED) {
      boss.orbSpawnTimer -= dt;
      if (boss.orbSpawnTimer <= 0) {
        this.orbs.push({
          x: Math.random() * (GAME_WIDTH - BOSS2_ORB_SIZE),
          y: -BOSS2_ORB_SIZE,
          w: BOSS2_ORB_SIZE,
          h: BOSS2_ORB_SIZE,
          vy: BOSS2_ORB_SPEED,
        });
        boss.orbSpawnTimer = BOSS2_ORB_SPAWN_INTERVAL;
      }
    }

    this.updateAsteroids(dt);
    this.updateMissiles(dt);
    this.updateOrbs(dt);
    this.handleBoss2Collisions(boss, phase);
  }

  private updateBoss2Laser(boss: Boss2, dt: number) {
    if (boss.laserState === "idle") {
      boss.laserCooldown -= dt;
      if (boss.laserCooldown <= 0) {
        boss.laserState = "charging";
        boss.laserTimer = BOSS2_LASER_CHARGE_TIME;
        boss.laserX = this.player.x + this.player.w / 2;
      }
    } else if (boss.laserState === "charging") {
      boss.laserTimer -= dt;
      if (boss.laserTimer <= 0) {
        boss.laserState = "firing";
        boss.laserTimer = BOSS2_LASER_FIRE_TIME;
      }
    } else if (boss.laserState === "firing") {
      boss.laserTimer -= dt;
      if (boss.laserTimer <= 0) {
        boss.laserState = "idle";
        boss.laserCooldown = BOSS2_LASER_COOLDOWN;
      }
    }
  }

  private fireBoss2Missiles(boss: Boss2) {
    for (const offset of [-1, 1]) {
      this.missiles.push({
        x: boss.x + boss.w / 2 - BOSS2_MISSILE_SIZE / 2 + offset * boss.w * 0.4,
        y: boss.y + boss.h,
        w: BOSS2_MISSILE_SIZE,
        h: BOSS2_MISSILE_SIZE,
        vx: offset * 40,
        vy: 60,
      });
    }
  }

  private updateMissiles(dt: number) {
    for (const m of this.missiles) {
      const dx = this.player.x + this.player.w / 2 - (m.x + m.w / 2);
      const dy = this.player.y - m.y;
      const dist = Math.hypot(dx, dy) || 1;
      const desiredVx = (dx / dist) * BOSS2_MISSILE_SPEED;
      const desiredVy = (dy / dist) * BOSS2_MISSILE_SPEED;
      const turn = Math.min(1, BOSS2_MISSILE_TURN_RATE * dt);
      m.vx += (desiredVx - m.vx) * turn;
      m.vy += (desiredVy - m.vy) * turn;
      m.x += m.vx * dt;
      m.y += m.vy * dt;
    }
    this.missiles = this.missiles.filter((m) => m.y > -50 && m.y < GAME_HEIGHT + 50);
  }

  private updateOrbs(dt: number) {
    for (const o of this.orbs) o.y += o.vy * dt;
    this.orbs = this.orbs.filter((o) => o.y < GAME_HEIGHT + 50);
  }

  private updateAsteroids(dt: number) {
    this.asteroidSpawnTimer -= dt;
    if (this.asteroidSpawnTimer <= 0) {
      const size = ASTEROID_MIN_SIZE + Math.random() * (ASTEROID_MAX_SIZE - ASTEROID_MIN_SIZE);
      this.asteroids.push({
        x: Math.random() * (GAME_WIDTH - size),
        y: -size,
        w: size,
        h: size,
        vy: ASTEROID_MIN_SPEED + Math.random() * (ASTEROID_MAX_SPEED - ASTEROID_MIN_SPEED),
        hp: ASTEROID_HIT_POINTS,
        maxHp: ASTEROID_HIT_POINTS,
      });
      this.asteroidSpawnTimer = ASTEROID_SPAWN_INTERVAL;
    }
    for (const a of this.asteroids) a.y += a.vy * dt;
    this.asteroids = this.asteroids.filter((a) => a.y < GAME_HEIGHT + 50);
  }

  private fireBoss2Burst(boss: Boss2) {
    for (let i = 0; i < BOSS2_BURST_COUNT; i++) {
      const angle = (i / BOSS2_BURST_COUNT) * Math.PI * 2;
      this.bossBullets.push({
        x: boss.x + boss.w / 2 - BULLET_WIDTH / 2,
        y: boss.y + boss.h / 2 - BULLET_HEIGHT / 2,
        w: BULLET_WIDTH,
        h: BULLET_HEIGHT,
        vx: Math.cos(angle) * BOSS2_BURST_SPEED,
        vy: Math.sin(angle) * BOSS2_BURST_SPEED,
      });
    }
  }

  private defeatBoss2() {
    const boss = this.boss2;
    this.score += BOSS2_KILL_SCORE;
    this.callbacks.onScoreChange?.(this.score);
    if (boss) this.startBossClearTransition(boss.x, boss.y, boss.w, boss.h);
    this.boss2 = null;
    this.bossBullets = [];
    this.asteroids = [];
    this.missiles = [];
    this.orbs = [];
  }

  private handleBoss2Collisions(boss: Boss2, phase: number) {
    for (const bullet of this.playerBullets) {
      if (bullet.y < -100) continue;

      let consumed = false;
      for (const m of this.missiles) {
        if (m.y < -100) continue;
        if (rectsOverlap(bullet, m)) {
          m.y = -9999;
          consumed = true;
          break;
        }
      }
      if (consumed) {
        bullet.y = -9999;
        continue;
      }

      for (const o of this.orbs) {
        if (o.y < -100) continue;
        if (rectsOverlap(bullet, o)) {
          o.y = -9999;
          boss.orbsDestroyed += 1;
          consumed = true;
          break;
        }
      }
      if (consumed) {
        bullet.y = -9999;
        continue;
      }

      for (const a of this.asteroids) {
        if (a.y < -200) continue;
        if (rectsOverlap(bullet, a)) {
          a.hp -= 1;
          consumed = true;
          if (a.hp <= 0) a.y = GAME_HEIGHT + 999;
          break;
        }
      }
      if (consumed) {
        bullet.y = -9999;
        continue;
      }

      if (rectsOverlap(bullet, boss)) {
        bullet.y = -9999;
        if (!boss.shielded) {
          boss.health -= 1;
          if (boss.health <= 0) {
            this.defeatBoss2();
            return;
          }
          boss.shielded = true;
          boss.shieldTimer = BOSS2_SHIELD_TIME;
          this.fireBoss2Burst(boss);
        }
      }
    }
    this.playerBullets = this.playerBullets.filter((b) => b.y > -100);

    if (performance.now() > this.invulnerableUntil) {
      let hit = false;
      for (const a of this.asteroids) {
        if (rectsOverlap(a, this.player)) {
          a.y = GAME_HEIGHT + 999;
          hit = true;
          break;
        }
      }
      if (!hit) {
        for (const bullet of this.bossBullets) {
          if (rectsOverlap(bullet, this.player)) {
            bullet.x = -9999;
            hit = true;
            break;
          }
        }
      }
      if (!hit) {
        for (const m of this.missiles) {
          if (rectsOverlap(m, this.player)) {
            m.y = -9999;
            hit = true;
            break;
          }
        }
      }
      if (
        !hit &&
        boss.laserState === "firing" &&
        this.player.x + this.player.w > boss.laserX - BOSS2_LASER_WIDTH / 2 &&
        this.player.x < boss.laserX + BOSS2_LASER_WIDTH / 2
      ) {
        hit = true;
      }
      if (hit) this.loseLife();
    }

    // asteroids also detonate any missile they collide with
    for (const a of this.asteroids) {
      if (a.y < -200) continue;
      for (const m of this.missiles) {
        if (m.y < -100) continue;
        if (rectsOverlap(a, m)) m.y = -9999;
      }
    }

    this.asteroids = this.asteroids.filter((a) => a.y < GAME_HEIGHT + 500 && a.hp > 0);
    this.missiles = this.missiles.filter((m) => m.y > -50 && m.y < GAME_HEIGHT + 50);
    this.orbs = this.orbs.filter((o) => o.y > -50 && o.y < GAME_HEIGHT + 50);
    this.bossBullets = this.bossBullets.filter(
      (b) => b.x > -50 && b.x < GAME_WIDTH + 50 && b.y > -50 && b.y < GAME_HEIGHT + 50,
    );
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

    if (this.waveKind === "boss1" && this.boss1) this.renderBoss1(this.boss1);
    if (this.waveKind === "boss2" && this.boss2) this.renderBoss2(this.boss2);
    if (this.waveKind === "warning") this.renderBossWarning();
    if (this.waveKind === "clear") this.renderBossClear();

    ctx.fillStyle = "#9a9a9a";
    for (const a of this.asteroids) {
      ctx.beginPath();
      ctx.arc(a.x + a.w / 2, a.y + a.h / 2, a.w / 2, 0, Math.PI * 2);
      ctx.fill();
      if (a.hp < a.maxHp) {
        ctx.strokeStyle = "#3a3a3a";
        ctx.lineWidth = 1;
        const cracks = a.maxHp - a.hp;
        const cx = a.x + a.w / 2;
        const cy = a.y + a.h / 2;
        for (let i = 0; i < cracks; i++) {
          const angle = (i / a.maxHp) * Math.PI * 2 + a.x;
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.lineTo(cx + Math.cos(angle) * a.w / 2, cy + Math.sin(angle) * a.h / 2);
          ctx.stroke();
        }
      }
    }

    ctx.fillStyle = "#ff8844";
    for (const m of this.missiles) ctx.fillRect(m.x, m.y, m.w, m.h);

    const orbPulse = 0.6 + Math.sin(performance.now() / 150) * 0.4;
    ctx.fillStyle = `rgba(102, 255, 255, ${orbPulse.toFixed(2)})`;
    for (const o of this.orbs) {
      ctx.beginPath();
      ctx.arc(o.x + o.w / 2, o.y + o.h / 2, o.w / 2, 0, Math.PI * 2);
      ctx.fill();
    }

    const flashing =
      performance.now() < this.invulnerableUntil && Math.floor(performance.now() / 100) % 2 === 0;
    ctx.fillStyle = flashing ? "#0a6b33" : "#22e06e";
    ctx.fillRect(this.player.x, this.player.y, this.player.w, this.player.h);

    ctx.fillStyle = "#e0e022";
    for (const alien of this.aliens) {
      if (!alien.alive) continue;
      ctx.fillRect(alien.x, alien.y, alien.w, alien.h);
    }

    ctx.fillStyle = "#ffaa55";
    for (const m of this.minions) {
      if (!m.alive) continue;
      ctx.fillRect(m.x, m.y, m.w, m.h);
    }

    ctx.fillStyle = "#ffffff";
    for (const b of this.playerBullets) ctx.fillRect(b.x, b.y, b.w, b.h);

    ctx.fillStyle = "#ff4444";
    for (const b of this.alienBullets) ctx.fillRect(b.x, b.y, b.w, b.h);

    ctx.fillStyle = "#ff66ff";
    for (const b of this.bossBullets) ctx.fillRect(b.x, b.y, b.w, b.h);
  }

  private renderBoss1(boss: Boss1) {
    const ctx = this.ctx;
    const thirdWidth = GAME_WIDTH / 3;

    if (boss.phase === "telegraph") {
      ctx.fillStyle = "rgba(255,0,0,0.25)";
      ctx.fillRect(boss.laserThird * thirdWidth, boss.y + boss.h, thirdWidth, GAME_HEIGHT - (boss.y + boss.h));
    } else if (boss.phase === "acting" && boss.attackIndex % 3 === 0) {
      ctx.fillStyle = "rgba(255,60,60,0.85)";
      ctx.fillRect(boss.laserThird * thirdWidth, boss.y + boss.h, thirdWidth, GAME_HEIGHT - (boss.y + boss.h));
    }

    ctx.fillStyle = boss.enraged ? "#ff2020" : "#ff6b00";
    ctx.fillRect(boss.x, boss.y, boss.w, boss.h);

    this.renderHealthBar(
      boss.x,
      boss.y - 14,
      boss.w,
      boss.health,
      boss.maxHealth,
      boss.enraged ? "MOTHERSHIP — OVERDRIVE" : "MOTHERSHIP",
    );
  }

  private renderBoss2(boss: Boss2) {
    const ctx = this.ctx;
    const shake = boss.laserState === "charging" ? Math.sin(performance.now() / 25) * 3 : 0;

    ctx.fillStyle = "#ff5577";
    ctx.fillRect(boss.x + shake, boss.y, boss.w, boss.h);

    if (boss.laserState === "charging") {
      ctx.fillStyle = "rgba(255,40,40,0.25)";
      ctx.fillRect(boss.laserX - BOSS2_LASER_WIDTH / 2, boss.y + boss.h, BOSS2_LASER_WIDTH, GAME_HEIGHT - (boss.y + boss.h));
    } else if (boss.laserState === "firing") {
      ctx.fillStyle = "rgba(255,20,20,0.9)";
      ctx.fillRect(boss.laserX - BOSS2_LASER_WIDTH / 2, boss.y + boss.h, BOSS2_LASER_WIDTH, GAME_HEIGHT - (boss.y + boss.h));
    }

    if (boss.shielded) {
      ctx.strokeStyle = boss.health <= BOSS2_FINAL_HEALTH_THRESHOLD ? "#ff66ff" : "#66ffff";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(boss.x + boss.w / 2, boss.y + boss.h / 2, Math.max(boss.w, boss.h) * 0.9, 0, Math.PI * 2);
      ctx.stroke();
    }

    const barWidth = 100;
    this.renderHealthBar(boss.x + boss.w / 2 - barWidth / 2, boss.y - 14, barWidth, boss.health, boss.maxHealth, "RIVAL");
  }

  private renderBossWarning() {
    const ctx = this.ctx;
    const flash = Math.floor(performance.now() / 200) % 2 === 0;
    ctx.strokeStyle = flash ? "#ff2222" : "#661111";
    ctx.lineWidth = 8;
    ctx.strokeRect(4, 4, GAME_WIDTH - 8, GAME_HEIGHT - 8);

    const label = this.pendingBossKind === "boss1" ? "MOTHERSHIP" : "RIVAL";
    ctx.textAlign = "center";
    ctx.fillStyle = "#ff3333";
    ctx.font = "bold 22px monospace";
    ctx.fillText("WARNING", GAME_WIDTH / 2, GAME_HEIGHT / 2 - 16);
    ctx.font = "bold 14px monospace";
    ctx.fillText(`${label} INCOMING`, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 10);
    ctx.textAlign = "left";
  }

  private renderBossClear() {
    const ctx = this.ctx;
    ctx.fillStyle = "#ffcc66";
    for (const p of this.explosionParticles) {
      ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    if (this.transitionTimer < BOSS_CLEAR_REST_TIME) {
      ctx.textAlign = "center";
      ctx.fillStyle = "#66ff99";
      ctx.font = "bold 20px monospace";
      ctx.fillText("WAVE CLEAR", GAME_WIDTH / 2, GAME_HEIGHT / 2);
      ctx.textAlign = "left";
    }
  }

  private renderHealthBar(x: number, y: number, w: number, health: number, maxHealth: number, label: string) {
    const ctx = this.ctx;
    ctx.fillStyle = "#333333";
    ctx.fillRect(x, y, w, 6);
    ctx.fillStyle = "#ff3333";
    ctx.fillRect(x, y, w * Math.max(0, health / maxHealth), 6);
    ctx.fillStyle = "#ffffff";
    ctx.font = "10px monospace";
    ctx.fillText(label, x, y - 3);
  }
}
