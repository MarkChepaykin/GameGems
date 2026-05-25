// ══════════════════════════════════════════
//  МАТЧИ
// ══════════════════════════════════════════
function findMatches() {
  const board=state.board, matched=new Set();
  for (let r=0;r<ROWS;r++) for (let c=0;c<COLS-2;c++) {
    const tt=board[r][c]?.type;
    if (tt===undefined||tt<0||board[r][c]?.stone||board[r][c]?.mystery||(board[r][c]?.licorice>0)||(board[r][c]?.honey>0)) continue;
    if (board[r][c+1]?.type===tt&&!board[r][c+1]?.stone&&!board[r][c+1]?.mystery&&!(board[r][c+1]?.licorice>0)&&!(board[r][c+1]?.honey>0)&&
        board[r][c+2]?.type===tt&&!board[r][c+2]?.stone&&!board[r][c+2]?.mystery&&!(board[r][c+2]?.licorice>0)&&!(board[r][c+2]?.honey>0)) {
      let len=3; while(c+len<COLS&&board[r][c+len]?.type===tt&&!board[r][c+len]?.stone&&!board[r][c+len]?.mystery&&!(board[r][c+len]?.licorice>0)&&!(board[r][c+len]?.honey>0)) len++;
      for (let k=0;k<len;k++) matched.add(`${r},${c+k}`);
    }
  }
  for (let c=0;c<COLS;c++) for (let r=0;r<ROWS-2;r++) {
    const tt=board[r][c]?.type;
    if (tt===undefined||tt<0||board[r][c]?.stone||board[r][c]?.mystery||(board[r][c]?.licorice>0)||(board[r][c]?.honey>0)) continue;
    if (board[r+1]?.[c]?.type===tt&&!board[r+1]?.[c]?.stone&&!board[r+1]?.[c]?.mystery&&!(board[r+1]?.[c]?.licorice>0)&&!(board[r+1]?.[c]?.honey>0)&&
        board[r+2]?.[c]?.type===tt&&!board[r+2]?.[c]?.stone&&!board[r+2]?.[c]?.mystery&&!(board[r+2]?.[c]?.licorice>0)&&!(board[r+2]?.[c]?.honey>0)) {
      let len=3; while(r+len<ROWS&&board[r+len]?.[c]?.type===tt&&!board[r+len]?.[c]?.stone&&!board[r+len]?.[c]?.mystery&&!(board[r+len]?.[c]?.licorice>0)&&!(board[r+len]?.[c]?.honey>0)) len++;
      for (let k=0;k<len;k++) matched.add(`${r+k},${c}`);
    }
  }
  // 2×2 squares → ROCKET special
  for (let r=0;r<ROWS-1;r++) for (let c=0;c<COLS-1;c++) {
    const tt=board[r][c]?.type;
    if (tt===undefined||tt<0||board[r][c]?.stone||board[r][c]?.chocolate||board[r][c]?.mystery||(board[r][c]?.licorice>0)||(board[r][c]?.honey>0)) continue;
    if (board[r][c+1]?.type===tt&&board[r+1]?.[c]?.type===tt&&board[r+1]?.[c+1]?.type===tt&&
        !board[r][c+1]?.stone&&!board[r+1]?.[c]?.stone&&!board[r+1]?.[c+1]?.stone&&
        !board[r][c+1]?.mystery&&!board[r+1]?.[c]?.mystery&&!board[r+1]?.[c+1]?.mystery&&
        !(board[r][c+1]?.licorice>0)&&!(board[r+1]?.[c]?.licorice>0)&&!(board[r+1]?.[c+1]?.licorice>0)&&
        !(board[r][c+1]?.honey>0)&&!(board[r+1]?.[c]?.honey>0)&&!(board[r+1]?.[c+1]?.honey>0)) {
      matched.add(`${r},${c}`); matched.add(`${r},${c+1}`);
      matched.add(`${r+1},${c}`); matched.add(`${r+1},${c+1}`);
    }
  }
  return matched;
}

function analyzeMatch(cells) {
  if (!cells.length) return null;
  const n=cells.length;
  // Считаем ячейки по строкам и столбцам
  const rCnt={}, cCnt={};
  for (const {r,c} of cells) { rCnt[r]=(rCnt[r]||0)+1; cCnt[c]=(cCnt[c]||0)+1; }
  const rVals=Object.values(rCnt), cVals=Object.values(cCnt);
  const maxR=Math.max(0,...rVals), maxC=Math.max(0,...cVals);
  const rows=rVals.length, cols=cVals.length;
  // 5+ в ЛЮБОЙ одной строке или столбце → RAINBOW
  // (включая случай, когда 5-в-ряд пересекается с матчем другого направления)
  if (maxR>=5||maxC>=5) return { special:SPECIAL.RAINBOW };
  // 2×2-подпаттерн в небольших матчах (n≤5) → ROCKET
  // Проверяем до BOMB, чтобы 2×2 не тонул в смешанном матче
  if (n<=5) {
    const ps=new Set(cells.map(({r,c})=>`${r},${c}`));
    for (const {r,c} of cells) {
      if (ps.has(`${r},${c+1}`)&&ps.has(`${r+1},${c}`)&&ps.has(`${r+1},${c+1}`)) return {special:SPECIAL.ROCKET};
    }
  }
  // 7+ 2D → COLORING
  if (rows>1&&cols>1&&n>=7) return { special:SPECIAL.COLORING };
  // 4-6 клеток 2D (Г/Т/крест) → BOMB
  if (rows>1&&cols>1&&n>=4) return { special:SPECIAL.BOMB };
  // 4 по прямой → STRIPE
  if (n===4) {
    if (rows===1) return { special:SPECIAL.STRIPE_H };
    if (cols===1) return { special:SPECIAL.STRIPE_V };
  }
  return null;
}

