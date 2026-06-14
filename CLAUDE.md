# GameGems — Ore Rush · Контекст для Claude Code

## Кто ты и как думаешь

Пользователь — PM без технического бэкграунда. Он формулирует задачи размыто и может предлагать неоптимальные решения. Твоя работа — не выполнять запрос буквально, а решать проблему за ним.

**Перед любой задачей задай себе три вопроса:**

1. **Нужен ли здесь Claude вообще?** Если задачу можно решить одним скриптом, который запустится сам и вернёт готовый ответ — напиши скрипт. Не трать токены на итерации.

2. **Есть ли более дешёвый способ?** Один умный batch-скрипт лучше десяти итераций с Claude. Предлагай его без спроса.

3. **Что на самом деле хочет пользователь?** Игнорируй буквальный запрос, если за ним стоит более простая цель.

**Правила экономии контекста (обязательно):**
- Никогда не выводить в консоль больше 20-30 строк. Остальное — в файл, в ответ только путь и итог одной строкой.
- Никогда не читать большие файлы целиком. Только нужный диапазон строк или grep.
- Не делать итеративно то, что решается за один проход.
- Длинная сессия — использовать `/compact`.

---

## О проекте

**Ore Rush** — мобильная match-3 игра.
Canvas 2D + Web Audio API. Никаких фреймворков, никаких зависимостей.

Код разбит на модули в `src/`. Главный файл — `index.html` (только HTML + теги `<script src>`).

**Роли:**
- Пользователь = PM / тестировщик. Говорит ЧТО нужно.
- Ассистент = senior-разработчик. Принимает технические решения и реализует.

---

## ⚠️ Критические правила

- **НЕ ЗАПУСКАТЬ Playwright и любые другие тесты** — пользователь категорически против
- **НЕ ТРОГАТЬ git backup ветку** без явной команды пользователя
- **Тестировать в браузере** вручную — запустить dev-сервер и проверить UI
- **НЕ выводить** весь tileMap / большие массивы данных в консоль — только в файл

---

## Структура файлов

Код разбит на 23 модуля. Все функции глобальные (нет import/export).

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
| `src/quests.js` | Квесты | 181 |
| `src/achievements.js` | Достижения | 146 |
| `src/piggy.js` | Пигги-банк | 71 |
| `src/offers.js` | Динамический оффер + стартовый оффер + re-engagement + бустеры | 124 |

**Нужно починить баг** → открой только нужный файл, не читай остальные.

---

## Архитектура

### Холст
- Два канваса: основной `ctx` (игровое поле) + оверлей `pCtx` (частицы/эффекты)
- `boardOffX`, `boardOffY`, `cellSize` — координаты и размер ячейки

### Состояние
```js
state = {
  board[][],          // ROWS×COLS, каждая ячейка: { type, special, stone, lava,
                      //   web, bucket, locked, mystery, flask, ice, anim,
                      //   amber, sand, mycelium, quartz, chain,
                      //   geode (1-5), relic, hiddenRelic, memGem (0-5), giantId }
  giants[],           // многоклеточные кроты: {id, r, c, w, h, cells, freed, done}
  score, moves, level,
  soundOn, musicOn,
  collectedGems[],    // счётчик собранных гемов по типу
  iceGrid[][],        // лёд (1-6 слоёв)
  frostGrid[][],      // слоёная порода (1-6, только прямой матч)
  dirtGrid[][],       // грязная земля (1–2 слоя)
  bricksGrid[][],     // кирпичная кладка
  myceliumSourceGrid[][], // источники грибницы
  holes: Set,         // недоступные клетки
  screen,             // 'menu'|'game'|'win'|'lose'|'levels'|'quests'|...
  ...
}
```

