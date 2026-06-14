// ══════════════════════════════════════════
//  ШАГ 4: PUSH-УВЕДОМЛЕНИЯ (Яндекс SDK)
// ══════════════════════════════════════════
async function setupPushNotifications() {
  // Яндекс Games SDK: notifications API (если поддерживается платформой)
  // Документация: https://yandex.ru/dev/games/doc/dg/sdk/sdk-notify.html
  if (!SDK.isReady()) return;
  try {
    // Запрашиваем разрешение только если ещё не спрашивали
    // ysdk.notifications.requestPermission() — в будущих версиях SDK
    // Пока используем ysdk.shortcut для напоминаний
    // Placeholder: реальный API зависит от версии SDK Яндекс Игр
    console.log('[Push] Push notifications: TODO при наличии API в SDK');
  } catch(e) {}
}

// ══════════════════════════════════════════
//  ШАГ 4: ПРОДУКТ season_pass В МАГАЗИНЕ
// ══════════════════════════════════════════
// Добавляем в PRODUCT_REWARDS
PRODUCT_REWARDS['season_pass'] = () => { state.seasonPremium = true; };

// ══════════════════════════════════════════
//  ШАГ 4: ИНТЕГРАЦИЯ ЗВУКОВ В ГЕЙМПЛЕЙ
// ══════════════════════════════════════════
// Патчим функции звуком (вызываем SFX в нужных местах)
const _origProcessMatches = processMatches;
// Звук матча вызывается внутри processMatches → делаем через хук на spawnParticles
const _origSpawnParticles = spawnParticles;

const _origShowCombo = showCombo;
// eslint-disable-next-line no-func-assign
showCombo = function(n) {
  _origShowCombo(n);
  SFX.combo(n);
  if (n >= 2) { showCandyComment(n); }
};

const _origSpawnScreenShake = spawnScreenShake;
// eslint-disable-next-line no-func-assign
spawnScreenShake = function() {
  _origSpawnScreenShake();
  SFX.special();
};

const _origShowWin  = showWin;
// eslint-disable-next-line no-func-assign
showWin = function() {
  SFX.win();
  _origShowWin();
  // показать ежедневный сундук через 4.5s после победы
  if (shouldShowDailyChest()) {
    setTimeout(showDailyChest, 4500);
  }
};

const _origShowLose = showLose;
// eslint-disable-next-line no-func-assign
showLose = function() { SFX.lose(); _origShowLose(); };

// Клик по кнопкам
document.addEventListener('click', e => {
  if (e.target.classList.contains('btn')) SFX.click();
});

// ══════════════════════════════════════════
//  ШАГ 4: ТАЙМЕР СЕЗОНА И ТУРНИРА
// ══════════════════════════════════════════
function step4TickLoop() {
  // Обновляем таймеры если открыты соответствующие экраны
  if (state.screen === 'season') {
    const el = document.getElementById('season-timer');
    if (el) el.textContent = 'Осталось: ' + formatMs(seasonTimeLeft());
  }
  if (state.screen === 'tournament') {
    const el = document.getElementById('tourn-timer');
    if (el) el.textContent = 'Обновление через: ' + formatMs(tournTimeLeft());
  }
  setTimeout(step4TickLoop, 1000);
}

// ══════════════════════════════════════════
//  GAME LOOP
// ══════════════════════════════════════════
// Реестр оверлеев: анимации регистрируют функцию рисованья вместо своего drawBoard()
const _animOverlays = new Map();
let _animOverlayId = 0;
function gameLoop(now) {
  try {
    if (state.screen==='game') {
      drawBoard();
      updateParticles();
    }
    // Run overlay callbacks even off-screen so pending promises can detect screen change and resolve
    if (_animOverlays.size > 0) {
      for (const [id, fn] of [..._animOverlays]) {
        try { fn(now); }
        catch(e) { console.error('[DBG] overlay error id=' + id + ':', e); _animOverlays.delete(id); }
      }
    }
  } catch(e) {
    console.error('[DBG] gameLoop error:', e);
  }
  requestAnimationFrame(gameLoop);
}

