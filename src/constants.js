// ══════════════════════════════════════════
//  КОНСТАНТЫ
// ══════════════════════════════════════════
let COLS = 8, ROWS = 10;
const GEM_TYPES = 7;
const MAX_LIVES = 5;
const LIFE_REGEN_MS = 30 * 60 * 1000; // 30 минут

// ── Физические константы (по стандарту CCSS tweakdata.json) ──
const PHYSICS = {
  SWAP_MS:        75,    // swap_time 0.075s
  UNDO_MS:       100,    // undo_swap_time 0.1s
  DROP_MS:       430,    // t=√(2×ROWS×tile_height/accel); ROWS=10, tile=74px, accel=wrapped_explosion_acceleration=8000px/s² → 430ms
  DESTROY_MS:    200,    // item_default_destruction_process_ticks 12/60
  RAINBOW_MS:  500,    // colorbomb_destruction_process_ticks 30/60
  ROCKET_MS:      1000,    // rocket_duration_to_target 1.0s
  SHUFFLE_MS:   1667,    // shuffle_duration_ticks 100/60
  WIN_SEQ_MS:   3000,    // win_sequence_length_seconds 3.0s
  HINT_BEGINNER: 3000,   // board_move_hint_seconds_beginner
  HINT_EXPERT:   5000,   // board_move_hint_seconds_expert
  BOUNCE_SCALE:  0.48,   // bounce_velocity_scale -0.48 (abs)
  BASE_SCORE:      20,   // базовые очки за один гем в матче
};

const _PHYSICS_BASE = Object.assign({}, PHYSICS);
let _devAnimSpeed = 1.0;
function setDevAnimSpeed(v) {
  _devAnimSpeed = Math.max(0.1, Math.min(5, +v));
  ['SWAP_MS','UNDO_MS','DROP_MS','DESTROY_MS','RAINBOW_MS','ROCKET_MS','SHUFFLE_MS'].forEach(
    k => { PHYSICS[k] = Math.round(_PHYSICS_BASE[k] / _devAnimSpeed); }
  );
}
function _d(ms) { return Math.max(1, Math.round(ms / _devAnimSpeed)); }

// ── Тактильная обратная связь ──
const HAPTIC = {
  tap:     [10],
  match:   [20],
  special: [30,10,30],
  explode: [50,10,50,10,50],
  win:     [30,20,30,20,80],
  lose:    [100],
};
function haptic(pattern) {
  if (!navigator.vibrate) return;
  if (typeof state!=='undefined' && !state.vibroOn) return;
  navigator.vibrate(HAPTIC[pattern] || HAPTIC.tap);
}

// ── Библиотека easing-функций (формулы из CCSS) ──
const EASE = {
  linear:      t => t,
  outQuad:     t => 1-(1-t)*(1-t),
  outCubic:    t => 1-Math.pow(1-t,3),
  outQuart:    t => 1-Math.pow(1-t,4),
  inOutCubic:  t => t<0.5 ? 4*t*t*t : 1-Math.pow(-2*t+2,3)/2,
  outBack:     t => 1+(t-1)*(t-1)*(2.70158*(t-1)+1.70158),
  inBack:      t => t*t*(2.70158*t-1.70158),
  outElastic:  t => t===0?0:t===1?1:Math.pow(2,-10*t)*Math.sin((t*10-0.75)*(2*Math.PI)/3)+1,
  outBounce(t) {
    const n=7.5625, d=2.75;
    if (t<1/d)   return n*t*t;
    if (t<2/d)   { t-=1.5/d;  return n*t*t+0.75; }
    if (t<2.5/d) { t-=2.25/d; return n*t*t+0.9375; }
    t-=2.625/d; return n*t*t+0.984375;
  },
};

const GEMS = [
  { id:0, color:'#f0c030', shape:'ore_spike',  name:'Золото'   },
  { id:1, color:'#4aafff', shape:'ore_hex',    name:'Сапфир'   },
  { id:2, color:'#30d870', shape:'ore_rect',   name:'Изумруд'  },
  { id:3, color:'#ff4848', shape:'ore_round',  name:'Рубин'    },
  { id:4, color:'#c060ff', shape:'ore_tri',    name:'Аметист'  },
  { id:5, color:'#ff8840', shape:'ore_blob',   name:'Янтарь'   },
  { id:6, color:'#1a6ce8', shape:'diamond',    name:'Лазурит'  },
];

const SPECIAL = { NONE:0, STRIPE_H:1, STRIPE_V:2, RAINBOW:4, ROCKET:6, BOMB:7, COLORING:8 };

