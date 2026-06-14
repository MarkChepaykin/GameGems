// ══════════════════════════════════════════
//  GESTURE HINT OVERLAY
// ══════════════════════════════════════════
let _gestureHint = null; // { x1,y1, x2,y2, t, active }
let _gestureHintRaf = null; // cancelAnimationFrame handle

function showGestureHint(fromR, fromC, toR, toC) {
  // Cancel any existing loop before starting a new one
  if (_gestureHintRaf !== null) { cancelAnimationFrame(_gestureHintRaf); _gestureHintRaf = null; }
  const x1 = boardOffX + fromC * cellSize + cellSize / 2;
  const y1 = boardOffY + fromR * cellSize + cellSize / 2;
  const x2 = boardOffX + toC   * cellSize + cellSize / 2;
  const y2 = boardOffY + toR   * cellSize + cellSize / 2;
  _gestureHint = { x1, y1, x2, y2, t: 0, active: true };
  (function loop() {
    if (!_gestureHint || !_gestureHint.active) { _gestureHintRaf = null; return; }
    _gestureHint.t = (_gestureHint.t + 0.008) % 3.0;
    _gestureHintRaf = requestAnimationFrame(loop);
  })();
}

function hideGestureHint() {
  if (_gestureHintRaf !== null) { cancelAnimationFrame(_gestureHintRaf); _gestureHintRaf = null; }
  if (_gestureHint) _gestureHint.active = false;
  _gestureHint = null;
}

function drawGestureHint(pCtx) {
  if (!_gestureHint || !_gestureHint.active) return;
  const { x1, y1, x2, y2, t } = _gestureHint;
  // Phase: 0-1.4 = hand moves from cell1 to cell2; 1.4-2.0 = pause+fade; 2.0-3.0 = reappear
  let handX, handY, alpha, scale;
  if (t < 1.4) {
    const p = t / 1.4;
    const ease = p < 0.5 ? 2*p*p : -1+(4-2*p)*p;
    handX = x1 + (x2 - x1) * ease;
    handY = y1 + (y2 - y1) * ease;
    alpha = 1; scale = 1;
  } else if (t < 2.0) {
    handX = x2; handY = y2;
    alpha = 1 - (t - 1.4) / 0.6;
    scale = 1 + (t - 1.4) * 0.4;
  } else {
    handX = x1; handY = y1;
    alpha = (t - 2.0) / 1.0;
    scale = 0.5 + alpha * 0.5;
  }
  pCtx.save();
  pCtx.globalAlpha = alpha * 0.9;
  pCtx.translate(handX, handY);
  pCtx.scale(scale, scale);
  pCtx.shadowColor = 'rgba(0,0,0,0.7)';
  pCtx.shadowBlur = 8;
  pCtx.font = `${cellSize * 0.7}px Arial`;
  pCtx.textAlign = 'center';
  pCtx.textBaseline = 'middle';
  pCtx.fillText('👆', 0, -cellSize * 0.25);
  pCtx.restore();
}

// ── Авто-подсказка через 5 минут бездействия ─────────────────────────────────
const HINT_DELAY = 5000; // 5 секунд
let _hintTimer=null;
function resetHintTimer() {
  clearTimeout(_hintTimer);
  if (state.screen!=='game'||state.busy||state.paused) return;
  _hintTimer=setTimeout(showAutoHint, HINT_DELAY);
}
function showAutoHint() {
  if (state.busy||state.paused||state.screen!=='game') return;
  const move=findBestHint();
  if (!move) return;
  const [r,c,nr,nc]=move;
  showGestureHint(r, c, nr, nc);
  // Нудж: фишки 2 раза дёргаются навстречу друг другу
  const dx=(nc-c), dy=(nr-r); // направление (±1, ±1)
  const NUDGE_PX=()=>cellSize*0.22; // 22% клетки
  // Два нуджа: 0-320ms, 460-780ms
  const SEGS=[{s:0,e:320},{s:460,e:780}];
  const t0=performance.now();
  function nudge(now){
    const elapsed=now-t0;
    if(elapsed>900||state.busy||state.paused||state.screen!=='game'){
      const cl1=state.board[r]?.[c],cl2=state.board[nr]?.[nc];
      if(cl1)cl1.anim={}; if(cl2)cl2.anim={};
      return;
    }
    let frac=0;
    for(const seg of SEGS){
      if(elapsed>=seg.s&&elapsed<seg.e){
        const t=(elapsed-seg.s)/(seg.e-seg.s);
        frac=Math.sin(t*Math.PI); // 0→1→0
        break;
      }
    }
    const dist=NUDGE_PX()*frac;
    const cl1=state.board[r]?.[c],cl2=state.board[nr]?.[nc];
    if(cl1)cl1.anim={ox:dx*dist, oy:dy*dist};
    if(cl2)cl2.anim={ox:-dx*dist, oy:-dy*dist};
    requestAnimationFrame(nudge);
  }
  requestAnimationFrame(nudge);
  _hintTimer=setTimeout(showAutoHint, HINT_DELAY);
}