// ══════════════════════════════════════════
//  ОБРАБОТКА МАТЧЕЙ
// ══════════════════════════════════════════
async function processMatches(hintR, hintC) {
  const _myEpoch = _matchEpoch; // захватываем эпоху — если уровень сменится, возвращаемся досрочно
  state.busy = true;
  unlockAchievement('first_match');

  let streakBonus = state.streakDays >= 7 ? 1.1 : 1;
  let firstIter = true;
  let _cascadeWon = false;
  const _prevChocBroken = state.chocolateBrokenThisMove;
  state.chocolateBrokenThisMove = false;
  state.whiteChocBrokenThisMove = false;

  let _loopGuard = 0;
  while (true) {
    if (_matchEpoch !== _myEpoch) return; // уровень сменился — прерываем
    if (++_loopGuard > 25) { console.warn('processMatches: cascade limit hit'); break; }
    const matched=findMatches();
    if (!matched.size) break;

    state.comboCount++;
    state.matchSoundLvl = Math.min(7, (state.matchSoundLvl || 0) + 1);
    SFX.match(state.matchSoundLvl);
    haptic('match');
    const matchSize = matched.size;
    if (matchSize >= 5) addBuffPiece();
    const sizeMult  = matchSize >= 5 ? 2.0 : matchSize === 4 ? 1.5 : 1.0;
    const cascMult  = state.comboCount > 1 ? Math.min(3.0, 1 + (state.comboCount - 1) * 0.3) : 1.0;
    const pts = Math.floor(matchSize * PHYSICS.BASE_SCORE * sizeMult * cascMult * streakBonus);
    state.score += pts;
    // Sidekick charge accumulation
    if (state.sidekick.id) {
      let skCharge = 1; // +1 за матч 3
      if (sizeMult > 1.0) skCharge = 3;          // +3 за спешл (матч 4+)
      if (state.comboCount >= 3) skCharge = 5;   // +5 за каскад 3+
      state.sidekick.charge = Math.min(state.sidekick.maxCharge, state.sidekick.charge + skCharge);
      updateSidekickHUD();
      if (state.sidekick.charge >= state.sidekick.maxCharge) {
        // Небольшая задержка чтобы не прерывать текущую анимацию матча
        setTimeout(activateSidekick, 300);
      }
    }
    if (state.comboCount>1) { showCombo(state.comboCount); updateQuestProgress('combo', 1); }
    if (state.comboCount>=3) unlockAchievement('combo_3');
    if (state.comboCount>=5) unlockAchievement('combo_5');
    // Динамические типы фишек: при длинных комбо добавляем новый тип
    const lvlForCombo=getLevel(state.currentLevel);
    const maxGems=lvlForCombo?.gemTypes||GEM_TYPES;
    if (state.comboCount===7 && _activeGemTypes<maxGems && _activeGemTypes<GEM_TYPES) {
      _activeGemTypes=Math.min(_activeGemTypes+1,GEM_TYPES);
      showToast('🌈 Новый тип фишек!');
    }
    if (state.comboCount===12 && _activeGemTypes<maxGems && _activeGemTypes<GEM_TYPES) {
      _activeGemTypes=Math.min(_activeGemTypes+1,GEM_TYPES);
      showToast('💥 Ещё один тип!');
    }

    const cellsArr=[...matched].map(k=>{ const [r,c]=k.split(',').map(Number); return {r,c}; });
    // Portal propagation: если в матч попал вход портала → добавить выход к уничтожению
    if (state.portalGrid) {
      const _portalExtras=[];
      for (const {r,c} of cellsArr) {
        const _p=state.portalGrid[r]?.[c]; if (!_p) continue;
        const {exitR,exitC}=_p;
        const _ec=state.board[exitR]?.[exitC];
        if (!_ec||_ec.stone||_ec.chocolate||_ec.ingredient) continue;
        if (cellsArr.some(x=>x.r===exitR&&x.c===exitC)) continue;
        _portalExtras.push({r:exitR,c:exitC});
        spawnParticles(exitR,exitC,_p.color,5);
      }
      cellsArr.push(..._portalExtras);
    }
    // Floating score + множитель
    { const c0=cellsArr[Math.floor(cellsArr.length/2)];
      if(c0) {
        const scoreColor = state.comboCount>1 ? '#f59e0b' : sizeMult>1 ? '#22c55e' : '#ffe066';
        spawnFloatingScore(c0.r,c0.c,pts,scoreColor);
        if(sizeMult>1) {
          const multLabel = `×${sizeMult.toFixed(1)}`;
          floatingTexts.push({ x: boardOffX+c0.c*cellSize+cellSize/2+20, y: boardOffY+c0.r*cellSize+cellSize/2-10,
            text: multLabel, life:1, size:13, color:'#4ade80' });
        }
      }
    }

    // Группируем совпавшие ячейки по типу гема, чтобы не смешивать разные цвета при анализе
    const typeMap={};
    for (const {r,c} of cellsArr) {
      const tp=state.board[r]?.[c]?.type; if(tp===undefined||tp<0) continue;
      (typeMap[tp]||(typeMap[tp]=[])).push({r,c});
    }
    const spPriority={[SPECIAL.RAINBOW]:5,[SPECIAL.COLORING]:5,[SPECIAL.BOMB]:4,[SPECIAL.ROCKET]:3,[SPECIAL.STRIPE_H]:2,[SPECIAL.STRIPE_V]:2};
    let specialResult=null, matchType=0, specialGroupCells=cellsArr;
    let bestPri=-1;
    for (const [tp,cells] of Object.entries(typeMap)) {
      const res=analyzeMatch(cells);
      if (res) {
        // CC rule: cascade matches (loopGuard>1) can't create COLORING — downgrade to BOMB
        if (_loopGuard > 1 && res.special === SPECIAL.COLORING) res.special = SPECIAL.BOMB;
        const p=spPriority[res.special]||0; if(p>bestPri){bestPri=p;specialResult=res;matchType=parseInt(tp);specialGroupCells=cells;}
      }
    }
    if (!specialResult && cellsArr.length>0) {
      // нет спешла — берём тип первой ячейки для других нужд
      matchType=state.board[cellsArr[0].r]?.[cellsArr[0].c]?.type??0;
    }
    // Собираем спешлы ДО уничтожения, но тригерим только если новый спешл не создаётся
    const specialsInMatch=[];

    for (const {r,c} of cellsArr) {
      const cell=state.board[r][c]; if (!cell) continue;
      if (cell.ingredient) continue; // ингредиенты не уничтожаются матчем — падают сами
      if (cell.locked) { cell.locked=false; spawnParticles(r,c,'#a78bfa',4); }
      if (cell.bottle) popBottle(r, c); // колба в матче — считаем её как сбитую
      const gem=GEMS[cell.type]; if (gem) { spawnParticles(r,c,getSkinColor(cell.type)); spawnScorePop(r,c,getSkinColor(cell.type)); }
      if (state.iceGrid[r]?.[c]) { state.iceGrid[r][c]--; if(!state.iceGrid[r][c]){SFX.iceBreak();state.iceBroken++;updateQuestProgress('ice',1);} }
      if (state.frostGrid[r]?.[c]) { state.frostGrid[r][c]--; SFX.frostingBreak(); spawnParticles(r,c,'#bae6fd',4); }
      clearJellyAt(r, c);
      clearCarpetAt(r, c, true); // spread to adjacent carpet on regular match
      if (cell.type>=0) state.collectedGems[cell.type]=(state.collectedGems[cell.type]||0)+1;
      if (cell.special!==SPECIAL.NONE) specialsInMatch.push({r,c,special:cell.special,type:cell.type});
    }
    // Соседние блокеры: камни, шоколад, мармелад
    for (const {r,c} of cellsArr) {
      for (const [dr,dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
        const nr=r+dr, nc=c+dc;
        if (nr<0||nr>=ROWS||nc<0||nc>=COLS) continue;
        const nb=state.board[nr][nc];
        if (nb?.stone) { nb.stone=false; nb.type=randGem(); state.stonesBroken++; spawnParticles(nr,nc,'#6b7280'); updateQuestProgress('stones', 1); breakAdjacentChocolate(nr,nc); }
        if (nb?.chocolate) { destroyChocolate(nr, nc); }
        if (nb?.marmalade) { nb.marmalade=false; spawnParticles(nr,nc,'#f97316',4); }
        if (nb?.locked) { nb.locked=false; spawnParticles(nr,nc,'#a78bfa',4); }
        if (nb?.mystery) { popMystery(nr,nc); }
        if (nb?.bottle) { popBottle(nr,nc); }
        if (nb?.licorice > 0) { nb.licorice--; spawnParticles(nr,nc,'#b45309',nb.licorice===0?6:3); if(nb.licorice===0){SFX.licoriceMatch();rings.push({x:boardOffX+nc*cellSize+cellSize/2,y:boardOffY+nr*cellSize+cellSize/2,color:'rgba(180,83,9,0.8)',r:4,maxR:cellSize*1.0,life:1,lw:2});} }
        if (nb?.chain > 0) { nb.chain--; spawnParticles(nr,nc,'#8899aa',nb.chain===0?6:3); if(nb.chain===0){SFX.chainBreak();rings.push({x:boardOffX+nc*cellSize+cellSize/2,y:boardOffY+nr*cellSize+cellSize/2,color:'rgba(100,140,170,0.8)',r:4,maxR:cellSize*1.0,life:1,lw:2});} }
        if (nb?.honey > 0) { nb.honey--; spawnParticles(nr,nc,'#fde68a',3); if(nb.honey===0){SFX.honeyBreak();_releaseBear(nr,nc);} }
        if (nb?.whiteChoc > 0) { nb.whiteChoc--; spawnParticles(nr,nc,'#f5e6ca',4); if(nb.whiteChoc===0){SFX.whiteChocBreak();nb.type=randGem();state.whiteChocBrokenThisMove=true;} }
        if (state.iceGrid[nr]?.[nc]) { state.iceGrid[nr][nc]--; if(!state.iceGrid[nr][nc]){SFX.iceBreak();state.iceBroken++;updateQuestProgress('ice',1);spawnParticles(nr,nc,'#93c5fd',4);} }
        // frost NOT hit by adjacent matches — only direct
      }
    }

    // Захватываем данные бомб ДО null'инга — бомба должна оставаться на доске и упасть
    const _bombsInMatch = specialsInMatch.filter(s => s.special === SPECIAL.BOMB);
    const _othersInMatch = specialsInMatch.filter(s => s.special !== SPECIAL.BOMB);
    const _bombCellSet = new Set(_bombsInMatch.map(({r,c})=>`${r},${c}`));
    const _bombData = _bombsInMatch.map(({r,c}) => ({cell: state.board[r]?.[c], r, c}));
    // Анимируем уничтожение — бомбы исключаем (они остаются видимыми)
    await animateDestroy(cellsArr.filter(({r,c})=>!state.board[r]?.[c]?.ingredient && !_bombCellSet.has(`${r},${c}`)));
    if (_matchEpoch !== _myEpoch) return; // уровень сменился — прерываем
    // Обнуляем ячейки — бомбы НЕ трогаем (они упадут сами)
    for (const {r,c} of cellsArr) { if (!state.board[r]?.[c]?.ingredient && !_bombCellSet.has(`${r},${c}`)) state.board[r][c]=null; }

    let ng=null, ngPlacedR=-1, ngPlacedC=-1;
    if (specialResult) {
      // Создаём новый спешл из матча
      BGM_LAYERS.triggerEGP();
      ng=createGem(matchType);
      ng.special=specialResult.special;
      // RAINBOW не имеет цвета; COLORING сохраняет цвет фишек, из которых создан
      if (ng.special===SPECIAL.RAINBOW) ng.type=-1;
      // Размещаем бонус: предпочитаем позицию свапа, иначе центр группы совпадения
      let placed=false;
      if (firstIter && hintR!==undefined && matched.has(`${hintR},${hintC}`)) {
        state.board[hintR][hintC]=ng; ngPlacedR=hintR; ngPlacedC=hintC; placed=true;
      }
      if (!placed) {
        const srcCells=specialGroupCells;
        const avgR=Math.round(srcCells.reduce((s,{r})=>s+r,0)/srcCells.length);
        const avgC=Math.round(srcCells.reduce((s,{c})=>s+c,0)/srcCells.length);
        let best=null, bestDist=Infinity;
        for (const {r,c} of srcCells) {
          if (!state.board[r][c]) {
            const d=Math.abs(r-avgR)+Math.abs(c-avgC);
            if (d<bestDist) { bestDist=d; best={r,c}; }
          }
        }
        if (best) { state.board[best.r][best.c]=ng; ngPlacedR=best.r; ngPlacedC=best.c; }
      }
    }
    // Спешлы из матча всегда взрываются (даже если создан новый спешл)
    // Бомбы: все первая фаза сразу → гравитация → все вторая фаза сразу
    for (const {r,c,special,type} of _othersInMatch) {
      if (_matchEpoch !== _myEpoch) return;
      // CC cascade rule: COLORING scatter suppressed after first iteration to prevent chain amplification
      if (_loopGuard > 1 && special === SPECIAL.COLORING) continue;
      await triggerSpecial(r,c,special,type);
    }
    if (_bombsInMatch.length) {
      if (_matchEpoch !== _myEpoch) return;
      await Promise.all(_bombData.map(({r,c}) => _bombPhase1(r, c)));
      if (_matchEpoch !== _myEpoch) return;
      applyGravity(); fillFromTop(); await animateDrop();
      if (_matchEpoch !== _myEpoch) return;
      // Дым пока бомба ждёт второго взрыва
      if (!state._inBonusExplosion) {
        for(let _si=0;_si<2;_si++){
          _bombData.forEach(({cell,r:origR,c:origC})=>{
            let _sr=origR,_sc=origC;
            if(cell){for(let rr=0;rr<ROWS;rr++)for(let cc=0;cc<COLS;cc++){if(state.board[rr]?.[cc]===cell){_sr=rr;_sc=cc;}}}
            spawnParticles(_sr,_sc,'#aaaaaa',3);
          });
          await new Promise(res=>setTimeout(res,_d(120)));
          if(_matchEpoch!==_myEpoch)return;
        }
      }
      await Promise.all(_bombData.map(async ({cell, r: origR, c: origC}) => {
        let _br=origR, _bc=origC;
        if(cell){let _found=false;for(let rr=0;rr<ROWS&&!_found;rr++)for(let cc=0;cc<COLS&&!_found;cc++){if(state.board[rr]?.[cc]===cell){_br=rr;_bc=cc;_found=true;}}}
        if(state.board[_br]?.[_bc]) state.board[_br][_bc]=null;
        await _bombBlast3x3(_br, _bc);
      }));
      if (_matchEpoch !== _myEpoch) return;
    }
    if (_matchEpoch !== _myEpoch) return; // уровень сменился — прерываем
    // Если цепные спешлы (RAINBOW/BOMB) потребили только что созданный спешл — возрождаем его
    if (ng && ngPlacedR>=0 && state.board[ngPlacedR]?.[ngPlacedC] !== ng) {
      // Ищем свободную клетку рядом с центром группы матча
      const avgR2=Math.round(specialGroupCells.reduce((s,{r})=>s+r,0)/specialGroupCells.length);
      const avgC2=Math.round(specialGroupCells.reduce((s,{c})=>s+c,0)/specialGroupCells.length);
      let rescuePos=null, rescueDist=Infinity;
      for (let rr=0;rr<ROWS;rr++) for (let cc=0;cc<COLS;cc++) {
        if (state.holes.has(`${rr},${cc}`)) continue;
        const cl=state.board[rr]?.[cc];
        if (cl && !cl.stone && !cl.chocolate && !cl.ingredient && cl.special===SPECIAL.NONE) {
          const d=Math.abs(rr-avgR2)+Math.abs(cc-avgC2);
          if (d<rescueDist) { rescueDist=d; rescuePos={r:rr,c:cc}; }
        }
      }
      if (rescuePos) { state.board[rescuePos.r][rescuePos.c]=ng; }
    }
    // Сбрасываем anim у ng: triggerSpecial мог установить alpha=0 через animateDestroyWave,
    // из-за чего фишка оставалась невидимой (пустая клетка) до следующего drawBoard
    if (ng) ng.anim = {};

    applyGravity(); fillFromTop(); await animateDrop();
    if (_matchEpoch !== _myEpoch) return; // уровень сменился — прерываем
    updateGoalProgress(); updateHUD();

    // Path Mode — проверяем продвижение по дорожке
    { const _pathLvl = getLevel(state.currentLevel);
      if (_pathLvl && _pathLvl.type === 'path' && _pathLvl.pathCells && state.pathProgress !== undefined) {
        const _pathTarget = _pathLvl.pathCells[state.pathProgress];
        if (_pathTarget) {
          const [_ptr, _ptc] = _pathTarget;
          const _nearby = [[_ptr,_ptc],[_ptr-1,_ptc],[_ptr+1,_ptc],[_ptr,_ptc-1],[_ptr,_ptc+1]];
          if (_nearby.some(([_r,_c]) => matched.has(`${_r},${_c}`))) {
            state.pathProgress++;
            updateGoalProgress();
          }
        }
      }
    }

    if (firstIter && state.supersonicActive) {
      const _c0 = [...matched].map(k=>k.split(',').map(Number));
      if (_c0.length) tickSupersonic(_c0[0][0], _c0[0][1]);
    }
    firstIter=false;
    if (checkWin()) { _cascadeWon = true; }
  }

  if (_matchEpoch !== _myEpoch) return; // уровень сменился — прерываем
  state.comboCount=0; state.matchSoundLvl=0; state.matchSequenceStep=0; stopOnFire();
  if (_cascadeWon) { if (!state._inBonusExplosion) { state.busy=false; const _ep=_myEpoch; setTimeout(()=>{ if (_matchEpoch===_ep) showWin(); }, 600); } return; }
  // Финальный sweep — гарантируем отсутствие пустых клеток (баг с дырками после бонусов)
  { let hadEmpty=false;
    for (let r=0;r<ROWS;r++) for (let c=0;c<COLS;c++) {
      if (state.holes.has(`${r},${c}`)) continue;
      const cl=state.board[r]?.[c];
      if (cl===null||cl===undefined) { hadEmpty=true; break; }
    }
    if (hadEmpty) { applyGravity(); fillFromTop(); await animateDrop(); updateGoalProgress(); updateHUD(); }
  }
  if (_matchEpoch !== _myEpoch) return; // уровень сменился — прерываем
  // Тьма (шоколад) распространяется каждый ход если не была уничтожена в этот ход
  if (!state.chocolateBrokenThisMove && !_prevChocBroken && hasChocolate()) spreadChocolate();
  // Белый шоколад: фонтан распространяет каждый ход если не был разрушен в этот ход
  if (!state.whiteChocBrokenThisMove && hasFountain()) spreadWhiteChoc();
  // Авто-перемешивание если нет допустимых ходов
  if (!findBestHint()) {
    let attempts=0;
    while (!findBestHint() && attempts<15) {
      const types=[];const pos=[];
      for (let r=0;r<ROWS;r++) for (let c=0;c<COLS;c++) {
        const cl=state.board[r][c]; if(cl&&!cl.stone&&!cl.chocolate&&cl.type>=0){types.push(cl.type);pos.push([r,c]);}
      }
      if (!types.length) break;
      shuffleArray(types);
      pos.forEach(([r,c],i)=>{ if(state.board[r][c]) state.board[r][c].type=types[i]; });
      attempts++;
    }
    if (attempts>0) {
      showToast('Нет ходов — перемешиваем!');
      await animateShuffleEffect();
      if (_matchEpoch !== _myEpoch) return; // уровень сменился — прерываем
      // Убираем совпадения: несколько проходов пока не чисто
      for (let pass=0; pass<5; pass++) {
        clearInitialMatches(state.board);
        if (!findMatches().size) break;
      }
      drawBoard();
    }
  }
  if (state.moves<=0) {
    state.busy=true;
    clearTimeout(_hintTimer);
    setTimeout(showLose, 400);
    return;
  }
  console.log('[DBG] processMatches normal exit → busy=false');
  state.busy=false;
  _updateUndoBtn();
  resetHintTimer();
}

function hasChocolate() {
  for (let r=0;r<ROWS;r++) for (let c=0;c<COLS;c++) if (state.board[r]?.[c]?.chocolate) return true;
  return false;
}
function countChocolateRemaining() {
  let n=0;
  for (let r=0;r<ROWS;r++) for (let c=0;c<COLS;c++) if (state.board[r]?.[c]?.chocolate) n++;
  return n;
}

function spreadChocolate() {
  const chocCells = [];
  for (let r=0;r<ROWS;r++) for (let c=0;c<COLS;c++) if (state.board[r]?.[c]?.chocolate) chocCells.push([r,c]);
  if (!chocCells.length) return;
  const [cr,cc] = chocCells[Math.floor(Math.random()*chocCells.length)];
  const dirs = shuffleArray([[-1,0],[1,0],[0,-1],[0,1]]);
  for (const [dr,dc] of dirs) {
    const nr=cr+dr, nc=cc+dc;
    if (nr<0||nr>=ROWS||nc<0||nc>=COLS) continue;
    if (state.holes.has(`${nr},${nc}`)) continue;
    const cell=state.board[nr][nc];
    if (cell && !cell.stone && !cell.chocolate && !state.iceGrid[nr]?.[nc] && cell.type>=0) {
      state.board[nr][nc] = { type:-1, special:SPECIAL.NONE, ice:false, stone:false, chocolate:true, marmalade:false, anim:{} };
      spawnParticles(nr, nc, '#92400e', 5);
      // Рост тьмы увеличивает «потолок» прогресса на 1, иначе прогресс регрессирует
      state.chocolateInitial = (state.chocolateInitial || 0) + 1;
      break;
    }
  }
}

function hasFountain() {
  if (!state.fountainGrid) return false;
  for (const r in state.fountainGrid) for (const c in state.fountainGrid[r]) if (state.fountainGrid[r][c]) return true;
  return false;
}

function spreadWhiteChoc() {
  // Spread: fountain cells generate new white choc on adjacent free cells
  if (!state.fountainGrid) return;
  const fountains = [];
  for (const r in state.fountainGrid) for (const c in state.fountainGrid[r]) {
    if (state.fountainGrid[r][c]) fountains.push([+r, +c]);
  }
  shuffleArray(fountains);
  for (const [fr, fc] of fountains) {
    const dirs = shuffleArray([[-1,0],[1,0],[0,-1],[0,1]]);
    for (const [dr, dc] of dirs) {
      const nr=fr+dr, nc=fc+dc;
      if (nr<0||nr>=ROWS||nc<0||nc>=COLS) continue;
      if (state.holes.has(`${nr},${nc}`)) continue;
      const cell=state.board[nr][nc];
      if (cell && !cell.stone && !cell.chocolate && !(cell.whiteChoc>0) && !state.iceGrid[nr]?.[nc] && cell.type>=0) {
        cell.whiteChoc = 1; cell.type = -1; cell.special = SPECIAL.NONE;
        spawnParticles(nr, nc, '#f5e6ca', 4);
        break;
      }
    }
  }
}

// Уничтожает клетку тьмы и помечает флаг для подавления распространения в этот ход
function destroyChocolate(r, c) {
  state.board[r][c] = null;
  state.chocolateBrokenThisMove = true;
  spawnParticles(r, c, '#92400e', 6);
  clearJellyAt(r, c);
  clearCarpetAt(r, c, false);
  updateGoalProgress();
}

// Проверяет клетки соседей на тьму и ломает её (вызывается при уничтожении любой соседней клетки)
function breakAdjacentChocolate(r, c) {
  for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
    const nr=r+dr, nc=c+dc;
    if (nr<0||nr>=ROWS||nc<0||nc>=COLS) continue;
    if (state.board[nr]?.[nc]?.chocolate) destroyChocolate(nr, nc);
  }
}