function getSkinColor(gemType) {
  return GEMS[gemType]?.color || '#fff';
}

// LEVELS array is loaded from levels.js

// ── Миграция 8×8 → 8×10 ──────────────────────────────────────
(function migrateToRows10() {
  // Disabled: levels already in 10-row format
})();

// ── Постобработка уровней: формула сложности ────────────────
function patchLevelBalance() {
  LEVELS.forEach(lvl => {
    const holes = (lvl.holes||[]).length;
    const obs   = Math.round((lvl.iceCount||0)*0.7 + (lvl.stoneCount||0)*0.5);
    const typ   = Math.round(Math.max(0, (lvl.gemTypes||4) - 3) * 1.5);
    // Трёхуровневые пороги звёзд
    if (lvl.target > 0) {
      if (lvl.type === 'score') {
        // Score: играем все ходы, чем больше — тем лучше. 1★=target, 2★=×2, 3★=×3.5
        lvl.starlevel = [lvl.target, Math.round(lvl.target*2.0), Math.round(lvl.target*3.5)];
      } else {
        lvl.starlevel = [lvl.target, Math.round(lvl.target*2.5), Math.round(lvl.target*4.0)];
      }
    } else {
      delete lvl.starlevel; // fallback: 33/66/100% прогресса
    }
    // Трекинг ревизий 
    if (lvl.revision === undefined) lvl.revision = 0;

    if (lvl.type === 'score' && lvl.target > 6000) {
      // Больше ходов, меньше типов фишек
      const computed = Math.round(lvl.target/600) + obs + typ + Math.round(holes*0.25);
      lvl.moves = Math.max(lvl.moves, computed);
      // Уменьшаем типы фишек для сложных уровней
      if (lvl.target <= 12000) lvl.gemTypes = Math.min(lvl.gemTypes, 4);
      else if (lvl.target <= 18000) lvl.gemTypes = Math.min(lvl.gemTypes, 5);
      else lvl.gemTypes = Math.min(lvl.gemTypes, 5);
    }

    if (lvl.type === 'buckets') {
      const cnt = lvl.bucketCount || lvl.target || 4;
      const computed = Math.round(cnt * 7) + obs + typ;
      lvl.moves = Math.max(lvl.moves, computed);
    }

    if (lvl.type === 'collect') {
      const cnt = lvl.target || 20;
      const gemPen = Math.round(Math.max(0, (lvl.gems||[]).length - 1) * 3);
      const computed = Math.round(cnt * 0.65) + obs + typ + gemPen + Math.round(holes*0.2);
      lvl.moves = Math.max(lvl.moves, computed);
    }

    if (lvl.type === 'ice') {
      const cnt = lvl.iceCount || lvl.target || 5;
      const computed = Math.round(cnt * 1.2) + obs + typ + Math.round(holes*0.2);
      lvl.moves = Math.max(lvl.moves, computed);
    }

    if (lvl.type === 'dirt') {
      const cnt = lvl.dirtCount || 10;
      const computed = Math.round(cnt * 0.85) + obs + typ + Math.round(holes*0.2);
      lvl.moves = Math.max(lvl.moves, computed);
    }

    if (lvl.type === 'stone') {
      const cnt = lvl.stoneCount || lvl.target || 5;
      const computed = Math.round(cnt * 1.4) + obs + typ + Math.round(holes*0.2);
      lvl.moves = Math.max(lvl.moves, computed);
    }

    if (lvl.type === 'lava') {
      const cnt = lvl.lavaCount || 5;
      const computed = Math.round(cnt * 1.8) + obs + typ + Math.round(holes*0.2);
      lvl.moves = Math.max(lvl.moves, computed);
    }

    if (lvl.type === 'bricks') {
      const total = COLS * ROWS - holes;
      const computed = Math.round(total * 0.15) + obs + typ;
      lvl.moves = Math.max(lvl.moves, computed);
    }

    if (lvl.type === 'flood') {
      const cnt = lvl.flaskCount || lvl.target || 3;
      const computed = Math.round(cnt * 4.5) + obs + typ + Math.round(holes*0.2);
      lvl.moves = Math.max(lvl.moves, computed);
    }

    if (lvl.type === 'relics') {
      const cnt = lvl.relicsTarget || 3;
      const amberCnt = lvl.amberCount || 0;
      const computed = Math.round(cnt * 5) + Math.round(amberCnt * 1.5) + obs + typ;
      lvl.moves = Math.max(lvl.moves, computed);
    }

    // CCSS-стиль: сложность через препятствия, не ходы. Диапазон 20-40 ходов.
    lvl.moves = Math.max(20, Math.min(40, lvl.moves));
  });
}

