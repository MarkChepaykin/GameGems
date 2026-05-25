// ══════════════════════════════════════════
//  ПЕРЕУПОРЯДОЧИВАНИЕ УРОВНЕЙ (TASK-04)
// ══════════════════════════════════════════
function reorderLevels() {
  // Just renumber — levels.js already has correct progression
  LEVELS.forEach((lvl, i) => { lvl.level = i + 1; });
}

// Глобальная функция: тир сложности 0=normal 1=hard 2=super-hard 3=ultra-hard
function getDifficultyTier(lvl) {
  if (!lvl) return 0;
  let d = 0;
  switch (lvl.type) {
    case 'score':       d += (lvl.target||0) / 600; break;
    case 'collect':     d += (lvl.target||0) * 0.3; break;
    case 'ice':         d += (lvl.iceCount||lvl.target||0) * 1.2; break;
    case 'jelly':       d += (lvl.jellyCount||0) * 0.8; break;
    case 'stone':       d += (lvl.stoneCount||lvl.target||0) * 1.2; break;
    case 'ingredients': d += (lvl.ingredientCount||lvl.target||0) * 3; break;
    case 'chocolate':   d += (lvl.chocolateCount||0) * 1.5; break;
  }
  d += (lvl.iceCount||0)*0.5 + (lvl.stoneCount||0)*0.6 + (lvl.marmaladeCount||0)*0.8;
  d += (lvl.lockCount||0)*0.7 + (lvl.mysteryCount||0)*0.5 + (lvl.bottleCount||0)*0.6 + (lvl.jellyCount||0)*0.15 + (lvl.chocolateCount||0)*0.7;
  d += (lvl.holes||[]).length*0.3 + Math.max(0,25-(lvl.moves||20))*1.5 + ((lvl.gemTypes||4)-3)*1.5;
  if (d >= 75) return 3; // ultra-hard 💀💀💀
  if (d >= 45) return 2; // super-hard 💀💀
  if (d >= 20) return 1; // hard 💀
  return 0;              // normal
}

// Динамическая сложность
let _currentDynDiff = 1.0;
function getDynamicDifficulty() {
  const r = state.recentResults || [];
  const last5 = r.slice(-5);
  const last3 = r.slice(-3);
  const losses5 = last5.filter(x => x === 'lose').length;
  const wins3   = last3.filter(x => x === 'win').length;
  if (losses5 >= 3) return 0.75;
  if (wins3 === 3)  return 1.15;
  return 1.0;
}

// ══════════════════════════════════════════
//  ПРОЦЕДУРНЫЙ ГЕНЕРАТОР УРОВНЕЙ (TASK-02)
// ══════════════════════════════════════════

// mulberry32 PRNG — один seed = одна последовательность
function seededRandom(seed) {
  return function() {
    seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = t + Math.imul(t ^ (t >>> 7), 61 | t) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function _arenaIsConnected(holes) {
  let start = null;
  outer: for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    if (!holes.has(`${r},${c}`)) { start = [r, c]; break outer; }
  }
  if (!start) return true;
  const visited = new Set([`${start[0]},${start[1]}`]);
  const queue = [start];
  while (queue.length) {
    const [r, c] = queue.shift();
    for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
      const nr = r+dr, nc = c+dc, k = `${nr},${nc}`;
      if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && !holes.has(k) && !visited.has(k)) {
        visited.add(k); queue.push([nr, nc]);
      }
    }
  }
  return visited.size === ROWS * COLS - holes.size;
}