function _applyGravityAccel(holes, accelMap) {
  const board = state.board;
  function isVoid(r, c) {
    if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return true;
    if (holes.has(`${r},${c}`)) return true;
    const v = accelMap[r]?.[c];
    return !v || (v[0] === 0 && v[1] === 0);
  }
  function isBlocker(cell) {
    return cell.stone || cell.chocolate || cell.licorice > 0 || cell.honey > 0;
  }

  // Count dominant direction for iteration order
  let downC = 0, upC = 0, leftC = 0, rightC = 0;
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    if (holes.has(`${r},${c}`)) continue;
    const v = accelMap[r]?.[c]; if (!v) continue;
    if (v[1] > 0) downC++; else if (v[1] < 0) upC++; else if (v[0] < 0) leftC++; else if (v[0] > 0) rightC++;
  }

  const processCell = (r, c) => {
    if (isVoid(r, c)) return false;
    const cell = board[r][c];
    if (!cell || isBlocker(cell)) return false;
    const v = accelMap[r][c];
    const dx = v[0] / 2, dy = v[1] / 2;
    const tr = r + dy, tc = c + dx;
    if (!isVoid(tr, tc) && board[tr][tc] === null) {
      board[tr][tc] = cell; board[r][c] = null;
      if (!board[tr][tc].anim) board[tr][tc].anim = {};
      board[tr][tc].anim.oy = (board[tr][tc].anim.oy || 0) - dy * cellSize;
      if (dx !== 0) board[tr][tc].anim.ox = (board[tr][tc].anim.ox || 0) - dx * cellSize;
      return true;
    }
    // Diagonals: vertical gravity → try (r+dy, c±1); horizontal → try (r±1, c+dx)
    const diags = dy !== 0
      ? [[r + dy, c - 1], [r + dy, c + 1]]
      : [[r - 1, c + dx], [r + 1, c + dx]];
    for (const [dr, dc] of diags) {
      if (!isVoid(dr, dc) && board[dr][dc] === null) {
        board[dr][dc] = cell; board[r][c] = null;
        if (!board[dr][dc].anim) board[dr][dc].anim = {};
        board[dr][dc].anim.oy = (board[dr][dc].anim.oy || 0) - (dr - r) * cellSize;
        board[dr][dc].anim.ox = (board[dr][dc].anim.ox || 0) - (dc - c) * cellSize;
        board[dr][dc].anim._slide = true;
        return true;
      }
    }
    return false;
  };

  const MAX_PASSES = ROWS + COLS;
  for (let pass = 0; pass < MAX_PASSES; pass++) {
    let moved = false;
    if (downC >= upC && downC >= leftC && downC >= rightC) {
      for (let r = ROWS - 1; r >= 0; r--) for (let c = 0; c < COLS; c++) if (processCell(r, c)) moved = true;
    } else if (upC >= leftC && upC >= rightC) {
      for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (processCell(r, c)) moved = true;
    } else if (leftC >= rightC) {
      for (let c = 0; c < COLS; c++) for (let r = 0; r < ROWS; r++) if (processCell(r, c)) moved = true;
    } else {
      for (let c = COLS - 1; c >= 0; c--) for (let r = 0; r < ROWS; r++) if (processCell(r, c)) moved = true;
    }
    if (!moved) break;
  }
}

