// ══════════════════════════════════════════
//  КОМБО + CANDY COMMENTS
// ══════════════════════════════════════════
let comboTO=null;
let _onFireTO = null;
function showCombo(n) {
  const el=document.getElementById('combo-display');
  const colors = ['','','#ffe066','#f59e0b','#ef4444','#a855f7','#38bdf8'];
  const col = colors[Math.min(n, colors.length-1)] || '#fff';
  const sz = Math.min(52 + (n-2)*6, 80);
  el.textContent = `COMBO ×${n}!`;
  el.style.cssText = `opacity:1;font-size:${sz}px;color:${col};text-shadow:0 0 ${20+n*4}px ${col};transform:translate(-50%,-50%) scale(1.15);transition:transform .1s,opacity .15s;`;
  clearTimeout(comboTO);
  comboTO = setTimeout(() => {
    el.style.transform = 'translate(-50%,-50%) scale(1)';
    setTimeout(() => el.style.opacity = '0', 80);
  }, 500);
  // On Fire + восклицание при высоких каскадах
  if (n >= 3) {
    const beam = document.getElementById('on-fire-beam');
    if (beam) { beam.style.display='block'; }
    clearTimeout(_onFireTO);
    _onFireTO = setTimeout(()=>{ const b=document.getElementById('on-fire-beam'); if(b) b.style.display='none'; }, 1200);
    if (n >= 12) showExclamation('combo12');
    else if (n >= 8) showExclamation('combo8');
    else if (n >= 5) showExclamation('combo5');
  }
}
function stopOnFire() {
  clearTimeout(_onFireTO);
  const beam=document.getElementById('on-fire-beam');
  if (beam) beam.style.display='none';
}

const CANDY_WORDS = {
  ru: ['','','Класс!','Чудесно!','Отлично!','Великолепно!','Невероятно!','Легенда!'],
  en: ['','','Sweet!','Delicious!','Amazing!','Incredible!','Divine!','Legendary!']
};
const CANDY_COLORS = ['','','#ffe066','#f59e0b','#ef4444','#a855f7','#38bdf8','#4ade80'];
let candyCommentTO = null;

// советы при повторной попытке
const RETRY_TIPS = [
  '💡 Создавай полосатые фишки — они убирают целый ряд!',
  '💡 Комбо из 5 в ряд → Радуга убивает все фишки одного цвета!',
  '💡 2×2 квадрат → Фейерверк атакует самый сложный блок на поле',
  '💡 Думай наперёд — планируй 2-3 хода заранее',
  '💡 Бомба + Полоса = тройной крест! Комбинируй спецфишки',
  '💡 Лёд ломается матчем рядом — не нужно бить по нему напрямую',
  '💡 Подсказка мигает — следи за ней в трудные моменты',
  '💡 Собирай фишки в углах — там легче создавать длинные цепи',
  '💡 Ингредиенты падают сами — освободи им путь вниз',
  '💡 Радуга + Радуга = очищает всё поле целиком!',
];
let _lastTipIdx = -1;
function getNextTip() {
  let idx; do { idx = Math.floor(Math.random() * RETRY_TIPS.length); } while (idx === _lastTipIdx);
  _lastTipIdx = idx;
  return RETRY_TIPS[idx];
}

// восклицательные баннеры
const EXCLAMATIONS = {
  rainbow:   { ru:'🌈 РАДУГА!',       en:'🌈 RAINBOW!',   color:'#a855f7' },
  shuffle:   { ru:'🔀 ПЕРЕМЕШАЛОСЬ!', en:'🔀 SHUFFLED!',  color:'#38bdf8' },
  closecall: { ru:'⚡ НА ПОСЛЕДНЕМ ХОДУ!', en:'⚡ CLOSE CALL!', color:'#ffe066' },
  combo5:    { ru:'🔥 ОТЛИЧНО!',      en:'🔥 AMAZING!',   color:'#f59e0b' },
  combo8:    { ru:'💥 НЕВЕРОЯТНО!',   en:'💥 INCREDIBLE!',color:'#ef4444' },
  combo12:   { ru:'🌟 ШИКАРНО!',      en:'🌟 DIVINE!',    color:'#4ade80' },
};
let _exclBusy = false, _exclTO = null;
function showExclamation(key) {
  if (_exclBusy) return;
  const ex = EXCLAMATIONS[key]; if (!ex) return;
  _exclBusy = true;
  const text = ex[state.lang] || ex.ru;
  const col  = ex.color;
  const el   = document.getElementById('candy-comment');
  if (!el) { _exclBusy=false; return; }
  el.textContent = text;
  el.style.cssText = `opacity:0;color:${col};font-size:42px;text-shadow:0 0 24px ${col},0 2px 0 rgba(0,0,0,0.55);` +
    `transform:translate(-50%,-50%) scale(0);transition:none;`;
  requestAnimationFrame(()=>{
    el.style.transition='opacity .12s, transform .25s cubic-bezier(.2,1.6,.4,1)';
    el.style.opacity='1'; el.style.transform='translate(-50%,-50%) scale(1.1)';
    clearTimeout(_exclTO);
    _exclTO = setTimeout(()=>{
      el.style.transition='opacity .3s, transform .3s';
      el.style.opacity='0'; el.style.transform='translate(-50%,-50%) scale(0.7)';
      setTimeout(()=>{ _exclBusy=false; },350);
    }, 1400);
  });
}
function showCandyComment(n) {
  const el = document.getElementById('candy-comment');
  if (!el) return;
  const words = CANDY_WORDS[state.lang] || CANDY_WORDS.ru;
  const idx  = Math.min(n, words.length - 1);
  const word = words[idx];
  const col  = CANDY_COLORS[idx] || '#fff';
  el.textContent = word;
  el.style.cssText = `opacity:1;color:${col};text-shadow:0 0 18px ${col},0 2px 0 rgba(0,0,0,0.55);transform:translate(-50%,-50%) scale(1.05);transition:opacity .12s,transform .15s;`;
  clearTimeout(candyCommentTO);
  candyCommentTO = setTimeout(() => {
    el.style.opacity = '0';
    el.style.transform = 'translate(-50%,-50%) scale(0.85)';
  }, 950);
}

// ══════════════════════════════════════════
//  ШЕЙ
// ══════════════════════════════════════════
let shakeTO=null, shakeRAF=null;
function spawnScreenShake(amplitude=10) {
  const g=document.getElementById('screen-game');
  if (shakeRAF) { cancelAnimationFrame(shakeRAF); shakeRAF=null; }
  clearTimeout(shakeTO);
  const dur=300, t0=performance.now();
  function frame(now) {
    const t=Math.min((now-t0)/dur,1);
    const decay=1-t; // linear decay
    const x=Math.sin(t*Math.PI*7)*amplitude*decay;
    const y=Math.cos(t*Math.PI*5)*amplitude*0.6*decay;
    g.style.transform=`translate(${x.toFixed(1)}px,${y.toFixed(1)}px)`;
    if (t<1) shakeRAF=requestAnimationFrame(frame);
    else { g.style.transform=''; shakeRAF=null; }
  }
  shakeRAF=requestAnimationFrame(frame);
  if (state.vibroOn && navigator.vibrate) navigator.vibrate(40);
}

// ══════════════════════════════════════════
