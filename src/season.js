//  ПОБЕДА / ПОРАЖЕНИЕ
// ══════════════════════════════════════════
async function bonusMovesExplosion() {
  console.log('[DBG] bonusMovesExplosion START moves='+state.moves);
  if (!state.moves || state.moves <= 0) { console.log('[DBG] bonusMovesExplosion SKIP (no moves)'); return; }
  const _myEpoch = _matchEpoch;
  state.busy = true;
  state._inBonusExplosion = true;
  const specials=[SPECIAL.STRIPE_H,SPECIAL.STRIPE_V,SPECIAL.BOMB];

  // Сначала подтягиваем фишки — поле должно быть заполнено до того, как игрок увидит бонусы
  applyGravity(); fillFromTop(); await animateDrop();
  if (_matchEpoch !== _myEpoch) { state._inBonusExplosion=false; return; }

  // Собираем все свободные клетки
  const free=[];
  for (let r=0;r<ROWS;r++) for (let c=0;c<COLS;c++) {
    if (state.holes.has(`${r},${c}`)) continue;
    const cl=state.board[r]?.[c];
    if (cl&&!cl.stone&&!cl.chocolate&&cl.type>=0&&cl.special===SPECIAL.NONE) free.push([r,c]);
  }
  if (!free.length) {
    state._inBonusExplosion=false;
    state.comboCount=0; state.matchSoundLvl=0; state.matchSequenceStep=0;
    return;
  }

  // Перемешиваем и берём min(moves, free.length) клеток
  for (let i=free.length-1;i>0;i--) { const j=Math.floor(Math.random()*(i+1)); [free[i],free[j]]=[free[j],free[i]]; }
  const n=Math.min(state.moves, free.length);
  const chosen=free.slice(0,n);

  // Размещаем ВСЕ бонусы сразу на экране
  const placements=[];
  for (const [br,bc] of chosen) {
    const cl=state.board[br]?.[bc]; if (!cl) continue;
    const sp=specials[Math.floor(Math.random()*specials.length)];
    cl.special=sp;
    placements.push({sp, cell:cl});
  }
  state.moves=0;
  state.comboCount++;
  drawBoard(); updateHUD();

  // Пауза — игрок видит все бонусы на экране одновременно
  await new Promise(r=>setTimeout(r,500));
  if (_matchEpoch !== _myEpoch) { state._inBonusExplosion=false; return; }

  // Одна гравитация → все взрывы одновременно
  applyGravity(); fillFromTop(); await animateDrop();
  if (_matchEpoch !== _myEpoch) { state._inBonusExplosion=false; return; }

  // Собираем зоны и анимации для всех бонусов одновременно
  const _blastCells = new Set();
  const _blastAnims = [];
  for (const {sp, cell} of placements) {
    let br=-1, bc=-1;
    for (let rr=0; rr<ROWS&&br<0; rr++) for (let cc=0; cc<COLS&&br<0; cc++) {
      if (state.board[rr]?.[cc] === cell) { br=rr; bc=cc; }
    }
    if (br<0) continue;
    state.board[br][bc] = null; // убираем бонус-фишку перед взрывом
    if (sp===SPECIAL.STRIPE_H) {
      for (let cc=0; cc<COLS; cc++) _blastCells.add(`${br},${cc}`);
      _blastAnims.push(animateStripeBeam(br, bc, true));
    } else if (sp===SPECIAL.STRIPE_V) {
      for (let rr=0; rr<ROWS; rr++) _blastCells.add(`${rr},${bc}`);
      _blastAnims.push(animateStripeBeam(br, bc, false));
    } else if (sp===SPECIAL.BOMB) {
      for (let dr=-1; dr<=1; dr++) for (let dc=-1; dc<=1; dc++) {
        const nr=br+dr, nc=bc+dc;
        if (nr>=0&&nr<ROWS&&nc>=0&&nc<COLS) _blastCells.add(`${nr},${nc}`);
      }
      spawnExplosionSparks(br, bc, 10, '#ec4899');
      _blastAnims.push(animateBombBlast(br, bc));
    }
  }
  // Все анимации взрывов одновременно
  await Promise.all(_blastAnims);
  if (_matchEpoch !== _myEpoch) { state._inBonusExplosion=false; return; }
  spawnScreenShake(14);

  // Уничтожаем все клетки в зонах
  let _bonusPts = 0;
  for (const key of _blastCells) {
    const [rr, cc] = key.split(',').map(Number);
    const cl = state.board[rr]?.[cc]; if (!cl) continue;
    if (state.iceGrid[rr]?.[cc]) { state.iceGrid[rr][cc]--; if(!state.iceGrid[rr][cc]){state.iceBroken++;} }
    if (state.frostGrid[rr]?.[cc]) { state.frostGrid[rr][cc]--; }
    if (cl.ingredient||cl.stone||cl.mystery) continue;
    if (cl.chocolate) { state.board[rr][cc]=null; spawnParticles(rr,cc,'#92400e',4); continue; }
    if (cl.marmalade) { cl.marmalade=false; continue; }
    if (cl.chain>0) { cl.chain=0; spawnParticles(rr,cc,'#8899aa',4); continue; }
    if (cl.licorice>0) { cl.licorice=0; spawnParticles(rr,cc,'#b45309',4); continue; }
    if (cl.honey>0) { cl.honey=0; _releaseBear(rr,cc); continue; }
    if (cl.whiteChoc>0) { cl.whiteChoc=0; cl.type=randGem(); continue; }
    clearJellyAt(rr,cc); clearCarpetAt(rr,cc,false);
    if (cl.type>=0) { state.collectedGems[cl.type]=(state.collectedGems[cl.type]||0)+1; _bonusPts+=30; }
    state.board[rr][cc]=null;
  }
  if (_bonusPts>0) { state.score+=_bonusPts; updateGoalProgress(); }
  updateHUD();

  // Финальная гравитация + каскад
  applyGravity(); fillFromTop(); await animateDrop();
  if (_matchEpoch !== _myEpoch) { state._inBonusExplosion=false; return; }
  const _cascMatches = findMatches();
  if (_cascMatches.size > 0) await processMatches();
  if (_matchEpoch !== _myEpoch) { state._inBonusExplosion=false; return; }
  applyGravity(); fillFromTop(); await animateDrop();

  state._inBonusExplosion=false;
  state.busy=false; // ensure busy is cleared even if processMatches exited early (e.g. _cascadeWon inside explosion)
  console.log('[DBG] bonusMovesExplosion END busy='+state.busy);
  state.comboCount=0; state.matchSoundLvl=0; state.matchSequenceStep=0;
}
function showWin() {
  state.recentResults = [...(state.recentResults||[]), 'win'].slice(-5);
  state.movesAtWin = state.moves;
  if (state.moves === 0) showExclamation('closecall'); // победа на последнем ходу
  if (state.moves > 0) {
    const _winEpoch = _matchEpoch;
    let _winBusyTries = 0;
    const _startBonus = () => {
      if (_matchEpoch !== _winEpoch) return; // level changed
      if (state.busy && _winBusyTries++ < 30) { setTimeout(_startBonus, 100); return; }
      if (state.busy) state.busy = false; // failsafe after 3s
      bonusMovesExplosion().then(()=>{ if (_matchEpoch === _winEpoch) _doShowWin(); });
    };
    _startBonus();
    return;
  }
  _doShowWin();
}

