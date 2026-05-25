// ══════════════════════════════════════════
//  ЧАСТИЦЫ
// ══════════════════════════════════════════
const _MAX_PARTICLES = 350;
const _MAX_RINGS = 40;
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
      shard: true,
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
      dust: true
    });
  }

  // Кольцо взрыва
  if (rings.length < _MAX_RINGS) {
    rings.push({ x, y, color, r: 3, maxR: cellSize*0.85, life: 1, lw: 2.5 });
    rings.push({ x, y, color: 'rgba(255,255,240,0.9)', r: 8, maxR: cellSize*1.2, life: 0.50, lw: 1.5 });
  }
}
let rings=[];
function updateRings() {
  if (!pCtx) return;
  rings=rings.filter(rg=>rg.life>0);
  for (const rg of rings) {
    rg.r+=(rg.maxR-rg.r)*0.20; rg.life-=0.08;
    pCtx.save();
    pCtx.globalAlpha=Math.max(0,rg.life*0.7);
    pCtx.strokeStyle=rg.color; pCtx.lineWidth=rg.lw||3;
    pCtx.beginPath(); pCtx.arc(rg.x,rg.y,rg.r,0,Math.PI*2); pCtx.stroke();
    pCtx.restore();
  }
}
function updateParticles() {
  if (!pCtx) return;
  pCtx.clearRect(0,0,canvasLogW,canvasLogH);
  updateRings();
  updateLightning();
  particles=particles.filter(p=>p.life>0);
  for (const p of particles) {
    p.x+=p.vx; p.y+=p.vy; p.vy+=0.22; p.vx*=0.98; p.life-=0.04;
    const a=Math.max(0,p.life);
    pCtx.globalAlpha=a;
    if (p.star) {
      pCtx.strokeStyle=p.color; pCtx.lineWidth=2;
      pCtx.beginPath();
      pCtx.moveTo(p.x, p.y);
      pCtx.lineTo(p.x-p.vx*0.5, p.y-p.vy*0.5);
      pCtx.stroke();
    } else if (p.shard) {
      // Треугольный осколок с вращением
      pCtx.save();
      pCtx.globalAlpha = a;
      pCtx.shadowColor = p.color; pCtx.shadowBlur = p.r * 1.5;
      pCtx.fillStyle = p.color;
      pCtx.translate(p.x, p.y);
      pCtx.rotate(p.rot + (p.rotV||0) * (1-a) * 10);
      pCtx.beginPath();
      pCtx.moveTo(0, -p.r*1.2);
      pCtx.lineTo(p.r*0.8, p.r*0.8);
      pCtx.lineTo(-p.r*0.8, p.r*0.8);
      pCtx.closePath();
      pCtx.fill();
      pCtx.shadowBlur = 0;
      pCtx.restore();
      if (p.rotV) p.rot += p.rotV;
    } else if (p.dust) {
      // Каменная пыль — полупрозрачный круг без glow
      pCtx.fillStyle = p.color;
      pCtx.beginPath(); pCtx.arc(p.x, p.y, p.r, 0, Math.PI*2); pCtx.fill();
    } else if (p.glow) {
      pCtx.shadowColor=p.color; pCtx.shadowBlur=10;
      pCtx.fillStyle=p.color;
      pCtx.beginPath(); pCtx.arc(p.x,p.y,p.r,0,Math.PI*2); pCtx.fill();
      pCtx.shadowBlur=0;
    } else if (p.addBlend) {
      pCtx.globalCompositeOperation='lighter';
      pCtx.fillStyle=p.color;
      pCtx.beginPath(); pCtx.arc(p.x,p.y,p.r,0,Math.PI*2); pCtx.fill();
      pCtx.globalCompositeOperation='source-over';
    } else {
      pCtx.fillStyle=p.color;
      pCtx.beginPath(); pCtx.arc(p.x,p.y,p.r,0,Math.PI*2); pCtx.fill();
    }
  }
  // Gesture hint overlay
  drawGestureHint(pCtx);
  // Floating score texts
  floatingTexts=floatingTexts.filter(t=>t.t<1);
  for (const ft of floatingTexts) {
    ft.t = Math.min(1, ft.t + 0.018); // ~1.0s at 60fps
    const t = ft.t;
    // Scale: elastic pop 0→1.224 in 0.3s then damped spring
    let sc;
    if (t < 0.3) {
      sc = 0.2 + 1.024 * EASE.outElastic(t / 0.3);
    } else {
      const td = (t - 0.3) / 0.7;
      sc = 1 + 0.224 * Math.exp(-td * 8) * Math.cos(td * 40);
    }
    // Y drift: -50px over 1.0s
    const dy = -50 * t;
    // Alpha: 1.0 until t=0.8, then fade
    const alpha = t < 0.8 ? 1 : 1 - (t - 0.8) / 0.2;
    pCtx.globalAlpha = Math.max(0, alpha);
    pCtx.save();
    pCtx.translate(ft.x, ft.startY + dy);
    pCtx.scale(sc, sc);
    pCtx.font=`bold ${ft.size}px Arial`;
    pCtx.textAlign='center'; pCtx.textBaseline='middle';
    pCtx.fillStyle=ft.color;
    pCtx.strokeStyle='rgba(0,0,0,0.6)'; pCtx.lineWidth=3/sc;
    pCtx.strokeText(ft.text,0,0);
    pCtx.fillText(ft.text,0,0);
    pCtx.restore();
  }
  pCtx.globalAlpha=1;
}

function spawnFloatingScore(r, c, score, color) {
  const x = boardOffX + c*cellSize + cellSize/2;
  const y = boardOffY + r*cellSize + cellSize/2;
  floatingTexts.push({ x, startY: y, t: 0, text: '+'+score, size: score>100?20:15, color: color||'#ffe066' });
}

function spawnScorePop(r, c, gemColor) {
  const x = boardOffX + c*cellSize + cellSize/2;
  const y = boardOffY + r*cellSize + cellSize/2;
  const count = 4 + Math.floor(Math.random() * 2);
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2;
    const sp = 2 + Math.random() * 3.5;
    particles.push({ x, y, vx: Math.cos(a)*sp, vy: Math.sin(a)*sp - 2,
      color: gemColor || '#fff', life: 0.55 + Math.random()*0.2,
      r: 2.5 + Math.random()*2, addBlend: true });
  }
}

