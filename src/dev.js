// ══════════════════════════════════════════
//  DEV / TUNING MODE (?dev=1)
// ══════════════════════════════════════════
function initDevPanel() {
  const panel = document.createElement('div');
  panel.id = 'dev-panel';
  panel.style.cssText = [
    'position:fixed;bottom:8px;right:8px;z-index:9999;',
    'background:rgba(10,10,20,0.92);color:#ffe066;font-size:12px;',
    'border:1.5px solid #a855f7;border-radius:12px;padding:10px 12px;',
    'min-width:200px;font-family:monospace;line-height:1.6;',
    'box-shadow:0 4px 24px rgba(0,0,0,0.7);'
  ].join('');
  panel.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;cursor:pointer;" onclick="devToggleBody()">
      <span style="font-weight:bold;font-size:13px;color:#a78bfa;">⚙️ DEV PANEL</span>
      <span id="dev-toggle" style="color:#a78bfa;font-size:11px;">▼</span>
    </div>
    <div id="dev-body" style="display:none;">
      <div id="dev-info" style="color:#ccc;margin-bottom:6px;"></div>
      <div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:4px;">
        <button onclick="devCmd('moves+5')"  style="${devBtnStyle('#334155')}">+5 ходов</button>
        <button onclick="devCmd('win')"       style="${devBtnStyle('#14532d')}">Победа</button>
        <button onclick="devCmd('coins')"     style="${devBtnStyle('#78350f')}">+500 🪙</button>
        <button onclick="devCmd('crystals')"  style="${devBtnStyle('#312e81')}">+50 💎</button>
        <button onclick="devCmd('lvlprev')"   style="${devBtnStyle('#1e3a5f')}">◀ Уровень</button>
        <button onclick="devCmd('lvlnext')"   style="${devBtnStyle('#1e3a5f')}">Уровень ▶</button>
        <button onclick="devCmd('choc')"      style="${devBtnStyle('#451a03')}">🍫 +шоколад</button>
        <button onclick="devCmd('rainbow')"   style="${devBtnStyle('#4a1d96')}">🌈 радуга</button>
        <button onclick="runBalanceReport()"  style="${devBtnStyle('#064e3b')}">📊 Баланс</button>
        <button onclick="autoBalanceLevels()" style="${devBtnStyle('#7c2d12')}">⚖️ Автобаланс</button>
        <button onclick="devCmd('revision+1')" style="${devBtnStyle('#4a044e')}">📝 Rev+1</button>
      </div>
      <div style="margin-bottom:4px;font-size:10px;color:#64748b;">Спавн спецфишки:</div>
      <div style="display:flex;flex-wrap:wrap;gap:3px;margin-bottom:4px;">
        <button onclick="devSpawnSpecial(SPECIAL.STRIPE_H)"  style="${devBtnStyle('#1e40af')}" title="Горизонтальная молния">⚡H</button>
        <button onclick="devSpawnSpecial(SPECIAL.STRIPE_V)"  style="${devBtnStyle('#1e40af')}" title="Вертикальная молния">⚡V</button>
        <button onclick="devSpawnSpecial(SPECIAL.ROCKET)"      style="${devBtnStyle('#065f46')}" title="Фейерверк">🎆</button>
        <button onclick="devSpawnSpecial(SPECIAL.BOMB)"   style="${devBtnStyle('#9d174d')}" title="Бомба">🎁</button>
        <button onclick="devSpawnSpecial(SPECIAL.RAINBOW)"   style="${devBtnStyle('#1e3a5f')}" title="Радуга">🌈</button>
        <button onclick="devSpawnSpecial(SPECIAL.COLORING)"  style="${devBtnStyle('#064e3b')}" title="Красящий">🎨</button>
      </div>
      <button onclick="startTestLevel()"   style="${devBtnStyle('#134e4a')};width:100%;margin-bottom:4px;">🧪 Тест-уровень</button>
      <button onclick="showAssetsScreen()" style="${devBtnStyle('#1e3a5f')};width:100%;margin-bottom:4px;">🖼️ Витрина ассетов</button>
      <button onclick="openSpriteRemapper()" style="${devBtnStyle('#1e3a5f')};width:100%;margin-bottom:4px;">🎨 Ремапер спрайтов</button>
      <div style="margin-top:4px;margin-bottom:3px;font-size:10px;color:#64748b;">🔄 Спавн комбо (только в тест-уровне):</div>
      <div style="display:flex;flex-wrap:wrap;gap:3px;margin-bottom:2px;">
        <button onclick="devSpawnZone(0)"  style="${devBtnStyle('#1e40af')}" title="⚡H+⚡V">⚡+⚡</button>
        <button onclick="devSpawnZone(1)"  style="${devBtnStyle('#1e3a8a')}" title="⚡+Бомба">⚡🎁</button>
        <button onclick="devSpawnZone(2)"  style="${devBtnStyle('#9d174d')}" title="Бомба+Бомба">🎁🎁</button>
        <button onclick="devSpawnZone(3)"  style="${devBtnStyle('#1e40af')}" title="⚡+Мега">⚡💥</button>
        <button onclick="devSpawnZone(4)"  style="${devBtnStyle('#7c3aed')}" title="Мега+Мега">💥💥</button>
        <button onclick="devSpawnZone(5)"  style="${devBtnStyle('#5b21b6')}" title="Бомба+Мега">🎁💥</button>
        <button onclick="devSpawnZone(6)"  style="${devBtnStyle('#1e3a5f')}" title="🌈+⚡">🌈⚡</button>
        <button onclick="devSpawnZone(7)"  style="${devBtnStyle('#1e3a5f')}" title="🌈+Бомба">🌈🎁</button>
        <button onclick="devSpawnZone(8)"  style="${devBtnStyle('#1e3a5f')}" title="🌈+Мега">🌈💥</button>
        <button onclick="devSpawnZone(9)"  style="${devBtnStyle('#164e63')}" title="🌈+Ракета">🌈🎆</button>
        <button onclick="devSpawnZone(10)" style="${devBtnStyle('#1e3a5f')}" title="🌈+🌈">🌈🌈</button>
        <button onclick="devSpawnZone(11)" style="${devBtnStyle('#064e3b')}" title="🌈+🎨">🌈🎨</button>
        <button onclick="devSpawnZone(12)" style="${devBtnStyle('#064e3b')}" title="🎨+⚡">🎨⚡</button>
        <button onclick="devSpawnZone(13)" style="${devBtnStyle('#064e3b')}" title="🎨+Бомба">🎨🎁</button>
        <button onclick="devSpawnZone(14)" style="${devBtnStyle('#065f46')}" title="Ракета+Ракета">🎆🎆</button>
        <button onclick="TEST_COMBOS.forEach((_,i)=>devSpawnZone(i))" style="${devBtnStyle('#14532d')};width:100%;margin-top:2px;">♻️ Все комбо</button>
      </div>
      <div style="margin-top:4px;margin-bottom:3px;font-size:10px;color:#64748b;">⏩ Скорость анимации: <span id="dev-speed-val">1×</span></div>
      <input type="range" min="0.1" max="5" step="0.1" value="1"
        style="width:100%;accent-color:#a78bfa;margin-bottom:4px;"
        oninput="setDevAnimSpeed(+this.value);document.getElementById('dev-speed-val').textContent=(+this.value).toFixed(1)+'×'">
      <button onclick="(()=>{state.questsDate='';state.weeklyQuestDate='';generateDailyQuests();renderQuestsRow();showToast('Квесты сброшены!')})()" style="${devBtnStyle('#1e3a5f')};width:100%;margin-bottom:4px;">🔄 Сбросить квесты</button>
      <button onclick="generateCampaign(113,612);showToast('Готово!')" style="${devBtnStyle('#1e3a5f')};width:100%;margin-bottom:4px;">🏭 +500 уровней</button>
      <div style="margin-top:6px;margin-bottom:3px;font-size:10px;color:#64748b;">🐾 Компаньон :</div>
      <div style="display:flex;flex-wrap:wrap;gap:3px;margin-bottom:4px;">
        <button onclick="devSetSidekick('turtle')" style="${devBtnStyle('#064e3b')}">🐢 Черепаха</button>
        <button onclick="devSetSidekick('bird')"   style="${devBtnStyle('#1e3a5f')}">🐦 Птичка</button>
        <button onclick="devSetSidekick('bear')"   style="${devBtnStyle('#7c2d12')}">🦡 Барсук</button>
        <button onclick="devSetSidekick(null)"     style="${devBtnStyle('#334155')}">✖ Отключить</button>
      </div>
      <input id="dev-lvl-input" type="number" min="1" max="9999" placeholder="→ уровень"
        style="width:100%;background:#1e1b4b;color:#ffe066;border:1px solid #4c1d95;border-radius:6px;padding:3px 6px;font-size:12px;"
        onkeydown="if(event.key==='Enter')devCmd('goto')">
      <div style="margin-top:6px;margin-bottom:3px;font-size:10px;color:#64748b;">🔊 Тест звуков:</div>
      <div style="display:flex;flex-wrap:wrap;gap:3px;margin-bottom:4px;">
        <button onclick="SFX.match(0)"      style="${devBtnStyle('#1e3a5f')}">match</button>
        <button onclick="SFX.match(3)"      style="${devBtnStyle('#1e3a5f')}">match+</button>
        <button onclick="SFX.match(6)"      style="${devBtnStyle('#1e3a5f')}">match++</button>
        <button onclick="SFX.combo(1)"      style="${devBtnStyle('#1e3a5f')}">combo</button>
        <button onclick="SFX.combo(3)"      style="${devBtnStyle('#1e3a5f')}">combo+</button>
        <button onclick="SFX.special()"     style="${devBtnStyle('#7c2d12')}">special</button>
        <button onclick="SFX.click()"       style="${devBtnStyle('#334155')}">click</button>
        <button onclick="SFX.reward()"      style="${devBtnStyle('#064e3b')}">reward</button>
        <button onclick="SFX.win()"         style="${devBtnStyle('#14532d')}">win</button>
        <button onclick="SFX.lose()"        style="${devBtnStyle('#7f1d1d')}">lose</button>
        <button onclick="SFX.winJingle()"   style="${devBtnStyle('#14532d')}">winJngl</button>
        <button onclick="SFX.loseJingle()"  style="${devBtnStyle('#7f1d1d')}">loseJngl</button>
      </div>
      <button onclick="devTestAllSounds()" style="${devBtnStyle('#1e3a5f')};width:100%;margin-bottom:4px;">▶ Тест всех звуков</button>
      <div style="margin-top:6px;margin-bottom:3px;font-size:10px;color:#64748b;">🖼️ Текстур-пак:</div>
      <div style="display:flex;gap:3px;margin-bottom:4px;">
        <button onclick="loadTexturePack()" style="${devBtnStyle('#1e3a5f')};flex:1;">↺ Перезагрузить</button>
        <button onclick="Object.keys(TEXTURE_PACK.sprites).forEach(k=>{ const v=TEXTURE_PACK.sprites[k]; if(Array.isArray(v))v.fill(null); else TEXTURE_PACK.sprites[k]=null; }); BLOCK_SPRITES.fill(null); invalidateGemCache(); showToast('Сброшено')" style="${devBtnStyle('#7f1d1d')};padding:3px 6px;">✖ Сброс</button>
      </div>
    </div>
  `;
  document.getElementById('app').appendChild(panel);

  // Плавающая кнопка показа/скрытия панели (всегда видна в dev-режиме)
  const fab = document.createElement('button');
  fab.id = 'dev-fab';
  fab.textContent = '⚙';
  fab.title = 'DEV панель';
  fab.style.cssText = [
    'position:fixed;bottom:12px;right:12px;z-index:99999;',
    'background:linear-gradient(135deg,#4c1d95,#7c3aed);color:#fff;',
    'border:2px solid #a78bfa;border-radius:50%;width:36px;height:36px;font-size:18px;',
    'cursor:pointer;box-shadow:0 3px 12px rgba(124,58,237,0.7);',
    'display:none;align-items:center;justify-content:center;padding:0;'
  ].join('');
  fab.onclick = () => { panel.style.display=''; devToggleBody(true); fab.style.display='none'; };
  document.getElementById('app').appendChild(fab);
  window._devPanel = panel;
  window._devFab = fab;

  // Старт в свёрнутом виде — панель скрыта, FAB виден
  panel.style.display = 'none';
  fab.style.display = 'flex';

  setInterval(devUpdateInfo, 500);
}
function devToggleBody(forceOpen) {
  const body = document.getElementById('dev-body');
  const tog = document.getElementById('dev-toggle');
  const panel = window._devPanel;
  const fab = window._devFab;
  if (!body) return;
  const nowHidden = body.style.display === 'none';
  if (forceOpen || nowHidden) {
    body.style.display = '';
    if (tog) tog.textContent = '▼';
  } else {
    body.style.display = 'none';
    if (tog) tog.textContent = '▶';
    // After collapsing body, hide the panel entirely and show FAB
    setTimeout(() => {
      if (panel) panel.style.display = 'none';
      if (fab) fab.style.display = 'flex';
    }, 150);
  }
}
function devBtnStyle(bg) {
  return `background:${bg};color:#fff;border:none;border-radius:6px;padding:3px 7px;cursor:pointer;font-size:11px;`;
}