function _doShowWin() {
  if (state._winShowing) return;
  state._winShowing = true;
  const stars=calcStars();
  let reward=30+stars*20;
  if (state.streakDays>=7) reward=Math.floor(reward*1.1); // бонус стрика
  state.coins+=reward;
  state.lossStreak=0; // сбрасываем серию проигрышей
  // Rainbow Streak
  state.rainbowStreak = (state.rainbowStreak || 0) + 1;
  if (state.rainbowStreak >= 5) {
    state.rainbowStreak = 0;
    state.ingameBoosters.colorbomb = (state.ingameBoosters.colorbomb || 0) + 1;
    setTimeout(() => showToast('🌈 RAINBOW STREAK! +1 🌈 бонус!'), 3800);
  }
  const prev=state.levelStars[state.currentLevel]||0;
  state.levelStars[state.currentLevel]=Math.max(prev,stars);
  const _prevMax = state.maxUnlocked || 1;
  if (state.currentLevel>=state.maxUnlocked) state.maxUnlocked=state.currentLevel+1;
  checkBoosterUnlocks(_prevMax, state.maxUnlocked);
  // Сбрасываем счётчик попыток при победе
  delete state.levelAttempts[state.currentLevel];
  // Бонус за первую попытку
  if (state._firstAttemptLevel === state.currentLevel) {
    state.crystals += 5;
    if (!state.firstAttemptWins) state.firstAttemptWins = {};
    state.firstAttemptWins[state.currentLevel] = true;
    const _tier = getDifficultyTier(getLevel(state.currentLevel));
    const _faEl = document.getElementById('win-first-attempt');
    if (_faEl) {
      _faEl.textContent = _tier >= 1 ? 'HARD: С ПЕРВОГО РАЗА! 🏆' : '⚡ С первого раза! ⭐';
      _faEl.style.display = '';
      _faEl.style.color = _tier >= 2 ? '#ef4444' : '#fde68a';
    }
    setTimeout(() => showToast('🏆 Первая попытка! +5 💎'), 3600);
  } else {
    const _faEl = document.getElementById('win-first-attempt');
    if (_faEl) _faEl.style.display = 'none';
  }
  state._firstAttemptLevel = -1;
  saveGame();
  // Турнир: добавляем очки + XP сезона
  addTournScore(state.score);
  addSeasonXP(1);
  // Отправляем в лидерборд Яндекса
  SDK.submitScore(state.tournScore);
  // Квесты
  updateQuestProgress('score', state.score);
  updateQuestProgress('levels', 1);
  addPiggyCoins(reward);
  // Суммарный прогресс для достижений
  state.totalIceBroken    = (state.totalIceBroken    || 0) + (state.iceBroken    || 0);
  state.totalStonesBroken = (state.totalStonesBroken || 0) + (state.stonesBroken || 0);
  // Достижения
  state.totalWins = (state.totalWins || 0) + 1;
  // Rainbow Round — activate once every 20 wins, lasts 3 moves
  if (state.totalWins > 0 && state.totalWins % 20 === 0) {
    if (!state.rainbowRound) state.rainbowRound = {};
    state.rainbowRound.active = true;
    state.rainbowRound.movesLeft = 3;
    setTimeout(() => showRainbowRoundBanner(), 3800);
  }
  unlockAchievement('first_win');
  if (state.currentLevel >= 10) unlockAchievement('level_10');
  if (state.currentLevel >= 25) unlockAchievement('level_25');
  if (state.currentLevel >= 50) unlockAchievement('level_50');
  if (stars === 3) unlockAchievement('perfect_level');
  if (!state.activeBoosters.length) unlockAchievement('no_booster');
  checkAchievements();
  checkTrophies();

  document.getElementById('win-reward').textContent=`+${reward} 🪙`;
  document.getElementById('win-score').textContent=`${t('win_score_lbl')} ${state.score.toLocaleString()}`;
  // Score ticker: count from 0 to state.score over 1 second
  const tickerEl=document.getElementById('win-score-ticker');
  if (tickerEl) {
    tickerEl.textContent='0';
    const finalScore=state.score; const duration=1000;
    const startTs=performance.now();
    const tick=()=>{
      const elapsed=performance.now()-startTs;
      const pct=Math.min(elapsed/duration,1);
      const cur=Math.round(pct*pct*finalScore);
      tickerEl.textContent=cur.toLocaleString();
      if (pct<1) requestAnimationFrame(tick);
    };
    setTimeout(()=>requestAnimationFrame(tick), 100);
  }
  document.getElementById('btn-next-level').style.display=state.currentLevel<LEVELS.length?'':'none';
  // Показать пороги звёзд под строкой звёзд
  const labelsEl=document.getElementById('win-star-labels');
  if (labelsEl) {
    const sl=getLevel(state.currentLevel).starlevel;
    labelsEl.innerHTML = sl
      ? sl.map(v=>`<span>${v.toLocaleString()}</span>`).join('')
      : '';
  }
  // Mode-specific win screen theming
  const _winLvl = getLevel(state.currentLevel);
  const _winTier = getDifficultyTier(_winLvl);
  const winScr = document.getElementById('screen-win');
  if (winScr) {
    winScr.classList.remove('win-tier-hard','win-tier-super','win-tier-ultra');
    if (_winTier >= 3) winScr.classList.add('win-tier-ultra');
    else if (_winTier >= 2) winScr.classList.add('win-tier-super');
    else if (_winTier >= 1) winScr.classList.add('win-tier-hard');
  }
  // Show hard cleared banner
  let _hardClearedEl = document.getElementById('win-hard-cleared');
  if (!_hardClearedEl && _winTier >= 1) {
    _hardClearedEl = document.createElement('div');
    _hardClearedEl.id = 'win-hard-cleared';
    _hardClearedEl.style.cssText = 'font-size:14px;font-weight:900;letter-spacing:1px;padding:4px 16px;border-radius:20px;margin:0 auto 4px;animation:mascotPop 0.4s ease-out;';
    const titleEl = document.querySelector('#screen-win .result-title');
    if (titleEl) titleEl.after(_hardClearedEl);
  }
  if (_hardClearedEl) {
    if (_winTier >= 3) {
      _hardClearedEl.textContent = '🌟 ЭКСТРЕМАЛЬНЫЙ ПРОЙДЕН!';
      _hardClearedEl.style.display = '';
      _hardClearedEl.style.color = '#fff'; _hardClearedEl.style.background = 'linear-gradient(90deg,#7c3aed,#4f46e5)';
    } else if (_winTier >= 2) {
      _hardClearedEl.textContent = '💥 ОЧЕНЬ СЛОЖНЫЙ ПРОЙДЕН!';
      _hardClearedEl.style.display = '';
      _hardClearedEl.style.color = '#fff'; _hardClearedEl.style.background = 'linear-gradient(90deg,#dc2626,#b91c1c)';
    } else if (_winTier >= 1) {
      _hardClearedEl.textContent = '🔥 СЛОЖНЫЙ УРОВЕНЬ ПРОЙДЕН!';
      _hardClearedEl.style.display = '';
      _hardClearedEl.style.color = '#fff'; _hardClearedEl.style.background = 'linear-gradient(90deg,#ea580c,#c2410c)';
    } else {
      _hardClearedEl.style.display = 'none';
    }
  }

  haptic('win');
  showScreen('win'); animateWinStars(stars);
}

let _winGlowRAF = null;
function startWinGlow() {
  const cvs = document.getElementById('win-glow-canvas'); if (!cvs) return;
  const W = window.innerWidth, H = window.innerHeight;
  cvs.width = W; cvs.height = H;
  const ctx = cvs.getContext('2d');
  const cx = W/2, cy = H/2;
  const sparkles = [];
  const t0 = performance.now();
  if (_winGlowRAF) cancelAnimationFrame(_winGlowRAF);

  function spawnSparkle() {
    const angle = Math.random() * Math.PI * 2;
    const speed = 120 + Math.random() * 180;
    sparkles.push({
      x: cx, y: cy,
      vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
      life: 1, rot: Math.random() * 360, rotV: (Math.random()-0.5) * 600,
      size: 6 + Math.random() * 8,
    });
  }
  let lastSparkle = 0;

  function frame(now) {
    const elapsed = (now - t0) / 1000;
    ctx.clearRect(0, 0, W, H);

    // Glow: yellow radial, radius shrinks from 280 to 80 in 1s, then fades
    const glowT = Math.min(elapsed, 1);
    const glowR = 280 - 200 * EASE.outQuart(glowT);
    const glowAlpha = elapsed < 1 ? 0.4 + 0.35 * glowT : Math.max(0, 0.75 - (elapsed-1) * 0.3);
    if (glowAlpha > 0) {
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, glowR);
      grad.addColorStop(0, `rgba(255,255,102,${glowAlpha})`);
      grad.addColorStop(0.6, `rgba(255,200,0,${glowAlpha*0.4})`);
      grad.addColorStop(1, 'rgba(255,255,102,0)');
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = grad;
      ctx.beginPath(); ctx.arc(cx, cy, glowR, 0, Math.PI*2); ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
    }

    // Spawn sparkles over 2s
    if (elapsed < 2.5 && now - lastSparkle > 140) {
      spawnSparkle(); if (Math.random() < 0.4) spawnSparkle();
      lastSparkle = now;
    }

    // Draw sparkles
    ctx.globalCompositeOperation = 'lighter';
    for (const s of sparkles) {
      s.life -= 0.022;
      s.x += s.vx / 60; s.y += s.vy / 60;
      s.rot += s.rotV / 60;
      if (s.life <= 0) continue;
      const alpha = Math.min(1, s.life);
      ctx.save();
      ctx.translate(s.x, s.y); ctx.rotate(s.rot * Math.PI/180);
      ctx.globalAlpha = alpha * 0.9;
      ctx.fillStyle = '#ffffff';
      const r = s.size * s.life;
      ctx.beginPath();
      for (let i=0;i<4;i++) {
        const a = (i/4)*Math.PI*2; const a2 = a + Math.PI/4;
        const x1=Math.cos(a)*r, y1=Math.sin(a)*r;
        const x2=Math.cos(a2)*r*0.35, y2=Math.sin(a2)*r*0.35;
        if(i===0) ctx.moveTo(x1,y1); else ctx.lineTo(x1,y1);
        ctx.lineTo(x2,y2);
      }
      ctx.closePath(); ctx.fill();
      ctx.restore();
    }
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;

    if (elapsed < 3.5) _winGlowRAF = requestAnimationFrame(frame);
    else { ctx.clearRect(0,0,W,H); }
  }
  _winGlowRAF = requestAnimationFrame(frame);
}

let confettiPieces = [], confettiRAF = null;
function startConfetti() {
  startWinGlow();
  confettiPieces = [];
  const colors = ['#f59e0b','#ffe066','#a855f7','#4ade80','#38bdf8','#ef4444','#fb923c'];
  const W = window.innerWidth, H = window.innerHeight;
  for (let i=0;i<80;i++) confettiPieces.push({
    x: Math.random()*W, y: -20 - Math.random()*H*0.3,
    vx: (Math.random()-0.5)*3, vy: 2+Math.random()*4,
    w: 6+Math.random()*10, h: 4+Math.random()*6,
    color: colors[Math.floor(Math.random()*colors.length)],
    rot: Math.random()*360, rotV: (Math.random()-0.5)*8, life:1
  });
  if (confettiRAF) cancelAnimationFrame(confettiRAF);
  // Используем particle canvas который уже существует
  const pc = document.getElementById('particle-canvas');
  if (!pc) return;
  const pct = pc.getContext('2d');
  pc.width = W; pc.height = H;
  pc.style.cssText = 'position:fixed;inset:0;z-index:99;pointer-events:none;';
  function draw() {
    pct.clearRect(0,0,W,H);
    let alive = false;
    for (const p of confettiPieces) {
      if (p.life <= 0) continue; alive = true;
      p.x+=p.vx; p.y+=p.vy; p.vy+=0.05; p.rot+=p.rotV;
      if (p.y > H+20) p.life=0;
      pct.save(); pct.translate(p.x,p.y); pct.rotate(p.rot*Math.PI/180);
      pct.fillStyle=p.color; pct.globalAlpha=Math.min(1,p.life);
      pct.fillRect(-p.w/2,-p.h/2,p.w,p.h); pct.restore();
    }
    if (alive) confettiRAF=requestAnimationFrame(draw);
    else { pct.clearRect(0,0,W,H); pc.style.cssText=''; }
  }
  draw();
}

