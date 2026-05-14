# GameGems — Dev Backlog

> **Для разработчика (новый чат):** Прочитай этот файл целиком, затем прочитай
> `C:\Users\user\Projects\GameGems\index.html` — весь проект в одном файле.
> Бери первую незакрытую задачу с наивысшим приоритетом и выполняй её полностью.
> После выполнения — отмечай `[x]` и пиши краткий итог рядом.

---

## Контекст проекта

**GameGems (Gem Blast)** — мобильная match-3 игра. Весь код в одном файле:
`C:\Users\user\Projects\GameGems\index.html` (~10 000+ строк, Canvas 2D + Web Audio API).

**Роли:**
- Пользователь = визионер, PM, тестировщик. Говорит ЧТО нужно.
- Ассистент = senior-разработчик. Принимает технические решения и реализует.

**Ключевые константы:**
```
COLS=8, ROWS=10
SPECIAL={NONE:0,STRIPE_H:1,STRIPE_V:2,BOMB:3,RAINBOW:4,MEGA:5,FISH:6,WRAPPED:7,COLORING:8}
PHYSICS={SWAP_MS:75,DROP_MS:320,DESTROY_MS:200,COLORBOMB_MS:500,FISH_MS:1000,BASE_SCORE:20}
EASE={linear,outQuad,outCubic,outQuart,inOutCubic,outBack,inBack,outElastic,outBounce}
LEVELS[] — хардкод 112 уровней; getLevel(n) → n≤112:LEVELS[], n>112:generateLevel(n)
state — глобальный объект (localStorage); SKINS, SKIN_EMOJI, EPISODE_LABELS={1,17,31,51,71,86,101}
```

**Ключевые функции:**
```
processMatches()          — главный цикл матчей (async)
triggerSpecial()          — активация спецфишки
triggerCombinedSpecial()  — комбо спецфишек
applyGravity/fillFromTop/animateDrop — физика поля
trySwap/canSwap/findBestHint — логика ходов
checkWin/calcStars/patchLevelBalance — победа и баланс
showScreen/saveGame/loadGame/showToast — UI и persist
generateLevel/generateArena/seededRandom — процедурные уровни 113+
simulateLevel/runBalanceReport/autoBalanceLevels — симулятор баланса
getDifficultyTier(lvl) → 0-3 — нормал/хард/супер/ультра
BGM_LAYERS.onMovesChange() — адаптивная музыка
showUnlockScreen/showGestureHint/showExclamation — UI-хелперы
```

**Dev-панель:** FAB-кнопка 🛠️ всегда видима. +ходы, победа, спавн спешлов, телепорт.

---

## Музыка

**Файлы треков:** `C:\Users\user\Downloads\`
- `Sugar Plum Quest (1).mp3` → **меню** (MENU_BGM заменить на этот файл)
- `Sugar Plum Quest.mp3` → **игровой уровень** (BGM заменить на этот файл)

**Задача по интеграции треков:**
Заменить процедурно-генерируемые MENU_BGM и BGM на воспроизведение mp3-файлов через HTML5 Audio API.
При этом сохранить логику BGM_LAYERS (HighIntensity + EGP слои) поверх основного трека.

---

## ✅ ВЫПОЛНЕННЫЕ ЗАДАЧИ (архив)

### TASK-01 — Симулятор баланса
`findAllMoves`, `simulateLevel`, `runBalanceReport`, `autoBalanceLevels`. Кнопки в dev-панели. `_sim*` функции на изолированном состоянии.

### TASK-02 — Процедурный генератор уровней
`seededRandom` (mulberry32), `generateArena`, `generateLevel(n)` (difficulty=min(100,n*0.8)), `generateCampaign`, `getLevel(n)`. Dev: «🏭 +500 уровней».

### TASK-03 — Расширение арен
ROWS 8→10. `migrateToRows10` IIFE масштабирует score ×1.25, расширяет holes. `r<ROWS-2` вместо `r<6`.

### TASK-04 — Переработка порядка уровней
IIFE `reorderLevels()`. `difficulty(lvl)` сводной балл. Тематические уровни на слотах L16/31/51/71/86.

### CC01 — Fish спецфишка
`SPECIAL.FISH=6`. 2×2 матч → FISH. `findFishTarget()` (желе>лёд>камень>случайный). `animateFishFlight()`. Fish+Fish → 3 цели.

### CC02 — Wrapped спецфишка
`SPECIAL.WRAPPED=7`. 5 нелинейный (Г/Т/+) → WRAPPED. Двойной `blast3x3` с settle. Wrapped+Wrapped 5×5 дважды. Wrapped+Stripe: 3 полосы.

### CC03 — Экран "+5 ходов" при поражении
`state.extraMovesUsed`. Блок при прогрессе ≥60%. `buyMoreMoves()` -30💎+5 ходов. `watchAdMoves()` +5 ходов.

### CC04 — Gum Lock (замок на геме)
`cell.locked=true`. `canSwap/_simCanSwap` блокируют. Матч рядом снимает замок. L47/50/56/59 с lockCount.

### CC05 — Coloring спецфишка
`SPECIAL.COLORING=8`. Матч 6+ → COLORING. Перекрашивает все гемы своего цвета в targetColor. Coloring+Coloring меняет два цвета.

### CC11 — Тайминги win/lose анимаций
3 `<span>` звезды, `starLand` CSS (100/700/1300ms). Кнопки заблокированы 3.5с. Lose: `heartBreak` 1.4с, кнопки 1.8с.

### CC12 — Три уровня звёзд
`starlevel=[target, ×2.5, ×4.0]` в `patchLevelBalance`. `calcStars()` по starlevel. `#win-star-labels` числовые пороги.

