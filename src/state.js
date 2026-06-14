// ══════════════════════════════════════════
//  STATE
// ══════════════════════════════════════════
const state = {
  screen: 'loading',
  lang: 'ru',
  soundOn: true,
  musicOn: true,
  vibroOn: true,
  musicVol: 80,   // 0-100
  sfxVol:   80,   // 0-100

  // Экономика
  coins: 100,
  crystals: 10,
  lives: 5,
  livesTimestamp: 0,  // когда начали регенерацию
  lives24hUntil: 0,   // timestamp окончания безлимитных жизней
  noAds: false,
  starterShown: false, // показан ли стартовый пак

  // Прогресс
  maxUnlocked: 1,
  levelStars: {},

  // Стрик
  streakDays: 0,
  lastLoginDate: '',   // 'YYYY-MM-DD'
  streakLost: false,   // нужен ли popup "восстановить стрик"

  // Ежедневная награда
  dailyDayClaimed: 0,  // номер последнего claimed дня в цикле (1-7)
  dailyLastClaim: '',  // 'YYYY-MM-DD'

  // Геймплей
  currentLevel: 1,
  board: [],
  moves: 0,
  score: 0,
  collectedGems: {},
  iceBroken: 0,
  stonesBroken: 0,
  totalIceBroken: 0,
  totalStonesBroken: 0,
  busy: false,
  paused: false,
  comboCount: 0,
  adMovesUsed: false,
  extraMovesUsed: false,
  activeBoosters: [],  // выбранные перед уровнем бустеры (монеты)
  activePreBoosters: [], // выбранные кристалл-бустеры перед уровнем
  dirtGrid: [],       // [r][c] = 0|1|2 — слои желе на клетке
  dirtTotal: 0,       // суммарное число слоёв желе на старте уровня
  bricksGrid: [],      // [r][c] = true — ковёр на клетке (ещё не покрашен)
  bricksTotal: 0,      // общее число клеток ковра на старте
  iceGrid: [],         // [r][c] = 0|1 — лёд на клетке (не перемещается с гемом)
  holes: new Set(),    // Set<"r,c"> — позиции дыр (не заполняются)
  ingameBoosters: { hammer:0, shuffle:0, drill:0, drillclick:0, swap:0 }, // in-game запасы
  activeIngameBooster: null, // 'hammer'|'drillclick'|'swap'|null
  _swapFirst: null, // первая ячейка swap-бустера
  bucketsDelivered: 0,  // доставлено ингредиентов на дно
  lavaInitial: 0,      // шоколадок на старте уровня (для type:'lava')
  floodLevel: 0,             // сколько строк снизу залито содой
  sandSpawnRate: 0,
  sandMax: 0,
  rainbowRound: { active: false, movesLeft: 0 },
  relicsFreed: 0,
  flasksBroken: 0,         // сколько бутылок лопнуло
  lastSwap: null,           // {r1,c1,r2,c2,board,score,moves} — для undo
  undoUsedThisLevel: false, // первый undo бесплатный
  buffPieces: 0,            // Buff Buddies собранные кусочки (сбрасываются за уровень)
  buffNukeReady: false,     // нюк готов к применению
  buffNukeActive: false,    // режим выбора цели
  supersonicActive: false,  // Supersonic Mode
  supersonicMovesLeft: 0,   // ходы оставшиеся в supersonic

  // Серия побед
  rainbowStreak: 0,

  // Монетизация
  lossStreak: 0,
  totalLosses: 0,
  totalSpecials: 0,
  saveTimestamp: 0,

  // Сезонный пропуск
  seasonStart: 0,          // timestamp начала текущего сезона
  seasonXP: 0,             // накопленный XP
  seasonPremium: false,    // куплен ли премиум трек
  seasonFreeClaimedMask: 0,    // битмаска полученных наград (free), до 30 наград
  seasonPremClaimedMask: 0,    // битмаска полученных наград (premium)

  // Турнир
  tournWeekStart: 0,
  tournScore: 0,
  tournEndChecked: false,
  // Алиасы события (для совместимости с внешними системами)
  get eventActive()  { return this.tournWeekStart > 0 && this.tournWeekStart + 7*24*3600*1000 > Date.now(); },
  get eventPoints()  { return this.tournScore; },
  get eventEndDate() { return this.tournWeekStart > 0 ? new Date(this.tournWeekStart + 7*24*3600*1000) : null; },

  // Квесты
  quests: [],              // [{id, type, target, progress, reward, claimed, weekly}]
  questsDate: '',          // 'YYYY-MM-DD' — дата генерации ежедневных
  weeklyQuestDate: '',     // 'YYYY-WW' — неделя генерации

  // Достижения
  achievements: [],        // массив разблокированных id
  trophies: [],            // массив полученных трофеев
  totalWins: 0,            // счётчик побед всего

  // Пигги-банк
  piggyFill: 0,            // 0–100 %

  // Монетизация (счётчики)
  levelAttempts: {},       // {levelNum: count} — попытки на уровне
  firstAttemptWins: {},    // {levelNum: true} — уровни пройденные с первой попытки
  tutorialDone: false,     // онбординг завершён (не показывать повторно)
  tutorialSeen: {},        // {level: true} — какие шаги уже показаны
  specialOfferShown: {},   // {levelNum: timestamp}
  lastPlayedAt: 0,         // timestamp последней игровой сессии

  // Динамическая сложность
  recentResults: [],       // последние 5 результатов: 'win'|'lose'


  // Sidekick (компаньон-помощник)
  sidekick: { id: null, charge: 0, maxCharge: 20 },

  // Ежедневный URM-сундук
  chestStreak:    0,    // дни подряд открытия сундука (0..7)
  lastChestDate:  '',   // 'YYYY-MM-DD'
};

