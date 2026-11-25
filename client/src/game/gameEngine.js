/**
 * gameEngine.js — The core engine (spec §49, §83, §84, §86).
 *
 * A framework-agnostic class that owns ALL gameplay: the board, the launcher,
 * aiming, shooting, collision, matching, floating-bubble chains, scoring,
 * combos, specials, boosters, undo, hints, the shot system, objective checks,
 * particles, and canvas rendering. React only drives input and renders the HUD
 * from `getSnapshot()`. Game logic is intentionally NOT inside any component.
 *
 * It runs a clear state machine (spec §86) and prevents double-shooting
 * (spec §87): a new shot is only accepted in READY/AIMING with no bubble in
 * flight and no active resolution.
 */

import { BOARD, COLORS, COLOR_ORDER } from '../config/gameConfig.js';
import { cellKey, cellToPixel, neighbors, boardHeight } from './hexGrid.js';
import { simulateShot } from './collision.js';
import { findConnectedSameColor } from './matchDetector.js';
import { findFloatingBubbles } from './floatingDetector.js';
import { scoreShot, computeStars } from './scoreManager.js';
import { applySpecial, applyColorChanger } from './specialBubbles.js';
import { buildInitialBoard, cloneBoard } from './levelManager.js';
import { isObjectiveComplete } from './objectiveManager.js';
import { mulberry32, pick } from '../utils/rng.js';

export const STATE = {
  LOADING: 'LOADING',
  READY: 'READY',
  AIMING: 'AIMING',
  SHOOTING: 'SHOOTING',
  RESOLVING: 'RESOLVING',
  COMBO: 'COMBO',
  LEVEL_COMPLETE: 'LEVEL_COMPLETE',
  LEVEL_FAILED: 'LEVEL_FAILED',
  PAUSED: 'PAUSED',
};

const TAU = Math.PI * 2;

export class GameEngine {
  constructor({ onChange, onSound } = {}) {
    this.onChange = onChange || (() => {});
    this.onSound = onSound || (() => {});

    this.canvas = null;
    this.ctx = null;
    this.dpr = 1;
    this.rafId = null;
    this.lastTime = 0;

    this.geo = null;
    this.board = new Map();
    this.initialBoard = new Map();

    this.level = null;
    this.state = STATE.LOADING;
    this.prevState = STATE.LOADING;

    this.aimAngle = Math.PI / 2;
    this.current = null;
    this.next = null;
    this.queue = [];
    this.queueIndex = 0;

    this.shotsRemaining = 0;
    this.score = 0;
    this.combo = 0; // consecutive successful shots
    this.bestCombo = 0;
    this.rescuedCount = 0;
    this.droppedCount = 0;
    this.bubblesPopped = 0;
    this.shotsUsed = 0;

    this.moving = null; // { path, cursor, bubble, landing }
    this.falling = []; // animated dropping bubbles
    this.particles = [];
    this.popups = []; // floating score/combo text

    this.longAim = false;
    this.hint = null; // { angle, expires }
    this.history = []; // undo snapshots

    this.booster = { armed: null }; // next shot modifier from a booster
    this.stars = 0;

    this._rngFx = mulberry32(12345);
  }

  /* -------------------------------------------------------------- lifecycle */

  init(level) {
    this.level = level;
    const r = BOARD.bubbleRadius;
    const cols = BOARD.cols;
    const maxRows = BOARD.rows + 4;
    const width = cols * r * 2;
    const height = boardHeight(BOARD.rows + 1, r) + 110; // room for launcher
    this.geo = {
      r,
      cols,
      maxRows,
      width,
      height,
      snapFactor: BOARD.snapDistance + 0.18,
      shooterX: width / 2,
      shooterY: height - 56,
    };

    this.board = buildInitialBoard(level);
    this.initialBoard = cloneBoard(this.board);

    this.queue = level.bubbleQueue.map((q) => ({ ...q }));
    this.queueIndex = 0;
    this.shotsRemaining = level.shots;
    this.score = 0;
    this.combo = 0;
    this.bestCombo = 0;
    this.rescuedCount = 0;
    this.droppedCount = 0;
    this.bubblesPopped = 0;
    this.shotsUsed = 0;
    this.stars = 0;
    this.moving = null;
    this.falling = [];
    this.particles = [];
    this.popups = [];
    this.history = [];
    this.booster = { armed: null };
    this.hint = null;

    this.current = this._drawFromQueue();
    this.next = this._drawFromQueue();
    this.aimAngle = Math.PI / 2;

    this._setState(STATE.READY);
    this.emit();
  }

