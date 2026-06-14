// ══════════════════════════════════════════
//  СИМУЛЯТОР БАЛАНСА (TASK-01)
// ══════════════════════════════════════════

// Все допустимые ходы на текущем state (публичная)
function findAllMoves() {
  const moves = [];
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    if (!canSwap(r, c)) continue;
    for (const [dr, dc] of [[0,1],[1,0]]) {
      const nr = r+dr, nc = c+dc;
      if (nr >= ROWS || nc >= COLS) continue;
      if (!canSwap(nr, nc)) continue;
      doSwap(r, c, nr, nc);
      const m = findMatches().size;
      doSwap(r, c, nr, nc);
      if (m > 0) moves.push([r, c, nr, nc]);
    }
  }
  return moves;
}

function _simWouldMatch(board, r, c, type) {
  if (c >= 2 && board[r][c-1]?.type === type && board[r][c-2]?.type === type) return true;
  if (r >= 2 && board[r-1]?.[c]?.type === type && board[r-2]?.[c]?.type === type) return true;
  return false;
}

function _simInitBoard(lvl) {
  const gemTypes = lvl.gemTypes || GEM_TYPES;
  const holeSet = new Set((lvl.holes || []).map(([r,c]) => `${r},${c}`));
  const board = [];
  for (let r = 0; r < ROWS; r++) {
    board[r] = [];
    for (let c = 0; c < COLS; c++) {
      if (holeSet.has(`${r},${c}`)) { board[r][c] = null; continue; }
      let type;
      do { type = Math.floor(Math.random() * gemTypes); } while (_simWouldMatch(board, r, c, type));
      board[r][c] = { type, special: 0, stone: false, lava: false, web: false, bucket: false };
    }
  }
  const iceGrid   = Array.from({length: ROWS}, () => new Array(COLS).fill(0));
  const dirtGrid = Array.from({length: ROWS}, () => new Array(COLS).fill(0));
  const nonHoles  = [];
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (!holeSet.has(`${r},${c}`)) nonHoles.push([r,c]);
  const rnd = a => a.sort(() => Math.random() - 0.5);
  let iceC = 0;
  for (const [r,c] of rnd([...nonHoles])) {
    if (iceC >= (lvl.iceCount || 0)) break;
    if (board[r][c]?.type >= 0 && !board[r][c].web) { iceGrid[r][c] = 1; iceC++; }
  }
  let jelC = 0;
  for (const [r,c] of rnd([...nonHoles])) {
    if (jelC >= (lvl.dirtCount || 0)) break;
    dirtGrid[r][c] = 2; jelC++;
  }
  const inner = nonHoles.filter(([r,c]) => r>1&&r<ROWS-2&&c>1&&c<COLS-2);
  const outer  = nonHoles.filter(([r,c]) => !(r>1&&r<ROWS-2&&c>1&&c<COLS-2));
  let stC = 0;
  for (const [r,c] of rnd([...inner, ...outer])) {
    if (stC >= (lvl.stoneCount || 0)) break;
    if (board[r][c] && !board[r][c].lava) { board[r][c].stone = true; board[r][c].type = -1; stC++; }
  }
  const edges = nonHoles.filter(([r,c]) => r===0||r===ROWS-1||c===0||c===COLS-1);
  let chC = 0;
  for (const [r,c] of rnd([...edges])) {
    if (chC >= (lvl.lavaCount || 0)) break;
    if (board[r][c]) { board[r][c].lava = true; board[r][c].type = -1; chC++; }
  }
  const freeGems = nonHoles.filter(([r,c]) => board[r][c]?.type >= 0);
  let marC = 0;
  for (const [r,c] of rnd([...freeGems])) {
    if (marC >= (lvl.webCount || 0)) break;
    board[r][c].web = true; marC++;
  }
  const topRows = nonHoles.filter(([r]) => r < 2);
  let ingC = 0;
  for (const [r,c] of rnd([...topRows])) {
    if (ingC >= (lvl.bucketCount || 0)) break;
    board[r][c] = { type: -2, special: 0, stone: false, lava: false, web: false, bucket: true };
    ingC++;
  }
  const bricksGrid = Array.from({length: ROWS}, () => new Array(COLS).fill(false));
  if (lvl.type === 'bricks') {
    for (let r=0;r<ROWS;r++) for (let c=0;c<COLS;c++) if (!holeSet.has(`${r},${c}`)) bricksGrid[r][c]=true;
  }
  return {
    board, holes: holeSet, iceGrid, dirtGrid, bricksGrid,
    portalGrid: null, portalTubeMap: {},
    score: 0, moves: lvl.moves, comboCount: 0,
    collectedGems: {}, iceBroken: 0, stonesBroken: 0,
    bucketsDelivered: 0, lavaInitial: lvl.lavaCount || 0,
    dirtTotal: lvl.dirtCount || 0,
    bricksTotal: lvl.type==='bricks' ? nonHoles.length : 0,
  };
}

