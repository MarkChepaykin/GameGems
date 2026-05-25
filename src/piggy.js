// ══════════════════════════════════════════
//  ПИГГИ-БАНК (P3-1)
// ══════════════════════════════════════════
function addPiggyCoins(coinsEarned) {
  // 1 coin earned = 0.5% piggy fill
  state.piggyFill = Math.min(100, (state.piggyFill || 0) + coinsEarned * 0.5);
  renderPiggyBar();
  if (state.piggyFill >= 100) showToast('🐷 Копилка полна! Разбейте её в меню!');
}

function renderPiggyBar() {
  const fill  = document.getElementById('piggy-fill-bar');
  const label = document.getElementById('piggy-label');
  const sub   = document.getElementById('piggy-sub-label');
  const emoji = document.getElementById('piggy-row-emoji');
  const pct = Math.round(state.piggyFill || 0);
  if (fill)  fill.style.width  = pct + '%';
  if (label) label.textContent = pct + '%';
  if (sub) {
    if (pct >= 100) {
      sub.textContent = '💥 Готова к разбитию! Нажми чтобы забрать!';
      sub.style.color = '#fbbf24';
    } else {
      sub.textContent = `Наполняется пока ты играешь`;
      sub.style.color = '#94a3b8';
    }
  }
  if (emoji) emoji.textContent = pct >= 100 ? '🐷💥' : '🐷';
}

function openPiggyModal() {
  const modal = document.getElementById('piggy-modal');
  if (!modal) return;
  const pct = Math.round(state.piggyFill || 0);
  document.getElementById('piggy-modal-pct').textContent = pct + '%';
  document.getElementById('piggy-modal-fill').style.width = pct + '%';
  const broken = pct >= 100;
  document.getElementById('piggy-modal-emoji').textContent = broken ? '🐷💥' : '🐷';
  const btn = document.getElementById('btn-piggy-break');
  btn.disabled = !broken;
  btn.style.opacity = broken ? '1' : '0.45';
  const desc = document.getElementById('piggy-modal-desc');
  desc.textContent = broken
    ? 'Копилка заполнена! Разбейте за 49 💎 и получите 120–300 🪙!'
    : `Заполнена на ${pct}%. Каждый пройденный уровень прибавляет монеты в копилку.`;
  const hint = document.getElementById('piggy-reward-hint');
  if (hint) hint.textContent = broken
    ? `✅ Нажмите кнопку ниже и заберите монеты!`
    : `Ещё ${100 - pct}% до разбития. Осталось примерно ${Math.ceil((100 - pct) / 15)} уровней.`;
  modal.classList.add('show');
}

function closePiggyModal() {
  document.getElementById('piggy-modal')?.classList.remove('show');
}

function breakPiggyBank() {
  if ((state.piggyFill || 0) < 100) return;
  if (state.crystals < 49) { showToast('Недостаточно 💎 (нужно 49)'); return; }
  state.crystals -= 49;
  const reward = 120 + Math.floor(Math.random() * 181); // 120–300
  state.coins += reward;
  state.piggyFill = 0;
  saveGame();
  renderPiggyBar();
  closePiggyModal();
  refreshLevelsCurrency();
  showToast(`🐷💥 Получено ${reward} 🪙!`);
  unlockAchievement('piggy_break');
}

