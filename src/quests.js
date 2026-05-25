// ══════════════════════════════════════════
//  КВЕСТЫ (P2-2)
// ══════════════════════════════════════════
const QUEST_TEMPLATES = [
  { id:'q_score',    icon:'🏆', title:'Набери %n очков',       type:'score',    targets:[500,1000,2000,3000] },
  { id:'q_moves',    icon:'🔄', title:'Сделай %n ходов',       type:'moves',    targets:[20,30,50,70] },
  { id:'q_combo',    icon:'💥', title:'Сделай %n комбо',       type:'combo',    targets:[3,5,8,10] },
  { id:'q_levels',   icon:'🎮', title:'Пройди %n уровня(ей)', type:'levels',   targets:[1,2,3,5] },
  { id:'q_ice',      icon:'🧊', title:'Разбей %n льдинок',     type:'ice',      targets:[5,10,15,20] },
  { id:'q_stones',   icon:'🪨', title:'Убери %n камней',       type:'stones',   targets:[3,5,8,10] },
  { id:'q_specials', icon:'⚡', title:'Активируй %n спецгемов',type:'specials', targets:[2,4,6,8] },
];

function todayStr() { return new Date().toISOString().slice(0,10); }
function thisWeekStr() {
  const d = new Date(); const day = d.getDay();
  d.setDate(d.getDate() - day);
  return d.toISOString().slice(0,10);
}

function generateDailyQuests() {
  const today = todayStr();
  const week  = thisWeekStr();
  let changed = false;

  const existingDaily = (state.quests||[]).filter(q=>!q.weekly).length;
  if (state.questsDate !== today || existingDaily === 0) {
    // 3 ежедневных квеста
    const daily = [];
    const pool = [...QUEST_TEMPLATES].sort(() => Math.random() - 0.5).slice(0, 3);
    pool.forEach(t => {
      const targetIdx = Math.floor(Math.random() * t.targets.length);
      daily.push({ id: t.id+'_'+Date.now()+'_'+Math.random().toString(36).slice(2,6),
        templateId: t.id, icon: t.icon,
        title: t.title.replace('%n', t.targets[targetIdx]),
        type: t.type, target: t.targets[targetIdx],
        progress: 0, reward: { coins: 50 + targetIdx * 30 }, claimed: false, weekly: false });
    });
    // Убираем старые ежедневные, сохраняем еженедельные
    state.quests = state.quests.filter(q => q.weekly);
    state.quests = [...state.quests, ...daily];
    state.questsDate = today;
    changed = true;
  }

  const existingWeekly = (state.quests||[]).filter(q=>q.weekly).length;
  if (state.weeklyQuestDate !== week || existingWeekly === 0) {
    const t = QUEST_TEMPLATES[Math.floor(Math.random() * QUEST_TEMPLATES.length)];
    const targetIdx = Math.min(t.targets.length - 1, 2);
    state.quests = state.quests.filter(q => !q.weekly);
    state.quests.push({ id: 'weekly_'+week, templateId: t.id, icon: '📅',
      title: '[Нед.] ' + t.title.replace('%n', t.targets[targetIdx] * 3),
      type: t.type, target: t.targets[targetIdx] * 3,
      progress: 0, reward: { coins: 200, crystals: 10 }, claimed: false, weekly: true });
    state.weeklyQuestDate = week;
    changed = true;
  }

  if (changed) saveGame();
}

let _questFlushTimer = null;
function updateQuestProgress(type, amount) {
  let toastShown = false;
  let changed = false;
  state.quests.forEach(q => {
    if (q.claimed || q.progress >= q.target) return;
    if (q.type === type) {
      const prev = q.progress;
      q.progress = Math.min(q.target, q.progress + amount);
      if (q.progress !== prev) changed = true;
      if (q.progress >= q.target && !toastShown) {
        showToast(`${q.icon} Задание выполнено! Заберите награду.`);
        toastShown = true;
      }
    }
  });
  if (changed) {
    clearTimeout(_questFlushTimer);
    _questFlushTimer = setTimeout(() => { saveGame(); renderQuestsRow(); }, 600);
  }
}

function claimQuest(questId) {
  const q = state.quests.find(x => x.id === questId);
  if (!q || q.claimed || q.progress < q.target) return;
  q.claimed = true;
  if (q.reward.coins)    { state.coins    += q.reward.coins;    }
  if (q.reward.crystals) { state.crystals += q.reward.crystals; }
  saveGame();
  refreshLevelsCurrency();
  showToast(`Награда: ${q.reward.coins||0} 🪙 ${q.reward.crystals ? '+ '+q.reward.crystals+' 💎' : ''}`);
  renderQuestsRow();
  // Achievement check
  const done = state.quests.filter(x => x.claimed).length;
  if (done >= 1)  unlockAchievement('quest_first');
  if (done >= 10) unlockAchievement('quest_ten');
}