### CC13 — Индикаторы сложности
`getDifficultyTier(lvl)` → 0-3. Черепа 💀/💀💀/💀💀💀 на карте. Тир-метка в `selectLevel()`. Фон поля темнее на super/ultra.

### CC14 — Бонус за первую попытку
`state.firstAttemptWins`, `_firstAttemptLevel`. Win с первой → +5💎 через 3.6с. 🏆 значок на кнопке.

### CC15 — Балансировка стиль CCSS
`lvl.revision=0`. Ходы 20-35. `runBalanceReport` + колонка revision. `autoBalanceLevels` меняет target. Кнопка «Revision +1».

### CC20 — On Fire эффект
`#on-fire-beam` с `onFirePulse`. `showCombo(n)` при n≥3 → beam 1.2s. `stopOnFire()` при сбросе comboCount.

### CC21 — Звёзды летят к HUD
CSS `@keyframes starFlight` (translateY 80px, scale 2.4x, -180°→0°). `SFX.reward()` при приземлении. Задержка 550ms.

### CC22 — Маскот с эмоциями
`#hud-mascot` 💎 с `mascotBob`. `_updateMascot()`: 😄/😬/😰/🤩. `mascotPop` при смене.

### CC23 — Полировка UI анимаций
`@keyframes floatIdle` на бустерах (delay 0–1.6s). Shine `barShine` на `#star-bar`. `btnBounce`, `mascotBob`, `mascotPop`.

### CC26 — Тактильная обратная связь
`HAPTIC={tap:[10],match:[20],special:[30,10,30],explode:[50,10,50,10,50],win,lose}`. `haptic(pattern)`. `state.vibroOn`.

### CC32 — Многоуровневые звуки комбо
`state.matchSoundLvl` (0-7). `SFX.match(lvl)` 440→790 Hz. Уровень 8 — триумфальный аккорд.

### CC33 — Туториал с жестами
`TUTORIAL_STEPS[]` с `handFrom/handTo`. 👆 на particle canvas. L1:[4,3]→[4,4], L2:[3,2]→[3,3], L4:[5,1]→[5,2].

### CC35 — Анимация часов
`@keyframes clockShake/clockShakeStrong` (±3.4°/±5°). secs≤2 → strong + красный.

### CC37 — Библиотека easing
`EASE` объект (8 функций: outBack, outElastic и др.). `animateDrop()` → `EASE.outBounce`. `animateBoardEntry()` → `EASE.outBack`.

### CC38 — Свечение спецфишек
Idle glow с `globalCompositeOperation='lighter'`. Radial gradient пульсирует `sin(Date.now()/700)` alpha 0.15-0.25.

