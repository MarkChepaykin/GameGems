// ══════════════════════════════════════════
//  ИНИЦИАЛИЗАЦИЯ ПОЛЯ
// ══════════════════════════════════════════
function createGem(type) {
  return { type: type ?? randGem(), special: SPECIAL.NONE, stone: false, chocolate: false, marmalade: false, ingredient: false, locked: false, mystery: false, bottle: false, licorice: 0, honey: 0, anim: {} };
}
function createIngredient() {
  return { type: -2, special: SPECIAL.NONE, ice:false, stone:false, chocolate:false, marmalade:false, ingredient:true, anim:{} };
}
let _activeGemTypes = GEM_TYPES;
let _matchEpoch = 0; // инкрементируется при старте нового уровня — прерывает зависшие async-цепочки
let _currentColorWeights = null;   // per-level gem color weights
let _currentSpecialWeights = null; // per-level special spawn weights

// pick index proportional to weights array
function weightedRandom(weights) {
  let sum = 0;
  for (const w of weights) sum += w;
  let r = Math.random() * sum;
  for (let i = 0; i < weights.length; i++) { r -= weights[i]; if (r < 0) return i; }
  return weights.length - 1;
}

function randGem() {
  if (_currentColorWeights) {
    const w = _currentColorWeights.slice(0, _activeGemTypes);
    while (w.length < _activeGemTypes) w.push(1);
    return weightedRandom(w);
  }
  return Math.floor(Math.random() * _activeGemTypes);
}