function animateWinStars(stars) {
  // Сброс всех звёзд
  for (let i=1;i<=3;i++) {
    const el=document.getElementById(`win-star-${i}`);
    if (!el) continue;
    el.className='win-star';
    el.textContent= i<=stars ? '⭐' : '☆';
  }
  // Кнопки скрыты до конца анимации
  const btns=document.getElementById('win-btns');
  if (btns) { btns.style.opacity='0'; btns.style.pointerEvents='none'; }

  // Последовательный запуск звёзд: задержка 200ms между каждой
  for (let i=1;i<=stars;i++) {
    (function(idx){
      setTimeout(()=>{
        const el=document.getElementById(`win-star-${idx}`);
        if (!el) return;
        el.classList.add('earned');
        SFX.reward();
        // Вспышка после приземления (~700ms)
        setTimeout(()=>{
          el.style.transform='scale(1)';
          el.style.opacity='1';
          el.style.animation='starPulse .3s ease-out forwards';
          setTimeout(()=>{ el.style.animation='none'; },350);
        }, 720);
      }, 100 + (idx-1)*550);
    })(i);
  }
  // Пустые звёзды — сразу статичные
  for (let i=stars+1;i<=3;i++) {
    (function(idx){
      setTimeout(()=>{
        const el=document.getElementById(`win-star-${idx}`);
        if (el) el.classList.add('empty');
      }, 100 + (idx-1)*550);
    })(i);
  }

  // Звёзды летят к счётчику после приземления (задержка: последняя звезда ~1800ms)
  setTimeout(() => flyStarsToCounter(stars), 100 + (stars - 1) * 550 + 820);

  // Разблокировать кнопки через 3500ms
  setTimeout(()=>{
    if (btns) { btns.style.opacity='1'; btns.style.pointerEvents=''; }
    const nextBtn=document.getElementById('btn-next-level');
    if (nextBtn&&nextBtn.style.display!=='none') nextBtn.classList.add('pulsing');
    startConfetti();
  }, 3500);
}

// летящие звёзды от win-звёзд к счётчику
function flyStarsToCounter(numStars) {
  const counterEl = document.getElementById('win-total-stars');
  if (!counterEl) return;
  const baseStar = Math.max(0, getTotalStars() - numStars);
  counterEl.style.display = '';
  counterEl.textContent = `⭐ ${baseStar}`;
  const FREQS = [440, 523, 659];
  const DELAYS = [0, 400, 800];
  let count = baseStar;
  for (let i = 0; i < numStars; i++) {
    ((idx) => {
      setTimeout(() => {
        const srcEl = document.getElementById(`win-star-${idx+1}`);
        if (!srcEl || !counterEl) return;
        const sr = srcEl.getBoundingClientRect();
        const dr = counterEl.getBoundingClientRect();
        const sx = sr.left + sr.width/2, sy = sr.top + sr.height/2;
        const tx = dr.left + dr.width/2, ty = dr.top + dr.height/2;
        const cx = (sx+tx)/2 + (sx>tx?-50:50), cy = (sy+ty)/2 - 80;
        const fly = document.createElement('span');
        fly.textContent = '⭐';
        fly.style.cssText = 'position:fixed;font-size:24px;pointer-events:none;z-index:99999;transform:translate(-50%,-50%);';
        fly.style.left = sx+'px'; fly.style.top = sy+'px';
        document.body.appendChild(fly);
        const dur = 600, t0 = performance.now();
        (function step(now) {
          const p = Math.min((now-t0)/dur, 1), q = 1-p;
          fly.style.left = (q*q*sx + 2*q*p*cx + p*p*tx)+'px';
          fly.style.top  = (q*q*sy + 2*q*p*cy + p*p*ty)+'px';
          fly.style.transform = `translate(-50%,-50%) scale(${1+0.4*Math.sin(p*Math.PI)})`;
          fly.style.opacity = p>0.8 ? String(1-(p-0.8)/0.2) : '1';
          if (p < 1) { requestAnimationFrame(step); return; }
          fly.remove();
          count++;
          counterEl.textContent = `⭐ ${count}`;
          counterEl.style.animation = 'none';
          void counterEl.offsetWidth;
          counterEl.style.animation = 'winStarBounce 0.45s cubic-bezier(.2,1.4,.4,1) forwards';
          SFX._tone(FREQS[Math.min(idx,2)], 'sine', 0.2, 0.15, 0);
        })(performance.now());
      }, DELAYS[Math.min(idx,2)]);
    })(i);
  }
}

// bottom-sheet swipe for lose screen
function _setupLoseSwipe() {
  const el = document.getElementById('screen-lose');
  const handle = document.getElementById('lose-drag-handle');
  if (!el || !handle) return;
  el.classList.remove('minimized');
  let startY = 0, dragging = false, startTransY = 0;
  const getTransY = () => { const t = new WebKitCSSMatrix(getComputedStyle(el).transform); return t.m42 || 0; };
  const onStart = (y) => { dragging = true; startY = y; startTransY = getTransY(); el.style.transition = 'none'; };
  const onMove = (y) => {
    if (!dragging) return;
    const dy = Math.max(0, y - startY);
    el.style.transform = `translateY(${dy}px)`;
  };
  const onEnd = (y) => {
    if (!dragging) return; dragging = false;
    el.style.transition = '';
    const dy = Math.max(0, y - startY);
    const thresh = el.offsetHeight * 0.3;
    if (dy > thresh) { el.classList.add('minimized'); el.style.transform = ''; }
    else { el.classList.remove('minimized'); el.style.transform = ''; }
  };
  handle.onmousedown  = (e) => { e.preventDefault(); onStart(e.clientY); };
  document.onmousemove = (e) => onMove(e.clientY);
  document.onmouseup   = (e) => onEnd(e.clientY);
  handle.ontouchstart  = (e) => { onStart(e.touches[0].clientY); };
  handle.ontouchmove   = (e) => { e.preventDefault(); onMove(e.touches[0].clientY); };
  handle.ontouchend    = (e) => { onEnd(e.changedTouches[0].clientY); };
  // tap on minimized to restore
  el.addEventListener('click', (e) => {
    if (el.classList.contains('minimized') && e.target !== handle) {
      el.classList.remove('minimized');
    }
  }, { capture: true });
}

function showLose() {
  state.recentResults = [...(state.recentResults||[]), 'lose'].slice(-5);
  spendLife();
  state.lossStreak++;
  state.totalLosses++;
  state.rainbowStreak = 0;
  // Счётчик попыток на уровне (для динамического оффера)
  state.levelAttempts[state.currentLevel] = (state.levelAttempts[state.currentLevel] || 0) + 1;
  saveGame();

  const nearMiss = getNearMissProgress();
  const close = isCloseToWin();

  // lives remaining row
  const livesRow = document.getElementById('lose-lives-row');
  if (livesRow) {
    if (!hasInfiniteLives()) {
      const lv = state.lives || 0;
      livesRow.textContent = `❤️ Осталось: ${lv} / ${MAX_LIVES}`;
      livesRow.style.display = '';
    } else {
      livesRow.style.display = 'none';
    }
  }

  // Заголовок и подзаголовок
  document.getElementById('lose-title').textContent = nearMiss >= 0.80 ? '🔥 Почти!' : '💔 Провал';
  document.getElementById('lose-sub').textContent = 'Ходы закончились';

  // Near-miss блок
  const nmEl = document.getElementById('lose-near-miss');
  const hintEl = document.getElementById('lose-progress-hint');
  const pbWrap = document.getElementById('lose-progress-bar-wrap');
  const pbBar  = document.getElementById('lose-progress-bar');
  const pbLbl  = document.getElementById('lose-progress-label');

  if (nearMiss >= 0.40) {
    // Прогресс-бар
    if (pbWrap) {
      pbWrap.style.display = '';
      pbBar.style.width = '0%';
      const lvl = getLevel(state.currentLevel);
      const icons = { score:'⭐', collect:'💎', ice:'🧊', jelly:'🎀', stone:'🪨', ingredients:'🍎', chocolate:'🍫', soda:'🫧', carpet:'🧡', bears:'🐻' };
      const icon = icons[lvl?.type] || '🎯';
      if (pbLbl) pbLbl.textContent = `${icon} ${Math.round(nearMiss*100)}% выполнено`;
      setTimeout(()=>{ pbBar.style.width = `${Math.round(nearMiss*100)}%`; }, 100);
    }
  } else {
    if (pbWrap) pbWrap.style.display = 'none';
  }

  if (nearMiss >= 0.80) {
    nmEl.style.display = '';
    hintEl.style.display = '';
    hintEl.textContent = 'Ещё совсем чуть-чуть!';
  } else {
    nmEl.style.display = 'none';
    hintEl.style.display = 'none';
  }

  // Блок "+5 ходов" — только если прогресс ≥60% и ещё не использовался в этой попытке
  const showBuyBlock = nearMiss >= 0.6 && !state.extraMovesUsed;
  document.getElementById('lose-buy-block').style.display = showBuyBlock ? '' : 'none';
  if (showBuyBlock) {
    const buyBtn = document.getElementById('btn-buy-moves');
    if (buyBtn) buyBtn.style.boxShadow = nearMiss >= 0.80 ? '0 0 18px #f59e0b' : '';
    document.getElementById('btn-ad-moves').style.display = state.adMovesUsed ? 'none' : '';
  }

  // Анимация разбитого сердца — запускается при показе экрана
  const doShowLose = () => {
    haptic('lose');
    showScreen('lose');
    _setupLoseSwipe();
    // Сброс состояния кнопок и сердца
    const actions = document.getElementById('lose-actions');
    const heart   = document.getElementById('lose-heart');
    if (actions) { actions.style.opacity='0'; actions.style.pointerEvents='none'; }
    if (heart)   { heart.className='result-title'; void heart.offsetWidth; heart.classList.add('breaking'); }
    // Кнопки появляются через 1.8s
    setTimeout(()=>{
      if (actions) { actions.style.opacity='1'; actions.style.pointerEvents=''; }
      // Обратный отсчёт 5 сек на блоке "Продолжить?"
      if (showBuyBlock) {
        const cdEl=document.getElementById('lose-countdown');
        const buyBlock=document.getElementById('lose-buy-block');
        const _cdShake = () => {
          if (!cdEl) return;
          cdEl.classList.remove('clock-shake','clock-shake-strong');
          void cdEl.offsetWidth;
          cdEl.classList.add(parseInt(cdEl.dataset.secs||'5') <= 2 ? 'clock-shake-strong' : 'clock-shake');
        };
        let secs=5;
        if(cdEl) { cdEl.textContent=`Предложение исчезнет через ${secs}с`; cdEl.dataset.secs=secs; _cdShake(); }
        const iv=setInterval(()=>{
          secs--;
          if (secs<=0) { clearInterval(iv); if(buyBlock) buyBlock.style.display='none'; if(cdEl) cdEl.textContent=''; }
          else { if(cdEl) { cdEl.textContent=`Предложение исчезнет через ${secs}с`; cdEl.dataset.secs=secs; _cdShake(); } }
        },1000);
      }
    }, 1800);
    // Retry tip (начиная со 2-й попытки)
    const tipEl = document.getElementById('lose-retry-tip');
    if (tipEl) {
      const attempts = state.levelAttempts[state.currentLevel] || 0;
      if (attempts >= 2) {
        tipEl.textContent = getNextTip();
        tipEl.style.display = '';
      } else {
        tipEl.style.display = 'none';
      }
    }
    if (state.totalLosses === 1) setTimeout(maybeShowStarterPack, 2200);
    setTimeout(() => maybeShowLossOffer(state.currentLevel), 2400);
  };

  if (!state.noAds && state.lossStreak % 3 === 0) {
    SDK.showInterstitial(() => doShowLose());
  } else {
    doShowLose();
  }
}