// ── Тестовый уровень: все комбо на одном поле 10×15 ──────────────────────
// 15 слотов (5 рядов × 3 в ряду). Каждый слот = пара соседних спецфишек.
// Остальные клетки — обычные фишки (поле для отработки взрывов).
// Слот (i): позиция (r, c) и (r, c+1). Спавнер восстанавливает только эти 2 клетки.
//
// Ряды комбо-слотов: 1, 4, 7, 10, 13  |  Колонки пар: 1-2, 4-5, 7-8
const TEST_COMBOS = [
  // ряд 1 — stripe-комбо
  { r:1,  c:1, sp1:SPECIAL.STRIPE_H, t1:0,  sp2:SPECIAL.STRIPE_V, t2:1,  label:'⚡H+⚡V' },
  { r:1,  c:4, sp1:SPECIAL.STRIPE_H, t1:0,  sp2:SPECIAL.BOMB,     t2:1,  label:'⚡+Бомба' },
  { r:1,  c:7, sp1:SPECIAL.BOMB,     t1:0,  sp2:SPECIAL.BOMB,     t2:1,  label:'Бомба+Бомба' },
  // ряд 7 — радуга×3
  { r:7,  c:1, sp1:SPECIAL.RAINBOW,  t1:-1, sp2:SPECIAL.STRIPE_H, t2:0,  label:'🌈+⚡' },
  { r:7,  c:4, sp1:SPECIAL.RAINBOW,  t1:-1, sp2:SPECIAL.BOMB,     t2:0,  label:'🌈+Бомба' },
  // ряд 10 — радуга×3 продолжение
  { r:10, c:1, sp1:SPECIAL.RAINBOW,  t1:-1, sp2:SPECIAL.ROCKET,   t2:0,  label:'🌈+Ракета' },
  { r:10, c:4, sp1:SPECIAL.RAINBOW,  t1:-1, sp2:SPECIAL.RAINBOW,  t2:-1, label:'🌈+🌈' },
  { r:10, c:7, sp1:SPECIAL.RAINBOW,  t1:-1, sp2:SPECIAL.COLORING, t2:2,  label:'🌈+🎨' },
  // ряд 13 — красящий + ракета
  { r:13, c:1, sp1:SPECIAL.COLORING, t1:2,  sp2:SPECIAL.STRIPE_H, t2:2,  label:'🎨+⚡' },
  { r:13, c:4, sp1:SPECIAL.COLORING, t1:2,  sp2:SPECIAL.BOMB,     t2:2,  label:'🎨+Бомба' },
  { r:13, c:7, sp1:SPECIAL.ROCKET,   t1:0,  sp2:SPECIAL.ROCKET,   t2:1,  label:'Ракета+Ракета' },
];

function _placeTestCombo(board, idx) {
  const z = TEST_COMBOS[idx]; if (!z || !board[z.r]?.[z.c]) return;
  board[z.r][z.c]   = createGem(z.t1 < 0 ? 0 : z.t1);
  board[z.r][z.c].special = z.sp1;
  if (z.t1 < 0) board[z.r][z.c].type = -1;
  board[z.r][z.c+1] = createGem(z.t2 < 0 ? 0 : z.t2);
  board[z.r][z.c+1].special = z.sp2;
  if (z.t2 < 0) board[z.r][z.c+1].type = -1;
}

function startTestLevel() {
  COLS = 10; ROWS = 15;
  const fakeLevel = { level:999, type:'score', target:999999999, moves:999, gems:[], iceCount:0,
    stoneCount:0, dirtCount:0, gemTypes:5, holes:[], lavaCount:0 };
  _levelCache.set(999, fakeLevel);
  state.currentLevel = 999;
  state._firstAttemptLevel = -1;
  state.moves = 999; state.score = 0;
  state.collectedGems = {}; state.iceBroken = 0; state.stonesBroken = 0;
  state.comboCount = 0; state.matchSequenceStep = 0; state.matchSoundLvl = 0;
  state.adMovesUsed = false; state.extraMovesUsed = false;
  state.bucketsDelivered = 0; state.lavaInitial = 0;
  state.floodLevel = 0; state.flasksBroken = 0; state._winShowing = false; state._inBonusExplosion = false;
  state.lastSwap = null; state.undoUsedThisLevel = false; state.relicsFreed = 0;
  state.buffPieces = 0; state.buffNukeReady = false; state.buffNukeActive = false;
  state.supersonicActive = false; state.supersonicMovesLeft = 0;
  _activeGemTypes = 5;
  _matchEpoch++;

  state.holes = new Set();
  state.dirtGrid  = Array.from({length:ROWS},()=>new Array(COLS).fill(0));
  state.bricksGrid = Array.from({length:ROWS},()=>new Array(COLS).fill(false));
  state.bricksTotal = 0;
  state.iceGrid    = Array.from({length:ROWS},()=>new Array(COLS).fill(0));
  state.dirtTotal = 0;
  state._testLevel = true;

  // Заполнить всё поле обычными фишками без матчей
  const board = [];
  for (let r = 0; r < ROWS; r++) {
    board[r] = [];
    for (let c = 0; c < COLS; c++) {
      let type;
      do { type = Math.floor(Math.random() * 5); }
      while (
        (r >= 2 && board[r-1][c]?.type === type && board[r-2][c]?.type === type) ||
        (c >= 2 && board[r][c-1]?.type === type && board[r][c-2]?.type === type)
      );
      board[r][c] = createGem(type);
    }
  }
  // Разместить все комбо-слоты поверх поля
  TEST_COMBOS.forEach((_, i) => _placeTestCombo(board, i));

  state.board = board;
  state.busy = false; state.paused = false;
  showScreen('game'); resizeCanvas(); updateHUD(); updateGoalProgress();
  drawBoard();
  showToast('🧪 Тест: все комбо на поле. Спавнеры восстанавливают слоты.');
}