### CC39 — Переходы между экранами
`_SCREEN_ANIM` маппинг. CSS `screenSlideUp/Down/Left` (60px→0, 0.32s). `screenPopIn` (overshoot 1.56).

### CC40 — Win-celebration glow + sparkle
`startWinGlow()` на `#win-glow-canvas`. Жёлтый glow (280→80px, lighter). Sparkle каждые 140ms.

### CC41 — Score-pop частицы
`spawnScorePop(r,c,gemColor)` — 4-5 частиц addBlend. Из `processMatches()`.

### CC42 — Множители очков
`sizeMult` (5+→2.0, 4→1.5). `cascMult` 1+(comboCount-1)×0.3 (cap 3.0). `×1.5`/`×2.0` поп.

### CC46 — Отмена хода (Undo)
`state.lastSwap` снапшот. Кнопка `#hud-undo-btn` ↩️. Первый undo бесплатный, следующие 10💎.

### CC48 — Размытый фон
`.result-screen::before` backdrop-filter blur(6px). `#pause-overlay` blur(8px).

### CC49 — Score Pop упругая анимация
Scale 0.2→1.224 `EASE.outElastic` (30%). Damped spring. Fade только t>0.8s.

### CC50 — Экран разблокировки
`showUnlockScreen(title,icon,description)`. Каскад: иконка 150ms, заголовок 350ms, описание 550ms, кнопка 750ms.

### CC51 — Toast slide-from-top
`showToast()` slide `top:-60px→20px` 0.3s. Очередь `_toastQueue`. `max(2000,msg.length×60)`.

### CC52 — Gesture hint оверлей
`showGestureHint(fromR,fromC,toR,toC)`. 👆 на particle canvas. Движение 0.7s easeInOut.

### CC53 — Win-экран по сложности
CSS `.win-tier-hard/super/ultra`. Баннер `#win-hard-cleared`. Через `getDifficultyTier()`.

### CC55 — Loss aversion quit dialog
`confirmQuitLevel()` с backdrop-blur + rainbowStreak предупреждение. "Продолжить" визуально больше "Выйти".

### CC57 — Difficulty badges
CSS `.tier-hard/superhard/ultrahard` box-shadow. Бейдж 🔥/💥/☠️ верхний левый угол кнопки.

### CC60 — Rainbow Streak
`state.rainbowStreak` (0-4). `#pg-rainbow-streak` 5 иконок 🌈/⬜. При 5 → +colorbomb + тост.

### CC63 — 12-шаговая мелодия матчей
`state.matchSequenceStep` (0-11). `freq=440×2^(step/12)`. При step=11: аккорд [440,554,659,880].

### CC64 — 3-слойная адаптивная музыка
`BGM_LAYERS` с `hiGain/egpGain`. HighIntensity при moves<5. EGP при спешле (1.4s fade-in, hold 3s).

### CC66 — Стерео-пан матчей
`StereoPannerNode`. `SFX.match(lvl)` пан нарастает с lvl. При lvl=7: три ноты [0,-0.4,0.4].

### CC67 — Восклицательные баннеры
`EXCLAMATIONS` {combo5:'ОТЛИЧНО!', combo8:'НЕВЕРОЯТНО!', combo12:'ШИКАРНО!', rainbow:'РАДУГА!'}. Очередь max 1.

### CC68 — Difficulty announcement
`_showDifficultyBanner(tier)` slide-up снизу. hard(оранж,660Hz), superhard(красн,784Hz), ultrahard(фиолет,440+880Hz).

### CC76 — Точная физика (PHYSICS объект)
`PHYSICS={SWAP_MS:75,DROP_MS:320,DESTROY_MS:200,COLORBOMB_MS:500,FISH_MS:1000,BASE_SCORE:20}`.

### CC78 — Stars cap и счётчик
`getTotalStars()`. `⭐ N` в `#m-total-stars`. `refreshMenu()` обновляет.

### CC79 — "ТАК БЛИЗКО!" на lose-экране
`#lose-progress-bar-wrap`. Тег при nearMiss≥70%. Bar при ≥40%. Анимация `width 0→X%` 0.5s.

