// ══════════════════════════════════════════
//  ДИНАМИЧЕСКИЙ ОФФЕР ПОСЛЕ ПОРАЖЕНИЙ (P3-2)
// ══════════════════════════════════════════
let _lossOfferTimer = null;

function maybeShowLossOffer(levelN) {
  const attempts = state.levelAttempts[levelN] || 0;
  if (attempts < 3) return;
  const offerKey = 'loss_' + levelN;
  if (state.specialOfferShown[offerKey]) return;
  state.specialOfferShown[offerKey] = Date.now();
  saveGame();
  showLossOffer();
}

function showLossOffer() {
  const modal = document.getElementById('loss-offer-modal');
  if (!modal) return;
  modal.classList.add('show');
  let secs = 600;
  clearInterval(_lossOfferTimer);
  _lossOfferTimer = setInterval(() => {
    secs--;
    const el = document.getElementById('loss-offer-timer');
    if (el) el.textContent = `⏳ Предложение истечёт через: ${Math.floor(secs/60)}:${String(secs%60).padStart(2,'0')}`;
    if (secs <= 0) { closeLossOffer(); }
  }, 1000);
}

function closeLossOffer() {
  clearInterval(_lossOfferTimer);
  document.getElementById('loss-offer-modal')?.classList.remove('show');
}

function buyLossOffer() {
  if (state.crystals < 99) { showToast('Недостаточно 💎 (нужно 99)'); return; }
  state.crystals -= 99;
  state.ingameBoosters.hammer  = (state.ingameBoosters.hammer  || 0) + 3;
  state.moves += 5;
  if (state.lives < MAX_LIVES) { state.lives++; }
  saveGame();
  updateHUD();
  closeLossOffer();
  showToast('🎁 Набор получен! Хорошей игры!');
}

// ══════════════════════════════════════════
//  СТАРТОВЫЙ ОФФЕР (P3-3)
// ══════════════════════════════════════════
function maybeShowStarterOffer(levelN) {
  if (levelN !== 5) return;
  if (state.specialOfferShown['starter']) return;
  state.specialOfferShown['starter'] = Date.now();
  saveGame();
  setTimeout(() => {
    document.getElementById('starter-offer-modal')?.classList.add('show');
  }, 1200);
}

function closeStarterOffer() {
  document.getElementById('starter-offer-modal')?.classList.remove('show');
}

function buyStarterOffer() {
  closeStarterOffer();
  SDK.purchase('starter_offer',
    () => {
      state.coins    += 500;
      state.crystals += 50;
      state.ingameBoosters.hammer = (state.ingameBoosters.hammer || 0) + 1;
      saveGame();
      refreshLevelsCurrency();
      showToast('🎁 Стартовый набор получен!');
    },
    (err) => { console.log('[StarterOffer] cancelled', err?.message); }
  );
}

// ══════════════════════════════════════════
//  RE-ENGAGEMENT (P2-4)
// ══════════════════════════════════════════
function checkReengagement() {
  const now = Date.now();
  const last = state.lastPlayedAt || 0;
  state.lastPlayedAt = now;
  saveGame();
  if (last > 0 && (now - last) > 24 * 60 * 60 * 1000) {
    const hours = Math.floor((now - last) / 3600000);
    unlockAchievement('comeback');
    queueStartupPopup('reeng-modal', () => {
      document.getElementById('reeng-desc').textContent =
        `Ты не играл ${hours} ч. Держи бонус за возвращение!`;
      document.getElementById('reeng-modal')?.classList.add('show');
    }, 30);
  }
}

function claimReengBonus() {
  state.coins += 50;
  if (state.lives < MAX_LIVES) state.lives++;
  saveGame();
  refreshLevelsCurrency();
  document.getElementById('reeng-modal')?.classList.remove('show');
  showToast('+50 🪙 +1 ❤️ — добро пожаловать!');
}

// ══════════════════════════════════════════
//  ПОКУПКА БУСТЕРОВ В МАГАЗИНЕ (P3-4)
// ══════════════════════════════════════════
function buyBoosterPack(type, count, price) {
  if (state.coins < price) { showToast(`Недостаточно 🪙 (нужно ${price})`); return; }
  state.coins -= price;
  if (type === 'bundle') {
    state.ingameBoosters.hammer    = (state.ingameBoosters.hammer    || 0) + 3;
    state.ingameBoosters.colorbomb = (state.ingameBoosters.colorbomb || 0) + 2;
    state.ingameBoosters.shuffle   = (state.ingameBoosters.shuffle   || 0) + 3;
    state.ingameBoosters.striped   = (state.ingameBoosters.striped   || 0) + 3;
    showToast('🎁 Набор бустеров получен!');
  } else {
    state.ingameBoosters[type] = (state.ingameBoosters[type] || 0) + count;
    const icons={hammer:'🔨',colorbomb:'🌈',shuffle:'🔀',extramoves:'⏱️',striped:'⚡'};
    showToast(`${icons[type]||'✨'} ×${count} добавлено!`);
  }
  saveGame();
  refreshLevelsCurrency();
}