function _simFindMatches(board) {
  const matched = new Set();
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS-2; c++) {
    const tt = board[r][c]?.type;
    if (tt === undefined || tt < 0 || board[r][c]?.stone) continue;
    if (board[r][c+1]?.type === tt && board[r][c+2]?.type === tt) {
      let len = 3; while (c+len < COLS && board[r][c+len]?.type === tt) len++;
      for (let k = 0; k < len; k++) matched.add(`${r},${c+k}`);
    }
  }
  for (let c = 0; c < COLS; c++) for (let r = 0; r < ROWS-2; r++) {
    const tt = board[r][c]?.type;
    if (tt === undefined || tt < 0 || board[r][c]?.stone) continue;
    if (board[r+1]?.[c]?.type === tt && board[r+2]?.[c]?.type === tt) {
      let len = 3; while (r+len < ROWS && board[r+len]?.[c]?.type === tt) len++;
      for (let k = 0; k < len; k++) matched.add(`${r+k},${c}`);
    }
  }
  // 2×2 squares
  for (let r=0;r<ROWS-1;r++) for (let c=0;c<COLS-1;c++) {
    const tt=board[r][c]?.type;
    if (tt===undefined||tt<0||board[r][c]?.stone||board[r][c]?.lava) continue;
    if (board[r][c+1]?.type===tt&&board[r+1]?.[c]?.type===tt&&board[r+1]?.[c+1]?.type===tt&&
        !board[r][c+1]?.stone&&!board[r+1]?.[c]?.stone&&!board[r+1]?.[c+1]?.stone) {
      matched.add(`${r},${c}`); matched.add(`${r},${c+1}`);
      matched.add(`${r+1},${c}`); matched.add(`${r+1},${c+1}`);
    }
  }
  return matched;
}

function _simCanSwap(r, c, board, holes, iceGrid) {
  if (holes.has(`${r},${c}`)) return false;
  if ((iceGrid[r]?.[c] || 0) > 0) return false;
  const cl = board[r]?.[c];
  if (!cl) return false;
  if (cl.stone || cl.lava || cl.web || cl.bucket || cl.locked || cl.mystery || cl.flask || (cl.sand>0) || (cl.amber>0)) return false;
  return true;
}

function _simFindAllMoves(board, holes, iceGrid) {
  const moves = [];
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    if (!_simCanSwap(r, c, board, holes, iceGrid)) continue;
    for (const [dr, dc] of [[0,1],[1,0]]) {
      const nr = r+dr, nc = c+dc;
      if (nr >= ROWS || nc >= COLS) continue;
      if (!_simCanSwap(nr, nc, board, holes, iceGrid)) continue;
      const t = board[r][c]; board[r][c] = board[nr][nc]; board[nr][nc] = t;
      const m = _simFindMatches(board).size;
      board[nr][nc] = board[r][c]; board[r][c] = t;
      if (m > 0) moves.push([r, c, nr, nc]);
    }
  }
  return moves;
}

function _simApplyGravity(simState) {
  const { board, holes } = simState;
  for (let c = 0; c < COLS; c++) {
    let wr = ROWS - 1;
    for (let r = ROWS-1; r >= 0; r--) {
      if (holes.has(`${r},${c}`)) { wr = r - 1; continue; }
      const cell = board[r][c];
      if (cell !== null) {
        if (cell.stone || cell.lava) { wr = r - 1; continue; }
        if (cell.bucket && wr === ROWS-1 && r === ROWS-1) {
          simState.bucketsDelivered++; board[r][c] = null; wr--; continue;
        }
        const fallDist = wr - r;
        board[wr][c] = cell;
        if (fallDist > 0) {
          board[r][c] = null;
          if (cell.bucket && wr === ROWS-1) { simState.bucketsDelivered++; board[wr][c] = null; wr++; }
        }
        wr--;
      }
    }
    for (let r = wr; r >= 0; r--) { if (!holes.has(`${r},${c}`)) board[r][c] = null; }
  }
}

function _simFillFromTop(board, holes, gemTypes) {
  for (let c = 0; c < COLS; c++) {
    for (let r = 0; r < ROWS; r++) {
      if (holes.has(`${r},${c}`)) continue;
      const cell = board[r][c];
      if (cell && (cell.stone || cell.lava)) continue;
      if (cell === null) board[r][c] = { type: Math.floor(Math.random() * gemTypes), special: 0, stone: false, lava: false, web: false, bucket: false };
    }
  }
}