function applyGravity() {
  const holes = state.holes;
  const lvl = getLevel(state.currentLevel);
  const accelMap = lvl?.accelMap;
  const sodaLevel = state.sodaLevel || 0;
  const sodaStart = ROWS - sodaLevel;

  if (accelMap) {
    _applyGravityAccel(holes, accelMap);
  } else {
  for (let c=0;c<COLS;c++) {
    // ── Нормальная зона (строки 0..sodaStart-1): гемы падают вниз ──
    let wr=sodaStart-1;
    for (let r=sodaStart-1;r>=0;r--) {
      if (holes.has(`${r},${c}`)) { wr=r-1; continue; }
      const cell = state.board[r][c];
      if (cell !== null) {
        if (cell.stone || cell.chocolate || (cell.whiteChoc > 0) || cell.licorice > 0 || cell.honey > 0) { wr = r - 1; continue; }
        const fallDist=wr-r;
        if (cell.ingredient && wr === ROWS-1 && fallDist === 0 && r === ROWS-1) {
          state.ingredientsDelivered++; state.board[r][c]=null; wr--; continue;
        }
        state.board[wr][c]=cell;
        if (fallDist>0) {
          state.board[r][c]=null;
          if (!state.board[wr][c].anim) state.board[wr][c].anim={};
          state.board[wr][c].anim.oy=(state.board[wr][c].anim.oy||0)-fallDist*cellSize;
          if (cell.ingredient && wr === ROWS-1) { state.ingredientsDelivered++; state.board[wr][c]=null; wr++; }
        }
        wr--;
      }
    }
    for (let r=wr;r>=0;r--) { if (!holes.has(`${r},${c}`)) state.board[r][c]=null; }

    // ── Сода-зона (строки sodaStart..ROWS-1): гемы всплывают вверх ──
    if (sodaLevel > 0) {
      let wr2=sodaStart;
      for (let r=sodaStart;r<ROWS;r++) {
        if (holes.has(`${r},${c}`)) { wr2=r+1; continue; }
        const cell = state.board[r][c];
        if (cell !== null) {
          if (cell.stone || cell.chocolate || cell.bottle) { wr2=r+1; continue; }
          const riseDist=r-wr2;
          state.board[wr2][c]=cell;
          if (riseDist>0) {
            state.board[r][c]=null;
            if (!state.board[wr2][c].anim) state.board[wr2][c].anim={};
            state.board[wr2][c].anim.oy=(state.board[wr2][c].anim.oy||0)+riseDist*cellSize;
          }
          wr2++;
        }
      }
      for (let r=wr2;r<ROWS;r++) { if (!holes.has(`${r},${c}`)) state.board[r][c]=null; }
    }
  }
  }

  // Portal teleportation: gems resting on an entrance teleport to the exit
  if (state.portalGrid) {
    const _teleCols = new Set();
    const _teleDests = new Set(); // prevent re-teleporting just-arrived gems
    for (let r = ROWS-1; r >= 0; r--) {
      for (let c = 0; c < COLS; c++) {
        if (_teleDests.has(`${r},${c}`)) continue;
        const _pg = state.portalGrid[r]?.[c];
        if (!_pg) continue;
        const _gc = state.board[r][c];
        if (!_gc || _gc.stone || _gc.chocolate || (_gc.licorice > 0) || (_gc.honey > 0)) continue;
        const {exitR, exitC} = _pg;
        if (holes.has(`${exitR},${exitC}`)) continue;
        if (state.board[exitR][exitC] !== null) continue;
        state.board[exitR][exitC] = _gc;
        state.board[r][c] = null;
        if (!state.board[exitR][exitC].anim) state.board[exitR][exitC].anim = {};
        _teleCols.add(exitC);
        _teleDests.add(`${exitR},${exitC}`);
        spawnParticles(r, c, _pg.color, 4);
        spawnParticles(exitR, exitC, _pg.color, 4);
        SFX.portalWhoosh();
      }
    }
    // Re-settle teleported gems in their destination columns
    for (const _tc of _teleCols) {
      let _wr = sodaStart - 1;
      for (let _tr = sodaStart - 1; _tr >= 0; _tr--) {
        if (holes.has(`${_tr},${_tc}`)) { _wr = _tr - 1; continue; }
        const _cell = state.board[_tr][_tc];
        if (_cell !== null) {
          if (_cell.stone || _cell.chocolate || _cell.licorice > 0 || _cell.honey > 0) { _wr = _tr - 1; continue; }
          const _fd = _wr - _tr;
          state.board[_wr][_tc] = _cell;
          if (_fd > 0) {
            state.board[_tr][_tc] = null;
            if (!state.board[_wr][_tc].anim) state.board[_wr][_tc].anim = {};
            state.board[_wr][_tc].anim.oy = (state.board[_wr][_tc].anim.oy || 0) - _fd * cellSize;
          }
          _wr--;
        }
      }
      for (let _tr = _wr; _tr >= 0; _tr--) { if (!holes.has(`${_tr},${_tc}`)) state.board[_tr][_tc] = null; }
    }
  }
}

