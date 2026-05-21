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

## Карта файла (index.html)

Вместо grep по всему файлу — смотрю в карту, беру строку, читаю нужный диапазон:
```
Read index.html offset:<LINE-1> limit:150
```
После крупных правок запустить `.\scan.ps1` чтобы обновить номера строк.

### Секции

| Секция | Строки |
|--------|--------|
| CSS / стили | 1–1871 |
| Яндекс SDK | 1875–2038 |
| Фоновая музыка | 2040–2111 |
| Константы (COLS, ROWS, SPECIAL, PHYSICS, EASE) | 2113–2560 |
| Переупорядочивание уровней | 2560–2660 |
| Процедурный генератор | 2660–2930 |
| Глобальный state | 2930–3060 |
| Persistence (save/load) | 3060–3190 |
| i18n | 3190–3310 |
| Экраны / showScreen | 3310–3650 |
| Система жизней | 3650–3780 |
| Login streak / daily rewards | 3780–3940 |
| Магазин | 3940–3990 |
| Карта уровней | 4000–4150 |
| Инициализация поля | 4220–4490 |
| Canvas / resize | 4490–4540 |
| Рендеринг (drawBoard, drawShape) | 4540–5410 |
| Частицы | 5410–5540 |
| Поиск матчей | 5540–5610 |
| **Главный цикл processMatches** | 5607–5890 |
| Гравитация / заполнение | 5890–6010 |
| Специальные фишки | 6006–6730 |
| Ракета (ROCKET) | 6760–6910 |
| Анимации | 6910–7130 |
| Логика хода (trySwap) | 7130–8220 |
| Win / Lose | 8360–9000 |
| Старт уровня | 9000–9120 |
| Пауза | 9120–9210 |
| Подсказки | 9210–9290 |
| SFX (Web Audio) | 9310–9460 |
| Сезон / Турнир | 9460–9780 |
| Фоновый баланс | 9968–9993 |
| Симулятор баланса | 9994–10290 |
| Dev-панель | 10350–10640 |
| Ежедневные задания | 10664–10850 |
| Достижения | 10873–11100 |

### Функции

| Функция | Строка |
|---------|--------|
| processMatches | 6895 |
| applyGravity | 7358 |
| fillFromTop | 7482 |
| trySwap | 9161 |
| checkWin | 10411 |
| initBoard | 4482 |
| generateDailyQuests | 10664 |
| renderQuestsFull | 10773 |
| showToast | 9285 |
| updateHUD | 7686 |
| _simPickBestMove | 10232 |
| simulateLevelObj | 10257 |
| simulateLevel | 10284 |
| runBalanceReport | 10291 |
| autoBalanceLevels | 10312 |
| _scheduleBackgroundBalance | 9968 |
| shopBuy | 3955 |
| initDevPanel | 10350 |
| claimDailyReward | 3831 |
| unlockAchievement | 10873 |

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