function getNearMissProgress() {
  const lvl = getLevel(state.currentLevel);
  switch(lvl.type) {
    case 'score':   return state.score / lvl.target;
    case 'collect': { let t=0; lvl.gems.forEach(g=>t+=(state.collectedGems[g]||0)); return t/lvl.target; }
    case 'ice':     return state.iceBroken / lvl.target;
    case 'stone':   return state.stonesBroken / lvl.target;
    case 'jelly':        return state.jellyTotal>0 ? 1 - countJellyRemaining()/state.jellyTotal : 0;
    case 'ingredients':  return state.ingredientsDelivered / lvl.target;
    case 'soda':         return lvl.target > 0 ? state.bottlesBroken / lvl.target : 0;
    case 'chocolate': { const ini=state.chocolateInitial||1; return Math.max(0, 1 - countChocolateRemaining()/ini); }
    case 'carpet':    { const tot=state.carpetTotal||1; return Math.max(0, 1 - countCarpetRemaining()/tot); }
  }
  return 0;
}

function isCloseToWin() {
  const lvl = getLevel(state.currentLevel);
  let progress = 0;
  switch(lvl.type) {
    case 'score':   progress = state.score / lvl.target; break;
    case 'collect': { let t=0; lvl.gems.forEach(g=>t+=(state.collectedGems[g]||0)); progress=t/lvl.target; break; }
    case 'ice':     progress = state.iceBroken / lvl.target; break;
    case 'stone':   progress = state.stonesBroken / lvl.target; break;
    case 'jelly':        progress = state.jellyTotal>0 ? 1 - countJellyRemaining()/state.jellyTotal : 0; break;
    case 'ingredients':  progress = state.ingredientsDelivered / lvl.target; break;
    case 'soda':         progress = lvl.target > 0 ? state.bottlesBroken / lvl.target : 0; break;
    case 'chocolate': { const ini=state.chocolateInitial||1; progress = Math.max(0, 1 - countChocolateRemaining()/ini); break; }
    case 'carpet':    { const tot=state.carpetTotal||1; progress = Math.max(0, 1 - countCarpetRemaining()/tot); break; }
    case 'bears':     { progress = Math.min((state.bearsFreed||0)/(lvl.bearsTarget||lvl.honeyCount||1), 1); break; }
  }
  // На spike-уровнях (26+) показываем даже при 60% — провоцируем покупку
  const threshold = state.currentLevel >= 26 ? 0.60 : 0.70;
  return progress >= threshold;
}

function buyMoreMoves() {
  if (state.crystals<30) { showToast('Недостаточно кристаллов'); return; }
  state.crystals-=30; state.moves+=5; state.extraMovesUsed=true; saveGame();
  state.busy=false;
  showScreen('game'); updateHUD();
  setTimeout(()=>showToast('➕ +5 ходов!'), 300);
}

function watchAdMoves() {
  SDK.showRewarded(
    () => {
      state.adMovesUsed = true; state.extraMovesUsed = true;
      state.moves += 5;
      saveGame();
      state.busy=false;
      showScreen('game'); updateHUD();
      setTimeout(()=>showToast('➕ +5 ходов!'), 300);
    },
    () => {}
  );
}

function buyContinueCrystals() {
  if (state.crystals<2) { showToast(t('toast_not_enough_crystals')); return; }
  state.crystals-=2; state.moves+=3; saveGame();
  state.busy=false;
  showScreen('game'); updateHUD();
}

function nextLevel() { if (state.currentLevel<LEVELS.length) selectLevel(state.currentLevel+1); }
function retryLevel() { selectLevel(state.currentLevel); }
function skipLevel() {
  if (state.crystals < 30) { showToast('Нужно 30 💎 для пропуска'); return; }
  state.crystals -= 30;
  // Засчитываем прохождение с 1 звездой
  const prev=state.levelStars[state.currentLevel]||0;
  state.levelStars[state.currentLevel]=Math.max(prev,1);
  if (state.currentLevel>=state.maxUnlocked) state.maxUnlocked=state.currentLevel+1;
  saveGame();
  showToast('Уровень пропущен!');
  if (state.currentLevel<LEVELS.length) selectLevel(state.currentLevel+1);
  else showScreen('menu');
}

// ══════════════════════════════════════════
//  ЗАПУСК УРОВНЯ
// ══════════════════════════════════════════
function startLevel() {
  // Монетные бустеры
  let totalCost=0;
  state.activeBoosters.forEach(id=>{ const b=BOOSTERS.find(x=>x.id===id); if(b) totalCost+=b.cost; });
  if (state.coins<totalCost) { showToast(t('toast_no_boosters')); return; }
  state.coins-=totalCost;
  // Кристалл-бустеры
  let crystalCost=0;
  state.activePreBoosters.forEach(id=>{ const b=PRE_BOOSTERS.find(x=>x.id===id); if(b) crystalCost+=b.cost; });
  if (state.crystals<crystalCost) { showToast('Недостаточно кристаллов!'); return; }
  state.crystals-=crystalCost;
  saveGame();
  playLevel(state.currentLevel, true);
}

function playLevel(n, fresh) {
  _setChapterBg(_getLayerIdxForLevel(n));
  if (COLS !== 8 || ROWS !== 10) { COLS = 8; ROWS = 10; }
  state._testLevel = false;
  const lvl=getLevel(n);
  if (fresh) {
    // Track first-attempt flag BEFORE incrementing levelAttempts (that happens in showLose)
    state._firstAttemptLevel = (state.levelAttempts[n] || 0) === 0 ? n : -1;
    state.moves=lvl.moves; state.score=0;
    state.collectedGems={}; state.iceBroken=0; state.stonesBroken=0;
    state.comboCount=0; state.adMovesUsed=false; state.extraMovesUsed=false; state.ingredientsDelivered=0;
    state.chocolateInitial=0; state.sodaLevel=0; state.bottlesBroken=0; state._winShowing=false; state.bearsFreed=0; state._inBonusExplosion=false;
    if (state.rainbowRound) { state.rainbowRound.active=false; state.rainbowRound.movesLeft=0; }
    state.lastSwap=null; state.undoUsedThisLevel=false; state.activeIngameBooster=null; state._swapFirst=null; hideGestureHint();
    state.buffPieces=0; state.buffNukeReady=false; state.buffNukeActive=false;
    state.supersonicActive=false; state.supersonicMovesLeft=0;
    // reset sidekick charge on new level
    if (state.sidekick.id) { state.sidekick.charge = 0; }
    setTimeout(updateRainbowRoundHUD, 50);
    setTimeout(updateBuffBar, 100);
    setTimeout(() => {
      _updateSupersonicHUD();
      const ssBtn = document.getElementById('hbst-supersonic');
      if (ssBtn) ssBtn.style.display = getTotalStars() >= 20 ? '' : 'none';
    }, 100);
    setTimeout(_updateUndoBtn, 0);
    // jellyGrid, carpetGrid и holes инициализируются внутри initBoard
    state.jellyTotal=0; state.carpetTotal=0;
    _matchEpoch++; // прерываем любые зависшие async-операции предыдущего уровня
    particles.length=0; // сбрасываем частицы от предыдущего уровня
    state.board=initBoard(lvl);
    clearInitialMatches(state.board); // убираем совпадения до старта
    state.jellyTotal=countJellyRemaining(); // фиксируем стартовое кол-во слоёв
    state.chocolateInitial=countChocolateRemaining(); // фиксируем шоколад на старте
  }
  state.busy=false; state.paused=false;
  showScreen('game'); resizeCanvas(); updateHUD(); updateGoalProgress();
  // Бустеры применяем ПОСЛЕ resizeCanvas — иначе cellSize=0 и fillFromTop ломает анимацию
  if (fresh) applyBoosters();
  drawBoard();
  if (fresh) {
    animateBoardEntry();
    const _t = getDifficultyTier(lvl);
    if (_t >= 1) setTimeout(() => _showDifficultyBanner(_t), 350);
  }
  showHintArrow(n);
  resetHintTimer();
}