function _spawnGem(r, c, honeyNeeded, enterOy, enterOx) {
  let _ft = randGem();
  for (let _fa=0; _fa<_activeGemTypes && wouldMatch(state.board,r,c,_ft); _fa++) _ft=(_ft+1)%_activeGemTypes;
  const g = createGem(_ft);
  g.anim = {oy: enterOy, alpha: 1, _new: 1};
  if (enterOx) g.anim.ox = enterOx;
  if (honeyNeeded > 0) { g.honey=2; g.special=SPECIAL.NONE; }
  else if (state.rainbowRound?.active && Math.random()<0.30) { g.special=SPECIAL.RAINBOW; g.type=-1; }
  else if (_currentDynDiff < 1.0 && Math.random() < 0.08) {
    if (_currentSpecialWeights) {
      const sw=_currentSpecialWeights, keys=['stripe','rainbow','rocket','bomb'];
      const pick=keys[weightedRandom(keys.map(k=>sw[k]??0))];
      g.special={stripe:Math.random()<0.5?SPECIAL.STRIPE_H:SPECIAL.STRIPE_V,rainbow:SPECIAL.RAINBOW,rocket:SPECIAL.ROCKET,bomb:SPECIAL.BOMB}[pick]??SPECIAL.STRIPE_H;
    } else {
      g.special = Math.random()<0.6 ? (Math.random()<0.5?SPECIAL.STRIPE_H:SPECIAL.STRIPE_V) : SPECIAL.BOMB;
    }
  }
  return g;
}