// ══════════════════════════════════════════
//  PERSISTENCE
// ══════════════════════════════════════════
const SAVE_KEY = 'gemblast_v2';

function buildSaveObj() {
  return {
    coins:          state.coins,
    crystals:       state.crystals,
    lives:          state.lives,
    livesTimestamp: state.livesTimestamp,
    lives24hUntil:  state.lives24hUntil,
    noAds:          state.noAds,
    starterShown:   state.starterShown,
    maxUnlocked:    state.maxUnlocked,
    levelStars:     state.levelStars,
    streakDays:     state.streakDays,
    lastLoginDate:  state.lastLoginDate,
    streakLost:     state.streakLost,
    dailyDayClaimed:state.dailyDayClaimed,
    dailyLastClaim: state.dailyLastClaim,
    lang:           state.lang,
    soundOn:        state.soundOn,
    vibroOn:        state.vibroOn,
    musicVol:       state.musicVol,
    sfxVol:         state.sfxVol,
    rainbowStreak:  state.rainbowStreak,
    lossStreak:     state.lossStreak,
    totalLosses:    state.totalLosses,
    seasonStart:              state.seasonStart,
    seasonXP:                 state.seasonXP,
    seasonPremium:            state.seasonPremium,
    seasonFreeClaimedMask:    state.seasonFreeClaimedMask,
    seasonPremClaimedMask:    state.seasonPremClaimedMask,
    tournWeekStart:           state.tournWeekStart,
    tournScore:               state.tournScore,
    tournEndChecked:          state.tournEndChecked,
    ingameBoosters:   state.ingameBoosters,
    quests:           state.quests,
    questsDate:       state.questsDate,
    weeklyQuestDate:  state.weeklyQuestDate,
    achievements:     state.achievements,
    piggyFill:        state.piggyFill,
    levelAttempts:    state.levelAttempts,
    firstAttemptWins: state.firstAttemptWins,
    tutorialDone:     state.tutorialDone,
    tutorialSeen:     state.tutorialSeen,
    specialOfferShown:state.specialOfferShown,
    lastPlayedAt:     state.lastPlayedAt,
    totalSpecials:    state.totalSpecials,
    totalIceBroken:   state.totalIceBroken,
    totalStonesBroken:state.totalStonesBroken,
    recentResults:    state.recentResults,

    sidekickId:       state.sidekick.id,
    chestStreak:      state.chestStreak,
    lastChestDate:    state.lastChestDate,
    ts:               Date.now(),
  };
}

