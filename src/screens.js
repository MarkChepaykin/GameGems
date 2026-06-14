// ══════════════════════════════════════════
//  ЭКРАНЫ
// ══════════════════════════════════════════
const ALL_SCREENS = ['loading','menu','quests','achievements','levels','episode','pregame','game','win','lose','shop','settings','season','tournament','assets'];

const _SCREEN_ANIM = {
  menu:    'screen-slide-down',
  levels:  'screen-slide-up',
  episode: 'screen-slide-left',
  pregame: 'screen-slide-left',
  game:    'screen-slide-up',
  win:     'screen-pop-in',
  lose:    'screen-pop-in',
  shop:    'screen-slide-left',
  settings:'screen-slide-left',
  season:  'screen-slide-left',
  quests:  'screen-slide-left',
  achievements: 'screen-slide-left',
  tournament:   'screen-slide-left',
  assets:       'screen-slide-left',

};

function showScreen(name) {
  const _animCls = ['screen-fadein','screen-slide-up','screen-slide-down','screen-slide-left','screen-pop-in'];
  ALL_SCREENS.forEach(s => {
    const el = document.getElementById('screen-'+s);
    if (!el) return;
    if (s === name) {
      el.classList.remove('hidden');
      _animCls.forEach(c => el.classList.remove(c));
      void el.offsetWidth; // reflow
      el.classList.add(_SCREEN_ANIM[s] || 'screen-fadein');
    } else {
      el.classList.add('hidden');
    }
  });
  state.screen = name;
  const _gbEl2 = document.getElementById('game-bg');
  _gbEl2.classList.toggle('blurred', name === 'menu');
  if (name === 'game') {
    // Переходим в игру: fade MENU_BGM → start BGM
    if (MENU_BGM.isPlaying()) { MENU_BGM.stop(); }
    BGM_LAYERS.reset();
    if (state.musicOn) BGM.start();
  } else if (name === 'win') {
    BGM.stop(); BGM_LAYERS.fadeOut(0.5); BGM_LAYERS.reset();
    if (state.musicOn) SFX.winJingle();
    // Меню-музыка запустится после джингла (~2.5 сек)
    setTimeout(()=>{ if(state.musicOn&&state.screen==='win') MENU_BGM.start(); }, 2600);
  } else if (name === 'lose') {
    BGM.stop(); BGM_LAYERS.fadeOut(2.3);
    if (state.musicOn) SFX.loseJingle();
    setTimeout(()=>{ if(state.musicOn&&state.screen==='lose') MENU_BGM.start(); }, 2200);
  } else {
    // Все остальные экраны: всегда меню-музыка
    BGM.stop();
    if (state.musicOn) MENU_BGM.start(); // start() — no-op if already playing
  }
  if (name !== 'game') { clearTimeout(_hintTimer); _hintTimer=null; }
  if (name === 'menu') {
    const _gbEl = document.getElementById('game-bg');
    if (_gbEl) _gbEl.style.backgroundImage = "url('sprites/bg/main.png')";
    document.documentElement.style.setProperty('--panel-bg-img', "url('sprites/bg/main.png')");
    refreshMenu(); if (!state.noAds) SDK.showBanner();
  }

  if (name === 'quests')       renderQuestsFull();
  if (name === 'achievements') renderAchievements();
  if (name === 'levels')     refreshLevelsCurrency();
  if (name === 'episode')    refreshLevelsCurrency();
  if (name === 'shop')       refreshShop();
  if (name === 'settings')   refreshSettings();
  if (name === 'season')     refreshSeason();
  if (name === 'tournament') refreshTournament();
  if (name === 'win')        startConfetti();
  if (name !== 'menu') SDK.hideBanner();
}

function getTotalStars() {
  return Object.values(state.levelStars).reduce((s, v) => s + (v || 0), 0);
}


function refreshMenu() {
  document.getElementById('m-coins').textContent    = state.coins;
  document.getElementById('m-crystals').textContent = state.crystals;
  document.getElementById('m-lives').textContent    = livesDisplay();
  updateLivesTimerDisplay('m-lives-timer');
  const starsEl = document.getElementById('m-total-stars');
  if (starsEl) starsEl.textContent = getTotalStars();

  // Стрик badge
  const badge = document.getElementById('streak-badge');
  if (state.streakDays > 0) {
    badge.classList.remove('hidden');
    document.getElementById('streak-count-badge').textContent = state.streakDays;
  } else {
    badge.classList.add('hidden');
  }
  // Таймер события в меню
  const evtTimer = document.getElementById('menu-event-timer');
  if (evtTimer) {
    const msLeft = state.eventEndDate ? state.eventEndDate.getTime() - Date.now() : 0;
    if (msLeft > 0) {
      evtTimer.style.display = '';
      evtTimer.textContent = '⏱ ' + formatMs(msLeft);
    } else {
      evtTimer.style.display = 'none';
    }
  }
  // show last earned trophy on main menu
  const ltEl = document.getElementById('m-last-trophy');
  if (ltEl) {
    const earned = (state.trophies || []);
    const last = earned.length ? TROPHIES.find(t => t.id === earned[earned.length - 1]) : null;
    if (last) { ltEl.textContent = `${last.icon} ${last.name}`; ltEl.style.display = ''; }
    else { ltEl.style.display = 'none'; }
  }
  renderPiggyBar();
  updateQuestBadge();
}

function refreshLevelsCurrency() {
  const lc = document.getElementById('lvl-coins');  if (lc) lc.textContent = state.coins;
  const ll = document.getElementById('lvl-lives');  if (ll) ll.textContent = livesDisplay();
  const ec = document.getElementById('ep-coins');   if (ec) ec.textContent = state.coins;
  const el = document.getElementById('ep-lives');   if (el) el.textContent = livesDisplay();

}

// Timed Shop Offers
const SHOP_OFFERS = [
  { id: 'offer_hints', icon: '💡', title: '5 подсказок', desc: '5× авто-подсказка активирует нюк', price: '49 💎', oldPrice: '99 💎', discount: '50%', duration: 6 * 3600 },
  { id: 'offer_mega',  icon: '💣', title: 'Мега-пак бустеров', desc: '3× Молоток + 2× Радуга + 1× Суперсоник', price: '79 💎', oldPrice: '149 💎', discount: '47%', duration: 4 * 3600 },
  { id: 'offer_xp',   icon: '⭐', title: 'XP × 2 на 1 час', desc: 'Двойные очки за матчи на 60 минут', price: '29 💎', oldPrice: '59 💎', discount: '50%', duration: 3 * 3600 },
];
let _offerTimers = {};
let _shopTimerInterval = null;

function _initShopOffers() {
  const now = Date.now();
  SHOP_OFFERS.forEach(o => {
    if (!state.shopOfferExpiry) state.shopOfferExpiry = {};
    if (!state.shopOfferExpiry[o.id] || state.shopOfferExpiry[o.id] < now) {
      state.shopOfferExpiry[o.id] = now + o.duration * 1000;
    }
  });
}

