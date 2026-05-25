# GameGems — Gem Blast · Контекст для разработчика

## О проекте

**Gem Blast** — мобильная match-3 игра.  
Весь код в **одном файле**: `index.html` (~500 KB, ~10 000+ строк).  
Canvas 2D + Web Audio API. Никаких фреймворков, никаких зависимостей.  
Открывается прямо в браузере — `file:///...GameGems/index.html`.

**Роли:**
- Пользователь = PM / тестировщик. Говорит ЧТО нужно.
- Ассистент = senior-разработчик. Принимает технические решения и реализует.

---

## ⚠️ Критические правила

- **НЕ ЗАПУСКАТЬ Playwright и любые другие тесты** — пользователь категорически против
- **НЕ РАЗБИВАТЬ** `index.html` на несколько файлов без явного запроса
- **Тестировать в браузере** вручную — запустить dev-сервер и проверить UI

---

## Архитектура

### Холст
- Два канваса: основной `ctx` (игровое поле) + оверлей `pCtx` (частицы/эффекты)
- `boardOffX`, `boardOffY`, `cellSize` — координаты и размер ячейки

### Состояние
```js
state = {
  board[][],          // ROWS×COLS, каждая ячейка: { type, special, stone, chocolate,
                      //   marmalade, ingredient, locked, mystery, bottle, ice, anim }
  score, moves, level,
  soundOn, musicOn,
  collectedGems[],    // счётчик собранных гемов по типу
  iceGrid[][],        // лёд
  jellyGrid[][],      // желе (1 или 2 слоя)
  holes: Set,         // недоступные клетки
  screen,             // 'menu'|'game'|'win'|'lose'|'levels'|'quests'|...
  ...
}
```

### Ключевые константы
```js
COLS = 8, ROWS = 10

SPECIAL = {
  NONE: 0,
  STRIPE_H: 1,   // горизонтальная полоса — взрывает строку
  STRIPE_V: 2,   // вертикальная полоса — взрывает столбец
  RAINBOW: 4,    // радужная — уничтожает все гемы одного цвета
  MEGA: 5,       // мега-бомба 5×5
  ROCKET: 6,     // ракета — летит к приоритетной цели
  BOMB: 7,       // бомба — двойной взрыв 3×3
  COLORING: 8,   // красящая — имеет цвет, при активации перекрашивает гемы своего цвета
}

GEM_TYPES = 6   // цветов гемов на стандартном уровне
```

---

## Структура файлов (после рефакторинга)

Весь код разбит на модули в папке `src/`. Загружаются через `<script src>` в `index.html`.
CSS вынесен в `style.css`.

| Файл | Секция | Строк |
|------|--------|-------|
| `style.css` | CSS / стили | ~1174 |
| `src/sdk.js` | Яндекс SDK адаптер | 167 |
| `src/audio.js` | Фоновая музыка (BGM) | 69 |
| `src/constants.js` | Константы (COLS, ROWS, SPECIAL, PHYSICS, EASE, GEMS) | 182 |
| `src/level-engine.js` | Переупорядочивание уровней + процедурный генератор | 334 |
| `src/state.js` | Глобальный state + persistence (save/load) | 268 |
| `src/i18n.js` | Переводы + язык | 282 |
| `src/screens.js` | Экраны, жизни, стрик, магазин, карта эпизодов | 1182 |
| `src/board.js` | Инициализация поля + Canvas/resize | 615 |
| `src/renderer.js` | Рендер (drawBoard, drawShape, биомы, текстуры) | 1623 |
| `src/particles.js` | Частицы | 182 |
| `src/matches.js` | Поиск матчей + processMatches | 750 |
| `src/specials.js` | Спец-фишки + MYSTERY + ROCKET + анимации | 1587 |
| `src/gameplay.js` | Свап + gesture hints + ввод + HUD + комбо | 438 |
| `src/level-flow.js` | Win/Lose + старт уровня + пауза + подсказки + тост | 876 |
| `src/sound.js` | SFX (Web Audio API) | 132 |
| `src/season.js` | Сезон + турнир + push + интеграция звука | 1616 |
| `src/game-loop.js` | Game loop + таймер жизней + загрузка + точка входа | 290 |
| `src/balance.js` | Симулятор баланса | 351 |
| `src/dev.js` | Dev-панель | 350 |
| `src/quests.js` | Квесты (P2-2) | 181 |
| `src/achievements.js` | Достижения (P2-3) | 146 |
| `src/piggy.js` | Пигги-банк (P3-1) | 71 |
| `src/offers.js` | Динамический оффер + стартовый оффер + re-engagement + бустеры | 124 |

