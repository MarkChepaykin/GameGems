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
      <button onclick="startTestLevel()" style="${devBtnStyle('#134e4a')};width:100%;margin-bottom:4px;">🧪 Тест-уровень</button>
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
        <button onclick="devSetSidekick('bear')"   style="${devBtnStyle('#7c2d12')}">🐻 Медведь</button>
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
    stoneCount:0, jellyCount:0, gemTypes:5, holes:[], chocolateCount:0 };
  _levelCache.set(999, fakeLevel);
  state.currentLevel = 999;
  state._firstAttemptLevel = -1;
  state.moves = 999; state.score = 0;
  state.collectedGems = {}; state.iceBroken = 0; state.stonesBroken = 0;
  state.comboCount = 0; state.matchSequenceStep = 0; state.matchSoundLvl = 0;
  state.adMovesUsed = false; state.extraMovesUsed = false;
  state.ingredientsDelivered = 0; state.chocolateInitial = 0;
  state.sodaLevel = 0; state.bottlesBroken = 0; state._winShowing = false; state._inBonusExplosion = false;
  state.lastSwap = null; state.undoUsedThisLevel = false; state.bearsFreed = 0;
  state.buffPieces = 0; state.buffNukeReady = false; state.buffNukeActive = false;
  state.supersonicActive = false; state.supersonicMovesLeft = 0;
  _activeGemTypes = 5;
  _matchEpoch++;

  state.holes = new Set();
  state.jellyGrid  = Array.from({length:ROWS},()=>new Array(COLS).fill(0));
  state.carpetGrid = Array.from({length:ROWS},()=>new Array(COLS).fill(false));
  state.carpetTotal = 0;
  state.iceGrid    = Array.from({length:ROWS},()=>new Array(COLS).fill(0));
  state.jellyTotal = 0;
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
    if (cl&&!cl.stone&&!cl.chocolate&&!state.holes.has(`${r},${c}`)) {
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
  const chocRem = countChocolateRemaining();
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
      const pos=[]; for(let r=0;r<ROWS;r++) for(let c=0;c<COLS;c++){const cl=state.board[r]?.[c]; if(cl&&!cl.chocolate&&!cl.stone&&cl.type>=0&&!state.holes.has(`${r},${c}`))pos.push([r,c]);}
      if(pos.length){const [r,c]=pos[Math.floor(Math.random()*pos.length)]; state.board[r][c]={type:-1,special:SPECIAL.NONE,stone:false,chocolate:true,marmalade:false,ingredient:false,anim:{}}; drawBoard();}
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

// После загрузки инициализируем сезон, турнир и пуши
async function postLoadInit() {
  initSeason();
  initTournament();
  await setupPushNotifications();
  if (state.tournWeekStart > 0 && getWeekStart() !== state.tournWeekStart && !state.tournEndChecked) {
    checkTournamentEnd();
  }
  generateDailyQuests();
  renderQuestsRow();
  renderPiggyBar();
  checkReengagement();
}