// ══════════════════════════════════════════
//  ТАЙМЕР ЖИЗНЕЙ (тикает каждую секунду)
// ══════════════════════════════════════════
function livesTickLoop() {
  tickLives();
  if (state.screen==='menu')   updateLivesTimerDisplay('m-lives-timer');
  if (state.screen==='game')   {}
  // Обновляем popup если открыт
  if (!document.getElementById('popup-no-lives').classList.contains('hidden'))
    updateNoLivesTimer();
  setTimeout(livesTickLoop, 1000);
}

// ══════════════════════════════════════════
//  ОЧЕРЕДЬ СТАРТОВЫХ ПОПАПОВ (без наложения)
// ══════════════════════════════════════════
// Каждый попап показывается ПО ОДНОМУ: следующий открывается только
// после закрытия предыдущего. Видимость определяем по offsetParent —
// работает и для класса 'hidden', и для 'show'.
const _startupPopups = [];
let _startupBusy = false;
function queueStartupPopup(id, openFn, prio = 50) { _startupPopups.push({ id, openFn, prio }); }
function runStartupPopups() {
  if (_startupBusy) return;
  _startupPopups.sort((a, b) => a.prio - b.prio);
  const next = _startupPopups.shift();
  if (!next) return;
  _startupBusy = true;
  try { next.openFn(); } catch (e) { console.error('[popupQueue]', e); }
  const el = document.getElementById(next.id);
  if (!el) { _startupBusy = false; return runStartupPopups(); }
  let sawVisible = false, ticks = 0;
  const iv = setInterval(() => {
    ticks++;
    const vis = el.offsetParent !== null;
    if (vis) sawVisible = true;
    if ((sawVisible && !vis) || (!sawVisible && ticks > 16)) {
      clearInterval(iv);
      _startupBusy = false;
      setTimeout(runStartupPopups, 400);
    }
  }, 250);
}

// ══════════════════════════════════════════
//  ЗАГРУЗКА
// ══════════════════════════════════════════
async function loadingScreen() {
  const bar = document.getElementById('loading-bar');

  // Fire everything at t=0 so downloading overlaps with the bar animation
  const curLevel = (state && state.currentLevel) || 1;
  const curChunk = Math.max(1, Math.ceil(curLevel / 1000));
  const metaLoad  = _loadScript('levels-meta.js');
  const firstLoad = metaLoad.then(() => _loadScript(`levels-c${String(curChunk).padStart(3,'0')}.js`));
  const sdkReady  = SDK.init();

  // Bar 0→88% over ~660ms — runs while the chunk downloads in the background
  let essentialDone = false;
  Promise.all([sdkReady, firstLoad]).then(() => { essentialDone = true; });

  for (let p = 0; p <= 88; p += 2) { bar.style.width = p + '%'; await sleep(15); }

  // If chunk still loading, pulse gently at ~88% instead of freezing
  while (!essentialDone) {
    bar.style.width = (86 + Math.sin(Date.now() / 250) * 2) + '%';
    await sleep(40);
  }
  patchLevelBalance();
  bar.style.width = '90%';

  loadGame();
  loadTexturePack();
  applyLang();
  await syncCloud();

  for (let p = 90; p <= 97; p += 3) { bar.style.width = p + '%'; await sleep(25); }

  await restorePaidItems();

  bar.style.width = '100%';
  await sleep(200);

  processLoginStreak();
  generateDailyQuests();
  renderQuestsRow();

  showScreen('menu'); // ← music starts here via showScreen hook

  await postLoadInit().catch(e => console.error('[postLoadInit]', e)); // ставит в очередь comeback/турнир; ошибка не ломает загрузку

  // Give audio 600ms to initialize before background chunk streaming begins
  await sleep(600);
  _loadRemainingChunks(curChunk);

  // Стартовые попапы — в очередь, показываются по одному без наложения.
  // Дейли-награда важнее всего → prio 10.
  if (shouldShowDailyReward()) {
    queueStartupPopup('popup-daily', openDailyPopup, 10);
  } else if (state.streakLost) {
    showToast('🔥 Стрик сброшен — начни заново!'); // тост вместо модалки
  }
  // Дейли-сундук убран со входа: показывается после первой победы (хук showWin).

  setTimeout(runStartupPopups, 500);
}

function sleep(ms) { return new Promise(r=>setTimeout(r,ms)); }

