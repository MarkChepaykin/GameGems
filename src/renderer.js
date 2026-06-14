// ══════════════════════════════════════════
//  РЕНДЕР
// ══════════════════════════════════════════
let _screenShakeX = 0, _screenShakeY = 0, _screenShakeDur = 0;
function triggerScreenShake(intensity=4, duration=8) {
  _screenShakeDur = duration;
  _screenShakeX = (Math.random()-0.5)*2*intensity;
  _screenShakeY = (Math.random()-0.5)*2*intensity;
}
function drawBoard() {
  if (!canvas||!ctx) return;
  ctx.clearRect(0,0,canvasLogW,canvasLogH);

  const _biome = getBiome(state.currentLevel);
  const _bmCfg = BIOME_CONFIG[_biome] || BIOME_CONFIG.meadow;

  // Screen shake
  const _doShake = _screenShakeDur > 0;
  if (_doShake) {
    _screenShakeDur--;
    _screenShakeX *= 0.75;
    _screenShakeY *= 0.75;
    ctx.save();
    ctx.translate(_screenShakeX, _screenShakeY);
  }

  // Анимация входа поля: scale 0.84→1
  const _hasEntryAnim = (_boardEntryScale !== 1 || _boardEntryOffY !== 0);
  if (_hasEntryAnim) {
    const cx = boardOffX + cellSize*COLS/2, cy = boardOffY + cellSize*ROWS/2;
    ctx.save();
    ctx.translate(cx, cy + _boardEntryOffY);
    ctx.scale(_boardEntryScale, _boardEntryScale);
    ctx.translate(-cx, -cy);
  }

  const cs=cellSize;
  // 1. Биомный фон доски
  ctx.save();
  ctx.fillStyle=_bmCfg.boardBg;
  ctx.beginPath();
  for (let r=0;r<ROWS;r++) for (let c=0;c<COLS;c++) {
    if (state.holes.has(`${r},${c}`)) continue;
    // Скругление: наружные края — 12px, внутренние (касаются соседней клетки) — 2px
    const hasT=r>0    && !state.holes.has(`${r-1},${c}`);
    const hasB=r<ROWS-1 && !state.holes.has(`${r+1},${c}`);
    const hasL=c>0    && !state.holes.has(`${r},${c-1}`);
    const hasR=c<COLS-1 && !state.holes.has(`${r},${c+1}`);
    const tl=(!hasT&&!hasL)?12:2, tr=(!hasT&&!hasR)?12:2;
    const bl=(!hasB&&!hasL)?12:2, br=(!hasB&&!hasR)?12:2;
    const bx=boardOffX+c*cs, by=boardOffY+r*cs;
    ctx.moveTo(bx+tl,by);
    ctx.arcTo(bx+cs,by,bx+cs,by+cs,tr);
    ctx.arcTo(bx+cs,by+cs,bx,by+cs,br);
    ctx.arcTo(bx,by+cs,bx,by,bl);
    ctx.arcTo(bx,by,bx+cs,by,tl);
    ctx.closePath();
  }
  ctx.fill(); // одна заливка = одна тень на весь контур
  ctx.restore();

  // 2. Фоны клеток + желе (статично, не двигаются)
  const _dbLvl = getLevel(state.currentLevel);
  const _cannonSet = _dbLvl?.cannons?.length
    ? new Set(_dbLvl.cannons.map(([r,c]) => `${r},${c}`))
    : null;
  const _dbNow = Date.now();
  for (let r=0;r<ROWS;r++) for (let c=0;c<COLS;c++) {
    if (state.holes.has(`${r},${c}`)) continue; // дыры — прозрачны
    const bx=boardOffX+c*cs, by=boardOffY+r*cs;
    // Фон клетки — нейтральный, не сливается с блокерами
    const isEven=(r+c)%2===0;
    ctx.fillStyle=isEven?_bmCfg.cellA:_bmCfg.cellB;
    roundRect(ctx,bx+1,by+1,cs-2,cs-2,10); ctx.fill();
    // Внутренний блик (верхняя полоска)
    ctx.fillStyle='rgba(255,255,255,0.08)';
    roundRect(ctx,bx+2,by+2,cs-4,Math.round(cs*0.28),8); ctx.fill();
    // Пушка (cannon spawn cell)
    if (_cannonSet?.has(`${r},${c}`)) {
      const v = _dbLvl.accelMap?.[r]?.[c] || [0, 2];
      const _dDir = v[1] > 0 ? 'down' : v[1] < 0 ? 'up' : v[0] > 0 ? 'right' : 'left';
      const _dImg = SPR['drill_' + _dDir];
      if (_dImg) { ctx.drawImage(_dImg, bx + 1, by + 1, cs - 2, cs - 2); }
      else {
      const ang = v[1] > 0 ? Math.PI/2 : v[1] < 0 ? -Math.PI/2 : v[0] > 0 ? 0 : Math.PI;
      const cx2 = bx + cs/2, cy2 = by + cs/2;
      ctx.save();
      // Dark metallic body
      ctx.shadowBlur = 6; ctx.shadowColor = '#000';
      ctx.fillStyle = '#1a1a2e';
      ctx.beginPath(); ctx.arc(cx2, cy2, cs*0.40, 0, Math.PI*2); ctx.fill();
      ctx.shadowBlur = 0;
      // Rotating drill rings
      const rot = (_dbNow / 500) % (Math.PI*2);
      ctx.strokeStyle = '#4a5568'; ctx.lineWidth = cs*0.045;
      ctx.beginPath(); ctx.arc(cx2, cy2, cs*0.28, rot, rot + Math.PI*1.4); ctx.stroke();
      ctx.strokeStyle = '#718096'; ctx.lineWidth = cs*0.035;
      ctx.beginPath(); ctx.arc(cx2, cy2, cs*0.18, rot + Math.PI, rot + Math.PI*2.4); ctx.stroke();
      // Direction arrow (orange drill tip)
      ctx.translate(cx2, cy2); ctx.rotate(ang);
      ctx.fillStyle = '#f97316';
      ctx.beginPath();
      ctx.moveTo(cs*0.20, 0); ctx.lineTo(cs*0.09, -cs*0.11); ctx.lineTo(cs*0.09, cs*0.11);
      ctx.closePath(); ctx.fill();
      // Metallic rim
      ctx.strokeStyle = '#64748b'; ctx.lineWidth = cs*0.06;
      ctx.beginPath(); ctx.arc(0, 0, cs*0.40, 0, Math.PI*2); ctx.stroke();
      ctx.restore();
      }
    }
    // Fountain cell (white choc source exposed — no white choc layer on top)
    if (state.myceliumSourceGrid?.[r]?.[c] && !(state.board[r]?.[c]?.mycelium > 0)) {
      ctx.fillStyle = 'rgba(255,215,100,0.22)';
      roundRect(ctx, bx+2, by+2, cs-4, cs-4, 8); ctx.fill();
      ctx.strokeStyle = 'rgba(255,190,60,0.55)'; ctx.lineWidth = 2;
      roundRect(ctx, bx+2, by+2, cs-4, cs-4, 8); ctx.stroke();
    }
    // Ковёр
    if (state.bricksGrid?.[r]?.[c]) {
      ctx.drawImage(_getCarpetSprite(), bx, by, cs, cs);
    }
    // Желе
    const dirt=state.dirtGrid[r]?.[c]||0;
    if (dirt>0) {
      const _jImg = dirt===1 ? BLOCK_SPRITES[25] : BLOCK_SPRITES[26];
      ctx.drawImage(_jImg || _getJellySprite(dirt), bx, by, cs, cs);
    }
  }

  // 2.5 Гигантские кроты — под покрытием; вскрытые клетки показывают части тела
  if (state.giants && state.giants.length) {
    for (const g of state.giants) {
      if (!g || g.done) continue;
      const gx = boardOffX + g.c*cs, gy = boardOffY + g.r*cs;
      const _cellsN = g.w * g.h;
      const _szKey = _cellsN <= 2 ? 'small' : _cellsN <= 8 ? 'medium' : 'large';
      const img = SPR['memory_bear_' + _szKey];
      if (img) {
        ctx.save();
        if (g.freed) { ctx.shadowColor = 'rgba(255,210,60,0.9)'; ctx.shadowBlur = cs*0.4; }
        if (g.w > g.h && img.height > img.width) {
          // горизонтальный гигант — поворачиваем вертикальный спрайт
          ctx.translate(gx + g.w*cs/2, gy + g.h*cs/2);
          ctx.rotate(Math.PI/2);
          ctx.drawImage(img, -g.h*cs/2 + 2, -g.w*cs/2 + 2, g.h*cs - 4, g.w*cs - 4);
        } else {
          ctx.drawImage(img, gx + 2, gy + 2, g.w*cs - 4, g.h*cs - 4);
        }
        ctx.restore();
      } else {
        ctx.save();
        ctx.fillStyle = 'rgba(90,60,40,0.92)';
        roundRect(ctx, gx + 3, gy + 3, g.w*cs - 6, g.h*cs - 6, 14); ctx.fill();
        ctx.fillStyle = 'rgba(255,230,180,0.9)';
        ctx.font = `${Math.min(g.w, g.h)*cs*0.5}px Arial`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('🦡', gx + g.w*cs/2, gy + g.h*cs/2);
        ctx.restore();
      }
    }
  }

  // 3. Фишки с анимацией
  for (let r=0;r<ROWS;r++) for (let c=0;c<COLS;c++) {
    if (state.holes.has(`${r},${c}`)) continue;
    const cell=state.board[r]?.[c];
    if (cell) drawCellGem(r,c,cell);
  }

  // 4. Лёд поверх фишек (1-6 слоёв)
  const _iceS = BLOCK_SPRITES[23] || _getIceSprite();
  for (let r=0;r<ROWS;r++) for (let c=0;c<COLS;c++) {
    const _iceL = state.iceGrid[r]?.[c]; if (!_iceL) continue;
    ctx.drawImage(_iceS, boardOffX+c*cs, boardOffY+r*cs, cs, cs);
    if (_iceL > 1) _drawLayerBadge(ctx, boardOffX+c*cs, boardOffY+r*cs, cs, _iceL);
  }

  // 4.1 Слоёная порода поверх фишек (1-6 слоёв, только direct match)
  if (state.frostGrid) {
    for (let r=0;r<ROWS;r++) for (let c=0;c<COLS;c++) {
      const fl = state.frostGrid[r]?.[c]; if (!fl) continue;
      const fx=boardOffX+c*cs, fy=boardOffY+r*cs;
      const _rockS = SPR['rock_layer_' + Math.min(6, fl)];
      if (_rockS) {
        ctx.drawImage(_rockS, fx, fy, cs, cs);
        if (fl > 1) _drawLayerBadge(ctx, fx, fy, cs, fl);
        continue;
      }
      const alpha = 0.35 + fl/6*0.55;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#c7f0ff';
      roundRect(ctx, fx+1, fy+1, cs-2, cs-2, 8); ctx.fill();
      // Кристальный паттерн
      ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 1.2;
      const cx2=fx+cs/2, cy2=fy+cs/2, sr=cs*0.38;
      for (let i=0;i<6;i++) {
        const ang=i*Math.PI/3;
        ctx.beginPath(); ctx.moveTo(cx2,cy2); ctx.lineTo(cx2+Math.cos(ang)*sr, cy2+Math.sin(ang)*sr); ctx.stroke();
      }
      ctx.strokeStyle='rgba(180,230,255,0.6)'; ctx.lineWidth=1.5;
      roundRect(ctx, fx+2, fy+2, cs-4, cs-4, 7); ctx.stroke();
      // Слои: число кружков = fl
      ctx.fillStyle='rgba(255,255,255,0.85)';
      for(let i=0;i<fl;i++){ctx.beginPath();ctx.arc(fx+8+i*10,fy+8,2.5,0,Math.PI*2);ctx.fill();}
      ctx.restore();
    }
  }

  // 4.3 Порталы — цветные кольца с анимацией
  if (state.portalGrid) {
    const _t = Date.now();
    const _drawnPairs = new Set();
    for (let r=0;r<ROWS;r++) for (let c=0;c<COLS;c++) {
      const p = state.portalGrid[r]?.[c]; if (!p) continue;
      const pKey = Math.min(r*COLS+c, p.exitR*COLS+p.exitC)+','+Math.max(r*COLS+c, p.exitR*COLS+p.exitC);
      if (_drawnPairs.has(pKey)) continue; _drawnPairs.add(pKey);
      const tube = state.portalTubeMap?.[pKey];
      if (tube && tube.segs.length > 1) {
        ctx.save();
        ctx.strokeStyle = tube.color + '55'; ctx.lineWidth = cs * 0.22;
        ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        ctx.beginPath();
        for (let i = 0; i < tube.segs.length; i++) {
          const [sr, sc] = tube.segs[i];
          const sx = boardOffX + sc*cs + cs/2, sy = boardOffY + sr*cs + cs/2;
          if (i === 0) ctx.moveTo(sx, sy); else ctx.lineTo(sx, sy);
        }
        ctx.stroke();
        ctx.strokeStyle = tube.color + 'aa'; ctx.lineWidth = cs * 0.08;
        ctx.beginPath();
        for (let i = 0; i < tube.segs.length; i++) {
          const [sr, sc] = tube.segs[i];
          const sx = boardOffX + sc*cs + cs/2, sy = boardOffY + sr*cs + cs/2;
          if (i === 0) ctx.moveTo(sx, sy); else ctx.lineTo(sx, sy);
        }
        ctx.stroke();
        ctx.restore();
      } else {
        const x1=boardOffX+c*cs+cs/2, y1=boardOffY+r*cs+cs/2;
        const x2=boardOffX+p.exitC*cs+cs/2, y2=boardOffY+p.exitR*cs+cs/2;
        const cpx=(x1+x2)/2-(y2-y1)*0.3, cpy=(y1+y2)/2+(x2-x1)*0.3;
        ctx.save();
        ctx.strokeStyle=p.color+'66'; ctx.lineWidth=2; ctx.setLineDash([5,4]);
        ctx.beginPath(); ctx.moveTo(x1,y1); ctx.quadraticCurveTo(cpx,cpy,x2,y2); ctx.stroke();
        ctx.setLineDash([]); ctx.restore();
      }
    }
    for (let r=0;r<ROWS;r++) for (let c=0;c<COLS;c++) {
      const p = state.portalGrid[r]?.[c]; if (!p) continue;
      const px=boardOffX+c*cs+cs/2, py=boardOffY+r*cs+cs/2;
      const pulse=0.88+0.12*Math.sin(_t/500+p.id*Math.PI);
      const ringR=cs*0.44*pulse;
      ctx.save();
      // Ореол портала без shadowBlur
      ctx.globalAlpha=0.28; ctx.fillStyle=p.color;
      ctx.beginPath(); ctx.arc(px,py,ringR*1.3,0,Math.PI*2); ctx.fill();
      ctx.strokeStyle=p.color; ctx.lineWidth=3; ctx.globalAlpha=0.85;
      ctx.beginPath(); ctx.arc(px,py,ringR,0,Math.PI*2); ctx.stroke();
      ctx.globalAlpha=0.18; ctx.fillStyle=p.color;
      ctx.beginPath(); ctx.arc(px,py,ringR,0,Math.PI*2); ctx.fill();
      ctx.globalAlpha=0.75;
      ctx.font=`${cs*0.32}px Arial`; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillStyle='#ffffff'; ctx.fillText('🌀',px,py);
      ctx.restore();
    }
  }

  // 4.5 Сода-зона оверлей — только над клетками без дыр
  if (state.floodLevel > 0) {
    const floodStart = ROWS - state.floodLevel;
    const sy = boardOffY + floodStart * cs;
    const sh = state.floodLevel * cs;
    ctx.save();
    // Клипируем к валидным клеткам (без дыр) в сода-зоне
    ctx.beginPath();
    for (let r = floodStart; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (state.holes.has(`${r},${c}`)) continue;
        ctx.rect(boardOffX + c * cs, boardOffY + r * cs, cs, cs);
      }
    }
    ctx.clip();
    const floodGrd = ctx.createLinearGradient(0, sy, 0, sy + sh);
    floodGrd.addColorStop(0, 'rgba(14,165,233,0.10)');
    floodGrd.addColorStop(1, 'rgba(14,165,233,0.28)');
    ctx.fillStyle = floodGrd;
    ctx.fillRect(boardOffX, sy, COLS * cs, sh);
    // Линия уровня воды — по каждому столбцу отдельно
    ctx.strokeStyle = 'rgba(125,211,252,0.5)'; ctx.lineWidth = 2; ctx.setLineDash([4,4]);
    for (let c = 0; c < COLS; c++) {
      if (state.holes.has(`${floodStart},${c}`)) continue;
      ctx.beginPath();
      ctx.moveTo(boardOffX + c * cs, sy);
      ctx.lineTo(boardOffX + (c + 1) * cs, sy);
      ctx.stroke();
    }
    ctx.setLineDash([]);
    // Анимированные пузырьки (используем время)
    const t = Date.now() / 1000;
    for (let i = 0; i < 8; i++) {
      const bx = boardOffX + ((i * 137 + 23) % COLS) * cs + cs / 2 + Math.sin(t * 1.5 + i) * (cs * 0.3);
      const progress = ((t * 0.4 + i * 0.14) % 1);
      const by = sy + sh * (1 - progress);
      const br = 2 + (i % 3) * 1.5;
      ctx.beginPath(); ctx.arc(bx, by, br, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(186,230,253,${0.3 + 0.2 * Math.sin(t + i)})`;
      ctx.fill();
    }
    ctx.restore();
  }

  // 5. Выделение
  if (selectedCell) {
    const [sr,sc]=selectedCell;
    ctx.strokeStyle='#fff'; ctx.lineWidth=3; ctx.globalAlpha=0.8;
    roundRect(ctx, boardOffX+sc*cs+2, boardOffY+sr*cs+2, cs-4, cs-4, 8);
    ctx.stroke(); ctx.globalAlpha=1;
  }
  // Подсветка первой выбранной ячейки swap-бустера
  if (state._swapFirst && state.activeIngameBooster === 'swap') {
    const [sr,sc]=state._swapFirst;
    ctx.strokeStyle='#67e8f9'; ctx.lineWidth=3.5; ctx.globalAlpha=0.9;
    roundRect(ctx, boardOffX+sc*cs+2, boardOffY+sr*cs+2, cs-4, cs-4, 8);
    ctx.stroke();
    ctx.globalAlpha=0.18; ctx.fillStyle='#67e8f9';
    roundRect(ctx, boardOffX+sc*cs+2, boardOffY+sr*cs+2, cs-4, cs-4, 8);
    ctx.fill(); ctx.globalAlpha=1;
  }

  // Path Mode overlay
  { const _pLvl = getLevel(state.currentLevel);
    if (_pLvl && _pLvl.type === 'path' && _pLvl.pathCells) {
      drawPathOverlay(_pLvl.pathCells, state.pathProgress || 0);
    }
  }

  if (_hasEntryAnim) ctx.restore();
  if (_doShake) ctx.restore();
}

// Path Mode — отрисовка дорожки поверх гемов
function drawPathOverlay(cells, progress) {
  if (!cells || !cells.length) return;
  const cs = cellSize;
  ctx.save();

  // 1. Соединяющие линии между клетками (серая линия)
  ctx.strokeStyle = 'rgba(200,200,200,0.55)';
  ctx.lineWidth = Math.max(3, cs * 0.09);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  for (let i = 0; i < cells.length; i++) {
    const [r, c] = cells[i];
    const px = boardOffX + c * cs + cs / 2;
    const py = boardOffY + r * cs + cs / 2;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.stroke();

  // 2. Пройденные клетки — зелёный полупрозрачный прямоугольник
  for (let i = 0; i < Math.min(progress, cells.length); i++) {
    const [r, c] = cells[i];
    const bx = boardOffX + c * cs, by = boardOffY + r * cs;
    ctx.fillStyle = 'rgba(34,197,94,0.35)';
    roundRect(ctx, bx + 2, by + 2, cs - 4, cs - 4, 8);
    ctx.fill();
    ctx.strokeStyle = 'rgba(34,197,94,0.7)';
    ctx.lineWidth = 2;
    roundRect(ctx, bx + 2, by + 2, cs - 4, cs - 4, 8);
    ctx.stroke();
  }

  // 3. Текущая target клетка — золотой пульсирующий контур
  if (progress < cells.length) {
    const [tr, tc] = cells[progress];
    const bx = boardOffX + tc * cs, by = boardOffY + tr * cs;
    const pulse = 0.5 + 0.5 * Math.sin(Date.now() / 300);
    ctx.strokeStyle = `rgba(255,200,0,${0.6 + 0.4 * pulse})`;
    ctx.lineWidth = 3 + pulse * 2;
    roundRect(ctx, bx + 2, by + 2, cs - 4, cs - 4, 8);
    ctx.stroke();
    // Внутренняя подсветка
    ctx.fillStyle = `rgba(255,215,0,${0.12 + 0.1 * pulse})`;
    roundRect(ctx, bx + 2, by + 2, cs - 4, cs - 4, 8);
    ctx.fill();
  }

  // 4. Персонаж 🧙 на текущей позиции
  const charIdx = Math.min(progress, cells.length - 1);
  const [cr, cc2] = cells[charIdx];
  const charX = boardOffX + cc2 * cs + cs / 2;
  const charY = boardOffY + cr * cs + cs / 2;
  ctx.font = `${Math.round(cs * 0.7)}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('🧙', charX, charY);

  ctx.restore();
}

// Бейдж с числом оставшихся слоёв блокера (цепи/янтарь) — рисуется в углу клетки.
// Делает многослойные блокеры различимыми, когда спрайт один на все слои.
function _drawLayerBadge(ctx, x, y, cs, n) {
  if (n < 2) return;
  const br = Math.max(7, cs * 0.16);            // радиус бейджа
  const bx = x + cs - br - 2, by = y + br + 2;  // верх-правый угол
  ctx.save();
  ctx.beginPath(); ctx.arc(bx, by, br, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(15,18,24,0.88)'; ctx.fill();
  ctx.lineWidth = Math.max(1, cs * 0.02); ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.stroke();
  ctx.fillStyle = '#fff';
  ctx.font = `bold ${Math.round(br * 1.25)}px Arial`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(String(n), bx, by + br * 0.05);
  ctx.restore();
}

// Рисует только фишку (с анимацией) — без фона клетки, желе и льда
function drawCellGem(r,c,cell) {
  const x=boardOffX+c*cellSize+(cell.anim?.ox||0);
  const y=boardOffY+r*cellSize+(cell.anim?.oy||0);
  const cs=cellSize, pad=4;
  ctx.save();
  ctx.globalAlpha=cell.anim?.alpha??1;
  const sc=cell.anim?.scale??1;
  const cx=x+cs/2, cy=y+cs/2;
  if (sc!==1) { ctx.translate(cx,cy); ctx.scale(sc,sc); ctx.translate(-cx,-cy); }

  if (cell.bucket) {
    if (BLOCK_SPRITES[6]) {
      ctx.drawImage(BLOCK_SPRITES[6], x+2, y+2, cs-4, cs-4);
      ctx.restore(); return;
    }
    // Ведро с камнями (flat canvas)
    const topW=cs*0.70, botW=cs*0.50;
    const topX=cx-topW/2, botX=cx-botW/2;
    const topY=y+cs*0.28, botY=y+cs*0.87;
    ctx.shadowBlur=10; ctx.shadowColor='#607d8b';
    // Тело ведра
    ctx.fillStyle='#546e7a';
    ctx.beginPath();
    ctx.moveTo(topX,topY); ctx.lineTo(topX+topW,topY);
    ctx.lineTo(botX+botW,botY); ctx.lineTo(botX,botY);
    ctx.closePath(); ctx.fill();
    // Ободок
    ctx.shadowBlur=0;
    ctx.fillStyle='#78909c';
    ctx.fillRect(topX-cs*0.035,topY-cs*0.05,topW+cs*0.07,cs*0.07);
    // Ручка
    ctx.beginPath();
    ctx.arc(cx,topY-cs*0.02,cs*0.23,Math.PI,0);
    ctx.strokeStyle='#90a4ae'; ctx.lineWidth=Math.max(2,cs*0.07); ctx.stroke();
    // Камни (с клиппингом по телу ведра)
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(topX,topY); ctx.lineTo(topX+topW,topY);
    ctx.lineTo(botX+botW,botY); ctx.lineTo(botX,botY);
    ctx.closePath(); ctx.clip();
    [[cx-cs*.17,topY+cs*.20,cs*.10,cs*.075,'#9e9e9e'],
     [cx+cs*.10,topY+cs*.26,cs*.11,cs*.08,'#757575'],
     [cx-cs*.02,topY+cs*.38,cs*.09,cs*.07,'#bdbdbd'],
     [cx+cs*.19,topY+cs*.35,cs*.08,cs*.062,'#616161'],
     [cx-cs*.18,topY+cs*.47,cs*.07,cs*.055,'#8d8d8d']].forEach(([sx,sy,rx,ry,col])=>{
      ctx.fillStyle=col; ctx.beginPath(); ctx.ellipse(sx,sy,rx,ry,0,0,Math.PI*2); ctx.fill();
    });
    ctx.restore();
    // Белый контур
    ctx.strokeStyle='rgba(255,255,255,0.28)'; ctx.lineWidth=1.5;
    ctx.beginPath();
    ctx.moveTo(topX,topY); ctx.lineTo(topX+topW,topY);
    ctx.lineTo(botX+botW,botY); ctx.lineTo(botX,botY);
    ctx.closePath(); ctx.stroke();
    // Блик
    ctx.fillStyle='rgba(255,255,255,0.20)';
    ctx.beginPath(); ctx.ellipse(topX+topW*0.22,topY+cs*0.07,topW*0.15,cs*0.04,-0.3,0,Math.PI*2); ctx.fill();
    // Золотая рамка
    ctx.strokeStyle='rgba(255,185,10,0.9)'; ctx.lineWidth=2.5;
    roundRect(ctx,x+2,y+2,cs-4,cs-4,10); ctx.stroke();
  } else if (cell.lava) {
    // ТЁМНЫЙ ШОКОЛАД — плитка с насечками
    ctx.fillStyle='#2a1004'; roundRect(ctx,x+2,y+2,cs-4,cs-4,8); ctx.fill();
    ctx.save(); roundRect(ctx,x+2,y+2,cs-4,cs-4,8); ctx.clip();
    ctx.strokeStyle='rgba(55,20,6,0.75)'; ctx.lineWidth=1.2;
    for (let gi=1;gi<4;gi++) {
      ctx.beginPath(); ctx.moveTo(x+cs*gi/4,y+4); ctx.lineTo(x+cs*gi/4,y+cs-4); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x+4,y+cs*gi/4); ctx.lineTo(x+cs-4,y+cs*gi/4); ctx.stroke();
    }
    ctx.restore();
    ctx.shadowBlur=8; ctx.shadowColor='rgba(180,80,10,0.45)';
    ctx.strokeStyle='rgba(100,40,10,0.85)'; ctx.lineWidth=2;
    roundRect(ctx,x+2,y+2,cs-4,cs-4,8); ctx.stroke();
    ctx.shadowBlur=0;
  } else if (cell.mycelium > 0) {
    const _wl = cell.mycelium;
    // Cream/white base
    ctx.fillStyle = _wl >= 2 ? '#f0e0c0' : '#faf4e8';
    roundRect(ctx, x+2, y+2, cs-4, cs-4, 8); ctx.fill();
    // Crosshatch grid pattern (lava block texture)
    ctx.save();
    roundRect(ctx, x+2, y+2, cs-4, cs-4, 8); ctx.clip();
    ctx.strokeStyle = _wl >= 2 ? '#d4b47c' : '#e8d0a8';
    ctx.lineWidth = 1;
    for (let gi = 1; gi < 5; gi++) {
      ctx.beginPath(); ctx.moveTo(x + cs*gi/5, y+2); ctx.lineTo(x + cs*gi/5, y+cs-2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x+2, y + cs*gi/5); ctx.lineTo(x+cs-2, y + cs*gi/5); ctx.stroke();
    }
    ctx.restore();
    // Outer border with warm glow
    ctx.shadowBlur = 5; ctx.shadowColor = '#ffe4b0';
    ctx.strokeStyle = _wl >= 2 ? '#c8903c' : '#dca850'; ctx.lineWidth = 2;
    roundRect(ctx, x+2, y+2, cs-4, cs-4, 8); ctx.stroke();
    ctx.shadowBlur = 0;
    // Layer badge (only show for 2 layers)
    if (_wl >= 2) {
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.beginPath(); ctx.arc(x+cs-cs*0.19, y+cs*0.19, cs*0.155, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#fff8e0';
      ctx.font = `bold ${Math.round(cs*0.20)}px Arial`; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText('2', x+cs-cs*0.19, y+cs*0.19);
    }
    ctx.restore(); return;
  } else if (cell.mystery) {
    if (BLOCK_SPRITES[13]) {
      ctx.drawImage(BLOCK_SPRITES[13], x+2, y+2, cs-4, cs-4);
      ctx.restore(); return;
    }
    // Мистический контейнер — тёмно-фиолетовый с блеском и ❓
    ctx.fillStyle='#2e1065'; roundRect(ctx,x+2,y+2,cs-4,cs-4,10); ctx.fill();
    const mystGrd=ctx.createRadialGradient(cx-cs*.2,cy-cs*.22,2,cx,cy,cs*.52);
    mystGrd.addColorStop(0,'rgba(168,85,247,0.55)');
    mystGrd.addColorStop(1,'rgba(88,28,135,0)');
    ctx.fillStyle=mystGrd; roundRect(ctx,x+2,y+2,cs-4,cs-4,10); ctx.fill();
    ctx.strokeStyle='rgba(192,132,252,0.8)'; ctx.lineWidth=2;
    roundRect(ctx,x+2,y+2,cs-4,cs-4,10); ctx.stroke();
    ctx.font=`${cs*.48}px Arial`; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText('❓',cx,cy);
  } else if (cell.flask) {
    // Колба: спрайт, окрашенный в цвет гема через source-atop
    if (BLOCK_SPRITES[12]) {
      ctx.globalAlpha = (cell.anim?.alpha ?? 1) * 0.92;
      const _cb = _getColoredBottle(cell.type);
      ctx.drawImage(_cb || BLOCK_SPRITES[12], x, y, cs, cs);
      ctx.globalAlpha = cell.anim?.alpha ?? 1;
    } else {
      ctx.globalAlpha = 0.82;
      ctx.font = `${cs * 0.42}px Arial`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = GEMS[cell.type]?.color || '#fff';
      ctx.fillText('🍶', cx, cy);
      ctx.globalAlpha = 1;
    }
  } else if (cell.stone) {
    if (BLOCK_SPRITES[0]) {
      ctx.drawImage(BLOCK_SPRITES[0], x+2, y+2, cs-4, cs-4);
      ctx.restore(); return;
    }
    // КАМЕННАЯ ГЛЫБА — тёмный камень с выпуклостями
    ctx.save();
    roundRect(ctx,x+pad,y+pad,cs-pad*2,cs-pad*2,10); ctx.clip();
    // Основа
    const sgrd=ctx.createLinearGradient(cx-cs*0.3,cy-cs*0.4,cx+cs*0.2,cy+cs*0.4);
    sgrd.addColorStop(0,'#6a5c48'); sgrd.addColorStop(0.45,'#4e4234'); sgrd.addColorStop(1,'#2e2418');
    ctx.fillStyle=sgrd;
    roundRect(ctx,x+pad,y+pad,cs-pad*2,cs-pad*2,10); ctx.fill();
    // Выпуклости-бугорки (текстура камня)
    const bumps=[[0.28,0.30,0.22],[0.62,0.24,0.18],[0.45,0.58,0.26],[0.72,0.62,0.16],[0.18,0.65,0.14]];
    bumps.forEach(([bx2,by2,br2])=>{
      const bxp=x+pad+bx2*(cs-pad*2), byp=y+pad+by2*(cs-pad*2), brp=br2*(cs-pad*2);
      const bg=ctx.createRadialGradient(bxp-brp*0.3,byp-brp*0.3,brp*0.1,bxp,byp,brp);
      bg.addColorStop(0,'rgba(130,110,80,0.55)'); bg.addColorStop(1,'rgba(30,20,10,0)');
      ctx.fillStyle=bg; ctx.beginPath(); ctx.arc(bxp,byp,brp,0,Math.PI*2); ctx.fill();
    });
    // Трещина по диагонали
    ctx.strokeStyle='rgba(20,14,6,0.55)'; ctx.lineWidth=Math.max(1,cs*0.025); ctx.lineCap='round';
    ctx.beginPath(); ctx.moveTo(x+cs*0.28,y+cs*0.20); ctx.lineTo(x+cs*0.55,y+cs*0.52); ctx.lineTo(x+cs*0.78,y+cs*0.68); ctx.stroke();
    // Светлый блик (верхний левый)
    ctx.fillStyle='rgba(200,175,140,0.22)';
    ctx.beginPath(); ctx.ellipse(x+cs*0.30,y+cs*0.28,cs*0.22,cs*0.14,-Math.PI/5,0,Math.PI*2); ctx.fill();
    ctx.restore();
    // Тонкая рамка
    ctx.strokeStyle='rgba(30,20,10,0.55)'; ctx.lineWidth=Math.max(1.5,cs*0.030);
    roundRect(ctx,x+pad,y+pad,cs-pad*2,cs-pad*2,10); ctx.stroke();
  } else {
    const gem=GEMS[cell.type];
    // RAINBOW/COLORING are colorless — they don't rely on a gem shape
    // Клетки с покрытием (янтарь/геода/реликвия) рисуются ниже даже без гема
    const _hasCover = cell.amber>0 || cell.geode>0 || cell._bearOpened || cell._memOpen;
    if (!gem && cell.special!==SPECIAL.RAINBOW && cell.special!==SPECIAL.COLORING && !_hasCover) { ctx.restore(); return; }

    // ─── ТЕКСТУР-ПАК ──────────────────────────────────────────────────
    let _drawnByTP=false, _indicatorStillNeeded=false;
    { const _spc=cell.special, _ct=cell.type; let _tpImg=null;
      if (!_spc||_spc===SPECIAL.NONE)      _tpImg=TEXTURE_PACK.sprites.gem[_ct];
      else if (_spc===SPECIAL.STRIPE_H)    _tpImg=TEXTURE_PACK.sprites.stripe_h[_ct];
      else if (_spc===SPECIAL.STRIPE_V)    _tpImg=TEXTURE_PACK.sprites.stripe_v[_ct];
      else if (_spc===SPECIAL.BOMB)        { _tpImg=TEXTURE_PACK.sprites.bomb[_ct]; if(!(_tpImg instanceof HTMLImageElement)){_tpImg=TEXTURE_PACK.sprites.gem[_ct];_indicatorStillNeeded=true;} }
      else if (_spc===SPECIAL.ROCKET)      { _tpImg=TEXTURE_PACK.sprites.rocket[_ct]; if(!(_tpImg instanceof HTMLImageElement)){_tpImg=TEXTURE_PACK.sprites.gem[_ct];_indicatorStillNeeded=true;} }
      else if (_spc===SPECIAL.COLORING)    { _tpImg=TEXTURE_PACK.sprites.coloring[_ct]; if(!(_tpImg instanceof HTMLImageElement)){_tpImg=TEXTURE_PACK.sprites.gem[_ct];_indicatorStillNeeded=true;} }
      else if (_spc===SPECIAL.RAINBOW)     _tpImg=TEXTURE_PACK.sprites.rainbow;

      if (_tpImg instanceof HTMLImageElement) {
        const sz=cs-4, iw=_tpImg.naturalWidth||sz, ih=_tpImg.naturalHeight||sz;
        const sc=Math.min(sz/iw, sz/ih);
        const dw=iw*sc, dh=ih*sc;
        ctx.drawImage(_tpImg, x+2+(sz-dw)/2, y+2+(sz-dh)/2, dw, dh);
        _drawnByTP=true;
      }
    }

    // ─── RAINBOW → ГЕОСКАНЕР — радарный экран ────────────────────────
    if (!_drawnByTP && cell.special===SPECIAL.RAINBOW) {
      const r2 = cs/2-pad+2;
      const t = Date.now()/600;
      // Тёмный экран радара
      ctx.fillStyle = '#001a0a';
      ctx.beginPath(); ctx.arc(cx, cy, r2, 0, Math.PI*2); ctx.fill();
      // Зелёное свечение фона
      const rdg = ctx.createRadialGradient(cx, cy, 0, cx, cy, r2);
      rdg.addColorStop(0, 'rgba(0,255,128,0.15)');
      rdg.addColorStop(1, 'rgba(0,80,40,0)');
      ctx.fillStyle = rdg;
      ctx.beginPath(); ctx.arc(cx, cy, r2, 0, Math.PI*2); ctx.fill();
      ctx.save();
      ctx.beginPath(); ctx.arc(cx, cy, r2*0.93, 0, Math.PI*2); ctx.clip();
      // Концентрические кольца радара
      for (let i=1; i<=3; i++) {
        ctx.strokeStyle = `rgba(0,255,128,${0.18+0.06*(3-i)})`;
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(cx, cy, r2*0.28*i, 0, Math.PI*2); ctx.stroke();
      }
      // Перекрестие
      ctx.strokeStyle = 'rgba(0,255,128,0.30)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx-r2*0.88, cy); ctx.lineTo(cx+r2*0.88, cy);
      ctx.moveTo(cx, cy-r2*0.88); ctx.lineTo(cx, cy+r2*0.88);
      ctx.stroke();
      // Вращающийся луч развёртки
      const sweepAngle = t * 2.5;
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(sweepAngle);
      const sg = ctx.createLinearGradient(0, 0, r2*0.90, 0);
      sg.addColorStop(0, 'rgba(0,255,128,0.55)');
      sg.addColorStop(0.55, 'rgba(0,255,128,0.18)');
      sg.addColorStop(1, 'rgba(0,255,128,0)');
      ctx.fillStyle = sg;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, r2*0.90, -0.22, 0.22);
      ctx.closePath(); ctx.fill();
      // След луча (затухание)
      for (let i=1; i<=3; i++) {
        ctx.save(); ctx.rotate(-i * 0.20);
        const tg = ctx.createLinearGradient(0, 0, r2*0.90, 0);
        tg.addColorStop(0, `rgba(0,255,128,${0.18-i*0.05})`);
        tg.addColorStop(1, 'rgba(0,255,128,0)');
        ctx.fillStyle = tg;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, r2*0.90, -0.12, 0.12);
        ctx.closePath(); ctx.fill();
        ctx.restore();
      }
      ctx.restore();
      ctx.restore();
      // Яркая точка в центре
      ctx.fillStyle = 'rgba(0,255,128,0.90)';
      ctx.beginPath(); ctx.arc(cx, cy, r2*0.08, 0, Math.PI*2); ctx.fill();
      // Кант
      ctx.strokeStyle = 'rgba(0,255,128,0.75)';
      ctx.lineWidth = Math.max(1.5, cs*0.030);
      ctx.beginPath(); ctx.arc(cx, cy, r2, 0, Math.PI*2); ctx.stroke();
      ctx.restore(); return;
    }

    // ─── COLORING без цвета — радужные сектора (перекрашивает) ────────────
    if (!_drawnByTP && cell.special===SPECIAL.COLORING && !gem) {
      const r2=cs/2-pad+2;
      const rcolors = ['#ff3d6e','#ff8a3a','#ffcb3a','#34d96f','#3aa8ff','#b96bff'];
      // Тёмный диск
      const rg = ctx.createRadialGradient(cx, cy-r2*0.25, r2*0.1, cx, cy, r2);
      rg.addColorStop(0, '#3a2a4a');
      rg.addColorStop(1, '#0a0414');
      ctx.fillStyle = rg;
      ctx.beginPath(); ctx.arc(cx, cy, r2, 0, Math.PI*2); ctx.fill();
      // Радужные сектора как палитра
      const t = Date.now()/700;
      ctx.save();
      ctx.beginPath(); ctx.arc(cx, cy, r2*0.78, 0, Math.PI*2); ctx.clip();
      for (let i=0;i<6;i++) {
        const a0 = (i/6)*Math.PI*2 + t*0.3;
        const a1 = ((i+1)/6)*Math.PI*2 + t*0.3;
        ctx.fillStyle = rcolors[i];
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, r2*0.78, a0, a1);
        ctx.closePath(); ctx.fill();
      }
      ctx.restore();
      // Кисточка в центре (белая «+»)
      ctx.fillStyle = '#fff';
      ctx.fillRect(cx-r2*0.06, cy-r2*0.28, r2*0.12, r2*0.56);
      ctx.fillRect(cx-r2*0.28, cy-r2*0.06, r2*0.56, r2*0.12);
      // Кант
      ctx.strokeStyle = 'rgba(255,255,255,0.5)';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(cx, cy, r2, 0, Math.PI*2); ctx.stroke();
      ctx.restore(); return;
    }

    // ─── ОБЫЧНЫЕ + спец-фишки на базе геометрии ───────────────
    // Сначала рисуем саму фишку (если есть гем — у клеток-реликвий его нет)
    if (!_drawnByTP && gem) drawShape(ctx, gem.shape, getSkinColor(cell.type), x+pad, y+pad, cs-pad*2, cell.type);

    // Поверх рисуем индикатор спец-типа — векторный, без emoji
    const spc = cell.special;
    if ((spc !== SPECIAL.NONE && spc !== SPECIAL.COLORING) && (!_drawnByTP || _indicatorStillNeeded)) {
      const t = Date.now()/700;
      const pulse = 0.7 + 0.30 * Math.sin(t + cell.type);
      ctx.save();

      // STRIPE → КРИСТАЛЬНЫЕ ОСКОЛКИ — 3 парящих кристалла в цвет гема
      if (spc === SPECIAL.STRIPE_H || spc === SPECIAL.STRIPE_V) {
        const horz = spc === SPECIAL.STRIPE_H;
        const gemCol = getSkinColor(cell.type);
        const gcLight = blendColor(gemCol, 255, 0.52);
        const gcDark  = blendColor(gemCol, 0,   0.42);
        ctx.save();
        const shardDefs = horz
          ? [[x+cs*0.22, y+cs*0.20, cs*0.120, -0.48], [x+cs*0.50, y+cs*0.16, cs*0.098, 0.18], [x+cs*0.78, y+cs*0.22, cs*0.108, -0.22]]
          : [[x+cs*0.20, y+cs*0.22, cs*0.108, 0.28],  [x+cs*0.16, y+cs*0.50, cs*0.098, -0.12], [x+cs*0.22, y+cs*0.78, cs*0.120, 0.42]];
        shardDefs.forEach(([sx, sy, sr, srot]) => {
          ctx.save();
          ctx.translate(sx, sy);
          ctx.rotate(srot);
          ctx.shadowColor = gemCol; ctx.shadowBlur = sr * 1.5;
          const sh = sr * 1.85, sw = sr * 1.10;
          const sg = ctx.createLinearGradient(-sw*0.45, -sh*0.52, sw*0.45, sh*0.52);
          sg.addColorStop(0,    gcLight);
          sg.addColorStop(0.38, gemCol);
          sg.addColorStop(0.78, gcDark);
          sg.addColorStop(1,    blendColor(gemCol, 0, 0.68));
          ctx.beginPath();
          ctx.moveTo(0, -sh*0.52);
          ctx.lineTo(sw*0.48, sh*0.42);
          ctx.lineTo(-sw*0.48, sh*0.42);
          ctx.closePath();
          ctx.fillStyle = sg; ctx.fill();
          ctx.strokeStyle = 'rgba(255,255,255,0.52)';
          ctx.lineWidth = Math.max(0.8, sr*0.10);
          ctx.beginPath(); ctx.moveTo(-sw*0.12, -sh*0.30); ctx.lineTo(sw*0.20, sh*0.20); ctx.stroke();
          ctx.strokeStyle = 'rgba(255,255,255,0.28)';
          ctx.lineWidth = Math.max(0.8, sr*0.07); ctx.lineJoin = 'round';
          ctx.beginPath();
          ctx.moveTo(0, -sh*0.52); ctx.lineTo(sw*0.48, sh*0.42); ctx.lineTo(-sw*0.48, sh*0.42); ctx.closePath();
          ctx.stroke();
          ctx.restore();
        });
        ctx.shadowBlur = 0;
        const arx = x+cs*0.78, ary = y+cs*0.78, arr = cs*0.092;
        ctx.globalAlpha = 0.90 * pulse;
        ctx.strokeStyle = `rgba(255,218,60,0.92)`;
        ctx.lineWidth = Math.max(1.2, cs*0.028); ctx.lineCap='round'; ctx.lineJoin='round';
        ctx.beginPath();
        if (horz) {
          ctx.moveTo(arx-arr*1.1,ary); ctx.lineTo(arx+arr*1.1,ary);
          ctx.moveTo(arx-arr*0.4,ary-arr*0.65); ctx.lineTo(arx-arr*1.1,ary); ctx.lineTo(arx-arr*0.4,ary+arr*0.65);
          ctx.moveTo(arx+arr*0.4,ary-arr*0.65); ctx.lineTo(arx+arr*1.1,ary); ctx.lineTo(arx+arr*0.4,ary+arr*0.65);
        } else {
          ctx.moveTo(arx,ary-arr*1.1); ctx.lineTo(arx,ary+arr*1.1);
          ctx.moveTo(arx-arr*0.65,ary-arr*0.4); ctx.lineTo(arx,ary-arr*1.1); ctx.lineTo(arx+arr*0.65,ary-arr*0.4);
          ctx.moveTo(arx-arr*0.65,ary+arr*0.4); ctx.lineTo(arx,ary+arr*1.1); ctx.lineTo(arx+arr*0.65,ary+arr*0.4);
        }
        ctx.stroke();
        ctx.restore();
      }
      // BOMB → ДИНАМИТ — красный цилиндр с надписью TNT и фитилём
      else if (spc === SPECIAL.BOMB) {
        const bx = x + cs * 0.26, by = y + cs * 0.72;
        const rr = cs * 0.17;
        const cylW = rr * 1.12, cylH = rr * 2.0;
        ctx.save();
        ctx.shadowColor = '#cc1010'; ctx.shadowBlur = 8*pulse;
        // Свечение
        ctx.fillStyle = `rgba(220,50,20,${0.35*pulse+0.12})`;
        ctx.beginPath(); ctx.arc(bx, by, rr*2.0, 0, Math.PI*2); ctx.fill();
        // Цилиндр динамита
        ctx.fillStyle = `rgb(${180+Math.round(35*pulse)},18,18)`;
        roundRect(ctx, bx-cylW/2, by-cylH/2, cylW, cylH, cylW*0.26);
        ctx.fill();
        // Металлический блик
        const cg = ctx.createLinearGradient(bx-cylW/2, 0, bx+cylW/2, 0);
        cg.addColorStop(0, 'rgba(0,0,0,0)');
        cg.addColorStop(0.28, 'rgba(255,255,255,0.24)');
        cg.addColorStop(0.55, 'rgba(255,255,255,0.09)');
        cg.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = cg;
        roundRect(ctx, bx-cylW/2, by-cylH/2, cylW, cylH, cylW*0.26); ctx.fill();
        // Чёрные обмотки
        ctx.fillStyle = 'rgba(0,0,0,0.65)';
        ctx.fillRect(bx-cylW/2+1, by-cylH*0.18, cylW-2, Math.max(2, cylH*0.13));
        ctx.fillRect(bx-cylW/2+1, by+cylH*0.06, cylW-2, Math.max(2, cylH*0.11));
        // Надпись TNT
        ctx.shadowBlur = 0;
        ctx.fillStyle = 'rgba(255,235,50,0.95)';
        ctx.font = `bold ${Math.max(5, Math.round(cylH*0.22))}px Arial`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('TNT', bx, by+1);
        // Контур
        ctx.strokeStyle = 'rgba(80,0,0,0.62)'; ctx.lineWidth = Math.max(1, cs*0.020);
        roundRect(ctx, bx-cylW/2, by-cylH/2, cylW, cylH, cylW*0.26); ctx.stroke();
        // Фитиль (волнистый)
        const fuseT = Date.now()/500;
        ctx.shadowColor = '#ff9030'; ctx.shadowBlur = 4*pulse;
        ctx.strokeStyle = '#a06020'; ctx.lineWidth = Math.max(1, cs*0.024); ctx.lineCap='round';
        ctx.beginPath();
        ctx.moveTo(bx, by-cylH/2);
        ctx.bezierCurveTo(
          bx + cs*0.07*Math.sin(fuseT),     by-cylH/2-rr*0.45,
          bx - cs*0.07*Math.sin(fuseT+1.1), by-cylH/2-rr*0.90,
          bx + cs*0.04*Math.sin(fuseT+2.2), by-cylH/2-rr*1.38
        );
        ctx.stroke();
        // Огонёк на конце фитиля
        const fx2 = bx + cs*0.04*Math.sin(fuseT+2.2), fy2 = by-cylH/2-rr*1.38;
        ctx.shadowColor='#ff6010'; ctx.shadowBlur = 6*pulse;
        ctx.fillStyle = `rgba(255,${120+Math.round(90*pulse)},10,${0.88*pulse+0.08})`;
        ctx.beginPath(); ctx.arc(fx2, fy2, Math.max(1.5, cs*0.040*pulse), 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = `rgba(255,255,180,${0.72*pulse})`;
        ctx.beginPath(); ctx.arc(fx2, fy2, Math.max(1, cs*0.020*pulse), 0, Math.PI*2); ctx.fill();
        // Двойное кольцо взрыва
        ctx.shadowBlur = 0;
        ctx.strokeStyle = `rgba(255,80,20,${0.72*pulse})`;
        ctx.lineWidth = 1.3;
        ctx.beginPath(); ctx.arc(bx, by, rr*1.50, 0, Math.PI*2); ctx.stroke();
        ctx.strokeStyle = `rgba(255,160,60,${0.40*pulse})`;
        ctx.beginPath(); ctx.arc(bx, by, rr*1.88, 0, Math.PI*2); ctx.stroke();
        ctx.restore();
      }
      // ROCKET → РАКЕТА — аэродинамический снаряд в правом верхнем углу
      else if (spc === SPECIAL.ROCKET) {
        const rx = x + cs * 0.80, ry = y + cs * 0.22;
        const rs = cs * 0.165;
        ctx.save();
        ctx.translate(rx, ry);
        ctx.rotate(-Math.PI * 0.22);
        ctx.shadowColor = '#ff7030'; ctx.shadowBlur = rs*2.0*pulse;
        const bW = rs*0.50, bH = rs*1.95;
        // Корпус ракеты
        const rktGrd = ctx.createLinearGradient(-bW/2, 0, bW/2, 0);
        rktGrd.addColorStop(0, '#484858');
        rktGrd.addColorStop(0.28, '#d2d2e5');
        rktGrd.addColorStop(0.68, '#8888a0');
        rktGrd.addColorStop(1, '#303040');
        ctx.fillStyle = rktGrd;
        roundRect(ctx, -bW/2, -bH/2, bW, bH, bW*0.28); ctx.fill();
        // Носовой конус
        const coneG = ctx.createLinearGradient(-bW/2, -bH/2, bW/2, -bH/2);
        coneG.addColorStop(0, '#585868'); coneG.addColorStop(0.35, '#e2e2f2'); coneG.addColorStop(1, '#383848');
        ctx.fillStyle = coneG;
        ctx.beginPath();
        ctx.moveTo(0, -bH/2 - rs*0.68);
        ctx.lineTo(bW*0.50, -bH/2);
        ctx.lineTo(-bW*0.50, -bH/2);
        ctx.closePath(); ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.28)'; ctx.lineWidth = Math.max(0.8, rs*0.06); ctx.stroke();
        // Стабилизаторы-фины
        ctx.fillStyle = '#707080';
        ctx.beginPath(); ctx.moveTo(-bW*0.50, bH*0.36); ctx.lineTo(-bW*0.50-rs*0.42, bH*0.50+rs*0.14); ctx.lineTo(-bW*0.50, bH*0.50); ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.moveTo(bW*0.50, bH*0.36); ctx.lineTo(bW*0.50+rs*0.42, bH*0.50+rs*0.14); ctx.lineTo(bW*0.50, bH*0.50); ctx.closePath(); ctx.fill();
        // Двигатель
        ctx.fillStyle = '#222230';
        roundRect(ctx, -bW*0.38, bH*0.36, bW*0.76, bH*0.16, bW*0.12); ctx.fill();
        // Факел двигателя
        const fuseT3 = Date.now()/400;
        ctx.shadowColor = '#ff5500'; ctx.shadowBlur = rs*2.8*pulse;
        ctx.fillStyle = `rgba(255,${Math.round(95+85*pulse)},20,${0.82*pulse+0.14})`;
        ctx.beginPath();
        ctx.moveTo(-bW*0.30, bH*0.50);
        ctx.bezierCurveTo(-bW*0.18, bH*0.50+rs*(0.52+0.26*Math.sin(fuseT3)), bW*0.18, bH*0.50+rs*(0.52+0.26*Math.sin(fuseT3+1.3)), bW*0.30, bH*0.50);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = `rgba(255,235,100,${0.78*pulse})`;
        ctx.beginPath();
        ctx.moveTo(-bW*0.14, bH*0.50);
        ctx.bezierCurveTo(-bW*0.07, bH*0.50+rs*(0.26+0.14*Math.sin(fuseT3+0.8)), bW*0.07, bH*0.50+rs*(0.26+0.14*Math.sin(fuseT3+2.1)), bW*0.14, bH*0.50);
        ctx.closePath(); ctx.fill();
        // Контур корпуса
        ctx.shadowBlur = 0;
        ctx.strokeStyle = 'rgba(255,255,255,0.20)'; ctx.lineWidth = Math.max(0.8, rs*0.06);
        roundRect(ctx, -bW/2, -bH/2, bW, bH, bW*0.28); ctx.stroke();
        ctx.restore();
      }

      ctx.restore();
    }

    // COLORING с цветом — цветная бочка OIL в углу (перекраска)
    if (cell.special===SPECIAL.COLORING && gem && (!_drawnByTP || _indicatorStillNeeded)) {
      const gc = getSkinColor(cell.type);
      const bx2 = x + cs*0.74, by2 = y + cs*0.74;
      const bW = cs*0.24, bH = cs*0.28;
      ctx.save();
      ctx.globalAlpha = (cell.anim?.alpha ?? 1);
      ctx.shadowColor = gc; ctx.shadowBlur = 6;
      const og = ctx.createLinearGradient(bx2-bW/2, 0, bx2+bW/2, 0);
      og.addColorStop(0,    blendColor(gc, 0, 0.38));
      og.addColorStop(0.28, blendColor(gc, 255, 0.18));
      og.addColorStop(0.62, gc);
      og.addColorStop(1,    blendColor(gc, 0, 0.48));
      ctx.fillStyle = og;
      roundRect(ctx, bx2-bW/2, by2-bH/2, bW, bH, bW*0.22); ctx.fill();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = blendColor(gc, 0, 0.55); ctx.lineWidth = Math.max(1, bH*0.10); ctx.lineCap='square';
      [by2-bH*0.28, by2, by2+bH*0.28].forEach(hy => {
        ctx.beginPath(); ctx.moveTo(bx2-bW/2+1.5, hy); ctx.lineTo(bx2+bW/2-1.5, hy); ctx.stroke();
      });
      ctx.fillStyle = 'rgba(255,255,255,0.94)';
      ctx.strokeStyle = blendColor(gc, 0, 0.62); ctx.lineWidth = Math.max(0.8, bH*0.06);
      ctx.font = `bold ${Math.max(5, Math.round(bH*0.25))}px Arial`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.strokeText('OIL', bx2, by2+0.5); ctx.fillText('OIL', bx2, by2+0.5);
      ctx.fillStyle = blendColor(gc, 255, 0.08);
      ctx.beginPath(); ctx.ellipse(bx2, by2-bH/2, bW/2-1.5, bH*0.11, 0, 0, Math.PI*2); ctx.fill();
      ctx.strokeStyle = blendColor(gc, 255, 0.30); ctx.lineWidth = Math.max(0.8, bW*0.05);
      roundRect(ctx, bx2-bW/2, by2-bH/2, bW, bH, bW*0.22); ctx.stroke();
      ctx.restore(); ctx.globalAlpha=cell.anim?.alpha??1;
    }
  }
  // ВАРЕНЬЕ / MARMALADE — красно-фиолетовый желеобразный оверлей
  if (cell.web) {
    ctx.save();
    ctx.globalAlpha = (cell.anim?.alpha ?? 1) * 0.85;
    const _jGrd = ctx.createRadialGradient(cx, cy, cs*0.06, cx, cy, cs*0.54);
    _jGrd.addColorStop(0,  'rgba(210,30,55,0.80)');
    _jGrd.addColorStop(0.6,'rgba(155,10,35,0.72)');
    _jGrd.addColorStop(1,  'rgba(100,4,20,0.50)');
    roundRect(ctx,x+1,y+1,cs-2,cs-2,10); ctx.fillStyle=_jGrd; ctx.fill();
    ctx.strokeStyle='rgba(240,50,80,0.40)'; ctx.lineWidth=1.4;
    for (let _ji=0;_ji<3;_ji++) {
      const _bx=x+cs*(0.22+_ji*0.28);
      ctx.beginPath(); ctx.moveTo(_bx,y+4); ctx.quadraticCurveTo(_bx+cs*0.04,y+cs*0.5,_bx-cs*0.03,y+cs-4); ctx.stroke();
    }
    ctx.strokeStyle='rgba(255,55,90,0.60)'; ctx.lineWidth=2;
    roundRect(ctx,x+1,y+1,cs-2,cs-2,10); ctx.stroke();
    ctx.restore();
  }
  // ЖЕЛЕЗНАЯ СКОБА — стальные зажимы поверх гема
  if (cell.locked) {
    if (BLOCK_SPRITES[7]) {
      ctx.drawImage(BLOCK_SPRITES[7], x, y, cs, cs);
    } else {
      ctx.fillStyle='rgba(20,20,28,0.38)';
      roundRect(ctx,x+2,y+2,cs-4,cs-4,8); ctx.fill();
      const barH=Math.max(3,cs*0.072), barGap=cs*0.20;
      const barsY=[cy-barGap, cy, cy+barGap];
      barsY.forEach(by2=>{
        ctx.fillStyle='rgba(0,0,0,0.45)';
        roundRect(ctx,x+cs*0.10+1,by2-barH/2+1,cs*0.80,barH,barH/2); ctx.fill();
        const mg=ctx.createLinearGradient(0,by2-barH/2,0,by2+barH/2);
        mg.addColorStop(0,'#a0a8b0'); mg.addColorStop(0.4,'#d8dce0'); mg.addColorStop(1,'#606870');
        ctx.fillStyle=mg;
        roundRect(ctx,x+cs*0.10,by2-barH/2,cs*0.80,barH,barH/2); ctx.fill();
        [[x+cs*0.16,by2],[x+cs*0.84,by2]].forEach(([rx2,ry2])=>{
          ctx.fillStyle='#d0d4d8';
          ctx.beginPath(); ctx.arc(rx2,ry2,Math.max(2,cs*0.046),0,Math.PI*2); ctx.fill();
          ctx.strokeStyle='rgba(40,48,56,0.6)'; ctx.lineWidth=1;
          ctx.beginPath(); ctx.arc(rx2,ry2,Math.max(2,cs*0.046),0,Math.PI*2); ctx.stroke();
        });
      });
      ctx.fillStyle='rgba(200,210,220,0.88)';
      ctx.font=`${cs*.26}px Arial`; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText('⚙',cx,cy+1);
    }
  }
  // МИНЕРАЛЬНЫЕ ПРОЖИЛКИ — концентрические каменные обручи
  if (cell.sand > 0) {
    const n = cell.sand;
    // sand x1→vine_branch(14), x2→vine_cross(15), x3→vine_cross2(16)
    const _licS = BLOCK_SPRITES[13 + Math.min(n, 3)];
    if (_licS) {
      ctx.drawImage(_licS, x, y, cs, cs);
    } else {
      ctx.fillStyle=`rgba(38,28,16,${0.22+n*0.07})`;
      roundRect(ctx,x+2,y+2,cs-4,cs-4,8); ctx.fill();
      for (let i=0;i<n;i++) {
        const shrink=2+i*3.2;
        const lw=Math.max(2,cs*0.045);
        const br=42+i*8, bg2=32+i*6;
        ctx.strokeStyle=`rgba(${br},${bg2},16,${0.88-i*0.08})`;
        ctx.lineWidth=lw; ctx.lineCap='round';
        ctx.beginPath();
        ctx.ellipse(cx,cy,cs/2-shrink-lw,cs/2-shrink-lw*0.62,0,0,Math.PI*2);
        ctx.stroke();
        ctx.strokeStyle=`rgba(140,110,60,${0.28-i*0.04})`;
        ctx.lineWidth=Math.max(1,lw*0.35);
        ctx.beginPath();
        ctx.ellipse(cx,cy,cs/2-shrink-lw,cs/2-shrink-lw*0.62,0,Math.PI*1.1,Math.PI*1.9);
        ctx.stroke();
      }
      ctx.font=`bold ${cs*.18}px Arial`; ctx.textAlign='left'; ctx.textBaseline='top';
      ctx.fillStyle='rgba(180,145,70,0.88)'; ctx.fillText(`×${n}`,x+4,y+3);
    }
  }
  // ЦЕПИ — металлические цепи поверх гема (chain blocker, снимается матчем рядом)
  if (cell.chain > 0) {
    const n = cell.chain;
    const _chainS = BLOCK_SPRITES[16 + Math.min(n, 3)];
    if (_chainS) {
      ctx.drawImage(_chainS, x, y, cs, cs);
      _drawLayerBadge(ctx, x, y, cs, n);  // различаем слои (в т.ч. 4-й = спрайт 3-го)
    } else {
      ctx.save();
      ctx.fillStyle = `rgba(30,30,35,${0.30+n*0.08})`; roundRect(ctx,x+2,y+2,cs-4,cs-4,8); ctx.fill();
      const lw = Math.max(2, cs*0.055);
      const chainColor = `rgba(130,140,150,${0.85-n*0.06})`;
      ctx.strokeStyle = chainColor; ctx.lineWidth = lw; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(x+cs*0.10, cy); ctx.lineTo(x+cs*0.90, cy); ctx.stroke();
      if (n >= 2) { ctx.beginPath(); ctx.moveTo(cx, y+cs*0.10); ctx.lineTo(cx, y+cs*0.90); ctx.stroke(); }
      const linkR = Math.max(2, cs*0.09);
      ctx.strokeStyle = `rgba(180,195,205,0.80)`; ctx.lineWidth = Math.max(1.5, cs*0.035);
      for (let i = 0; i < Math.min(n+1, 3); i++) {
        const lx = x + cs*(0.22 + i*0.28), ly = cy;
        ctx.beginPath(); ctx.ellipse(lx, ly, linkR, linkR*0.55, 0, 0, Math.PI*2); ctx.stroke();
      }
      ctx.strokeStyle = 'rgba(50,55,60,0.65)'; ctx.lineWidth = 2;
      roundRect(ctx,x+2,y+2,cs-4,cs-4,8); ctx.stroke();
      ctx.font = `bold ${cs*.18}px Arial`; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
      ctx.fillStyle = 'rgba(180,195,205,0.88)'; ctx.fillText(`×${n}`, x+4, y+3);
      ctx.restore();
    }
  }
  // ГЕОДА — слоёный камень, превращается в гем (1-5 слоёв)
  if (cell.geode > 0) {
    const _geoS = SPR['geode_' + Math.min(5, cell.geode)];
    if (_geoS) {
      ctx.drawImage(_geoS, x, y, cs, cs);
      if (cell.geode > 1) _drawLayerBadge(ctx, x, y, cs, cell.geode);
    } else {
      ctx.save();
      ctx.fillStyle = `rgba(120,113,108,${0.55 + cell.geode*0.08})`;
      ctx.beginPath(); ctx.arc(cx, cy, cs*0.42, 0, Math.PI*2); ctx.fill();
      ctx.strokeStyle = 'rgba(68,64,60,0.8)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(cx, cy, cs*0.42, 0, Math.PI*2); ctx.stroke();
      ctx.font = `bold ${cs*.18}px Arial`; ctx.textAlign='left'; ctx.textBaseline='top';
      ctx.fillStyle = 'rgba(231,229,228,0.9)'; ctx.fillText(`×${cell.geode}`, x+4, y+3);
      ctx.restore();
    }
  }
  // КРОТЫ И ПОКРЫТИЯ — янтарь/рунные блоки, объекты под ними
  if (cell.amber > 0 || cell._bearOpened || cell._memOpen) {
    const _lvlSkin = getLevel(state.currentLevel)?.relicSkin === 1;
    if (cell._memOpen) {
      // Вскрытый мемори-гем: показываем самоцвет в рунном блоке
      const _mgS = SPR[_MEMGEM_SPRITES[(cell.memGem || 0) % _MEMGEM_SPRITES.length]];
      if (_mgS) ctx.drawImage(_mgS, x, y, cs, cs);
      else if (SPR.memory_brick_open) ctx.drawImage(SPR.memory_brick_open, x, y, cs, cs);
      else { ctx.fillStyle = getSkinColor((cell.memGem||0) % GEM_TYPES); ctx.beginPath(); ctx.arc(cx, cy, cs*0.3, 0, Math.PI*2); ctx.fill(); }
    } else if (cell._bearOpened) {
      // Открытый крот: спрайт bear.png, fallback canvas
      if (BLOCK_SPRITES[21]) {
        ctx.drawImage(BLOCK_SPRITES[21], x, y, cs, cs);
      } else {
        _drawOpenBear(ctx, x, y, cs);
      }
    } else if (_lvlSkin || cell.memGem !== undefined || (cell.giantId !== undefined && getLevel(state.currentLevel)?.relicSkin === 1)) {
      // Рунный блок (Memory-стиль): содержимое скрыто
      if (SPR.memory_brick) {
        ctx.drawImage(SPR.memory_brick, x, y, cs, cs);
      } else {
        ctx.fillStyle = 'rgba(87,83,78,0.95)';
        roundRect(ctx, x+1, y+1, cs-2, cs-2, 8); ctx.fill();
        ctx.strokeStyle = 'rgba(41,37,36,0.9)'; ctx.lineWidth = 2;
        roundRect(ctx, x+1, y+1, cs-2, cs-2, 8); ctx.stroke();
      }
      if (cell.amber > 1) _drawLayerBadge(ctx, x, y, cs, cell.amber);
    } else if (cell.relic) {
      // Крот в янтаре: amber_1..4 — крот виден сквозь слои
      const _amS = SPR['amber_' + Math.min(4, Math.max(1, cell.amber))];
      if (_amS) {
        ctx.drawImage(_amS, x, y, cs, cs);
        if (cell.amber > 1) _drawLayerBadge(ctx, x, y, cs, cell.amber);
      } else {
        if (BLOCK_SPRITES[22]) ctx.drawImage(BLOCK_SPRITES[22], x, y, cs, cs);
        else _drawBearInAmber(ctx, x, y, cs);
        if (BLOCK_SPRITES[20]) ctx.drawImage(BLOCK_SPRITES[20], x, y, cs, cs);
        _drawLayerBadge(ctx, x, y, cs, cell.amber);
      }
    } else if (cell.giantId !== undefined) {
      // Клетка гиганта: полупрозрачный янтарь — крот просвечивает
      ctx.save();
      ctx.globalAlpha = 0.78;
      if (BLOCK_SPRITES[20]) ctx.drawImage(BLOCK_SPRITES[20], x, y, cs, cs);
      else { ctx.fillStyle = 'rgba(217,119,6,0.55)'; roundRect(ctx, x+1, y+1, cs-2, cs-2, 8); ctx.fill(); }
      ctx.restore();
      if (cell.amber > 1) _drawLayerBadge(ctx, x, y, cs, cell.amber);
    } else {
      const n = cell.amber;
      if (BLOCK_SPRITES[20]) {
        ctx.drawImage(BLOCK_SPRITES[20], x, y, cs, cs);
        _drawLayerBadge(ctx, x, y, cs, n);  // слои мёда/янтаря
      } else {
        const t2 = Date.now() / 1400;
        ctx.fillStyle=`rgba(180,90,10,${0.28+n*0.10})`;
        roundRect(ctx,x+2,y+2,cs-4,cs-4,8); ctx.fill();
        const hGrd=ctx.createRadialGradient(cx-cs*0.18,cy-cs*0.22,cs*0.05,cx,cy,cs*0.52);
        hGrd.addColorStop(0,`rgba(255,190,60,${0.38+n*0.05})`);
        hGrd.addColorStop(0.55,`rgba(200,120,20,${0.22+n*0.04})`);
        hGrd.addColorStop(1,'rgba(80,30,0,0)');
        ctx.fillStyle=hGrd; roundRect(ctx,x+2,y+2,cs-4,cs-4,8); ctx.fill();
        ctx.fillStyle=`rgba(200,110,15,0.80)`;
        for(let i=0;i<3;i++){
          const ddx=x+cs*0.22+i*cs*0.26+Math.sin(t2*0.6+i)*cs*0.03;
          const ddy=y+cs*0.68+Math.sin(t2*0.4+i)*cs*0.05;
          ctx.beginPath(); ctx.ellipse(ddx,ddy,cs*0.055,cs*0.095+Math.sin(t2+i)*cs*0.015,0,0,Math.PI*2); ctx.fill();
        }
        ctx.strokeStyle=`rgba(240,160,40,0.28)`; ctx.lineWidth=Math.max(0.8,cs*0.018); ctx.lineCap='round';
        ctx.beginPath(); ctx.moveTo(x+cs*0.30,y+cs*0.28); ctx.lineTo(x+cs*0.52,y+cs*0.55); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x+cs*0.60,y+cs*0.32); ctx.lineTo(x+cs*0.75,y+cs*0.60); ctx.stroke();
        ctx.strokeStyle=`rgba(160,80,8,0.72)`; ctx.lineWidth=2;
        roundRect(ctx,x+2,y+2,cs-4,cs-4,8); ctx.stroke();
        ctx.font=`bold ${cs*.20}px Arial`; ctx.textAlign='left'; ctx.textBaseline='top';
        ctx.fillStyle='rgba(255,200,80,0.90)'; ctx.fillText(`x${n}`,x+3,y+3);
      }
    }
  }
  ctx.restore();
}