function _simCheckWin(simState, lvl) {
  switch (lvl.type) {
    case 'score':       return simState.score >= lvl.target;
    case 'collect':     { let t = 0; lvl.gems.forEach(g => t += simState.collectedGems[g] || 0); return t >= lvl.target; }
    case 'ice':         return simState.iceBroken >= lvl.target;
    case 'stone':       return simState.stonesBroken >= lvl.target;
    case 'dirt':       { for (let r=0;r<ROWS;r++) for (let c=0;c<COLS;c++) if (simState.dirtGrid[r][c]>0) return false; return true; }
    case 'buckets': return simState.bucketsDelivered >= lvl.target;
    case 'lava':   { for (let r=0;r<ROWS;r++) for (let c=0;c<COLS;c++) if (simState.board[r][c]?.lava) return false; return true; }
    case 'bricks':      { for (let r=0;r<ROWS;r++) for (let c=0;c<COLS;c++) if (simState.bricksGrid?.[r]?.[c]) return false; return true; }
  }
  return false;
}

function _simProcessMatches(simState, lvl) {
  const gemTypes = lvl.gemTypes || GEM_TYPES;
  while (true) {
    const matched = _simFindMatches(simState.board);
    if (!matched.size) break;
    simState.comboCount++;
    simState.score += matched.size * 30 * simState.comboCount;
    for (const key of matched) {
      const [r, c] = key.split(',').map(Number);
      const cell = simState.board[r][c];
      if (!cell || cell.bucket) continue;
      if (simState.iceGrid[r]?.[c]) { simState.iceGrid[r][c] = 0; simState.iceBroken++; }
      if (simState.dirtGrid[r]?.[c] > 0) simState.dirtGrid[r][c]--;
      if (simState.bricksGrid?.[r]?.[c]) { simState.bricksGrid[r][c]=false; for(const[dr,dc]of[[-1,0],[1,0],[0,-1],[0,1]]){const nr=r+dr,nc=c+dc;if(nr>=0&&nr<ROWS&&nc>=0&&nc<COLS&&simState.bricksGrid[nr]?.[nc])simState.bricksGrid[nr][nc]=false;} }
      if (cell.type >= 0) simState.collectedGems[cell.type] = (simState.collectedGems[cell.type] || 0) + 1;
      simState.board[r][c] = null;
    }
    for (const key of matched) {
      const [r, c] = key.split(',').map(Number);
      for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
        const nr = r+dr, nc = c+dc;
        if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) continue;
        const nb = simState.board[nr]?.[nc];
        if (!nb) continue;
        if (nb.stone)     { nb.stone     = false; nb.type = Math.floor(Math.random() * gemTypes); simState.stonesBroken++; }
        if (nb.lava) { nb.lava = false; nb.type = Math.floor(Math.random() * gemTypes); }
        if (nb.web) nb.web = false;
      }
    }
    _simApplyGravity(simState);
    _simFillFromTop(simState.board, simState.holes, gemTypes);
  }
}

// Жадный выбор хода: предпочитает ход, дающий наибольшее покрытие целевых клеток.
// 35% времени — случайный выбор (разнообразие).
function _simPickBestMove(sim, moves, lvl) {
  if (Math.random() < 0.35) return moves[Math.floor(Math.random() * moves.length)];
  let best = null, bestScore = -1;
  for (const mv of moves) {
    const [r, c, nr, nc] = mv;
    const tmp = sim.board[r][c]; sim.board[r][c] = sim.board[nr][nc]; sim.board[nr][nc] = tmp;
    const matched = _simFindMatches(sim.board);
    let score = matched.size;
    for (const key of matched) {
      const [mr, mc] = key.split(',').map(Number);
      if (sim.iceGrid[mr]?.[mc])       score += 3; // бьём по льду
      if (sim.dirtGrid[mr]?.[mc] > 0) score += 2; // убираем желе
      if (sim.bricksGrid?.[mr]?.[mc])  score += 2; // красим ковёр
      const cell = sim.board[mr]?.[mc];
      if (cell?.stone)     score += 2;
      if (cell?.lava) score += 2;
    }
    if (score > bestScore) { bestScore = score; best = mv; }
    sim.board[nr][nc] = sim.board[r][c]; sim.board[r][c] = tmp;
  }
  return best || moves[0];
}

