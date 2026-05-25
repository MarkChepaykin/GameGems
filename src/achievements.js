// ══════════════════════════════════════════
//  ДОСТИЖЕНИЯ (P2-3)
// ══════════════════════════════════════════
const ACHIEVEMENT_LIST = [
  { id:'first_match',   icon:'✨', title:'Первый матч',         desc:'Сделай первый матч' },
  { id:'first_win',     icon:'🎉', title:'Первая победа',       desc:'Пройди первый уровень' },
  { id:'combo_3',       icon:'💥', title:'Комбо x3',            desc:'Сделай комбо из 3 уровней' },
  { id:'combo_5',       icon:'🔥', title:'Комбо x5',            desc:'Сделай комбо из 5 уровней' },
  { id:'level_10',      icon:'🏅', title:'Уровень 10',          desc:'Пройди 10 уровней' },
  { id:'level_25',      icon:'🥈', title:'Уровень 25',          desc:'Пройди 25 уровней' },
  { id:'level_50',      icon:'🥇', title:'Уровень 50',          desc:'Пройди все 50 уровней' },
  { id:'streak_3',      icon:'🔥', title:'Стрик 3 дня',         desc:'Играй 3 дня подряд' },
  { id:'streak_7',      icon:'🌟', title:'Стрик 7 дней',        desc:'Играй 7 дней подряд' },
  { id:'ice_master',    icon:'🧊', title:'Ледяной мастер',      desc:'Разбей 100 льдинок' },
  { id:'stone_master',  icon:'🪨', title:'Горный мастер',       desc:'Убери 50 камней' },
  { id:'special_5',     icon:'⚡', title:'Взрывной',            desc:'Активируй 5 спецгемов' },
  { id:'special_50',    icon:'💫', title:'Мастер взрывов',      desc:'Активируй 50 спецгемов' },
  { id:'quest_first',   icon:'📋', title:'Первое задание',      desc:'Выполни задание' },
  { id:'quest_ten',     icon:'📚', title:'Выполни 10 заданий',  desc:'Выполни 10 заданий всего' },
  { id:'rich',          icon:'🪙', title:'Богатый',             desc:'Накопи 500 монет' },
  { id:'no_booster',    icon:'🎯', title:'Без помощи',          desc:'Пройди уровень без бустеров' },
  { id:'comeback',      icon:'🔄', title:'Возвращение',         desc:'Вернись после 24 ч перерыва' },
  { id:'piggy_break',   icon:'🐷', title:'Разбил копилку',      desc:'Разбей копилку' },
  { id:'perfect_level', icon:'💯', title:'Идеальный уровень',   desc:'Пройди уровень без промахов (≥3 звезды)' },
];

// Trophy Collection
const TROPHIES = [
  { id:'trophy_rookie',  icon:'🏆', name:'Новичок',       desc:'Победи 5 раз',          condition: s => (s.totalWins||0) >= 5 },
  { id:'trophy_veteran', icon:'🥇', name:'Ветеран',        desc:'Победи 25 раз',         condition: s => (s.totalWins||0) >= 25 },
  { id:'trophy_legend',  icon:'👑', name:'Легенда',        desc:'Победи 100 раз',        condition: s => (s.totalWins||0) >= 100 },
  { id:'trophy_streak',  icon:'🌈', name:'Серийный',       desc:'Выиграй 5 уровней подряд', condition: s => (s.rainbowStreak||0) >= 5 || (s.trophies||[]).includes('trophy_streak') },
  { id:'trophy_hard',    icon:'💥', name:'Крутой',         desc:'Пройди сложный уровень', condition: s => Object.keys(s.levelStars||{}).some(l => { const lv = getLevel(parseInt(l)); return getDifficultyTier(lv) >= 1 && (s.levelStars[l]||0) > 0; }) },
  { id:'trophy_ultra',   icon:'☠️', name:'Бесстрашный',   desc:'Пройди экстремальный уровень', condition: s => Object.keys(s.levelStars||{}).some(l => { const lv = getLevel(parseInt(l)); return getDifficultyTier(lv) >= 3 && (s.levelStars[l]||0) > 0; }) },
];
function checkTrophies() {
  if (!state.trophies) state.trophies = [];
  TROPHIES.forEach(t => {
    if (!state.trophies.includes(t.id) && t.condition(state)) {
      state.trophies.push(t.id);
      setTimeout(() => {
        showToast(`🏆 Трофей: ${t.name}!`);
        SFX.reward && SFX.reward();
      }, 500);
    }
  });
}

function unlockAchievement(id) {
  if (state.achievements.includes(id)) return;
  state.achievements.push(id);
  saveGame();
  const def = ACHIEVEMENT_LIST.find(a => a.id === id);
  if (def) showAchievementToast(def.icon, def.title);
  updateQuestProgress('achievements', 1);
}