// Ingredient glow cache: icon+size → offscreen canvas with golden silhouette
const _igCache = {};
function getIngredientGlowCanvas(icon, sz) {
  const key = icon + sz;
  if (_igCache[key]) return _igCache[key];
  const oc = document.createElement('canvas');
  oc.width = oc.height = sz * 2;
  const oc2 = oc.getContext('2d');
  oc2.font = `${sz * 1.3}px Arial`;
  oc2.textAlign = 'center'; oc2.textBaseline = 'middle';
  oc2.fillText(icon, sz, sz);
  // Fill silhouette with gold
  oc2.globalCompositeOperation = 'source-in';
  oc2.fillStyle = 'rgba(255,220,60,1)';
  oc2.fillRect(0, 0, sz*2, sz*2);
  _igCache[key] = oc;
  return oc;
}

function gemContrastStroke(hex) {
  let r=128,g=128,b=128;
  if (typeof hex==='string' && hex.startsWith('#') && hex.length>=7) {
    r=parseInt(hex.slice(1,3),16); g=parseInt(hex.slice(3,5),16); b=parseInt(hex.slice(5,7),16);
  } else if (typeof hex==='string') {
    const m=hex.match(/\d+/g); if(m&&m.length>=3){r=+m[0];g=+m[1];b=+m[2];}
  }
  // Lighten 70% toward white for a bright tint outline
  return `rgba(${Math.round(r+(255-r)*.7)},${Math.round(g+(255-g)*.7)},${Math.round(b+(255-b)*.7)},0.85)`;
}