  setCanvas(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.resize();
  }

  resize() {
    if (!this.canvas || !this.geo) return;
    const cssWidth = this.canvas.clientWidth || this.geo.width;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.dpr = dpr;
    const aspect = this.geo.height / this.geo.width;
    this.canvas.width = Math.round(cssWidth * dpr);
    this.canvas.height = Math.round(cssWidth * aspect * dpr);
    this.canvas.style.height = `${Math.round(cssWidth * aspect)}px`;
    this.scale = this.canvas.width / this.geo.width;
  }

  start() {
    if (this.rafId) return;
    this.lastTime = performance.now();
    const loop = (t) => {
      const dt = Math.min(48, t - this.lastTime);
      this.lastTime = t;
      this.update(dt);
      this.render();
      this.rafId = requestAnimationFrame(loop);
    };
    this.rafId = requestAnimationFrame(loop);
  }

  destroy() {
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.rafId = null;
  }

  /* ----------------------------------------------------------------- input */

  // Convert a CSS-pixel pointer position into an aim angle.
  pointerToAngle(cssX, cssY) {
    if (!this.canvas || !this.geo) return this.aimAngle;
    const rect = this.canvas.getBoundingClientRect();
    const lx = ((cssX - rect.left) / rect.width) * this.geo.width;
    const ly = ((cssY - rect.top) / rect.height) * this.geo.height;
    const dx = lx - this.geo.shooterX;
    const dy = this.geo.shooterY - ly; // up positive
    let a = Math.atan2(dy, dx);
    const min = 0.14 * Math.PI;
    const max = 0.86 * Math.PI;
    if (a < min) a = min;
    if (a > max) a = max;
    return a;
  }

  setAim(cssX, cssY) {
    if (this.state === STATE.READY || this.state === STATE.AIMING) {
      this.aimAngle = this.pointerToAngle(cssX, cssY);
      if (this.state === STATE.READY) this._setState(STATE.AIMING);
    }
  }

  /** The player fires. Double-shooting is impossible mid-resolution. */
  shoot() {
    if (this.state !== STATE.READY && this.state !== STATE.AIMING) return false;
    if (this.moving) return false;

    this._pushHistory();

    const bubble = { ...this.current };
    if (this.booster.armed) {
      bubble.special = this.booster.armed;
      this.booster.armed = null;
    }

    const sim = simulateShot(
      { x: this.geo.shooterX, y: this.geo.shooterY },
      this.aimAngle,
      this.board,
      this.geo
    );

    this.moving = { path: sim.path, cursor: 0, bubble, landing: sim.landing };
    this.hint = null;
    this._setState(STATE.SHOOTING);
    this.onSound('launch');
    this.emit();
    return true;
  }

  /* --------------------------------------------------------------- update */

  update(dt) {
    if (this.state === STATE.PAUSED) return;
    this._updateMoving(dt);
    this._updateFalling(dt);
    this._updateParticles(dt);
    this._updatePopups(dt);
    if (this.hint && performance.now() > this.hint.expires) this.hint = null;
  }

  _updateMoving() {
    if (!this.moving) return;
    const speed = Math.max(1, Math.round(BOARD.shotSpeed / (this.geo.r * 0.5)));
    this.moving.cursor += speed;
    if (this.moving.cursor >= this.moving.path.length - 1) {
      this._attach(this.moving.bubble, this.moving.landing);
      this.moving = null;
    }
  }

  _updateFalling(dt) {
    const g = 0.0016 * dt * dt + 0.25;
    for (const f of this.falling) {
      f.vy += g;
      f.y += f.vy;
      f.rot += f.vr;
      f.alpha -= 0.012;
    }
    this.falling = this.falling.filter((f) => f.y < this.geo.height + 60 && f.alpha > 0);
  }