function generateArena(rng, difficulty) {
  const holes = new Set();
  if (difficulty <= 20) return holes;

  if (difficulty <= 50) {
    const depth = 1 + Math.floor(rng() * 2);
    for (let d = 0; d < depth; d++) for (let k = 0; k <= d; k++) {
      holes.add(`${k},${d-k}`);
      holes.add(`${k},${COLS-1-(d-k)}`);
      holes.add(`${ROWS-1-k},${d-k}`);
      holes.add(`${ROWS-1-k},${COLS-1-(d-k)}`);
    }
    return holes;
  }

  const shapeIdx = Math.floor(rng() * 4);
  if (difficulty <= 80) {
    if (shapeIdx === 0) {
      // Крест: срезаем 4 угловых квадранта 2×2
      const m = 2;
      for (let r = 0; r < m; r++) for (let c = 0; c < m; c++)           holes.add(`${r},${c}`);
      for (let r = 0; r < m; r++) for (let c = COLS-m; c < COLS; c++)   holes.add(`${r},${c}`);
      for (let r = ROWS-m; r < ROWS; r++) for (let c = 0; c < m; c++)   holes.add(`${r},${c}`);
      for (let r = ROWS-m; r < ROWS; r++) for (let c = COLS-m; c < COLS; c++) holes.add(`${r},${c}`);
    } else if (shapeIdx === 1) {
      // Т-форма: срезаем нижний правый квадрант
      for (let r = Math.floor(ROWS/2); r < ROWS; r++) for (let c = Math.ceil(COLS/2); c < COLS; c++) holes.add(`${r},${c}`);
    } else if (shapeIdx === 2) {
      // Г-форма: срезаем верхний правый квадрант
      for (let r = 0; r < Math.floor(ROWS/2); r++) for (let c = Math.ceil(COLS/2); c < COLS; c++) holes.add(`${r},${c}`);
    } else {
      // Арка: срезаем нижний центр
      const archW = Math.floor(COLS / 4), archH = Math.floor(ROWS / 4);
      for (let r = ROWS-archH; r < ROWS; r++) for (let c = archW; c < COLS-archW; c++) holes.add(`${r},${c}`);
    }
    return holes;
  }

  // diff 81-100: углы + внутренние дыры (арена связная)
  for (let d = 0; d < 2; d++) for (let k = 0; k <= d; k++) {
    holes.add(`${k},${d-k}`);
    holes.add(`${k},${COLS-1-(d-k)}`);
    holes.add(`${ROWS-1-k},${d-k}`);
    holes.add(`${ROWS-1-k},${COLS-1-(d-k)}`);
  }
  const innerTarget = Math.round(2 + (difficulty - 81) * 0.3);
  const candidates = [];
  for (let r = 2; r < ROWS-2; r++) for (let c = 2; c < COLS-2; c++) if (!holes.has(`${r},${c}`)) candidates.push([r, c]);
  for (let i = candidates.length-1; i > 0; i--) { const j = Math.floor(rng()*(i+1)); [candidates[i],candidates[j]]=[candidates[j],candidates[i]]; }
  let added = 0;
  for (const [r, c] of candidates) {
    if (added >= innerTarget) break;
    holes.add(`${r},${c}`);
    if (_arenaIsConnected(holes)) added++;
    else holes.delete(`${r},${c}`);
  }
  return holes;
}