// ══════════════════════════════════════════
//  ВВОД
// ══════════════════════════════════════════
function setupInput() {
  canvas.addEventListener('mousedown',  onPD);
  canvas.addEventListener('mousemove',  onPM);
  canvas.addEventListener('mouseup',    onPU);
  canvas.addEventListener('touchstart', e=>{e.preventDefault();onPD(e.touches[0]);},{passive:false});
  canvas.addEventListener('touchmove',  e=>{e.preventDefault();onPM(e.touches[0]);},{passive:false});
  canvas.addEventListener('touchend',   e=>{e.preventDefault();onPU(e.changedTouches[0]);},{passive:false});
}
function getXY(e) { const r=canvas.getBoundingClientRect(); return [e.clientX-r.left,e.clientY-r.top]; }
function cellXY(x,y) {
  const c=Math.floor((x-boardOffX)/cellSize), r=Math.floor((y-boardOffY)/cellSize);
  if(r<0||r>=ROWS||c<0||c>=COLS) return null;
  return [r,c];
}
let _lastTapCell=null, _lastTapTime=0;
function onPD(e) {
  hideGestureHint();
  if (state.busy||state.paused) return;
  const [x,y]=getXY(e); const cell=cellXY(x,y); if (!cell) return;
  if (state.buffNukeActive) { fireBuffNuke(cell[0],cell[1]); return; }
  if (state.activeIngameBooster === 'hammer')     { applyHammerBooster(cell[0],cell[1]); return; }
  if (state.activeIngameBooster === 'drillclick') { applyDrillClickBooster(cell[0],cell[1]); return; }
  if (state.activeIngameBooster === 'swap') {
    if (!state._swapFirst) {
      state._swapFirst = cell; drawBoard(); return;
    } else {
      const [r1,c1] = state._swapFirst;
      state._swapFirst = null;
      if (r1 === cell[0] && c1 === cell[1]) { updateHUD(); drawBoard(); return; }
      applySwapBooster(r1, c1, cell[0], cell[1]); return;
    }
  }
  if (state.iceGrid[cell[0]]?.[cell[1]]) { shakeCell(cell[0],cell[1]); return; }
  // Double-tap activates special gem directly
  const now=Date.now();
  if (_lastTapCell&&_lastTapCell[0]===cell[0]&&_lastTapCell[1]===cell[1]&&now-_lastTapTime<400) {
    _lastTapCell=null; _lastTapTime=0;
    const gem=state.board[cell[0]]?.[cell[1]];
    if (gem&&gem.special!==SPECIAL.NONE) { activateSpecialByTap(cell[0],cell[1]); return; }
  }
  _lastTapCell=cell; _lastTapTime=now;
  dragStartCell=cell; selectedCell=cell; drawBoard();
}

async function activateSpecialByTap(r, c) {
  const gem=state.board[r]?.[c];
  if (!gem||gem.special===SPECIAL.NONE||state.busy) return;
  console.log('[DBG] activateSpecialByTap START r='+r+' c='+c+' special='+gem.special);
  state.busy=true;
  spendMove();
  const sp=gem.special, tp=gem.type;
  if (sp !== SPECIAL.BOMB) state.board[r][c]=null;
  spawnParticles(r,c,getSkinColor(tp>=0?tp:0),12);
  await triggerSpecial(r,c,sp,tp);
  console.log('[DBG] activateSpecialByTap after triggerSpecial busy='+state.busy);
  applyGravity(); fillFromTop(); await animateDrop();
  await processMatches();
  console.log('[DBG] activateSpecialByTap END busy='+state.busy);
}
function onPM(e) {
  if (!dragStartCell||state.busy) return;
  const [x,y]=getXY(e);
  const [sr,sc]=dragStartCell;
  const dx=x-(boardOffX+sc*cellSize+cellSize/2);
  const dy=y-(boardOffY+sr*cellSize+cellSize/2);
  if (Math.abs(dx)<cellSize*.3&&Math.abs(dy)<cellSize*.3) return;
  let dr=0,dc=0;
  if (Math.abs(dx)>Math.abs(dy)) dc=dx>0?1:-1; else dr=dy>0?1:-1;
  dragStartCell=null; selectedCell=null;
  trySwap(sr,sc,sr+dr,sc+dc);
}
function onPU(e) {
  if (dragStartCell&&selectedCell) {
    const prev=selectedCell;
    const [x,y]=getXY(e); const cell=cellXY(x,y);
    if (cell&&(cell[0]!==prev[0]||cell[1]!==prev[1])&&Math.abs(cell[0]-prev[0])+Math.abs(cell[1]-prev[1])===1) {
      dragStartCell=null; selectedCell=null;
      trySwap(prev[0],prev[1],cell[0],cell[1]); return;
    }
    selectedCell=cell; dragStartCell=null; drawBoard();
  }
}

// ══════════════════════════════════════════
//  HUD
// ══════════════════════════════════════════
function _updateMascot() {
  const el = document.getElementById('hud-mascot'); if (!el) return;
  let emoji = '💎';
  const lvl = getLevel(state.currentLevel);
  const movesRatio = lvl ? state.moves / (lvl.moves || 20) : 1;
  if (state.comboCount >= 3) emoji = '🤩';
  else if (movesRatio <= 0.2) emoji = '😰';
  else if (movesRatio <= 0.4) emoji = '😬';
  else emoji = '😄';
  if (el.textContent !== emoji) {
    el.textContent = emoji;
    el.style.animation = 'none';
    requestAnimationFrame(() => {
      el.style.animation = 'mascotPop 0.2s ease-out, mascotBob 2s ease-in-out 0.2s infinite';
    });
  }
}

