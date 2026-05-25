// ══════════════════════════════════════════
//  СВАП
// ══════════════════════════════════════════
async function trySwap(r1,c1,r2,c2) {
  if (state.busy||state.paused) return;
  if (r2<0||r2>=ROWS||c2<0||c2>=COLS) return;
  const cl1=state.board[r1][c1], cl2=state.board[r2][c2];
  if (!cl1||!cl2||cl1.stone||cl2.stone||cl1.chocolate||cl2.chocolate||cl1.marmalade||cl2.marmalade||cl1.locked||cl2.locked||cl1.mystery||cl2.mystery) return;
  haptic('tap');
  if (cl1.ingredient || cl2.ingredient) {
    // Разрешить только если партнёр образует матч на новой позиции
    doSwap(r1,c1,r2,c2);
    const _ingMatch = findMatches().size > 0;
    doSwap(r1,c1,r2,c2);
    if (!_ingMatch) return;
  }

  // Лёд: замороженная клетка не двигается ни как источник, ни как цель свапа.
  // Матч с ней образуется только когда соседние незамёрзшие создают 3+ в ряд.
  if (state.iceGrid[r1]?.[c1]) { shakeCell(r1,c1); return; }
  if (state.iceGrid[r2]?.[c2]) { shakeCell(r2,c2); return; }
  hideOnboarding();

  // Два спешла — комбинированный взрыв (свап двух спецфишек)
  if (cl1.special!==SPECIAL.NONE && cl2.special!==SPECIAL.NONE &&
      !(cl1.special===SPECIAL.RAINBOW||cl2.special===SPECIAL.RAINBOW)) {
    state.busy=true;
    await animateSwap(r1,c1,r2,c2); doSwap(r1,c1,r2,c2);
    spendMove();
    // Сохраняем типы до вызова (triggerCombinedSpecial обнуляет ячейки внутри себя)
    const _sp1combo=cl1.special, _sp2combo=cl2.special;
    const _t1combo=cl1.type, _t2combo=cl2.type;
    for (const [r,c,cl] of [[r1,c1,cl1],[r2,c2,cl2]]) {
      clearJellyAt(r,c); clearCarpetAt(r,c,false);
      if (cl.type>=0) state.collectedGems[cl.type]=(state.collectedGems[cl.type]||0)+1;
      if (state.iceGrid[r]?.[c]) { state.iceGrid[r][c]--; if(!state.iceGrid[r][c]){state.iceBroken++; updateQuestProgress('ice',1);} }
      if (state.frostGrid[r]?.[c]) { state.frostGrid[r][c]--; spawnParticles(r,c,'#bae6fd',3); }
    }
    await triggerCombinedSpecial(r1,c1,_sp1combo,r2,c2,_sp2combo);
    applyGravity(); fillFromTop(); await animateDrop();
    await processMatches(r2,c2);
    return;
  }

  // Радуга: взрывается при любом свапе (даже без матча)
  if (cl1.special===SPECIAL.RAINBOW||cl2.special===SPECIAL.RAINBOW) {
    state.busy=true;
    showExclamation('rainbow');
    await animateSwap(r1,c1,r2,c2); doSwap(r1,c1,r2,c2);
    const rainbow=cl1.special===SPECIAL.RAINBOW?cl1:cl2;
    const other=cl1.special===SPECIAL.RAINBOW?cl2:cl1;

    // Радуга + Радуга = очистить весь экран
    if (other.special===SPECIAL.RAINBOW) {
      await animateRainbowBurst(-1, r1, c1); // -1 = все гемы
      let pts=0;
      for (let r=0;r<ROWS;r++) for (let c=0;c<COLS;c++) {
        const cl=state.board[r][c]; if(!cl||cl.stone||cl.ingredient) continue;
        if(state.iceGrid[r]?.[c]){state.iceGrid[r][c]--;if(!state.iceGrid[r][c]){state.iceBroken++;updateQuestProgress('ice',1);}}
        if(state.frostGrid[r]?.[c]){state.frostGrid[r][c]--;spawnParticles(r,c,'#bae6fd',3);}
        clearJellyAt(r,c); clearCarpetAt(r,c,false);
        if(cl.chocolate){destroyChocolate(r,c);}
        else {
          if(cl.type>=0){state.collectedGems[cl.type]=(state.collectedGems[cl.type]||0)+1; pts+=60;}
          spawnParticles(r,c,getSkinColor(Math.max(0,cl.type)),6);
          state.board[r][c]=null;
          breakAdjacentChocolate(r,c);
        }
      }
      if(pts>0){state.score+=pts;spawnFloatingScore(r1,c1,pts,'#ff00ff');}
      spawnScreenShake(); spendMove(); updateGoalProgress();
      applyGravity(); fillFromTop(); await animateDrop();
      await processMatches(r2,c2);
      return;
    }

    // Радуга + бонус = превратить все гемы целевого цвета в этот бонус
    if (other.special!==SPECIAL.NONE) {
      // Если другой бонус бесцветный (тип=-1), выбираем самый частый цвет
      const rawTT=other.type;
      let tt=rawTT>=0?rawTT:(()=>{const counts={};let best=-1,bestN=0;for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++){const t=state.board[r]?.[c]?.type;if(t>=0){counts[t]=(counts[t]||0)+1;if(counts[t]>bestN){bestN=counts[t];best=t;}}}return best>=0?best:0;})();
      const bonusSp=other.special;
      const _rbSwapSrcR=cl1.special===SPECIAL.RAINBOW?r1:r2, _rbSwapSrcC=cl1.special===SPECIAL.RAINBOW?c1:c2;
      await animateRainbowBurst(tt, _rbSwapSrcR, _rbSwapSrcC);
      showSpecialComboLabel(SPECIAL.RAINBOW, bonusSp);
      const targets=[];
      for (let r=0;r<ROWS;r++) for (let c=0;c<COLS;c++) {
        const cl=state.board[r][c];
        if(cl&&cl.type===tt&&!cl.stone&&!cl.chocolate&&!cl.ingredient) { cl.special=bonusSp; targets.push([r,c,bonusSp]); }
      }
      for (const [r,c,cl] of [[r1,c1,state.board[r1][c1]],[r2,c2,state.board[r2][c2]]]) {
        if(!cl) continue;
        clearJellyAt(r,c); clearCarpetAt(r,c,false);
        if(cl.type>=0) state.collectedGems[cl.type]=(state.collectedGems[cl.type]||0)+1;
        if(state.iceGrid[r]?.[c]){state.iceGrid[r][c]--;if(!state.iceGrid[r][c]){state.iceBroken++;updateQuestProgress('ice',1);}}
        if(state.frostGrid[r]?.[c]){state.frostGrid[r][c]--;spawnParticles(r,c,'#bae6fd',3);}
      }
      state.board[r1][c1]=null; state.board[r2][c2]=null;
      drawBoard();
      await new Promise(res=>setTimeout(res,_d(200)));
      let pts=0;
      for (const [tr,tc,sp] of targets) {
        const tcl=state.board[tr]?.[tc];
        if(tcl&&!tcl.ingredient) { await triggerSpecial(tr,tc,sp); state.board[tr][tc]=null; pts+=30; }
      }
      if(pts>0){state.score+=pts;spawnFloatingScore(r1,c1,pts,'#a855f7');}
      spendMove(); updateGoalProgress();
      applyGravity(); fillFromTop(); await animateDrop();
      await processMatches(r2,c2);
      return;
    }

    // Радуга + обычный гем = удалить все гемы этого цвета
    const tt=other.type;
    const _rbNormSrcR=cl1.special===SPECIAL.RAINBOW?r1:r2, _rbNormSrcC=cl1.special===SPECIAL.RAINBOW?c1:c2;
    await animateRainbowBurst(tt, _rbNormSrcR, _rbNormSrcC);
    let rainbowPts=0;
    for (let r=0;r<ROWS;r++) for (let c=0;c<COLS;c++) {
      const cl=state.board[r][c]; if (!cl) continue;
      if (cl.ingredient || cl.stone || cl.chocolate) continue; // радуга не ломает камни/тьму/ингредиенты
      if (cl.type===tt || cl.special===SPECIAL.RAINBOW) {
        if (state.iceGrid[r]?.[c]) { state.iceGrid[r][c]--; if(!state.iceGrid[r][c]){state.iceBroken++; updateQuestProgress('ice',1);} }
        if (state.frostGrid[r]?.[c]) { state.frostGrid[r][c]--; spawnParticles(r,c,'#bae6fd',3); }
        clearJellyAt(r,c); clearCarpetAt(r,c,false);
        if (cl.type>=0) state.collectedGems[cl.type]=(state.collectedGems[cl.type]||0)+1;
        state.board[r][c]=null;
        spawnParticles(r,c,getSkinColor(tt>=0?tt:0),6);
        breakAdjacentChocolate(r,c);
        rainbowPts+=50;
      }
    }
    if(rainbowPts>0){state.score+=rainbowPts;spawnFloatingScore(r1,c1,rainbowPts,'#a855f7');}
    spawnScreenShake(); spendMove();
    applyGravity(); fillFromTop(); await animateDrop();
    await processMatches(r2,c2);
    return;
  }

  // Save snapshot before any state modification (for undo)
  const _swapSnap = {
    board: state.board.map(row => row.map(cell => cell ? {...cell, anim: {}} : null)),
    iceGrid: state.iceGrid.map(row => [...row]),
    jellyGrid: state.jellyGrid.map(row => [...row]),
    carpetGrid: state.carpetGrid.map(row => [...row]),
    score: state.score, moves: state.moves,
    iceBroken: state.iceBroken, stonesBroken: state.stonesBroken,
    collectedGems: {...state.collectedGems}, r1, c1, r2, c2,
  };
  state.busy=true;
  // Peek: check validity without changing visible state
  doSwap(r1,c1,r2,c2);
  const hasMatch=findMatches().size>0;
  doSwap(r1,c1,r2,c2);
  // Animate forward (gems still at original positions)
  await animateSwap(r1,c1,r2,c2);
  doSwap(r1,c1,r2,c2); // state now matches what player sees
  if (!hasMatch) {
    // Animate back and restore
    await animateSwap(r2,c2,r1,c1);
    doSwap(r2,c2,r1,c1);
    state.busy=false; return;
  }
  // Valid swap — save snapshot for undo
  state.lastSwap = _swapSnap;
  _updateUndoBtn();
  spendMove();
  // Спешлы активируются через processMatches как часть матча (не как прямой свап)
  applyGravity(); fillFromTop(); await animateDrop();
  await processMatches(r2,c2);
}