function _gemPath(ctx,shape,cx,cy,r) {
  ctx.beginPath();
  switch(shape) {
    // ── HEART — мягкое сердце ─────────────────────────────────────
    case 'heart': {
      const w = r*0.95, h = r*0.95;
      ctx.moveTo(cx, cy + h*0.62);
      ctx.bezierCurveTo(cx + w*1.05, cy + h*0.12,
                        cx + w*0.55, cy - h*0.85,
                        cx,           cy - h*0.18);
      ctx.bezierCurveTo(cx - w*0.55, cy - h*0.85,
                        cx - w*1.05, cy + h*0.12,
                        cx,           cy + h*0.62);
      ctx.closePath();
      break;
    }
    // ── DROP — капля воды ─────────────────────────────────────────
    case 'drop': {
      const w = r*0.78, h = r*0.95;
      ctx.moveTo(cx, cy - h);
      ctx.bezierCurveTo(cx + w, cy - h*0.30, cx + w, cy + h*0.55, cx, cy + h*0.92);
      ctx.bezierCurveTo(cx - w, cy + h*0.55, cx - w, cy - h*0.30, cx, cy - h);
      ctx.closePath();
      break;
    }
    // ── CLOVER — 3-лепестковый шэмрок (три круга треугольником) ─────────────
    case 'clover': {
      const leafR = r * 0.52, d = r * 0.35;
      for (let i = 0; i < 3; i++) {
        const ang = (i / 3) * Math.PI * 2 - Math.PI * 0.5;
        const lx = cx + Math.cos(ang) * d, ly = cy + Math.sin(ang) * d;
        ctx.moveTo(lx + leafR, ly);
        ctx.arc(lx, ly, leafR, 0, Math.PI * 2);
      }
      break;
    }
    // ── STAR — крупная 5-конечная звезда ─────────────────────────
    case 'star':
      drawStar(ctx, cx, cy, 5, r*0.95, r*0.42);
      break;
    // ── KITE — кристалл-ромб с гранью (вытянутый по вертикали) ───
    case 'kite': {
      const w = r*0.72, h = r*0.96;
      ctx.moveTo(cx, cy - h);
      ctx.lineTo(cx + w, cy - h*0.20);
      ctx.lineTo(cx + w*0.62, cy + h*0.50);
      ctx.lineTo(cx, cy + h);
      ctx.lineTo(cx - w*0.62, cy + h*0.50);
      ctx.lineTo(cx - w, cy - h*0.20);
      ctx.closePath();
      break;
    }
    // ── FLOWER — 6-лепестковый цветок ────────────────────────────
    case 'flower': {
      const petalR = r*0.45;
      const orbit = r*0.50;
      for (let i=0;i<6;i++) {
        const ang = i * Math.PI/3 - Math.PI/2;
        const px = cx + Math.cos(ang)*orbit;
        const py = cy + Math.sin(ang)*orbit;
        ctx.moveTo(px + petalR, py);
        ctx.arc(px, py, petalR, 0, Math.PI*2);
      }
      // Сердцевина — соединяет лепестки
      ctx.moveTo(cx + r*0.30, cy);
      ctx.arc(cx, cy, r*0.30, 0, Math.PI*2);
      break;
    }
    // ── ORE SHAPES — рудные формы для темы раскопок ──────────────
    // ore_spike — кристаллический пик (золото)
    case 'ore_spike': {
      const w = r*0.55, h = r*0.95, sh = r*0.32;
      ctx.moveTo(cx, cy - h);
      ctx.lineTo(cx + w*0.45, cy - sh);
      ctx.lineTo(cx + w, cy + h*0.60);
      ctx.lineTo(cx + w*0.30, cy + h);
      ctx.lineTo(cx - w*0.30, cy + h);
      ctx.lineTo(cx - w, cy + h*0.60);
      ctx.lineTo(cx - w*0.45, cy - sh);
      ctx.closePath();
      break;
    }
    // ore_hex — правильный шестиугольник (сапфир)
    case 'ore_hex': {
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2 - Math.PI / 2;
        if (i === 0) ctx.moveTo(cx + Math.cos(a)*r*0.92, cy + Math.sin(a)*r*0.92);
        else ctx.lineTo(cx + Math.cos(a)*r*0.92, cy + Math.sin(a)*r*0.92);
      }
      ctx.closePath();
      break;
    }
    // ore_rect — прямоугольный срез с фасками (изумруд)
    case 'ore_rect': {
      const ww = r*0.68, hh = r*0.90, ch = r*0.20;
      ctx.moveTo(cx - ww + ch, cy - hh);
      ctx.lineTo(cx + ww - ch, cy - hh);
      ctx.lineTo(cx + ww,      cy - hh + ch);
      ctx.lineTo(cx + ww,      cy + hh - ch);
      ctx.lineTo(cx + ww - ch, cy + hh);
      ctx.lineTo(cx - ww + ch, cy + hh);
      ctx.lineTo(cx - ww,      cy + hh - ch);
      ctx.lineTo(cx - ww,      cy - hh + ch);
      ctx.closePath();
      break;
    }
    // ore_round — восьмигранник (рубин)
    case 'ore_round': {
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2 - Math.PI / 8;
        if (i === 0) ctx.moveTo(cx + Math.cos(a)*r*0.92, cy + Math.sin(a)*r*0.92);
        else ctx.lineTo(cx + Math.cos(a)*r*0.92, cy + Math.sin(a)*r*0.92);
      }
      ctx.closePath();
      break;
    }
    // ore_tri — кластер из трёх кристальных пиков (аметист)
    case 'ore_tri': {
      for (let i = 0; i < 3; i++) {
        const baseAng = (i / 3) * Math.PI * 2 - Math.PI / 2;
        const tx = cx + Math.cos(baseAng) * r * 0.90;
        const ty = cy + Math.sin(baseAng) * r * 0.90;
        const s1 = baseAng + Math.PI * 0.78;
        const s2 = baseAng - Math.PI * 0.78;
        ctx.moveTo(tx, ty);
        ctx.lineTo(cx + Math.cos(s1)*r*0.42, cy + Math.sin(s1)*r*0.42);
        ctx.lineTo(cx + Math.cos(s2)*r*0.42, cy + Math.sin(s2)*r*0.42);
        ctx.closePath();
      }
      break;
    }
    // ore_blob — самородок неправильной формы (янтарь)
    case 'ore_blob': {
      const offs = [1.0, 0.80, 0.94, 0.76, 0.88, 0.82, 0.96, 0.78];
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2 - Math.PI * 0.2;
        const ir = r * offs[i] * 0.90;
        if (i === 0) ctx.moveTo(cx + Math.cos(a)*ir, cy + Math.sin(a)*ir);
        else ctx.lineTo(cx + Math.cos(a)*ir, cy + Math.sin(a)*ir);
      }
      ctx.closePath();
      break;
    }
    // ── fallback (старые шапки, на случай) ────────────────────────
    case 'circle':   ctx.arc(cx,cy,r-1,0,Math.PI*2); break;
    case 'diamond':  ctx.moveTo(cx,cy-r+1);ctx.lineTo(cx+r-1,cy);ctx.lineTo(cx,cy+r-1);ctx.lineTo(cx-r+1,cy);ctx.closePath(); break;
    case 'square':   addRoundRect(ctx,cx-r+3,cy-r+3,(r-3)*2,(r-3)*2,7); break;
    case 'triangle': ctx.moveTo(cx,cy-r+1);ctx.lineTo(cx+r-1,cy+r-1);ctx.lineTo(cx-r+1,cy+r-1);ctx.closePath(); break;
    case 'hexagon':  drawHex(ctx,cx,cy,r-1); break;
    default: ctx.arc(cx,cy,r-1,0,Math.PI*2);
  }
}