const SAVE_FIELDS = ['coins','crystals','lives','livesTimestamp','lives24hUntil',
  'noAds','starterShown','maxUnlocked','levelStars','streakDays','lastLoginDate',
  'streakLost','dailyDayClaimed','dailyLastClaim','dailyLastClaimTs','lang','soundOn','vibroOn','musicVol','sfxVol',
  'rainbowStreak','lossStreak','totalLosses',
  'seasonStart','seasonXP','seasonPremium','seasonFreeClaimedMask','seasonPremClaimedMask',
  'tournWeekStart','tournScore','tournEndChecked',
  'quests','questsDate','weeklyQuestDate','achievements','piggyFill',
  'levelAttempts','firstAttemptWins','tutorialDone','tutorialSeen','specialOfferShown','lastPlayedAt','totalSpecials',
  'totalIceBroken','totalStonesBroken',
  'trophies','totalWins','shopOfferExpiry','recentResults',
  'sidekickId',
  'chestStreak','lastChestDate'];

function applySaveObj(s) {
  SAVE_FIELDS.forEach(k => { if (s[k] !== undefined) state[k] = s[k]; });
  if (s.ingameBoosters) {
    // migrate old keys: striped→drill, colorbomb stays but not shown in new panel
    const ib = { ...s.ingameBoosters };
    if (ib.striped && !ib.drill) { ib.drill = ib.striped; delete ib.striped; }
    state.ingameBoosters = { ...state.ingameBoosters, ...ib };
  }
  // Новым игрокам даём стартовые бустеры
  if (!s.ingameBoosters && !s.maxUnlocked) {
    state.ingameBoosters = { hammer:2, drill:1 };
  }
  // restore sidekick id
  if (s.sidekickId !== undefined) {
    const skDef = SIDEKICKS[s.sidekickId];
    if (skDef) { state.sidekick.id = s.sidekickId; state.sidekick.maxCharge = skDef.maxCharge; }
  }
}

function saveGame() {
  const obj = buildSaveObj();
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(obj)); } catch(e) {}
  // Облачное сохранение — не ждём, fire-and-forget
  SDK.cloudSave(obj);
}

function loadGame() {
  try {
    const s = JSON.parse(localStorage.getItem(SAVE_KEY) || '{}');
    applySaveObj(s);
  } catch(e) {}
}

// Синхронизация с облаком: берём более свежие данные
async function syncCloud() {
  const cloud = await SDK.cloudLoad();
  if (!cloud) return;
  const local = (() => { try { return JSON.parse(localStorage.getItem(SAVE_KEY)||'{}'); } catch(e) { return {}; } })();
  const cloudTs = cloud.ts || 0;
  const localTs = local.ts || 0;
  if (cloudTs > localTs) {
    console.log('[SDK] Облако новее — применяем данные из облака');
    applySaveObj(cloud);
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(cloud)); } catch(e) {}
  } else {
    console.log('[SDK] Локальные данные актуальны');
  }
}

// Восстановление платных товаров (no_ads, lives_24h) при старте
async function restorePaidItems() {
  await SDK.restorePurchases((productId) => {
    if (productId === 'no_ads')    state.noAds = true;
    if (productId === 'lives_24h') {
      if (state.lives24hUntil < Date.now())
        state.lives24hUntil = Date.now() + 24 * 60 * 60 * 1000;
    }
  });
}