function initBoard(lvl) {
  // Валидация win-conditions
  if (lvl.type==='stone' && (lvl.stoneCount||0)===0) console.warn(`Level ${lvl.level}: type=stone but stoneCount=0`);
  if (lvl.type==='ice' && (lvl.iceCount||0)===0) console.warn(`Level ${lvl.level}: type=ice but iceCount=0`);
  if (lvl.type==='collect' && (!lvl.gems||lvl.gems.length===0)) console.warn(`Level ${lvl.level}: type=collect but gems=[]`);
  if (lvl.type==='ingredients' && (lvl.ingredientCount||0)===0) console.warn(`Level ${lvl.level}: type=ingredients but ingredientCount=0`);
  // Устанавливаем количество типов фишек для уровня
  _activeGemTypes = lvl.gemTypes || GEM_TYPES;
  // load per-level gem/special weights
  _currentColorWeights = lvl.colorWeights || null;
  _currentSpecialWeights = lvl.specialSpawnWeights || null;
  // Dynamic difficulty — fewer colors when player is struggling
  _currentDynDiff = getDynamicDifficulty();
  if (_currentDynDiff < 1.0) _activeGemTypes = Math.max(3, _activeGemTypes - 1);
  // Инициализируем дыры
  const holeSet = new Set((lvl.holes || []).map(([r,c]) => `${r},${c}`));
  state.holes = holeSet;

  // Path Mode — сброс прогресса пути
  if (lvl.type === 'path') {
    state.pathProgress = 0;
  }

  // Инициализируем сетки желе, ковра, льда и frosting (cell-bound, не движутся с гемами)
  state.jellyGrid  = Array.from({length: ROWS}, () => new Array(COLS).fill(0));
  state.carpetGrid = Array.from({length: ROWS}, () => new Array(COLS).fill(false));
  state.carpetTotal = 0;
  state.iceGrid    = Array.from({length: ROWS}, () => new Array(COLS).fill(0));
  state.frostGrid  = Array.from({length: ROWS}, () => new Array(COLS).fill(0));
  state.portalGrid = Array.from({length: ROWS}, () => new Array(COLS).fill(null));

  // Предрасстановка: gemGrid теперь содержит ВСЕ цвета (specific + random через randomSeed)
  const _gemPreMap = new Map();
  if (Array.isArray(lvl.gemGrid)) {
    for (const [gr, gc, colorIdx] of lvl.gemGrid) {
      if (gr < ROWS && gc < COLS && !holeSet.has(`${gr},${gc}`)) {
        _gemPreMap.set(`${gr},${gc}`, colorIdx % _activeGemTypes);
      }
    }
  }
  const board = [];
  for (let r = 0; r < ROWS; r++) {
    board[r] = [];
    for (let c = 0; c < COLS; c++) {
      if (holeSet.has(`${r},${c}`)) { board[r][c] = null; continue; }
      const _pre = _gemPreMap.get(`${r},${c}`);
      if (_pre !== undefined) {
        board[r][c] = createGem(_pre);
      } else {
        let type;
        do { type = randGem(); } while (wouldMatch(board, r, c, type));
        board[r][c] = createGem(type);
      }
    }
  }
  // Ингредиенты (спавнятся в верхних рядах)
  if ((lvl.ingredientCount || 0) > 0) {
    const topPool = shuffleArray(getAllNonHolePositions(holeSet).filter(([r]) => r < 2));
    topPool.slice(0, lvl.ingredientCount).forEach(([r,c]) => { board[r][c] = createIngredient(); });
  }
  // Желе — используем точные позиции из jellyGrid (с числом слоёв), иначе рандом
  if (Array.isArray(lvl.jellyGrid) && lvl.jellyGrid.length > 0) {
    for (const pos of lvl.jellyGrid) {
      const [jr, jc, layers] = [pos[0], pos[1], pos[2] || 2];
      if (jr < ROWS && jc < COLS && !holeSet.has(`${jr},${jc}`)) state.jellyGrid[jr][jc] = layers;
    }
  } else if (lvl.jellyCount > 0) {
    shuffleArray(getAllNonHolePositions(holeSet)).slice(0, lvl.jellyCount).forEach(([r,c]) => {
      state.jellyGrid[r][c] = 2;
    });
  }
  // Ковёр — все незакрытые клетки покрыты ковром; цель = покрасить все
  if (lvl.type === 'carpet') {
    const allCells = getAllNonHolePositions(holeSet);
    allCells.forEach(([r,c]) => { state.carpetGrid[r][c] = true; });
    state.carpetTotal = allCells.length;
  }
  // Шоколад — точные позиции из chocGrid, иначе края
  if (Array.isArray(lvl.chocGrid) && lvl.chocGrid.length > 0) {
    for (const [cr, cc] of lvl.chocGrid) {
      if (cr < ROWS && cc < COLS && board[cr][cc] && !holeSet.has(`${cr},${cc}`)) {
        board[cr][cc].chocolate = true; board[cr][cc].type = -1; board[cr][cc].special = SPECIAL.NONE;
      }
    }
  } else if ((lvl.chocolateCount || 0) > 0) {
    const edgePool = shuffleArray(getAllNonHolePositions(holeSet).filter(([r,c]) => r===0||r===ROWS-1||c===0||c===COLS-1));
    edgePool.slice(0, lvl.chocolateCount).forEach(([r,c]) => {
      if (board[r][c]) { board[r][c].chocolate = true; board[r][c].type = -1; board[r][c].special = SPECIAL.NONE; }
    });
  }
  // Белый шоколад (wchocGrid) + фонтаны (fountainGrid)
  state.fountainGrid = {};
  if (Array.isArray(lvl.wchocGrid)) {
    for (const wc of lvl.wchocGrid) {
      const [wr, wcc, wlayers] = wc;
      if (wr < ROWS && wcc < COLS && board[wr][wcc] && !holeSet.has(`${wr},${wcc}`)) {
        board[wr][wcc].whiteChoc = wlayers || 1;
        board[wr][wcc].type = -1; board[wr][wcc].special = SPECIAL.NONE;
      }
    }
  }
  if (Array.isArray(lvl.fountainGrid)) {
    for (const [fr, fc] of lvl.fountainGrid) {
      if (!state.fountainGrid[fr]) state.fountainGrid[fr] = {};
      state.fountainGrid[fr][fc] = true;
    }
  }
  // Мармелад — точные позиции из marmaGrid, иначе рандом
  if (Array.isArray(lvl.marmaGrid) && lvl.marmaGrid.length > 0) {
    for (const [mr, mc] of lvl.marmaGrid) {
      if (mr < ROWS && mc < COLS && board[mr][mc]?.type >= 0) board[mr][mc].marmalade = true;
    }
  } else if ((lvl.marmaladeCount || 0) > 0) {
    const freePool = shuffleArray(getAllNonHolePositions(holeSet).filter(([r,c]) => board[r][c]?.type >= 0));
    freePool.slice(0, lvl.marmaladeCount).forEach(([r,c]) => { board[r][c].marmalade = true; });
  }
  // Замки (жвачка/лакрица) — гем виден, но нельзя свапнуть; снимается матчем рядом
  if ((lvl.lockCount || 0) > 0) {
    const lockPool = shuffleArray(getAllNonHolePositions(holeSet).filter(([r,c]) => {
      const cell = board[r][c];
      return cell?.type >= 0 && !cell.stone && !cell.chocolate && !cell.marmalade;
    }));
    lockPool.slice(0, lvl.lockCount).forEach(([r,c]) => { board[r][c].locked = true; });
  }
  // Мистические контейнеры — иммунны к взрывам, pop при матче рядом → случайная спецфишка
  if ((lvl.mysteryCount || 0) > 0) {
    const mystPool = shuffleArray(getAllNonHolePositions(holeSet).filter(([r,c]) => {
      const cell = board[r][c];
      return cell?.type >= 0 && !cell.stone && !cell.chocolate && !cell.marmalade && !cell.locked;
    }));
    mystPool.slice(0, lvl.mysteryCount).forEach(([r,c]) => { board[r][c].mystery = true; board[r][c].special = SPECIAL.NONE; });
  }
  // Лакрица — N слоёв, снимается матчем рядом, BOMB/STRIPE снимает все
  if ((lvl.licoriceCount || 0) > 0) {
    const licPool = shuffleArray(getAllNonHolePositions(holeSet).filter(([r,c]) => {
      const cell = board[r][c];
      return cell?.type >= 0 && !cell.stone && !cell.chocolate && !cell.marmalade && !cell.locked && !cell.mystery;
    }));
    const licLayers = lvl.licoriceCount <= 3 ? 2 : 3;
    licPool.slice(0, lvl.licoriceCount).forEach(([r,c]) => { board[r][c].licorice = licLayers; board[r][c].special = SPECIAL.NONE; });
  }
  state.licoriceSpawnRate = lvl.licoriceSpawnRate || 0;
  state.licoriceMax       = lvl.licoriceMax || 0;
  // Мёд — точные позиции из honeyGrid, иначе рандом
  if (Array.isArray(lvl.honeyGrid) && lvl.honeyGrid.length > 0) {
    for (const pos of lvl.honeyGrid) {
      const hr = pos[0], hc = pos[1], hlayers = pos[2] || 2;
      if (hr < ROWS && hc < COLS && board[hr][hc] && !holeSet.has(`${hr},${hc}`)) {
        board[hr][hc].honey = hlayers; board[hr][hc].special = SPECIAL.NONE;
      }
    }
  } else if ((lvl.honeyCount || 0) > 0) {
    const hPool = shuffleArray(getAllNonHolePositions(holeSet).filter(([r,c]) => {
      const cell = board[r][c];
      return cell?.type >= 0 && !cell.stone && !cell.chocolate && !cell.marmalade && !cell.locked && !cell.mystery && !cell.licorice;
    }));
    const honeyLayers = lvl.honeyCount <= 3 ? 2 : 3;
    hPool.slice(0, lvl.honeyCount).forEach(([r,c]) => { board[r][c].honey = honeyLayers; board[r][c].special = SPECIAL.NONE; });
  }
  // Цепи — точные позиции из chainGrid
  if (Array.isArray(lvl.chainGrid) && lvl.chainGrid.length > 0) {
    for (const [cr, cc, layers] of lvl.chainGrid) {
      if (cr < ROWS && cc < COLS && board[cr][cc]?.type >= 0 && !holeSet.has(`${cr},${cc}`)) {
        board[cr][cc].chain = layers || 1; board[cr][cc].special = SPECIAL.NONE;
      }
    }
  }
  // Лёд — точные позиции из iceGrid, иначе рандом
  if (Array.isArray(lvl.iceGrid) && lvl.iceGrid.length > 0) {
    for (const [ir, ic] of lvl.iceGrid) {
      if (ir < ROWS && ic < COLS && !holeSet.has(`${ir},${ic}`)) state.iceGrid[ir][ic] = 1;
    }
  } else if ((lvl.iceCount || 0) > 0) {
    shuffleArray(getAllNonHolePositions(holeSet).filter(([r,c]) => board[r][c]?.type >= 0 && !board[r][c].marmalade)).slice(0, lvl.iceCount).forEach(([r,c]) => {
      state.iceGrid[r][c] = 1;
    });
  }
  // Frosting Ice (codes 550-555 → 1-6 layers, direct match only)
  if (Array.isArray(lvl.frostGrid) && lvl.frostGrid.length > 0) {
    for (const [fr, fc, flayers] of lvl.frostGrid) {
      if (fr < ROWS && fc < COLS && !holeSet.has(`${fr},${fc}`)) state.frostGrid[fr][fc] = Math.max(1, Math.min(6, flayers||1));
    }
  }
  // Камни — предпочитаем внутреннюю зону, но если там дыры — берём любые свободные клетки
  const innerPool = getAllNonHolePositions(holeSet).filter(([r,c]) => r>1&&r<ROWS-2&&c>1&&c<COLS-2 && !board[r][c]?.chocolate);
  const outerPool = getAllNonHolePositions(holeSet).filter(([r,c]) => !(r>1&&r<ROWS-2&&c>1&&c<COLS-2) && !board[r][c]?.chocolate);
  const stonePool = shuffleArray([...innerPool, ...outerPool]);
  stonePool.slice(0, lvl.stoneCount).forEach(([r,c]) => {
    if (board[r][c]) { board[r][c].stone = true; board[r][c].type = -1; }
  });
  // Бутылки (soda) — нижние строки, с фолбэком на нижнюю половину
  if (lvl.type === 'soda' && (lvl.bottleCount || 0) > 0) {
    state.sodaLevel = Math.min(2, Math.floor(lvl.bottleCount / 2) + 1); // старт: 2+ строки соды
    const sodaStart = ROWS - state.sodaLevel;
    // Бутылка должна иметь хотя бы одного достижимого соседа
    const _btlReach = ([r,c]) => [[-1,0],[1,0],[0,-1],[0,1]].some(([dr,dc]) => {
      const nr=r+dr, nc=c+dc;
      return nr>=0 && nr<ROWS && nc>=0 && nc<COLS && !holeSet.has(`${nr},${nc}`);
    });
    let bottlePool = shuffleArray(getAllNonHolePositions(holeSet).filter(([r,c]) => {
      return r >= sodaStart && board[r][c]?.type >= 0 && !board[r][c].stone && _btlReach([r,c]);
    }));
    // Если в сода-зоне не хватает мест — расширяем на нижнюю половину
    if (bottlePool.length < lvl.bottleCount) {
      bottlePool = shuffleArray(getAllNonHolePositions(holeSet).filter(([r,c]) => {
        return r >= Math.floor(ROWS / 2) && board[r][c]?.type >= 0 && !board[r][c].stone && _btlReach([r,c]);
      }));
    }
    bottlePool.slice(0, lvl.bottleCount).forEach(([r,c]) => {
      board[r][c].bottle = true; board[r][c].special = SPECIAL.NONE;
    });
  }
  // Порталы — overlay на клетке, соединяет пары позиций
  if (Array.isArray(lvl.portals) && lvl.portals.length > 0) {
    const _portalColors = ['#00d4ff','#ff7700','#bb44ff','#44ff88'];
    lvl.portals.forEach(([r1,c1,r2,c2], idx) => {
      if (r1<0||r1>=ROWS||c1<0||c1>=COLS||r2<0||r2>=ROWS||c2<0||c2>=COLS) return;
      if (holeSet.has(`${r1},${c1}`) || holeSet.has(`${r2},${c2}`)) return;
      const col = _portalColors[idx % _portalColors.length];
      state.portalGrid[r1][c1] = {id: idx, exitR: r2, exitC: c2, color: col};
      state.portalGrid[r2][c2] = {id: idx, exitR: r1, exitC: c1, color: col};
    });
  }
  // Portal tubes — physical path between portal pairs
  state.portalTubeMap = {};
  if (Array.isArray(lvl.portalTubes) && lvl.portalTubes.length > 0) {
    for (const [a_r, a_c, b_r, b_c, segs] of lvl.portalTubes) {
      const portal = state.portalGrid[a_r]?.[a_c];
      if (!portal) continue;
      const key = Math.min(a_r*COLS+a_c, b_r*COLS+b_c)+','+Math.max(a_r*COLS+a_c, b_r*COLS+b_c);
      state.portalTubeMap[key] = { color: portal.color, segs };
    }
  }
  // Валидация: если уровень требует камни/лёд но их нет на доске — автофикс
  if (lvl.type==='stone' && lvl.stoneCount>0) {
    let actual=0; for(let r=0;r<ROWS;r++) for(let c=0;c<COLS;c++) if(board[r]?.[c]?.stone) actual++;
    if (actual < lvl.stoneCount) console.warn(`[Lvl ${lvl.level}] Камней расставлено ${actual} из ${lvl.stoneCount}`);
  }
  return board;
}