### CC81 — Retry Tips
`RETRY_TIPS` (10 советов). `getNextTip()` без повторов. `#lose-retry-tip` со 2-й попытки.

### CC82 — Buff Buddies нюк
`state.buffPieces/buffNukeReady`. `BUFF_PIECES_TARGET=10`. `addBuffPiece()` при матче 5+. `fireBuffNuke(r,c)` каскадный 3×3.

### CC43 — Rainbow Round
`state.rainbowRound={active,movesLeft}`. Раз в 20 побед → 3 хода. `fillFromTop()` 30% шанс RAINBOW gem. `#game-canvas.rainbow-round` CSS `hue-rotate` анимация. `showRainbowRoundBanner()` поп-баннер + SFX. `updateRainbowRoundHUD()` синхронизирует класс. Сброс при retry.

### CC17 — Лакрица-слои (Licorice)
`cell.licorice=N` (1-3). `canSwap()` блокирует. Матч рядом → `licorice--`. BOMB/STRIPE/MEGA → `licorice=0`. `applyGravity()` блокирует падение. `spawnLicorice()` автоспавн в `spendMove()` по `licoriceSpawnRate`. Рендер: N концентрических эллипсов + 🍬. L56/58/62 хардкод, generateLevel difficulty>50.

### CC16 — Порталы на поле
`state.portalGrid[r][c]={id,exitR,exitC,color}`. `initBoard()` читает `lvl.portals[[r1,c1,r2,c2]]`. Матч у входа → exit-клетка добавляется в `cellsArr`. STRIPE_H/V продолжает всю exit-строку/колонку. BOMB/MEGA добавляют exit в множество. Визуал: пульсирующие кольца + дуга-безье + 🌀. L103/106/109/112 хардкод, generateLevel difficulty>70 детерминировано.

### CC07 — Экран пре-уровневых бустеров
`screen-pregame` между levels и game. `PRE_BOOSTERS[]` (💎-бустеры). `BOOSTERS[]` (🪙-бустеры). `togglePreBooster/toggleBooster`. С L10+: кристалл-бустеры. `buildBoostersUI()`. Кнопка "▶ Начать!".

### CC08 — Ежедневный календарь наград
7-дневный цикл `DAILY_REWARDS[]`. `state.loginStreak/lastLoginDate/streakRewardsClaimed`. Модал `claimDailyReward()`. Рамки по редкости. Стрик сбрасывается при пропуске.

### CC10 — Газировка (Soda Mechanic)
`state.sodaLevel` (0..ROWS). `cell.bottle=true` — матч рядом → `popBottle()` → `sodaLevel++`. Синий оверлей + пузырьки в drawBoard. Обратная гравитация в soda-зоне (`fillFromTop` skip).

### CC34 — Система жизней
`state.lives/livesTimestamp/lives24hUntil`. `MAX_LIVES=5`, рег. каждые 30 мин. `spendLife()`. Экран "Нет жизней". Таймер MM:SS. "Безлимит" за 50💎.

### CC06 — Мистический контейнер
`cell.mystery=true`. `canSwap()` блокирует. BOMB/STRIPE/MEGA иммунен. Матч рядом → `popMystery()`: STRIPE_H(30%), STRIPE_V(30%), BOMB(25%), RAINBOW(10%), MEGA(5%). Рендер: ❓ фиолетовый. L60/70/80 хардкод, generateLevel difficulty>55.

### TASK-MP3 — Интеграция MP3 треков
`_makeMp3Bgm(src)` — HTML5 Audio wrapper. `MENU_BGM=_makeMp3Bgm('audio/menu.mp3')`, `BGM=_makeMp3Bgm('audio/bgm.mp3')`. `state.musicVol` (0-100) + слайдер в настройках. `state.musicOn` тоггл. `BGM_LAYERS` Web Audio поверх mp3. audio/menu.mp3 и audio/bgm.mp3 в репозитории.

### CC56 — Responsive layout
`resizeCanvas()` portrait_narrow/portrait_square/landscape detection. `boardOffX/Y` как % viewport. HUD относительно board bounds. Landscape — board максимум высоты. `orientationchange` listener.