function generateLevel(levelNumber) {
  const rng = seededRandom(levelNumber);
  const difficulty = Math.min(100, Math.round(levelNumber * 0.8));
  const holesSet = generateArena(rng, difficulty);
  const holesArr = [...holesSet].map(k => k.split(',').map(Number));
  const gemTypes = difficulty < 30 ? 4 : difficulty < 60 ? 5 : difficulty < 80 ? 6 : 7;

  // Пул типов целей с порогами по сложности
  const typePool = ['score','score','score','score'];
  if (difficulty >= 20) typePool.push('collect','collect');
  if (difficulty >= 30) typePool.push('ice','ice','ice');
  if (difficulty >= 45) typePool.push('jelly','carpet');
  if (difficulty >= 60) typePool.push('ingredients');
  if (difficulty >= 75) typePool.push('chocolate');
  if (difficulty >= 50) typePool.push('soda');
  const type = typePool[Math.floor(rng() * typePool.length)];

  // Препятствия
  const baseObs = Math.floor(difficulty / 20);
  const iceCount       = (type==='ice')         ? Math.round(4 + difficulty*0.2)
                        : (difficulty>30 && rng()>0.6) ? Math.round(1 + rng()*baseObs) : 0;
  const stoneCount     = (type==='stone')        ? Math.max(3, Math.round(3 + difficulty*0.12))
                        : (difficulty>40 && rng()>0.6) ? Math.round(1 + rng()*baseObs) : 0;
  const jellyCount     = (type==='jelly')        ? Math.round(8 + difficulty*0.2) : 0;
  const chocolateCount = (type==='chocolate')    ? Math.round(4 + difficulty*0.08) : 0;
  const marmaladeCount = (difficulty>50 && rng()>0.7) ? Math.round(1 + rng()*3) : 0;
  const lockCount      = (difficulty>40 && rng()>0.65) ? Math.round(1 + rng()*3) : 0;
  const mysteryCount   = (difficulty>55 && rng()>0.70) ? Math.round(1 + rng()*2) : 0;
  const ingredientCount= (type==='ingredients') ? Math.round(2 + difficulty*0.04) : 0;
  const bottleCount    = (type==='soda')        ? Math.round(2 + difficulty*0.04) : 0;
  const portalCount    = (difficulty > 70 && rng() > 0.6) ? (rng() > 0.5 ? 2 : 1) : 0;
  const licoriceCount  = (difficulty > 50 && rng() > 0.65) ? Math.round(1 + rng()*3) : 0;
  const licoriceSpawnRate = licoriceCount > 0 ? (rng()>0.5 ? 4 : 6) : 0;
  const licoriceMax    = licoriceCount > 0 ? Math.min(licoriceCount + 2, 6) : 0;
  const honeyCount     = (difficulty > 45 && rng() > 0.65) ? Math.round(1 + rng()*3) : 0;

  const obs = Math.round(iceCount*0.7 + stoneCount*0.5);
  const typ = Math.round(Math.max(0, gemTypes-3)*1.5);
  const holeW = Math.round(holesArr.length*0.25);

  let target, moves, gems = [];
  switch (type) {
    case 'score':
      target = Math.round((2000 + difficulty*200) / 500) * 500;
      moves  = Math.max(15, Math.round(target/290 + obs + typ + holeW));
      break;
    case 'collect':
      target = Math.round(15 + difficulty*0.5);
      gems = [Math.floor(rng()*gemTypes)];
      if (difficulty>40 && rng()>0.5) { let g; do { g=Math.floor(rng()*gemTypes); } while(g===gems[0]); gems.push(g); }
      moves = Math.max(15, Math.round(target*0.8 + obs));
      break;
    case 'ice':
      target = iceCount;
      moves  = Math.max(15, Math.round(target*1.5 + obs + typ));
      break;
    case 'jelly':
      target = 0;
      moves  = Math.max(15, Math.round(jellyCount*1.2 + obs + typ));
      break;
    case 'carpet':
      target = 0;
      moves  = Math.max(20, Math.round((COLS*ROWS - holesArr.length)*0.25 + obs + typ));
      break;
    case 'stone':
      target = stoneCount;
      moves  = Math.max(15, Math.round(target*2 + obs + typ));
      break;
    case 'ingredients':
      target = ingredientCount;
      moves  = Math.max(15, Math.round(ingredientCount*7 + obs + typ));
      break;
    case 'chocolate':
      target = 0;
      moves  = Math.max(15, Math.round(chocolateCount*2 + obs + typ));
      break;
    case 'soda':
      target = bottleCount;
      moves  = Math.max(15, Math.round(bottleCount*5 + obs + typ));
      break;
    default: target = 5000; moves = 20;
  }
  moves = Math.min(moves, 45);

  // Генерируем позиции порталов детерминированно через seeded rng
  const _portalPairs = [];
  if (portalCount > 0) {
    const _holeKeys = new Set(holesArr.map(([r,c])=>`${r},${c}`));
    const _validCells = [];
    for (let r=1;r<ROWS-1;r++) for (let c=1;c<COLS-1;c++) if (!_holeKeys.has(`${r},${c}`)) _validCells.push([r,c]);
    for (let i=_validCells.length-1;i>0;i--) { const j=Math.floor(rng()*(i+1)); [_validCells[i],_validCells[j]]=[_validCells[j],_validCells[i]]; }
    for (let i=0;i<portalCount&&i*2+1<_validCells.length;i++) {
      const [r1,c1]=_validCells[i*2], [r2,c2]=_validCells[i*2+1];
      if (Math.abs(r1-r2)+Math.abs(c1-c2)>=4) _portalPairs.push([r1,c1,r2,c2]);
    }
  }

  const lvlObj = { level:levelNumber, type, target, moves, gems, gemTypes,
    iceCount, stoneCount, jellyCount, holes:holesArr,
    chocolateCount, marmaladeCount, lockCount, mysteryCount, ingredientCount, bottleCount,
    licoriceCount, licoriceSpawnRate, licoriceMax, honeyCount,
    portals: _portalPairs.length > 0 ? _portalPairs : undefined, revision: 0 };

  // Быстрая симуляция баланса (40 проб). Корректируем ходы или цель если нужно.
  const _bsim = simulateLevelObj(lvlObj, 40);
  if (_bsim) {
    const _ep = Math.ceil(levelNumber / 16);
    const _minWR = _ep <= 2 ? 0.35 : _ep <= 5 ? 0.22 : 0.12;
    const _maxWR = _ep <= 2 ? 0.85 : _ep <= 5 ? 0.80 : 0.75;
    if (_bsim.winRate < _minWR) {
      if (type === 'score') lvlObj.target = Math.round(lvlObj.target * 0.80 / 500) * 500;
      else lvlObj.moves = Math.min(40, lvlObj.moves + 3);
    } else if (_bsim.winRate > _maxWR) {
      if (type === 'score') lvlObj.target = Math.round(lvlObj.target * 1.20 / 500) * 500;
      else lvlObj.moves = Math.max(20, lvlObj.moves - 2);
    }
  }

  return lvlObj;
}

function generateCampaign(from, to) {
  const start = LEVELS.length + 1;
  const total = to - start + 1;
  if (total <= 0) { showToast(`Уровни до ${to} уже сгенерированы`); return; }
  for (let n = start; n <= to; n++) {
    LEVELS.push(generateLevel(n));
    if ((n - start) % 100 === 0 && n < to) showToast(`Генерация: ${n - start + 1}/${total}...`);
  }
  showToast(`Уровни ${start}–${to} добавлены! (${total})`);
}