function doSwap(r1,c1,r2,c2) {
  const t=state.board[r1][c1]; state.board[r1][c1]=state.board[r2][c2]; state.board[r2][c2]=t;
}

function _updateUndoBtn() {
  const btn = document.getElementById('hud-undo-btn'); if (!btn) return;
  const canUndo = !!state.lastSwap && !state.busy && !state.paused;
  btn.style.display = '';
  btn.style.opacity = canUndo ? '1' : '0.35';
  btn.style.pointerEvents = canUndo ? 'all' : 'none';
  const free = !state.undoUsedThisLevel;
  btn.title = canUndo ? (free ? '↩️ Отмена (бесплатно)' : '↩️ Отмена (10 💎)') : 'Отмена недоступна';
}

async function applyUndo() {
  if (!state.lastSwap || state.busy || state.paused) return;
  const cost = state.undoUsedThisLevel ? 10 : 0;
  if (cost > 0 && state.crystals < cost) { showToast(`Нужно 10 💎 для отмены`); return; }
  if (cost > 0) { state.crystals -= cost; }

  state.busy = true;
  state.undoUsedThisLevel = true;
  const snap = state.lastSwap;
  state.lastSwap = null;
  _updateUndoBtn();

  // Animate undo swap back (swap the cells back visually)
  const {r1, c1, r2, c2} = snap;
  await animateSwap(r2, c2, r1, c1);

  // Restore state from snapshot
  state.board      = snap.board;
  state.iceGrid    = snap.iceGrid;
  state.jellyGrid  = snap.jellyGrid;
  state.carpetGrid = snap.carpetGrid;
  state.score      = snap.score;
  state.moves      = snap.moves;
  state.iceBroken  = snap.iceBroken;
  state.stonesBroken = snap.stonesBroken;
  state.collectedGems = snap.collectedGems;
  state.comboCount = 0;
  state.matchSoundLvl = 0;
  state.matchSequenceStep = 0;

  haptic('tap');
  drawBoard();
  updateHUD();
  updateGoalProgress();
  state.busy = false;
  _updateUndoBtn();
}