function devSpawnZone(idx) {
  if (!state.board || state.currentLevel !== 999) { showToast('Только в тест-уровне'); return; }
  _placeTestCombo(state.board, idx);
  drawBoard();
  showToast(`${TEST_COMBOS[idx]?.label ?? idx} — восстановлен`);
}

async function devTestAllSounds() {
  const list = [
    ['click',      ()=>SFX.click()],
    ['match',      ()=>SFX.match(0)],
    ['match+',     ()=>SFX.match(3)],
    ['match++',    ()=>SFX.match(6)],
    ['combo',      ()=>SFX.combo(1)],
    ['combo+',     ()=>SFX.combo(3)],
    ['special',    ()=>SFX.special()],
    ['reward',     ()=>SFX.reward()],
    ['win',        ()=>SFX.win()],
    ['lose',       ()=>SFX.lose()],
    ['winJingle',  ()=>SFX.winJingle()],
    ['loseJingle', ()=>SFX.loseJingle()],
  ];
  for (const [name, fn] of list) {
    showToast(`🔊 ${name}`);
    fn();
    await new Promise(r => setTimeout(r, 1300));
  }
  showToast('✅ Все звуки проиграны');
}

function devSpawnSpecial(sp) {
  // Спавн спецфишки в случайной клетке рядом с центром
  const cr=Math.floor(ROWS/2), cc=Math.floor(COLS/2);
  for (let dr=-2;dr<=2;dr++) for (let dc=-2;dc<=2;dc++) {
    const r=cr+dr, c=cc+dc;
    if (r<0||r>=ROWS||c<0||c>=COLS) continue;
    const cl=state.board[r]?.[c];
    if (cl&&!cl.stone&&!cl.lava&&!state.holes.has(`${r},${c}`)) {
      cl.special=sp;
      if (sp===SPECIAL.RAINBOW) cl.type=-1;
      drawBoard();
      showToast(`Спавн: ${Object.keys(SPECIAL).find(k=>SPECIAL[k]===sp)} [${r},${c}]`);
      return;
    }
  }
}
function devSetSidekick(id) {
  if (id === null) {
    state.sidekick = { id: null, charge: 0, maxCharge: 20 };
  } else {
    const skDef = SIDEKICKS[id];
    if (!skDef) return;
    state.sidekick = { id, charge: 0, maxCharge: skDef.maxCharge };
  }
  saveGame();
  updateSidekickHUD();
  showToast(id ? `Компаньон: ${SIDEKICKS[id]?.icon} ${SIDEKICKS[id]?.name}` : 'Компаньон отключён');
}

function devUpdateInfo() {
  const el = document.getElementById('dev-info'); if (!el) return;
  const lvl = getLevel(state.currentLevel);
  const chocRem = countLavaRemaining();
  const cwStr = _currentColorWeights ? `CW:[${_currentColorWeights.join(',')}]` : '';
  const swStr = _currentSpecialWeights ? `SW:{${Object.entries(_currentSpecialWeights).map(([k,v])=>k[0]+v).join(',')}}` : '';
  const weightsStr = [cwStr, swStr].filter(Boolean).join(' ');
  el.textContent = `L${state.currentLevel} | ${lvl?.type||'?'} | ход:${state.moves} | 🏆${state.score} | 🍫${chocRem} | r${lvl?.revision||0} | 🎵${BGM_LAYERS.getMusicState()} | DD:${_currentDynDiff.toFixed(2)}${weightsStr?' | '+weightsStr:''}`;
}
function devCmd(cmd) {
  switch(cmd) {
    case 'moves+5':   state.moves+=5; updateHUD(); break;
    case 'win':       showWin(); break;
    case 'coins':     state.coins+=500; saveGame(); refreshLevelsCurrency(); showToast('+500 🪙'); break;
    case 'crystals':  state.crystals+=50; saveGame(); refreshLevelsCurrency(); showToast('+50 💎'); break;
    case 'lvlprev':   if(state.currentLevel>1){ selectLevel(state.currentLevel-1); } break;
    case 'lvlnext':   selectLevel(state.currentLevel+1); break;
    case 'goto': {
      const n=parseInt(document.getElementById('dev-lvl-input').value);
      if(n>=1){ state.currentLevel=n; startLevel(n,true); }
      break;
    }
    case 'choc': {
      // Размещаем шоколад в случайной свободной клетке
      const pos=[]; for(let r=0;r<ROWS;r++) for(let c=0;c<COLS;c++){const cl=state.board[r]?.[c]; if(cl&&!cl.lava&&!cl.stone&&cl.type>=0&&!state.holes.has(`${r},${c}`))pos.push([r,c]);}
      if(pos.length){const [r,c]=pos[Math.floor(Math.random()*pos.length)]; state.board[r][c]={type:-1,special:SPECIAL.NONE,stone:false,lava:true,web:false,bucket:false,anim:{}}; drawBoard();}
      break;
    }
    case 'rainbow': {
      // Добавляем радугу в центр
      const cr=Math.floor(ROWS/2), cc=Math.floor(COLS/2);
      if(state.board[cr]?.[cc]&&!state.holes.has(`${cr},${cc}`)){ state.board[cr][cc].special=SPECIAL.RAINBOW; drawBoard(); }
      break;
    }
    case 'revision+1': {
      const lvlRev=getLevel(state.currentLevel);
      if(lvlRev){lvlRev.revision=(lvlRev.revision||0)+1;showToast(`Revision: ${lvlRev.revision}`);}
      break;
    }
  }
}

// ══════════════════════════════════════════
//  ASSETS SHOWCASE SCREEN
// ══════════════════════════════════════════