function fillFromTop() {
  const holes = state.holes;
  const lvl=getLevel(state.currentLevel);
  let iceNeeded=0;
  if (lvl&&lvl.type==='ice') {
    let iceOnBoard=0;
    for (let r=0;r<ROWS;r++) for (let c=0;c<COLS;c++) { if (state.iceGrid[r][c]) iceOnBoard++; }
    iceNeeded=Math.max(0, lvl.target-state.iceBroken-iceOnBoard);
  }
  let honeyNeeded=0;
  if (lvl?.type==='bears') {
    const bt=lvl.bearsTarget||lvl.honeyCount||1;
    let honeyOnBoard=0;
    for (let r=0;r<ROWS;r++) for (let c=0;c<COLS;c++) { if (state.board[r]?.[c]?.honey>0) honeyOnBoard++; }
    honeyNeeded=Math.max(0, bt-(state.bearsFreed||0)-honeyOnBoard);
  }
  const newGemPositions=[];
  const sodaLevel = state.sodaLevel || 0;
  const sodaStart = ROWS - sodaLevel;

  // ── Cannon-based spawn (accelMap levels) ─────────────────────────────────────
  // CCSS: BoardPopulator fills all empty cells reachable from the cannon in gravity direction
  // Requires accelMap — without it, vCell check would immediately break and nothing spawns
  if (lvl?.cannons?.length && lvl?.accelMap) {
    const accelMap = lvl.accelMap;
    for (const [cr, cc] of lvl.cannons) {
      if (holes.has(`${cr},${cc}`)) continue;
      if (cr >= sodaStart) continue;
      const v = accelMap?.[cr]?.[cc] || [0, 2];
      const dr = v[1] / 2; // row step (gravity direction from cannon)
      const dc = v[0] / 2; // col step
      // Walk from cannon in gravity direction, fill all consecutive empty cells
      let step = 0, r = cr, c = cc;
      while (r >= 0 && r < ROWS && c >= 0 && c < COLS) {
        if (holes.has(`${r},${c}`)) break;
        if (r >= sodaStart) break;
        const vCell = accelMap?.[r]?.[c];
        if (!vCell || (vCell[0] === 0 && vCell[1] === 0)) break;
        if (state.board[r][c] !== null) break;
        step++;
        const g = _spawnGem(r, c, honeyNeeded, -dr * step * cellSize, -dc * step * cellSize);
        if (honeyNeeded > 0 && g.honey) honeyNeeded--;
        state.board[r][c] = g;
        newGemPositions.push({r, c});
        r += dr; c += dc;
      }
    }
    if (iceNeeded>0&&newGemPositions.length>0) {
      shuffleArray([...newGemPositions]).slice(0,iceNeeded).forEach(({r,c})=>{ state.iceGrid[r][c]=1; });
    }
    return;
  }

  // ── Legacy: column-based spawn (no cannons / standard levels) ───────────────
  // sectionEmpty сбрасывается на каждой дыре/блокере — гемы в изолированных
  // секциях правильно "входят" сверху своей секции, а не с самого верха доски.
  for (let c=0;c<COLS;c++) {
    let sectionEmpty=0;
    for (let r=0;r<sodaStart;r++) {
      if (holes.has(`${r},${c}`)) { sectionEmpty=0; continue; }
      const existing=state.board[r][c];
      if (existing && (existing.stone || existing.chocolate || (existing.whiteChoc > 0))) { sectionEmpty=0; continue; }
      if (existing!==null) { sectionEmpty=0; continue; }
      sectionEmpty++;
      const g = _spawnGem(r, c, honeyNeeded, -sectionEmpty*cellSize, 0);
      if (honeyNeeded > 0 && g.honey) honeyNeeded--;
      state.board[r][c]=g;
      newGemPositions.push({r,c});
    }
    if (sodaLevel > 0) {
      let emptyCountS=0;
      for (let r=ROWS-1;r>=sodaStart;r--) {
        if (holes.has(`${r},${c}`)) { emptyCountS=0; continue; }
        const existing=state.board[r][c];
        if (existing && (existing.stone || existing.chocolate || existing.bottle)) { emptyCountS=0; continue; }
        if (existing===null) {
          emptyCountS++;
          const g=createGem(); g.anim={oy:emptyCountS*cellSize,alpha:1};
          state.board[r][c]=g;
          newGemPositions.push({r,c});
        }
      }
    }
  }
  if (iceNeeded>0&&newGemPositions.length>0) {
    shuffleArray([...newGemPositions]).slice(0,iceNeeded).forEach(({r,c})=>{ state.iceGrid[r][c]=1; });
  }
}