function _renderTimedOffers() {
  const sec = document.getElementById('timed-offers-section');
  if (!sec) return;
  _initShopOffers();
  const now = Date.now();
  const activeOffers = SHOP_OFFERS.filter(o => (state.shopOfferExpiry?.[o.id] || 0) > now);
  if (!activeOffers.length) { sec.innerHTML = ''; return; }
  sec.innerHTML = activeOffers.map(o => {
    const msLeft = (state.shopOfferExpiry[o.id] || 0) - now;
    const h = Math.floor(msLeft / 3600000), m = Math.floor((msLeft % 3600000) / 60000), s = Math.floor((msLeft % 60000) / 1000);
    const timeStr = h > 0 ? `${h}ч ${m}м` : `${m}м ${s}с`;
    const lastChance = msLeft < 3600000;
    return `<div class="timed-offer-card">
      <div class="toc-badge">${o.discount} СКИДКА</div>
      <div style="font-size:32px;flex-shrink:0;">${o.icon}</div>
      <div style="flex:1;">
        <div style="font-size:15px;font-weight:800;color:#fff;">${o.title}</div>
        <div style="font-size:12px;color:#f9a8d4;">${o.desc}</div>
        <div class="toc-timer${lastChance?' last-chance':''}" id="toc-timer-${o.id}">
          ${lastChance ? '⚡ ПОСЛЕДНИЙ ШАНС! ' : '⏱ '}${timeStr}
        </div>
      </div>
      <div style="display:flex;flex-direction:column;align-items:center;gap:4px;">
        <span class="toc-old-price">${o.oldPrice}</span>
        <button class="btn btn-gold btn-sm" onclick="buyTimedOffer('${o.id}')">${o.price}</button>
      </div>
    </div>`;
  }).join('');
}

function buyTimedOffer(id) {
  const offer = SHOP_OFFERS.find(o => o.id === id);
  if (!offer) return;
  // Demo: give bonuses based on offer type
  if (id === 'offer_hints') { state.ingameBoosters = state.ingameBoosters || {}; state.ingameBoosters.hammer = (state.ingameBoosters.hammer || 0) + 5; }
  else if (id === 'offer_mega') { ['hammer','colorbomb','shuffle'].forEach((b,i) => { state.ingameBoosters[b] = (state.ingameBoosters[b]||0) + (i===0?3:i===1?2:1); }); }
  else if (id === 'offer_xp') { showToast('⭐ XP×2 активирован на 1 час!'); }
  if (!state.shopOfferExpiry) state.shopOfferExpiry = {};
  delete state.shopOfferExpiry[id];
  saveGame();
  showToast(`✅ ${offer.title} — куплено!`);
  SFX.reward && SFX.reward();
  _renderTimedOffers();
}

function refreshShop() {
  document.getElementById('sh-coins').textContent    = state.coins;
  document.getElementById('sh-crystals').textContent = state.crystals;
  document.getElementById('sh-lives').textContent    = livesDisplay();
  // Если no_ads куплен — серый
  const noadsBtn = document.getElementById('btn-buy-noads');
  if (noadsBtn) {
    if (state.noAds) { noadsBtn.textContent = '✓ Куплено'; noadsBtn.className = 'btn btn-gray btn-sm'; }
    else             { noadsBtn.textContent = '299 ₽'; noadsBtn.className = 'btn btn-red btn-sm'; }
  }
  // Стартовый пак — скрыть если куплен
  const starterBtn = document.getElementById('btn-starter');
  if (starterBtn && state.starterShown) starterBtn.textContent = '✓ Куплено';
  // Timed offers
  _renderTimedOffers();
  if (_shopTimerInterval) clearInterval(_shopTimerInterval);
  _shopTimerInterval = setInterval(_renderTimedOffers, 10000);
}

function refreshSettings() {
  const tl = document.getElementById('toggle-lang');
  if (tl) tl.textContent = state.lang.toUpperCase();
  const tv = document.getElementById('toggle-vibro');
  if (tv) { tv.textContent = state.vibroOn ? t('on') : t('off'); tv.className = 'toggle '+(state.vibroOn?'on':'off'); }
  const sm = document.getElementById('set-slider-music');
  const smv = document.getElementById('set-slider-music-val');
  const ss = document.getElementById('set-slider-sfx');
  const ssv = document.getElementById('set-slider-sfx-val');
  if (sm) sm.value = state.musicVol;
  if (smv) smv.textContent = state.musicVol + '%';
  if (ss) ss.value = state.sfxVol;
  if (ssv) ssv.textContent = state.sfxVol + '%';
}


function toggleSetting(k) {
  if (k==='sound') state.soundOn = !state.soundOn;
  else if (k==='music') { state.musicOn = !state.musicOn; BGM.set(state.musicOn); MENU_BGM.set(state.musicOn&&(state.screen==='menu'||state.screen==='levels'||state.screen==='pregame')); }
  else if (k==='lang') { state.lang = state.lang==='ru'?'en':'ru'; applyLang(); }
  else if (k==='vibro') state.vibroOn = !state.vibroOn;
  saveGame(); refreshSettings();
}

// Переключение вкладок магазина
function switchTab(name) {
  ['coins','crystals','boosters','special'].forEach(t => {
    document.getElementById('tab-'+t)?.classList.toggle('active', t===name);
  });
  document.querySelectorAll('.tab-btn').forEach((b,i) => {
    const names = ['coins','crystals','boosters','special'];
    b.classList.toggle('active', names[i]===name);
  });
}

// ══════════════════════════════════════════
//  ЖИЗНИ
// ══════════════════════════════════════════
function hasInfiniteLives() {
  return state.lives24hUntil > Date.now();
}

function livesDisplay() {
  if (hasInfiniteLives()) return '∞';
  return `${state.lives}/${MAX_LIVES}`;
}

function tickLives() {
  if (hasInfiniteLives()) return;
  if (state.lives >= MAX_LIVES) { state.livesTimestamp = 0; return; }
  const now = Date.now();
  if (state.livesTimestamp === 0) state.livesTimestamp = now;
  let earned = Math.floor((now - state.livesTimestamp) / LIFE_REGEN_MS);
  if (earned > 0) {
    state.lives = Math.min(MAX_LIVES, state.lives + earned);
    state.livesTimestamp += earned * LIFE_REGEN_MS;
    if (state.lives >= MAX_LIVES) state.livesTimestamp = 0;
    saveGame();
  }
}

function nextLifeMs() {
  if (hasInfiniteLives() || state.lives >= MAX_LIVES) return 0;
  if (state.livesTimestamp === 0) return LIFE_REGEN_MS;
  const elapsed = Date.now() - state.livesTimestamp;
  return Math.max(0, LIFE_REGEN_MS - (elapsed % LIFE_REGEN_MS));
}

function updateLivesTimerDisplay(elemId) {
  const el = document.getElementById(elemId);
  if (!el) return;
  if (hasInfiniteLives()) {
    el.textContent = '';
  } else if (state.lives >= MAX_LIVES) {
    el.textContent = '';
  } else {
    el.textContent = '+❤️ ' + formatMs(nextLifeMs());
  }
}