const _ASSET_CATALOG = [
  // Гемы
  { cat:'Гемы', label:'Красный',              status:'✅', type:'tp',      tp:'gem',      tpIdx:3 },
  { cat:'Гемы', label:'Оранжевый',            status:'✅', type:'tp',      tp:'gem',      tpIdx:5 },
  { cat:'Гемы', label:'Жёлтый',               status:'✅', type:'tp',      tp:'gem',      tpIdx:0 },
  { cat:'Гемы', label:'Зелёный',              status:'✅', type:'tp',      tp:'gem',      tpIdx:2 },
  { cat:'Гемы', label:'Голубой',              status:'✅', type:'tp',      tp:'gem',      tpIdx:1 },
  { cat:'Гемы', label:'Синий',                status:'✅', type:'tp',      tp:'gem',      tpIdx:6 },
  { cat:'Гемы', label:'Фиолетовый',           status:'✅', type:'tp',      tp:'gem',      tpIdx:4 },
  { cat:'Гемы', label:'8-й цвет гема (тёмный)',status:'❌', type:'missing', note:'Только PaintBattle' },

  // Спешлы
  { cat:'Спешлы', label:'Молния H',           status:'✅', type:'tp', tp:'stripe_h', tpIdx:3 },
  { cat:'Спешлы', label:'Молния V',           status:'✅', type:'tp', tp:'stripe_v', tpIdx:3 },
  { cat:'Спешлы', label:'Бомба / ТНТ',       status:'✅', type:'tp', tp:'bomb',     tpIdx:3 },
  { cat:'Спешлы', label:'Радуга',             status:'✅', type:'tp', tp:'rainbow',  tpIdx:-1 },
  { cat:'Спешлы', label:'Ракета',             status:'✅', type:'tp', tp:'rocket',   tpIdx:3 },
  { cat:'Спешлы', label:'Красящая',           status:'✅', type:'tp', tp:'coloring', tpIdx:3 },
  { cat:'Спешлы', label:'Мега-бомба',         status:'❌', type:'missing', note:'Логика и спрайт не реализованы' },

  // Лёд
  { cat:'Блокеры — Лёд', label:'Лёд L1–L6 (1 спрайт)',    status:'⚠️', type:'img',  src:'ice.png',    note:'Нет визуального отличия слоёв' },
  { cat:'Блокеры — Лёд', label:'Иней L1',                  status:'✅', type:'proc', proc:'frost',     procArg:1 },
  { cat:'Блокеры — Лёд', label:'Иней L2',                  status:'✅', type:'proc', proc:'frost',     procArg:2 },
  { cat:'Блокеры — Лёд', label:'Лёд на кирпиче (550-555)', status:'❌', type:'missing', note:'IceOnMemoryBrick не реализован' },

  // Мёд / Медведи
  { cat:'Блокеры — Янтарь', label:'Янтарь/мёд L1–L4',          status:'✅', type:'img', src:'honey.png',        note:'Слои показаны бейджем ×N' },
  { cat:'Блокеры — Янтарь', label:'Реликвия (в янтаре)',         status:'✅', type:'img', src:'bear_sleeping.png' },
  { cat:'Блокеры — Янтарь', label:'Реликвия (освобождена)',     status:'✅', type:'img', src:'bear.png' },
  { cat:'Блокеры — Янтарь', label:'AmberBase (пустая ячейка)',status:'⚠️', type:'missing', note:'Нет визуала после снятия крышки' },
  { cat:'Блокеры — Янтарь', label:'Giant Relic',               status:'❌', type:'missing', note:'giant_relic.xml — не реализован' },

  // Шоколад
  { cat:'Блокеры — Лава', label:'Лава',status:'⚠️', type:'img',  src:'lava.png',    note:'Нужен собственный спрайт' },
  { cat:'Блокеры — Лава', label:'Грибница L1',       status:'✅', type:'proc', proc:'mycelium', procArg:1 },
  { cat:'Блокеры — Лава', label:'Грибница L2',       status:'✅', type:'proc', proc:'mycelium', procArg:2 },
  { cat:'Блокеры — Лава', label:'Источник грибницы',        status:'✅', type:'proc', proc:'fountain' },
  { cat:'Блокеры — Лава', label:'Lava Tray 2×2',    status:'❌', type:'missing', note:'Grid overlay не реализован' },

  // Цепи / Лакрица
  { cat:'Блокеры — Цепи', label:'Лакрица ветка',    status:'✅', type:'img', src:'vine_branch.png' },
  { cat:'Блокеры — Цепи', label:'Лакрица крест',    status:'✅', type:'img', src:'vine_cross.png' },
  { cat:'Блокеры — Цепи', label:'Лакрица крест-2',  status:'✅', type:'img', src:'vine_cross2.png' },
  { cat:'Блокеры — Цепи', label:'Клетка (Locked)',   status:'✅', type:'img', src:'cage_locked.png' },
  { cat:'Блокеры — Цепи', label:'Цепь L1',           status:'✅', type:'img', src:'chain_1.png' },
  { cat:'Блокеры — Цепи', label:'Цепь L2',           status:'✅', type:'img', src:'chain_2.png' },
  { cat:'Блокеры — Цепи', label:'Цепь L3',           status:'✅', type:'img', src:'chain_3.png' },
  { cat:'Блокеры — Цепи', label:'Цепь L4 (= L3!)',   status:'⚠️', type:'img', src:'chain_3.png',   note:'Нет отдельного спрайта для 4-го слоя' },

  // Прочие блокеры
  { cat:'Блокеры — Прочие', label:'Тайник (Mystery)',          status:'✅', type:'img', src:'mystery.png' },
  { cat:'Блокеры — Прочие', label:'Варенье (неверный спрайт)',status:'⚠️', type:'img', src:'vine_branch.png', note:'Нужен спрайт варенья — сейчас vine_branch' },
  { cat:'Блокеры — Прочие', label:'Жвачка-пузырь L1',         status:'✅', type:'img', src:'jelly_red.png' },
  { cat:'Блокеры — Прочие', label:'Жвачка-пузырь L2',         status:'✅', type:'img', src:'jelly_orange.png' },
  { cat:'Блокеры — Прочие', label:'Камень',                    status:'✅', type:'img', src:'stone.png' },
  { cat:'Блокеры — Прочие', label:'Камень (трещина)',          status:'✅', type:'img', src:'stone_cracked.png' },
  { cat:'Блокеры — Прочие', label:'Камень (1 дыра)',           status:'✅', type:'img', src:'stone_1hole.png' },
  { cat:'Блокеры — Прочие', label:'Камень (2 дыры)',           status:'✅', type:'img', src:'stone_2holes.png' },
  { cat:'Блокеры — Прочие', label:'Камень (разбит)',           status:'✅', type:'img', src:'stone_broken.png' },

  // Режимные
  { cat:'Режимные', label:'Пушка (процедурный)',      status:'✅', type:'proc', proc:'cannon' },
  { cat:'Режимные', label:'Бутылка (flood)',           status:'✅', type:'img',  src:'bottle.png' },
  { cat:'Режимные', label:'Ингредиент (≈ вёдро)',    status:'⚠️', type:'img',  src:'gem_bucket.png', note:'Нужен свой спрайт' },
  { cat:'Режимные', label:'Ковёр (PaintBattle)',      status:'✅', type:'proc', proc:'fountain',     note:'Рисуется процедурно (_getCarpetSprite)' },
  { cat:'Режимные', label:'Портал',                   status:'✅', type:'proc', proc:'portal' },
  { cat:'Режимные', label:'Flood Level (жидкость)',   status:'❌', type:'missing', note:'Нет визуала жидкости — только HUD' },
];

// Picker: все типы фишек для мини-площадки
// Порядок типов: 0=жёлт, 1=голуб, 2=зелён, 3=красн, 4=фиолет, 5=оранж, 6=синий
const _GEM_LABELS = ['Жёлтый','Голубой','Зелёный','Красный','Фиолетовый','Оранжевый','Синий'];
const _MINI_PIECES = [
  // Гемы (все 7 цветов)
  ...Array.from({length:7},(_,i)=>({ g:'Гемы', id:`g${i}`, label:_GEM_LABELS[i], cell:{type:i,special:0} })),
  // Молния H (все 7 цветов)
  ...Array.from({length:7},(_,i)=>({ g:'Молния H', id:`sh${i}`, label:_GEM_LABELS[i], cell:{type:i,special:1} })),
  // Молния V (все 7 цветов)
  ...Array.from({length:7},(_,i)=>({ g:'Молния V', id:`sv${i}`, label:_GEM_LABELS[i], cell:{type:i,special:2} })),
  // ТНТ / Бомба (все 7 цветов)
  ...Array.from({length:7},(_,i)=>({ g:'ТНТ', id:`tb${i}`, label:_GEM_LABELS[i], cell:{type:i,special:7} })),
  // Ракета (все 7 цветов)
  ...Array.from({length:7},(_,i)=>({ g:'Ракета', id:`rk${i}`, label:_GEM_LABELS[i], cell:{type:i,special:6} })),
  // Красящая / Barrel (все 7 цветов)
  ...Array.from({length:7},(_,i)=>({ g:'Красящая', id:`cl${i}`, label:_GEM_LABELS[i], cell:{type:i,special:8} })),
  // Радуга
  { g:'Радуга', id:'s4', label:'Радуга', cell:{type:-1,special:4} },
  // Лёд (6 слоёв)
  ...Array.from({length:6},(_,i)=>({ g:'Лёд', id:`ic${i+1}`, label:`L${i+1}`, cell:{type:0,special:0,_ice:i+1} })),
  // Иней (2 слоя)
  { g:'Иней', id:'fr1', label:'Иней L1', cell:{type:0,special:0,_frost:1} },
  { g:'Иней', id:'fr2', label:'Иней L2', cell:{type:0,special:0,_frost:2} },
  // Мёд (4 слоя) + медведь
  ...Array.from({length:4},(_,i)=>({ g:'Мёд', id:`hn${i+1}`, label:`L${i+1}`, cell:{type:0,special:0,_amber:i+1} })),
  { g:'Мёд', id:'bear', label:'Крот (сп.)', cell:{type:0,special:0,_amber:1,_bear:true} },
  // Шоколад
  { g:'Шоколад', id:'bc',  label:'Шоколад (лава)',   cell:{type:-1,special:0,_choc:true} },
  { g:'Шоколад', id:'bw1', label:'Белый L1',          cell:{type:0,special:0,_mycelium:1} },
  { g:'Шоколад', id:'bw2', label:'Белый L2',          cell:{type:0,special:0,_mycelium:2} },
  { g:'Шоколад', id:'bfn', label:'Фонтан',            cell:{_fountain:true} },
  // Лакрица (3 вида)
  { g:'Лакрица', id:'bl1', label:'Ветка',    cell:{type:0,special:0,_sand:1} },
  { g:'Лакрица', id:'bl2', label:'Крест',    cell:{type:0,special:0,_sand:2} },
  { g:'Лакрица', id:'bl3', label:'Крест-2',  cell:{type:0,special:0,_sand:3} },
  // Цепи (3 слоя) + клетка
  { g:'Цепи', id:'b1',  label:'Цепь L1',   cell:{type:0,special:0,_chain:1} },
  { g:'Цепи', id:'b2',  label:'Цепь L2',   cell:{type:0,special:0,_chain:2} },
  { g:'Цепи', id:'b3',  label:'Цепь L3',   cell:{type:0,special:0,_chain:3} },
  { g:'Цепи', id:'bk',  label:'Клетка',    cell:{type:0,special:0,_locked:true} },
  // Камни (5 вариантов)
  { g:'Камень', id:'st0', label:'Камень',      cell:{type:-1,special:0,_stoneVar:0} },
  { g:'Камень', id:'st1', label:'Трещина',     cell:{type:-1,special:0,_stoneVar:1} },
  { g:'Камень', id:'st2', label:'1 дыра',      cell:{type:-1,special:0,_stoneVar:2} },
  { g:'Камень', id:'st3', label:'2 дыры',      cell:{type:-1,special:0,_stoneVar:3} },
  { g:'Камень', id:'st4', label:'Разбит',      cell:{type:-1,special:0,_stoneVar:4} },
  // Жвачка/Желе
  { g:'Жвачка', id:'bj1', label:'Жвачка L1',   cell:{type:0,special:0,_dirt:1} },
  { g:'Жвачка', id:'bj2', label:'Жвачка L2',   cell:{type:0,special:0,_dirt:2} },
  // Прочие блокеры
  { g:'Прочие', id:'bm',  label:'Тайник',       cell:{type:0,special:0,_mystery:true} },
  { g:'Прочие', id:'bot', label:'Бутылка',       cell:{type:0,special:0,_flask:true} },
  // Режимные
  { g:'Режимные', id:'rp', label:'Портал',     cell:{_portal:true} },
  { g:'Режимные', id:'rc', label:'Ковёр',      cell:{type:0,special:0,_bricks:true} },
  { g:'Режимные', id:'rcn',label:'Пушка',      cell:{_cannon:true} },
  // Нет спрайта (заглушки)
  { g:'Нет спрайта ❌', id:'ms1', label:'BlackCandy',       cell:{_missing:true,_missLabel:'BLACK'} },
  { g:'Нет спрайта ❌', id:'ms2', label:'Мега-бомба',       cell:{_missing:true,_missLabel:'MEGA'} },
  { g:'Нет спрайта ❌', id:'ms3', label:'Лёд на кирпиче',  cell:{_missing:true,_missLabel:'ICE\nBRICK'} },
  { g:'Нет спрайта ❌', id:'ms4', label:'AmberBase',        cell:{_missing:true,_missLabel:'AMBER\nBASE'} },
  { g:'Нет спрайта ❌', id:'ms5', label:'Giant Relic',        cell:{_missing:true,_missLabel:'RELIC'} },
  { g:'Нет спрайта ❌', id:'ms6', label:'Lava Tray 2×2',   cell:{_missing:true,_missLabel:'TRAY'} },
  { g:'Нет спрайта ❌', id:'ms7', label:'Flood Level',       cell:{_missing:true,_missLabel:'FLOOD\nLVL'} },
  { g:'Нет спрайта ❌', id:'ms8', label:'Web',          cell:{_missing:true,_missLabel:'WEB'} },
  // Стереть
  { g:'Прочее', id:'clr', label:'Стереть', cell:null },
];