function applyBoosters() {
  if (state.activeBoosters.includes('lightning')) {
    // Убираем первый ряд, правильно считаем камни/шоколад
    for (let c=0;c<COLS;c++) {
      const cl=state.board[0][c]; if (!cl) continue;
      if (cl.stone) { cl.stone=false; state.stonesBroken++; }
      else if (cl.chocolate) { state.chocolateBrokenThisMove=true; state.chocolateInitial=Math.max(0,(state.chocolateInitial||0)-1); }
      state.board[0][c]=null;
    }
    applyGravity(); fillFromTop();
  }
  if (state.activeBoosters.includes('bomb')) {
    // Центральный взрыв 3×3, камни считаются
    for (let r=2;r<=4;r++) for (let c=2;c<=4;c++) {
      const cl=state.board[r][c]; if(!cl) continue;
      if(cl.stone){cl.stone=false;state.stonesBroken++;}
      state.board[r][c]=null;
    }
    applyGravity(); fillFromTop();
  }
  if (state.activeBoosters.includes('shuffle')) {
    // Перемешиваем типы
    const types=[]; const pos=[];
    for (let r=0;r<ROWS;r++) for (let c=0;c<COLS;c++) {
      const cl=state.board[r][c]; if(cl&&!cl.stone){ types.push(cl.type); pos.push([r,c]); }
    }
    shuffleArray(types);
    pos.forEach(([r,c],i)=>state.board[r][c].type=types[i]);
  }
  if (state.activeBoosters.includes('color')) {
    // Убираем все фишки типа 0 (рубины)
    for (let r=0;r<ROWS;r++) for (let c=0;c<COLS;c++)
      if (state.board[r][c]?.type===0) state.board[r][c]=null;
    applyGravity(); fillFromTop();
  }
  state.activeBoosters=[];

  // Кристалл-бустеры старта
  if (state.activePreBoosters.includes('extra_moves')) {
    state.moves = (state.moves || 0) + 3;
  }
  if (state.activePreBoosters.includes('rainbow_gem')) {
    const free=[];
    for (let r=0;r<ROWS;r++) for (let c=0;c<COLS;c++) { const cl=state.board[r][c]; if(cl&&!cl.stone&&!cl.mystery&&!cl.locked&&cl.special===SPECIAL.NONE) free.push([r,c]); }
    if (free.length) { const [r,c]=free[Math.floor(Math.random()*free.length)]; state.board[r][c].special=SPECIAL.RAINBOW; state.board[r][c].type=-1; }
  }
  if (state.activePreBoosters.includes('bomb_gem')) {
    const free=[];
    for (let r=0;r<ROWS;r++) for (let c=0;c<COLS;c++) { const cl=state.board[r][c]; if(cl&&!cl.stone&&!cl.mystery&&!cl.locked&&cl.special===SPECIAL.NONE) free.push([r,c]); }
    if (free.length) { const [r,c]=free[Math.floor(Math.random()*free.length)]; state.board[r][c].special=SPECIAL.BOMB; }
  }
  state.activePreBoosters=[];

  // Сбрасываем анимационные смещения — fillFromTop ставит oy=-N*cellSize, но animateDrop не вызывается
  for (let r=0;r<ROWS;r++) for (let c=0;c<COLS;c++) { const cl=state.board[r]?.[c]; if(cl) cl.anim={}; }
  // Убираем совпадения созданные после бустеров
  clearInitialMatches(state.board);
}

// ══════════════════════════════════════════
//  ПАУЗА
// ══════════════════════════════════════════
function togglePause() {
  state.paused=!state.paused;
  const overlay = document.getElementById('pause-overlay');
  overlay.classList.toggle('hidden',!state.paused);
  if (state.paused) refreshPauseSliders();
}

function confirmQuitLevel() {
  const overlay = document.getElementById('quit-level-overlay');
  if (!overlay) { showScreen('menu'); return; }
  // Предупреждение о потере стрика
  const warnEl = document.getElementById('quit-loss-warning');
  const noteEl = document.getElementById('quit-progress-note');
  if (state.rainbowStreak >= 3) {
    warnEl.textContent = `⚡ Вы потеряете серию ×${state.rainbowStreak}`;
    warnEl.style.display = '';
  } else {
    warnEl.style.display = 'none';
  }
  const prog = Math.round(getNearMissProgress() * 100);
  if (prog >= 50) {
    noteEl.textContent = `Вы уже выполнили ${prog}% цели — почти у финиша!`;
  } else {
    noteEl.textContent = 'Прогресс будет сброшен.';
  }
  overlay.style.display = 'flex';
  document.getElementById('pause-overlay').classList.add('hidden');
  state.paused = false;
}

function closeQuitDialog() {
  const overlay = document.getElementById('quit-level-overlay');
  if (overlay) overlay.style.display = 'none';
  state.paused = true;
  document.getElementById('pause-overlay').classList.remove('hidden');
}

function doQuitToMenu() {
  const overlay = document.getElementById('quit-level-overlay');
  if (overlay) overlay.style.display = 'none';
  state.rainbowStreak = 0;
  showScreen('menu');
}

function refreshPauseSliders() {
  const ms = document.getElementById('slider-music');
  const mv = document.getElementById('slider-music-val');
  const ss = document.getElementById('slider-sfx');
  const sv = document.getElementById('slider-sfx-val');
  const vb = document.getElementById('pause-toggle-vibro');
  if (ms) { ms.value = state.musicVol; }
  if (mv) mv.textContent = state.musicVol + '%';
  if (ss) { ss.value = state.sfxVol; }
  if (sv) sv.textContent = state.sfxVol + '%';
  if (vb) { vb.textContent = state.vibroOn ? 'ВКЛ' : 'ВЫКЛ'; vb.className = 'toggle '+(state.vibroOn?'on':'off'); }
}

function setPauseVol(type, val) {
  const n = parseInt(val);
  // Sync both pause overlay and settings screen labels/sliders
  const pauseLabel = document.getElementById('slider-'+type+'-val');
  if (pauseLabel) pauseLabel.textContent = n + '%';
  const pauseSlider = document.getElementById('slider-'+type);
  if (pauseSlider) pauseSlider.value = n;
  const setLabel = document.getElementById('set-slider-'+type+'-val');
  if (setLabel) setLabel.textContent = n + '%';
  const setSlider = document.getElementById('set-slider-'+type);
  if (setSlider) setSlider.value = n;
  if (type === 'music') {
    state.musicVol = n;
    state.musicOn = n > 0;
    BGM._setVol && BGM._setVol(n / 100);
    MENU_BGM._setVol && MENU_BGM._setVol(n / 100);
  } else {
    state.sfxVol = n;
    state.soundOn = n > 0;
  }
  saveGame();
}

function togglePauseVibro() {
  state.vibroOn = !state.vibroOn;
  saveGame();
  refreshPauseSliders();
}

// ══════════════════════════════════════════
//  ПОДСКАЗКИ
// ══════════════════════════════════════════
let _obHideTimer=null;
function showHintArrow(level) {
  const ob=document.getElementById('onboarding-tip');
  // Если туториал уже пройден или нет шага для этого уровня — скрываем
  if (state.tutorialDone) { if(ob) ob.classList.add('hidden'); return; }
  const step=TUTORIAL_STEPS.find(s=>s.level===level);
  if (!step) { if(ob) ob.classList.add('hidden'); return; }

  // Отмечаем как показанный
  if (!state.tutorialSeen) state.tutorialSeen={};
  state.tutorialSeen[level]=true;
  // Если все шаги просмотрены — ставим tutorialDone
  if (TUTORIAL_STEPS.every(s=>state.tutorialSeen[s.level])) {
    state.tutorialDone=true; saveGame();
  }

  const obText=document.getElementById('ob-text');
  if (obText) obText.textContent=step.text;
  if (ob) ob.classList.remove('hidden');
  // Авто-скрытие через 5 сек (но скроется и при первом ходе)
  clearTimeout(_obHideTimer);
  _obHideTimer=setTimeout(()=>{ if(ob) ob.classList.add('hidden'); }, 5000);

  if (step.handFrom && step.handTo) {
    showGestureHint(step.handFrom[0], step.handFrom[1], step.handTo[0], step.handTo[1]);
  } else if (step.autoHint) {
    showAutoHint();
  }
}

// Скрыть онбординг при первом свайпе
function hideOnboarding() {
  clearTimeout(_obHideTimer);
  const ob=document.getElementById('onboarding-tip');
  if (ob && !ob.classList.contains('hidden')) ob.classList.add('hidden');
}