function updateHUD() {
  document.getElementById('hud-moves').textContent = state.moves;
  document.getElementById('hud-score').textContent = state.score.toLocaleString();
  const lvlNum=document.getElementById('hud-level-num');
  if(lvlNum) lvlNum.textContent=`Ур. ${state.currentLevel}`;
  BGM_LAYERS.onMovesChange(state.moves);
  _updateMascot();
  // Обновляем счётчики in-game бустеров
  const b = state.ingameBoosters;
  ['hammer','shuffle','drill','drillclick','swap'].forEach(id => {
    const cnt = document.getElementById(`hbst-${id}-cnt`);
    const btn = document.getElementById(`hbst-${id}`);
    const unlockLvl = BOOSTER_UNLOCK_LEVELS[id] || 0;
    const isLocked = unlockLvl > 0 && (state.maxUnlocked||1) < unlockLvl;
    if (cnt) cnt.textContent = isLocked ? '🔒' : (b[id] || 0);
    if (btn) {
      const isActive = !isLocked && (
        state.activeIngameBooster === id ||
        (id === 'swap' && state._swapFirst && state.activeIngameBooster === 'swap')
      );
      btn.classList.toggle('active-booster', isActive);
      btn.style.opacity = isLocked ? '0.35' : (b[id]||0) > 0 ? '1' : '0.4';
      btn.title = isLocked ? `Откроется на L${unlockLvl}` : (BOOSTER_META[id]?.name || id);
      btn.disabled = isLocked;
    }
  });
  // sidekick HUD
  updateSidekickHUD();
}

// ── Sidekick HUD + logic ──────────────────────────────────────────────
function updateSidekickHUD() {
  const sk = state.sidekick;
  const el = document.getElementById('hud-sidekick');
  if (!el) return;
  const isVisible = sk.id !== null && state.currentLevel >= 25;
  el.style.display = isVisible ? 'flex' : 'none';
  if (!isVisible) return;
  const iconEl = document.getElementById('hud-sk-icon');
  const barEl  = document.getElementById('hud-sk-bar');
  if (iconEl) iconEl.textContent = SIDEKICKS[sk.id]?.icon || '❓';
  if (barEl)  barEl.style.width  = Math.min(100, Math.round(sk.charge / sk.maxCharge * 100)) + '%';
}

async function activateSidekick() {
  const sk = state.sidekick;
  if (!sk.id || sk.charge < sk.maxCharge) return;
  // Сброс заряда
  sk.charge = 0;
  updateSidekickHUD();
  // Flash анимация иконки
  const iconEl = document.getElementById('hud-sk-icon');
  if (iconEl) {
    iconEl.classList.remove('sk-activate');
    void iconEl.offsetWidth; // reflow
    iconEl.classList.add('sk-activate');
    setTimeout(() => iconEl.classList.remove('sk-activate'), 600);
  }
  SFX.click();
  if (sk.id === 'turtle') {
    // Ломаем до 3 случайных льдов
    const iceCells = [];
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      if (state.iceGrid[r]?.[c]) iceCells.push([r, c]);
    }
    shuffleArray(iceCells);
    const targets = iceCells.slice(0, 3);
    for (const [r, c] of targets) {
      state.iceGrid[r][c] = 0;
      state.iceBroken++;
      spawnParticles(r, c, '#a5f3fc', 6);
      updateQuestProgress('ice', 1);
    }
    if (targets.length > 0) {
      drawBoard();
      await new Promise(res => setTimeout(res, 200));
      updateGoalProgress();
    }
    showToast(`🐢 Черепаха сломала ${targets.length} льда!`);
  } else if (sk.id === 'bird') {
    // Ставит STRIPE_H в случайную не-специальную клетку
    const free = [];
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      if (state.holes.has(`${r},${c}`)) continue;
      const cell = state.board[r]?.[c];
      if (cell && cell.special === SPECIAL.NONE && !cell.stone && !cell.lava && cell.type >= 0) {
        free.push([r, c]);
      }
    }
    if (free.length) {
      const [r, c] = free[Math.floor(Math.random() * free.length)];
      state.board[r][c].special = SPECIAL.STRIPE_H;
      spawnParticles(r, c, '#3aa8ff', 8);
      drawBoard();
    }
    showToast('🐦 Птичка создала молнию!');
  } else if (sk.id === 'bear') {
    // +3 хода
    state.moves += 3;
    updateHUD();
    showToast('🦡 Барсук добавил 3 хода!');
  }
}

const BOOSTER_META = {
  hammer:     { icon:'⛏️', name:'Молоток',         desc:'Уничтожает любую фишку', price:50 },
  shuffle:    { icon:'🔀', name:'Перемешать',       desc:'Перемешивает все фишки на поле', price:30 },
  drill:      { icon:'🔩', name:'Дрель',            desc:'Ставит полосу на случайную клетку', price:40 },
  drillclick: { icon:'🎯', name:'Дрель по клику',   desc:'Тапни на клетку — поставит туда полосу', price:40 },
  swap:       { icon:'↔️', name:'Поменять местами', desc:'Поменяй любые две фишки местами', price:60 },
};

// уровни разблокировки бустеров
const BOOSTER_UNLOCK_LEVELS = { hammer:5, drill:10, drillclick:14, swap:18 };

function checkBoosterUnlocks(prevMax, newMax) {
  Object.entries(BOOSTER_UNLOCK_LEVELS).forEach(([id, lvl]) => {
    if (lvl > prevMax && lvl <= newMax) {
      const meta = BOOSTER_META[id];
      if (!state.ingameBoosters) state.ingameBoosters = {};
      state.ingameBoosters[id] = (state.ingameBoosters[id]||0) + 1;
      setTimeout(() => showToast(`🔓 ${meta?.icon||'🎁'} ${meta?.name||id} разблокирован! +1 бесплатно`), 1500);
    }
  });
}
let _pendingBoosterType = null;