// All raw sprite files in sprites/squares/ — complete list
const _ALL_RAW_SPRITES = [
  'gem_red','gem_orange','gem_yellow','gem_green','gem_cyan','gem_blue','gem_purple','gem_bucket',
  'stripe_h_red','stripe_h_orange','stripe_h_yellow','stripe_h_green','stripe_h_cyan','stripe_h_blue','stripe_h_purple',
  'stripe_v_red','stripe_v_orange','stripe_v_yellow','stripe_v_green','stripe_v_cyan','stripe_v_blue','stripe_v_purple',
  'tnt_red','tnt_orange','tnt_yellow','tnt_green','tnt_cyan','tnt_blue','tnt_purple',
  'rocket_red','rocket_orange','rocket_yellow','rocket_green','rocket_cyan','rocket_blue','rocket_purple',
  'barrel_red','barrel_orange','barrel_yellow','barrel_green','barrel_cyan','barrel_blue','barrel_purple',
  'rainbow','ice','honey','lava','vine_branch','vine_cross','vine_cross2',
  'chain_1','chain_2','chain_3','cage_locked','mystery','bottle','portal',
  'stone','stone_cracked','stone_1hole','stone_2holes','stone_broken','gravel','rubble','cobblestone','dirt',
  'bear','bear_sleeping','jelly_red','jelly_orange',
];

// Returns already-loaded HTMLImageElement for a sprite name (no .png)
function _getSpriteByName(name) {
  const g = TEXTURE_PACK?.sprites;
  if (!g) return null;
  const maps = { gem:_TP_GEM, stripe_h:_TP_STRIPE_H, stripe_v:_TP_STRIPE_V, bomb:_TP_BOMB, rocket:_TP_ROCKET, coloring:_TP_COLORING };
  for (const [key, arr] of Object.entries(maps)) {
    const i = arr.indexOf(name); if (i >= 0 && g[key]?.[i]) return g[key][i];
  }
  if (name === 'rainbow' && g.rainbow) return g.rainbow;
  const bi = _TP_BLOCKS.indexOf(name); if (bi >= 0 && BLOCK_SPRITES[bi]) return BLOCK_SPRITES[bi];
  return null;
}

// Добавляем все raw-спрайты в пикер
for (const name of _ALL_RAW_SPRITES) {
  _MINI_PIECES.push({ g:'Спрайты (raw)', id:'raw_'+name, label:name, cell:{_rawFile:name} });
}

const _MINI_ROWS = 5, _MINI_COLS = 6, _MINI_CS = 52;
let _miniGrid = [];
let _miniSelected = _MINI_PIECES[0];
let _miniFilter = 'all';
let _assetsGridInited = false;

function showAssetsScreen() {
  showScreen('assets');
  if (!_assetsGridInited) { _buildMiniPlayground(); _assetsGridInited = true; }
  _buildAssetsGallery(_miniFilter);
}

function _miniClearGrid() {
  _miniGrid = Array.from({length:_MINI_ROWS}, ()=>new Array(_MINI_COLS).fill(null));
  _renderMiniGrid();
}

function _buildMiniPlayground() {
  _miniGrid = Array.from({length:_MINI_ROWS}, ()=>new Array(_MINI_COLS).fill(null));
  const cvs = document.getElementById('assets-mini-canvas');
  if (!cvs) return;
  cvs.width  = _MINI_COLS * _MINI_CS;
  cvs.height = _MINI_ROWS * _MINI_CS;
  _buildMiniPicker();
  _renderMiniGrid();
  cvs.onclick = e => {
    const rect=cvs.getBoundingClientRect();
    const sx=cvs.width/rect.width, sy=cvs.height/rect.height;
    const c=Math.floor((e.clientX-rect.left)*sx/_MINI_CS);
    const r=Math.floor((e.clientY-rect.top)*sy/_MINI_CS);
    if (r>=0&&r<_MINI_ROWS&&c>=0&&c<_MINI_COLS) {
      _miniGrid[r][c] = _miniSelected?.cell ? {..._miniSelected.cell} : null;
      _renderMiniGrid();
    }
  };
  cvs.oncontextmenu = e => {
    e.preventDefault();
    const rect=cvs.getBoundingClientRect();
    const sx=cvs.width/rect.width, sy=cvs.height/rect.height;
    const c=Math.floor((e.clientX-rect.left)*sx/_MINI_CS);
    const r=Math.floor((e.clientY-rect.top)*sy/_MINI_CS);
    if (r>=0&&r<_MINI_ROWS&&c>=0&&c<_MINI_COLS) { _miniGrid[r][c]=null; _renderMiniGrid(); }
  };
}

function _buildMiniPicker() {
  const container = document.getElementById('assets-picker');
  if (!container) return;
  const groups = {};
  for (const p of _MINI_PIECES) { if (!groups[p.g]) groups[p.g]=[]; groups[p.g].push(p); }
  let html = '';
  for (const [grp, items] of Object.entries(groups)) {
    html += `<div class="mp-group-label">${grp}</div>`;
    for (const item of items) {
      const sel = _miniSelected === item;
      html += `<button class="mp-btn${sel?' mp-selected':''}" onclick="_miniSelectPiece('${item.id}')">
        <canvas id="mpc-${item.id}" width="30" height="30"></canvas>
        <span class="mp-label">${item.label}</span>
      </button>`;
    }
  }
  container.innerHTML = html;
  for (const item of _MINI_PIECES) {
    const c2 = document.getElementById(`mpc-${item.id}`);
    if (!c2) continue;
    const x2 = c2.getContext('2d');
    if (!item.cell) {
      x2.fillStyle='#2d1515'; x2.fillRect(0,0,30,30);
      x2.fillStyle='#f87171'; x2.font='16px Arial'; x2.textAlign='center'; x2.textBaseline='middle';
      x2.fillText('✖',15,15);
    } else {
      _drawMiniCellOnCtx(x2,0,0,30,item.cell,0,0);
    }
  }
}

function _miniSelectPiece(id) {
  _miniSelected = _MINI_PIECES.find(p=>p.id===id) || null;
  _buildMiniPicker();
}

