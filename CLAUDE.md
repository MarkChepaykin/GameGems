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
  FISH: 6,       // ракета — летит к приоритетной цели
  WRAPPED: 7,    // обёрнутая — двойной взрыв 3×3 (второй после падения)
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
| Fish (ракета) | 6760–6910 |
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
| processMatches | 5607 |
| triggerCombinedSpecial | 6044 |
| activateSpecials | 6006 |
| applyGravity | 5892 |
| fillFromTop | 5942 |
| triggerSpecial | 6541 |
| animateFishFlight | 6808 |
| findFishTarget | 6783 |
| animateDestroy | 6931 |
| animateDrop | 7044 |
| animateSwap | 7064 |
| trySwap | 7146 |
| canSwap | 9250 |
| findBestHint | 9258 |
| checkWin | 8172 |
| calcStars | 8199 |
| showWin | 8400 |
| showLose | 8799 |
| showScreen | 3323 |
| saveGame | 3152 |
| loadGame | 3159 |
| buildSaveObj | 3070 |
| applySaveObj | 3135 |
| drawBoard | 4545 |
| drawShape | 5366 |
| drawCellGem | 4800 |
| findMatches | 5540 |
| spawnParticles | 5415 |
| initBoard | 4252 |
| generateLevel | 2746 |
| generateArena | 2687 |
| seededRandom | 2658 |
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

### WRAPPED взрывается на случайном месте / оставляет дырку
**Причина:** когда WRAPPED часть матча, `state.board[r][c]` уже `null` к моменту
вызова `triggerSpecial`. Код искал `wrappedRef=null` по доске, не находил,
оставался на исходной позиции — второй взрыв бил по случайному гему.  
**Исправление:** если `state.board[r][c]===null` — делаем двойной взрыв на месте без
попытки отслеживать падение.

### FISH (ракета) оставляет дырку
**Причина:** `triggerSpecial(FISH)` не вызывал `applyGravity` после `explodeCell`.  
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
**Причина:** `explodeCell` вызывал `triggerSpecial` ДО обнуления ячейки → WRAPPED видел
`wrappedRef != null` и уходил в режим "падения", после чего `state.board[r][c]=null`
уничтожал другой гем.  
**Исправление:** `explodeCell` сначала нуллит ячейку, сохранив `cl.special`/`cl.type`, потом вызывает `triggerSpecial`.

### WRAPPED падал в новую позицию между взрывами
**Причина:** при цепном тригере (когда гем на доске) код отслеживал `wrappedRef` и делал
второй взрыв на НОВОМ месте после гравитации.  
**Исправление:** WRAPPED всегда использует `_wrappedBlast3x3` (двойной взрыв на исходной позиции).
Гем немедленно нуллится перед первым взрывом.

### Пятёрка+врап / ракеты взрывались по одному
**Причина:** в `triggerCombinedSpecial` (Rainbow+Special, Coloring+Special) цели тригерились
в `for...await` — строго последовательно.  
**Исправление:** WRAPPED → `Promise.all` (одновременно первый взрыв, gravity, второй);
FISH → предвыбор уникальных целей, `Promise.all` полётов и попаданий;
STRIPE → собрать все строки/столбцы в один Set, `Promise.all` анимаций, один destroy-проход.

### Бесконечный каскад / перенос взрывов между уровнями
**Причина:** `processMatches` мог гнать `while(true)` бесконечно при дегенеративных
цепочках; async-цепочки продолжались после смены уровня.  
**Исправление:** лимит итераций `_loopGuard > 120` в `while(true)`.

---

## Визуальный стиль

### Гемы (`drawShape`)
Плоский стиль:
1. Заливка цветом + glow (`shadowBlur=10`)
2. Тонкий светлый контур `rgba(255,255,255,0.28)`
3. Маленький блик-эллипс сверху-слева

> ⚠️ НЕ использовать `createLinearGradient` / `createRadialGradient` для тела гема —
> пользователь считает это "уродливым 3D".

### Ракета (FISH special)
`animateFishFlight` — рисуется через canvas-примитивы (не emoji):
- Дуга Безье (не прямая линия)
- Нос (красный), корпус (светлый), рули (синие), иллюминатор
- Мерцающее пламя + трейл из частиц

---

## Комбинации спешлов (`triggerCombinedSpecial`)

| Комбо | Эффект |
|-------|--------|
| Stripe + Stripe | Крест: строка + столбец |
| Stripe + Wrapped | **3 строки + 3 столбца одновременно** (крест 3×3) |
| Wrapped + Wrapped | 5×5 дважды |
| Stripe + Mega | Stripe + 3×3 область |
| Mega + Mega | 7×7 |
| Wrapped + Mega | 5×5 |
| Rainbow + обычный | Уничтожить все гемы цвета партнёра |
| Rainbow + спешл | Все гемы цвета партнёра → этот спешл, все взрываются |
| Rainbow + Rainbow | Очистить весь экран |
| Rainbow + Coloring | Очистить весь экран |
| Coloring + Stripe/Wrapped/Fish | Все гемы цвета красящей → этот спешл, все взрываются |
| Coloring + Coloring | Все фишки становятся одного цвета |
| Coloring + Mega | Радужная волна + покрасить всё + взрыв 5×5 |
| Fish + Fish | 3 приоритетные цели |

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