// ── Buff Buddies ─────────────────────────────────────────────────────────
const BUFF_PIECES_TARGET = 10;
function updateBuffBar() {
  const row = document.getElementById('buff-bar-row');
  const fill = document.getElementById('buff-bar-fill');
  const btn = document.getElementById('buff-nuke-btn');
  if (!row || !fill || !btn) return;
  const pct = Math.min(100, (state.buffPieces / BUFF_PIECES_TARGET) * 100);
  fill.style.width = pct + '%';
  if (state.buffNukeReady) {
    btn.style.display = '';
    row.style.display = 'flex';
    btn.style.animation = 'btnBounce 0.5s ease-out';
  } else {
    btn.style.display = 'none';
    row.style.display = state.buffPieces > 0 ? 'flex' : 'none';
  }
}
function addBuffPiece() {
  if (state.buffNukeReady) return;
  state.buffPieces++;
  if (state.buffPieces >= BUFF_PIECES_TARGET) {
    state.buffNukeReady = true;
    state.buffPieces = BUFF_PIECES_TARGET;
    showToast('💥 НЮКЛОЛИПОП ГОТОВ!');
    SFX.special && SFX.special();
  }
  updateBuffBar();
}
function activateBuffNuke() {
  if (!state.buffNukeReady || state.busy || state.paused) return;
  state.buffNukeActive = true;
  showToast('💥 Выберите клетку для взрыва!');
  const btn = document.getElementById('buff-nuke-btn');
  if (btn) btn.style.background = 'linear-gradient(135deg,#a855f7,#7c3aed)';
}
async function fireBuffNuke(r, c) {
  if (!state.buffNukeActive) return;
  state.buffNukeActive = false;
  state.buffNukeReady = false;
  state.buffPieces = 0;
  updateBuffBar();
  state.busy = true;
  spawnScreenShake(16);
  SFX.special && SFX.special();
  let pts = 0;
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      const nr = r + dr, nc = c + dc;
      if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) continue;
      if (state.holes.has(`${nr},${nc}`)) continue;
      const cell = state.board[nr][nc];
      if (!cell || cell.stone || cell.lava || cell.bucket) continue;
      await new Promise(res => setTimeout(res, 80 + Math.abs(dr + dc) * 40));
      spawnParticles(nr, nc, cell.type >= 0 ? getSkinColor(cell.type) : '#fff');
      if (cell.type >= 0) pts += PHYSICS.BASE_SCORE;
      state.board[nr][nc] = null;
    }
  }
  if (pts > 0) { state.score += pts; spawnFloatingScore(r, c, pts, '#ef4444'); updateGoalProgress(); }
  applyGravity(); fillFromTop(); await animateDrop();
  await processMatches(r, c);
  updateHUD();
}

// ── Supersonic Mode ─────────────────────────────────────────────────────
function activateSupersonic() {
  if (state.supersonicActive || state.busy || state.paused) return;
  state.supersonicActive = true;
  state.supersonicMovesLeft = 5;
  _updateSupersonicHUD();
  showToast('⚡ СУПЕРСОНИК АКТИВИРОВАН! 5 ходов!');
  SFX.special && SFX.special();
  spawnScreenShake(10);
}
function _updateSupersonicHUD() {
  const hud = document.getElementById('supersonic-hud');
  const mv = document.getElementById('supersonic-moves');
  const canvas = document.getElementById('game-canvas');
  if (hud) hud.style.display = state.supersonicActive ? '' : 'none';
  if (mv) mv.textContent = state.supersonicMovesLeft;
  if (canvas) canvas.classList.toggle('supersonic-active', state.supersonicActive);
}
async function triggerSupersonicStripe(r, c) {
  if (!state.supersonicActive) return;
  const isHoriz = Math.random() > 0.5;
  let pts = 0;
  if (isHoriz) {
    for (let cc = 0; cc < COLS; cc++) {
      if (state.holes.has(`${r},${cc}`)) continue;
      const cell = state.board[r][cc];
      if (!cell || cell.stone || cell.lava || cell.bucket) continue;
      spawnParticles(r, cc, cell.type >= 0 ? getSkinColor(cell.type) : '#ffe066', 6);
      if (cell.type >= 0) pts += PHYSICS.BASE_SCORE;
      state.board[r][cc] = null;
    }
  } else {
    for (let rr = 0; rr < ROWS; rr++) {
      if (state.holes.has(`${rr},${c}`)) continue;
      const cell = state.board[rr][c];
      if (!cell || cell.stone || cell.lava || cell.bucket) continue;
      spawnParticles(rr, c, cell.type >= 0 ? getSkinColor(cell.type) : '#ffe066', 6);
      if (cell.type >= 0) pts += PHYSICS.BASE_SCORE;
      state.board[rr][c] = null;
    }
  }
  if (pts > 0) { state.score += pts; spawnFloatingScore(r, c, pts, '#f59e0b'); }
}
function tickSupersonic(r, c) {
  if (!state.supersonicActive) return;
  triggerSupersonicStripe(r, c);
  state.supersonicMovesLeft--;
  if (state.supersonicMovesLeft <= 0) {
    state.supersonicActive = false;
    state.supersonicMovesLeft = 0;
    showToast('⚡ Суперсоник завершён!');
  }
  _updateSupersonicHUD();
}