### CC30 — Замки бустеров
`BOOSTER_UNLOCK_LEVELS={hammer:5,striped:10,colorbomb:16}`. `updateHUD()` показывает 🔒/cnt, `disabled=true`, tooltip "Откроется на LN". `activateInGameBooster()` блокирует с тостом. `checkBoosterUnlocks(prevMax,newMax)` при победе: toast + +1 free если разблокировался.

### CC31 — Адаптивная музыка (тональность)
`_musicState='calm'|'tense'|'critical'` внутри BGM_LAYERS. moves>10→calm, ≤10→tense (playbackRate→1.15 за 2s), ≤5→critical (+percGain kick/snare паттерн за 2s). `_smoothRate(target,ms)` через rAF. `getMusicState()` для dev-панели. `_makeMp3Bgm.getEl()` добавлен.

### CC29 — Мёд/Медведи (Honey Layers)
`cell.honey=N` (1-3). `canSwap/_simCanSwap` блокируют. Матч рядом → `honey--`; при 0 → `freeBear(r,c)` → `bearsFreed++`. BOMB/STRIPE/MEGA → `honey=0`. `applyGravity()` фиксирует. Рендер: жёлтый градиент + капли + 🐻 + счётчик слоёв. `type:'bears'`, `level.bearsTarget`. `updateGoalProgress/calcStars/isCloseToWin` — bears case. `initBoard()` расставляет из `lvl.honeyCount`. `generateLevel()` difficulty>45. L65/L67 хардкод.

---

## 🔵 ОЖИДАЮТ РЕАЛИЗАЦИИ

---

### TASK-CC18 · Режим пути (Path Mode)
**Приоритет: средний | ~5-6 часов**

`type:'path'`. `level.pathCells=[[r,c],...]`. `state.pathProgress` (0..N). Матч на pathCells[progress] или рядом → `progress++`. Дорожка + персонаж на Canvas. `checkWin()`: progress>=length. Хардкодные L80-L100.

**AC:** Персонаж движется. Победа при финише. Маршрут виден до игры.

---

### TASK-CC19 · Территориальный захват
**Приоритет: низкий | ~6-8 часов**

`type:'territory'`. `state.territoryGrid[r][c]` = 0|1|2. `level.enemyStartCells`. Матч → уничтоженные+соседи → `territory=1`. Каждые `enemyExpandRate` ходов враг расширяется. `checkWin()`: playerCells/total >= targetPercent. Полупрозрачный тинт по faction.

**AC:** Захват работает. Враг расширяется. Прогресс-бар % захвата.

---

### TASK-CC24 · Острова — мета-прогрессия
**Приоритет: высокий | ~8-10 часов**

Экран "Остров" между меню и картой. `state.islandTiles[id]` (localStorage). 12-16 тайлов: 🌳(1⭐), 🏠(2⭐), ⛲(4⭐), 🏰(6⭐) и др. `state.totalStars`. На карте уровней — % прогресса острова.

**AC:** Экран из меню. ⭐ вычитаются. Тайлы сохраняются. Минимум 12 тайлов.

---

### TASK-CC25 · Компаньон-помощник (Sidekick)
**Приоритет: средний | ~4-5 часов**

`state.sidekick={id,charge,maxCharge}`. Разблокируется L25. `SIDEKICKS`: 🐢(ломает 3 льда), 🐦(создаёт STRIPE), 🐻(+3 хода). Заряд: +1 матч, +3 спешл, +5 каскад 3+. Шкала в HUD. `activateSidekick()` автоматически.

**AC:** Шкала растёт. При заполнении — активация. Разные компаньоны делают разное.

---

### TASK-CC27 · Вероятности гемов на уровень
**Приоритет: низкий | ~2 часа**

`colorWeights:[1,1,1,1,1,1]` и `specialSpawnWeights:{...}` — опциональные поля уровня. `fillFromTop()` использует `weightedRandom`. `analyzeMatch()` использует specialSpawnWeights как bias. Dev-панель показывает текущие веса.

**AC:** `colorWeights:[3,1,1,1,1,1]` заметно чаще спавнит гем 0. Без полей — равномерно.

---

### TASK-CC28 · Гача-капсула
**Приоритет: низкий | ~3-4 часа**