function canSwap(r,c) {
  if (state.holes.has(`${r},${c}`)) return false;
  if ((state.iceGrid[r]?.[c]||0) > 0) return false;
  const cl=state.board[r]?.[c];
  if (!cl) return false;
  if (cl.stone||cl.chocolate||cl.marmalade||cl.ingredient||cl.locked||cl.mystery||(cl.licorice>0)||(cl.chain>0)||(cl.honey>0)) return false;
  return true;
}
function findBestHint() {
  // RAINBOW/COLORING are always valid to swap — find a neighbour
  for (let r=0;r<ROWS;r++) for (let c=0;c<COLS;c++) {
    if (!canSwap(r,c)) continue;
    const sp=state.board[r]?.[c]?.special;
    if (sp===SPECIAL.RAINBOW||sp===SPECIAL.COLORING) {
      for (const [dr,dc] of [[0,1],[1,0],[0,-1],[-1,0]]) {
        const nr=r+dr,nc=c+dc;
        if (nr<0||nr>=ROWS||nc<0||nc>=COLS) continue;
        if (canSwap(nr,nc)) return [r,c,nr,nc];
      }
    }
  }
  for (let r=0;r<ROWS;r++) for (let c=0;c<COLS;c++) for (const [dr,dc] of [[0,1],[1,0]]) {
    const nr=r+dr, nc=c+dc; if(nr>=ROWS||nc>=COLS) continue;
    if (!canSwap(r,c)||!canSwap(nr,nc)) continue;
    doSwap(r,c,nr,nc); const m=findMatches().size; doSwap(r,c,nr,nc);
    if (m>0) return [r,c,nr,nc];
  }
  // Ведро с камнями — можно сдвинуть если партнёр создаёт матч
  for (let r=0;r<ROWS;r++) for (let c=0;c<COLS;c++) for (const [dr,dc] of [[0,1],[1,0]]) {
    const nr=r+dr, nc=c+dc; if(nr>=ROWS||nc>=COLS) continue;
    const cl=state.board[r]?.[c], cl2=state.board[nr]?.[nc];
    if (!cl||!cl2) continue;
    if ((cl.ingredient&&canSwap(nr,nc))||(cl2.ingredient&&canSwap(r,c))) {
      doSwap(r,c,nr,nc); const m=findMatches().size; doSwap(r,c,nr,nc);
      if (m>0) return [r,c,nr,nc];
    }
  }
  return null;
}

// ══════════════════════════════════════════
//  ТОСТ
// ══════════════════════════════════════════
let toastTO=null;
let _toastQueue=[], _toastBusy=false;
function showToast(msg) {
  _toastQueue.push(msg);
  if (!_toastBusy) _processToastQueue();
}
function _processToastQueue() {
  if (!_toastQueue.length) { _toastBusy=false; return; }
  _toastBusy=true;
  const msg=_toastQueue.shift();
  let el=document.getElementById('toast');
  if (!el) {
    el=document.createElement('div');
    el.id='toast';
    el.style.cssText='position:fixed;top:-60px;left:50%;transform:translateX(-50%);'+
      'background:rgba(20,0,30,.92);color:#fff;padding:10px 22px;border-radius:24px;'+
      'font-size:14px;font-weight:700;z-index:200;pointer-events:none;'+
      'border:1px solid rgba(255,140,210,.3);box-shadow:0 4px 18px rgba(0,0,0,.4);'+
      'transition:top .3s cubic-bezier(.2,1,.4,1), opacity .25s;white-space:nowrap;';
    document.body.appendChild(el);
  }
  el.textContent=msg;
  el.style.opacity='1';
  el.style.top='-60px';
  // Slide in
  requestAnimationFrame(()=>{ el.style.top='20px'; });
  const dur=Math.max(2000, msg.length*60);
  clearTimeout(toastTO);
  toastTO=setTimeout(()=>{
    el.style.top='-60px'; el.style.opacity='0';
    setTimeout(()=>_processToastQueue(), 280);
  }, dur);
}

// ══════════════════════════════════════════
//  ШАГ 4: ЗВУК (Web Audio API, без файлов)
// ══════════════════════════════════════════
const SFX = (() => {
  let _ac = null;
  function ac() {
    if (!_ac) _ac = new (window.AudioContext || window.webkitAudioContext)();
    if (_ac.state === 'suspended') _ac.resume();
    return _ac;
  }

  // Основной мастер-компрессор для мягкого звука
  let _master = null;
  function master() {
    if (!_master) {
      const a = ac();
      _master = a.createDynamicsCompressor();
      _master.threshold.value = -18;
      _master.knee.value = 12;
      _master.ratio.value = 4;
      _master.attack.value = 0.003;
      _master.release.value = 0.18;
      _master.connect(a.destination);
    }
    return _master;
  }

  function osc(freq, type, vol, atk, dec, delay=0, pan=0, freqEnd=null) {
    if (!state.soundOn) return;
    try {
      const a = ac(), o = a.createOscillator(), g = a.createGain();
      const dst = pan !== 0 && a.createStereoPanner ? (() => {
        const p = a.createStereoPanner(); p.pan.value = Math.max(-1,Math.min(1,pan));
        g.connect(p); p.connect(master()); return g;
      })() : (g.connect(master()), g);
      o.type = type;
      const t0 = a.currentTime + delay;
      o.frequency.setValueAtTime(freq, t0);
      if (freqEnd !== null) o.frequency.exponentialRampToValueAtTime(freqEnd, t0 + atk + dec);
      g.gain.setValueAtTime(0.001, t0);
      g.gain.linearRampToValueAtTime(vol, t0 + atk);
      g.gain.exponentialRampToValueAtTime(0.001, t0 + atk + dec);
      o.start(t0); o.stop(t0 + atk + dec + 0.02);
    } catch(e) {}
  }

  // Шум (удар, взрыв, пшик)
  function noise(vol, dur, freq_lp=800, delay=0) {
    if (!state.soundOn) return;
    try {
      const a = ac(), sr = a.sampleRate;
      const buf = a.createBuffer(1, sr * 0.3, sr);
      const d = buf.getChannelData(0);
      for (let i=0;i<d.length;i++) d[i] = Math.random()*2-1;
      const src = a.createBufferSource();
      src.buffer = buf;
      const flt = a.createBiquadFilter();
      flt.type = 'bandpass'; flt.frequency.value = freq_lp; flt.Q.value = 0.8;
      const g = a.createGain();
      src.connect(flt); flt.connect(g); g.connect(master());
      const t0 = a.currentTime + delay;
      g.gain.setValueAtTime(vol, t0);
      g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
      src.start(t0); src.stop(t0 + dur + 0.02);
    } catch(e) {}
  }

  // Резонансный шум с высоким Q — кристальный «псевдопитч» без осциллятора
  function noise2(vol, dur, freq, q=4, delay=0) {
    if (!state.soundOn) return;
    try {
      const a = ac(), sr = a.sampleRate;
      const bufLen = Math.ceil(sr * Math.max(dur * 2.5, 0.15));
      const buf = a.createBuffer(1, bufLen, sr);
      const d = buf.getChannelData(0);
      for (let i=0;i<d.length;i++) d[i] = Math.random()*2-1;
      const src = a.createBufferSource();
      src.buffer = buf;
      const flt = a.createBiquadFilter();
      flt.type = 'bandpass'; flt.frequency.value = freq; flt.Q.value = q;
      const g = a.createGain();
      src.connect(flt); flt.connect(g); g.connect(master());
      const t0 = a.currentTime + delay;
      g.gain.setValueAtTime(vol, t0);
      g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
      src.start(t0); src.stop(t0 + dur + 0.05);
    } catch(e) {}
  }

  let _matchV = 0; // счётчик активных голосов match

  return {
    // Матч — кристальный ping самоцвета (только шум!)
    match(lvl=0) {
      if (_matchV >= 4) return;
      _matchV++;
      setTimeout(() => _matchV--, 80);
      const vary = 0.88 + Math.random() * 0.24;
      const f = (900 + lvl * 110) * vary;
      const vol = 0.27 - _matchV * 0.04;

      noise2(vol,        0.046, f,       16); // кристальный ping (Q=16)
      noise2(vol * 0.35, 0.030, f * 1.8, 10); // воздушный обертон
    },

    // Комбо — магический каскадный удар (только шум!)
    combo(n) {
      noise2(0.30 + n * 0.02, 0.18, 180,  2.0);      // чёткий удар
      noise2(0.22,            0.13, 650,  4,   0.02); // магический средний
      noise2(0.12,            0.08, 2500, 7,   0.05); // кристальная искра
    },

    // Спецгем — взрыв самоцвета (только шум!)
    special() {
      noise2(0.40, 0.22, 120,  1.8);
      noise2(0.26, 0.18, 550,  3.0, 0.01); // магическое тело
      noise2(0.18, 0.14, 1800, 5.5, 0.04); // кристальный блеск
      noise2(0.09, 0.08, 4200, 6,   0.07); // яркая искра
    },

    // Клик — яркий кристальный щелчок
    click() {
      noise2(0.20, 0.022, 2400, 16);
      osc(1200, 'sine', 0.05, 0.001, 0.022, 0, 0, 600);
    },

    // Награда — магические колокольчики самоцветов
    reward() {
      [0, 0.09, 0.17].forEach((d, i) => {
        osc(1046 - i * 130, 'triangle', 0.13, 0.003, 0.32, d);
      });
      noise2(0.07, 0.12, 2800, 5, 0.17);
    },

    // Победа — яркий кристальный аккорд
    win() {
      [[0, 659], [0.07, 784], [0.14, 1047]].forEach(([d, f]) =>
        osc(f, 'triangle', 0.13, 0.010, 0.40, d)
      );
      noise2(0.10, 0.14, 2200, 4, 0.14);
    },

    // Поражение — нисходящее «вуп-вуп»
    lose() {
      osc(440, 'sawtooth', 0.11, 0.006, 0.27, 0,    0, 220);
      osc(330, 'sawtooth', 0.11, 0.006, 0.27, 0.22, 0, 165);
      noise2(0.06, 0.17, 270, 2, 0.06);
    },

    // Победный джингл — магическое арпеджио с кристальными искрами
    winJingle() {
      if (!state.soundOn) return;
      const melody = [659, 784, 988, 1319, 988, 1319, 1568, 1976];
      melody.forEach((f, i) => {
        osc(f, 'triangle', 0.12, 0.005, 0.11, i * 0.095);
        if (i % 2 === 0) noise2(0.06, 0.05, 2000 + i * 180, 7, i * 0.095 + 0.01);
      });
      [659, 784, 988, 1319].forEach(f =>
        osc(f, 'triangle', 0.11, 0.02, 0.9, melody.length * 0.095)
      );
      noise2(0.12, 0.22, 2500, 5, melody.length * 0.095);
    },

    // Джингл поражения — нисходящий «ваааа»
    loseJingle() {
      if (!state.soundOn) return;
      const seq = [370, 311, 277, 233, 196];
      seq.forEach((f, i) => osc(f, 'sawtooth', 0.12, 0.01, 0.36, i * 0.25, 0, f * 0.82));
      osc(98, 'sine', 0.07, 0.01, 0.55, seq.length * 0.25);
    },

    // Разрушение льда — острый кристальный треск
    iceBreak() {
      noise2(0.28, 0.09, 3500, 10);
      noise2(0.18, 0.07, 1600,  6, 0.02);
      osc(2400, 'sine', 0.04, 0.001, 0.08, 0, 0, 800);
    },

    // Желе — упругий хлопок
    jellyPop() {
      noise2(0.30, 0.10, 340, 6);
      noise2(0.16, 0.07, 860, 8, 0.02);
    },

    // Мёд — вязкий шлепок
    honeyBreak() {
      noise2(0.32, 0.15, 190, 4);
      noise2(0.18, 0.11, 540, 5, 0.03);
    },

    // Цепь — металлический звон
    chainBreak() {
      noise2(0.28, 0.08, 1100, 11);
      noise2(0.18, 0.12, 420,  6, 0.01);
      osc(850, 'square', 0.035, 0.001, 0.07, 0, 0, 380);
    },

    // Заморозка — ледяной хруст
    frostingBreak() {
      noise2(0.22, 0.09, 3100, 7);
      noise2(0.13, 0.07, 1500, 5, 0.02);
    },

    // Лакрица — резиновый щелчок
    licoriceMatch() {
      noise2(0.26, 0.10, 680, 9);
      noise2(0.14, 0.08, 270, 4, 0.02);
    },

    // JAM — влажный взрыв
    jamBreak() {
      noise2(0.30, 0.13, 230, 5);
      noise2(0.17, 0.10, 500, 6, 0.02);
    },

    // Белый шоколад — хруст
    whiteChocBreak() {
      noise2(0.24, 0.10, 820, 7);
      noise2(0.15, 0.08, 340, 4, 0.02);
    },

    // Сайдкик — магическое восхождение
    sidekickActivate() {
      [0, 0.06, 0.12].forEach((d, i) => {
        osc(523 + i * 262, 'triangle', 0.09, 0.004, 0.18, d);
      });
      noise2(0.12, 0.09, 2200, 6, 0.12);
    },

    // Портал — вихревой кристальный свист
    portalWhoosh() {
      noise2(0.18, 0.16, 900, 4);
      noise2(0.10, 0.12, 3000, 5, 0.04);
      osc(1400, 'sine', 0.05, 0.002, 0.14, 0, 0, 350);
    },

    _tone: (f,t,d,v,delay,pan) => osc(f,t,v,0.005,d,delay||0,pan||0),
    _noise2: (vol, dur, freq, q, delay) => noise2(vol, dur, freq, q||4, delay||0),
  };
})();