function activateInGameBooster(type) {
  if (state.busy || state.paused) return;
  const _unlockLvl = BOOSTER_UNLOCK_LEVELS[type] || 0;
  if (_unlockLvl > 0 && (state.maxUnlocked||1) < _unlockLvl) {
    showToast(`🔒 Откроется на L${_unlockLvl}`); return;
  }
  const b = state.ingameBoosters;
  if ((b[type]||0) > 0) {
    // Уже есть — активируем/отменяем без покупки
    if (state.activeIngameBooster === type) {
      state.activeIngameBooster = null;
    } else {
      state.activeIngameBooster = type;
    }
    if (type === 'shuffle')    { state.activeIngameBooster = null; doShuffleBooster(); }
    if (type === 'drill')      { state.activeIngameBooster = null; applyDrillBooster(); }
    if (type === 'drillclick') { /* ждём клика на поле */ }
    if (type === 'swap')       { state._swapFirst = null; /* ждём двух кликов */ }
    updateHUD();
    return;
  }
  // Нет в инвентаре — показываем попап покупки
  const meta = BOOSTER_META[type];
  if (state.coins < meta.price) {
    showBoosterDonate();
    return;
  }
  _pendingBoosterType = type;
  document.getElementById('bc-icon').textContent  = meta.icon;
  document.getElementById('bc-title').textContent = meta.name;
  document.getElementById('bc-desc').textContent  = meta.desc;
  document.getElementById('bc-price').textContent = `Стоимость: ${meta.price} 🪙`;
  document.getElementById('booster-confirm-overlay').classList.add('visible');
}

function confirmBoosterBuy() {
  const type = _pendingBoosterType;
  if (!type) return;
  hideBoosterConfirm();
  const meta = BOOSTER_META[type];
  if (state.coins < meta.price) { showBoosterDonate(); return; }
  state.coins -= meta.price; saveGame();
  showToast(`Куплено за ${meta.price} 🪙`);
  if (state.activeIngameBooster === type) {
    state.activeIngameBooster = null;
  } else {
    state.activeIngameBooster = type;
  }
  if (type === 'shuffle')    { state.activeIngameBooster = null; doShuffleBooster(); }
  if (type === 'drill')      { state.activeIngameBooster = null; applyDrillBooster(); }
  if (type === 'drillclick') { /* ждём клика на поле */ }
  if (type === 'swap')       { state._swapFirst = null; /* ждём двух кликов */ }
  updateHUD();
}

function hideBoosterConfirm() {
  document.getElementById('booster-confirm-overlay').classList.remove('visible');
  _pendingBoosterType = null;
}

function showUnlockScreen(title, icon, description) {
  const overlay = document.getElementById('unlock-screen-overlay');
  const iconEl  = document.getElementById('us-icon');
  const titleEl = document.getElementById('us-title');
  const descEl  = document.getElementById('us-desc');
  const btnEl   = document.getElementById('us-btn');
  iconEl.textContent = icon || '🎁';
  titleEl.textContent = title || '';
  descEl.textContent = description || '';
  // Reset all
  [iconEl, titleEl, descEl, btnEl].forEach(el => { el.style.transition = 'none'; el.style.opacity = '0'; });
  iconEl.style.transform = 'scale(0)';
  titleEl.style.transform = 'translateY(20px)';
  btnEl.style.transform = 'scale(0)';
  overlay.classList.remove('hidden');
  // Staggered cascade animations
  SFX.reward && SFX.reward();
  requestAnimationFrame(() => {
    setTimeout(() => {
      iconEl.style.transition = 'opacity .2s, transform .35s cubic-bezier(.34,1.56,.64,1)';
      iconEl.style.opacity = '1'; iconEl.style.transform = 'scale(1)';
    }, 150);
    setTimeout(() => {
      SFX.click && SFX.click();
      titleEl.style.transition = 'opacity .25s, transform .25s ease-out';
      titleEl.style.opacity = '1'; titleEl.style.transform = 'translateY(0)';
    }, 350);
    setTimeout(() => {
      descEl.style.transition = 'opacity .2s';
      descEl.style.opacity = '1';
    }, 550);
    setTimeout(() => {
      SFX.win && SFX.win();
      btnEl.style.transition = 'opacity .1s, transform .3s cubic-bezier(.34,1.56,.64,1)';
      btnEl.style.opacity = '1'; btnEl.style.transform = 'scale(1)';
    }, 750);
  });
}
function hideUnlockScreen() {
  document.getElementById('unlock-screen-overlay').classList.add('hidden');
}

function showBoosterDonate() {
  document.getElementById('booster-donate-overlay').classList.add('visible');
}
function hideBoosterDonate() {
  document.getElementById('booster-donate-overlay').classList.remove('visible');
}
function buyCoins(amount) {
  hideBoosterDonate();
  // В реальной игре здесь был бы платёжный шлюз / реклама
  // Для демо — начисляем бесплатно только первый пак (500)
  if (amount === 500) {
    state.coins += 500; saveGame();
    showToast('+500 🪙 начислено!');
  } else {
    showToast('Функция оплаты в разработке');
  }
}