### Как работать с модулями

Нужно починить баг в матчах → открой только `src/matches.js` (750 строк).  
Нужно поправить рендер → только `src/renderer.js` (1623 строки).  
Нужно поправить win/lose → только `src/level-flow.js` (876 строк).

**Никаких import/export** — все функции глобальные, как раньше. Просто разные файлы.


## 
## Ключевые функции

```
processMatches(hintR?,hintC?)   — главный цикл: находит матчи, тригерит спешлы, гравитация
triggerSpecial(r,c,special,partnerType?)  — активация одиночного спешла
triggerCombinedSpecial(r1,c1,sp1,r2,c2,sp2)  — комбо двух спешлов
applyGravity()                  — гемы падают вниз
fillFromTop()                   — заполнение сверху новыми гемами
animateDrop()                   — анимация падения
trySwap(r1,c1,r2,c2)           — попытка хода игрока
findBestHint()                  — лучший следующий ход → [r,c,nr,nc]
showScreen(name)                — переключение экранов + музыка
saveGame() / loadGame()         — localStorage
generateDailyQuests()           — ежедневные задания (вызывать ДО showScreen)
renderQuestsFull()              — рендер экрана заданий
```

---

## Музыка и звук

### Фоновая музыка
```js
MENU_BGM   // D minor pentatonic (D4 F4 G4 A4 C5 D5), 144 BPM, wave='square'
BGM        // E minor pentatonic (E4 G4 A4 B4 D5 E5), 132 BPM, wave='triangle'
BGM_LAYERS // дополнительные слои (arpeggio, percussion)
```

### SFX — только шумовые звуки, БЕЗ осцилляторов в match/combo/special
```js
SFX.match(lvl)   // noise2-только (НЕТ osc!) — кристальный pop при матче
SFX.combo(n)     // noise2-только — каскадный удар
SFX.special()    // noise2-только — магический взрыв (4 слоя)
SFX.click()      // noise2 + osc — кристальный дзинь (ok)
SFX.win/lose/reward/winJingle/loseJingle()  // osc+noise2 — финальные джинглы (ok)
```
> ⚠️ `SFX.match/combo/special` **не должны содержать осцилляторы** — иначе при каскаде
> создаётся мелодия, пользователь это ненавидит.
>
> `noise2(vol, dur, freq, q, delay)` — резонансный bandpass-шум с высоким Q.
> При Q≥12 звучит как «питч без осциллятора» — кристальный хлопок/звон.

---

## Dev-панель

Всегда видима (FAB-кнопка 🛠️ на игровом экране), не требует `?dev=1`.  
Позволяет: добавить ходы, выиграть уровень, спавнить спешлы, телепорт по уровням.

---

## Известные баги и их исправления

### Пустые ячейки после комбо-спешла
**Причина:** `trySwap` обнулял ячейки r1,c1 и r2,c2 ПОСЛЕ `triggerCombinedSpecial`,
которая уже применяла гравитацию внутри → удалялись гемы, упавшие сверху.  
**Исправление:** `triggerCombinedSpecial` обнуляет ячейки в самом НАЧАЛЕ (строки ~5277-5278).

### ROCKET (ракета) оставляет дырку
**Причина:** `triggerSpecial(ROCKET)` не вызывал `applyGravity` после `explodeCell`.  
**Исправление:** добавлен `applyGravity(); fillFromTop(); await animateDrop()` после `explodeCell`.

### Двойной клик на спешл не тратил ход
**Причина:** `activateSpecialByTap` устанавливала `state.busy=true` но не вызывала `spendMove()`.  
**Исправление:** добавлен вызов `spendMove()` сразу после `state.busy=true`.

### Подсказка ускорялась со временем
**Причина:** каждый `showAutoHint` запускал новый `requestAnimationFrame` цикл, не отменяя старый.  
**Исправление:** `_gestureHintRaf` — глобальный handle, `cancelAnimationFrame` перед новым запуском.