function getAllPositions() {
  const p = [];
  for (let r=0;r<ROWS;r++) for (let c=0;c<COLS;c++) p.push([r,c]);
  return p;
}

function getAllNonHolePositions(holeSet) {
  const h = holeSet || state.holes;
  const p = [];
  for (let r=0;r<ROWS;r++) for (let c=0;c<COLS;c++) if (!h.has(`${r},${c}`)) p.push([r,c]);
  return p;
}

function countJellyRemaining() {
  let n = 0;
  for (let r=0;r<ROWS;r++) for (let c=0;c<COLS;c++) n += state.jellyGrid[r]?.[c] || 0;
  return n;
}

function clearJellyAt(r, c) {
  if (!state.jellyGrid[r]?.[c]) return;
  state.jellyGrid[r][c]--;
  SFX.jellyPop();
}
function countCarpetRemaining() {
  let n=0;
  for (let r=0;r<ROWS;r++) for (let c=0;c<COLS;c++) if (state.carpetGrid[r]?.[c]) n++;
  return n;
}
// spread=true: also paint adjacent carpet cells (for regular matches)
function clearCarpetAt(r, c, spread=false) {
  if (!state.carpetGrid[r]?.[c]) return;
  state.carpetGrid[r][c] = false;
  spawnParticles(r, c, '#c88a30', 3);
  if (spread) {
    for (const [dr,dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
      const nr=r+dr, nc=c+dc;
      if (nr>=0&&nr<ROWS&&nc>=0&&nc<COLS&&state.carpetGrid[nr]?.[nc]) {
        state.carpetGrid[nr][nc]=false;
        spawnParticles(nr,nc,'#c88a30',2);
      }
    }
  }
}
function shuffleArray(a) {
  for (let i=a.length-1;i>0;i--) { const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; }
  return a;
}
function wouldMatch(board, r, c, type) {
  if (c>=2 && board[r][c-1]?.type===type && board[r][c-2]?.type===type) return true;
  if (r>=2 && board[r-1]?.[c]?.type===type && board[r-2]?.[c]?.type===type) return true;
  return false;
}

// Проверяет все 6 вариантов трёхматча вокруг (r,c) — используется при начальной очистке
function wouldMatchFull(board, r, c, type) {
  // горизонталь
  if (c>=2 && board[r][c-1]?.type===type && board[r][c-2]?.type===type) return true;
  if (c>=1 && c<COLS-1 && board[r][c-1]?.type===type && board[r][c+1]?.type===type) return true;
  if (c<COLS-2 && board[r]?.[c+1]?.type===type && board[r]?.[c+2]?.type===type) return true;
  // вертикаль
  if (r>=2 && board[r-1]?.[c]?.type===type && board[r-2]?.[c]?.type===type) return true;
  if (r>=1 && r<ROWS-1 && board[r-1]?.[c]?.type===type && board[r+1]?.[c]?.type===type) return true;
  if (r<ROWS-2 && board[r+1]?.[c]?.type===type && board[r+2]?.[c]?.type===type) return true;
  // 2×2 квадрат — проверяем 4 возможных квадрата, в которых (r,c) — один из углов
  for (const [dr,dc] of [[0,0],[0,-1],[-1,0],[-1,-1]]) {
    const tr=r+dr, tc=c+dc;
    if (tr<0||tr>=ROWS-1||tc<0||tc>=COLS-1) continue;
    const others=[[tr,tc],[tr,tc+1],[tr+1,tc],[tr+1,tc+1]].filter(([cr,cc])=>cr!==r||cc!==c);
    if (others.every(([cr,cc])=>board[cr]?.[cc]?.type===type)) return true;
  }
  return false;
}

// Убирает начальные матчи с доски, перераспределяя гемы без создания цепочек
function clearInitialMatches(board) {
  let iter = 0;
  while (iter++ < 50) {
    const matched = findMatches();
    if (!matched.size) break;
    matched.forEach(key => {
      const [r, c] = key.split(',').map(Number);
      const cell = board[r][c];
      if (!cell || cell.stone || cell.chocolate || cell.type < 0) return;
      let type, attempts = 0;
      do { type = randGem(); attempts++; } while (wouldMatchFull(board, r, c, type) && attempts < 20);
      cell.type = type;
    });
  }
}

// ══════════════════════════════════════════
//  CANVAS
// ══════════════════════════════════════════
let canvas, ctx, pCanvas, pCtx;
let cellSize=50, boardOffX=0, boardOffY=0;
let canvasLogW=0, canvasLogH=0;
let particles = [];
let floatingTexts = [];
let selectedCell = null, dragStartCell = null;
let _boardEntryScale = 1, _boardEntryOffY = 0; // анимация входа поля

function initCanvas() {
  canvas  = document.getElementById('game-canvas');
  ctx     = canvas.getContext('2d');
  pCanvas = document.getElementById('particle-canvas');
  pCtx    = pCanvas.getContext('2d');
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
  window.addEventListener('orientationchange', () => setTimeout(resizeCanvas, 150));
}

// Responsive layout — portrait_narrow/portrait_square/landscape aware
function resizeCanvas() {
  const appEl = document.getElementById('app');
  const W = appEl ? appEl.clientWidth : window.innerWidth;
  const H = window.innerHeight;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  const ratio = W / H;
  const isLandscape = ratio > 1.2;
  const pad = isLandscape ? 8 : 16;

  // Measure actual HUD height; fall back to 110 if HUD not yet laid out
  const hudEl = document.getElementById('hud');
  const hudH = (hudEl && hudEl.offsetHeight > 20) ? hudEl.offsetHeight + 4 : 110;

  // Measure booster bar height; fall back to 72
  const boostEl = document.getElementById('ingame-booster-bar');
  const boostH = (boostEl && boostEl.offsetHeight > 10) ? boostEl.offsetHeight + 4 : 72;

  const csFromW = Math.floor((W - pad * 2) / COLS);
  const csFromH = Math.floor((H - hudH - boostH - pad) / ROWS);
  const csMin = isLandscape ? 32 : 38;
  const csMax = isLandscape ? 90 : 70;
  cellSize = Math.max(csMin, Math.min(csMax, Math.min(csFromW, csFromH)));
  if (window._lastCachedCellSize !== cellSize) {
    if (typeof invalidateGemCache === 'function') invalidateGemCache();
    window._lastCachedCellSize = cellSize;
  }

  const bw = cellSize * COLS, bh = cellSize * ROWS;
  canvasLogW = W; canvasLogH = H;
  canvas.width  = pCanvas.width  = Math.round(W * dpr);
  canvas.height = pCanvas.height = Math.round(H * dpr);
  canvas.style.width  = pCanvas.style.width  = W + 'px';
  canvas.style.height = pCanvas.style.height = H + 'px';
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  pCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

  boardOffX = Math.floor((W - bw) / 2);
  boardOffY = Math.max(hudH, hudH + Math.floor((H - hudH - boostH - bh) / 2));
}

// ══════════════════════════════════════════
//  БИОМЫ — фоновые ландшафты по главам
// ══════════════════════════════════════════
function getBiome(level) {
  const B=[
    {f:1,  t:15, id:'meadow'},   {f:16, t:30, id:'forest'},
    {f:31, t:45, id:'desert'},   {f:46, t:60, id:'clay'},
    {f:61, t:75, id:'roots'},    {f:76, t:90, id:'river'},
    {f:91, t:105,id:'limestone'},{f:106,t:120,id:'malachite'},
    {f:121,t:140,id:'amethyst'}, {f:141,t:160,id:'quartz'},
    {f:161,t:180,id:'gold_vein'},{f:181,t:200,id:'ruby_mine'},
    {f:201,t:220,id:'lava_tubes'},{f:221,t:240,id:'obsidian'},
    {f:241,t:260,id:'ice_cave'}, {f:261,t:280,id:'ruins'},
    {f:281,t:300,id:'vault'},    {f:301,t:320,id:'magma_sea'},
    {f:321,t:340,id:'diamond'},  {f:341,t:360,id:'titanium'},
    {f:361,t:999,id:'earthcore'},
  ];
  return B.find(b=>level>=b.f&&level<=b.t)?.id||'meadow';
}

const BIOME_CONFIG = {
  meadow:    {top:'#1a2a0a',bot:'#0d1a06',boardBg:'rgba(15,25,8,0.72)',   cellA:'rgba(80,120,40,0.18)', cellB:'rgba(255,255,255,0.07)'},
  forest:    {top:'#0d1f0a',bot:'#081508',boardBg:'rgba(8,20,6,0.75)',    cellA:'rgba(40,100,20,0.18)', cellB:'rgba(255,255,255,0.07)'},
  desert:    {top:'#2a1a06',bot:'#1a0e04',boardBg:'rgba(30,18,6,0.72)',   cellA:'rgba(180,120,40,0.16)',cellB:'rgba(255,255,255,0.07)'},
  clay:      {top:'#1e0e06',bot:'#120804',boardBg:'rgba(22,12,5,0.72)',   cellA:'rgba(140,70,30,0.18)', cellB:'rgba(255,255,255,0.07)'},
  roots:     {top:'#150c05',bot:'#0c0803',boardBg:'rgba(18,10,4,0.75)',   cellA:'rgba(100,55,20,0.18)', cellB:'rgba(255,255,255,0.07)'},
  river:     {top:'#081520',bot:'#040e16',boardBg:'rgba(6,14,22,0.75)',   cellA:'rgba(30,80,140,0.18)', cellB:'rgba(255,255,255,0.07)'},
  limestone: {top:'#181818',bot:'#0e0e0e',boardBg:'rgba(18,18,18,0.75)', cellA:'rgba(140,140,120,0.16)',cellB:'rgba(255,255,255,0.07)'},
  malachite: {top:'#0a1e10',bot:'#061208',boardBg:'rgba(8,18,10,0.75)',  cellA:'rgba(30,120,60,0.18)', cellB:'rgba(255,255,255,0.07)'},
  amethyst:  {top:'#160d22',bot:'#0e0816',boardBg:'rgba(18,10,28,0.75)', cellA:'rgba(100,40,160,0.20)',cellB:'rgba(255,255,255,0.07)'},
  quartz:    {top:'#1a1a2a',bot:'#101018',boardBg:'rgba(18,18,28,0.75)', cellA:'rgba(120,120,200,0.18)',cellB:'rgba(255,255,255,0.07)'},
  gold_vein: {top:'#1e1600',bot:'#140f00',boardBg:'rgba(22,16,2,0.75)',  cellA:'rgba(180,140,20,0.20)',cellB:'rgba(255,255,255,0.07)'},
  ruby_mine: {top:'#200808',bot:'#150404',boardBg:'rgba(22,8,8,0.75)',   cellA:'rgba(160,30,30,0.20)', cellB:'rgba(255,255,255,0.07)'},
  lava_tubes:{top:'#1e0a00',bot:'#120600',boardBg:'rgba(20,6,0,0.80)',   cellA:'rgba(180,60,10,0.22)', cellB:'rgba(255,255,255,0.07)'},
  obsidian:  {top:'#080808',bot:'#040404',boardBg:'rgba(6,6,8,0.85)',    cellA:'rgba(60,30,90,0.22)',  cellB:'rgba(255,255,255,0.07)'},
  ice_cave:  {top:'#0a1820',bot:'#060e16',boardBg:'rgba(8,16,24,0.75)',  cellA:'rgba(80,160,200,0.18)',cellB:'rgba(255,255,255,0.07)'},
  ruins:     {top:'#121008',bot:'#0c0a04',boardBg:'rgba(14,12,6,0.78)',  cellA:'rgba(100,90,50,0.18)', cellB:'rgba(255,255,255,0.07)'},
  vault:     {top:'#0c0c0c',bot:'#080808',boardBg:'rgba(10,10,12,0.85)', cellA:'rgba(80,80,100,0.20)', cellB:'rgba(255,255,255,0.07)'},
  magma_sea: {top:'#200800',bot:'#180400',boardBg:'rgba(22,4,0,0.85)',   cellA:'rgba(200,60,10,0.25)', cellB:'rgba(255,255,255,0.07)'},
  diamond:   {top:'#080e18',bot:'#040a10',boardBg:'rgba(6,10,20,0.80)',  cellA:'rgba(100,180,220,0.20)',cellB:'rgba(255,255,255,0.07)'},
  titanium:  {top:'#101010',bot:'#080808',boardBg:'rgba(10,10,12,0.85)', cellA:'rgba(120,130,140,0.20)',cellB:'rgba(255,255,255,0.07)'},
  earthcore: {top:'#1a0400',bot:'#120200',boardBg:'rgba(18,2,0,0.90)',   cellA:'rgba(220,80,20,0.28)', cellB:'rgba(255,255,255,0.07)'},
};

function drawBiomeBG(biome, cfg) {
  const W=canvasLogW, H=canvasLogH;
  const grd=ctx.createLinearGradient(0,0,0,H);
  grd.addColorStop(0,cfg.top); grd.addColorStop(1,cfg.bot);
  ctx.save();
  ctx.fillStyle=grd; ctx.fillRect(0,0,W,H);
  ctx.restore();
  if      (biome==='meadow'||biome==='forest')                             _biomeMeadow(cfg,biome);
  else if (biome==='amethyst'||biome==='quartz')                           _biomeAmethyst(cfg);
  else if (biome==='lava_tubes'||biome==='magma_sea'||biome==='earthcore') _biomeLava(cfg);
  else if (biome==='gold_vein')                                            _biomeGold(cfg);
  else if (biome==='ice_cave')                                             _biomeIce(cfg);
  else if (biome==='obsidian'||biome==='vault')                            _biomeObsidian(cfg);
}

function _biomeMeadow(cfg, biome) {
  const W=canvasLogW, H=canvasLogH, t=Date.now()/1000;
  ctx.save();
  const cloudColor = biome==='forest' ? 'rgba(40,80,20,0.12)' : 'rgba(255,255,255,0.10)';
  ctx.fillStyle = cloudColor;
  for (let i=0;i<4;i++) {
    const cx = (W*0.15 + W*0.22*i + t*12*(i%2===0?1:-0.6))%(W+120)-60;
    const cy = H*0.08 + H*0.04*Math.sin(t*0.4+i);
    const r  = W*0.07+W*0.03*i;
    ctx.beginPath(); ctx.ellipse(cx,cy,r,r*0.4,0,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(cx+r*0.5,cy+r*0.1,r*0.65,r*0.35,0,0,Math.PI*2); ctx.fill();
  }
  ctx.fillStyle = biome==='forest' ? 'rgba(20,80,10,0.30)' : 'rgba(60,120,20,0.25)';
  ctx.fillRect(0, H*0.88, W, H*0.12);
  ctx.restore();
}

function _biomeAmethyst(cfg) {
  const W=canvasLogW, H=canvasLogH, t=Date.now()/1000;
  ctx.save();
  const color='rgba(140,60,200,0.55)', hilight='rgba(200,140,255,0.55)', n=10;
  for (let i=0;i<n;i++) {
    const x=W*(i+0.5)/n + Math.sin(t*0.3+i)*4;
    const h=H*(0.08+0.06*((i*7)%5/5));
    const w=W*0.04;
    ctx.fillStyle=color;
    ctx.beginPath(); ctx.moveTo(x-w,0); ctx.lineTo(x+w,0); ctx.lineTo(x,h); ctx.closePath(); ctx.fill();
    ctx.fillStyle=hilight;
    ctx.beginPath(); ctx.moveTo(x-w*0.3,0); ctx.lineTo(x,h*0.6); ctx.lineTo(x+w*0.1,0); ctx.closePath(); ctx.fill();
  }
  for (let i=0;i<n-1;i++) {
    const x=W*(i+1)/n, h=H*(0.06+0.04*((i*5)%4/4)), w=W*0.035;
    ctx.fillStyle=color;
    ctx.beginPath(); ctx.moveTo(x-w,H); ctx.lineTo(x+w,H); ctx.lineTo(x,H-h); ctx.closePath(); ctx.fill();
  }
  const grd=ctx.createRadialGradient(W/2,H,0,W/2,H,H*0.5);
  grd.addColorStop(0,'rgba(120,40,180,0.18)'); grd.addColorStop(1,'rgba(0,0,0,0)');
  ctx.fillStyle=grd; ctx.fillRect(0,0,W,H);
  ctx.restore();
}

function _biomeLava(cfg) {
  const W=canvasLogW, H=canvasLogH, t=Date.now()/1000;
  ctx.save();
  const lh=H*0.22;
  const grd=ctx.createLinearGradient(0,H-lh,0,H);
  grd.addColorStop(0,'rgba(200,60,0,0.0)');
  grd.addColorStop(0.4,'rgba(200,60,0,0.55)');
  grd.addColorStop(1,'rgba(255,120,0,0.80)');
  ctx.fillStyle=grd; ctx.fillRect(0,H-lh,W,lh);
  for (let i=0;i<5;i++) {
    const bx=W*(0.1+0.18*i)+Math.sin(t*0.5+i*2.1)*W*0.04;
    const phase=(t*0.25+i*0.37)%1;
    const by=H-(phase*lh*0.9), br=W*0.014*(0.6+phase*0.4);
    ctx.globalAlpha=Math.min(1,phase*3)*0.7;
    ctx.fillStyle='#ff8800';
    ctx.beginPath(); ctx.arc(bx,by,br,0,Math.PI*2); ctx.fill();
  }
  ctx.globalAlpha=1;
  for (let i=0;i<6;i++) {
    const ex=W*(0.05+0.16*i)+Math.sin(t*0.8+i*1.7)*W*0.06;
    const ey=H-(((t*0.15+i*0.3)%1)*H*0.7);
    ctx.globalAlpha=0.6*(1-((t*0.15+i*0.3)%1));
    ctx.fillStyle='#ffcc44';
    ctx.beginPath(); ctx.arc(ex,ey,W*0.007,0,Math.PI*2); ctx.fill();
  }
  ctx.globalAlpha=1;
  ctx.restore();
}

function _biomeGold(cfg) {
  const W=canvasLogW, H=canvasLogH, t=Date.now()/1000;
  ctx.save();
  const streaks=[{x:W*0.15,a:-0.8},{x:W*0.38,a:-0.6},{x:W*0.62,a:-0.9},{x:W*0.80,a:-0.7}];
  for (const s of streaks) {
    const shimmer=0.3+0.15*Math.sin(t*1.2+s.x);
    ctx.strokeStyle=`rgba(220,180,50,${shimmer})`; ctx.lineWidth=3;
    ctx.beginPath(); ctx.moveTo(s.x,0); ctx.lineTo(s.x+H*Math.tan(s.a),H); ctx.stroke();
    ctx.strokeStyle=`rgba(255,240,100,${shimmer*0.6})`; ctx.lineWidth=1;
    ctx.beginPath(); ctx.moveTo(s.x+2,0); ctx.lineTo(s.x+2+H*Math.tan(s.a),H); ctx.stroke();
  }
  ctx.restore();
}

function _biomeIce(cfg) {
  const W=canvasLogW, H=canvasLogH, t=Date.now()/1000;
  ctx.save();
  const n=12;
  for (let i=0;i<n;i++) {
    const x=W*(i+0.5)/n, h=H*(0.06+0.05*((i*7)%6/6)), w=W*0.032;
    ctx.globalAlpha=0.45+0.15*Math.sin(t*0.5+i*0.8);
    ctx.fillStyle='rgba(140,200,240,0.8)';
    ctx.beginPath(); ctx.moveTo(x-w,0); ctx.lineTo(x+w,0); ctx.lineTo(x,h); ctx.closePath(); ctx.fill();
    ctx.fillStyle='rgba(220,240,255,0.7)';
    ctx.beginPath(); ctx.moveTo(x-w*0.2,0); ctx.lineTo(x,h*0.5); ctx.lineTo(x+w*0.15,0); ctx.closePath(); ctx.fill();
  }
  ctx.globalAlpha=1;
  const grd=ctx.createLinearGradient(0,0,0,H*0.3);
  grd.addColorStop(0,'rgba(80,160,220,0.20)'); grd.addColorStop(1,'rgba(0,0,0,0)');
  ctx.fillStyle=grd; ctx.fillRect(0,0,W,H*0.3);
  ctx.restore();
}

function _biomeObsidian(cfg) {
  const W=canvasLogW, H=canvasLogH, t=Date.now()/1000;
  ctx.save();
  const pulse=0.4+0.25*Math.sin(t*1.5);
  ctx.strokeStyle=`rgba(180,20,0,${pulse})`; ctx.lineWidth=1.5;
  const cracks=[
    [[0.3,0.2],[0.45,0.5],[0.35,0.8]],
    [[0.7,0.1],[0.6,0.4],[0.75,0.7],[0.65,0.9]],
    [[0.1,0.5],[0.3,0.55],[0.5,0.5]],
    [[0.5,0.3],[0.6,0.55],[0.55,0.75]],
  ];
  for (const crack of cracks) {
    ctx.beginPath(); ctx.moveTo(crack[0][0]*W,crack[0][1]*H);
    for (let i=1;i<crack.length;i++) ctx.lineTo(crack[i][0]*W,crack[i][1]*H);
    ctx.stroke();
  }
  ctx.strokeStyle=`rgba(255,60,0,${pulse*0.4})`; ctx.lineWidth=4; ctx.filter='blur(3px)';
  for (const crack of cracks) {
    ctx.beginPath(); ctx.moveTo(crack[0][0]*W,crack[0][1]*H);
    for (let i=1;i<crack.length;i++) ctx.lineTo(crack[i][0]*W,crack[i][1]*H);
    ctx.stroke();
  }
  ctx.filter='none';
  ctx.restore();
}