function _renderMiniGrid() {
  const cvs = document.getElementById('assets-mini-canvas');
  if (!cvs) return;
  const x2 = cvs.getContext('2d');
  for (let r=0;r<_MINI_ROWS;r++)
    for (let c=0;c<_MINI_COLS;c++)
      _drawMiniCellOnCtx(x2, c*_MINI_CS, r*_MINI_CS, _MINI_CS, _miniGrid[r]?.[c], r, c);
}

function _drawMiniCellOnCtx(x2, px, py, cs, piece, r, c) {
  const isEven=(r+c)%2===0;
  x2.fillStyle = isEven ? '#1a2744' : '#1e2d52';
  x2.fillRect(px, py, cs, cs);

  if (piece) {
    if (piece._dirt) {
      const jImg = piece._dirt===1 ? BLOCK_SPRITES[25] : BLOCK_SPRITES[26];
      if (jImg) x2.drawImage(jImg, px, py, cs, cs);
    }
    if (piece._missing) {
      x2.fillStyle='rgba(30,10,10,0.7)'; x2.fillRect(px+1,py+1,cs-2,cs-2);
      x2.strokeStyle='#7f1d1d'; x2.lineWidth=1.5; x2.strokeRect(px+2,py+2,cs-4,cs-4);
      x2.fillStyle='#f87171'; x2.font=`bold ${Math.round(cs*0.22)}px monospace`; x2.textAlign='center'; x2.textBaseline='middle';
      const lines=(piece._missLabel||'?').split('\n');
      lines.forEach((l,i)=>x2.fillText(l, px+cs/2, py+cs/2+(i-(lines.length-1)/2)*cs*0.25));
      return;
    } else if (piece._stone || piece._stoneVar !== undefined) {
      const sv = piece._stoneVar ?? 0;
      const sIdx = [0,2,11,10,3][sv] ?? 0; // stone, cracked, 1hole, 2holes, broken
      if (BLOCK_SPRITES[sIdx]) x2.drawImage(BLOCK_SPRITES[sIdx], px+1,py+1,cs-2,cs-2);
      else { x2.fillStyle='#4e4234'; x2.fillRect(px+2,py+2,cs-4,cs-4); }
    } else if (piece._choc) {
      if (BLOCK_SPRITES[1]) x2.drawImage(BLOCK_SPRITES[1], px+1,py+1,cs-2,cs-2);
      else { x2.fillStyle='#7c2d12'; x2.fillRect(px+2,py+2,cs-4,cs-4); }
    } else if (piece._flask) {
      if (BLOCK_SPRITES[12]) x2.drawImage(BLOCK_SPRITES[12], px,py,cs,cs);
    } else if (piece.special===SPECIAL.RAINBOW || (piece.type!==undefined && piece.type>=0)) {
      let img = null;
      const sp = piece.special||0;
      if      (sp===SPECIAL.RAINBOW)  img = TEXTURE_PACK.sprites.rainbow;
      else if (sp===SPECIAL.STRIPE_H) img = TEXTURE_PACK.sprites.stripe_h[piece.type];
      else if (sp===SPECIAL.STRIPE_V) img = TEXTURE_PACK.sprites.stripe_v[piece.type];
      else if (sp===SPECIAL.BOMB)     img = TEXTURE_PACK.sprites.bomb[piece.type]     || TEXTURE_PACK.sprites.gem[piece.type];
      else if (sp===SPECIAL.ROCKET)   img = TEXTURE_PACK.sprites.rocket[piece.type]   || TEXTURE_PACK.sprites.gem[piece.type];
      else if (sp===SPECIAL.COLORING) img = TEXTURE_PACK.sprites.coloring[piece.type] || TEXTURE_PACK.sprites.gem[piece.type];
      else if (piece.type>=0)         img = TEXTURE_PACK.sprites.gem[piece.type];
      if (img) x2.drawImage(img, px+2,py+2,cs-4,cs-4);
      else { x2.fillStyle=GEMS[piece.type]?.color||'#c084fc'; x2.beginPath(); x2.arc(px+cs/2,py+cs/2,cs*0.38,0,Math.PI*2); x2.fill(); }
    } else if (piece._rawFile) {
      const img = _getSpriteByName(piece._rawFile);
      if (img) {
        x2.drawImage(img, px+2, py+2, cs-4, cs-4);
      } else {
        x2.fillStyle='#334155'; x2.fillRect(px+2,py+2,cs-4,cs-4);
        x2.fillStyle='#94a3b8'; x2.font=`${Math.round(cs*0.18)}px monospace`;
        x2.textAlign='center'; x2.textBaseline='middle';
        x2.fillText(piece._rawFile.slice(0,8), px+cs/2, py+cs/2);
      }
    } else if (piece._fountain) {
      _drawProceduralMini(x2, px, py, cs, 'fountain');
    } else if (piece._cannon) {
      _drawProceduralMini(x2, px, py, cs, 'cannon');
    } else if (piece._portal) {
      _drawProceduralMini(x2, px, py, cs, 'portal');
    }
    // Overlays
    if (piece._ice && BLOCK_SPRITES[23]) x2.drawImage(BLOCK_SPRITES[23], px,py,cs,cs);
    if (piece._frost)    _drawProceduralMini(x2, px,py,cs,'frost',   piece._frost);
    if (piece._amber && BLOCK_SPRITES[20]) x2.drawImage(BLOCK_SPRITES[20], px,py,cs,cs);
    if (piece._bear  && BLOCK_SPRITES[22]) x2.drawImage(BLOCK_SPRITES[22], px,py,cs,cs);
    if (piece._mycelium) _drawProceduralMini(x2, px,py,cs,'mycelium', piece._mycelium);
    if (piece._sand) {
      const lIdx = [14,15,16][Math.min((piece._sand||1)-1, 2)]; // vine_branch=14, vine_cross=15, vine_cross2=16
      if (BLOCK_SPRITES[lIdx]) x2.drawImage(BLOCK_SPRITES[lIdx], px,py,cs,cs);
    }
    if (piece._locked   && BLOCK_SPRITES[7])  x2.drawImage(BLOCK_SPRITES[7],  px+1,py+1,cs-2,cs-2);
    if (piece._chain) {
      const cIdx = 16 + Math.min(piece._chain, 3);
      if (BLOCK_SPRITES[cIdx]) x2.drawImage(BLOCK_SPRITES[cIdx], px,py,cs,cs);
    }
    if (piece._mystery && BLOCK_SPRITES[13]) x2.drawImage(BLOCK_SPRITES[13], px+1,py+1,cs-2,cs-2);
    if (piece._bricks) {
      x2.fillStyle='rgba(139,69,19,0.45)'; x2.fillRect(px+2,py+2,cs-4,cs-4);
      x2.strokeStyle='#b45309'; x2.lineWidth=1.5; x2.strokeRect(px+3,py+3,cs-6,cs-6);
    }
  }
  x2.strokeStyle='rgba(255,255,255,0.10)'; x2.lineWidth=1;
  x2.strokeRect(px+0.5, py+0.5, cs-1, cs-1);
}

// Standalone procedural mini-renders (work on any canvas ctx, no globals needed)
function _drawProceduralMini(x2, px, py, cs, proc, arg) {
  const cx=px+cs/2, cy=py+cs/2;
  if (proc==='frost') {
    const fl=arg||1, alpha=0.30+fl/2*0.55;
    x2.save(); x2.globalAlpha=alpha;
    x2.fillStyle='#c7f0ff'; x2.fillRect(px+1,py+1,cs-2,cs-2);
    x2.strokeStyle='rgba(255,255,255,0.65)'; x2.lineWidth=1;
    const sr=cs*0.36;
    for (let i=0;i<6;i++){const a=i*Math.PI/3; x2.beginPath(); x2.moveTo(cx,cy); x2.lineTo(cx+Math.cos(a)*sr,cy+Math.sin(a)*sr); x2.stroke();}
    x2.strokeStyle='rgba(180,230,255,0.55)'; x2.lineWidth=1.5; x2.strokeRect(px+2,py+2,cs-4,cs-4);
    x2.restore();
  } else if (proc==='mycelium') {
    const wl=arg||1;
    x2.fillStyle=wl>=2?'#f0e0c0':'#faf4e8'; x2.fillRect(px+2,py+2,cs-4,cs-4);
    x2.strokeStyle=wl>=2?'#d4b47c':'#e8d0a8'; x2.lineWidth=0.8;
    for (let gi=1;gi<4;gi++){
      x2.beginPath(); x2.moveTo(px+cs*gi/4,py+2); x2.lineTo(px+cs*gi/4,py+cs-2); x2.stroke();
      x2.beginPath(); x2.moveTo(px+2,py+cs*gi/4); x2.lineTo(px+cs-2,py+cs*gi/4); x2.stroke();
    }
    x2.strokeStyle=wl>=2?'#c8903c':'#dca850'; x2.lineWidth=1.5; x2.strokeRect(px+2,py+2,cs-4,cs-4);
  } else if (proc==='fountain') {
    x2.fillStyle='rgba(255,215,100,0.22)'; x2.fillRect(px+2,py+2,cs-4,cs-4);
    x2.strokeStyle='rgba(255,190,60,0.6)'; x2.lineWidth=2; x2.strokeRect(px+2,py+2,cs-4,cs-4);
    x2.font=`${Math.round(cs*.44)}px Arial`; x2.textAlign='center'; x2.textBaseline='middle'; x2.fillText('✨',cx,cy);
  } else if (proc==='cannon') {
    x2.fillStyle='#1a1a2e'; x2.beginPath(); x2.arc(cx,cy,cs*0.38,0,Math.PI*2); x2.fill();
    x2.strokeStyle='#4a5568'; x2.lineWidth=cs*0.04; x2.beginPath(); x2.arc(cx,cy,cs*0.27,0,Math.PI*1.4); x2.stroke();
    x2.fillStyle='#f97316'; x2.beginPath(); x2.moveTo(cx+cs*0.20,cy); x2.lineTo(cx+cs*0.09,cy-cs*0.11); x2.lineTo(cx+cs*0.09,cy+cs*0.11); x2.closePath(); x2.fill();
    x2.strokeStyle='#64748b'; x2.lineWidth=cs*0.06; x2.beginPath(); x2.arc(cx,cy,cs*0.38,0,Math.PI*2); x2.stroke();
  } else if (proc==='portal') {
    x2.save(); x2.globalAlpha=0.22; x2.fillStyle='#a855f7'; x2.beginPath(); x2.arc(cx,cy,cs*0.40,0,Math.PI*2); x2.fill(); x2.restore();
    x2.strokeStyle='#a855f7'; x2.lineWidth=2.5; x2.beginPath(); x2.arc(cx,cy,cs*0.40,0,Math.PI*2); x2.stroke();
    x2.font=`${Math.round(cs*.32)}px Arial`; x2.textAlign='center'; x2.textBaseline='middle'; x2.fillText('🌀',cx,cy);
  }
}