  _updateParticles(dt) {
    for (const p of this.particles) {
      p.vy += 0.12;
      p.x += p.vx;
      p.y += p.vy;
      p.life -= dt;
      p.alpha = Math.max(0, p.life / p.maxLife);
    }
    this.particles = this.particles.filter((p) => p.life > 0);
  }

  _updatePopups(dt) {
    for (const t of this.popups) {
      t.y -= 0.4;
      t.life -= dt;
      t.alpha = Math.max(0, t.life / t.maxLife);
    }
    this.popups = this.popups.filter((t) => t.life > 0);
  }

  /* ------------------------------------------------- shot resolution logic */

  _attach(bubble, landing) {
    if (!landing) {
      this._afterShot(0, 0, 0, false);
      return;
    }
    const key = cellKey(landing.row, landing.col);
    const placed = { row: landing.row, col: landing.col, color: bubble.color, special: bubble.special || null };
    this.board.set(key, placed);
    this.onSound('collision');
    this._setState(STATE.RESOLVING);

    const toRemove = new Set();
    let rescued = 0;

    // Special bubble effects (bomb / lightning / fire / color-changer).
    if (placed.special === 'bomb' || placed.special === 'lightning' || placed.special === 'fire') {
      for (const k of applySpecial(placed.special, landing, this.board, this.geo)) toRemove.add(k);
      toRemove.add(key);
      this.onSound(placed.special === 'bomb' ? 'bomb' : 'rainbow');
    } else if (placed.special === 'color') {
      for (const op of applyColorChanger(landing, placed.color, this.board, this.geo)) {
        const b = this.board.get(op.key);
        if (b) b.color = op.newColor;
      }
    }

    // Normal connected-color match (rainbow acts as wildcard).
    const group = findConnectedSameColor(this.board, landing, this.geo.cols, this.geo.maxRows);
    if (placed.special === 'rainbow' || group.length >= 3) {
      for (const b of group) toRemove.add(cellKey(b.row, b.col));
    }

    let popped = 0;
    if (toRemove.size) {
      for (const k of toRemove) {
        const b = this.board.get(k);
        if (!b) continue;
        if (b.hidden) rescued++;
        this._spawnPop(b);
        this.board.delete(k);
        popped++;
      }
    }

    // Floating-bubble chain reaction (spec §20, §37).
    let dropped = 0;
    if (popped > 0) {
      const floating = findFloatingBubbles(this.board, this.geo.cols, this.geo.maxRows);
      for (const b of floating) {
        if (b.hidden) rescued++;
        this._spawnFall(b);
        this.board.delete(cellKey(b.row, b.col));
        dropped++;
      }
      if (dropped > 0) this.onSound('floatingFall');
    }

    this._afterShot(popped, dropped, rescued, group.length >= 4 || toRemove.size >= 5);
  }

  _afterShot(popped, dropped, rescued, perfect) {
    const success = popped + dropped > 0;
    if (success) this.combo += 1;
    else this.combo = 0;
    this.bestCombo = Math.max(this.bestCombo, this.combo);

    const { total, breakdown } = scoreShot({
      popped,
      floating: dropped,
      rescued,
      comboLevel: Math.max(1, this.combo),
      perfect,
    });
    this.score += total;
    this.bubblesPopped += popped + dropped;
    this.rescuedCount += rescued;
    this.droppedCount += dropped;
    this.shotsRemaining -= 1;
    this.shotsUsed += 1;

    if (success) {
      this.onSound(popped + dropped >= 5 ? 'multiPop' : 'pop');
      if (this.combo >= 2) this.onSound('combo');
      this._spawnPopup(`+${total}`, this.combo >= 2 ? `COMBO x${this.combo}` : null);
    }
    if (rescued > 0) {
      this.onSound('rescue');
      this._spawnPopup('RESCUED!', null, '#ffd23f');
    }

    this._evaluateEnd();
    this.emit();
  }