function _loadScript(src) {
  if (document.querySelector(`script[src="${src}"]`)) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src; s.onload = resolve; s.onerror = resolve; // onerror → resolve so one missing chunk doesn't break all
    document.head.appendChild(s);
  });
}

async function _loadRemainingChunks(skipChunk) {
  const total = (typeof LEVELS_CHUNKS !== 'undefined') ? LEVELS_CHUNKS : 21;
  for (let i = 1; i <= total; i++) {
    if (i === skipChunk) continue;
    await _loadScript(`levels-c${String(i).padStart(3,'0')}.js`);
    await sleep(80); // yield — don't hammer the network or main thread
  }
  reorderLevels();
  _scheduleBackgroundBalance();
}

// ══════════════════════════════════════════
//  ТОЧКА ВХОДА
// ══════════════════════════════════════════
window.addEventListener('load', () => {
  initCanvas();
  setupInput();
  gameLoop();
  livesTickLoop();
  step4TickLoop();
  loadingScreen();
  initDevPanel();
});

function _scheduleBackgroundBalance() {
  const KEY = 'gg_balance_v4';
  const cached = localStorage.getItem(KEY);
  if (cached) {
    // Применяем сохранённые патчи мгновенно, без симуляции
    try {
      const patches = JSON.parse(cached);
      for (const {i, moves, target} of patches) {
        if (LEVELS[i]) {
          if (moves  != null) LEVELS[i].moves  = moves;
          if (target != null) LEVELS[i].target = target;
        }
      }
    } catch(e) {}
    return;
  }
  // Первый запуск: переносим симуляцию в Web Worker — не трогает main thread вообще
  try {
    const workerSrc = `
      const ROWS=${ROWS},COLS=${COLS},GEM_TYPES=${GEM_TYPES};
      ${_simWouldMatch.toString()}
      ${_simInitBoard.toString()}
      ${_simFindMatches.toString()}
      ${_simCanSwap.toString()}
      ${_simFindAllMoves.toString()}
      ${_simApplyGravity.toString()}
      ${_simFillFromTop.toString()}
      ${_simCheckWin.toString()}
      ${_simProcessMatches.toString()}
      ${_simPickBestMove.toString()}
      ${simulateLevelObj.toString()}
      self.onmessage = function(e) {
        const levels = e.data;
        const patches = [];
        levels.forEach(function(lvl, i) {
          const r = simulateLevelObj(lvl, 30);
          if (!r) return;
          const ep = Math.ceil(lvl.level / 16);
          const minWR = ep <= 2 ? 0.30 : ep <= 5 ? 0.18 : 0.08;
          const maxWR = ep <= 2 ? 0.90 : ep <= 5 ? 0.88 : 0.82;
          if (r.winRate < minWR) {
            if (lvl.type === 'score') { lvl.target = Math.round(lvl.target * 0.82 / 500) * 500; patches.push({i, target: lvl.target}); }
            else { lvl.moves = Math.min(40, lvl.moves + 2); patches.push({i, moves: lvl.moves}); }
          } else if (r.winRate > maxWR) {
            if (lvl.type === 'score') { lvl.target = Math.round(lvl.target * 1.18 / 500) * 500; patches.push({i, target: lvl.target}); }
            else { lvl.moves = Math.max(20, lvl.moves - 1); patches.push({i, moves: lvl.moves}); }
          }
        });
        self.postMessage(patches);
      };
    `;
    const blob = new Blob([workerSrc], {type: 'application/javascript'});
    const url = URL.createObjectURL(blob);
    const worker = new Worker(url);
    worker.onmessage = function(e) {
      const patches = e.data;
      for (const {i, moves, target} of patches) {
        if (LEVELS[i]) {
          if (moves  != null) LEVELS[i].moves  = moves;
          if (target != null) LEVELS[i].target = target;
        }
      }
      try { localStorage.setItem(KEY, JSON.stringify(patches)); } catch(ex) {}
      worker.terminate();
      URL.revokeObjectURL(url);
    };
    worker.onerror = function() { worker.terminate(); URL.revokeObjectURL(url); };
    // Запускаем Worker через 4с — к этому времени игра уже отображена
    setTimeout(() => worker.postMessage(LEVELS.map(lvl => Object.assign({}, lvl))), 4000);
  } catch(e) {
    // Fallback: если Worker недоступен (file://) — пропускаем баланс в этой сессии
  }
}