// ─── Crystal gem sprite cache (perf) ──────────────────────
const _gemSpriteCache = new Map();
let _gemCacheGen = 0;
// ─── Bottle color cache (keyed by gem type) ─────────────────
const _flaskColorCache = new Map();
// ─── Кеши статичных клеток ───────────────────────────────────────────────
let _iceSprite = null, _iceSpriteSz = 0;
const _dirtSprites = {};
let _bricksSprite = null, _bricksSpriteSz = 0;

function _getColoredBottle(type) {
  const sprite = BLOCK_SPRITES[12];
  if (!sprite) return null;
  if (_flaskColorCache.has(type)) return _flaskColorCache.get(type);
  const sz = Math.round(cellSize) || 64;
  const oc = document.createElement('canvas');
  oc.width = sz; oc.height = sz;
  const ocx = oc.getContext('2d');
  ocx.drawImage(sprite, 0, 0, sz, sz);
  ocx.globalCompositeOperation = 'source-atop';
  ocx.globalAlpha = 0.62;
  ocx.fillStyle = GEMS[type]?.color || '#ffffff';
  ocx.fillRect(0, 0, sz, sz);
  _flaskColorCache.set(type, oc);
  return oc;
}

function invalidateGemCache() {
  _gemSpriteCache.clear(); _gemCacheGen++;
  _flaskColorCache.clear();
  _iceSprite = null; _iceSpriteSz = 0;
  for (const k in _dirtSprites) delete _dirtSprites[k];
  _bricksSprite = null; _bricksSpriteSz = 0;
}