  _evaluateEnd() {
    const snapshot = {
      board: this.board,
      score: this.score,
      rescuedCount: this.rescuedCount,
      droppedCount: this.droppedCount,
      bestCombo: this.bestCombo,
    };
    const complete = isObjectiveComplete(this.level.objective, snapshot);

    // Danger: bubbles reaching the bottom danger row is a loss (spec §3 lose).
    let crossedDanger = false;
    for (const b of this.board.values()) {
      if (b.row >= BOARD.dangerRow) {
        crossedDanger = true;
        break;
      }
    }

    if (complete) {
      this.stars = this._finalStars();
      this._setState(STATE.LEVEL_COMPLETE);
      this.onSound('levelComplete');
      return;
    }
    if (crossedDanger || this.shotsRemaining <= 0) {
      this._setState(STATE.LEVEL_FAILED);
      this.onSound('levelFailed');
      return;
    }

    // Load the next bubble and return to READY (spec §24, §25).
    this.current = this.next;
    this.next = this._drawFromQueue();
    this._setState(STATE.READY);
  }

  _finalStars() {
    const t = this.level.starThresholds;
    let stars = computeStars(this.score, t);
    // Reward shot efficiency: leftover shots can bump the rating.
    if (this.shotsRemaining >= Math.ceil(this.level.shots * 0.3)) stars = Math.min(3, stars + 1);
    return Math.max(1, stars);
  }

  /* --------------------------------------------------------------- queue */

  _drawFromQueue() {
    if (this.queueIndex < this.queue.length) {
      return { ...this.queue[this.queueIndex++] };
    }
    // Queue exhausted: generate a useful color (bias to colors on the board).
    const present = new Set([...this.board.values()].map((b) => b.color));
    const pool = present.size ? [...present] : this.level.colors;
    return { color: pick(this._rngFx, pool) };
  }

  /* ------------------------------------------------------------- boosters */

  useBooster(type) {
    if (this.state === STATE.LEVEL_COMPLETE || this.state === STATE.LEVEL_FAILED) {
      return { ok: false, reason: 'Level already ended' };
    }
    switch (type) {
      case 'aim':
        this.longAim = !this.longAim;
        this.onSound('booster');
        this.emit();
        return { ok: true, toggled: this.longAim, consume: false };
      case 'extraShot':
        if (this.state === STATE.SHOOTING || this.state === STATE.RESOLVING) {
          return { ok: false, reason: 'Wait for the shot to resolve' };
        }
        this.shotsRemaining += 5;
        this.onSound('booster');
        this.emit();
        return { ok: true, consume: true };
      case 'bomb':
        if (this.board.size === 0) return { ok: false, reason: 'No bubbles to target' };
        this.booster.armed = 'bomb';
        this.onSound('booster');
        this.emit();
        return { ok: true, consume: true };
      case 'rainbow':
        if (this.board.size === 0) return { ok: false, reason: 'No bubbles to target' };
        this.booster.armed = 'rainbow';
        this.onSound('booster');
        this.emit();
        return { ok: true, consume: true };
      case 'shuffle': {
        if (this.board.size === 0) return { ok: false, reason: 'Nothing to shuffle' };
        const colorsArr = [...this.board.values()].map((b) => b.color);
        for (let i = colorsArr.length - 1; i > 0; i--) {
          const j = Math.floor(this._rngFx() * (i + 1));
          [colorsArr[i], colorsArr[j]] = [colorsArr[j], colorsArr[i]];
        }
        let i = 0;
        for (const b of this.board.values()) {
          if (!b.special && !b.hidden) b.color = colorsArr[i];
          i++;
        }
        this.onSound('booster');
        this.emit();
        return { ok: true, consume: true };
      }
      default:
        return { ok: false, reason: 'Unknown booster' };
    }
  }

  /* ---------------------------------------------------- undo / hint / pause */

  _pushHistory() {
    this.history.push({
      board: cloneBoard(this.board),
      queueIndex: this.queueIndex,
      current: { ...this.current },
      next: { ...this.next },
      shotsRemaining: this.shotsRemaining,
      score: this.score,
      combo: this.combo,
      bestCombo: this.bestCombo,
      rescuedCount: this.rescuedCount,
      droppedCount: this.droppedCount,
      bubblesPopped: this.bubblesPopped,
      shotsUsed: this.shotsUsed,
    });
    if (this.history.length > 8) this.history.shift();
  }