function updateQuestBadge() {
  const badge = document.getElementById('quest-notif-badge');
  if (!badge || !state.quests) return;
  const count = state.quests.filter(q => !q.claimed && q.progress >= q.target).length;
  if (count > 0) { badge.textContent = count; badge.style.display = ''; }
  else { badge.style.display = 'none'; }
}
function renderQuestsRow() {
  const row = document.getElementById('quests-row');
  updateQuestBadge();
  if (!row) return;
  if (!state.quests.length) { row.innerHTML = '<div style="color:#64748b;font-size:13px;padding:8px;">Заданий нет</div>'; return; }
  row.innerHTML = state.quests.map(q => {
    const pct = Math.min(100, Math.round(q.progress / q.target * 100));
    const done = q.progress >= q.target;
    const cls  = q.claimed ? 'quest-card claimed' : done ? 'quest-card done' : 'quest-card';
    const btn  = done && !q.claimed
      ? `<button class="btn btn-green btn-sm" style="width:100%;margin-top:6px;font-size:11px;padding:4px 8px;" onclick="claimQuest('${q.id}')">Забрать!</button>`
      : '';
    return `<div class="${cls}">
      <div class="quest-icon">${q.icon}</div>
      <div class="quest-title">${q.title}</div>
      <div class="quest-prog">${q.progress}/${q.target}</div>
      <div class="quest-bar"><div class="quest-bar-fill" style="width:${pct}%"></div></div>
      <div class="quest-reward">+${q.reward.coins||0} 🪙${q.reward.crystals?' +'+q.reward.crystals+' 💎':''}</div>
      ${btn}
    </div>`;
  }).join('');
}

function renderQuestsFull() {
  const dailyEl  = document.getElementById('quests-daily-full');
  const weeklyEl = document.getElementById('quests-weekly-full');
  if (!dailyEl || !weeklyEl) return;
  document.getElementById('qst-coins').textContent    = state.coins;
  document.getElementById('qst-crystals').textContent = state.crystals;
  document.getElementById('qst-lives').textContent    = livesDisplay();

  function cardHTML(q) {
    const pct = Math.min(100, Math.round(q.progress / q.target * 100));
    const done = q.progress >= q.target;
    const cls  = q.claimed ? 'quest-full-card claimed' : done ? 'quest-full-card done' : 'quest-full-card';
    const claimBtn = done && !q.claimed
      ? `<button class="btn btn-green btn-sm" style="font-size:12px;padding:5px 14px;margin-top:0;" onclick="claimQuest('${q.id}');renderQuestsFull()">Забрать!</button>`
      : q.claimed ? `<span style="color:#4ade80;font-size:18px;">✓</span>` : '';
    return `<div class="${cls}">
      <div class="qfc-icon">${q.icon}</div>
      <div class="qfc-body">
        <div class="qfc-title">${q.title}</div>
        <div class="qfc-progress">${q.progress} / ${q.target}</div>
        <div class="qfc-bar"><div class="qfc-bar-fill" style="width:${pct}%"></div></div>
        <div class="qfc-reward">+${q.reward.coins||0} 🪙${q.reward.crystals?' +'+q.reward.crystals+' 💎':''}</div>
      </div>
      ${claimBtn}
    </div>`;
  }

  const daily  = state.quests.filter(q => !q.weekly);
  const weekly = state.quests.filter(q => q.weekly);
  dailyEl.innerHTML  = daily.length  ? daily.map(cardHTML).join('')  : '<div style="color:#fff;font-size:13px;padding:8px 0;text-shadow:0 1px 2px rgba(20,10,0,.60);">Нет ежедневных заданий</div>';
  weeklyEl.innerHTML = weekly.length ? weekly.map(cardHTML).join('') : '<div style="color:#fff;font-size:13px;padding:8px 0;text-shadow:0 1px 2px rgba(20,10,0,.60);">Нет еженедельных заданий</div>';

  // Таймер до следующих заданий
  const timerEl = document.getElementById('quests-timer');
  if (timerEl) {
    const allDone = daily.length > 0 && daily.every(q => q.claimed);
    if (allDone) {
      const now = new Date();
      const midnight = new Date(); midnight.setHours(24,0,0,0);
      const msLeft = midnight - now;
      const hh = Math.floor(msLeft/3600000);
      const mm = Math.floor((msLeft%3600000)/60000);
      timerEl.innerHTML = `<div style="background:rgba(255,255,255,.06);border-radius:12px;padding:12px 16px;margin-top:8px;color:#fff;text-shadow:0 1px 2px rgba(20,10,0,.60);">
        ✅ На сегодня все задания выполнены!<br>
        <span style="color:#ffd2ea;">Следующие задания через ${hh}ч ${mm}м</span>
      </div>`;
    } else {
      timerEl.innerHTML = '';
    }
  }
}