function renderAchievements() {
  const el = document.getElementById('achievements-list');
  const coinsEl = document.getElementById('ach-coins');
  const crEl = document.getElementById('ach-crystals');
  if (coinsEl) coinsEl.textContent = state.coins;
  if (crEl) crEl.textContent = state.crystals;
  if (!el) return;
  const unlocked = state.achievements || [];
  const total = ACHIEVEMENT_LIST.length;
  const done  = unlocked.length;

  // Прогресс-бар
  const bar = document.getElementById('achievements-progress-bar');
  if (bar) {
    const pct = Math.round(done / total * 100);
    bar.innerHTML = `<div style="background:rgba(255,255,255,0.55);border-radius:12px;padding:10px 14px;margin-bottom:8px;">
      <div style="display:flex;align-items:center;gap:10px;color:#2d1048;font-size:14px;font-weight:700;margin-bottom:6px;">
        <span>Получено: ${done} / ${total}</span><span style="color:#7c2cc6;">${pct}%</span>
      </div>
      <div style="background:rgba(20,10,0,0.20);border-radius:8px;height:8px;overflow:hidden;">
        <div style="background:linear-gradient(90deg,#a855f7,#6366f1);height:100%;width:${pct}%;transition:width .4s;border-radius:8px;"></div>
      </div>
    </div>`;
  }

  // Список: сначала разблокированные, потом заблокированные
  const sorted = [...ACHIEVEMENT_LIST].sort((a,b)=>{
    const ua=unlocked.includes(a.id), ub=unlocked.includes(b.id);
    return ua===ub ? 0 : ua ? -1 : 1;
  });
  el.innerHTML = sorted.map(a => {
    const got = unlocked.includes(a.id);
    return `<div style="display:flex;align-items:center;gap:12px;padding:10px 12px;margin-bottom:8px;
      border-radius:14px;background:${got?'rgba(255,255,255,0.72)':'rgba(255,255,255,0.38)'};
      border:1.5px solid ${got?'rgba(168,85,247,0.55)':'rgba(255,255,255,0.30)'};
      opacity:${got?'1':'0.65'};">
      <div style="font-size:28px;flex-shrink:0;${got?'':'filter:grayscale(1);'}">${a.icon}</div>
      <div style="flex:1;min-width:0;">
        <div style="font-size:14px;font-weight:700;color:#2d1048;">${a.title}</div>
        <div style="font-size:12px;color:#6b3a5c;margin-top:2px;">${a.desc}</div>
      </div>
      ${got?'<div style="color:#a855f7;font-size:18px;">✓</div>':''}
    </div>`;
  }).join('');

  // Трофеи
  const earnedTrophies = state.trophies || [];
  const trophyHTML = TROPHIES.map(t => {
    const got = earnedTrophies.includes(t.id);
    return `<div style="display:flex;align-items:center;gap:12px;padding:10px 12px;margin-bottom:8px;
      border-radius:14px;background:${got?'rgba(255,255,255,0.72)':'rgba(255,255,255,0.38)'};
      border:1.5px solid ${got?'rgba(255,215,0,0.55)':'rgba(255,255,255,0.25)'};
      opacity:${got?'1':'0.65'};">
      <div style="font-size:30px;flex-shrink:0;${got?'filter:drop-shadow(0 0 6px #fbbf24);':'filter:grayscale(1);'}">${t.icon}</div>
      <div style="flex:1;min-width:0;">
        <div style="font-size:14px;font-weight:700;color:#2d1048;">${t.name}</div>
        <div style="font-size:12px;color:#6b3a5c;margin-top:2px;">${t.desc}</div>
      </div>
      ${got?'<div style="color:#b45309;font-size:18px;">🏅</div>':''}
    </div>`;
  }).join('');

  el.insertAdjacentHTML('beforeend', `
    <div style="margin-top:18px;margin-bottom:6px;font-size:13px;font-weight:700;color:#fff;text-shadow:0 1px 2px rgba(20,10,0,.65);letter-spacing:0.05em;text-transform:uppercase;">
      🏆 Трофеи (${earnedTrophies.length}/${TROPHIES.length})
    </div>
    ${trophyHTML}
  `);
}

function showAchievementToast(icon, title) {
  const toast = document.getElementById('ach-toast');
  if (!toast) return;
  document.getElementById('ach-toast-icon').textContent = icon;
  document.getElementById('ach-toast-text').textContent = '🏆 ' + title;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2800);
}

function checkAchievements() {
  if (state.comboCount >= 3) unlockAchievement('combo_3');
  if (state.comboCount >= 5) unlockAchievement('combo_5');
  if (state.streakDays >= 3) unlockAchievement('streak_3');
  if (state.streakDays >= 7) unlockAchievement('streak_7');
  if (state.coins >= 500)    unlockAchievement('rich');
  if ((state.totalIceBroken||0) >= 100)   unlockAchievement('ice_master');
  if ((state.totalStonesBroken||0) >= 50) unlockAchievement('stone_master');
}