// Основная функция симуляции — принимает объект уровня (не индекс).
function simulateLevelObj(lvl, trials = 150) {
  if (!lvl) return null;
  const wins = [], movesArr = [], scoresArr = [];
  for (let t = 0; t < trials; t++) {
    const sim = _simInitBoard(lvl);
    let won = false;
    while (sim.moves > 0) {
      const moves = _simFindAllMoves(sim.board, sim.holes, sim.iceGrid);
      if (!moves.length) break;
      const [r, c, nr, nc] = _simPickBestMove(sim, moves, lvl);
      const tmp = sim.board[r][c]; sim.board[r][c] = sim.board[nr][nc]; sim.board[nr][nc] = tmp;
      sim.moves--; sim.comboCount = 0;
      _simProcessMatches(sim, lvl);
      if (_simCheckWin(sim, lvl)) { won = true; break; }
    }
    wins.push(won ? 1 : 0);
    movesArr.push(lvl.moves - sim.moves);
    scoresArr.push(sim.score);
  }
  const winRate     = wins.reduce((a,b) => a+b, 0) / trials;
  const avgMovesUsed = movesArr.reduce((a,b) => a+b, 0) / trials;
  const avgScore    = scoresArr.reduce((a,b) => a+b, 0) / trials;
  scoresArr.sort((a,b) => a-b);
  return { winRate, avgMovesUsed, avgScore, medianScore: scoresArr[Math.floor(trials/2)] };
}

// Обёртка по индексу (обратная совместимость с dev-панелью).
function simulateLevel(levelIndex, trials = 150) {
  return simulateLevelObj(LEVELS[levelIndex], trials);
}

function runBalanceReport() {
  console.log('▶ Запуск симуляции баланса...');
  const t0 = performance.now();
  console.log('═'.repeat(80));
  console.log('Ур-нь | Тип          | winRate | avgMoves | Rev | вердикт');
  console.log('─'.repeat(80));
  for (let i = 0; i < LEVELS.length; i++) {
    const lvl = LEVELS[i];
    const r = simulateLevelObj(lvl, 100);
    const verdict =
      r.winRate < 0.15 ? '🔴 сложный'    :
      r.winRate < 0.30 ? '🟡 сложноват'  :
      r.winRate < 0.70 ? '🟢 норм'       :
      r.winRate < 0.85 ? '🔵 легко'      : '⚪ тривиальный';
    console.log(
      `L${String(lvl.level).padStart(3)}  | ${(lvl.type+'            ').slice(0,12)} | ` +
      `${(r.winRate*100).toFixed(1).padStart(5)}%  | ${r.avgMovesUsed.toFixed(1).padStart(8)} | ` +
      `r${String(lvl.revision||0).padStart(2)} | ${verdict}`
    );
  }
  console.log('═'.repeat(68));
  console.log(`Завершено за ${((performance.now()-t0)/1000).toFixed(1)} сек`);
}

function autoBalanceLevels() {
  const patches = [];
  for (let i = 0; i < LEVELS.length; i++) {
    const lvl = LEVELS[i];
    const r = simulateLevelObj(lvl, 80);
    // Целевой диапазон winRate зависит от эпизода (ранние — легче, поздние — сложнее)
    const episode = Math.ceil(lvl.level / 16);
    const minWR = episode <= 2 ? 0.35 : episode <= 5 ? 0.22 : 0.12;
    const maxWR = episode <= 2 ? 0.85 : episode <= 5 ? 0.80 : 0.75;

    if (r.winRate < minWR) {
      if (lvl.type === 'score') {
        const old=lvl.target; lvl.target=Math.round(lvl.target*0.82/500)*500; patches.push(`L${lvl.level}: target ${old}→${lvl.target}`);
      } else if (r.winRate < minWR * 0.4 && lvl.moves < 40) {
        const old=lvl.moves; lvl.moves=Math.min(40,old+3); patches.push(`L${lvl.level}: moves ${old}→${lvl.moves} (критично)`);
      } else if (lvl.moves < 40) {
        const old=lvl.moves; lvl.moves=Math.min(40,old+2); patches.push(`L${lvl.level}: moves ${old}→${lvl.moves}`);
      }
    } else if (r.winRate > maxWR) {
      if (lvl.type === 'score') {
        const old=lvl.target; lvl.target=Math.round(lvl.target*1.18/500)*500; patches.push(`L${lvl.level}: target ${old}→${lvl.target}`);
      } else if (lvl.moves > 20) {
        const old=lvl.moves; lvl.moves=Math.max(20,old-2); patches.push(`L${lvl.level}: moves ${old}→${lvl.moves}`);
      }
    }
    lvl.revision = (lvl.revision||0) + 1;
  }
  if (patches.length) { console.log('// AUTO-BALANCE PATCHES:'); patches.forEach(p => console.log('// ' + p)); }
  console.log(`Патчи применены: ${patches.length} уровней скорректировано`);
  return patches;
}