function shakeCell(r, c) {
  const cell = state.board[r]?.[c]; if (!cell) return;
  let phase = 0;
  const iv = setInterval(() => {
    cell.anim = { ox: Math.sin(phase * 2.5) * 5, oy: 0 };
    phase += 0.4;
    drawBoard();
    if (phase > Math.PI * 2) { clearInterval(iv); cell.anim = {}; drawBoard(); }
  }, 22);
}
function spendMove() {
  state.moves--;
  updateHUD();
  updateQuestProgress('moves', 1);
  resetHintTimer();
  // Rainbow Round moves countdown
  if (state.rainbowRound?.active) {
    state.rainbowRound.movesLeft--;
    updateRainbowRoundHUD();
    if (state.rainbowRound.movesLeft <= 0) {
      state.rainbowRound.active = false;
      state.rainbowRound.movesLeft = 0;
      updateRainbowRoundHUD();
    }
  }
  // Licorice auto-spawn
  if (state.licoriceSpawnRate > 0 && state.moves > 0) {
    const lvl = getLevel(state.currentLevel);
    const spent = (lvl?.moves || 20) - state.moves;
    if (spent > 0 && spent % state.licoriceSpawnRate === 0) spawnLicorice();
  }
  // BubbleGum jelly spread
  if (getLevel(state.currentLevel)?.type === 'jelly') applyJellySpread();
}

