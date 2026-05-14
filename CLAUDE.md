# GameGems — Gem Blast · Контекст для разработчика

## О проекте

**Gem Blast** — мобильная match-3 игра (аналог Candy Crush).  
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
  BOMB: 3,       // бомба 3×3
  RAINBOW: 4,    // радужная — уничтожает все гемы одного цвета
  MEGA: 5,       // мега-бомба 5×5
  FISH: 6,       // ракета — летит к приоритетной цели
  WRAPPED: 7,    // обёрнутая — двойной взрыв 3×3 (второй после падения)
  COLORING: 8,   // красящая — перекрашивает гемы
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
SFX.match(lvl)   // noise-только (НЕТ osc!) — шумовой поп при матче
SFX.combo(n)     // noise-только — удар при каскаде
SFX.special()    // noise-только — взрыв спешла
SFX.click()      // osc — короткий тик (ok)
SFX.win/lose/reward/winJingle/loseJingle()  // osc — финальные джинглы (ok)
```
> ⚠️ `SFX.match/combo/special` **не должны содержать осцилляторы** — иначе при каскаде
> создаётся мелодия, пользователь это ненавидит.

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

### Подсказка ускорялась со временем
**Причина:** каждый `showAutoHint` запускал новый `requestAnimationFrame` цикл, не отменяя старый.  
**Исправление:** `_gestureHintRaf` — глобальный handle, `cancelAnimationFrame` перед новым запуском.

### Экран заданий пустой
**Причина:** `renderQuestsFull()` обращался к `document.getElementById('qst-lives')` которого
не было в HTML → null exception → функция падала до рендера заданий.  
**Исправление:** добавлен `<span id="qst-lives">` в HTML.

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
| Stripe + Wrapped | **3 параллельные полосы** (Candy Crush) |
| Wrapped + Wrapped | 5×5 дважды |
| Stripe/Bomb + Bomb/Mega | Stripe + 3×3 область |
| Mega + Mega | 7×7 |
| Bomb + Mega | 5×5 |
| Rainbow + обычный | Уничтожить все гемы цвета партнёра |
| Rainbow + спешл | Все гемы цвета партнёра → этот спешл, все взрываются |
| Rainbow + Rainbow | Очистить весь экран |
| Coloring + Coloring | Поменять два цвета местами |
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