  undo() {
    if (!this.history.length) return { ok: false, reason: 'Nothing to undo' };
    if (this.state === STATE.SHOOTING || this.state === STATE.RESOLVING) {
      return { ok: false, reason: 'Wait for the shot to resolve' };
    }
    const s = this.history.pop();
    this.board = s.board;
    this.queueIndex = s.queueIndex;
    this.current = s.current;
    this.next = s.next;
    this.shotsRemaining = s.shotsRemaining;
    this.score = s.score;
    this.combo = s.combo;
    this.bestCombo = s.bestCombo;
    this.rescuedCount = s.rescuedCount;
    this.droppedCount = s.droppedCount;
    this.bubblesPopped = s.bubblesPopped;
    this.shotsUsed = s.shotsUsed;
    this.falling = [];
    this.moving = null;
    this._setState(STATE.READY);
    this.onSound('booster');
    this.emit();
    return { ok: true };
  }

  /** Suggest the angle that pops the most bubbles with the current color. */
  requestHint() {
    let best = null;
    for (let deg = 20; deg <= 160; deg += 2) {
      const a = (deg * Math.PI) / 180;
      const sim = simulateShot({ x: this.geo.shooterX, y: this.geo.shooterY }, a, this.board, this.geo);
      if (!sim.landing) continue;
      // Count the hypothetical match at the landing cell.
      const temp = new Map(this.board);
      temp.set(cellKey(sim.landing.row, sim.landing.col), {
        row: sim.landing.row,
        col: sim.landing.col,
        color: this.current.color,
        special: this.current.special || null,
      });
      const group = findConnectedSameColor(temp, sim.landing, this.geo.cols, this.geo.maxRows);
      const size = this.current.special === 'rainbow' ? Math.max(group.length, 3) : group.length;
      if (!best || size > best.size) best = { angle: a, size, landing: sim.landing };
    }
    if (best && best.size >= 3) {
      this.aimAngle = best.angle;
      this.hint = { angle: best.angle, expires: performance.now() + 2500, landing: best.landing };
      this.onSound('booster');
      this.emit();
      return { ok: true };
    }
    this.hint = { angle: this.aimAngle, expires: performance.now() + 1500, landing: null };
    return { ok: true, weak: true };
  }

  pause() {
    if (this.state === STATE.LEVEL_COMPLETE || this.state === STATE.LEVEL_FAILED) return;
    this._resumeState = this.state === STATE.PAUSED ? this._resumeState : this.state;
    this._setState(STATE.PAUSED);
    this.emit();
  }

  resume() {
    if (this.state !== STATE.PAUSED) return;
    this._setState(this._resumeState || STATE.READY);
    this.lastTime = performance.now();
    this.emit();
  }

  restart() {
    this.init(this.level);
  }

  /* ----------------------------------------------------------- fx spawners */

  _spawnPop(b) {
    const p = cellToPixel(b.row, b.col, this.geo.r);
    const color = b.special === 'rainbow' ? '#ffffff' : COLORS[b.color] || '#fff';
    for (let i = 0; i < 7; i++) {
      const ang = this._rngFx() * TAU;
      const sp = 1 + this._rngFx() * 2.6;
      this.particles.push({
        x: p.x,
        y: p.y,
        vx: Math.cos(ang) * sp,
        vy: Math.sin(ang) * sp - 1,
        r: 2 + this._rngFx() * 2.5,
        color,
        life: 420,
        maxLife: 420,
        alpha: 1,
      });
    }
  }

  _spawnFall(b) {
    const p = cellToPixel(b.row, b.col, this.geo.r);
    this.falling.push({
      x: p.x,
      y: p.y,
      vy: 0.5 + this._rngFx(),
      rot: 0,
      vr: (this._rngFx() - 0.5) * 0.3,
      color: COLORS[b.color] || '#fff',
      alpha: 1,
      r: this.geo.r,
    });
  }