function applyExtraMovesBooster() {
  state.ingameBoosters.extramoves = Math.max(0, (state.ingameBoosters.extramoves||0) - 1);
  state.moves += 5;
  updateHUD();
  showToast('⏱️ +5 ходов!');
  spawnParticles(Math.floor(ROWS/2), Math.floor(COLS/2), '#ffe066', 15);
}

function applyDrillBooster() {
  if (state.busy) return;
  state.ingameBoosters.drill = Math.max(0, (state.ingameBoosters.drill||0) - 1);
  const free=[];
  for (let r=0;r<ROWS;r++) for (let c=0;c<COLS;c++) {
    if (state.holes.has(`${r},${c}`)) continue;
    const cl=state.board[r]?.[c];
    if (cl&&!cl.stone&&!cl.lava&&cl.type>=0&&cl.special===SPECIAL.NONE) free.push([r,c]);
  }
  if (!free.length) { showToast('Нет свободных клеток!'); return; }
  const [r,c]=free[Math.floor(Math.random()*free.length)];
  state.board[r][c].special=Math.random()<0.5?SPECIAL.STRIPE_H:SPECIAL.STRIPE_V;
  spawnParticles(r,c,'#ffe066',10);
  drawBoard(); updateHUD();
  showToast('🔩 Дрель на поле!');
}

function applyDrillClickBooster(r, c) {
  const cl = state.board[r]?.[c];
  if (!cl || cl.stone || cl.lava || cl.type < 0 || cl.special !== SPECIAL.NONE) {
    showToast('Нельзя поставить сюда!'); return;
  }
  state.activeIngameBooster = null;
  state.ingameBoosters.drillclick = Math.max(0, (state.ingameBoosters.drillclick||0) - 1);
  cl.special = Math.random() < 0.5 ? SPECIAL.STRIPE_H : SPECIAL.STRIPE_V;
  spawnParticles(r, c, '#ffe066', 10);
  drawBoard(); updateHUD();
  showToast('🎯 Дрель установлена!');
}

async function applySwapBooster(r1, c1, r2, c2) {
  const a = state.board[r1]?.[c1], b = state.board[r2]?.[c2];
  if (!a || !b || a.stone || b.stone || a.bucket || b.bucket) {
    showToast('Нельзя поменять эти фишки!'); updateHUD(); return;
  }
  state.activeIngameBooster = null;
  state.ingameBoosters.swap = Math.max(0, (state.ingameBoosters.swap||0) - 1);
  spawnParticles(r1, c1, '#67e8f9', 8);
  spawnParticles(r2, c2, '#67e8f9', 8);
  doSwap(r1, c1, r2, c2);
  drawBoard(); updateHUD();
  await processMatches();
}

async function doShuffleBooster() {
  if (state.busy) return;
  state.ingameBoosters.shuffle = Math.max(0, (state.ingameBoosters.shuffle||0) - 1);
  state.busy = true;
  // Плавная анимация: уменьшаем → перемешиваем → увеличиваем
  await animateShuffleEffect();
  const types=[], pos=[];
  for (let r=0;r<ROWS;r++) for (let c=0;c<COLS;c++) {
    const cl=state.board[r][c];
    if (cl&&!cl.stone&&!cl.lava&&cl.type>=0) { types.push(cl.type); pos.push([r,c]); }
  }
  shuffleArray(types);
  pos.forEach(([r,c],i)=>state.board[r][c].type=types[i]);
  SFX.shuffleSfx && SFX.shuffleSfx();
  drawBoard();
  showToast('Поле перемешано!');
  await processMatches();
}

// Молоток и цветная бомба применяются в handleCellTap
async function applyHammerBooster(r, c) {
  const cell = state.board[r]?.[c];
  if (!cell || state.busy) return;
  state.busy = true;
  state.activeIngameBooster = null;
  state.ingameBoosters.hammer = Math.max(0, (state.ingameBoosters.hammer||0) - 1);
  if (cell.bucket) {
    state.busy = false; updateHUD(); showToast('Ведро нельзя разрушить!'); return;
  } else if (cell.special !== SPECIAL.NONE) {
    // Hammer on bonus gem — trigger its special effect
    const _hsp = cell.special, _htp = cell.type;
    spawnParticles(r, c, '#f59e0b', 10);
    if (_hsp !== SPECIAL.BOMB) state.board[r][c] = null; // null before trigger (bomb stays for 2-phase fall)
    updateHUD();
    await triggerSpecial(r, c, _hsp, _htp);
    applyGravity(); fillFromTop(); await animateDrop();
    await processMatches();
    return;
  } else if (cell.lava) {
    destroyLava(r, c); breakAdjacentLava(r, c);
    clearBricksAt(r, c, false);
  } else if (cell.stone) {
    cell.stone = false; cell.type = randGem(); cell.special = SPECIAL.NONE;
    state.stonesBroken++; updateQuestProgress('stones', 1); breakAdjacentLava(r, c);
  } else if (state.iceGrid[r]?.[c]) {
    state.iceGrid[r][c] = 0; state.iceBroken++; updateQuestProgress('ice', 1);
  } else {
    if (cell.type>=0) state.collectedGems[cell.type]=(state.collectedGems[cell.type]||0)+1;
    clearDirtAt(r,c); clearBricksAt(r,c,false); breakAdjacentLava(r,c);
    state.board[r][c] = null;
  }
  spawnParticles(r, c, '#f59e0b', 10);
  updateGoalProgress(); updateHUD();
  if (checkWin()) { state.busy=false; setTimeout(showWin,300); return; }
  applyGravity(); fillFromTop(); await animateDrop();
  await processMatches();
}