function _agTPSrc(tp, idx) {
  const maps = { gem:_TP_GEM, stripe_h:_TP_STRIPE_H, stripe_v:_TP_STRIPE_V, bomb:_TP_BOMB, rocket:_TP_ROCKET, coloring:_TP_COLORING };
  if (tp==='rainbow') return 'sprites/squares/rainbow.png';
  return 'sprites/squares/'+(maps[tp]?.[idx]||'')+'.png';
}

function _buildAssetsGallery(filter) {
  _miniFilter = filter||'all';
  ['all','ok','warn','miss'].forEach(f => {
    const btn=document.getElementById('af-'+f);
    if (btn) btn.style.background = f===_miniFilter?'#6d28d9':'#1e293b';
  });
  const container = document.getElementById('assets-gallery');
  if (!container) return;
  const groups = {};
  for (const a of _ASSET_CATALOG) {
    if (_miniFilter==='ok'   && a.status!=='✅') continue;
    if (_miniFilter==='warn' && a.status!=='⚠️') continue;
    if (_miniFilter==='miss' && a.status!=='❌') continue;
    if (!groups[a.cat]) groups[a.cat]=[];
    groups[a.cat].push(a);
  }
  let html='';
  for (const [cat,items] of Object.entries(groups)) {
    html+=`<div class="ag-section"><div class="ag-cat-title">${cat}</div><div class="ag-cards">`;
    for (const a of items) {
      const sc=a.status==='✅'?'#4ade80':a.status==='⚠️'?'#fbbf24':'#f87171';
      let preview='';
      if (a.type==='img') preview=`<img src="sprites/squares/${a.src}" width="56" height="56">`;
      else if (a.type==='tp') preview=`<img src="${_agTPSrc(a.tp,a.tpIdx)}" width="56" height="56">`;
      else if (a.type==='proc') preview=`<canvas class="ag-proc" data-proc="${a.proc}" data-arg="${a.procArg||0}" width="56" height="56"></canvas>`;
      else preview=`<div style="width:56px;height:56px;font-size:24px;display:flex;align-items:center;justify-content:center;color:#475569;">✖</div>`;
      html+=`<div class="ag-card"${a.note?` title="${a.note}"`:''}><div class="ag-preview">${preview}</div><div class="ag-status" style="color:${sc}">${a.status}</div><div class="ag-label">${a.label}</div></div>`;
    }
    html+='</div></div>';
  }
  container.innerHTML=html;
  container.querySelectorAll('canvas.ag-proc').forEach(cvs=>{
    const proc=cvs.dataset.proc, arg=parseInt(cvs.dataset.arg)||0;
    const x2=cvs.getContext('2d');
    x2.fillStyle='#1a2744'; x2.fillRect(0,0,56,56);
    _drawProceduralMini(x2,0,0,56,proc,arg);
  });
}

// ══════════════════════════════════════════
//  SPRITE REMAPPER
// ══════════════════════════════════════════

const _REMAP_SLOTS = (() => {
  const slots = [];
  const tp = () => TEXTURE_PACK.sprites;
  const colors = ['Жёлтый','Голубой','Зелёный','Красный','Фиолетовый','Оранжевый','Синий'];

  // TEXTURE_PACK gems + specials
  const tpKeys = [
    { key:'gem',      label:'Гем' },
    { key:'stripe_h', label:'Молния H' },
    { key:'stripe_v', label:'Молния V' },
    { key:'bomb',     label:'ТНТ' },
    { key:'rocket',   label:'Ракета' },
    { key:'coloring', label:'Красящая' },
  ];
  for (const { key, label } of tpKeys) {
    for (let i = 0; i < 7; i++) {
      const ci = i;
      slots.push({
        id: `tp_${key}_${ci}`,
        g: label,
        label: colors[ci],
        get: () => tp()?.[key]?.[ci] ?? null,
        set: v => { if (tp()) tp()[key][ci] = v; }
      });
    }
  }
  slots.push({ id:'tp_rainbow', g:'Радуга', label:'Rainbow', get:()=>tp()?.rainbow??null, set:v=>{ if(tp()) tp().rainbow=v; } });

  // BLOCK_SPRITES
  const blockLabels = [
    'Камень','Шоколад (lava.png!)','Камень (трещина)','Камень (разбит)','Гравий',
    'Щебень','Ингредиент (bucket!)','Клетка','Булыжник','Земля',
    'Камень (2 дыры)','Камень (1 дыра)','Бутылка','Тайник','Лакрица-ветка',
    'Лакрица-крест','Лакрица-крест2','Цепь L1','Цепь L2','Цепь L3',
    'Янтарь','Крот (бодрый)','Крот (в янтаре)','Лёд','Портал',
    'Жвачка L1','Жвачка L2'
  ];
  for (let i = 0; i < 27; i++) {
    const bi = i;
    slots.push({
      id: `bs_${bi}`,
      g: 'Блокеры',
      label: blockLabels[bi] || `Block[${bi}]`,
      get: () => BLOCK_SPRITES[bi] ?? null,
      set: v => { BLOCK_SPRITES[bi] = v; }
    });
  }

  // Pending — нет слота в игре, только превью спрайта
  const _pend = {};
  const pending = [
    { id:'pnd_mega',      label:'Мега-бомба (MEGA)' },
    { id:'pnd_black',     label:'8-й цвет гема (тёмный)' },
    { id:'pnd_choc_real', label:'Лава (нужен спрайт)' },
    { id:'pnd_web', label:'Паутина/Web' },
    { id:'pnd_bricks',    label:'Кладка (Bricks)' },
    { id:'pnd_bucket',label:'Ведро (Артефакт)' },
    { id:'pnd_cupcake1',  label:'Геода L1' },
    { id:'pnd_cupcake2',  label:'Геода L2' },
    { id:'pnd_cupcake3',  label:'Геода L3' },
    { id:'pnd_cupcake4',  label:'Геода L4' },
    { id:'pnd_cupcake5',  label:'Геода L5' },
    { id:'pnd_candycane', label:'Рудная жила (cane)' },
    { id:'pnd_dirtcake', label:'DirtCake 2×2' },
    { id:'pnd_pancake',   label:'Слоёный камень (spawner)' },
    { id:'pnd_chainlock', label:'Chain Lock' },
    { id:'pnd_bubblegumlock', label:'Замок желе' },
    { id:'pnd_amberbase', label:'AmberBase (без крышки)' },
    { id:'pnd_giantfish', label:'Giant Relic' },
    { id:'pnd_choctray',  label:'Lava Tray 2×2' },
    { id:'pnd_flood',      label:'Flood Level (жидкость)' },
  ];
  for (const p of pending) {
    const pid = p.id;
    slots.push({ id:pid, g:'❌ Нет слота', label:p.label,
      get: () => _pend[pid] ?? null,
      set: v => { _pend[pid] = v; }
    });
  }

  return slots;
})();

let _remapSelectedSlot = null;
let _remapperLoadedImgs = {};
const _REMAP_SAVE_KEY = 'oreRush_remapV1';

// { slotId → spriteName }
let _remapAssignments = JSON.parse(localStorage.getItem(_REMAP_SAVE_KEY) || '{}');

function _saveRemapAssignments() {
  localStorage.setItem(_REMAP_SAVE_KEY, JSON.stringify(_remapAssignments));
}