// ══════════════════════════════════════════
//  ШАГ 4: СЕЗОННЫЙ ПРОПУСК
// ══════════════════════════════════════════
const SEASON_DURATION_MS = 28 * 24 * 60 * 60 * 1000; // 4 недели
const SEASON_MAX_XP = 30; // 30 уровней → полный трек

// Каждая награда привязана к порогу XP (1..30)
const SEASON_FREE_REWARDS = [
  { xp:1,  icon:'🪙', text:'30 монет',      coins:30 },
  { xp:2,  icon:'❤️', text:'1 жизнь',       lives:1 },
  { xp:4,  icon:'🪙', text:'60 монет',      coins:60 },
  { xp:6,  icon:'💎', text:'3 кристалла',   crystals:3 },
  { xp:8,  icon:'🪙', text:'80 монет',      coins:80 },
  { xp:10, icon:'❤️', text:'2 жизни',       lives:2 },
  { xp:12, icon:'💎', text:'5 кристаллов',  crystals:5 },
  { xp:14, icon:'🪙', text:'100 монет',     coins:100 },
  { xp:16, icon:'❤️', text:'1 жизнь',       lives:1 },
  { xp:18, icon:'💎', text:'8 кристаллов',  crystals:8 },
  { xp:20, icon:'🪙', text:'150 монет',     coins:150 },
  { xp:22, icon:'❤️', text:'2 жизни',       lives:2 },
  { xp:24, icon:'💎', text:'10 кристаллов', crystals:10 },
  { xp:26, icon:'🪙', text:'200 монет',     coins:200 },
  { xp:30, icon:'🎁', text:'500 монет + 20 💎', coins:500, crystals:20 },
];

const SEASON_PREM_REWARDS = [
  { xp:1,  icon:'✨', text:'Скин "Огонь"',      skin:'fire' },
  { xp:2,  icon:'💎', text:'5 кристаллов',     crystals:5 },
  { xp:4,  icon:'💎', text:'10 кристаллов',    crystals:10 },
  { xp:6,  icon:'✨', text:'Скин "Лёд"',        skin:'ice_pal' },
  { xp:8,  icon:'💎', text:'15 кристаллов',    crystals:15 },
  { xp:10, icon:'🦕', text:'Скин "Динозавры"',  skin:'dinos' },
  { xp:12, icon:'💎', text:'20 кристаллов',    crystals:20 },
  { xp:14, icon:'✨', text:'Скин "Космос"',     skin:'space' },
  { xp:16, icon:'💥', text:'3 Взрыва',           booster:'bomb', count:3 },
  { xp:18, icon:'💎', text:'25 кристаллов',    crystals:25 },
  { xp:20, icon:'🐱', text:'Скин "Котики"',     skin:'cats' },
  { xp:22, icon:'🌈', text:'3 Цв. бомбы',       booster:'color', count:3 },
  { xp:24, icon:'💎', text:'30 кристаллов',    crystals:30 },
  { xp:26, icon:'🌸', text:'Скин "Цветы"',      skin:'flowers' },
  { xp:30, icon:'👑', text:'Скин "Неон" + 50💎', crystals:50, skin:'neon' },
];

function initSeason() {
  if (!state.seasonStart || Date.now() - state.seasonStart > SEASON_DURATION_MS) {
    state.seasonStart          = Date.now();
    state.seasonXP             = 0;
    state.seasonFreeClaimedMask = 0;
    state.seasonPremClaimedMask = 0;
    saveGame();
  }
}

function addSeasonXP(n) {
  state.seasonXP = Math.min(SEASON_MAX_XP, state.seasonXP + n);
  saveGame();
}

function seasonTimeLeft() {
  return Math.max(0, state.seasonStart + SEASON_DURATION_MS - Date.now());
}

function refreshSeason() {
  initSeason();
  document.getElementById('sea-coins').textContent    = state.coins;
  document.getElementById('sea-crystals').textContent = state.crystals;

  const xp = state.seasonXP;
  document.getElementById('season-xp-bar').style.width  = (xp / SEASON_MAX_XP * 100) + '%';
  document.getElementById('season-xp-label').textContent = `${xp} / ${SEASON_MAX_XP} XP`;
  document.getElementById('season-timer').textContent    = 'Осталось: ' + formatMs(seasonTimeLeft());

  // Строим трек
  const container = document.getElementById('season-tracks');
  container.innerHTML = '';

  const freeCol = document.createElement('div');
  freeCol.className = 'season-track';
  freeCol.innerHTML = '<div class="season-track-head">🎁 Бесплатно</div>';

  const premCol = document.createElement('div');
  premCol.className = 'season-track';
  premCol.innerHTML = `<div class="season-track-head premium">👑 Премиум</div>`;

  SEASON_FREE_REWARDS.forEach((r, i) => {
    const claimed   = !!(state.seasonFreeClaimedMask & (1 << i));
    const canClaim  = !claimed && xp >= r.xp;
    const div = document.createElement('div');
    div.className = 'season-reward' + (claimed ? ' claimed' : canClaim ? ' claimable' : xp < r.xp ? ' locked' : '');
    div.innerHTML = `<span class="sr-icon">${r.icon}</span><span>${r.text}</span><span class="sr-lvl">${r.xp}XP</span>${claimed ? '<span class="sr-check">✓</span>' : ''}`;
    if (canClaim) div.onclick = () => claimSeasonReward('free', i);
    freeCol.appendChild(div);
  });

  SEASON_PREM_REWARDS.forEach((r, i) => {
    const claimed   = !!(state.seasonPremClaimedMask & (1 << i));
    const canClaim  = !claimed && xp >= r.xp && state.seasonPremium;
    const div = document.createElement('div');
    div.className = 'season-reward' + (claimed ? ' claimed' : !state.seasonPremium ? ' locked' : canClaim ? ' claimable' : xp < r.xp ? ' locked' : '');
    div.innerHTML = `<span class="sr-icon">${r.icon}</span><span>${r.text}</span><span class="sr-lvl">${r.xp}XP</span>${claimed ? '<span class="sr-check">✓</span>' : !state.seasonPremium ? '<span style="font-size:10px;color:#555">🔒</span>' : ''}`;
    if (canClaim) div.onclick = () => claimSeasonReward('prem', i);
    premCol.appendChild(div);
  });

  container.appendChild(freeCol);
  container.appendChild(premCol);

  // Кнопка покупки премиума
  const buyWrap = document.getElementById('season-buy-wrap');
  if (!state.seasonPremium) {
    buyWrap.innerHTML = `<button class="btn btn-gold" style="width:100%" onclick="buySeasonPremium()">👑 Премиум трек — 199 ₽</button><div style="color:#a78bfa;font-size:12px;text-align:center;margin-top:4px;">Эксклюзивные скины и кристаллы</div>`;
  } else {
    buyWrap.innerHTML = '';
  }
}