function _getIceSprite() {
  const sz = Math.round(cellSize);
  if (_iceSprite && _iceSpriteSz === sz) return _iceSprite;
  _iceSpriteSz = sz;
  const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
  const cv = document.createElement('canvas');
  cv.width = Math.ceil(sz * dpr); cv.height = Math.ceil(sz * dpr);
  const c = cv.getContext('2d');
  c.scale(dpr, dpr);
  const cs = sz, icx = cs/2, icy = cs/2;
  const igrd = c.createLinearGradient(0, 0, 0, cs);
  igrd.addColorStop(0, 'rgba(220,245,255,0.78)');
  igrd.addColorStop(0.5, 'rgba(150,210,250,0.72)');
  igrd.addColorStop(1, 'rgba(80,160,220,0.78)');
  c.fillStyle = igrd;
  roundRect(c, 1, 1, cs-2, cs-2, 10); c.fill();
  c.save();
  roundRect(c, 1, 1, cs-2, cs-2, 10); c.clip();
  c.fillStyle = 'rgba(255,255,255,0.30)';
  c.beginPath(); c.moveTo(cs*0.10, cs*0.08); c.lineTo(cs*0.55, cs*0.04); c.lineTo(cs*0.32, cs*0.50); c.closePath(); c.fill();
  c.fillStyle = 'rgba(255,255,255,0.18)';
  c.beginPath(); c.moveTo(cs*0.62, cs*0.55); c.lineTo(cs*0.95, cs*0.40); c.lineTo(cs*0.85, cs*0.95); c.closePath(); c.fill();
  c.restore();
  c.strokeStyle = 'rgba(255,255,255,0.95)';
  c.lineWidth = Math.max(1.6, cs*0.06); c.lineCap = 'round';
  const sr = cs*0.28;
  for (let a = 0; a < 6; a++) {
    const ang = a * Math.PI/3, dx = Math.cos(ang)*sr, dy = Math.sin(ang)*sr;
    c.beginPath();
    c.moveTo(icx, icy); c.lineTo(icx+dx, icy+dy);
    c.moveTo(icx+dx*0.55, icy+dy*0.55);
    c.lineTo(icx+dx*0.55+Math.cos(ang+0.65)*sr*0.42, icy+dy*0.55+Math.sin(ang+0.65)*sr*0.42);
    c.moveTo(icx+dx*0.55, icy+dy*0.55);
    c.lineTo(icx+dx*0.55+Math.cos(ang-0.65)*sr*0.42, icy+dy*0.55+Math.sin(ang-0.65)*sr*0.42);
    c.moveTo(icx+dx*0.88, icy+dy*0.88);
    c.lineTo(icx+dx*0.88+Math.cos(ang+0.9)*sr*0.18, icy+dy*0.88+Math.sin(ang+0.9)*sr*0.18);
    c.moveTo(icx+dx*0.88, icy+dy*0.88);
    c.lineTo(icx+dx*0.88+Math.cos(ang-0.9)*sr*0.18, icy+dy*0.88+Math.sin(ang-0.9)*sr*0.18);
    c.stroke();
  }
  c.fillStyle = 'rgba(255,255,255,0.95)';
  c.beginPath(); c.arc(icx, icy, Math.max(1.5, cs*0.05), 0, Math.PI*2); c.fill();
  c.strokeStyle = 'rgba(255,255,255,0.9)'; c.lineWidth = 1.8;
  roundRect(c, 1, 1, cs-2, cs-2, 10); c.stroke();
  _iceSprite = cv;
  return cv;
}