Экран `capsule` раз в 5 побед. Бесплатно раз в 24ч. 🎁 трясётся 1.5с → лопается. Награды: 60%+15💎, 20% бустер, 15%+1жизнь, 5% скин. "Открыть" за 10💎 или "Пропустить".

**AC:** Каждые 5 побед. Анимация видна. Бесплатно раз в сутки.

---

### TASK-CC36 · Диорама — анимированный хаб
**Приоритет: низкий | ~8-10 часов**

Экран 'menu' → "живой" хаб: остров (правый угол), события (левый), маскот (центр). 5 состояний: `hub_idle` (float), `hub_level_unlocked` (pop), `hub_reward_ready` (пульс), `hub_no_lives` (разбитое сердце), `hub_event_active` (баннер). CSS classes + JS state machine.

**AC:** 3 анимированных зоны. При награде — пульс. При 0 жизней — сломанное сердце.

---

### TASK-CC44 · Ежедневный URM сундук
**Приоритет: низкий | ~3 часа**

Экран `daily_chest` раз в сутки. `state.chestStreak` — дни подряд. При streak 7 → Legendary гарантирован. Награды: Common(50%)+5💎, Uncommon(25%), Rare(15%), Epic(8%), Legendary(2%)+100💎+скин. Анимация ≥1.5с. Тултип `?` → шансы.

**AC:** Раз в сутки. Анимация ≥1.5с. Шансы в тултипе. День 7 → Legendary.

---

### TASK-CC45 · Динамическая сложность
**Приоритет: средний | ~5-6 часов**

`state.recentResults[]` (последние 5). `getDynamicDifficulty(n)` → 0.7-1.3. 3+ проигрыша → 0.75 (меньше цветов, чаще спешлы). 0 проигрышей последние 3 → 1.15. Игроку не показывать. Dev → показывать коэффициент.

**AC:** После 3 проигрышей игра реально легче. Коэффициент в dev-панели.

---

### TASK-CC54 · HUD objective counter
**Приоритет: средний | ~3 часа**

`level.objective={type,gem,count}`. В HUD: `[emoji] X/Y`. Emoji: 💎 collect, ⭐ score, 🧊 ice. При выполнении: ✅ + sound + scale-поп. `checkWin()` проверяет цель.

**AC:** Цель видна. Прогресс обновляется. При выполнении — анимированная галочка.

---

### TASK-CC58 · Bronze/Silver/Gold targets
**Приоритет: средний | ~1 час**

`scoreTargets:[n1,n2,n3]` вместо `targetScore`. `calcStars()` по starlevel[0/1/2]. Win-экран: до следующей звезды. Ранние: [1000,5000,10000]; поздние: [50000,150000,300000].

**AC:** Каждый уровень — 3 цели. Win-экран показывает прогресс.

---

### TASK-CC59 · Scrolling Board
**Приоритет: низкий | ~5 часов**

`level.boardCols/boardRows`. `drawBoard()` рендерит видимую часть (`viewOffsetY/X`). Touch drag не на гем → скроллинг. `cameraTargets` → плавный pan. `cellSize` auto (min 32px). Мини-скролл-бар.

**AC:** Поле >8×10 рендерится и скроллится. Ходы работают при смещении.

---

### TASK-CC61 · Сезонные скины
**Приоритет: низкий | ~3 часа**

`SEASONS` по `getMonth()`. CSS-переменные `--season-bg-top/bottom/particle`. Spring: зел+розов; Summer: жёлт+голуб; Autumn: оранж+бордов; Winter: синий+белый. Партиклы по сезону (CC40). Fade 2s при смене месяца.

**AC:** Хаб выглядит по-разному зимой и летом.

---

### TASK-CC62 · EOC gate
**Приоритет: низкий | ~2 часа**

После последнего уровня — `EOC-gate` кнопка: 🔒 + "Скоро..." + пульсация. При нажатии → тост (CC51). `maxLevelUnlocked === LEVELS.length` → показывать.

**AC:** Красивая заблокированная дверь. Нажатие даёт фидбек.

---

### TASK-CC65 · Звуки сундука по редкости
**Приоритет: средний | ~2 часа**