function formatMs(ms) {
  if (ms <= 0) return '0:00';
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  if (h > 0) return `${h}:${pad2(m%60)}:${pad2(s%60)}`;
  return `${m}:${pad2(s%60)}`;
}
function pad2(n) { return String(n).padStart(2,'0'); }

function spendLife() {
  if (hasInfiniteLives()) return;
  if (state.lives > 0) {
    state.lives--;
    if (state.lives < MAX_LIVES && state.livesTimestamp === 0)
      state.livesTimestamp = Date.now();
    saveGame();
  }
}

function openNoLivesPopup() {
  if (state.lives > 0 || hasInfiniteLives()) return;
  document.getElementById('popup-no-lives').classList.remove('hidden');
  updateNoLivesTimer();
}
function closeNoLivesPopup() {
  document.getElementById('popup-no-lives').classList.add('hidden');
}
function updateNoLivesTimer() {
  const el = document.getElementById('no-lives-timer');
  if (!el) return;
  el.textContent = formatMs(nextLifeMs());
}

// 5-second fake ad progress, then fires onComplete
function simulateAd(onComplete) {
  const bar = document.getElementById('no-lives-ad-bar');
  const fill = document.getElementById('no-lives-ad-fill');
  if (!bar || !fill) { onComplete(); return; }
  bar.style.display = 'block'; fill.style.width = '0%';
  let elapsed = 0;
  const iv = setInterval(() => {
    elapsed += 100;
    fill.style.width = Math.min(elapsed / 5000 * 100, 100) + '%';
    if (elapsed >= 5000) {
      clearInterval(iv);
      bar.style.display = 'none';
      onComplete();
    }
  }, 100);
}

const _FAKE_FRIENDS = ['Алёна К.','Дима С.','Маша П.','Серёжа Б.','Оля Л.','Женя Т.','Коля В.','Катя Р.'];
function askFriendsForLife() {
  const el = document.getElementById('no-lives-friends');
  if (!el) return;
  const picks = [..._FAKE_FRIENDS].sort(() => Math.random()-0.5).slice(0,3);
  el.style.display = '';
  el.innerHTML = picks.map(n => `<div>👤 ${n} — <span style="color:#4ade80;">отправлено!</span></div>`).join('');
  showToast('👥 Запрос отправлен друзьям!');
}

function watchAdLife() {
  SDK.showRewarded(
    () => {
      state.lives = Math.min(MAX_LIVES, state.lives + 1);
      saveGame(); closeNoLivesPopup(); refreshMenu();
      showToast(t('toast_ad_life'));
    },
    () => {}
  );
}

function buyLifeCoins() {
  if (state.coins < 50) { showToast(t('toast_not_enough_coins')); return; }
  state.coins -= 50;
  state.lives = Math.min(MAX_LIVES, state.lives + 1);
  saveGame();
  closeNoLivesPopup();
  refreshMenu();
  if (state.screen === 'shop') refreshShop();
}