function claimSeasonReward(track, idx) {
  const rewards = track === 'free' ? SEASON_FREE_REWARDS : SEASON_PREM_REWARDS;
  const r = rewards[idx];
  if (!r) return;
  if (track === 'free')  state.seasonFreeClaimedMask |= (1 << idx);
  else                   state.seasonPremClaimedMask |= (1 << idx);
  if (r.coins)    state.coins    += r.coins;
  if (r.crystals) state.crystals += r.crystals;
  if (r.lives)    state.lives = Math.min(MAX_LIVES, state.lives + r.lives);
  saveGame();
  SFX.reward();
  showToast('✓ ' + r.text);
  refreshSeason();
}

function buySeasonPremium() {
  SDK.purchase('season_pass',
    () => { state.seasonPremium = true; saveGame(); refreshSeason(); showToast('👑 Премиум трек активирован!'); },
    () => {}
  );
}

// ══════════════════════════════════════════
//  ШАГ 4: ЕЖЕНЕДЕЛЬНЫЙ ТУРНИР
// ══════════════════════════════════════════
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

// Фейковые участники для локальной таблицы (имитируют реальных)
const FAKE_PLAYERS = [
  'Саша_77','GemQueen','ПазлМастер','LenaStar','КомбоКороль',
  'IceBreakerM','OgnekVanya','CrystalFox','РубинОхотник','MaxDiamond',
  'Золотая_Роза','JulyEmerald','AquaTop','АметистГриша','FastMax',
  'NightWolf','MegaCombo','GemHero','LuckyBlast','TopShooter',
  'AnnaPuzzle','KirilDragon','МишаБластер','OlyCrystal','SergeyPro',
  'ВикаБласт','Alex_Gems','ТаняКомбо','PeterStorm','ЮляТоп99',
  'BlastMaster','Кристина_М','SkyRocket','ДашаGems','CoolPlayer',
];
// Очки ботов обновляются между визитами игрока (хранятся в state)
function getBotScores() {
  if (!state.botScores) {
    const seed=state.tournWeekStart||Date.now();
    state.botScores=FAKE_PLAYERS.map((name,i)=>({
      name,
      base: ((seed^(i*2654435761))>>>0)%30000+5000,
      growRate: 8000 + Math.floor(((seed^(i*1234567))>>>0) % 12000)
    }));
  }
  return state.botScores;
}
function updateBotScores() {
  const bots=getBotScores();
  const hoursSinceStart=Math.max(0,(Date.now()-state.tournWeekStart)/3600000);
  const playerScore=state.tournScore||0;
  // Топ-3 бота конкурируют с игроком, остальные отстают
  bots.forEach((b,i)=>{
    const factor = i===0 ? 0.88 : i===1 ? 0.78 : i===2 ? 0.68 : 0.20 + (i%7)*0.06;
    const timeGrowth = Math.floor(hoursSinceStart * b.growRate / 24);
    const playerRef  = Math.floor(playerScore * factor);
    b.score = b.base + Math.max(timeGrowth, playerRef);
  });
}

function getWeekStart() {
  const now  = new Date();
  const day  = now.getDay(); // 0=Sun,1=Mon...
  const diff = (day === 0 ? 6 : day - 1); // дни с понедельника
  const mon  = new Date(now); mon.setHours(0,0,0,0); mon.setDate(now.getDate()-diff);
  return mon.getTime();
}

function initTournament() {
  const weekStart = getWeekStart();
  if (state.tournWeekStart !== weekStart) {
    // Новая неделя — проверяем итоги прошлой
    if (state.tournWeekStart > 0 && !state.tournEndChecked) {
      checkTournamentEnd();
    }
    state.tournWeekStart  = weekStart;
    state.tournScore      = 0;
    state.tournEndChecked = false;
    state.botScores       = null; // сбросить ботов на новую неделю
    saveGame();
  }
}

function addTournScore(pts) {
  initTournament();
  state.tournScore += pts;
  saveGame();
}

function tournTimeLeft() {
  return Math.max(0, state.tournWeekStart + WEEK_MS - Date.now());
}

function saveTopScore(score) {
  if (!score) return;
  try {
    const key='gg_top_scores';
    const saved=JSON.parse(localStorage.getItem(key)||'[]');
    saved.push({ score, date: new Date().toLocaleDateString('ru') });
    saved.sort((a,b)=>b.score-a.score);
    localStorage.setItem(key, JSON.stringify(saved.slice(0,5)));
  } catch(e) {}
}
function getTopScores() {
  try { return JSON.parse(localStorage.getItem('gg_top_scores')||'[]'); } catch(e) { return []; }
}

function buildLocalLeaderboard() {
  updateBotScores();
  const entries = getBotScores().map(b=>({ name:b.name, score:b.score, me:false }));
  // Добавляем сохранённые топ-5 реальных результатов как отдельные строки
  getTopScores().forEach((e,i)=>{
    if (i>0) entries.push({ name:`⭐ Вы (${e.date})`, score:e.score, me:false, real:true });
  });
  entries.push({ name: '▶ Вы', score: state.tournScore, me: true });
  entries.sort((a,b) => b.score - a.score);
  return entries.slice(0, 20);
}

function refreshTournament() {
  initTournament();
  document.getElementById('tn-coins').textContent    = state.coins;
  document.getElementById('tn-crystals').textContent = state.crystals;
  document.getElementById('tourn-timer').textContent  = 'Обновление через: ' + formatMs(tournTimeLeft());
  document.getElementById('tourn-my-pts').textContent = state.tournScore.toLocaleString();

  // Пробуем загрузить реальный лидерборд из Яндекса, иначе используем локальный
  SDK.getLeaderboard(entries => {
    let board;
    if (entries.length > 0) {
      board = entries.map((e, i) => ({
        name:  e.player?.publicName || `Игрок ${i+1}`,
        score: e.score,
        me:    e.player?.uniqueID === 'me', // Яндекс SDK помечает своего игрока
        rank:  e.rank,
      }));
    } else {
      board = buildLocalLeaderboard();
    }
    renderTournTable(board);
  });
}

function renderTournTable(board) {
  const table = document.getElementById('tourn-table');
  table.innerHTML = '';
  const rankIcons = ['🥇','🥈','🥉'];
  const prizes    = [50, 25, 10]; // кристаллов
  board.forEach((p, i) => {
    const rank = p.rank ?? i + 1;
    const div  = document.createElement('div');
    const topCls = i < 3 ? ` top${i+1}` : '';
    div.className = 'tourn-row' + (p.me ? ' me' : '') + topCls;
    const prizeHtml = rank <= 3 ? `<span class="tourn-prize">+${prizes[rank-1]}💎</span>` : '';
    div.innerHTML = `
      <span class="tourn-rank">${rankIcons[i] ?? rank}</span>
      <span class="tourn-name">${p.name}</span>
      <span class="tourn-score">${p.score.toLocaleString()}</span>
      ${prizeHtml}
    `;
    table.appendChild(div);
  });
}

function checkTournamentEnd() {
  // Сохраняем результат турнира в локальный топ
  if (state.tournScore > 0) saveTopScore(state.tournScore);
  // Определяем позицию игрока в прошлой неделе
  const board = buildLocalLeaderboard();
  const myIdx = board.findIndex(p => p.me);
  const rank  = myIdx + 1;
  if (rank <= 3) {
    const prizes = [50, 25, 10];
    state.crystals += prizes[rank - 1];
    saveGame();
    setTimeout(() => showTournEndPopup(rank, prizes[rank-1]), 1200);
  }
  state.tournEndChecked = true;
  saveGame();
}

function showTournEndPopup(rank, prize) {
  const rankLabels = ['🥇 1-е место!', '🥈 2-е место!', '🥉 3-е место!'];
  document.getElementById('tourn-end-rank').textContent  = rankLabels[rank-1] ?? `#${rank}`;
  document.getElementById('tourn-end-sub').textContent   = 'Вы вошли в топ-3 за неделю!';
  const skinBonus = rank === 1 ? '\n🎨 + эксклюзивный скин!' : '';
  document.getElementById('tourn-end-reward').textContent= `+${prize} 💎${skinBonus}`;
  if (rank === 1) showToast('🎨 Скин разблокирован за 1-е место!');
  document.getElementById('popup-tourn-end').classList.remove('hidden');
  SFX.win();
}

function closeTournEndPopup() {
  document.getElementById('popup-tourn-end').classList.add('hidden');
  refreshMenu();
}