function _getJellySprite(dirt) {
  const sz = Math.round(cellSize);
  const key = `${dirt}_${sz}`;
  if (_dirtSprites[key]) return _dirtSprites[key];
  const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
  const cv = document.createElement('canvas');
  cv.width = Math.ceil(sz * dpr); cv.height = Math.ceil(sz * dpr);
  const c = cv.getContext('2d');
  c.scale(dpr, dpr);
  const cs = sz, jpad = 2;
  const jgrd = c.createLinearGradient(0, 0, 0, cs);
  if (dirt === 2) {
    jgrd.addColorStop(0, 'rgba(255,150,210,0.55)'); jgrd.addColorStop(1, 'rgba(255,40,140,0.55)');
  } else {
    jgrd.addColorStop(0, 'rgba(255,170,215,0.32)'); jgrd.addColorStop(1, 'rgba(255,80,160,0.30)');
  }
  c.fillStyle = jgrd;
  roundRect(c, jpad, jpad, cs-jpad*2, cs-jpad*2, 11); c.fill();
  c.beginPath();
  c.moveTo(jpad+6, jpad+4); c.quadraticCurveTo(cs/2, jpad+cs*0.28, cs-jpad-6, jpad+4);
  c.quadraticCurveTo(cs/2, jpad+cs*0.05, jpad+6, jpad+4); c.closePath();
  c.fillStyle = dirt===2 ? 'rgba(255,255,255,0.42)' : 'rgba(255,255,255,0.28)'; c.fill();
  c.beginPath(); c.arc(cs*0.30, cs*0.24, Math.max(1.6, cs*0.05), 0, Math.PI*2);
  c.fillStyle = 'rgba(255,255,255,0.85)'; c.fill();
  c.strokeStyle = dirt===2 ? 'rgba(255,40,140,0.9)' : 'rgba(255,90,170,0.55)';
  c.lineWidth = dirt===2 ? 2 : 1.4;
  roundRect(c, jpad, jpad, cs-jpad*2, cs-jpad*2, 11); c.stroke();
  if (dirt === 2) {
    c.fillStyle = '#fff'; c.strokeStyle = 'rgba(190,20,100,0.9)'; c.lineWidth = 1.5;
    c.font = `bold ${Math.round(cs*0.22)}px 'Fredoka',Arial`;
    c.textAlign = 'right'; c.textBaseline = 'top';
    c.strokeText('×2', cs-5, 4); c.fillText('×2', cs-5, 4);
  }
  _dirtSprites[key] = cv;
  return cv;
}