  _spawnPopup(text, sub, color) {
    this.popups.push({
      x: this.geo.width / 2,
      y: this.geo.height * 0.45,
      text,
      sub,
      color: color || '#ffffff',
      life: 900,
      maxLife: 900,
      alpha: 1,
    });
  }

  /* ---------------------------------------------------------------- render */

  render() {
    const { ctx, geo, scale } = this;
    if (!ctx || !geo) return;
    const S = scale;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Background wash.
    const bg = ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    bg.addColorStop(0, '#15132b');
    bg.addColorStop(1, '#0b0a18');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Danger line.
    const dangerY = (geo.r + BOARD.dangerRow * geo.r * Math.sqrt(3)) * S;
    ctx.strokeStyle = 'rgba(255,93,115,0.35)';
    ctx.setLineDash([8 * S, 6 * S]);
    ctx.lineWidth = 2 * S;
    ctx.beginPath();
    ctx.moveTo(0, dangerY);
    ctx.lineTo(this.canvas.width, dangerY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Board bubbles.
    for (const b of this.board.values()) {
      const p = cellToPixel(b.row, b.col, geo.r);
      this._drawBubble(ctx, p.x * S, p.y * S, geo.r * S, b);
    }

    // Trajectory preview (spec §13, §48).
    if ((this.state === STATE.READY || this.state === STATE.AIMING) && !this.moving) {
      this._drawTrajectory(ctx, S);
    }

    // Launcher + current/next bubble (spec §11, §24).
    this._drawLauncher(ctx, S);

    // Moving bubble.
    if (this.moving) {
      const pt = this.moving.path[Math.min(this.moving.cursor, this.moving.path.length - 1)];
      this._drawBubble(ctx, pt.x * S, pt.y * S, geo.r * S, this.moving.bubble);
    }

    // Falling bubbles.
    for (const f of this.falling) {
      ctx.save();
      ctx.globalAlpha = f.alpha;
      this._drawBubble(ctx, f.x * S, f.y * S, f.r * S, { color: f.color, _raw: true });
      ctx.restore();
    }

    // Particles.
    for (const p of this.particles) {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x * S, p.y * S, p.r * S, 0, TAU);
      ctx.fill();
      ctx.restore();
    }

    // Score / combo popups.
    for (const t of this.popups) {
      ctx.save();
      ctx.globalAlpha = t.alpha;
      ctx.fillStyle = t.color;
      ctx.textAlign = 'center';
      ctx.font = `800 ${26 * S}px "Baloo 2", system-ui, sans-serif`;
      ctx.fillText(t.text, t.x * S, t.y * S);
      if (t.sub) {
        ctx.fillStyle = '#ffd23f';
        ctx.font = `800 ${18 * S}px "Baloo 2", system-ui, sans-serif`;
        ctx.fillText(t.sub, t.x * S, (t.y + 24) * S);
      }
      ctx.restore();
    }
  }

  _drawBubble(ctx, x, y, r, b) {
    const base = b._raw ? b.color : COLORS[b.color] || '#9aa';
    ctx.save();

    if (b.hidden) {
      // Mystery bubble wrapping a rescue object (original styling).
      ctx.fillStyle = '#2a2740';
      ctx.beginPath();
      ctx.arc(x, y, r, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#ffd23f';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = `800 ${r * 1.1}px "Baloo 2", system-ui, sans-serif`;
      ctx.fillText('?', x, y + 1);
      ctx.restore();
      return;
    }

    const grad = ctx.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.18, base);
    grad.addColorStop(1, this._shade(base, -0.28));
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU);
    ctx.fill();

    // Specular highlight.
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.beginPath();
    ctx.arc(x - r * 0.3, y - r * 0.35, r * 0.22, 0, TAU);
    ctx.fill();