function _loadRemapImg(name) {
  return new Promise(res => {
    const cached = _getSpriteByName(name) || _remapperLoadedImgs[name];
    if (cached?.complete && cached.naturalWidth) { res(cached); return; }
    const im = new Image();
    im.onload = () => { _remapperLoadedImgs[name] = im; res(im); };
    im.onerror = () => res(null);
    im.src = `sprites/squares/${name}.png`;
  });
}

async function restoreRemapAssignments() {
  const entries = Object.entries(_remapAssignments);
  if (!entries.length) return;
  for (const [slotId, spriteName] of entries) {
    const slot = _REMAP_SLOTS.find(s => s.id === slotId);
    if (!slot) continue;
    const img = await _loadRemapImg(spriteName);
    if (img) slot.set(img);
  }
  invalidateGemCache();
  console.log(`[Remap] Восстановлено ${entries.length} назначений`);
}

function openSpriteRemapper() {
  const el = document.getElementById('sprite-remapper');
  if (!el) return;
  el.style.display = 'flex';
  _remapSelectedSlot = null;
  _buildRemapperSlots();
  _buildRemapperGrid();
}

function closeSpriteRemapper() {
  const el = document.getElementById('sprite-remapper');
  if (el) el.style.display = 'none';
}

function _buildRemapperSlots() {
  const container = document.getElementById('sr-slots');
  if (!container) return;
  const groups = {};
  for (const s of _REMAP_SLOTS) { if (!groups[s.g]) groups[s.g]=[]; groups[s.g].push(s); }
  let html = '';
  for (const [grp, items] of Object.entries(groups)) {
    const grpColor = grp.startsWith('❌') ? '#ef4444' : '#7c3aed';
    const grpNote  = grp.startsWith('❌') ? ' <span style="font-size:9px;color:#64748b;font-weight:400;">(только превью)</span>' : '';
    html += `<div style="font-size:10px;color:${grpColor};font-weight:700;padding:4px 2px 2px;text-transform:uppercase;letter-spacing:.04em;">${grp}${grpNote}</div>`;
    for (const s of items) {
      const sel = _remapSelectedSlot?.id === s.id;
      html += `<button onclick="_selectRemapSlot('${s.id}')" style="display:flex;align-items:center;gap:5px;width:100%;background:${sel?'rgba(109,40,217,0.5)':'rgba(255,255,255,0.04)'};border:1px solid ${sel?'#7c3aed':'rgba(255,255,255,0.07)'};border-radius:6px;padding:3px 5px;cursor:pointer;text-align:left;">
        <canvas id="srslot-${s.id}" width="28" height="28" style="flex-shrink:0;border-radius:3px;"></canvas>
        <span style="font-size:11px;color:${sel?'#c4b5fd':'#cbd5e1'};overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${s.label}</span>
      </button>`;
    }
  }
  container.innerHTML = html;
  // Draw thumbnails
  for (const s of _REMAP_SLOTS) {
    const cvs = document.getElementById(`srslot-${s.id}`);
    if (!cvs) continue;
    const x2 = cvs.getContext('2d');
    x2.fillStyle = '#0f0a1e';
    x2.fillRect(0,0,28,28);
    const img = s.get();
    if (img) x2.drawImage(img, 0, 0, 28, 28);
    else { x2.fillStyle='#334155'; x2.fillRect(1,1,26,26); x2.fillStyle='#64748b'; x2.font='9px monospace'; x2.textAlign='center'; x2.textBaseline='middle'; x2.fillText('?',14,14); }
  }
}

function _buildRemapperGrid() {
  const container = document.getElementById('sr-sprites');
  if (!container) return;
  let html = '';
  for (const name of _ALL_RAW_SPRITES) {
    html += `<button onclick="_assignSpriteToSlot('${name}')" title="${name}" style="width:56px;height:56px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.10);border-radius:6px;cursor:pointer;padding:2px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;" id="srsp-btn-${name}">
      <canvas id="srsp-${name}" width="46" height="46" style="border-radius:3px;"></canvas>
      <span style="font-size:7.5px;color:#94a3b8;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:54px;">${name}</span>
    </button>`;
  }
  container.innerHTML = html;
  // Draw sprites — use already-loaded images via _getSpriteByName
  for (const name of _ALL_RAW_SPRITES) {
    const cvs = document.getElementById(`srsp-${name}`);
    if (!cvs) continue;
    const x2 = cvs.getContext('2d');
    x2.fillStyle = '#1a2744';
    x2.fillRect(0,0,46,46);
    const img = _getSpriteByName(name);
    if (img) {
      x2.drawImage(img, 1, 1, 44, 44);
    } else {
      // Try loading fresh
      if (!_remapperLoadedImgs[name]) {
        const im = new Image();
        im.onload = () => { _remapperLoadedImgs[name]=im; x2.clearRect(0,0,46,46); x2.fillStyle='#1a2744'; x2.fillRect(0,0,46,46); x2.drawImage(im,1,1,44,44); };
        im.src = `sprites/squares/${name}.png`;
        _remapperLoadedImgs[name] = im;
      }
      x2.fillStyle='#334155'; x2.fillRect(1,1,44,44);
      x2.fillStyle='#94a3b8'; x2.font='8px monospace'; x2.textAlign='center'; x2.textBaseline='middle';
      x2.fillText(name.slice(0,8),23,23);
    }
  }
}

function _selectRemapSlot(id) {
  _remapSelectedSlot = _REMAP_SLOTS.find(s=>s.id===id) || null;
  _buildRemapperSlots();
  const bar = document.getElementById('sr-status-bar');
  if (bar) bar.textContent = _remapSelectedSlot ? `✔ "${_remapSelectedSlot.label}" → Шаг 2: кликни спрайт справа` : 'Шаг 1 → выбери слот слева';
  const clrBtn = document.getElementById('sr-clear-btn');
  if (clrBtn) clrBtn.style.display = (_remapSelectedSlot && _remapSelectedSlot.get()) ? 'inline-block' : 'none';
}

function clearRemapSlot() {
  if (!_remapSelectedSlot) return;
  _remapSelectedSlot.set(null);
  delete _remapAssignments[_remapSelectedSlot.id];
  _saveRemapAssignments();
  if (!_remapSelectedSlot.id.startsWith('pnd_')) { invalidateGemCache(); if (state.screen==='game') drawBoard(); }
  const bar = document.getElementById('sr-status-bar');
  if (bar) bar.textContent = `🗑 Снят: ${_remapSelectedSlot.label}`;
  const clrBtn = document.getElementById('sr-clear-btn');
  if (clrBtn) clrBtn.style.display = 'none';
  _buildRemapperSlots();
}

function _assignSpriteToSlot(spriteName) {
  if (!_remapSelectedSlot) {
    const bar = document.getElementById('sr-status-bar');
    if (bar) { bar.textContent = '⚠️ Сначала кликни слот слева!'; bar.style.color='#f87171'; setTimeout(()=>{ bar.style.color='#94a3b8'; bar.textContent='Шаг 1 → выбери слот слева'; },2000); }
    return;
  }
  // Get or load image
  let img = _getSpriteByName(spriteName) || _remapperLoadedImgs[spriteName];
  const isPending = _remapSelectedSlot.id.startsWith('pnd_');
  const doAssign = im => {
    // Убираем этот спрайт у любого другого слота (уникальность 1:1)
    for (const s of _REMAP_SLOTS) {
      if (s !== _remapSelectedSlot && s.get() === im) {
        s.set(null);
        delete _remapAssignments[s.id];
        if (!s.id.startsWith('pnd_')) invalidateGemCache();
      }
    }
    _remapSelectedSlot.set(im);
    _remapAssignments[_remapSelectedSlot.id] = spriteName;
    _saveRemapAssignments();
    if (!isPending) { invalidateGemCache(); if (state.screen==='game') drawBoard(); }
    const bar = document.getElementById('sr-status-bar');
    if (bar) bar.textContent = isPending
      ? `👁 Превью: ${_remapSelectedSlot.label} ← ${spriteName}`
      : `✅ ${_remapSelectedSlot.label} ← ${spriteName}`;
    const clrBtn = document.getElementById('sr-clear-btn');
    if (clrBtn) clrBtn.style.display = 'inline-block';
    showToast(isPending ? `Превью: ${spriteName}` : `${_remapSelectedSlot.label} ← ${spriteName}`);
    _buildRemapperSlots();
  };
  if (img && img.complete && img.naturalWidth) {
    doAssign(img);
  } else {
    const im = new Image();
    im.onload = () => { _remapperLoadedImgs[spriteName]=im; doAssign(im); };
    im.onerror = () => showToast('Спрайт не загружен: ' + spriteName);
    im.src = `sprites/squares/${spriteName}.png`;
  }
}

// После загрузки инициализируем сезон, турнир и пуши
async function postLoadInit() {
  initSeason();
  initTournament();
  await setupPushNotifications();
  await restoreRemapAssignments();
  if (state.tournWeekStart > 0 && getWeekStart() !== state.tournWeekStart && !state.tournEndChecked) {
    checkTournamentEnd();
  }
  generateDailyQuests();
  renderQuestsRow();
  renderPiggyBar();
  checkReengagement();
}