### Экран заданий пустой
**Причина:** `renderQuestsFull()` обращался к `document.getElementById('qst-lives')` которого
не было в HTML → null exception → функция падала до рендера заданий.  
**Исправление:** добавлен `<span id="qst-lives">` в HTML.

### COLORING сбрасывала бонусы при перекраске
**Причина:** `triggerSpecial(COLORING)` делал `cl.special=SPECIAL.NONE` при смене цвета.  
**Исправление:** убрана строка `cl.special=SPECIAL.NONE` — перекраска меняет только цвет.

### Спешлы не взрывались по цепочке из `explodeCell` (ракета попадает в спешл)
**Причина:** `explodeCell` вызывал `triggerSpecial` ДО обнуления ячейки → BOMB видел
`bombRef != null` и уходил в режим "падения", после чего `state.board[r][c]=null`
уничтожал другой гем.  
**Исправление:** `explodeCell` сначала нуллит ячейку, сохранив `cl.special`/`cl.type`, потом вызывает `triggerSpecial`. 

### Пятёрка+врап / ракеты взрывались по одному
**Причина:** в `triggerCombinedSpecial` (Rainbow+Special, Coloring+Special) цели тригерились
в `for...await` — строго последовательно.  
**Исправление:** BOMB → `Promise.all` (одновременно первый взрыв, gravity, второй);
ROCKET → предвыбор уникальных целей, `Promise.all` полётов и попаданий;
STRIPE → собрать все строки/столбцы в один Set, `Promise.all` анимаций, один destroy-проход.

### Бесконечный каскад / перенос взрывов между уровнями
**Причина:**
1. COLORING создаёт 7+ матч → новый COLORING → feedback-loop на 120 итераций (~2 мин).
2. `processMatches` и `triggerCombinedSpecial` — async; при смене уровня старые экземпляры продолжали работать на новом поле.
3. (Повтор бага) Несколько pre-existing COLORING на поле → cascade-triggered COLORING scatter создаёт новые матчи с ещё COLORINGs → 15+ итераций.

**Исправление:**
- `_matchEpoch` (глобал) инкрементируется в `playLevel(n, fresh)`.
- `processMatches`, `triggerSpecial` **и `triggerCombinedSpecial`** захватывают `_myEpoch = _matchEpoch` при старте
  и после каждого `await` делают `if (_matchEpoch !== _myEpoch) return`.
- Лимит итераций снижен с 120 до **25** (`_loopGuard > 25`).
- CC cascade rule (два места): cascade-матчи (`_loopGuard > 1`) не создают новый COLORING (downgrade → BOMB) **и** не тригерят scatter существующих COLORING из `_othersInMatch` (continue — ячейка уже обнулена матчем, scatter подавляется).

### Бомба из матча взрывалась на исходной позиции (не падала)
**Причина:** В `processMatches` бомба null'илась в строке `for (const {r,c} of cellsArr) ... state.board[r][c]=null` ДО захвата `_bombData`. Поэтому `cell: state.board[r]?.[c]` = null, трекинг по ссылке не работал, фаза 2 взрывала исходную позицию.  
**Исправление:** `_bombsInMatch`/`_bombData` захватываются ДО animateDestroy и null-инга. Бомба исключается из `animateDestroy` и из цикла null'инга — остаётся на доске, проходит гравитацию, падает, фаза 2 по новой позиции.

### Несколько бомб взрывались по одному (медленно)
**Причина:** в `processMatches` `specialsInMatch` обрабатывался циклом `for...await` — каждая бомба ждала полного завершения (фаза1 + гравитация + дым + фаза2) перед следующей.  
**Исправление:** `_bombPhase1(r,c)` — выделена отдельная функция для первого взрыва бомбы (без гравитации).
В `processMatches`: все бомбы из матча делают фазу1 одновременно (`Promise.all`), затем одна гравитация, затем фаза2 одновременно.  
`triggerSpecial(BOMB)` (для одиночных бомб вне `specialsInMatch`) по-прежнему использует `_bombPhase1` + гравитация + фаза2.