    if (b.special === 'rainbow') {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = Math.max(1, r * 0.14);
      ctx.beginPath();
      ctx.arc(x, y, r * 0.72, 0, TAU);
      ctx.stroke();
    } else if (b.special === 'bomb') {
      ctx.fillStyle = '#1a1830';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = `800 ${r}px system-ui`;
      ctx.fillText('✦', x, y + 1);
    }
    ctx.restore();
  }

  _drawLauncher(ctx, S) {
    const { geo } = this;
    const bx = geo.shooterX * S;
    const by = geo.shooterY * S;
    const r = geo.r * S;

    // Base.
    ctx.save();
    ctx.fillStyle = 'rgba(129,140,248,0.18)';
    ctx.beginPath();
    ctx.arc(bx, by, r * 1.9, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#1f1c38';
    ctx.beginPath();
    ctx.arc(bx, by, r * 1.5, 0, TAU);
    ctx.fill();
    ctx.restore();

    // Aim direction indicator.
    const len = r * 2.2;
    const ex = bx + Math.cos(this.aimAngle) * len;
    const ey = by - Math.sin(this.aimAngle) * len;
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 3 * S;
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.lineTo(ex, ey);
    ctx.stroke();

    // Current bubble sits in the launcher.
    if (this.current) this._drawBubble(ctx, bx, by, r, this.current);

    // Next bubble preview (to the side).
    if (this.next) {
      const nx = bx + r * 3.4;
      const ny = by + r * 0.2;
      ctx.save();
      ctx.globalAlpha = 0.9;
      this._drawBubble(ctx, nx, ny, r * 0.72, this.next);
      ctx.restore();
    }
  }

  _drawTrajectory(ctx, S) {
    const sim = simulateShot(
      { x: this.geo.shooterX, y: this.geo.shooterY },
      this.aimAngle,
      this.board,
      this.geo
    );
    const maxLen = this.longAim ? sim.path.length : Math.min(sim.path.length, Math.floor(sim.path.length * 0.75));
    ctx.save();
    ctx.fillStyle = 'rgba(255,255,255,0.65)';
    for (let i = 4; i < maxLen; i += 6) {
      const p = sim.path[i];
      ctx.beginPath();
      ctx.arc(p.x * S, p.y * S, 2.2 * S, 0, TAU);
      ctx.fill();
    }
    // Collision point marker.
    if (sim.landing) {
      const lp = cellToPixel(sim.landing.row, sim.landing.col, this.geo.r);
      ctx.strokeStyle = 'rgba(255,255,255,0.5)';
      ctx.lineWidth = 2 * S;
      ctx.beginPath();
      ctx.arc(lp.x * S, lp.y * S, this.geo.r * S, 0, TAU);
      ctx.stroke();
    }
    ctx.restore();
  }

  _shade(hex, amt) {
    const c = hex.replace('#', '');
    const num = parseInt(c.length === 3 ? c.split('').map((x) => x + x).join('') : c, 16);
    let r = (num >> 16) & 255;
    let g = (num >> 8) & 255;
    let b = num & 255;
    r = Math.max(0, Math.min(255, Math.round(r + r * amt)));
    g = Math.max(0, Math.min(255, Math.round(g + g * amt)));
    b = Math.max(0, Math.min(255, Math.round(b + b * amt)));
    return `rgb(${r},${g},${b})`;
  }

  /* ----------------------------------------------------------- state/emit */

  _setState(s) {
    this.prevState = this.state;
    this.state = s;
  }

  getSnapshot() {
    return {
      state: this.state,
      score: this.score,
      shotsRemaining: this.shotsRemaining,
      shotsUsed: this.shotsUsed,
      shotsTotal: this.level?.shots ?? 0,
      combo: this.combo,
      bestCombo: this.bestCombo,
      rescuedCount: this.rescuedCount,
      rescuedTotal: this.level?.hiddenTargets?.length ?? this.level?.objective?.count ?? 0,
      droppedCount: this.droppedCount,
      bubblesPopped: this.bubblesPopped,
      current: this.current,
      next: this.next,
      stars: this.stars,
      longAim: this.longAim,
      armed: this.booster.armed,
      bubblesLeft: this.board.size,
      canUndo: this.history.length > 0,
      objective: this.level?.objective,
      levelNumber: this.level?.levelNumber,
      targetScore: this.level?.targetScore,
    };
  }

  emit() {
    this.onChange(this.getSnapshot());
  }
}

export default GameEngine;