const _levelCache = new Map();
function getLevel(n) {
  if (typeof LEVELS !== 'undefined' && n >= 1 && n <= LEVELS.length) return LEVELS[n-1];
  if (_levelCache.has(n)) return _levelCache.get(n);
  const lvl = generateLevel(n);
  _levelCache.set(n, lvl);
  return lvl;
}

const TUTORIAL_STEPS = [
  { level:1,  text:'👆 Свайп два гема чтобы поменять местами!',     autoHint:true,
    handFrom:[4,3], handTo:[4,4] },
  { level:2,  text:'⚡ 4 гема в ряд = Молния! Попробуй!',           autoHint:true,
    handFrom:[3,2], handTo:[3,3] },
  { level:3,  text:'🎯 Посмотри на цель вверху экрана!',            autoHint:true  },
  { level:4,  text:'🎁 Г-форма = Бомба — двойной взрыв 3×3!',       autoHint:true,
    handFrom:[5,1], handTo:[5,2] },
  { level:5,  text:'🌈 Свайп Радугу с гемом — взрываются все того цвета!', autoHint:false },
  { level:16, text:'❄️ Делай матч рядом со льдом чтобы сломать его!', autoHint:true },
];

const LEVEL_DESC = {
  score:       lvl => `Набери ${lvl.target} очков`,
  collect:     lvl => `Собери ${lvl.target} ${lvl.gems.map(g => GEMS[g]?.name).join('/')}`,
  ice:         lvl => `Разбей ${lvl.target} льдинок`,
  stone:       lvl => `Убери ${lvl.target} камней`,
  jelly:       lvl => `Расчисти все гелевые ячейки`,
  ingredients: lvl => `Опусти ${lvl.target} вёдер с камнями`,
  chocolate:   lvl => `Рассей всю тьму`,
  soda:        lvl => `Разбей ${lvl.target} кристальных колб`,
  carpet:      lvl => `Покрась всё поле 🎨`,
  path:        lvl => `Проведи волшебника по пути из ${lvl.pathCells?.length||0} клеток 🧙`,
};

// Ежедневные награды (цикл 7 дней)
const DAILY_REWARDS = [
  { rarity:'common',    coins:0,   crystals:3,  lives:0, booster:null,        icon:'💎',    text:'+3 кристалла' },
  { rarity:'common',    coins:0,   crystals:0,  lives:1, booster:null,        icon:'❤️',    text:'+1 жизнь' },
  { rarity:'uncommon',  coins:0,   crystals:5,  lives:0, booster:null,        icon:'💎',    text:'+5 кристаллов' },
  { rarity:'rare',      coins:0,   crystals:0,  lives:2, booster:'hammer',    icon:'🔨❤️',  text:'+2 жизни + Молоток' },
  { rarity:'rare',      coins:0,   crystals:10, lives:0, booster:null,        icon:'💎',    text:'+10 кристаллов' },
  { rarity:'epic',      coins:0,   crystals:0,  lives:3, booster:'hammer',    icon:'💣❤️',  text:'+3 жизни + Молоток' },
  { rarity:'legendary', coins:0,   crystals:25, lives:0, booster:'colorbomb', icon:'🌈💎',  text:'+25 кристаллов + Радуга' },
];

// Бустеры
const BOOSTERS = [
  { id:'lightning', icon:'⛏️', name:'Бур',       desc:'Убирает ряд',      cost:150 },
  { id:'bomb',      icon:'🧨', name:'Динамит',  desc:'Взрыв 3×3 в центре', cost:200 },
  { id:'color',     icon:'📡', name:'Сканер',    desc:'Убирает 1 цвет',   cost:300 },
];

// ── Компаньоны-помощники (Sidekick) ──
const SIDEKICKS = {
  turtle: { id:'turtle', icon:'🐢', name:'Черепаха', desc:'Ломает 3 случайных льда',           maxCharge:20 },
  bird:   { id:'bird',   icon:'🐦', name:'Птичка',   desc:'Создаёт горизонтальную молнию',      maxCharge:15 },
  bear:   { id:'bear',   icon:'🐻', name:'Медведь',  desc:'+3 хода',                            maxCharge:25 },
};

// Кристалл-бустеры перед уровнем (только L10+)
const PRE_BOOSTERS = [
  { id:'extra_moves', icon:'🕐', name:'+3 хода',  desc:'Добавляет 3 хода к лимиту', cost:20 },
  { id:'rainbow_gem', icon:'📡', name:'Сканер',   desc:'Rainbow-фишка на случайную клетку', cost:30 },
  { id:'bomb_gem',    icon:'🧨', name:'Динамит',  desc:'Бомба на случайную клетку', cost:20 },
];