// ══════════════════════════════════════════
//  СТРИК И ЕЖЕДНЕВНЫЕ НАГРАДЫ
// ══════════════════════════════════════════
function todayStr() {
  const d=new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function yesterdayStr() {
  const d=new Date(); d.setDate(d.getDate()-1);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function processLoginStreak() {
  const today = todayStr();
  const last  = state.lastLoginDate;
  const prevStreak = state.streakDays;

  if (last === today) return; // уже заходили сегодня

  if (last === yesterdayStr()) {
    // Стрик продолжается
    state.streakDays++;
    state.streakLost = false;
  } else if (last === '') {
    // Первый вход
    state.streakDays = 1;
    state.streakLost = false;
  } else {
    // Пропустили — стрик сброшен
    state.streakLost  = prevStreak > 0;
    state.streakDays  = 1;
  }

  state.lastLoginDate = today;
  saveGame();
}

function getCurrentDailyReward() {
  // Следующий день цикла (1-7)
  const nextDay = (state.dailyDayClaimed % 7) + 1;
  return { day: nextDay, reward: DAILY_REWARDS[nextDay - 1] };
}

function shouldShowDailyReward() {
  if (state.dailyLastClaim === todayStr()) return false;
  // показывать если прошло >20ч с последнего получения
  const ms = state.dailyLastClaimTs ? Date.now() - state.dailyLastClaimTs : Infinity;
  return ms > 20 * 3600 * 1000;
}

function claimDailyReward() {
  const { day, reward } = getCurrentDailyReward();
  state.coins    += (reward.coins || 0);
  state.crystals += (reward.crystals || 0);
  state.lives     = Math.min(MAX_LIVES, state.lives + (reward.lives || 0));
  if (reward.booster) {
    if (!state.ingameBoosters) state.ingameBoosters = { hammer:0, colorbomb:0 };
    state.ingameBoosters[reward.booster] = (state.ingameBoosters[reward.booster] || 0) + 1;
  }
  state.dailyDayClaimed   = day;
  state.dailyLastClaim    = todayStr();
  state.dailyLastClaimTs  = Date.now();
  saveGame();
  // Анимация числа вверх
  _flyRewardAnim(reward.text);
  closeDailyPopup();
  showToast(`Получено: ${reward.text}`);
  refreshMenu();
}

function _flyRewardAnim(text) {
  const el = document.createElement('div');
  el.className = 'fly-reward';
  el.textContent = text;
  el.style.left = (window.innerWidth/2 - 60) + 'px';
  el.style.top  = (window.innerHeight/2) + 'px';
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1000);
}

// ══════════════════════════════════════════
//  Ежедневный URM-сундук
// ══════════════════════════════════════════

function shouldShowDailyChest() {
  return state.lastChestDate !== todayStr();
}

function showDailyChest() {
  if (!shouldShowDailyChest()) return;
  const el = document.getElementById('popup-daily-chest');
  if (!el) return;
  const streak = state.chestStreak || 0;
  const streakEl = document.getElementById('chest-streak-text');
  if (streakEl) streakEl.textContent = `День ${streak + 1} из 7` + (streak >= 6 ? ' — Легендарный гарантирован!' : '');
  const animEl = document.getElementById('chest-anim');
  if (animEl) { animEl.textContent = '🎁'; animEl.style.transform = ''; }
  const rewEl = document.getElementById('chest-reward-text');
  if (rewEl) rewEl.style.display = 'none';
  const btn = document.getElementById('chest-open-btn');
  if (btn) { btn.style.display = ''; btn.disabled = false; }
  el.classList.remove('hidden');
}

function closeDailyChestPopup() {
  const el = document.getElementById('popup-daily-chest');
  if (el) el.classList.add('hidden');
}

function _chestRarity() {
  const streak = state.chestStreak || 0;
  if (streak >= 7) return 'legendary';
  const r = Math.random();
  if (r < 0.50) return 'common';
  if (r < 0.75) return 'uncommon';
  if (r < 0.90) return 'rare';
  if (r < 0.98) return 'epic';
  return 'legendary';
}

function _chestReward(rarity) {
  switch (rarity) {
    case 'common':    return { crystals:5,  coins:10,  lives:0, text:'+5💎 +10🪙' };
    case 'uncommon':  return { crystals:15, coins:20,  lives:0, text:'+15💎 +20🪙' };
    case 'rare':      return { crystals:30, coins:0,   lives:1, text:'+30💎 +1❤️' };
    case 'epic':      return { crystals:50, coins:0,   lives:2, text:'+50💎 +2❤️' };
    case 'legendary': return { crystals:100,coins:0,   lives:3, text:'+100💎 +3❤️' };
    default:          return { crystals:5,  coins:10,  lives:0, text:'+5💎 +10🪙' };
  }
}

function openDailyChest() {
  const btn = document.getElementById('chest-open-btn');
  if (btn) btn.disabled = true;

  const rarity = _chestRarity();
  const reward = _chestReward(rarity);
  const animEl = document.getElementById('chest-anim');

  // Phase 1: shake animation for 500ms
  if (animEl) {
    let t0 = null;
    const shakeDur = 500;
    function shakeFrame(ts) {
      if (!t0) t0 = ts;
      const elapsed = ts - t0;
      if (elapsed < shakeDur) {
        const angle = Math.sin(elapsed / 40) * 12;
        animEl.style.transform = `rotate(${angle}deg)`;
        requestAnimationFrame(shakeFrame);
      } else {
        animEl.style.transform = '';
        animEl.textContent = '✨';
        // Phase 2: reveal
        setTimeout(() => _doRevealChest(rarity, reward), 300);
      }
    }
    requestAnimationFrame(shakeFrame);
  } else {
    setTimeout(() => _doRevealChest(rarity, reward), 800);
  }

  // play chest sound immediately
  openChest(rarity);
}

function _doRevealChest(rarity, reward) {
  const animEl = document.getElementById('chest-anim');
  const rewEl  = document.getElementById('chest-reward-text');
  const rarityEmoji = { common:'💎', uncommon:'💎✨', rare:'💫', epic:'🌟', legendary:'👑' };
  if (animEl) animEl.textContent = rarityEmoji[rarity] || '🎁';

  // Grant reward
  state.crystals = (state.crystals || 0) + reward.crystals;
  state.coins    = (state.coins    || 0) + reward.coins;
  if (reward.lives > 0) state.lives = Math.min(state.lives + reward.lives, 99);

  // Update streak
  const prevStreak = state.chestStreak || 0;
  state.chestStreak   = prevStreak >= 7 ? 0 : prevStreak + 1;
  state.lastChestDate = todayStr();
  saveGame();
  refreshMenu();

  if (rewEl) {
    rewEl.textContent = reward.text;
    rewEl.style.display = '';
  }

  _flyRewardAnim(reward.text);
  if (rarity === 'legendary') {
    showToast('🎉 Легендарная награда!');
  } else {
    showToast(`Сундук: ${reward.text}`);
  }

  // Close modal after 2s
  setTimeout(closeDailyChestPopup, 2000);
}

// ══════════════════════════════════════════
//  Звуки сундука по редкости
// ══════════════════════════════════════════
function openChest(rarity) {
  if (!state.soundOn) return;
  // Хелперы: _t(freq, waveType, duration, volume, delay)  _n2(vol, dur, freq, q, delay)
  const _t  = (f, type, dur, vol, delay) => SFX._tone  && SFX._tone(f, type, dur, vol, delay||0);
  const _n2 = (vol, dur, freq, q, delay) => SFX._noise2 && SFX._noise2(vol, dur, freq, q, delay||0);

  // Фоновый румбл (низкий синус, затухающий за 0.8s)
  _t(65, 'sine', 0.8, 0.06, 0);
  _t(75, 'sine', 0.4, 0.04, 0.4);

  if (rarity === 'common') {
    _n2(0.4, 0.08, 800,  5,  0.1);
    _n2(0.3, 0.1,  1200, 8,  0.2);
    _t(440, 'sine', 0.12, 0.3, 0);
    _t(523, 'sine', 0.12, 0.3, 0.12);
    _t(659, 'sine', 0.15, 0.3, 0.24);
  } else if (rarity === 'uncommon') {
    _n2(0.5, 0.1, 600, 8, 0.1);
    _t(440, 'triangle', 0.15, 0.35, 0.15);
    _t(554, 'triangle', 0.15, 0.35, 0.28);
    _t(659, 'triangle', 0.2,  0.35, 0.42);
  } else if (rarity === 'rare') {
    _n2(0.6, 0.15, 500, 10, 0.05);
    _t(523, 'sine', 0.2,  0.4,  0.1);
    _t(659, 'sine', 0.2,  0.4,  0.25);
    _t(784, 'sine', 0.25, 0.4,  0.4);
    // Echo (эффект реверберации)
    _t(523, 'sine', 0.12, 0.18, 0.25);
    _t(659, 'sine', 0.12, 0.18, 0.4);
  } else if (rarity === 'epic') {
    _n2(0.7, 0.2, 400, 12, 0.0);
    // Три волны арпеджио с небольшим смещением
    [0, 0.15, 0.3].forEach(d => {
      _t(523, 'sine', 0.25, 0.4,  d);
      _t(659, 'sine', 0.25, 0.3,  d + 0.12);
      _t(784, 'sine', 0.3,  0.35, d + 0.24);
    });
  } else if (rarity === 'legendary') {
    _n2(0.9, 0.3, 300, 15, 0.0);
    // C-мажорное арпеджио 523-659-784-1047
    [523, 659, 784, 1047].forEach((f, i) => {
      _t(f, 'sine', 0.3, 0.45, i * 0.12);
    });
    // Финальный аккорд
    [523, 659, 784, 1047].forEach(f => {
      _t(f, 'sine', 0.5, 0.2, 0.55);
    });
  }
}

function openDailyPopup() {
  const { day, reward } = getCurrentDailyReward();

  // Рисуем 7 ячеек
  const row = document.getElementById('daily-days-row');
  row.innerHTML = '';
  for (let i = 1; i <= 7; i++) {
    const r   = DAILY_REWARDS[i-1];
    const div = document.createElement('div');
    div.className = 'daily-day';
    if (i < day) div.classList.add('past');
    if (i === state.dailyDayClaimed) div.classList.add('claimed');
    if (i === day) { div.classList.add('today'); setTimeout(()=>div.classList.add('pop'),50); }
    if (r.rarity) div.classList.add('rarity-'+r.rarity);
    div.innerHTML = `<span class="dd-num">День ${i}</span><span class="dd-reward">${r.icon}</span>`;
    row.appendChild(div);
  }

  document.getElementById('daily-reward-icon').textContent = reward.icon;
  document.getElementById('daily-reward-text').textContent = reward.text;
  document.getElementById('daily-streak-label').textContent =
    `🔥 Стрик: ${state.streakDays} дн. | День ${day} из 7`;

  document.getElementById('popup-daily').classList.remove('hidden');
}

function closeDailyPopup() {
  document.getElementById('popup-daily').classList.add('hidden');
}

function openStreakPopup() {
  document.getElementById('streak-popup-num').textContent = state.streakDays;
  const sub = document.getElementById('streak-popup-sub');
  const restore = document.getElementById('btn-restore-streak');

  if (state.streakLost) {
    sub.textContent = 'Вы пропустили день — стрик сброшен!';
    restore.style.display = '';
  } else {
    sub.textContent = state.streakDays >= 7 ? '🎉 +10% монет активен!' : '';
    restore.style.display = 'none';
  }

  // Рендерим цепочку наград за 7 дней
  const chain = document.getElementById('streak-chain-row');
  const currentDay = ((state.streakDays - 1) % 7) + 1; // 1-7
  chain.innerHTML = DAILY_REWARDS.map((r, i) => {
    const day = i + 1;
    const done = !state.streakLost && day < currentDay;
    const today = !state.streakLost && day === currentDay;
    const rarClass = r.rarity ? ` rarity-${r.rarity}` : '';
    return `<div class="streak-day-card${done?' done':''}${today?' today':''}${rarClass}">
      ${done ? '<div class="sd-check">✓</div>' : ''}
      <div class="sd-day">День ${day}</div>
      <div class="sd-icon">${r.icon}</div>
      <div class="sd-text">${r.text.replace(/\+/g,'').replace(/ /g,'<br>')}</div>
    </div>`;
  }).join('');

  document.getElementById('popup-streak').classList.remove('hidden');
}

function closeStreakPopup() {
  document.getElementById('popup-streak').classList.add('hidden');
  state.streakLost = false;
  saveGame();
}

function restoreStreak() {
  if (state.crystals < 5) { showToast('Недостаточно кристаллов!'); return; }
  state.crystals -= 5;
  state.streakDays = (state.dailyDayClaimed % 7) + 1; // восстановить к текущему дню
  state.streakLost = false;
  saveGame();
  closeStreakPopup();
  refreshMenu();
  showToast('Стрик восстановлен!');
}

// ══════════════════════════════════════════
//  МАГАЗИН — заглушки (Шаг 3 подключит SDK)
// ══════════════════════════════════════════
// Продукты → действие при успешной покупке
const PRODUCT_REWARDS = {
  'coins_small':   () => { state.coins += 50; },
  'coins_medium':  () => { state.coins += 150; },
  'crystals_s':    () => { state.crystals += 20; },
  'crystals_m':    () => { state.crystals += 60; },
  'crystals_l':    () => { state.crystals += 150; },
  'no_ads':        () => { state.noAds = true; },
  'lives_24h':     () => { state.lives24hUntil = Date.now() + 24*60*60*1000; },
  'starter_pack':  () => { state.coins += 50; state.crystals += 30; state.lives24hUntil = Date.now() + 24*60*60*1000; state.starterShown = true; },
};

function shopBuy(productId) {
  SDK.purchase(
    productId,
    (result) => {
      // Успех
      const reward = PRODUCT_REWARDS[productId];
      if (reward) reward();
      saveGame();
      refreshShop();
      refreshMenu();
      const names = {
        'coins_small':'50 монет','coins_medium':'150 монет','crystals_s':'20 кристаллов',
        'crystals_m':'60 кристаллов','crystals_l':'150 кристаллов',
        'no_ads':'Реклама отключена!','lives_24h':'24 ч безлимитных жизней!',
        'starter_pack':'Стартовый пак получен!',
      };
      showToast('✓ Куплено: ' + (names[productId] || productId));
    },
    (err) => {
      // Отмена или ошибка — не показываем alert, просто тихо
      console.log('[Shop] Покупка отменена:', productId, err?.message);
    }
  );
}

function watchAdCoins() {
  SDK.showRewarded(
    () => { state.coins += 50; saveGame(); refreshShop(); showToast(t('toast_ad_coins')); },
    () => {}
  );
}

// ══════════════════════════════════════════
//  СТАРТОВЫЙ ПАК ПОПАП
// ══════════════════════════════════════════
function maybeShowStarterPack() {
  if (!state.starterShown) {
    state.starterShown = true; // маркируем что показали (не купили)
    saveGame();
    document.getElementById('popup-starter').classList.remove('hidden');
  }
}
function closeStarterPopup() {
  document.getElementById('popup-starter').classList.add('hidden');
}

// ══════════════════════════════════════════
//  КАРТА ЭПИЗОДОВ / СЛОИ ЗЕМЛИ
// ══════════════════════════════════════════
let _currentEpisodeId = 1;
let _currentLayerIdx  = 0;
let _levelsMode       = 'layers'; // 'layers' | 'episodes'

const TOTAL_LEVELS = 20110;

const EARTH_LAYERS = [
  {name:'Поверхность',         emoji:'🌿', bg:'#1e4d1a,#0d2509',  depth:'0 м',      img:'Поверхность.png'},
  {name:'Корни мира',          emoji:'🌱', bg:'#2a3a14,#121808',  depth:'5 м',      img:'Корни мира.png'},
  {name:'Червоточины',         emoji:'🪱', bg:'#3a2410,#1a0e06',  depth:'15 м',     img:'Червоточины.png'},
  {name:'Красное ложе',        emoji:'🏺', bg:'#6a3820,#381008',  depth:'30 м',     img:'Красное ложе.png'},
  {name:'Песчаные своды',      emoji:'🧱', bg:'#705228,#3a2410',  depth:'60 м',     img:'Песчаные своды.png'},
  {name:'Морозные трещины',    emoji:'❄️', bg:'#2a4060,#121828',  depth:'100 м',    img:'Морозные трещины.png'},
  {name:'Подземные реки',      emoji:'💧', bg:'#183070,#080e40',  depth:'200 м',    img:'Подземные реки.png'},
  {name:'Каменные палаты',     emoji:'🪨', bg:'#706050,#382e20',  depth:'400 м',    img:'Каменные палаты.png'},
  {name:'Сажа глубин',         emoji:'⛏️', bg:'#282030,#101018',  depth:'800 м',    img:'Сажа глубин.png'},
  {name:'Медные карманы',      emoji:'🟤', bg:'#6a3010,#301408',  depth:'1.2 км',   img:'Медные карманы.png'},
  {name:'Железные жилы',       emoji:'🔩', bg:'#4a3828,#201814',  depth:'2 км',     img:'Железные жилы.png'},
  {name:'Лунные жилы',         emoji:'🥈', bg:'#505870,#202838',  depth:'3 км',     img:'Лунные жилы.png'},
  {name:'Мраморные гроты',     emoji:'🏛️', bg:'#6a6050,#302818',  depth:'5 км',     img:'Мраморные гроты.png'},
  {name:'Светящийся лес',      emoji:'🍄', bg:'#1a5020,#081e0a',  depth:'7 км',     img:'Светящийся лес.png'},
  {name:'Морские пещеры',      emoji:'🌊', bg:'#0a2878,#040e3c',  depth:'10 км',    img:'Морские пещеры.png'},
  {name:'Зелёное сияние',      emoji:'💚', bg:'#145028,#06200e',  depth:'13 км',    img:'Зелёное сияние.png'},
  {name:'Кристальные гроты',   emoji:'🔮', bg:'#2a1868,#100630',  depth:'17 км',    img:'Кристальные гроты.png'},
  {name:'Золотые жилы',        emoji:'🥇', bg:'#684808,#302004',  depth:'21 км',    img:'Золотые жилы.png'},
  {name:'Алмазные недра',      emoji:'💎', bg:'#102070,#060838',  depth:'26 км',    img:'Алмазные недра.png'},
  {name:'Беззвёздная тьма',    emoji:'🌑', bg:'#0e0e14,#06060c',  depth:'32 км',    img:'Беззвёздная тьма.png'},
  {name:'Ледяные катакомбы',   emoji:'🧊', bg:'#182840,#081018',  depth:'40 км',    img:'Ледяные катакомбы.png'},
  {name:'Кладбище титанов',    emoji:'🦴', bg:'#504038,#201810',  depth:'50 км',    img:'Кладбище титанов.png'},
  {name:'Забытые шахты',       emoji:'🏚️', bg:'#3a2c1c,#181008',  depth:'60 км',    img:'Забытые шахты.png'},
  {name:'Живой люмит',         emoji:'⚗️', bg:'#2a5020,#102008',  depth:'75 км',    img:'Живой люмит.png'},
  {name:'Метеоритный слой',    emoji:'☄️', bg:'#303040,#141418',  depth:'90 км',    img:'Метеоритный слой.png'},
  {name:'Вулканические трубы', emoji:'🌋', bg:'#701800,#300800',  depth:'120 км',   img:'Вулканические трубы.png'},
  {name:'Пульс магмы',         emoji:'🔥', bg:'#7a2000,#380800',  depth:'160 км',   img:'Пульс магмы.png'},
  {name:'Подземный океан',     emoji:'🫧', bg:'#082080,#040840',  depth:'220 км',   img:'Подземный океан.png'},
  {name:'Кровавый базальт',    emoji:'🔴', bg:'#780800,#380400',  depth:'300 км',   img:'Кровавый базальт.png'},
  {name:'Багровый предел',     emoji:'💀', bg:'#580010,#280008',  depth:'400 км',   img:'Багровый предел.png'},
  {name:'Верхняя мантия',      emoji:'🟠', bg:'#683000,#301000',  depth:'600 км',   img:'Верхняя мантия.png'},
  {name:'Море магмы',          emoji:'💫', bg:'#883800,#401400',  depth:'900 км',   img:'Море магмы.png'},
  {name:'Нижняя мантия',       emoji:'🌀', bg:'#540e0e,#240606',  depth:'1500 км',  img:'Нижняя мантия.png'},
  {name:'Огненный разлом',     emoji:'🔴', bg:'#700808,#300404',  depth:'2500 км',  img:'Огненный разлом.png'},
  {name:'Внешнее ядро',        emoji:'🌊', bg:'#0a1468,#040830',  depth:'3000 км',  img:'Внешнее ядро.png'},
  {name:'Ферровихрь',          emoji:'⚡', bg:'#081a78,#040838',  depth:'3500 км',  img:'Ферровихрь.png'},
  {name:'Рубеж ядра',          emoji:'💠', bg:'#060890,#020444',  depth:'4500 км',  img:'Рубеж ядра.png'},
  {name:'Внутреннее ядро',     emoji:'✨', bg:'#44445c,#1c1c2a',  depth:'5100 км',  img:'Внутреннее ядро.png'},
  {name:'Сердце Земли',        emoji:'❤️', bg:'#680606,#280202',  depth:'6000 км',  img:'Сердце Земли.png'},
  {name:'Нулевая точка',       emoji:'🌍', bg:'#0c0c0c,#040404',  depth:'Центр',    img:'Нулевая точка.png'},
];

function getLayerRange(i) {
  const n = EARTH_LAYERS.length;
  return {
    lvl1: Math.floor(i * TOTAL_LEVELS / n) + 1,
    lvlN: Math.floor((i + 1) * TOTAL_LEVELS / n),
  };
}

function _getDepthInfo() {
  const maxLvl = state.maxUnlocked || 1;
  let idx = 0;
  for (let i = 0; i < EARTH_LAYERS.length; i++) {
    const { lvl1 } = getLayerRange(i);
    if (maxLvl >= lvl1) idx = i; else break;
  }
  return {
    icon:  EARTH_LAYERS[idx].emoji,
    label: EARTH_LAYERS[idx].depth,
    pct:   Math.round(idx / (EARTH_LAYERS.length - 1) * 100),
  };
}

function _getLayerIdxForLevel(n) {
  for (let i = EARTH_LAYERS.length - 1; i >= 0; i--) {
    if (getLayerRange(i).lvl1 <= n) return i;
  }
  return 0;
}

let _bgPreloaded = false;
function _preloadChapterBgs() {
  if (_bgPreloaded) return;
  _bgPreloaded = true;
  EARTH_LAYERS.forEach(layer => {
    if (!layer.img) return;
    const _img = new Image();
    _img.src = `sprites/bg/${encodeURI(layer.img)}`;
  });
}

function _setChapterBg(layerIdx) {
  const layer = EARTH_LAYERS[Math.max(0, Math.min(layerIdx, EARTH_LAYERS.length - 1))];
  const el = document.getElementById('game-bg');
  if (!el) return;
  let bgImg;
  if (layer.img) {
    bgImg = `url('sprites/bg/${encodeURI(layer.img)}')`;
  } else {
    const [bg1, bg2] = layer.bg.split(',');
    bgImg = `linear-gradient(135deg,${bg1} 0%,${bg2} 100%)`;
  }
  el.style.backgroundImage = bgImg;
  document.documentElement.style.setProperty('--panel-bg-img', bgImg);
}

const TYPE_ICON = {
  relics:'🐾', collect:'💎', flood:'🫧', buckets:'🪣',
  dirt:'🟫', lava:'🌋', bricks:'🎨', path:'🧙',
};

function goBackToLevels() {
  showLayer(_currentLayerIdx);
}

function goBackToLayer() {
  showLevels();
}

function showLevels() {
  if (typeof EPISODES === 'undefined') {
    showToast('⏳ Загружаем...'); return;
  }
  _preloadChapterBgs();
  _levelsMode = 'layers';
  showScreen('levels');
  refreshLevelsCurrency();

  const titleEl = document.getElementById('lvl-screen-title');
  if (titleEl) titleEl.textContent = 'Выбор уровня';
  const backBtn = document.getElementById('lvl-back-btn');
  if (backBtn) backBtn.onclick = () => showScreen('menu');

  const map = document.getElementById('episode-map');
  map.innerHTML = '';
  map.classList.add('layers-mode');

  EARTH_LAYERS.forEach((layer, i) => {
    const { lvl1, lvlN } = getLayerRange(i);
    const locked = lvl1 > (state.maxUnlocked || 1);
    const layerLvls = (typeof LEVELS !== 'undefined')
      ? LEVELS.filter(l => l.level >= lvl1 && l.level <= lvlN) : [];
    const done  = layerLvls.filter(l => (state.levelStars[l.level] || 0) > 0).length;
    const total = layerLvls.length || (lvlN - lvl1 + 1);
    const pct   = total > 0 ? Math.round(done / total * 100) : 0;

    const [bg1, bg2] = layer.bg.split(',');
    const card = document.createElement('button');
    card.className = 'layer-card';
    if (layer.img) {
      card.style.background = `linear-gradient(135deg,rgba(0,0,0,.44) 0%,rgba(0,0,0,.62) 100%),url('sprites/bg/${encodeURI(layer.img)}') center/cover no-repeat`;
    } else {
      card.style.background = `linear-gradient(135deg,${bg1} 0%,${bg2} 100%)`;
    }
    card.disabled = locked;
    card.innerHTML =
      `<div class="lc-icon">${locked ? '🔒' : layer.emoji}</div>` +
      `<div class="lc-body">` +
        `<div class="lc-name">${locked ? layer.name : layer.name}</div>` +
        `<div class="lc-sub">${layer.depth} · Ур. ${lvl1}–${lvlN}${locked ? ' · Закрыт' : ' · ' + pct + '%'}</div>` +
        `<div class="lc-bar-bg"><div class="lc-bar-fill" style="width:${locked?0:pct}%"></div></div>` +
      `</div>` +
      `<div class="lc-right">${locked ? '' : '›'}</div>`;
    if (!locked) card.onclick = () => showLayer(i);
    map.appendChild(card);
  });

  // Scroll to current layer
  let curIdx = 0;
  for (let i = 0; i < EARTH_LAYERS.length; i++) {
    if (getLayerRange(i).lvl1 <= (state.maxUnlocked || 1)) curIdx = i; else break;
  }
  setTimeout(() => {
    if (map.children[curIdx]) map.children[curIdx].scrollIntoView({ block: 'center', behavior: 'smooth' });
  }, 80);
}

function showLayer(i) {
  _currentLayerIdx = i;
  const layer = EARTH_LAYERS[i];
  const { lvl1, lvlN } = getLayerRange(i);
  _setChapterBg(i);

  showScreen('episode');
  const titleEl = document.getElementById('ep-title');
  if (titleEl) titleEl.textContent = `${layer.emoji} ${layer.name}`;
  const ec = document.getElementById('ep-coins'); if (ec) ec.textContent = state.coins;
  const el = document.getElementById('ep-lives'); if (el) el.textContent = livesDisplay();

  const grid = document.getElementById('episode-level-grid');
  grid.innerHTML = '';

  // Load chunks covering this layer (may span two 1000-level chunks)
  const c1 = Math.max(1, Math.ceil(lvl1 / 1000));
  const c2 = Math.max(1, Math.ceil(lvlN / 1000));
  const loaded = typeof LEVELS !== 'undefined' && LEVELS.some(l => l.level >= lvl1 && l.level <= lvlN);
  if (!loaded) {
    grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;color:rgba(255,255,255,.6);padding:20px;font-size:13px;">⏳ Загружаем уровни...</div>';
    const loads = [_loadScript(`levels-c${String(c1).padStart(3,'0')}.js`)];
    if (c2 !== c1) loads.push(_loadScript(`levels-c${String(c2).padStart(3,'0')}.js`));
    Promise.all(loads).then(() => showLayer(i));
    return;
  }

  const layerLvls = LEVELS.filter(l => l.level >= lvl1 && l.level <= lvlN);
  for (const lvl of layerLvls) {
    const stars    = state.levelStars[lvl.level] || 0;
    const locked   = lvl.level > (state.maxUnlocked || 1);
    const tier     = getDifficultyTier(lvl);
    const tierClass = tier>=3 ? 'tier-ultrahard' : tier>=2 ? 'tier-superhard' : tier>=1 ? 'tier-hard' : '';
    const badgeIcon = tier>=3 ? '☠️' : tier>=2 ? '💥' : tier>=1 ? '🔥' : '';

    const btn = document.createElement('button');
    btn.dataset.level = lvl.level;
    btn.className = 'level-btn ' + (locked ? 'locked' : stars > 0 ? 'complete' : 'unlocked') + (tierClass ? ' ' + tierClass : '');

    if (locked) {
      btn.innerHTML = `<span>🔒</span><span style="font-size:11px">${lvl.level}</span>`;
    } else {
      const faWin = state.firstAttemptWins?.[lvl.level];
      const badge = badgeIcon ? `<span class="level-diff-badge">${badgeIcon}</span>` : '';
      btn.innerHTML = `${badge}<span>${lvl.level}${faWin ? '<span style="font-size:8px;position:absolute;top:2px;right:3px;">🏆</span>' : ''}</span><div class="level-stars">${'⭐'.repeat(stars)}</div>`;
      btn.onclick = () => selectLevel(lvl.level);
    }
    grid.appendChild(btn);
  }

  const lastBtn = grid.querySelector(`[data-level="${state.maxUnlocked}"]`);
  if (lastBtn) setTimeout(() => lastBtn.scrollIntoView({ block: 'center', behavior: 'smooth' }), 80);
}

function showEpisode(epId) {
  _currentEpisodeId = epId;
  const ep = (typeof EPISODES !== 'undefined') && EPISODES.find(e => e.id === epId);
  if (!ep) { showToast('⏳ Загружаем...'); return; }

  showScreen('episode');
  document.getElementById('ep-title').textContent = getEpName(ep);

  const grid = document.getElementById('episode-level-grid');
  grid.innerHTML = '';

  const epLvls = (typeof LEVELS !== 'undefined') ? LEVELS.filter(l => l.level >= ep.start && l.level <= ep.end) : [];

  // If chunk not yet loaded, trigger load and retry
  if (epLvls.length === 0 && ep.start > ((typeof LEVELS !== 'undefined') ? LEVELS.length : 0)) {
    grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;color:rgba(255,255,255,.6);padding:20px;font-size:13px;">⏳ Загружаем уровни...</div>';
    const chunkIdx = Math.max(1, Math.ceil(ep.start / 1000));
    _loadScript(`levels-c${String(chunkIdx).padStart(3,'0')}.js`).then(() => showEpisode(epId));
    return;
  }

  for (const lvl of epLvls) {
    const stars   = state.levelStars[lvl.level] || 0;
    const locked  = lvl.level > state.maxUnlocked;
    const tier    = getDifficultyTier(lvl);
    const tierClass  = tier>=3 ? 'tier-ultrahard' : tier>=2 ? 'tier-superhard' : tier>=1 ? 'tier-hard' : '';
    const badgeIcon  = tier>=3 ? '☠️' : tier>=2 ? '💥' : tier>=1 ? '🔥' : '';

    const btn = document.createElement('button');
    btn.dataset.level = lvl.level;
    btn.className = 'level-btn ' + (locked ? 'locked' : stars > 0 ? 'complete' : 'unlocked') + (tierClass ? ' '+tierClass : '');

    if (locked) {
      btn.innerHTML = `<span>🔒</span><span style="font-size:11px">${lvl.level}</span>`;
    } else {
      const faWin = state.firstAttemptWins?.[lvl.level];
      const badge = badgeIcon ? `<span class="level-diff-badge">${badgeIcon}</span>` : '';
      btn.innerHTML = `${badge}<span>${lvl.level}${faWin?'<span style="font-size:8px;position:absolute;top:2px;right:3px;">🏆</span>':''}</span><div class="level-stars">${'⭐'.repeat(stars)}</div>`;
      btn.onclick = () => selectLevel(lvl.level);
    }
    grid.appendChild(btn);
  }

  const lastBtn = grid.querySelector(`[data-level="${state.maxUnlocked}"]`);
  if (lastBtn) setTimeout(() => lastBtn.scrollIntoView({ block:'center', behavior:'smooth' }), 80);
}

function selectLevel(n) {
  // Проверка жизней
  if (!hasInfiniteLives() && state.lives <= 0) {
    openNoLivesPopup(); return;
  }

  state.currentLevel = n;
  const lvl = getLevel(n);

  const _tier=getDifficultyTier(lvl);
  const _tierLabel=_tier>=3?' 💀💀💀 Ультра сложный':_tier>=2?' 💀💀 Очень сложный':_tier>=1?' 💀 Сложный':'';
  document.getElementById('pg-level-lbl').textContent  = `${t('level')} ${n}${_tierLabel}`;
  document.getElementById('pg-goal-type').textContent  = LEVEL_DESC[lvl.type]?.(lvl) || '';
  // Описание цели
  const pgDesc = document.getElementById('pg-goal-desc');
  if (lvl.type === 'collect' && lvl.gems.length) {
    pgDesc.innerHTML = lvl.gems.map(g => {
      const gem = GEMS[g]; if (!gem) return '';
      return `<span style="color:${gem.color};font-size:22px;">●</span> ${gem.name}`;
    }).join('  ');
  } else if (lvl.type === 'buckets') {
    pgDesc.innerHTML = '🪣 Опускай вёдра с камнями вниз';
  } else if (lvl.type === 'dirt') {
    pgDesc.innerHTML = '🟦 Разбивай гемы на гелевых ячейках';
  } else if (lvl.type === 'ice') {
    pgDesc.innerHTML = '❄️ Разбивай соседние фишки';
  } else if (lvl.type === 'stone') {
    pgDesc.innerHTML = '🪨 Разбивай соседние фишки';
  } else if (lvl.type === 'flood') {
    pgDesc.innerHTML = '🫧 Делай матчи рядом с колбами';
  } else if (lvl.type === 'bricks') {
    pgDesc.innerHTML = '🎨 Собирай матчи, чтобы покрасить всё поле';
  } else if (lvl.type === 'relics') {
    pgDesc.innerHTML = '🐾 Разбивай янтарь и рунные блоки — освобождай кротов';
  } else if (lvl.type === 'lava') {
    pgDesc.innerHTML = '🌋 Делай матчи рядом с лавой, чтобы рассеять её';
  } else if (lvl.type === 'path') {
    pgDesc.innerHTML = '🧙 Делай матчи рядом с путником — он пройдёт по тропе';
  } else {
    pgDesc.textContent = '';
  }
  document.getElementById('pg-moves-lbl').textContent  = `${t('moves_lbl')} ${lvl.moves}`;

  // Бустеры
  buildBoostersUI();

  // Обновить валюту
  document.getElementById('pg-coins').textContent    = state.coins;
  document.getElementById('pg-crystals').textContent = state.crystals;
  document.getElementById('pg-lives').textContent    = livesDisplay();

  // Rainbow Streak display
  const _rsEl = document.getElementById('pg-rainbow-streak');
  if (_rsEl) {
    const rs = state.rainbowStreak || 0;
    if (rs > 0) {
      const icons = Array.from({length: 5}, (_, i) => i < rs ? '🌈' : '⬜').join('');
      _rsEl.textContent = `${icons} Серия ×${rs}`;
      _rsEl.style.display = '';
    } else {
      _rsEl.style.display = 'none';
    }
  }

  showScreen('pregame');
  // Стартовый оффер на уровне 5
  if (n === 5) setTimeout(() => maybeShowStarterOffer(5), 600);
}

function buildBoostersUI() {
  const row = document.getElementById('boosters-row');
  row.innerHTML = '';
  state.activeBoosters = [];
  state.activePreBoosters = [];

  // Монетные бустеры
  BOOSTERS.forEach(b => {
    const div = document.createElement('div');
    div.className = 'booster-btn';
    div.id = 'booster-'+b.id;
    div.innerHTML = `<div class="b-icon">${b.icon}</div><div class="b-name">${b.name}</div><div class="b-cost">${b.cost}🪙</div>`;
    div.onclick = () => toggleBooster(b);
    row.appendChild(div);
  });

  // Кристалл-бустеры (L10+)
  const existingPreSection = document.getElementById('pre-boosters-section');
  if (state.currentLevel >= 10) {
    let preSection = existingPreSection;
    if (!preSection) {
      preSection = document.createElement('div');
      preSection.id = 'pre-boosters-section';
      preSection.style.cssText = 'width:100%;display:flex;flex-direction:column;gap:6px;';
      // Insert before the start button (last child of pg-wrap)
      const pgWrap = document.querySelector('.pg-wrap');
      const startBtn = pgWrap.querySelector('button.btn-primary');
      pgWrap.insertBefore(preSection, startBtn);
    }
    preSection.innerHTML = `<div class="boosters-title">⛏️ Бустеры старта:</div><div class="boosters-row" id="pre-boosters-row"></div>`;
    const preRow = document.getElementById('pre-boosters-row');
    PRE_BOOSTERS.forEach(b => {
      const div = document.createElement('div');
      div.className = 'booster-btn';
      div.id = 'pre-booster-'+b.id;
      div.innerHTML = `<div class="b-icon">${b.icon}</div><div class="b-name">${b.name}</div><div class="b-cost b-cost-crystal">${b.cost}💎</div>`;
      div.onclick = () => togglePreBooster(b);
      preRow.appendChild(div);
    });
  } else if (existingPreSection) {
    existingPreSection.remove();
  }
}

function toggleBooster(b) {
  const idx = state.activeBoosters.indexOf(b.id);
  const el  = document.getElementById('booster-'+b.id);
  if (idx === -1) {
    if (state.coins < b.cost) { showToast('Недостаточно монет!'); return; }
    state.activeBoosters.push(b.id);
    el?.classList.add('selected');
  } else {
    state.activeBoosters.splice(idx, 1);
    el?.classList.remove('selected');
  }
}

function togglePreBooster(b) {
  const idx = state.activePreBoosters.indexOf(b.id);
  const el  = document.getElementById('pre-booster-'+b.id);
  if (idx === -1) {
    if (state.crystals < b.cost) { showToast('Недостаточно кристаллов!'); return; }
    state.activePreBoosters.push(b.id);
    el?.classList.add('selected');
  } else {
    state.activePreBoosters.splice(idx, 1);
    el?.classList.remove('selected');
  }
}