function _getCarpetSprite() {
  const sz = Math.round(cellSize);
  if (_bricksSprite && _bricksSpriteSz === sz) return _bricksSprite;
  _bricksSpriteSz = sz;
  const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
  const cv = document.createElement('canvas');
  cv.width = Math.ceil(sz * dpr); cv.height = Math.ceil(sz * dpr);
  const c = cv.getContext('2d');
  c.scale(dpr, dpr);
  const cs = sz;
  c.fillStyle = 'rgba(200,140,40,0.28)';
  roundRect(c, 1, 1, cs-2, cs-2, 8); c.fill();
  c.save();
  c.beginPath(); roundRect(c, 2, 2, cs-4, cs-4, 6); c.clip();
  c.strokeStyle = 'rgba(180,110,20,0.28)'; c.lineWidth = 1.2;
  for (let i = -cs; i < cs*2; i += 7) {
    c.beginPath(); c.moveTo(i, 0); c.lineTo(i+cs, cs); c.stroke();
  }
  c.restore();
  c.strokeStyle = 'rgba(210,160,60,0.6)'; c.lineWidth = 2;
  roundRect(c, 1, 1, cs-2, cs-2, 8); c.stroke();
  _bricksSprite = cv;
  return cv;
}

// PNG asset override — заполнить GEM_IMAGES[i] HTMLImageElement чтобы заменить canvas-рисовку
// Пример: loadGemImage(0, 'assets/ore_gold.png')
const GEM_IMAGES = new Array(7).fill(null);
function loadGemImage(gemIndex, url) {
  const img = new Image();
  img.onload = () => { GEM_IMAGES[gemIndex] = img; invalidateGemCache(); };
  img.src = url;
}