### Win screen появлялась до конца бонусного взрыва + каскады между уровнями
**Причина:**
1. `processMatches` при `_cascadeWon` вызывал `setTimeout(showWin, 600)` и сбрасывал `state.busy=false` — даже если был вызван изнутри `bonusMovesExplosion`. Экран победы появлялся пока взрывы ещё шли.
2. `bonusMovesExplosion` не проверял `_matchEpoch` — при быстром переходе на следующий уровень взрывы продолжали работать на новом поле.
3. При >12 оставшихся ходах ставился batch из 2 бонусов — нарушало принцип «один ход — один бонус».

**Исправление:**
- `state._inBonusExplosion` флаг: устанавливается в начале `bonusMovesExplosion`, сбрасывается в конце и в `playLevel`.
- `processMatches`: `if (_cascadeWon)` — вызов `showWin` и сброс `busy` только при `!state._inBonusExplosion`.
- `bonusMovesExplosion`: захватывает `_myEpoch = _matchEpoch` при старте, проверяет эпоху после каждого `await`.
- Убран batch-of-2 (всегда один бонус за один оставшийся ход).

### (Рецидив) showWin/бонусные взрывы переносились на следующий уровень
**Причина:** Две дыры в эпоха-гарде:
1. `processMatches` → `setTimeout(showWin, 600)` без проверки эпохи: если за 600мс пользователь стартовал следующий уровень, `showWin()` запускала бонусный взрыв на новом поле.
2. `showWin()` → `bonusMovesExplosion().then(()=>_doShowWin())`: после break по эпохе Promise всё равно резолвился, `.then()` вызывал `_doShowWin()` на новом уровне — `state._winShowing` был уже сброшен в `playLevel`, поэтому guard не срабатывал.

**Исправление:**
- `processMatches` (строка ~6732): `const _ep=_myEpoch; setTimeout(()=>{ if (_matchEpoch===_ep) showWin(); }, 600)`
- `showWin()` (строка ~9675): `const _winEpoch=_matchEpoch; bonusMovesExplosion().then(()=>{ if (_matchEpoch===_winEpoch) _doShowWin(); })`

---

## Визуальный стиль

### Гемы (`drawShape`)
Плоский стиль:
1. Заливка цветом + glow (`shadowBlur=10`)
2. Тонкий светлый контур `rgba(255,255,255,0.28)`
3. Маленький блик-эллипс сверху-слева

> ⚠️ НЕ использовать `createLinearGradient` / `createRadialGradient` для тела гема —
> пользователь считает это "уродливым 3D".

### Ракета / Флэр (ROCKET special)
`animateRocketFlight(fromR,fromC,toR,toC,gemColor)` — сигнальный флэр:
- Дуга Безье (не прямая линия)
- Цилиндрическое тело В ЦВЕТ ФИШКИ, горящий нос (белое свечение), хвостовое пламя
- Серый+чёрный дым, цветной туман, белые искры — трейл из частиц
- Мерцание: `flicker=0.85+0.15*sin(Date.now()/32)`
`animateRocketBlast(r,c,gemColor)` — взрыв флэра: вспышка + кольца дыма в цвет + разлёт искр

---

## Комбинации спешлов (`triggerCombinedSpecial`)

| Комбо | Эффект |
|-------|--------|
| Stripe + Stripe | Крест: строка + столбец |
| Stripe + BOMB | **3 строки + 3 столбца одновременно** (крест 3×3) |
| BOMB + BOMB | 5×5 дважды |
| Stripe + Mega | Stripe + 3×3 область |
| Mega + Mega | 7×7 |
| BOMB + Mega | 5×5 |
| Rainbow + обычный | Уничтожить все гемы цвета партнёра |
| Rainbow + спешл | Все гемы цвета партнёра → этот спешл, все взрываются |
| Rainbow + Rainbow | Очистить весь экран |
| Rainbow + Coloring | Очистить весь экран |
| Coloring + Stripe/BOMB/Rocket | Все гемы цвета красящей → этот спешл, все взрываются |
| Coloring + Coloring | Все фишки становятся одного цвета |
| Coloring + Mega | Радужная волна + покрасить всё + взрыв 5×5 |
| Rocket + Rocket | 3 приоритетные цели |

---

## Рабочий процесс

```bash
# Клонировать
git clone https://github.com/MarkChepaykin/GameGems.git

# После изменений — пушить
git add index.html CLAUDE.md
git commit -m "описание"
git push
```

Открывать игру: просто открыть `index.html` в браузере.