function applyColorBombBooster(r, c) {
  const cell = state.board[r]?.[c];
  if (!cell || cell.type < 0) return;
  state.activeIngameBooster = null;
  state.ingameBoosters.colorbomb = Math.max(0, (state.ingameBoosters.colorbomb||0) - 1);
  const ng = createGem(-1);
  ng.special = SPECIAL.RAINBOW;
  state.board[r][c] = ng;
  updateHUD(); drawBoard();
}

function updateGoalProgress() {
  const lvl=getLevel(state.currentLevel);
  let prog=0;
  let html='';
  const goalEl=document.getElementById('goal-text');
  switch(lvl.type) {
    case 'score':
      prog=Math.min(state.score/lvl.target,1);
      html=`🎯 ${lvl.target.toLocaleString()}`; break;
    case 'collect': {
      let tot=0;
      const gems=lvl.gems||[];
      if (gems.length>0) { gems.forEach(g=>tot+=(state.collectedGems[g]||0)); }
      else { Object.values(state.collectedGems||{}).forEach(v=>tot+=v); }
      prog=Math.min(tot/lvl.target,1);
      const dots=gems.map(g=>{
        const gem=GEMS[g]; if(!gem) return '';
        return `<span style="color:${getSkinColor(g)};font-size:15px;">●</span>`;
      }).join(' ');
      html=`${dots} ${Math.min(tot,lvl.target)} / ${lvl.target}`; break;
    }
    case 'ice':
      prog=Math.min(state.iceBroken/lvl.target,1);
      html=`❄️ Лёд: ${Math.min(state.iceBroken,lvl.target)} / ${lvl.target}`; break;
    case 'stone':
      prog=Math.min(state.stonesBroken/lvl.target,1);
      html=`🪨 Камни: ${Math.min(state.stonesBroken,lvl.target)} / ${lvl.target}`; break;
    case 'dirt': {
      const rem=countDirtRemaining();
      prog=state.dirtTotal>0?Math.max(0,1-rem/state.dirtTotal):1;
      html=`🟫 Земля: ${state.dirtTotal-rem} / ${state.dirtTotal}`; break;
    }
    case 'buckets':
      prog=Math.min(state.bucketsDelivered/lvl.target,1);
      html=`🪣 Вёдра: ${Math.min(state.bucketsDelivered,lvl.target)} / ${lvl.target}`; break;
    case 'lava': {
      const remLava=countLavaRemaining();
      const ini=state.lavaInitial||1;
      prog=Math.max(0,1-remLava/ini);
      html=`🌋 Лава: ${ini-remLava} / ${ini}`; break;
    }
    case 'flood':
      prog=Math.min(state.flasksBroken/lvl.target,1);
      html=`🧴 Фляги: ${Math.min(state.flasksBroken,lvl.target)} / ${lvl.target}`; break;
    case 'bricks': {
      const remC=countBricksRemaining();
      const tot=state.bricksTotal||1;
      prog=Math.max(0,1-remC/tot);
      html=`🧱 Кладка: ${tot-remC} / ${tot}`; break;
    }
    case 'relics': {
      const bt=lvl.relicsTarget||lvl.amberCount||1;
      prog=Math.min((state.relicsFreed||0)/bt,1);
      html=`🐾 Кроты: ${Math.min(state.relicsFreed||0,bt)} / ${bt}`; break;
    }
    case 'path': {
      const pn = lvl.pathCells?.length || 1;
      const pp = Math.min(state.pathProgress||0, pn);
      prog = pp / pn;
      html = `🧙 Путь: ${pp} / ${pn} клеток`; break;
    }
  }
  // Прогресс-бар со звёздами
  const barEl=document.getElementById('star-bar');
  if(barEl) {
    const prevW = parseFloat(barEl.style.width)||0;
    barEl.style.width=(prog*100)+'%';
    if (prog*100 > prevW + 1) {
      barEl.classList.remove('shine');
      requestAnimationFrame(() => barEl.classList.add('shine'));
      setTimeout(() => barEl.classList.remove('shine'), 450);
    }
  }
  const s1=document.getElementById('star-1'),s2=document.getElementById('star-2'),s3=document.getElementById('star-3');
  const sl=lvl.starlevel;
  if (sl) {
    // Пороги по starlevel (★1=target, ★2=×2.5, ★3=×4.0)
    const sc=state.score;
    if(s1) { s1.textContent=sc>=sl[0]?'⭐':'☆'; s1.classList.toggle('lit',sc>=sl[0]); }
    if(s2) { s2.textContent=sc>=sl[1]?'⭐':'☆'; s2.classList.toggle('lit',sc>=sl[1]); }
    if(s3) { s3.textContent=sc>=sl[2]?'⭐':'☆'; s3.classList.toggle('lit',sc>=sl[2]); }
    // Бар показывает прогресс к следующей активной звезде
    const nextThresh = sc<sl[0]?sl[0]:sc<sl[1]?sl[1]:sl[2];
    const prevThresh = sc<sl[0]?0:sc<sl[1]?sl[0]:sl[1];
    if(barEl) barEl.style.width=(Math.min((sc-prevThresh)/(nextThresh-prevThresh),1)*100)+'%';
  } else {
    // Пороги 33/66/100%
    if(s1) { s1.textContent=prog>=0.33?'⭐':'☆'; s1.classList.toggle('lit',prog>=0.33); }
    if(s2) { s2.textContent=prog>=0.66?'⭐':'☆'; s2.classList.toggle('lit',prog>=0.66); }
    if(s3) { s3.textContent=prog>=1.0?'⭐':'☆';  s3.classList.toggle('lit',prog>=1.0); }
  }
  if(goalEl) { goalEl.innerHTML=html; goalEl.classList.toggle('completed', prog>=1); }

  // secondary objective counter
  const objRow = document.getElementById('hud-obj-row');
  const objTxt = document.getElementById('hud-obj-text');
  if (objRow && objTxt && lvl.objective) {
    const obj = lvl.objective;
    let cur = 0, icon = '🎯';
    if (obj.type === 'collect') { cur = state.collectedGems?.[obj.gem] || 0; icon = '💎'; }
    else if (obj.type === 'score') { cur = state.score; icon = '⭐'; }
    else if (obj.type === 'ice')   { cur = state.iceBroken || 0; icon = '🧊'; }
    const done = cur >= obj.count;
    const prevDone = objTxt.classList.contains('completed');
    objRow.style.display = 'flex';
    objTxt.innerHTML = `${icon} ${Math.min(cur, obj.count)} / ${obj.count}${done ? ' ✅' : ''}`;
    if (done && !prevDone) {
      objTxt.classList.add('completed');
      SFX._tone && SFX._tone(880, 'sine', 0.18, 0.25);
    }
    objTxt.classList.toggle('completed', done);
  } else if (objRow) {
    objRow.style.display = 'none';
  }
}