function applyJellySpread() {
  const lvl = getLevel(state.currentLevel);
  const chance = (lvl?.jellyGrowChance ?? 50) / 100;
  const holes = state.holes;
  const spreadCells = [];
  for (let r=0; r<ROWS; r++) for (let c=0; c<COLS; c++) {
    if (!state.jellyGrid[r]?.[c]) continue;
    for (const [dr,dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
      const nr=r+dr, nc=c+dc;
      if (nr<0||nr>=ROWS||nc<0||nc>=COLS) continue;
      if (holes.has(`${nr},${nc}`)) continue;
      if (state.jellyGrid[nr]?.[nc]) continue;
      const cell=state.board[nr]?.[nc];
      if (!cell||cell.stone||cell.chocolate||cell.marmalade||cell.locked) continue;
      if (Math.random()<chance) spreadCells.push([nr,nc]);
    }
  }
  const seen=new Set();
  for (const [r,c] of spreadCells) {
    const k=`${r},${c}`; if(seen.has(k)) continue; seen.add(k);
    state.jellyGrid[r][c]=2;
    spawnParticles(r,c,'#ff80c8',3);
  }
}

// Мёд/Медведи
function freeBear(r, c) {
  state.bearsFreed = (state.bearsFreed || 0) + 1;
  spawnParticles(r, c, '#fde68a', 8);
  rings.push({ x:boardOffX+c*cellSize+cellSize/2, y:boardOffY+r*cellSize+cellSize/2, color:'rgba(251,191,36,0.85)', r:4, maxR:cellSize*1.1, life:1, lw:3 });
  showToast('🐻 Медведь освобождён!');
  updateQuestProgress('bears', 1);
  updateGoalProgress();
}
function _releaseBear(r, c) {
  if (getLevel(state.currentLevel)?.type === 'bears') {
    const cell = state.board[r]?.[c];
    if (cell) cell._bearOpened = true;
    spawnParticles(r, c, '#fde68a', 4);
    setTimeout(() => {
      if (state.board[r]?.[c]) delete state.board[r][c]._bearOpened;
      freeBear(r, c);
    }, 380);
  } else {
    freeBear(r, c);
  }
}
function _drawBearInAmber(ctx, x, y, cs) {
  const cx = x + cs/2, cy = y + cs/2;
  ctx.save();
  ctx.fillStyle = 'rgba(160,75,5,0.40)';
  roundRect(ctx, x+2, y+2, cs-4, cs-4, 10); ctx.fill();
  const ag = ctx.createRadialGradient(cx-cs*0.14, cy-cs*0.20, cs*0.04, cx, cy, cs*0.50);
  ag.addColorStop(0, 'rgba(255,185,40,0.52)');
  ag.addColorStop(0.5, 'rgba(195,105,12,0.38)');
  ag.addColorStop(1, 'rgba(90,35,0,0.15)');
  ctx.fillStyle = ag; roundRect(ctx, x+2, y+2, cs-4, cs-4, 10); ctx.fill();
  ctx.fillStyle = 'rgba(70,35,8,0.68)';
  ctx.beginPath(); ctx.ellipse(cx, cy+cs*0.08, cs*0.25, cs*0.20, 0, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx, cy-cs*0.09, cs*0.175, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx-cs*0.12, cy-cs*0.24, cs*0.065, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx+cs*0.12, cy-cs*0.24, cs*0.065, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = 'rgba(255,215,100,0.75)';
  ctx.beginPath(); ctx.ellipse(cx-cs*0.065, cy-cs*0.095, cs*0.038, cs*0.012, 0, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(cx+cs*0.065, cy-cs*0.095, cs*0.038, cs*0.012, 0, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = 'rgba(255,225,100,0.20)';
  ctx.beginPath(); ctx.ellipse(cx-cs*0.10, cy-cs*0.20, cs*0.090, cs*0.050, -0.4, 0, Math.PI*2); ctx.fill();
  ctx.strokeStyle = 'rgba(195,115,18,0.72)';
  ctx.lineWidth = Math.max(1, cs*0.024);
  roundRect(ctx, x+2, y+2, cs-4, cs-4, 10); ctx.stroke();
  ctx.restore();
}
function _drawOpenBear(ctx, x, y, cs) {
  const cx = x + cs/2, cy = y + cs/2;
  ctx.save();
  ctx.shadowColor = 'rgba(255,210,50,0.85)'; ctx.shadowBlur = cs*0.22;
  ctx.fillStyle = '#8B5733';
  ctx.beginPath(); ctx.ellipse(cx, cy+cs*0.08, cs*0.26, cs*0.21, 0, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx, cy-cs*0.09, cs*0.185, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx-cs*0.125, cy-cs*0.24, cs*0.072, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx+cs*0.125, cy-cs*0.24, cs*0.072, 0, Math.PI*2); ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#C4845A';
  ctx.beginPath(); ctx.arc(cx-cs*0.125, cy-cs*0.24, cs*0.038, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx+cs*0.125, cy-cs*0.24, cs*0.038, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(cx, cy-cs*0.02, cs*0.072, cs*0.048, 0, 0, Math.PI*2); ctx.fill();
  ctx.strokeStyle = '#1a0e06'; ctx.lineWidth = Math.max(1, cs*0.024); ctx.lineCap = 'round';
  ctx.beginPath(); ctx.arc(cx-cs*0.068, cy-cs*0.115, cs*0.028, Math.PI, 0); ctx.stroke();
  ctx.beginPath(); ctx.arc(cx+cs*0.068, cy-cs*0.115, cs*0.028, Math.PI, 0); ctx.stroke();
  ctx.fillStyle = '#2a110a';
  ctx.beginPath(); ctx.ellipse(cx, cy-cs*0.055, cs*0.028, cs*0.018, 0, 0, Math.PI*2); ctx.fill();
  ctx.strokeStyle = '#2a110a'; ctx.lineWidth = Math.max(0.8, cs*0.018);
  ctx.beginPath(); ctx.arc(cx, cy+cs*0.01, cs*0.044, 0.2, Math.PI-0.2); ctx.stroke();
  ctx.restore();
}

// Rainbow Round — banner + HUD sync
function showRainbowRoundBanner() {
  if (!state.rainbowRound?.active) return;
  SFX.match(7); SFX.match(8);
  updateRainbowRoundHUD();
  const el = document.getElementById('rainbow-round-banner');
  if (!el) return;
  el.textContent = `🌈 РАДУЖНЫЙ РАУНД! × ${state.rainbowRound.movesLeft} ходов`;
  el.style.display = 'block';
  el.style.transition = 'transform 0.35s cubic-bezier(.34,1.56,.64,1)';
  el.style.transform = 'translate(-50%,-50%) scale(1)';
  setTimeout(() => {
    el.style.transition = 'transform 0.25s ease-in, opacity 0.25s';
    el.style.transform = 'translate(-50%,-50%) scale(0)';
    el.style.opacity = '0';
    setTimeout(() => { el.style.display='none'; el.style.opacity='1'; }, 280);
  }, 2200);
}

function updateRainbowRoundHUD() {
  const c = document.getElementById('game-canvas');
  if (!c) return;
  if (state.rainbowRound?.active) c.classList.add('rainbow-round');
  else c.classList.remove('rainbow-round');
}

function spawnLicorice() {
  const max = state.licoriceMax || 0;
  if (!max) return;
  let count = 0;
  const free = [];
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    if (state.holes.has(`${r},${c}`)) continue;
    const cell = state.board[r]?.[c];
    if (!cell) continue;
    if (cell.licorice > 0) count++;
    else if (cell.type >= 0 && !cell.stone && !cell.chocolate && !cell.mystery && !cell.ingredient) free.push([r,c]);
  }
  if (count >= max || free.length === 0) return;
  if (Math.random() > 0.5) return;
  const [r, c] = free[Math.floor(Math.random() * free.length)];
  const cell = state.board[r]?.[c];
  if (cell) { cell.licorice = 1; spawnParticles(r, c, '#b45309', 4); }
}

// ── Анимация перемешивания (плавный scale-down → shuffle → scale-up) ────────
function animateShuffleEffect() {
  return new Promise(res=>{
    const dur=180, t0=performance.now(), _ep=_matchEpoch;
    function down(now) {
      if (_matchEpoch!==_ep) { res(); return; }
      const t=Math.min((now-t0)/dur,1);
      for (let r=0;r<ROWS;r++) for (let c=0;c<COLS;c++) {
        const cl=state.board[r]?.[c]; if(cl) cl.anim={scale:1-t*0.9};
      }
      drawBoard();
      if(t<1) requestAnimationFrame(down);
      else {
        drawBoard();
        setTimeout(()=>{
          const t1=performance.now();
          function up(now2) {
            if (_matchEpoch!==_ep) { res(); return; }
            const t2=Math.min((now2-t1)/dur,1);
            for (let r=0;r<ROWS;r++) for (let c=0;c<COLS;c++) {
              const cl=state.board[r]?.[c]; if(cl) cl.anim={scale:t2};
            }
            drawBoard();
            if(t2<1) requestAnimationFrame(up);
            else {
              for (let r=0;r<ROWS;r++) for (let c=0;c<COLS;c++) {
                const cl=state.board[r]?.[c]; if(cl) cl.anim={};
              }
              drawBoard(); res();
            }
          }
          requestAnimationFrame(up);
        }, 60);
      }
    }
    requestAnimationFrame(down);
  });
}

