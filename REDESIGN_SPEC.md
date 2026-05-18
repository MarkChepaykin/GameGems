# ORE RUSH — Полная спецификация редизайна
> Инструкция для Claude Code. Каждый раздел — самостоятельная задача.
> Начинать с раздела **1 → 2 → 3** по порядку, остальное по готовности.

---

## Содержание
1. [Стилевые направления](#1-стилевые-направления)
2. [Фишки-руды (8 типов)](#2-фишки-руды)
3. [Рендеринг гемов — «сочный» стиль](#3-рендеринг-гемов)
4. [Бонусные фишки (6 типов + анимации)](#4-бонусные-фишки)
5. [Партиклы и анимации матчей](#5-партиклы-и-анимации)
6. [Блокеры (15 типов)](#6-блокеры)
7. [Фоны глав (200+ уровней)](#7-фоны-глав)
8. [UI и типографика](#8-ui-и-типографика)
9. [Порядок реализации](#9-порядок-реализации)

---

## 1. Стилевые направления

Выбрать **одно** из трёх перед реализацией.

### Стиль A — «Шахтёрская сказка» ⭐ (рекомендую)
> Вайб: Hay Day × Royal Match × мультик про гномов-золотоискателей.
> Тёплый, весёлый, «хочется тапать». Цветастый, но не кислотный.

- **Цвета:** Тёплые землистые тона + яркие акценты гемов. Фон: тёплый тёмно-коричневый.
- **Гемы:** Округлые, «пухлые» кристаллы с толстым контуром и мягким свечением.
- **UI:** Деревянные рамки, кованые заклёпки, войлочный шрифт.
- **Частицы:** Золотые искры + земляная пыль + рудные осколки.
- **Атмосфера:** Дружелюбные шахтёры-гномы нашли сокровища.

### Стиль B — «Глубинная экспедиция»
> Вайб: Diablo × Candy Crush в тёмной пещере. Эпично, атмосферно.
> Тёмный фон, яркие светящиеся кристаллы.

- **Цвета:** Почти чёрный фон, гемы светятся изнутри.
- **Гемы:** Острые грани, внутреннее свечение, магические руны.
- **UI:** Каменные плиты, металлические края, руническое письмо.
- **Частицы:** Энергетические искры + магическое свечение.
- **Атмосфера:** Учёный-маг исследует подземелье.

### Стиль C — «Приключение геолога»
> Вайб: Indiana Jones × Roblox. Cartoon-реалистичный гибрид.
> Средний баланс между A и B.

- **Цвета:** Нейтральный тёмный фон + реалистичные цвета минералов.
- **Гемы:** Геологически корректные, но мультяшные.
- **UI:** Полевой дневник, крафтовая бумага, маркер.
- **Частицы:** Каменная пыль + бликующие осколки.
- **Атмосфера:** Команда геологов на экспедиции.

---

## 2. Фишки-руды

### Текущие 6 типов (уже в коде)
```js
const GEMS = [
  { id:0, color:'#f0c030', shape:'ore_spike',  name:'Золото'  },
  { id:1, color:'#4aafff', shape:'ore_hex',    name:'Сапфир'  },
  { id:2, color:'#30d870', shape:'ore_rect',   name:'Изумруд' },
  { id:3, color:'#ff4848', shape:'ore_round',  name:'Рубин'   },
  { id:4, color:'#c060ff', shape:'ore_tri',    name:'Аметист' },
  { id:5, color:'#ff8840', shape:'ore_blob',   name:'Янтарь'  },
];
```

### Добавить 2 новых (итого 8, если нужно расширение до 8)
```js
  { id:6, color:'#20d8f0', shape:'ore_crystal', name:'Топаз'   },  // голубой
  { id:7, color:'#a0ff40', shape:'ore_shard',   name:'Перидот' },  // жёлто-зелёный
```

Новые формы для `_gemPath` в `index.html`:
```js
// ore_crystal — вертикальный удлинённый кристалл с боковыми гранями (топаз)
case 'ore_crystal': {
  const w = r*0.42, h = r*0.95, mw = r*0.62;
  ctx.moveTo(cx, cy - h);
  ctx.lineTo(cx + w, cy - h*0.30);
  ctx.lineTo(cx + mw, cy + h*0.30);
  ctx.lineTo(cx + w*0.50, cy + h);
  ctx.lineTo(cx - w*0.50, cy + h);
  ctx.lineTo(cx - mw, cy + h*0.30);
  ctx.lineTo(cx - w, cy - h*0.30);
  ctx.closePath();
  break;
}
// ore_shard — плоский ромб с засечками (перидот)
case 'ore_shard': {
  const w = r*0.88, h = r*0.92, notch = r*0.15;
  ctx.moveTo(cx, cy - h);
  ctx.lineTo(cx + w, cy - notch);
  ctx.lineTo(cx + w*0.60, cy);
  ctx.lineTo(cx + w, cy + notch);
  ctx.lineTo(cx, cy + h);
  ctx.lineTo(cx - w, cy + notch);
  ctx.lineTo(cx - w*0.60, cy);
  ctx.lineTo(cx - w, cy - notch);
  ctx.closePath();
  break;
}
```

---

## 3. Рендеринг гемов

### Цель
Сейчас: плоские, скучные. Нужно: **«Royal Match»-уровень** — объёмные, глянцевые, «хочется потрогать».

### Заменить `_renderGemSprite` в `index.html`

Полный рабочий код функции (заменять целиком):

```js
function _renderGemSprite(shape, color, size, gemType, skin) {
  const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
  const pad = Math.ceil(size * 0.28);  // увеличен padding для glow
  const w = Math.ceil(size + pad*2);
  const cv = document.createElement('canvas');
  cv.width  = Math.ceil(w * dpr);
  cv.height = Math.ceil(w * dpr);
  const c = cv.getContext('2d');
  c.scale(dpr, dpr);
  const r = size/2, cx = pad + r, cy = pad + r;

  // PNG override
  if (gemType !== undefined && GEM_IMAGES[gemType] && !SKIN_EMOJI[skin]) {
    c.drawImage(GEM_IMAGES[gemType], pad, pad, size, size);
    return { canvas: cv, pad, size, w };
  }

  const emojiSet = SKIN_EMOJI[skin];
  if (emojiSet && gemType !== undefined && emojiSet[gemType]) {
    c.font = `${size*.78}px Arial`; c.textAlign='center'; c.textBaseline='middle';
    c.strokeStyle = gemContrastStroke(color);
    c.lineWidth = Math.max(2, size*0.06); c.lineJoin='round';
    c.strokeText(emojiSet[gemType], cx, cy+1);
    c.fillText(emojiSet[gemType], cx, cy+1);
    return { canvas: cv, pad, size, w };
  }

  const dark   = blendColor(color, 0,   0.42);
  const darker = blendColor(color, 0,   0.65);
  const light  = blendColor(color, 255, 0.35);
  const bright = blendColor(color, 255, 0.65);

  // ── 1. Мягкое цветное свечение вокруг гема (glow halo) ──────────
  c.save();
  c.shadowColor = color;
  c.shadowBlur = r * 0.9;
  c.globalAlpha = 0.55;
  _gemPath(c, shape, cx, cy, r * 0.82);
  c.fillStyle = color;
  c.fill();
  c.restore();

  // ── 2. Тёмный контурный подбой (чуть больше фигуры) ─────────────
  c.save();
  _gemPath(c, shape, cx, cy, r);
  c.lineJoin = 'round';
  c.strokeStyle = darker;
  c.lineWidth = Math.max(3, r * 0.22);
  c.stroke();
  c.restore();

  // ── 3. Основная заливка — многослойный радиальный градиент ──────
  c.save();
  _gemPath(c, shape, cx, cy, r);
  c.clip();

  // Объёмный градиент: свет сверху-слева, тень снизу-справа
  const grd = c.createLinearGradient(cx - r*0.5, cy - r, cx + r*0.3, cy + r);
  grd.addColorStop(0,    bright);
  grd.addColorStop(0.20, light);
  grd.addColorStop(0.55, color);
  grd.addColorStop(0.82, dark);
  grd.addColorStop(1,    darker);
  c.fillStyle = grd;
  c.fillRect(cx - r - 4, cy - r - 4, r*2 + 8, r*2 + 8);

  // Внутренний радиальный блик (глубина)
  const rg2 = c.createRadialGradient(cx - r*0.28, cy - r*0.35, r*0.05, cx, cy, r);
  rg2.addColorStop(0,   'rgba(255,255,255,0.32)');
  rg2.addColorStop(0.4, 'rgba(255,255,255,0.06)');
  rg2.addColorStop(1,   'rgba(0,0,0,0.18)');
  c.fillStyle = rg2;
  c.fillRect(cx - r - 4, cy - r - 4, r*2 + 8, r*2 + 8);
  c.restore();

  // ── 4. Грань-рёбра — световой удар по верхнему краю ─────────────
  c.save();
  _gemPath(c, shape, cx, cy, r);
  c.clip();
  c.strokeStyle = blendColor(color, 255, 0.72);
  c.lineWidth = Math.max(1.8, r * 0.12);
  c.lineJoin = 'round';
  c.translate(0, -Math.max(1.5, r * 0.12));
  _gemPath(c, shape, cx, cy, r);
  c.stroke();
  c.restore();

  // ── 5. Зеркальный блик — главная «точка» сверху-слева ───────────
  c.save();
  _gemPath(c, shape, cx, cy, r);
  c.clip();
  // Большой мягкий блик
  const hg1 = c.createRadialGradient(cx - r*0.30, cy - r*0.38, 0, cx - r*0.20, cy - r*0.28, r*0.55);
  hg1.addColorStop(0,   'rgba(255,255,255,0.80)');
  hg1.addColorStop(0.4, 'rgba(255,255,255,0.28)');
  hg1.addColorStop(1,   'rgba(255,255,255,0)');
  c.fillStyle = hg1;
  c.fillRect(cx - r - 4, cy - r - 4, r*2 + 8, r*2 + 8);
  // Маленький острый блик (зеркальная точка)
  const hg2 = c.createRadialGradient(cx - r*0.38, cy - r*0.46, 0, cx - r*0.38, cy - r*0.46, r*0.20);
  hg2.addColorStop(0,   'rgba(255,255,255,0.98)');
  hg2.addColorStop(0.5, 'rgba(255,255,255,0.55)');
  hg2.addColorStop(1,   'rgba(255,255,255,0)');
  c.fillStyle = hg2;
  c.fillRect(cx - r - 4, cy - r - 4, r*2 + 8, r*2 + 8);
  c.restore();

  // ── 6. Обводка фигуры (читаемость) ──────────────────────────────
  c.save();
  _gemPath(c, shape, cx, cy, r * 0.98);
  c.strokeStyle = 'rgba(255,255,255,0.28)';
  c.lineWidth = Math.max(1, r * 0.04);
  c.stroke();
  c.restore();

  return { canvas: cv, pad, size, w };
}
```

### Изменения в `_renderGemSprite` по сравнению с текущим:
- `pad` увеличен 0.20 → 0.28 (место для glow)
- Шаг 1: добавлен `shadowBlur` для цветного свечения
- Шаг 3: добавлен внутренний радиальный градиент (глубина)
- Шаг 4: заменена тонкая линия на более жирную грань
- Шаг 5: добавлен двойной блик (мягкий + острый зеркальный)

---

## 4. Бонусные фишки

### Маппинг SPECIAL → тематика раскопок

| SPECIAL | Название | Иконка | Как создать |
|---------|----------|--------|-------------|
| STRIPE_H/V | Буровая установка | ⛏️ Вращающийся бур | 4 в линию |
| BOMB | Динамит | 🧨 Связка шашек | T или L из 5–6 |
| ROCKET | Сигнальная ракета | 🚀 Ракетница | Квадрат 2×2 |
| RAINBOW | Геосканер | 📡 Радарный экран | 5 в линию |
| COLORING | Баррель с краской | 🪣 Деревянная бочка | T из 6 |
| MEGA | Шахтная мина | 💣 Раскопанная мина | Особый редкий |

### Иконки на гемах (рисуются поверх в `drawCellGem`)

#### STRIPE_H/V — Буровая установка
```
Две параллельные жёлтые полосы (уже есть).
ЗАМЕНИТЬ на: иконку вращающегося бура в углу.
Угол: верхний-левый. Размер: cs*0.28 × cs*0.28.
Рисунок: спираль (arc + линия) цвета #d4a020, с тёмным контуром.
Стрелки направления: H — две стрелки ←→, V — ↑↓
```

#### BOMB — Динамит
```
Текущий: маленькая тёмная бомба с фитилём.
ЗАМЕНИТЬ на: красный цилиндр в нижнем-левом углу.
- Красный цилиндр (#e02020): fillRect скруглённый, cs*0.16 ширина
- Обмотка (чёрная): 2 тонкие горизонтальные полоски
- Фитиль: волнистая линия вверх (#a06020)
- Огонёк: arc(2px) #ff8020, pulse-анимация
```

#### ROCKET — Сигнальная ракета
```
Текущий: маленькая ракета со звёздами.
ЗАМЕНИТЬ на: металлическая ракетница в верхнем-правом углу.
- Корпус: бочкообразный (#c0c0d0), тёмный контур
- Дуло: конус вверху (#808090)
- Рукоятка: прямоугольник снизу (#604020)
- Пламя: маленький arc оранжевый, pulse
```

#### RAINBOW — Геосканер
```
Текущий: вихрь радужных красок (без цвета).
ОСТАВИТЬ визуально похожим, но добавить:
- Тёмный круг с текстурой экрана
- Зелёные концентрические кольца (radar sweep)
- Вращающийся луч радара
- Цвет схемы: #00ff80 на #001a0a
```

#### COLORING — Баррель с краской
```
Текущий: радужные секторы.
ЗАМЕНИТЬ на: деревянная бочка с цветом гема.
- Бочка (#8B4513): fillRect с скруглёнными краями
- 2 металлических обруча (#606060): тонкие горизонт. линии
- Краска вытекает сверху: blob цвета гема, капля
- Цвет меняется в зависимости от cell.type
```

### Анимации бонусов

#### Бур (STRIPE_H/V) — `animateStripeExplosion` ЗАМЕНИТЬ
```
БЫЛО: жёлтые вспышки по строке/столбцу.
СТАЛО (раскадровка):
  t=0ms:   Из центра гема выходят два конуса бура (←→ или ↑↓)
           Размер: cs*0.6, цвет: #d4a020, металлический блик
  t=50ms:  Буры начинают движение в противоположные стороны
           Скорость нарастает. За бурами — облако пыли (#8B6040, alpha 0.6)
  t=50-200ms: Буры проходят сквозь каждый гем в строке
              При контакте: маленький взрыв-вспышка (#ffd75a), debris
  t=200ms: Буры вылетают за край поля, исчезают с trail-эффектом
  t=300ms: Пыль оседает вниз (gravity particles)

Реализация:
  - `animateDrillFlight(r, c, dir)` — async, отдельная функция
  - Параметр dir: 'h' (горизонталь) или 'v' (вертикаль)
  - При dir='h': два буровых projectile летят ←→ одновременно
  - При dir='v': два буровых projectile летят ↑↓ одновременно
  - Projectile: `{ x, y, vx, vy, angle, life }` рисуется на pCanvas
  - Drill рисуется как: конус (ctx.lineTo) + спираль (3 arc дуги)
  - Пыль: spawnParticlesBurst(x, y, '#c4a060', 6) на каждый разрушенный гем
```

#### Динамит (BOMB) — `_bombPhase1` и `_bombBlast3x3`
```
БЫЛО: красный взрыв 3×3.
СТАЛО (раскадровка):
  Фаза 1 (при активации):
    t=0ms:   На месте динамита появляется связка шашек (3 красных цилиндра)
             Медленно пульсируют (scale 1→1.1→1)
    t=0-400ms: Фитиль горит — линия укорачивается, искры летят
    t=400ms: ВЗРЫВ — ударная волна кольцом (#ff8020→transparent)
             Зона 3×3 подсвечивается оранжевым
    t=400-600ms: Гемы в зоне разлетаются с rotation
    t=600ms: Динамит НЕ исчезает — падает с остальными гемами
             Из него идёт дымок (серые частицы вверх)
  Фаза 2 (после посадки):
    t=+800ms: Второй взрыв — такой же, но с добавочным встряхиванием экрана
              Shake: ctx.translate(Math.random()*4-2, Math.random()*4-2) на 3 кадра

Реализация:
  - В `_bombPhase1`: добавить анимацию горящего фитиля (decreasing line length)
  - Screen shake: глобальный `_screenShake = { x, y, duration }`, применять в drawBoard
  - Дымок: частицы { vy: -2, vx: ±0.5, color: '#808080', r: 3, life: 0.8 }
```

#### Ракета (ROCKET) — `animateRocketFlight` УЛУЧШИТЬ
```
БЫЛО: ракета по дуге Безье с трейлом.
СТАЛО:
  - Корпус ракеты: металлический (#c0c0d0) + красный нос (#e02020)
  - Иллюминатор: маленький светящийся круг (#80ffff)
  - Пламя двигателя: 3 наложенных arc (белый→жёлтый→оранжевый), мерцают
  - Дымовой трейл: 8-10 серых кругов убывающего размера вдоль траектории
  - При попадании: взрыв (кольцо + 12 обломков-частиц)

Изменения в `animateRocketFlight`:
  - Добавить дымовой трейл (массив последних позиций ракеты)
  - Заменить тело ракеты: нос-конус + цилиндр + 2 плавника + пламя
  - Вращение: ракета всегда смотрит носом по направлению движения
```

#### Геосканер (RAINBOW) — `triggerSpecial(RAINBOW)`
```
БЫЛО: вихрь уничтожения без особой анимации.
СТАЛО (раскадровка):
  t=0ms:   Геосканер пульсирует — увеличивается (scale 1→1.3→1)
  t=0-600ms: От него расходится круговая волна-радар
              Волна — arc с градиентом от center: rgba(0,255,128,0.6)→transparent
              Скорость волны: boardW/0.6s (охватывает всё поле за 600мс)
  t=200-600ms: При контакте волны с гемом нужного цвета:
              Гем подсвечивается (#00ff80 glow, scale 1→1.15→1), помечается
  t=600ms: Все помеченные гемы уничтожаются одновременно
           Эффект каждого: мини-взрыв + частицы цвета гема

Реализация:
  - `animateRadarWave(cx, cy, targetColor)` — async
  - Волна: объект `{ x, y, r: 0, maxR, life: 1 }` в массиве rings
  - При r >= dist(gem): помечаем гем anim.highlight=true → рисуем glow
  - По окончании: Promise.all взрывов всех помеченных
```

#### Баррель (COLORING)
```
БЫЛО: радужные секторы перекрашивают.
СТАЛО:
  - Баррель «бросают» на доску — анимация arc (полёт по дуге)
  - При падении: краска выплёскивается blob'ами
  - Blob краски расползается по целевым гемам (interpolate radius)
  - Каждый гем получает «кляксу» цвета: anim.paintAlpha 0→1

Реализация:
  - `animatePaintSplash(r, c, color, targetCells)` — async
  - Paint blob: irregular polygon (8 вершин с рандомными отступами)
  - Расползание: blob.r += (targetR - blob.r) * 0.15 за кадр
```

---

## 5. Партиклы и анимации

### Новая система частиц для темы раскопок

Заменить `spawnParticles` в `index.html`:

```js
function spawnParticles(r, c, color, count=12) {
  if (particles.length >= _MAX_PARTICLES) return;
  const x = boardOffX + c*cellSize + cellSize/2;
  const y = boardOffY + r*cellSize + cellSize/2;
  const slots = Math.min(count, _MAX_PARTICLES - particles.length);

  // 1. Рудные осколки — острые треугольные чипсы цвета гема
  const shardN = Math.min(Math.floor(slots * 0.45), 8);
  for (let i = 0; i < shardN; i++) {
    const a = (Math.PI*2/shardN)*i + Math.random()*0.8;
    const sp = 6 + Math.random()*9;
    particles.push({
      x, y,
      vx: Math.cos(a)*sp, vy: Math.sin(a)*sp - 3,
      color, life: 1,
      r: 2.5 + Math.random()*4,
      glow: true,
      shard: true,           // рисовать треугольником, не кругом
      rot: Math.random()*Math.PI*2,
      rotV: (Math.random()-0.5)*0.3
    });
  }

  // 2. Золотые/светлые искры
  const sparkN = Math.min(Math.floor(slots * 0.35), 7);
  for (let i = 0; i < sparkN; i++) {
    const a = Math.random()*Math.PI*2;
    const sp = 10 + Math.random()*16;
    const sparkColor = Math.random() > 0.5 ? '#fff8c0' : blendColor(color, 255, 0.6);
    particles.push({
      x, y,
      vx: Math.cos(a)*sp, vy: Math.sin(a)*sp - 5,
      color: sparkColor, life: 0.65,
      r: 1.2 + Math.random()*2.2,
      star: true
    });
  }

  // 3. Каменная пыль — тёмные/серые круги, падают медленно
  const dustN = Math.min(Math.floor(slots * 0.25), 5);
  for (let i = 0; i < dustN; i++) {
    const a = Math.random()*Math.PI*2;
    const sp = 3 + Math.random()*6;
    const dustColor = `rgba(${100+Math.floor(Math.random()*60)},${80+Math.floor(Math.random()*40)},${40+Math.floor(Math.random()*30)},0.7)`;
    particles.push({
      x, y,
      vx: Math.cos(a)*sp, vy: Math.sin(a)*sp - 1,
      color: dustColor, life: 0.85,
      r: 3 + Math.random()*5,
      dust: true           // рисовать с blur
    });
  }

  // Кольцо взрыва
  if (rings.length < _MAX_RINGS) {
    rings.push({ x, y, color, r: 3, maxR: cellSize*0.85, life: 1, lw: 2.5 });
    rings.push({ x, y, color: 'rgba(255,255,240,0.9)', r: 8, maxR: cellSize*1.2, life: 0.50, lw: 1.5 });
  }
}
```

Обновить рендер частиц в `updateParticles` — добавить рендер `shard`:
```js
} else if (p.shard) {
  // Треугольный осколок с вращением
  c.save();
  c.globalAlpha = a;
  c.shadowColor = p.color; c.shadowBlur = p.r * 1.5;
  c.fillStyle = p.color;
  c.translate(p.x, p.y);
  c.rotate(p.rot + (p.rotV||0) * (1-a) * 10);
  c.beginPath();
  c.moveTo(0, -p.r*1.2);
  c.lineTo(p.r*0.8, p.r*0.8);
  c.lineTo(-p.r*0.8, p.r*0.8);
  c.closePath();
  c.fill();
  c.shadowBlur = 0;
  c.restore();
  if (p.rotV) p.rot += p.rotV;
}
```

### Screen shake (добавить в `drawBoard`)
```js
// Глобальный шейк (добавить в начало drawBoard перед основным рендером)
let _screenShakeX = 0, _screenShakeY = 0, _screenShakeDur = 0;
function triggerScreenShake(intensity=4, duration=8) {
  _screenShakeDur = duration;
  _screenShakeX = (Math.random()-0.5)*2*intensity;
  _screenShakeY = (Math.random()-0.5)*2*intensity;
}
// В drawBoard, после ctx.clearRect:
if (_screenShakeDur > 0) {
  _screenShakeDur--;
  _screenShakeX *= 0.75;
  _screenShakeY *= 0.75;
  ctx.translate(_screenShakeX, _screenShakeY);
}
```

### Bounce-анимация при свапе (улучшить)
В `animateSwap` добавить:
- При успешном матче: короткий scale bounce (1 → 1.12 → 0.95 → 1) за 200мс
- При неудачном свапе: shake ячейки (ox ±4px × 3 раза) за 160мс

### Pop-анимация при выборе (улучшить)
В `drawCellGem` при `selectedCell`:
- Текущий: статичная белая рамка
- Новый: пульсирующий scale 1 → 1.08 → 1 каждые 600мс + цветное свечение

---

## 6. Блокеры

### Маппинг Candy Crush Soda → Тема раскопок

| CC оригинал | Наш блокер | Переменная | Описание | Слоёв |
|-------------|-----------|------------|----------|--------|
| Cupcake | Каменная глыба | `stone` | Разрушается ударами, 5 слоёв | 5 |
| Liquorice Lock | Железная скоба | `locked` | Блокирует свап и матч | — |
| Chocolate | Лава | `chocolate` | Расширяется если не бить | ∞ |
| White Chocolate | Магма | `magma` | Слабее лавы, 2 слоя | 2 |
| Honey | Смола/янтарь | `honey` | Гем застрял, бьётся соседями | 6 |
| Candy Ice Cube | Вечная мерзлота | `ice` | Гем застрял, 6 слоёв | 6 |
| Liquorice Swirl | Корень дерева | `marmalade` | Не матчится, мобильный | — |
| Bubble Gum | Мох | `moss` | Расширяется, 2 слоя | 2 |
| Jelly Cake | Жеода | `geode` | 2×2, 8 ударов, big blast | 8 |
| Liquorice Link | Цепи | `chain` | Цепи соединяют ячейки | 5 |
| Peppermint Stick | Сталактит | `stalactite` | Вертикальный, до 9 ударов | 9 |
| Pancake | Перекати-камень | `rolling_rock` | Мобильный, 5 слоёв | 5 |
| Color Blocker | Цветная порода | `color_rock` | Только матч своего цвета | 4 |
| Candy Roll | Вагонетка | `mine_cart` | Создаёт пути, 3 слоя | 3 |
| Cracker | Обсидиановый щит | `obsidian` | Иммунитет к соседним, 1 слой | 1 |

### Визуальный стиль блокеров

#### Каменная глыба (stone) — 5 слоёв
```
Слой 5 (нетронутый): крупный валун из нескольких округлых камней
  - Цвет: #5a4e3a (тёмно-коричневый камень)
  - Трещины: нет
  - Текстура: bumps (4–5 arc разного размера, чуть светлее)
Слой 4: одна трещина по диагонали
Слой 3: 3 трещины, мелкий скол в углу
Слой 2: почти развалившийся, куски торчат
Слой 1: едва держится, крупные куски, щели светятся оранжевым
→ Реализация: 5 кешированных спрайтов `_stoneSprites[layer]`
```

#### Лава (chocolate)
```
- Яркий оранжево-красный фон (#ff4400)
- Пузырьки поднимаются (3 анимированных arc, меняются раз в 60 кадров)
- Красный kант из щелей по краям
- Уже есть в коде (chocolate): заменить цвета и убрать фиолетовый
```

#### Смола/янтарь (honey)
```
- Прозрачный коричнево-золотистый (#c07820, opacity 0.7)
- Внутри виден гем (тусклый)
- Капли стекают по нижнему краю
- 6 слоёв = 6 оттенков прозрачности (темнее = больше слоёв)
```

#### Жеода (geode) — 2×2
```
- Внешняя скорлупа: серо-коричневый камень (#6a5a4a)
- Внутри: аметистовые кристаллы (#9060c0), radiating от центра
- Центр: светящийся белый orb
- Каждый удар: orb уменьшается, кристаллы трескаются
→ Реализация: отдельная drawGeode(ctx, x, y, hitCount) функция
```

#### Цепи (chain)
```
- Поверх гема: 3 горизонтальных звена цепи (#808090)
- Замок по центру сверху (#606070, keyhole:#ffd700)
- Каждый слой = одно звено исчезает
→ Реализация: улучшить существующий `cell.locked` рендер
```

#### Вагонетка (mine_cart)
```
- Деревянная тачка (#8B4513) на рельсах
- Полная руды сверху (3 маленьких цветных гема)
- Колёса (#303030), спицы, ось
- Mobile: катится горизонтально при совпадении
→ Реализация: новый `cell.mineCart` с `drawMineCart()` функцией
```

---

## 7. Фоны глав

### Система биомов

Функция `drawBoardBackground(ctx, chapterBiome)` в `drawBoard`.

Биом определяется: `getBiome(state.currentLevel)` — возвращает строку.

```js
function getBiome(level) {
  const biomes = [
    { from:1,   to:15,  id:'meadow'    },
    { from:16,  to:30,  id:'forest'    },
    { from:31,  to:45,  id:'desert'    },
    { from:46,  to:60,  id:'clay'      },
    { from:61,  to:75,  id:'roots'     },
    { from:76,  to:90,  id:'river'     },
    { from:91,  to:105, id:'limestone' },
    { from:106, to:120, id:'malachite' },
    { from:121, to:140, id:'amethyst'  },
    { from:141, to:160, id:'quartz'    },
    { from:161, to:180, id:'gold_vein' },
    { from:181, to:200, id:'ruby_mine' },
    { from:201, to:220, id:'lava_tubes'},
    { from:221, to:240, id:'obsidian'  },
    { from:241, to:260, id:'ice_cave'  },
    { from:261, to:280, id:'ruins'     },
    { from:281, to:300, id:'vault'     },
    { from:301, to:320, id:'magma_sea' },
    { from:321, to:340, id:'diamond'   },
    { from:341, to:360, id:'titanium'  },
    { from:361, to:380, id:'dragon_lair'},
    { from:381, to:400, id:'earthcore' },
    { from:401, to:Infinity, id:'void' },
  ];
  return biomes.find(b => level >= b.from && level <= b.to)?.id || 'meadow';
}
```

### Детали биомов

Функция `drawBoardBackground(biome)` рисует фон ЗА доской через canvas (не CSS).
Рисуется только в части экрана вокруг доски, не на самой доске.

```js
const BIOME_CONFIG = {
  meadow: {
    skyTop: '#7cc7f0',    skyBot: '#c8e8a0',
    groundColor: '#4a8020',
    details: 'clouds,flowers,birds',
    boardBg: 'rgba(80,50,20,0.45)'
  },
  forest: {
    skyTop: '#5aa870',    skyBot: '#8acc50',
    groundColor: '#2a5010',
    details: 'trees,mushrooms,roots',
    boardBg: 'rgba(30,40,10,0.55)'
  },
  desert: {
    skyTop: '#e8a030',    skyBot: '#f0c060',
    groundColor: '#c89040',
    details: 'dunes,cactus,sun',
    boardBg: 'rgba(100,70,20,0.50)'
  },
  clay: {
    skyTop: '#8a4820',    skyBot: '#c07040',
    groundColor: '#a05828',
    details: 'strata,fossils',
    boardBg: 'rgba(80,40,15,0.60)'
  },
  roots: {
    skyTop: '#2a1a08',    skyBot: '#3a2810',
    groundColor: '#1a0e04',
    details: 'roots,mushrooms,glowworms',
    boardBg: 'rgba(20,15,5,0.65)'
  },
  river: {
    skyTop: '#0a2840',    skyBot: '#1a4060',
    groundColor: '#0a1a30',
    details: 'stalactites,water,fish',
    boardBg: 'rgba(10,20,40,0.60)'
  },
  limestone: {
    skyTop: '#2a2018',    skyBot: '#4a3828',
    groundColor: '#3a2e1e',
    details: 'stalactites,lantern,dust',
    boardBg: 'rgba(40,30,15,0.65)'
  },
  malachite: {
    skyTop: '#0a2010',    skyBot: '#1a4020',
    groundColor: '#0a1810',
    details: 'malachite_veins,gold_seams',
    boardBg: 'rgba(5,20,10,0.70)'
  },
  amethyst: {
    skyTop: '#1a0830',    skyBot: '#2a1050',
    groundColor: '#100620',
    details: 'crystals,purple_mist,sparkles',
    boardBg: 'rgba(15,5,25,0.70)'
  },
  quartz: {
    skyTop: '#d0e8f0',    skyBot: '#e8f8ff',
    groundColor: '#b0c8d8',
    details: 'white_crystals,prismatic_light',
    boardBg: 'rgba(180,210,230,0.20)'
  },
  gold_vein: {
    skyTop: '#1a1008',    skyBot: '#2a1a08',
    groundColor: '#100a04',
    details: 'gold_veins,nuggets,warm_glow',
    boardBg: 'rgba(30,18,5,0.70)'
  },
  ruby_mine: {
    skyTop: '#200808',    skyBot: '#400810',
    groundColor: '#180404',
    details: 'ruby_clusters,red_atmosphere,pickaxe',
    boardBg: 'rgba(25,5,5,0.75)'
  },
  lava_tubes: {
    skyTop: '#1a0800',    skyBot: '#300800',
    groundColor: '#0a0400',
    details: 'lava_river,embers,orange_glow',
    boardBg: 'rgba(20,5,0,0.75)'
  },
  obsidian: {
    skyTop: '#050008',    skyBot: '#0a0010',
    groundColor: '#020004',
    details: 'obsidian_shards,red_veins,darkness',
    boardBg: 'rgba(5,0,8,0.85)'
  },
  ice_cave: {
    skyTop: '#0a2040',    skyBot: '#1a3860',
    groundColor: '#0a1830',
    details: 'ice_crystals,snowflakes,aurora',
    boardBg: 'rgba(10,20,45,0.65)'
  },
  ruins: {
    skyTop: '#1a1808',    skyBot: '#2a2810',
    groundColor: '#100e04',
    details: 'columns,vines,rune_glow',
    boardBg: 'rgba(18,15,5,0.70)'
  },
  vault: {
    skyTop: '#1a1000',    skyBot: '#2a2000',
    groundColor: '#0a0800',
    details: 'gold_coins,gems,crown,light_rays',
    boardBg: 'rgba(20,15,0,0.65)'
  },
  magma_sea: {
    skyTop: '#200400',    skyBot: '#380800',
    groundColor: '#100200',
    details: 'magma_sea,floating_rocks,heat',
    boardBg: 'rgba(25,3,0,0.80)'
  },
  diamond: {
    skyTop: '#050510',    skyBot: '#0a0a20',
    groundColor: '#020210',
    details: 'diamond_clusters,prismatic,cold_blue',
    boardBg: 'rgba(5,5,15,0.85)'
  },
  earthcore: {
    skyTop: '#100000',    skyBot: '#200000',
    groundColor: '#060000',
    details: 'core_glow,plasma,extreme_heat',
    boardBg: 'rgba(10,0,0,0.90)'
  }
};
```

### Функция фона доски

```js
function drawBoardBackground(biome) {
  const cfg = BIOME_CONFIG[biome] || BIOME_CONFIG.meadow;
  const cs = cellSize;
  const bx = boardOffX, by = boardOffY;
  const bw = COLS*cs, bh = ROWS*cs;

  // Фон вокруг доски (верхняя часть экрана)
  const bgGrd = ctx.createLinearGradient(0, 0, 0, by);
  bgGrd.addColorStop(0, cfg.skyTop);
  bgGrd.addColorStop(1, cfg.skyBot);
  ctx.fillStyle = bgGrd;
  ctx.fillRect(0, 0, canvasLogW, by + cs*0.5);

  // Основная подложка доски (заменяет текущий _boardBg)
  ctx.fillStyle = cfg.boardBg;
  // ... (текущая логика скруглённых ячеек)
}
```

### Визуальные детали (для drawBiomeDetails)

Рисовать в нижней/боковых зонах вокруг доски, не перекрывая геймплей.

#### Луг (meadow)
- Верх: gradient небо, облака (3-4 радиальных ellipse белых)
- Низ: зелёная трава полоска, цветочки (5-6 arc + линия)
- Анимация: облака медленно плывут (offset от времени)

#### Пещера с кристаллами (amethyst)
- Верх: фиолетовые кристаллы-сталактиты свисают (5-7 треугольных path)
- Низ: кристаллы снизу вверх
- Glow: фиолетовый radialGradient вокруг кристаллов
- Анимация: медленное мерцание (opacity 0.6↔1.0, period ~3s)

#### Лавовые трубки (lava_tubes)
- Низ: полоска лавы (оранжево-красный gradient + пузырьки)
- Бока: тёмные скалы с оранжевыми трещинами
- Анимация: пузырьки лавы всплывают, embers летят вверх

---

## 8. UI и типографика

### Проблемы (из скриншота)
1. Разные размеры шрифтов в HUD — нет иерархии
2. Низкая контрастность текста на тёмном фоне
3. Бонусные иконки в HUD (🔨⚡🌈) не соответствуют теме раскопок

### Шрифты — установить единую систему
```css
:root {
  --fs-xl:   clamp(28px, 7vw, 42px);   /* заголовки уровней */
  --fs-lg:   clamp(20px, 5vw, 28px);   /* подзаголовки */
  --fs-md:   clamp(15px, 3.8vw, 18px); /* основной текст */
  --fs-sm:   clamp(12px, 3vw, 14px);   /* подписи */
  --fs-xs:   clamp(10px, 2.5vw, 12px); /* метки */
}
```

### Контрастность
- Основной текст на тёмном: `#fff` или `#f4e8c8` ✓
- Подписи: `#d4b880` (gold-tinted) — не меньше 4.5:1 на `#1c1008`
- Акцент: `#f0c030` с `text-shadow: 0 2px 0 #4a2800`

### Бонусные иконки в HUD — заменить эмодзи на canvas
Текущие: `🔨⚡🌈🔄➕`
Новые: нарисовать в `buildBoostersUI` через отдельный canvas-спрайт (или SVG inline):
- Молоток → ⛏️ Кирка
- Радуга → 📡 Сканер
- Перемешать → 🔄 (оставить)
- Плюс ходов → ⚡ (оставить)
- Цветная бомба → 💣 Мина

---

## 9. Порядок реализации

### Сессия 1 — Гемы и рендер (**текущая задача**)
- [x] Заменить CSS тему (сделано)
- [x] Новые формы гемов в `_gemPath` (сделано)
- [ ] Заменить `_renderGemSprite` на «сочный» вариант из раздела 3
- [ ] Увеличить `_MAX_PARTICLES` до 350
- [ ] Заменить `spawnParticles` на новую из раздела 5
- [ ] Обновить рендер частиц (добавить shard-тип)
- [ ] Добавить screen shake

### Сессия 2 — Бонусы
- [ ] Новые иконки STRIPE/BOMB/ROCKET/RAINBOW/COLORING (раздел 4)
- [ ] `animateDrillFlight` — буровая анимация STRIPE
- [ ] Улучшить `animateRocketFlight` (раздел 4)
- [ ] `animateRadarWave` для RAINBOW
- [ ] Улучшить BOMB phase1/phase2 (фитиль + дым)

### Сессия 3 — Блокеры
- [ ] Новые спрайты каменной глыбы (5 слоёв)
- [ ] Новый рендер лавы (заменить chocolate цвета)
- [ ] Жеода (geode) — новый 2×2 блокер
- [ ] Вагонетка (mine_cart) — новый мобильный блокер
- [ ] Остальные блокеры по маппингу

### Сессия 4 — Фоны
- [ ] Функция `getBiome(level)`
- [ ] `BIOME_CONFIG` константа
- [ ] `drawBoardBackground(biome)` в drawBoard
- [ ] Базовые детали для 5–6 самых частых биомов

### Сессия 5 — UI polish
- [ ] Единая система шрифтов (CSS variables)
- [ ] Контрастность всех экранов
- [ ] Замена иконок бонусов в HUD

---

## Технические ограничения
- Весь код в одном `index.html` (~580KB)
- Canvas 2D, без WebGL
- Читать карту файла в CLAUDE.md перед правкой
- После правок — проверять `drawBoard` и `drawCellGem`
- При изменении `cellSize` — `invalidateGemCache()`