function checkWin() {
  const lvl=getLevel(state.currentLevel);
  let mainWin = false;
  switch(lvl.type) {
    case 'score':   mainWin = state.score >= lvl.target; break;
    case 'collect': { let t=0; const _cg=lvl.gems||[]; if (_cg.length>0) { _cg.forEach(g=>t+=(state.collectedGems[g]||0)); } else { Object.values(state.collectedGems||{}).forEach(v=>t+=v); } mainWin = t>=lvl.target; break; }
    case 'ice':     mainWin = state.iceBroken>=lvl.target; break;
    case 'stone':   mainWin = state.stonesBroken>=lvl.target; break;
    case 'dirt':        mainWin = countDirtRemaining()===0; break;
    case 'buckets':  mainWin = state.bucketsDelivered>=lvl.target; break;
    case 'lava':    mainWin = countLavaRemaining()===0; break;
    case 'flood':         mainWin = state.flasksBroken>=lvl.target; break;
    case 'bricks':       mainWin = countBricksRemaining()===0; break;
    case 'relics':        mainWin = (state.relicsFreed||0) >= (lvl.relicsTarget||lvl.amberCount||1); break;
    case 'path':         mainWin = (state.pathProgress||0) >= (lvl.pathCells?.length||1); break;
  }
  // secondary objective must also be met
  if (mainWin && lvl.objective) {
    const obj = lvl.objective;
    let cur = 0;
    if (obj.type === 'collect') cur = state.collectedGems?.[obj.gem] || 0;
    else if (obj.type === 'score') cur = state.score;
    else if (obj.type === 'ice') cur = state.iceBroken || 0;
    mainWin = cur >= obj.count;
  }
  return mainWin;
}

function calcStars() {
  const lvl=getLevel(state.currentLevel);
  // Для всех типов: starlevel[0]=min, [1]=×2.5, [2]=×4.0 применяется через score
  // Для score-уровней — напрямую по набранным очкам
  if (lvl.starlevel) {
    if (state.score >= lvl.starlevel[2]) return 3;
    if (state.score >= lvl.starlevel[1]) return 2;
    return 1; // победа уже засчитана, поэтому ≥ 1 гарантирована
  }
  // Fallback: прогресс-процент для уровней без starlevel
  let prog=0;
  switch(lvl.type) {
    case 'score':
      if (state.score >= lvl.target * 2.0) return 3;
      if (state.score >= lvl.target * 1.5) return 2;
      return 1;
    case 'collect': { let t=0; const _cg2=lvl.gems||[]; if (_cg2.length>0) { _cg2.forEach(g=>t+=(state.collectedGems[g]||0)); } else { Object.values(state.collectedGems||{}).forEach(v=>t+=v); } prog=Math.min(t/lvl.target,1); break; }
    case 'ice': prog=Math.min(state.iceBroken/lvl.target,1); break;
    case 'stone': prog=Math.min(state.stonesBroken/lvl.target,1); break;
    case 'dirt': prog=state.dirtTotal>0?Math.max(0,1-countDirtRemaining()/state.dirtTotal):1; break;
    case 'buckets': prog=Math.min(state.bucketsDelivered/lvl.target,1); break;
    case 'lava': { const rc=countLavaRemaining(); const ini=state.lavaInitial||1; prog=Math.max(0,1-rc/ini); break; }
    case 'flood': prog=Math.min(state.flasksBroken/lvl.target,1); break;
    case 'bricks': { const tot=state.bricksTotal||1; prog=Math.max(0,1-countBricksRemaining()/tot); break; }
    case 'relics': prog=Math.min((state.relicsFreed||0)/(lvl.relicsTarget||lvl.amberCount||1),1); break;
    case 'path':  prog=Math.min((state.pathProgress||0)/(lvl.pathCells?.length||1),1); break;
    default: prog=1;
  }
  if (prog>=1.0) return 3;
  if (prog>=0.66) return 2;
  return 1;
}