### Урон по слоёным покрытиям — ТОЛЬКО через центральные хелперы (gameplay.js)
```js
_hitAmber(cl, r, c)   // янтарь/рунный блок: −1 слой; на 0 → _onAmberCleared (крот/гигант/мемори-гем)
_hitFrost(r, c)       // порода: −1 слой; на 0 → скрытый крот, если был
_hitGeode(cl, r, c)   // геода: −1 слой; на 0 → превращается в гем
```
Не декрементить amber/frostGrid/geode напрямую — сломается освобождение кротов.
```

### Именование Ore Rush (нет следов CCSS в коде)

| Ore Rush поле/тип | CCSS аналог | Описание |
|---|---|---|
| `cell.lava` / `type:'lava'` | chocolate | расширяющийся блокер, растёт каждый ход |
| `cell.web` | marmalade | паутина: гем виден, но не матчится |
| `cell.sand` | licorice swirl | падающий блокер, блокирует бонусы (1–3 слоя) |
| `cell.amber` | honey lid | янтарь вокруг реликвий (1–4 слоя) |
| `cell.mycelium` / `type:'mycelium'` | white chocolate | грибница, расползается из источника |
| `cell.flask` / `type:'flood'` | bottle / SodaToTheBrim | фляга; режим затопления |
| `cell.bucket` / `type:'buckets'` | ingredient / FloatingNuts | ведро сокровищ, доставить вниз |
| `dirtGrid[][]` / `type:'dirt'` | jelly / BubbleGum | грязная земля на клетках (1–2 слоя) |
| `bricksGrid[][]` / `type:'bricks'` | carpet / PaintBattle | кирпичная кладка, нужно покрыть поле |
| `type:'relics'` | bears / GiantBears+Honey | кроты: освободить N штук |
| `cell.relic` | honey bear (416/417) | одиночный крот в янтаре (amber_1..4.png) |
| `cell.memGem` | hidden object 211-216 | мемори-гем под рунным блоком (memory_gem_*.png) |
| `cell.giantId` / `state.giants` | giant bear 660-665 | многоклеточный крот 1×2…6×3 (memory_bear_*.png) |
| `cell.hiddenRelic` | hidden bear (Honey task) | крот под слоёной породой (frostGrid) |
| `lvl.relicSkin:1` | memory bricks | покрытие рисуется рунным блоком, не янтарём |
| `cell.geode` | cupcake 52-56 | геода 1-5 слоёв, на 0 → гем (geode_*.png) |
| `state.relicsFreed` | bearsFreed | счётчик освобождённых кротов |
| `ROCKET = 6` | Fish (2×2 match) | ракета — летит к приоритетной цели |
| `BOMB = 7` | wrappedCandy | бомба — двойной взрыв 3×3 |
| `RAINBOW = 4` | colorBomb | радужная — уничтожает все одного цвета |
| `STRIPE_H/V` | stripedCandy | полосатая — взрывает строку/столбец |

> Если пользователь говорит «рыба» → имеет в виду ROCKET.
> Если говорит «медведь» → имеет в виду реликвию (relics).
> Если говорит «враппед» → имеет в виду BOMB.

---

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
**Исправление:** `triggerCombinedSpecial` обнуляет ячейки в самом НАЧАЛЕ.

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
**Причина:** `renderQuestsFull()` обращался к `document.getElementById('qst-lives')` которого не было в HTML → null exception → функция падала до рендера заданий.
**Исправление:** добавлен `<span id="qst-lives">` в HTML.

### COLORING сбрасывала бонусы при перекраске
**Причина:** `triggerSpecial(COLORING)` делал `cl.special=SPECIAL.NONE` при смене цвета.
**Исправление:** убрана строка `cl.special=SPECIAL.NONE` — перекраска меняет только цвет.

### Спешлы не взрывались по цепочке из `explodeCell`
**Причина:** `explodeCell` вызывал `triggerSpecial` ДО обнуления ячейки → BOMB уходил в режим "падения".
**Исправление:** `explodeCell` сначала нуллит ячейку, потом вызывает `triggerSpecial`.

### Ракеты/пятёрки взрывались по одному
**Причина:** в `triggerCombinedSpecial` цели тригерились в `for...await` — строго последовательно.
**Исправление:** BOMB → `Promise.all`; ROCKET → предвыбор уникальных целей, `Promise.all` полётов;
STRIPE → собрать все строки/столбцы в один Set, `Promise.all` анимаций, один destroy-проход.

### Бесконечный каскад / перенос взрывов между уровнями
**Причина:** COLORING feedback-loop + async processMatches продолжали работать на новом поле.
**Исправление:** `_matchEpoch` инкрементируется в `playLevel`. Все async-функции захватывают
`_myEpoch` и проверяют его после каждого `await`. Лимит итераций снижен до 25.

### Несколько бомб взрывались по одному (медленно)
**Причина:** в `processMatches` `specialsInMatch` обрабатывался циклом `for...await` — каждая бомба ждала полного завершения (фаза1 + гравитация + дым + фаза2) перед следующей.
**Исправление:** `_bombPhase1(r,c)` — выделена отдельная функция для первого взрыва бомбы (без гравитации). В `processMatches`: все бомбы из матча делают фазу1 одновременно (`Promise.all`), затем одна гравитация, затем фаза2 одновременно. `triggerSpecial(BOMB)` (для одиночных бомб вне `specialsInMatch`) по-прежнему использует `_bombPhase1` + гравитация + фаза2.

### Бомба взрывалась на исходной позиции (не падала)
**Причина:** бомба null'илась ДО захвата `_bombData` → трекинг по ссылке не работал.
**Исправление:** `_bombsInMatch`/`_bombData` захватываются ДО animateDestroy и null-инга.

### Win screen появлялась до конца бонусного взрыва
**Причина:** `setTimeout(showWin, 600)` без проверки эпохи; `.then(_doShowWin)` резолвился даже после break.
**Исправление:**
- `const _ep=_myEpoch; setTimeout(()=>{ if (_matchEpoch===_ep) showWin(); }, 600)`
- `const _winEpoch=_matchEpoch; bonusMovesExplosion().then(()=>{ if (_matchEpoch===_winEpoch) _doShowWin(); })`

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
git clone https://github.com/MarkChepaykin/GameGems.git
git add -A
git commit -m "описание"
git push
```

Открывать игру: `index.html` в браузере (через локальный сервер, не file://).