// ══════════════════════════════════════════
//  ТЕКСТУР-ПАК — кастомный спрайтшит
// ══════════════════════════════════════════
const TEXTURE_PACK = {
  sprites: {
    gem:      [null,null,null,null,null,null,null],
    stripe_h: [null,null,null,null,null,null,null],
    stripe_v: [null,null,null,null,null,null,null],
    coloring: [null,null,null,null,null,null,null],
    bomb:     [null,null,null,null,null,null,null],
    rocket:   [null,null,null,null,null,null,null],
    rainbow:  null,

  }
};

// Спрайты блокеров: sprites/squares/<name>.png (индекс = позиция в _TP_BLOCKS)
// 0=stone, 1=lava, 2=stone_cracked, 3=stone_broken, 4=gravel, 5=rubble, 6=gem_bucket
// 7=cage_locked, 8=cobblestone, 9=dirt, 10=stone_2holes, 11=stone_1hole, 12=flask
// 13=mystery, 14=vine_branch, 15=vine_cross, 16=vine_cross2
// 17=chain_1, 18=chain_2, 19=chain_3
// 20=amber, 21=bear, 22=bear_sleeping, 23=ice, 24=portal, 25=dirt_red, 26=dirt_orange
const BLOCK_SPRITES = new Array(27).fill(null);
// sprites/squares/ — тип гема 0-5 = yellow/cyan/green/red/purple/orange
const _TP_GEM      = ['gem_yellow',      'gem_cyan',      'gem_green',      'gem_red',      'gem_purple',      'gem_orange',      'gem_blue'];
const _TP_COLORING = ['barrel_yellow',   'barrel_cyan',   'barrel_green',   'barrel_red',   'barrel_purple',   'barrel_orange',   'barrel_blue'];
const _TP_BOMB     = ['tnt_yellow',      'tnt_cyan',      'tnt_green',      'tnt_red',      'tnt_purple',      'tnt_orange',      'tnt_blue'];
const _TP_ROCKET   = ['rocket_yellow',   'rocket_cyan',   'rocket_green',   'rocket_red',   'rocket_purple',   'rocket_orange',   'rocket_blue'];
const _TP_STRIPE_H = ['stripe_h_yellow', 'stripe_h_cyan', 'stripe_h_green', 'stripe_h_red', 'stripe_h_purple', 'stripe_h_orange', 'stripe_h_blue'];
const _TP_STRIPE_V = ['stripe_v_yellow', 'stripe_v_cyan', 'stripe_v_green', 'stripe_v_red', 'stripe_v_purple', 'stripe_v_orange', 'stripe_v_blue'];
const _TP_BLOCKS   = [
  'stone','lava','stone_cracked','stone_broken','gravel',
  'rubble','gem_bucket','cage_locked','cobblestone','dirt',
  'stone_2holes','stone_1hole','bottle','mystery','vine_branch',
  'vine_cross','vine_cross2','chain_1','chain_2','chain_3',
  'honey','bear','bear_sleeping','ice','portal',
  'jelly_red','jelly_orange'
];
// Именованные спрайты (новые механики): SPR['amber_2'], SPR['memory_brick'] и т.д.
const SPR = {};
const _MEMGEM_SPRITES = ['memory_gem_yellow','memory_gem_blue','memory_gem_green','memory_gem_red','memory_gem_purple','memory_gem_orange'];
const _TP_NAMED = [
  'amber_1','amber_2','amber_3','amber_4',
  'memory_brick','memory_brick_open',
  'memory_gem_yellow','memory_gem_blue','memory_gem_green','memory_gem_red','memory_gem_purple','memory_gem_orange',
  'memory_bear_small','memory_bear_medium','memory_bear_large','memory_bear_xlarge',
  'geode_1','geode_2','geode_3','geode_4','geode_5',
  'drill_down','drill_left','drill_right','drill_up',
  'rock_layer_1','rock_layer_2','rock_layer_3','rock_layer_4','rock_layer_5','rock_layer_6',
  'quartzite','quartzite_cracked','quartzite_crystal',
  'rock_dark','rock_lava','rock_polished',
  'cage_1','cage_2','cage_3','cage_h','cage_v'
];

function _loadTPImg(src) {
  return new Promise(res => { const i=new Image(); i.onload=()=>res(i); i.onerror=()=>res(null); i.src=src; });
}
async function loadTexturePack() {
  const P = 'sprites/squares/';
  const jobs = [];
  for (let g=0; g<7; g++) {
    jobs.push(_loadTPImg(P+_TP_GEM[g]+'.png').then(img=>{      if(img) TEXTURE_PACK.sprites.gem[g]=img;      }));
    jobs.push(_loadTPImg(P+_TP_COLORING[g]+'.png').then(img=>{ if(img) TEXTURE_PACK.sprites.coloring[g]=img; }));
    jobs.push(_loadTPImg(P+_TP_BOMB[g]+'.png').then(img=>{     if(img) TEXTURE_PACK.sprites.bomb[g]=img;     }));
    jobs.push(_loadTPImg(P+_TP_ROCKET[g]+'.png').then(img=>{   if(img) TEXTURE_PACK.sprites.rocket[g]=img;   }));
    jobs.push(_loadTPImg(P+_TP_STRIPE_H[g]+'.png').then(img=>{ if(img) TEXTURE_PACK.sprites.stripe_h[g]=img; }));
    jobs.push(_loadTPImg(P+_TP_STRIPE_V[g]+'.png').then(img=>{ if(img) TEXTURE_PACK.sprites.stripe_v[g]=img; }));
  }
  jobs.push(_loadTPImg(P+'rainbow.png').then(img=>{ if(img) TEXTURE_PACK.sprites.rainbow=img; }));
  await Promise.all(jobs);
  // Блокеры: sprites/squares/<name>.png
  const bJobs = _TP_BLOCKS.map((name, idx) =>
    _loadTPImg(P+name+'.png').then(img => { if(img) BLOCK_SPRITES[idx]=img; })
  );
  // Именованные спрайты новых механик
  const nJobs = _TP_NAMED.map(name =>
    _loadTPImg(P+name+'.png').then(img => { if(img) SPR[name]=img; })
  );
  await Promise.all([...bJobs, ...nJobs]);
  invalidateGemCache();
  const _tps=TEXTURE_PACK.sprites;
  const n = _tps.gem.filter(Boolean).length+_tps.bomb.filter(Boolean).length+_tps.rocket.filter(Boolean).length
           +_tps.stripe_h.filter(Boolean).length+_tps.stripe_v.filter(Boolean).length
           +_tps.coloring.filter(Boolean).length+(_tps.rainbow?1:0);
  const nb = BLOCK_SPRITES.filter(Boolean).length;
  console.log('[TP] Загружено:', n, 'гем-спрайтов,', nb, 'блокер-спрайтов');
  if ((n+nb)>0 && typeof showToast==='function') showToast('Текстур-пак: '+n+' гемов, '+nb+' блокеров');
}


function _renderGemSprite(shape, color, size, gemType) {
  if (!isFinite(size) || size <= 0) { const _cv=document.createElement('canvas'); _cv.width=_cv.height=1; return {canvas:_cv,pad:0,size:1,w:1}; }
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
  if (gemType !== undefined && GEM_IMAGES[gemType]) {
    c.drawImage(GEM_IMAGES[gemType], pad, pad, size, size);
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

function _getGemSprite(shape, color, size, gemType) {
  const sizeKey = Math.round(size);
  const key = `${gemType}|${shape}|${color}|${sizeKey}`;
  let s = _gemSpriteCache.get(key);
  if (!s) {
    s = _renderGemSprite(shape, color, sizeKey, gemType);
    _gemSpriteCache.set(key, s);
  }
  return s;
}

function drawShape(ctx, shape, color, x, y, size, gemType) {
  const s = _getGemSprite(shape, color, size, gemType);
  ctx.drawImage(s.canvas, x - s.pad, y - s.pad, s.w, s.w);
}

// Смешивает hex-цвет с white (255) или black (0) на долю f
function blendColor(hex, target, f) {
  try {
    const n=parseInt(hex.replace('#',''),16);
    const ri=(n>>16)&255, gi=(n>>8)&255, bi=n&255;
    const ro=Math.round(ri+(target-ri)*f);
    const go=Math.round(gi+(target-gi)*f);
    const bo=Math.round(bi+(target-bi)*f);
    return `rgb(${ro},${go},${bo})`;
  } catch(e) { return hex; }
}

function drawStar(ctx,cx,cy,pts,outer,inner) {
  ctx.beginPath();
  for (let i=0;i<pts*2;i++) {
    const a=(i*Math.PI/pts)-Math.PI/2, rr=i%2===0?outer:inner;
    i===0?ctx.moveTo(cx+rr*Math.cos(a),cy+rr*Math.sin(a)):ctx.lineTo(cx+rr*Math.cos(a),cy+rr*Math.sin(a));
  }
  ctx.closePath();
}
function drawHex(ctx,cx,cy,r) {
  ctx.beginPath();
  for (let i=0;i<6;i++) {
    const a=(Math.PI/3)*i-Math.PI/6;
    i===0?ctx.moveTo(cx+r*Math.cos(a),cy+r*Math.sin(a)):ctx.lineTo(cx+r*Math.cos(a),cy+r*Math.sin(a));
  }
  ctx.closePath();
}
function roundRect(ctx,x,y,w,h,r) {
  if(w<2*r)r=w/2; if(h<2*r)r=h/2;
  ctx.beginPath();
  ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r);
  ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath();
}
// Добавляет скруглённый прямоугольник к текущему пути без beginPath
function addRoundRect(ctx,x,y,w,h,r) {
  if(w<2*r)r=w/2; if(h<2*r)r=h/2;
  ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r);
  ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath();
}