В `openChest(rarity)` — аудио-цепочка: Common(pip→click→jingle 440-523-659), Rare(+0.15s reverb), Epic(harmonics+пан±0.3), Legendary(C major arpeggio 523-659-784-1047, 0.5s reverb). Фоновый 60-80Hz во время анимации.

**AC:** Common и Legendary звучат принципиально по-разному. Синхронизировано с CC44.

---

### TASK-CC69 · Island hex-map
**Приоритет: низкий | ~8 часов**

`ISLAND_MAP={tiles:[...],chapter:1}`. Гекс-сетка на Canvas/CSS grid. Тайлы за `totalStars`. Landmark → mini-chest (CC44). Полоса прогресса главы.

**AC:** Гекс-карта отображается. Разблокировка за ⭐. Landmark дают награды.

---

### TASK-CC70 · Login Calendar
**Приоритет: средний | ~4 часа**

`state.loginCalendar={lastClaim,day}`. При открытии (>20ч) → попап. 7-дневная сетка. День 7 → сундук (CC44). После 7 → 3-дневный цикл. "Получить" → анимация подарок падает 0.5s. Пропуск → серая ячейка.

**AC:** Попап раз в день. День 7 → сундук. Пропуски — серые.

---

### TASK-CC71 · Экран 0 жизней
**Приоритет: низкий | ~3 часа**

При `lives===0` — полноценный экран. "Попросить помощь" (3 случайных "друга"). "Смотреть рекламу" → `simulateAd()` → +1 жизнь (5s). Таймер в HUD. "Осталось: X/5" на lose-экране.

**AC:** 0 жизней → экран с опциями. Таймер видим.

---

### TASK-CC72 · First Attempt бейдж
**Приоритет: низкий | ~1 час**

`state.levelFirstAttempt[n]`. При `levelAttempts[n]===1` + win → "С первого раза! ⭐". Hard: "HARD: С ПЕРВОГО РАЗА! 🏆". На кнопке уровня: ⚡.

**AC:** Бейдж при первом прохождении. Hard — особый. Маркер на кнопке.

---

### TASK-CC73 · Коллекция трофеев
**Приоритет: низкий | ~3 часа**

`TROPHIES` с условиями: win5/25/100, streak5, hardCleared, ultrahard. `state.trophies[]`. Экран "Достижения". При получении: toast + bounce. На главном — последний трофей.

**AC:** 6+ трофеев. Новый → анимация. Экран коллекции.

---

### TASK-CC74 · Shop offer с таймером
**Приоритет: низкий | ~3 часа**

`SHOP_OFFERS` с `expires`. `state.shopOfferExpiry[id]`. Зачёркнутая цена + скидка-бейдж + таймер. При <1ч → "ПОСЛЕДНИЙ ШАНС!" красным, пульсирует. Золотистый градиент. По истечении → убирается.

**AC:** Таймер обновляется. При истечении — убирается.

---

### TASK-CC75 · Activity Hub
**Приоритет: низкий | ~4 часа**

Экран с 2×N плитками: Daily Reward(CC70), Трофеи(CC73), Shop(CC74), Leaderboard. Badge = нотификации. `claim` → зелёный border+пульс. `inactive` → серая. Кнопка "Activity" на главном.

**AC:** Hub показывает все системы. Badge = ожидающие. Переход к фиче работает.

---

### TASK-CC77 · Stars fly-to-HUD
**Приоритет: средний | ~2 часа**

Win-экран: звёзды летят от поля к HUD по bezier. Задержки: t=0/0.4s/0.8s. В HUD: scale 1→1.4→1 (`EASE.outQuad`). Счётчик в меню: bounce при пролёте. Звук: 440/523/659 Hz.

**AC:** Звёзды летят по кривой. Каждая с задержкой. Иконка bounces.

---

### TASK-CC80 · Lose-screen swipe-to-minimize
**Приоритет: низкий | ~2 часа**

Handle bar сверху lose-экрана. Drag вниз >30% → collapse (остаётся 60px). Иначе snap back. Tap → expand. `translateY` `EASE.outCubic` 0.3s. В свёрнутом — видно замороженное поле.

**AC:** Сворачивается свайпом. Разворачивается тапом. Snap-back при коротком свайпе.
