// ══════════════════════════════════════════
//  СПЕЦ-ФИШКИ
// ══════════════════════════════════════════
async function activateSpecials(r1,c1,r2,c2) {
  const cell1=state.board[r1]?.[c1];
  const cell2=state.board[r2]?.[c2];
  if (cell1&&cell2&&cell1.special!==SPECIAL.NONE&&cell2.special!==SPECIAL.NONE) {
    await triggerCombinedSpecial(r1,c1,cell1.special,r2,c2,cell2.special);
    state.board[r1][c1]=null;
    state.board[r2][c2]=null;
    return;
  }
  for (const [r,c,pr,pc] of [[r1,c1,r2,c2],[r2,c2,r1,c1]]) {
    const cell=state.board[r]?.[c];
    if (!cell||cell.special===SPECIAL.NONE) continue;
    const partnerType=state.board[pr]?.[pc]?.type??-1;
    await triggerSpecial(r,c,cell.special,partnerType);
    state.board[r][c]=null;
  }
}

function showSpecialComboLabel(sp1, sp2) {
  const el = document.getElementById('candy-comment');
  if (!el) return;
  const isRainbow = sp1===SPECIAL.RAINBOW||sp2===SPECIAL.RAINBOW;
  const label = isRainbow ? '🌈 МЕГА ВЗРЫВ!' : '💫 КОМБО УДАР!';
  el.textContent = label;
  el.style.cssText = 'opacity:1;font-size:44px;color:#fff;text-shadow:0 0 28px #f59e0b,0 0 8px #a855f7;transform:translate(-50%,-50%) scale(1.25);transition:transform .15s,opacity .2s;';
  clearTimeout(window._specialComboTO);
  window._specialComboTO = setTimeout(() => {
    el.style.transform = 'translate(-50%,-50%) scale(1)';
    setTimeout(() => { el.style.opacity = '0'; }, 100);
  }, 700);
}

async function triggerCombinedSpecial(r1,c1,sp1,r2,c2,sp2) {
  const _myEpoch = _matchEpoch;
  showSpecialComboLabel(sp1, sp2);
  // Сохраняем типы ДО обнуления (нужны для цветовых комбо)
  const _t1 = state.board[r1]?.[c1]?.type ?? -1;
  const _t2 = state.board[r2]?.[c2]?.type ?? -1;
  // Сразу убираем исходные гемы — иначе после внутренней гравитации они могут быть перезаписаны
  if (state.board[r1]?.[c1]) state.board[r1][c1] = null;
  if (state.board[r2]?.[c2]) state.board[r2][c2] = null;
  const td=new Set();
  const addRow=r=>{ for(let c=0;c<COLS;c++){if(r>=0&&r<ROWS)td.add(`${r},${c}`);}};
  const addCol=c=>{ for(let r=0;r<ROWS;r++){if(c>=0&&c<COLS)td.add(`${r},${c}`);}};
  const addArea=(r,c,rad)=>{ for(let dr=-rad;dr<=rad;dr++) for(let dc=-rad;dc<=rad;dc++){const nr=r+dr,nc=c+dc;if(nr>=0&&nr<ROWS&&nc>=0&&nc<COLS)td.add(`${nr},${nc}`);}};
  // Coloring+Coloring → все фишки становятся одного цвета (цвет первой красящей)
  if (sp1===SPECIAL.COLORING&&sp2===SPECIAL.COLORING) {
    const col1 = (_t1>=0) ? _t1 : Math.floor(Math.random()*_activeGemTypes);
    await animateColoringWave(r1, c1, col1);
    if (_matchEpoch !== _myEpoch) return;
    for(let rr=0;rr<ROWS;rr++) for(let cc=0;cc<COLS;cc++){
      const cl=state.board[rr]?.[cc];
      if(!cl||cl.stone||cl.lava||cl.locked||cl.bucket) continue;
      if(cl.special===SPECIAL.NONE){cl.type=col1;spawnParticles(rr,cc,getSkinColor(col1),3);}
    }
    showToast('🎨🎨 Все фишки одного цвета!'); drawBoard();
    return;
  }
  // Coloring + Stripe/Bomb/Rocket → все гемы цвета красящей становятся этим спешлом и взрываются
  // Rainbow+Coloring обрабатывается ниже в блоке Rainbow
  if ((sp1===SPECIAL.COLORING||sp2===SPECIAL.COLORING) && sp1!==SPECIAL.RAINBOW && sp2!==SPECIAL.RAINBOW) {
    const rawCol=sp1===SPECIAL.COLORING?_t1:_t2;
    const coloringType = (rawCol>=0) ? rawCol : Math.floor(Math.random()*_activeGemTypes);
    const partnerSp = sp1===SPECIAL.COLORING ? sp2 : sp1;
    if (partnerSp===SPECIAL.STRIPE_H||partnerSp===SPECIAL.STRIPE_V||partnerSp===SPECIAL.BOMB||partnerSp===SPECIAL.ROCKET) {
      await animateColoringWave(r1, c1, coloringType);
      if (_matchEpoch !== _myEpoch) return;
      const targets=[];
      for(let rr=0;rr<ROWS;rr++) for(let cc=0;cc<COLS;cc++){
        const cl=state.board[rr]?.[cc];
        if(cl&&cl.type===coloringType&&!cl.stone&&!cl.lava&&!cl.bucket&&cl.special===SPECIAL.NONE){
          const _csp=(partnerSp===SPECIAL.STRIPE_H||partnerSp===SPECIAL.STRIPE_V)?(Math.random()<0.5?SPECIAL.STRIPE_H:SPECIAL.STRIPE_V):partnerSp;
          cl.special=_csp; targets.push([rr,cc,_csp]);
        }
      }
      drawBoard(); await new Promise(res=>setTimeout(res,_d(200)));
      if (_matchEpoch !== _myEpoch) return;
      let pts=0;
      if (partnerSp===SPECIAL.BOMB) {
        const _pos=[];
        for(const[tr,tc]of targets.map(([r,c])=>[r,c])){const tcl=state.board[tr]?.[tc];if(tcl&&!tcl.bucket){state.board[tr][tc]=null;pts+=30;_pos.push([tr,tc]);}}
        if(pts>0){state.score+=pts;spawnFloatingScore(r1,c1,pts,'#a855f7');updateGoalProgress();}
        await Promise.all(_pos.map(([tr,tc])=>_bombBlast3x3(tr,tc)));
        if (_matchEpoch !== _myEpoch) return;
        spawnScreenShake(12);applyGravity();fillFromTop();await animateDrop();
        if (_matchEpoch !== _myEpoch) return;
        await new Promise(res=>setTimeout(res,_d(80)));
        await Promise.all(_pos.map(([tr,tc])=>_bombBlast3x3(tr,tc)));
        if (_matchEpoch !== _myEpoch) return;
        applyGravity();fillFromTop();await animateDrop();
      } else if (partnerSp===SPECIAL.ROCKET) {
        const _fs=[];
        for(const[tr,tc]of targets.map(([r,c])=>[r,c])){const tcl=state.board[tr]?.[tc];if(tcl&&!tcl.bucket){state.board[tr][tc]=null;pts+=30;_fs.push([tr,tc]);}}
        if(pts>0){state.score+=pts;spawnFloatingScore(r1,c1,pts,'#a855f7');updateGoalProgress();}
        const _uk=new Set();
        const _crCol2=getSkinColor(coloringType)||'#ff4040';
        const _fp=_fs.map(([fr,fc])=>{const tgt=findRocketTarget(_uk);if(tgt)_uk.add(`${tgt.r},${tgt.c}`);return tgt?{fr,fc,tgt}:null;}).filter(Boolean);
        await Promise.all(_fp.map(({fr,fc,tgt})=>animateRocketFlight(fr,fc,tgt.r,tgt.c,_crCol2)));
        if (_matchEpoch !== _myEpoch) return;
        await Promise.all(_fp.map(async({tgt})=>{spawnExplosionSparks(tgt.r,tgt.c,12,_crCol2);await animateRocketBlast(tgt.r,tgt.c,_crCol2);await explodeCell(tgt.r,tgt.c);}));
        if (_matchEpoch !== _myEpoch) return;
        applyGravity();fillFromTop();await animateDrop();
      } else {
        const _sa=[];const _td=new Set();
        for(const[tr,tc,sp]of targets){const tcl=state.board[tr]?.[tc];if(!tcl||tcl.bucket)continue;state.board[tr][tc]=null;pts+=30;
          if(sp===SPECIAL.STRIPE_H){for(let cc=0;cc<COLS;cc++)_td.add(`${tr},${cc}`);_sa.push(animateStripeBeam(tr,tc,true));}
          else if(sp===SPECIAL.STRIPE_V){for(let rr=0;rr<ROWS;rr++)_td.add(`${rr},${tc}`);_sa.push(animateStripeBeam(tr,tc,false));}
        }
        if(pts>0){state.score+=pts;spawnFloatingScore(r1,c1,pts,'#a855f7');updateGoalProgress();}
        if(_sa.length){await Promise.all(_sa);spawnScreenShake(12);}
        if (_matchEpoch !== _myEpoch) return;
        const _ch=[];
        for(const k of _td){const[rr,cc]=k.split(',').map(Number);const cl=state.board[rr]?.[cc];if(!cl)continue;
          if(state.iceGrid[rr]?.[cc]){state.iceGrid[rr][cc]--;if(!state.iceGrid[rr][cc]){state.iceBroken++;updateQuestProgress('ice',1);}}
          _hitFrost(rr,cc);
          if(cl.bucket){}else if(cl.stone){cl.stone=false;cl.type=randGem();SFX.stoneBreak&&SFX.stoneBreak();state.stonesBroken++;spawnParticles(rr,cc,'#6b7280');updateQuestProgress('stones',1);breakAdjacentLava(rr,cc);}else if(cl.geode>0){_hitGeode(cl,rr,cc);}
          else if(cl.lava){destroyLava(rr,cc);breakAdjacentLava(rr,cc);}else if(cl.web){cl.web=false;SFX.webBreak&&SFX.webBreak();}
          else if(cl.locked){cl.locked=false;cl.anim={};spawnParticles(rr,cc,'#a78bfa',4);}else if(cl.chain>0){cl.chain--;spawnParticles(rr,cc,'#8899aa',cl.chain===0?6:3);if(cl.chain===0)rings.push({x:boardOffX+cc*cellSize+cellSize/2,y:boardOffY+rr*cellSize+cellSize/2,color:'rgba(100,140,170,0.8)',r:4,maxR:cellSize*1.0,life:1,lw:2});}
          else if(cl.sand>0){cl.sand=0;spawnParticles(rr,cc,'#b45309',6);}
          else if(cl.amber>0){_hitAmber(cl,rr,cc);}else if(cl.mystery){}
          else{if(cl.special!==SPECIAL.NONE)_ch.push({r:rr,c:cc,special:cl.special,type:cl.type});state.board[rr][cc]=null;breakAdjacentLava(rr,cc);}
          if(!cl.bucket){clearDirtAt(rr,cc);clearBricksAt(rr,cc,false);}
          if(cl.type>=0&&!cl.bucket)state.collectedGems[cl.type]=(state.collectedGems[cl.type]||0)+1;
        }
        for(const{r,c,special,type}of _ch){if(_matchEpoch!==_myEpoch)return;await triggerSpecial(r,c,special,type);}
        if (_matchEpoch !== _myEpoch) return;
        applyGravity();fillFromTop();await animateDrop();
      }
      showToast('🎨✨ ПРЕОБРАЗОВАНО!');
      return;
    } else {
      // Другие комбо — уничтожить все гемы цвета красящей
      for(let rr=0;rr<ROWS;rr++) for(let cc=0;cc<COLS;cc++){
        const cl=state.board[rr]?.[cc];
        if(cl&&cl.type===coloringType&&!cl.stone&&!cl.lava&&!cl.bucket){
          if(state.iceGrid[rr]?.[cc]){state.iceGrid[rr][cc]--;if(!state.iceGrid[rr][cc]){state.iceBroken++;updateQuestProgress('ice',1);}}
          _hitFrost(rr,cc);
          spawnParticles(rr,cc,getSkinColor(coloringType),6);
          state.board[rr][cc]=null; clearDirtAt(rr,cc); clearBricksAt(rr,cc,false);
          state.score+=30; breakAdjacentLava(rr,cc);
          if(cl.type>=0) state.collectedGems[cl.type]=(state.collectedGems[cl.type]||0)+1;
        }
      }
      updateGoalProgress(); showToast('🎨 ВЗОРВАНЫ!');
      applyGravity(); fillFromTop(); await animateDrop();
      return;
    }
  }
  if (sp1===SPECIAL.RAINBOW||sp2===SPECIAL.RAINBOW) {
    const otherSp  = sp1===SPECIAL.RAINBOW ? sp2 : sp1;
    const otherType= sp1===SPECIAL.RAINBOW ? _t2 : _t1;
    if (otherSp===SPECIAL.RAINBOW || otherSp===SPECIAL.COLORING) {
      // Rainbow + Rainbow / Rainbow + Coloring → clear everything
      getAllPositions().forEach(([r,c])=>td.add(`${r},${c}`));
      showToast(otherSp===SPECIAL.COLORING?'🎨🌈 ВСЕ УНИЧТОЖЕНО!':'🌈🌈 РАДУЖНЫЙ ВЗРЫВ!');
      await animateFullBoardClear(r1,c1);
      if (_matchEpoch !== _myEpoch) return;
    } else {
      // Rainbow + Special → convert all gems of partner color to partner special, chain-activate
      const tt = otherType>=0 ? otherType : (()=>{
        const counts={}; let best=-1, bestN=0;
        for(let r=0;r<ROWS;r++) for(let c=0;c<COLS;c++){
          const t=state.board[r]?.[c]?.type;
          if(t>=0){counts[t]=(counts[t]||0)+1;if(counts[t]>bestN){bestN=counts[t];best=t;}}
        } return best>=0?best:0;
      })();
      const _rbSrcR=sp1===SPECIAL.RAINBOW?r1:r2, _rbSrcC=sp1===SPECIAL.RAINBOW?c1:c2;
      await animateRainbowBurst(tt, _rbSrcR, _rbSrcC);
      if (_matchEpoch !== _myEpoch) return;
      const targets=[];
      for(let r=0;r<ROWS;r++) for(let c=0;c<COLS;c++){
        const cl=state.board[r]?.[c];
        if(cl&&cl.type===tt&&!cl.stone&&!cl.lava&&!cl.bucket){const _rsp=(otherSp===SPECIAL.STRIPE_H||otherSp===SPECIAL.STRIPE_V)?(Math.random()<0.5?SPECIAL.STRIPE_H:SPECIAL.STRIPE_V):otherSp;cl.special=_rsp;targets.push([r,c,_rsp]);}
      }
      drawBoard(); await new Promise(res=>setTimeout(res,_d(200)));
      if (_matchEpoch !== _myEpoch) return;
      let pts=0;
      if (otherSp===SPECIAL.BOMB) {
        const _pos=[];
        for(const[tr,tc]of targets.map(([r,c])=>[r,c])){const tcl=state.board[tr]?.[tc];if(tcl&&!tcl.bucket){state.board[tr][tc]=null;pts+=30;_pos.push([tr,tc]);}}
        if(pts>0){state.score+=pts;spawnFloatingScore(r1,c1,pts,'#a855f7');updateGoalProgress();}
        await Promise.all(_pos.map(([tr,tc])=>_bombBlast3x3(tr,tc)));
        if (_matchEpoch !== _myEpoch) return;
        spawnScreenShake(12);applyGravity();fillFromTop();await animateDrop();
        if (_matchEpoch !== _myEpoch) return;
        await new Promise(res=>setTimeout(res,_d(80)));
        await Promise.all(_pos.map(([tr,tc])=>_bombBlast3x3(tr,tc)));
        if (_matchEpoch !== _myEpoch) return;
        applyGravity();fillFromTop();await animateDrop();
      } else if (otherSp===SPECIAL.ROCKET) {
        const _fs=[];
        for(const[tr,tc]of targets.map(([r,c])=>[r,c])){const tcl=state.board[tr]?.[tc];if(tcl&&!tcl.bucket){state.board[tr][tc]=null;pts+=30;_fs.push([tr,tc]);}}
        if(pts>0){state.score+=pts;spawnFloatingScore(r1,c1,pts,'#a855f7');updateGoalProgress();}
        const _uk=new Set();
        const _rbRCol=getSkinColor(tt)||'#ff4040';
        const _fp=_fs.map(([fr,fc])=>{const tgt=findRocketTarget(_uk);if(tgt)_uk.add(`${tgt.r},${tgt.c}`);return tgt?{fr,fc,tgt}:null;}).filter(Boolean);
        await Promise.all(_fp.map(({fr,fc,tgt})=>animateRocketFlight(fr,fc,tgt.r,tgt.c,_rbRCol)));
        if (_matchEpoch !== _myEpoch) return;
        await Promise.all(_fp.map(async({tgt})=>{spawnExplosionSparks(tgt.r,tgt.c,12,_rbRCol);await animateRocketBlast(tgt.r,tgt.c,_rbRCol);await explodeCell(tgt.r,tgt.c);}));
        if (_matchEpoch !== _myEpoch) return;
        applyGravity();fillFromTop();await animateDrop();
      } else {
        const _sa=[];const _td=new Set();
        for(const[tr,tc,sp]of targets){const tcl=state.board[tr]?.[tc];if(!tcl||tcl.bucket)continue;state.board[tr][tc]=null;pts+=30;
          if(sp===SPECIAL.STRIPE_H){for(let cc=0;cc<COLS;cc++)_td.add(`${tr},${cc}`);_sa.push(animateStripeBeam(tr,tc,true));}
          else if(sp===SPECIAL.STRIPE_V){for(let rr=0;rr<ROWS;rr++)_td.add(`${rr},${tc}`);_sa.push(animateStripeBeam(tr,tc,false));}
        }
        if(pts>0){state.score+=pts;spawnFloatingScore(r1,c1,pts,'#a855f7');updateGoalProgress();}
        if(_sa.length){await Promise.all(_sa);spawnScreenShake(12);}
        if (_matchEpoch !== _myEpoch) return;
        const _ch=[];
        for(const k of _td){const[rr,cc]=k.split(',').map(Number);const cl=state.board[rr]?.[cc];if(!cl)continue;
          if(state.iceGrid[rr]?.[cc]){state.iceGrid[rr][cc]--;if(!state.iceGrid[rr][cc]){state.iceBroken++;updateQuestProgress('ice',1);}}
          _hitFrost(rr,cc);
          if(cl.bucket){}else if(cl.stone){cl.stone=false;cl.type=randGem();SFX.stoneBreak&&SFX.stoneBreak();state.stonesBroken++;spawnParticles(rr,cc,'#6b7280');updateQuestProgress('stones',1);breakAdjacentLava(rr,cc);}else if(cl.geode>0){_hitGeode(cl,rr,cc);}
          else if(cl.lava){destroyLava(rr,cc);breakAdjacentLava(rr,cc);}else if(cl.web){cl.web=false;SFX.webBreak&&SFX.webBreak();}
          else if(cl.locked){cl.locked=false;cl.anim={};spawnParticles(rr,cc,'#a78bfa',4);}else if(cl.chain>0){cl.chain--;spawnParticles(rr,cc,'#8899aa',cl.chain===0?6:3);if(cl.chain===0)rings.push({x:boardOffX+cc*cellSize+cellSize/2,y:boardOffY+rr*cellSize+cellSize/2,color:'rgba(100,140,170,0.8)',r:4,maxR:cellSize*1.0,life:1,lw:2});}
          else if(cl.sand>0){cl.sand=0;spawnParticles(rr,cc,'#b45309',6);}
          else if(cl.amber>0){_hitAmber(cl,rr,cc);}else if(cl.mystery){}
          else{if(cl.special!==SPECIAL.NONE)_ch.push({r:rr,c:cc,special:cl.special,type:cl.type});state.board[rr][cc]=null;breakAdjacentLava(rr,cc);}
          if(!cl.bucket){clearDirtAt(rr,cc);clearBricksAt(rr,cc,false);}
          if(cl.type>=0&&!cl.bucket)state.collectedGems[cl.type]=(state.collectedGems[cl.type]||0)+1;
        }
        for(const{r,c,special,type}of _ch){if(_matchEpoch!==_myEpoch)return;await triggerSpecial(r,c,special,type);}
        if (_matchEpoch !== _myEpoch) return;
        applyGravity();fillFromTop();await animateDrop();
      }
      updateGoalProgress();
      return;
    }
  } else if ((sp1===SPECIAL.STRIPE_H||sp1===SPECIAL.STRIPE_V)&&(sp2===SPECIAL.STRIPE_H||sp2===SPECIAL.STRIPE_V)) {
    // Крест: строка + столбец с двойной молнией
    const hRow=sp1===SPECIAL.STRIPE_H?r1:r2, hC=sp1===SPECIAL.STRIPE_H?c1:c2;
    const vCol=sp1===SPECIAL.STRIPE_V?c1:c2, vR=sp1===SPECIAL.STRIPE_V?r1:r2;
    addRow(hRow); addCol(vCol);
    spawnLightning(hRow,hC,true); spawnLightning(vR,vCol,false);
    await Promise.all([animateStripeBeam(hRow,hC,true),animateStripeBeam(vR,vCol,false)]);
    if (_matchEpoch !== _myEpoch) return;
    spawnScreenShake(12);
  } else if (sp1===SPECIAL.BOMB&&sp2===SPECIAL.BOMB) {
    // Super Bomb: same two-phase mechanics as regular BOMB but 5×5 radius
    const superBombCell={type:Math.max(0,_t1>=0?_t1:(_t2>=0?_t2:0)),special:SPECIAL.BOMB,anim:{}};
    state.board[r1][c1]=superBombCell;  // restore for gravity tracking
    await _bombPhase1_5x5(r1,c1);
    if (_matchEpoch !== _myEpoch) return;
    applyGravity(); fillFromTop(); await animateDrop();
    if (_matchEpoch !== _myEpoch) return;
    let _br=r1,_bc=c1;
    {let _found=false;for(let rr=0;rr<ROWS&&!_found;rr++)for(let cc=0;cc<COLS&&!_found;cc++){if(state.board[rr]?.[cc]===superBombCell){_br=rr;_bc=cc;_found=true;}}}
    if (state._inBonusExplosion) {
      spawnParticles(_br,_bc,'#cccccc',2); await new Promise(res=>setTimeout(res,_d(50)));
    } else {
      for(let i=0;i<3;i++){spawnParticles(_br,_bc,'#cccccc',2);await new Promise(res=>setTimeout(res,_d(150)));if(_matchEpoch!==_myEpoch)return;}
    }
    if (_matchEpoch !== _myEpoch) return;
    if (state.board[_br]?.[_bc]===superBombCell) state.board[_br][_bc]=null;
    await _bombBlast5x5(_br,_bc);
    return;
  } else if ((sp1===SPECIAL.BOMB&&(sp2===SPECIAL.STRIPE_H||sp2===SPECIAL.STRIPE_V))||
             ((sp1===SPECIAL.STRIPE_H||sp1===SPECIAL.STRIPE_V)&&sp2===SPECIAL.BOMB)) {
    // Stripe+Bomb: 3 строки И 3 столбца одновременно (крест)
    const wr=sp1===SPECIAL.BOMB?r1:r2, wc=sp1===SPECIAL.BOMB?c1:c2;
    addRow(wr-1); addRow(wr); addRow(wr+1);
    addCol(wc-1); addCol(wc); addCol(wc+1);
    spawnLightning(wr-1,wc,true); spawnLightning(wr,wc,true); spawnLightning(wr+1,wc,true);
    spawnLightning(wr,wc-1,false); spawnLightning(wr,wc,false); spawnLightning(wr,wc+1,false);
    await Promise.all([
      animateStripeBeam(wr-1,wc,true), animateStripeBeam(wr,wc,true), animateStripeBeam(wr+1,wc,true),
      animateStripeBeam(wr,wc-1,false), animateStripeBeam(wr,wc,false), animateStripeBeam(wr,wc+1,false)
    ]);
    if (_matchEpoch !== _myEpoch) return;
    spawnScreenShake(14);
  } else if (sp1===SPECIAL.ROCKET&&sp2===SPECIAL.ROCKET) {
    // Rocket+Rocket: destroy 3 priority targets
    const _rrCol=getSkinColor(_t1)||'#ff4040';
    for (let i=0;i<3;i++) {
      const t=findRocketTarget(); if(!t) break;
      await animateRocketFlight(r1,c1,t.r,t.c,_rrCol);
      if (_matchEpoch !== _myEpoch) return;
      spawnExplosionSparks(t.r,t.c,14,_rrCol);
      await animateRocketBlast(t.r,t.c,_rrCol);
      if (_matchEpoch !== _myEpoch) return;
      await explodeCell(t.r,t.c);
      if (_matchEpoch !== _myEpoch) return;
    }
    return;
  } else if ((sp1===SPECIAL.ROCKET&&(sp2===SPECIAL.STRIPE_H||sp2===SPECIAL.STRIPE_V))||
             ((sp1===SPECIAL.STRIPE_H||sp1===SPECIAL.STRIPE_V)&&sp2===SPECIAL.ROCKET)) {
    // Фейерверк+Молния: летит к цели, оттуда бьёт молния
    const strSp=sp1===SPECIAL.ROCKET?sp2:sp1;
    const rocketR=sp1===SPECIAL.ROCKET?r1:r2, rocketC=sp1===SPECIAL.ROCKET?c1:c2;
    const _rsCol=getSkinColor(sp1===SPECIAL.ROCKET?_t1:_t2)||'#ff4040';
    const tgt=findRocketTarget()||{r:r1,c:c1};
    await animateRocketFlight(rocketR,rocketC,tgt.r,tgt.c,_rsCol);
    if (_matchEpoch !== _myEpoch) return;
    spawnExplosionSparks(tgt.r,tgt.c,10,_rsCol);
    await animateStripeBeam(tgt.r,tgt.c,strSp===SPECIAL.STRIPE_H);
    if (_matchEpoch !== _myEpoch) return;
    spawnScreenShake(8);
    const sCells=[];
    if(strSp===SPECIAL.STRIPE_H) for(let cc=0;cc<COLS;cc++) sCells.push({r:tgt.r,c:cc});
    else for(let rr=0;rr<ROWS;rr++) sCells.push({r:rr,c:tgt.c});
    sCells.forEach(({r,c})=>{const cl=state.board[r]?.[c];if(cl&&!cl.stone){const g=GEMS[cl.type];if(g)spawnParticles(r,c,getSkinColor(cl.type),6);}});
    await animateDestroyWave(sCells,tgt.r,tgt.c);
    if (_matchEpoch !== _myEpoch) return;
    let sPts=0;
    for(const{r,c}of sCells){const cl=state.board[r]?.[c];if(!cl)continue;if(state.iceGrid[r]?.[c]){state.iceGrid[r][c]--;if(!state.iceGrid[r][c]){state.iceBroken++;updateQuestProgress('ice',1);}}_hitFrost(r,c);if(cl.bucket){}else if(cl.stone){cl.stone=false;cl.type=randGem();SFX.stoneBreak&&SFX.stoneBreak();state.stonesBroken++;spawnParticles(r,c,'#6b7280');updateQuestProgress('stones',1);breakAdjacentLava(r,c);}else if(cl.geode>0){_hitGeode(cl,r,c);}else if(cl.lava){destroyLava(r,c);breakAdjacentLava(r,c);}else if(cl.web){cl.web=false;SFX.webBreak&&SFX.webBreak();}else if(cl.locked){cl.locked=false;cl.anim={};spawnParticles(r,c,'#a78bfa',4);}else if(cl.chain>0){cl.chain--;spawnParticles(r,c,'#8899aa',cl.chain===0?6:3);if(cl.chain===0)rings.push({x:boardOffX+c*cellSize+cellSize/2,y:boardOffY+r*cellSize+cellSize/2,color:'rgba(100,140,170,0.8)',r:4,maxR:cellSize*1.0,life:1,lw:2});}else if(cl.sand>0){cl.sand=0;spawnParticles(r,c,'#b45309',6);}else if(cl.amber>0){_hitAmber(cl,r,c);}else if(cl.mystery){}else{state.board[r][c]=null;sPts+=30;breakAdjacentLava(r,c);}if(!cl.bucket){clearDirtAt(r,c);clearBricksAt(r,c,false);}if(cl.type>=0&&!cl.bucket)state.collectedGems[cl.type]=(state.collectedGems[cl.type]||0)+1;}
    if(sPts>0){state.score+=sPts;spawnFloatingScore(tgt.r,tgt.c,sPts,'#60a5fa');updateGoalProgress();}
    applyGravity();fillFromTop();await animateDrop();
    return;
  } else if ((sp1===SPECIAL.ROCKET&&sp2===SPECIAL.BOMB)||(sp1===SPECIAL.BOMB&&sp2===SPECIAL.ROCKET)) {
    // Фейерверк+Bomb: летит к цели, там взрыв 3×3
    const rocketR=sp1===SPECIAL.ROCKET?r1:r2, rocketC=sp1===SPECIAL.ROCKET?c1:c2;
    const _rbCol=getSkinColor(sp1===SPECIAL.ROCKET?_t1:_t2)||'#ff4040';
    const tgt=findRocketTarget()||{r:r1,c:c1};
    await animateRocketFlight(rocketR,rocketC,tgt.r,tgt.c,_rbCol);
    if (_matchEpoch !== _myEpoch) return;
    spawnExplosionSparks(tgt.r,tgt.c,16,'#7c3aed');
    await animateBombBlast(tgt.r,tgt.c); spawnScreenShake(12);
    if (_matchEpoch !== _myEpoch) return;
    const wCells=[];
    for(let dr=-1;dr<=1;dr++) for(let dc=-1;dc<=1;dc++){const nr=tgt.r+dr,nc=tgt.c+dc;if(nr>=0&&nr<ROWS&&nc>=0&&nc<COLS)wCells.push({r:nr,c:nc});}
    wCells.forEach(({r,c})=>{const cl=state.board[r]?.[c];if(cl&&!cl.stone){const g=GEMS[cl.type];if(g)spawnParticles(r,c,getSkinColor(cl.type),6);}});
    await animateDestroyWave(wCells,tgt.r,tgt.c);
    if (_matchEpoch !== _myEpoch) return;
    let wPts=0;
    for(const{r,c}of wCells){const cl=state.board[r]?.[c];if(!cl)continue;if(state.iceGrid[r]?.[c]){state.iceGrid[r][c]--;if(!state.iceGrid[r][c]){state.iceBroken++;updateQuestProgress('ice',1);}}_hitFrost(r,c);if(cl.bucket){}else if(cl.stone){cl.stone=false;cl.type=randGem();SFX.stoneBreak&&SFX.stoneBreak();state.stonesBroken++;spawnParticles(r,c,'#6b7280');updateQuestProgress('stones',1);breakAdjacentLava(r,c);}else if(cl.geode>0){_hitGeode(cl,r,c);}else if(cl.lava){destroyLava(r,c);breakAdjacentLava(r,c);}else if(cl.web){cl.web=false;SFX.webBreak&&SFX.webBreak();}else if(cl.locked){cl.locked=false;cl.anim={};spawnParticles(r,c,'#a78bfa',4);}else if(cl.chain>0){cl.chain--;spawnParticles(r,c,'#8899aa',cl.chain===0?6:3);if(cl.chain===0)rings.push({x:boardOffX+c*cellSize+cellSize/2,y:boardOffY+r*cellSize+cellSize/2,color:'rgba(100,140,170,0.8)',r:4,maxR:cellSize*1.0,life:1,lw:2});}else if(cl.sand>0){cl.sand=0;spawnParticles(r,c,'#b45309',6);}else if(cl.amber>0){_hitAmber(cl,r,c);}else if(cl.mystery){}else{state.board[r][c]=null;wPts+=50;breakAdjacentLava(r,c);}if(!cl.bucket){clearDirtAt(r,c);clearBricksAt(r,c,false);}if(cl.type>=0&&!cl.bucket)state.collectedGems[cl.type]=(state.collectedGems[cl.type]||0)+1;}
    if(wPts>0){state.score+=wPts;spawnFloatingScore(tgt.r,tgt.c,wPts,'#7c3aed');updateGoalProgress();}
    applyGravity();fillFromTop();await animateDrop();
    return;
  } else {
    await triggerSpecial(r1,c1,sp1);
    if (_matchEpoch !== _myEpoch) return;
    await triggerSpecial(r2,c2,sp2);
    return;
  }
  if (_matchEpoch !== _myEpoch) return;
  const cells=[...td].map(k=>{const [r,c]=k.split(',').map(Number);return{r,c};});
  spawnScreenShake();
  cells.forEach(({r,c})=>{const cl=state.board[r]?.[c];if(cl&&!cl.stone){const g=GEMS[cl.type];if(g)spawnParticles(r,c,getSkinColor(cl.type),5);}});
  spawnExplosionSparks(r1,c1,20,'#a855f7');
  await animateDestroyWave(cells,r1,c1);
  if (_matchEpoch !== _myEpoch) return;
  let comboPts=0;
  for(const{r,c}of cells){
    const cl=state.board[r]?.[c];if(!cl)continue;
    if(state.iceGrid[r]?.[c]){state.iceGrid[r][c]--;if(!state.iceGrid[r][c]){state.iceBroken++;updateQuestProgress('ice',1);}}
    _hitFrost(r,c);
    if(cl.bucket){ /* ингредиенты не уничтожаются комбо-взрывами */ }
    else if(cl.stone){cl.stone=false;cl.type=randGem();SFX.stoneBreak&&SFX.stoneBreak();state.stonesBroken++;spawnParticles(r,c,'#6b7280');updateQuestProgress('stones',1);breakAdjacentLava(r,c);}else if(cl.geode>0){_hitGeode(cl,r,c);}
    else if(cl.lava){destroyLava(r,c);breakAdjacentLava(r,c);}
    else if(cl.web){cl.web=false;SFX.webBreak&&SFX.webBreak();}
    else if(cl.locked){cl.locked=false;cl.anim={};spawnParticles(r,c,'#a78bfa',4);}
    else if(cl.chain>0){cl.chain--;spawnParticles(r,c,'#8899aa',cl.chain===0?6:3);if(cl.chain===0)rings.push({x:boardOffX+c*cellSize+cellSize/2,y:boardOffY+r*cellSize+cellSize/2,color:'rgba(100,140,170,0.8)',r:4,maxR:cellSize*1.0,life:1,lw:2});}
    else if(cl.sand>0){cl.sand=0;spawnParticles(r,c,'#b45309',6);}
    else if(cl.amber>0){_hitAmber(cl,r,c);}
    else if(cl.mystery){/* mystery иммунен к прямым взрывам */}
    else{state.board[r][c]=null; comboPts+=50; breakAdjacentLava(r,c);}
    if(!cl.bucket){clearDirtAt(r,c);clearBricksAt(r,c,false);}
    if(cl.type>=0&&!cl.bucket)state.collectedGems[cl.type]=(state.collectedGems[cl.type]||0)+1;
  }
  if(comboPts>0){state.score+=comboPts; const mid=cells[Math.floor(cells.length/2)]; if(mid)spawnFloatingScore(mid.r,mid.c,comboPts,'#a855f7'); updateGoalProgress();}
}

// ── Анимация вспышки бомбы ──────────────────────────────────────────────
function animateBombBlast(r,c) {
  return new Promise(res=>{
    const bx=boardOffX+c*cellSize+cellSize/2, by=boardOffY+r*cellSize+cellSize/2;
    const dur=220, t0=performance.now(), _ep=_matchEpoch, id=++_animOverlayId;
    _animOverlays.set(id,(now)=>{
      if (_matchEpoch!==_ep) { _animOverlays.delete(id); res(); return; }
      if (state.screen!=='game') { _animOverlays.delete(id); res(); return; }
      const t=Math.min((now-t0)/dur,1);
      ctx.save();
      if (t<0.25) {
        ctx.globalAlpha=(0.25-t)/0.25*0.9;
        const grd=ctx.createRadialGradient(bx,by,0,bx,by,cellSize*1.1);
        grd.addColorStop(0,'#fff'); grd.addColorStop(0.5,'rgba(255,200,50,0.8)'); grd.addColorStop(1,'rgba(255,80,0,0)');
        ctx.fillStyle=grd; ctx.beginPath(); ctx.arc(bx,by,cellSize*1.1,0,Math.PI*2); ctx.fill();
      }
      [0,0.15].forEach((off,i)=>{
        const lt=Math.min(Math.max(t-off,0)/(1-off||0.01),1);
        ctx.globalAlpha=Math.max(0,(1-lt)*0.85);
        ctx.strokeStyle=`rgba(255,${180-i*60},${i*20},${1-lt})`;
        ctx.lineWidth=(5-i*2)*(1-lt)+1;
        ctx.shadowColor='rgba(255,150,0,0.8)'; ctx.shadowBlur=10;
        ctx.beginPath(); ctx.arc(bx,by,cellSize*(0.4+lt*1.9+i*0.25),0,Math.PI*2); ctx.stroke();
      });
      ctx.restore();
      if (t>=1) { _animOverlays.delete(id); res(); }
    });
  });
}

// ── Взрыв флэра — вспышка + цветной дым ─────────────────────────────────
function animateRocketBlast(r,c,gemColor) {
  gemColor = gemColor || '#ff4040';
  return new Promise(res=>{
    const bx=boardOffX+c*cellSize+cellSize/2, by=boardOffY+r*cellSize+cellSize/2;
    const dur=420, t0=performance.now(), _ep=_matchEpoch, id=++_animOverlayId;
    // Искры разлетаются при взрыве
    const numSparks=16;
    const sparkAngles=Array.from({length:numSparks},(_,i)=>i*Math.PI*2/numSparks+(Math.random()-0.5)*0.3);
    const sparkSpeeds=Array.from({length:numSparks},()=>cellSize*(0.8+Math.random()*0.9));
    _animOverlays.set(id,(now)=>{
      if (_matchEpoch!==_ep) { _animOverlays.delete(id); res(); return; }
      if (state.screen!=='game') { _animOverlays.delete(id); res(); return; }
      const t=Math.min((now-t0)/dur,1);
      ctx.save();
      // Яркая вспышка в цвет флэра
      if (t<0.30) {
        const fl=(0.30-t)/0.30;
        ctx.globalAlpha=fl*0.95;
        const grd=ctx.createRadialGradient(bx,by,0,bx,by,cellSize*1.6);
        grd.addColorStop(0,'#ffffff');
        grd.addColorStop(0.20,'rgba(255,255,220,0.95)');
        grd.addColorStop(0.55, gemColor.startsWith('#') ? (gemColor.length<7?`#${gemColor[1]}${gemColor[1]}${gemColor[2]}${gemColor[2]}${gemColor[3]}${gemColor[3]}b2`:gemColor+'b2') : gemColor.replace(/,[\d.]+\)$/,',0.70)'));
        grd.addColorStop(1,'rgba(0,0,0,0)');
        ctx.fillStyle=grd; ctx.beginPath(); ctx.arc(bx,by,cellSize*1.6,0,Math.PI*2); ctx.fill();
      }
      // Расширяющееся кольцо дыма в цвет флэра
      [0, 0.12, 0.26].forEach((off,i)=>{
        const lt=Math.min(Math.max(t-off,0)/(1-off||0.01),1);
        ctx.globalAlpha=Math.max(0,(1-lt)*0.72*(1-i*0.18));
        ctx.strokeStyle=i===0 ? '#ffffff' : gemColor;
        ctx.lineWidth=Math.max(1,(5-i*1.5)*(1-lt)+0.5);
        ctx.shadowColor=i===0 ? '#fff' : gemColor; ctx.shadowBlur=cellSize*0.35*(1-lt);
        ctx.beginPath(); ctx.arc(bx,by,cellSize*(0.15+lt*1.85+i*0.22),0,Math.PI*2); ctx.stroke();
      });
      ctx.shadowBlur=0;
      // Искры разлетаются в стороны
      const progress=Math.max(0,(t-0.05)/0.95);
      ctx.lineCap='round';
      sparkAngles.forEach((ang,i)=>{
        const lt=Math.min(progress,1);
        const len=sparkSpeeds[i]*Math.pow(lt,0.65);
        const alpha=Math.max(0,(1-lt*1.1)*0.90);
        ctx.globalAlpha=alpha;
        ctx.strokeStyle=i%3===0 ? '#ffffff' : i%3===1 ? gemColor : 'rgba(255,255,200,0.9)';
        ctx.lineWidth=Math.max(1,(1-lt)*3.5+0.5);
        ctx.shadowColor=gemColor; ctx.shadowBlur=6*(1-lt);
        ctx.beginPath();
        ctx.moveTo(bx+Math.cos(ang)*cellSize*0.10, by+Math.sin(ang)*cellSize*0.10);
        ctx.lineTo(bx+Math.cos(ang)*len, by+Math.sin(ang)*len);
        ctx.stroke();
      });
      ctx.restore();
      if (t>=1) { _animOverlays.delete(id); res(); }
    });
  });
}

// ── Paint Barrel — цветная краска разлетается брызгами ───────────────────
function animateColoringWave(r,c,gemType) {
  const paintColor=(gemType!=null&&gemType>=0)?getSkinColor(gemType):null;
  return new Promise(res=>{
    const bx=boardOffX+c*cellSize+cellSize/2, by=boardOffY+r*cellSize+cellSize/2;
    const dur=_d(420), t0=performance.now(), _ep=_matchEpoch, id=++_animOverlayId;
    // Pre-generate paint drop trajectories
    const numDrops=22;
    const drops=Array.from({length:numDrops},(_,i)=>{
      const angle=i/numDrops*Math.PI*2+(Math.random()-0.5)*0.30;
      const dist=cellSize*(1.2+Math.random()*2.5);
      const delay=Math.random()*0.28;
      const color=paintColor||`hsl(${(i*47)%360|0},95%,60%)`;
      return {angle,dist,delay,color,sz:cellSize*(0.08+Math.random()*0.10)};
    });
    // Initial burst particles
    for(let i=0;i<14;i++){
      const a=Math.random()*Math.PI*2, sp=3+Math.random()*5;
      const col=paintColor||`hsl(${Math.random()*360|0},95%,58%)`;
      particles.push({x:bx+(Math.random()-0.5)*cellSize*0.3,y:by+(Math.random()-0.5)*cellSize*0.3,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp-2,color:col,life:0.72,r:3+Math.random()*5,smoke:true});
    }
    _animOverlays.set(id,(now)=>{
      if (_matchEpoch!==_ep) { _animOverlays.delete(id); res(); return; }
      if (state.screen!=='game') { _animOverlays.delete(id); res(); return; }
      const t=Math.min((now-t0)/dur,1);
      ctx.save();
      // Central burst flash
      if(t<0.22){
        const fl=(0.22-t)/0.22;
        ctx.globalAlpha=fl*0.88;
        const grd=ctx.createRadialGradient(bx,by,0,bx,by,cellSize*1.5);
        grd.addColorStop(0,'#ffffff');
        grd.addColorStop(0.30,paintColor||'rgba(200,120,255,0.8)');
        grd.addColorStop(1,'rgba(0,0,0,0)');
        ctx.fillStyle=grd; ctx.beginPath(); ctx.arc(bx,by,cellSize*1.5,0,Math.PI*2); ctx.fill();
      }
      // Expanding paint wave rings
      for(let i=0;i<3;i++){
        const off=i*0.08;
        const lt=Math.min(Math.max(t-off,0)/(1-off||0.01),1);
        const col=paintColor||`hsl(${(i*110)%360},100%,62%)`;
        ctx.globalAlpha=Math.max(0,(1-lt)*0.80*(1-i*0.15));
        ctx.strokeStyle=col; ctx.lineWidth=(6-i*1.8)*(1-lt)+0.4;
        ctx.shadowColor=col; ctx.shadowBlur=cellSize*0.30*(1-lt);
        ctx.beginPath(); ctx.arc(bx,by,cellSize*(0.22+lt*3.0+i*0.25),0,Math.PI*2); ctx.stroke();
      }
      ctx.shadowBlur=0;
      // Flying paint blobs on parabolic arcs
      drops.forEach(drop=>{
        const dt=Math.max(0,(t-drop.delay)/(1-drop.delay||0.01));
        if(dt<=0||dt>=1) return;
        const px=bx+Math.cos(drop.angle)*drop.dist*dt;
        const py=by+Math.sin(drop.angle)*drop.dist*dt - cellSize*0.65*Math.sin(dt*Math.PI);
        const alpha=dt>0.80?Math.max(0,(1-dt)/0.20):1;
        ctx.globalAlpha=alpha*0.90;
        ctx.fillStyle=drop.color; ctx.shadowColor=drop.color; ctx.shadowBlur=5;
        ctx.beginPath(); ctx.arc(px,py,drop.sz*(1-dt*0.35),0,Math.PI*2); ctx.fill();
        // Splat ellipse on landing
        if(dt>0.78){
          const st=(dt-0.78)/0.22;
          ctx.globalAlpha=alpha*(1-st)*0.60;
          ctx.beginPath(); ctx.ellipse(px,py+drop.sz*0.4,drop.sz*(1+st*2.8),drop.sz*(0.40-st*0.25),0,0,Math.PI*2); ctx.fill();
        }
      });
      ctx.shadowBlur=0; ctx.restore();
      if(t>=1) { _animOverlays.delete(id); res(); }
    });
  });
}

// ── Полный сброс поля — Rainbow+Rainbow ──────────────────────────────────
function animateFullBoardClear(r,c) {
  return new Promise(res=>{
    const bx=boardOffX+c*cellSize+cellSize/2, by=boardOffY+r*cellSize+cellSize/2;
    const dur=_d(560), t0=performance.now(), _ep=_matchEpoch, id=++_animOverlayId;
    const cols=['#ffffff','#ff80ff','#80ffff','#ffff80','#ff9090','#90ff90'];
    for(let i=0;i<48;i++){
      const a=Math.random()*Math.PI*2, sp=3+Math.random()*7;
      particles.push({x:bx+(Math.random()-0.5)*COLS*cellSize*0.6,y:by+(Math.random()-0.5)*ROWS*cellSize*0.4,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp-3,color:cols[Math.random()*cols.length|0],life:0.90,r:2.5+Math.random()*5,star:true});
    }
    _animOverlays.set(id,(now)=>{
      if (_matchEpoch!==_ep) { _animOverlays.delete(id); res(); return; }
      if (state.screen!=='game') { _animOverlays.delete(id); res(); return; }
      const t=Math.min((now-t0)/dur,1);
      ctx.save();
      // White flash
      if(t<0.20){
        ctx.globalAlpha=(0.20-t)/0.20*0.95;
        ctx.fillStyle='#ffffff';
        ctx.fillRect(boardOffX,boardOffY,COLS*cellSize,ROWS*cellSize);
      }
      // 8 rainbow energy rings expanding from center
      for(let i=0;i<8;i++){
        const off=i*0.055;
        const lt=Math.min(Math.max(t-off,0)/(1-off||0.01),1);
        const hue=(i*45+t*200)%360;
        ctx.globalAlpha=Math.max(0,(1-lt)*0.82*(1-i*0.06));
        ctx.strokeStyle=`hsl(${hue},100%,68%)`;
        ctx.lineWidth=(10-i)*(1-lt)+0.5;
        ctx.shadowColor=`hsl(${hue},100%,68%)`; ctx.shadowBlur=cellSize*0.45*(1-lt);
        ctx.beginPath(); ctx.arc(bx,by,cellSize*(0.08+lt*7.0+i*0.28),0,Math.PI*2); ctx.stroke();
      }
      ctx.shadowBlur=0; ctx.restore();
      if(t>=1) { _animOverlays.delete(id); res(); }
    });
  });
}

// ── Анимация бура — два прохода в разные стороны ──────────────────────
function animateStripeBeam(r, c, horizontal) {
  return new Promise(res => {
    const dur = _d(320), t0 = performance.now(), _ep = _matchEpoch, id = ++_animOverlayId;
    const sx = boardOffX + c*cellSize + cellSize/2;
    const sy = boardOffY + r*cellSize + cellSize/2;
    const maxDist = (horizontal ? COLS : ROWS) * cellSize * 1.08;
    const dustSpawned = new Set();
    _animOverlays.set(id, (now) => {
      if (_matchEpoch !== _ep) { _animOverlays.delete(id); res(); return; }
      if (state.screen !== 'game') { _animOverlays.delete(id); res(); return; }
      const t = Math.min((now - t0) / dur, 1);
      ctx.save();
      // Вспышка по строке/столбцу в начале (t<0.22)
      const flashAlpha = Math.max(0, 0.65 * (1 - t * 4.0));
      if (flashAlpha > 0) {
        ctx.globalAlpha = flashAlpha;
        ctx.fillStyle = 'rgba(220,168,40,0.60)';
        if (horizontal) ctx.fillRect(boardOffX, boardOffY+r*cellSize, cellSize*COLS, cellSize);
        else            ctx.fillRect(boardOffX+c*cellSize, boardOffY, cellSize, cellSize*ROWS);
        ctx.globalAlpha = 1;
      }
      // Два бура — левый/правый (или вверх/вниз)
      const dirs = horizontal ? [[-1,0],[1,0]] : [[0,-1],[0,1]];
      for (const [dx, dy] of dirs) {
        const dist = t * maxDist;
        const px = sx + dx * dist;
        const py = sy + dy * dist;
        // Пыль, искры и дым в местах пробоя клеток
        const cellIdx = Math.floor(dist / cellSize);
        const dustKey = (dx+2)*100 + cellIdx;
        if (!dustSpawned.has(dustKey) && cellIdx > 0) {
          dustSpawned.add(dustKey);
          // Коричневая каменная пыль
          for (let i = 0; i < 8; i++) {
            const a = Math.random()*Math.PI*2, sp = 3+Math.random()*6;
            const dc = `rgba(${100+Math.floor(Math.random()*80)},${70+Math.floor(Math.random()*50)},${20+Math.floor(Math.random()*30)},0.88)`;
            particles.push({ x:px+(Math.random()-0.5)*cellSize*0.3, y:py+(Math.random()-0.5)*cellSize*0.3, vx:Math.cos(a)*sp, vy:Math.sin(a)*sp-1.5, color:dc, life:0.80, r:2.5+Math.random()*4, dust:true });
          }
          // Белый дымок
          for (let i=0; i<3; i++) {
            particles.push({ x:px+(Math.random()-0.5)*cellSize*0.2, y:py+(Math.random()-0.5)*cellSize*0.2, vx:(Math.random()-0.5)*1.5, vy:-1.5-Math.random()*2, color:'rgba(230,230,230,0.7)', life:0.85, r:4+Math.random()*5, smoke:true });
          }
          // Чёрный дымок
          particles.push({ x:px, y:py, vx:(Math.random()-0.5)*1, vy:-1-Math.random()*1.5, color:'rgba(40,40,40,0.55)', life:0.70, r:5+Math.random()*6, smoke:true });
          // Яркие золотые искры
          for (let i=0; i<4; i++) {
            const a = Math.random()*Math.PI*2;
            particles.push({ x:px, y:py, vx:Math.cos(a)*(4+Math.random()*6), vy:Math.sin(a)*(4+Math.random()*6)-2, color:'#fff8a0', life:0.50, r:1.5+Math.random()*2.5, star:true });
          }
          // Оранжевые искры
          particles.push({ x:px, y:py, vx:(Math.random()-0.5)*10, vy:-3-Math.random()*5, color:'#ff9900', life:0.40, r:2+Math.random()*2, star:true });
        }
        if (px < boardOffX-cellSize || px > boardOffX+COLS*cellSize+cellSize ||
            py < boardOffY-cellSize || py > boardOffY+ROWS*cellSize+cellSize) continue;
        // Рисуем бур
        const drillAlpha = t < 0.82 ? 1 : (1-t)/0.18;
        ctx.globalAlpha = Math.max(0, drillAlpha);
        ctx.save();
        ctx.translate(px, py);
        const angle = Math.atan2(dy, dx);
        ctx.rotate(angle);
        const ds = cellSize * 0.46; // крупный бур — размером с клетку
        ctx.shadowColor = '#d0a010'; ctx.shadowBlur = ds*0.65;
        // Хвост-трейл с дымом
        const tg = ctx.createLinearGradient(-ds*0.6, 0, -ds*2.2, 0);
        tg.addColorStop(0, 'rgba(220,158,28,0.55)');
        tg.addColorStop(0.5,'rgba(160,100,10,0.25)');
        tg.addColorStop(1, 'rgba(80,40,0,0)');
        ctx.fillStyle = tg;
        ctx.fillRect(-ds*2.2, -ds*0.22, ds*1.65, ds*0.44);
        // Корпус бура (конус-тело)
        const bg = ctx.createLinearGradient(0, -ds*0.28, 0, ds*0.28);
        bg.addColorStop(0,   '#d4a020');
        bg.addColorStop(0.35,'#f0cc50');
        bg.addColorStop(0.7, '#b08018');
        bg.addColorStop(1,   '#7a5510');
        ctx.fillStyle = bg;
        ctx.beginPath();
        ctx.moveTo(ds*0.72, 0);          // остриё
        ctx.lineTo(-ds*0.32, -ds*0.28);
        ctx.lineTo(-ds*0.60, -ds*0.14);
        ctx.lineTo(-ds*0.60,  ds*0.14);
        ctx.lineTo(-ds*0.32,  ds*0.28);
        ctx.closePath(); ctx.fill();
        // Металлический блик (полоса света сверху)
        const mg = ctx.createLinearGradient(ds*0.3, -ds*0.28, -ds*0.3, -ds*0.05);
        mg.addColorStop(0, 'rgba(255,240,120,0.00)');
        mg.addColorStop(0.4,'rgba(255,255,210,0.85)');
        mg.addColorStop(1, 'rgba(255,220,80,0.15)');
        ctx.fillStyle = mg;
        ctx.beginPath();
        ctx.moveTo(ds*0.72, 0); ctx.lineTo(-ds*0.32,-ds*0.28);
        ctx.lineTo(-ds*0.60,-ds*0.14); ctx.lineTo(-ds*0.60,ds*0.14);
        ctx.lineTo(-ds*0.32,ds*0.28); ctx.closePath(); ctx.fill();
        // Спиральные пазы
        ctx.strokeStyle = 'rgba(50,30,5,0.60)'; ctx.lineWidth = Math.max(1.5, cellSize*0.022); ctx.lineCap='round';
        for (let i=0; i<4; i++) {
          const gx = -ds*0.55 + ds*1.10*i/4;
          const gw = ds*0.20;
          const gh = ds*(0.28-i*0.025);
          ctx.beginPath(); ctx.moveTo(gx, -gh); ctx.lineTo(gx+gw*0.5, 0); ctx.lineTo(gx, gh); ctx.stroke();
        }
        // Блестящее остриё
        ctx.shadowColor='#fff8c0'; ctx.shadowBlur=ds*0.4;
        ctx.fillStyle='rgba(255,248,180,0.90)';
        ctx.beginPath(); ctx.arc(ds*0.68, 0, ds*0.08, 0, Math.PI*2); ctx.fill();
        ctx.shadowBlur = 0;
        ctx.restore();
      }
      ctx.restore();
      if (t >= 1) { _animOverlays.delete(id); res(); }
    });
  });
}

// ── Сканнер — радарный импульс, захват целей, уничтожение ────────────────
function animateRainbowBurst(targetType, srcR, srcC) {
  if (srcR==null) srcR=Math.floor(ROWS/2); if (srcC==null) srcC=Math.floor(COLS/2);
  return new Promise(res=>{
    const targets=[];
    for (let r=0;r<ROWS;r++) for (let c=0;c<COLS;c++) {
      const cl=state.board[r]?.[c];
      if (cl&&(targetType===-1||cl.type===targetType||cl.special===SPECIAL.RAINBOW)) targets.push({r,c,cl,locked:false});
    }
    if (!targets.length) { res(); return; }
    const srcX=boardOffX+srcC*cellSize+cellSize/2, srcY=boardOffY+srcR*cellSize+cellSize/2;
    const maxDist=Math.hypot(Math.max(srcC,COLS-1-srcC)*cellSize+cellSize, Math.max(srcR,ROWS-1-srcR)*cellSize+cellSize)*1.15;
    const dur=_d(700), t0=performance.now(), _ep=_matchEpoch, id=++_animOverlayId;
    _animOverlays.set(id,(now)=>{
      if (_matchEpoch!==_ep) { _animOverlays.delete(id); targets.forEach(({cl})=>{cl.anim={};}); res(); return; }
      if (state.screen!=='game') { _animOverlays.delete(id); targets.forEach(({cl})=>{cl.anim={};}); res(); return; }
      const t=Math.min((now-t0)/dur,1);
      ctx.save();
      // Dark radar overlay — fades in/out
      const ova=0.20*Math.min(t*5,1)*Math.max(0,1-(t-0.78)/0.22);
      if(ova>0){ ctx.globalAlpha=ova; ctx.fillStyle='#001808'; ctx.fillRect(boardOffX,boardOffY,COLS*cellSize,ROWS*cellSize); }
      // Expanding scan ring (phase 0→0.65)
      const scanPhase=Math.min(t/0.65,1);
      const scanRadius=scanPhase*maxDist;
      // Glow trail
      ctx.globalAlpha=Math.max(0,(1-scanPhase)*0.28);
      ctx.strokeStyle='#00ff66'; ctx.lineWidth=cellSize*0.12; ctx.shadowBlur=0;
      ctx.beginPath(); ctx.arc(srcX,srcY,Math.max(0,scanRadius-cellSize*0.55),0,Math.PI*2); ctx.stroke();
      // Main scan ring
      ctx.globalAlpha=Math.max(0,(1-scanPhase*0.55)*0.95);
      ctx.strokeStyle='#00ff88'; ctx.lineWidth=2.8;
      ctx.shadowColor='#00ff88'; ctx.shadowBlur=cellSize*0.38;
      ctx.beginPath(); ctx.arc(srcX,srcY,Math.max(0,scanRadius),0,Math.PI*2); ctx.stroke();
      ctx.shadowBlur=0;
      // Lock-on targets as scan ring reaches them
      targets.forEach(target=>{
        const tx=boardOffX+target.c*cellSize+cellSize/2, ty=boardOffY+target.r*cellSize+cellSize/2;
        const dist=Math.hypot(tx-srcX,ty-srcY);
        if(dist<=scanRadius+cellSize*0.35&&!target.locked){
          target.locked=true;
          for(let i=0;i<5;i++){const a=Math.random()*Math.PI*2;particles.push({x:tx+(Math.random()-0.5)*cellSize*0.4,y:ty+(Math.random()-0.5)*cellSize*0.4,vx:Math.cos(a)*2.5,vy:Math.sin(a)*2.5-1,color:'#00ff88',life:0.55,r:1.8+Math.random()*2,star:true});}
        }
        if(target.locked){
          const fo=t>0.82?Math.max(0,(1-t)/0.18):1;
          const cs2=cellSize*0.38, arm=cs2*0.32;
          ctx.globalAlpha=0.90*fo;
          ctx.strokeStyle='#00ff88'; ctx.lineWidth=1.8; ctx.lineCap='square';
          ctx.shadowColor='#00ff88'; ctx.shadowBlur=7;
          ctx.beginPath();
          ctx.moveTo(tx-cs2,ty-cs2+arm); ctx.lineTo(tx-cs2,ty-cs2); ctx.lineTo(tx-cs2+arm,ty-cs2);
          ctx.moveTo(tx+cs2-arm,ty-cs2); ctx.lineTo(tx+cs2,ty-cs2); ctx.lineTo(tx+cs2,ty-cs2+arm);
          ctx.moveTo(tx+cs2,ty+cs2-arm); ctx.lineTo(tx+cs2,ty+cs2); ctx.lineTo(tx+cs2-arm,ty+cs2);
          ctx.moveTo(tx-cs2+arm,ty+cs2); ctx.lineTo(tx-cs2,ty+cs2); ctx.lineTo(tx-cs2,ty+cs2-arm);
          ctx.stroke();
          const pulse2=0.5+0.5*Math.sin(now/70+target.r*1.4+target.c*0.9);
          ctx.globalAlpha=0.62*fo; ctx.fillStyle='#00ff88'; ctx.shadowBlur=4;
          ctx.beginPath(); ctx.arc(tx,ty,cellSize*0.058*(0.6+pulse2*0.4),0,Math.PI*2); ctx.fill();
          ctx.shadowBlur=0;
          target.cl.anim={scale:1+Math.sin(now/55+target.r+target.c)*0.07};
        }
      });
      ctx.lineCap='butt'; ctx.restore();
      if(t>=1){ _animOverlays.delete(id); targets.forEach(({cl})=>{cl.anim={};}); res(); }
    });
  });
}

async function _bombPhase1(r, c) {
  const _myEpoch = _matchEpoch;
  const _td1=[];
  for(let dr=-1;dr<=1;dr++) for(let dc=-1;dc<=1;dc++){
    if(dr===0&&dc===0)continue;
    const nr=r+dr,nc=c+dc;if(nr>=0&&nr<ROWS&&nc>=0&&nc<COLS)_td1.push([nr,nc]);
  }
  const _cells1=_td1.map(([nr,nc])=>({r:nr,c:nc}));
  _cells1.forEach(({r:rr,c:cc})=>{const cl=state.board[rr]?.[cc];if(cl&&!cl.stone){const g=GEMS[cl.type];if(g)spawnParticles(rr,cc,getSkinColor(cl.type),8);}});
  spawnExplosionSparks(r,c,14,'#ec4899');spawnBombBeams(r,c,1,'rgba(236,72,153,0.9)');
  await animateBombBlast(r,c);spawnScreenShake(10);
  await animateDestroyWave(_cells1,r,c);
  const _ch1=[];let _pts1=0;
  for(const[nr,nc]of _td1){
    const cl=state.board[nr]?.[nc];if(!cl)continue;
    if(state.iceGrid[nr]?.[nc]){state.iceGrid[nr][nc]--;if(!state.iceGrid[nr][nc]){state.iceBroken++;updateQuestProgress('ice',1);}}
    _hitFrost(nr,nc);
    if(cl.bucket){}
    else if(cl.stone){cl.stone=false;cl.type=randGem();SFX.stoneBreak&&SFX.stoneBreak();state.stonesBroken++;spawnParticles(nr,nc,'#6b7280');updateQuestProgress('stones',1);breakAdjacentLava(nr,nc);}else if(cl.geode>0){_hitGeode(cl,nr,nc);}
    else if(cl.lava){destroyLava(nr,nc);breakAdjacentLava(nr,nc);}
    else if(cl.web){cl.web=false;SFX.webBreak&&SFX.webBreak();}
    else if(cl.locked){cl.locked=false;cl.anim={};spawnParticles(nr,nc,'#a78bfa',4);}
    else if(cl.chain>0){cl.chain--;spawnParticles(nr,nc,'#8899aa',cl.chain===0?6:3);if(cl.chain===0)rings.push({x:boardOffX+nc*cellSize+cellSize/2,y:boardOffY+nr*cellSize+cellSize/2,color:'rgba(100,140,170,0.8)',r:4,maxR:cellSize*1.0,life:1,lw:2});}
    else if(cl.sand>0){cl.sand=0;spawnParticles(nr,nc,'#b45309',6);}
    else if(cl.amber>0){_hitAmber(cl,nr,nc);}
    else if(cl.mystery){}
    else if(cl.bucket){}
    else{if(cl.special!==SPECIAL.NONE)_ch1.push({r:nr,c:nc,special:cl.special,type:cl.type});state.board[nr][nc]=null;_pts1+=30;breakAdjacentLava(nr,nc);}
    if(!cl.bucket){clearDirtAt(nr,nc);clearBricksAt(nr,nc,false);}
    if(cl.type>=0&&!cl.bucket)state.collectedGems[cl.type]=(state.collectedGems[cl.type]||0)+1;
  }
  if(_pts1>0){state.score+=_pts1;spawnFloatingScore(r,c,_pts1,'#ec4899');updateGoalProgress();}
  if(_ch1.length){
    if(_matchEpoch!==_myEpoch)return;
    const _ch1B=_ch1.filter(s=>s.special===SPECIAL.BOMB);
    const _ch1O=_ch1.filter(s=>s.special!==SPECIAL.BOMB);
    if(_ch1B.length) await Promise.all(_ch1B.map(({r:cr,c:cc})=>_bombBlast3x3(cr,cc)));
    if(_matchEpoch!==_myEpoch)return;
    for(const{r:cr,c:cc,special:sp,type:tp}of _ch1O){if(_matchEpoch!==_myEpoch)return;await triggerSpecial(cr,cc,sp,tp);}
  }
}

async function _bombBlast3x3(cr, cc) {
  const _myEpoch = _matchEpoch;
  const td=[];
  for(let dr=-1;dr<=1;dr++) for(let dc=-1;dc<=1;dc++){const nr=cr+dr,nc=cc+dc;if(nr>=0&&nr<ROWS&&nc>=0&&nc<COLS)td.push([nr,nc]);}
  const cells=td.map(([r,c])=>({r,c}));
  cells.forEach(({r,c})=>{const cl=state.board[r]?.[c];if(cl&&!cl.stone){const g=GEMS[cl.type];if(g)spawnParticles(r,c,getSkinColor(cl.type),8);}});
  spawnExplosionSparks(cr,cc,14,'#ec4899');
  spawnBombBeams(cr,cc,1,'rgba(236,72,153,0.9)');
  await animateBombBlast(cr,cc); spawnScreenShake(10);
  await animateDestroyWave(cells,cr,cc);
  const chains=[];let pts=0;
  for(const[r,c]of td){
    const cl=state.board[r]?.[c];if(!cl)continue;
    if(state.iceGrid[r]?.[c]){state.iceGrid[r][c]--;if(!state.iceGrid[r][c]){state.iceBroken++;updateQuestProgress('ice',1);}}
    _hitFrost(r,c);
    if(cl.bucket){}
    else if(cl.stone){cl.stone=false;cl.type=randGem();SFX.stoneBreak&&SFX.stoneBreak();state.stonesBroken++;spawnParticles(r,c,'#6b7280');updateQuestProgress('stones',1);breakAdjacentLava(r,c);}else if(cl.geode>0){_hitGeode(cl,r,c);}
    else if(cl.lava){destroyLava(r,c);breakAdjacentLava(r,c);}
    else if(cl.web){cl.web=false;SFX.webBreak&&SFX.webBreak();}
    else if(cl.locked){cl.locked=false;cl.anim={};spawnParticles(r,c,'#a78bfa',4);}
    else if(cl.chain>0){cl.chain--;spawnParticles(r,c,'#8899aa',cl.chain===0?6:3);if(cl.chain===0)rings.push({x:boardOffX+c*cellSize+cellSize/2,y:boardOffY+r*cellSize+cellSize/2,color:'rgba(100,140,170,0.8)',r:4,maxR:cellSize*1.0,life:1,lw:2});}
    else if(cl.sand>0){cl.sand=0;spawnParticles(r,c,'#b45309',6);}
    else if(cl.amber>0){_hitAmber(cl,r,c);}
    else if(cl.mycelium>0){cl.mycelium--;spawnParticles(r,c,'#f5e6ca',4);if(cl.mycelium===0){cl.type=randGem();state.myceliumBrokenThisMove=true;}}
    else if(cl.mystery){}
    else{if(cl.special!==SPECIAL.NONE)chains.push({r,c,special:cl.special,type:cl.type});state.board[r][c]=null;pts+=30;breakAdjacentLava(r,c);}
    if(!cl.bucket){clearDirtAt(r,c);clearBricksAt(r,c,false);}
    if(cl.type>=0&&!cl.bucket)state.collectedGems[cl.type]=(state.collectedGems[cl.type]||0)+1;
  }
  if(pts>0){state.score+=pts;spawnFloatingScore(cr,cc,pts,'#ec4899');updateGoalProgress();}
  if(!chains.length) return;
  if(_matchEpoch!==_myEpoch) return;
  // Чейн-бомбы взрываются сразу параллельно (ячейка уже обнулена — двухфазовый путь не нужен)
  const _chainBombs=chains.filter(s=>s.special===SPECIAL.BOMB);
  const _chainOther=chains.filter(s=>s.special!==SPECIAL.BOMB);
  if(_chainBombs.length) await Promise.all(_chainBombs.map(({r,c})=>_bombBlast3x3(r,c)));
  if(_matchEpoch!==_myEpoch) return;
  for(const{r,c,special:sp,type:tp}of _chainOther){if(_matchEpoch!==_myEpoch)return;await triggerSpecial(r,c,sp,tp);}
}

async function _bombPhase1_5x5(r, c) {
  const _myEpoch = _matchEpoch;
  const _td1=[];
  for(let dr=-2;dr<=2;dr++) for(let dc=-2;dc<=2;dc++){
    if(dr===0&&dc===0)continue;
    const nr=r+dr,nc=c+dc;if(nr>=0&&nr<ROWS&&nc>=0&&nc<COLS)_td1.push([nr,nc]);
  }
  const _cells1=_td1.map(([nr,nc])=>({r:nr,c:nc}));
  _cells1.forEach(({r:rr,c:cc})=>{const cl=state.board[rr]?.[cc];if(cl&&!cl.stone){const g=GEMS[cl.type];if(g)spawnParticles(rr,cc,getSkinColor(cl.type),8);}});
  spawnExplosionSparks(r,c,20,'#ec4899');spawnBombBeams(r,c,2,'rgba(236,72,153,0.9)');
  await animateBombBlast(r,c);spawnScreenShake(14);
  await animateDestroyWave(_cells1,r,c);
  const _ch1=[];let _pts1=0;
  for(const[nr,nc]of _td1){
    const cl=state.board[nr]?.[nc];if(!cl)continue;
    if(state.iceGrid[nr]?.[nc]){state.iceGrid[nr][nc]--;if(!state.iceGrid[nr][nc]){state.iceBroken++;updateQuestProgress('ice',1);}}
    _hitFrost(nr,nc);
    if(cl.bucket){}
    else if(cl.stone){cl.stone=false;cl.type=randGem();SFX.stoneBreak&&SFX.stoneBreak();state.stonesBroken++;spawnParticles(nr,nc,'#6b7280');updateQuestProgress('stones',1);breakAdjacentLava(nr,nc);}else if(cl.geode>0){_hitGeode(cl,nr,nc);}
    else if(cl.lava){destroyLava(nr,nc);breakAdjacentLava(nr,nc);}
    else if(cl.web){cl.web=false;SFX.webBreak&&SFX.webBreak();}
    else if(cl.locked){cl.locked=false;cl.anim={};spawnParticles(nr,nc,'#a78bfa',4);}
    else if(cl.chain>0){cl.chain--;spawnParticles(nr,nc,'#8899aa',cl.chain===0?6:3);if(cl.chain===0)rings.push({x:boardOffX+nc*cellSize+cellSize/2,y:boardOffY+nr*cellSize+cellSize/2,color:'rgba(100,140,170,0.8)',r:4,maxR:cellSize*1.0,life:1,lw:2});}
    else if(cl.sand>0){cl.sand=0;spawnParticles(nr,nc,'#b45309',6);}
    else if(cl.amber>0){_hitAmber(cl,nr,nc);}
    else if(cl.mystery){}
    else{if(cl.special!==SPECIAL.NONE)_ch1.push({r:nr,c:nc,special:cl.special,type:cl.type});state.board[nr][nc]=null;_pts1+=50;breakAdjacentLava(nr,nc);}
    if(!cl.bucket){clearDirtAt(nr,nc);clearBricksAt(nr,nc,false);}
    if(cl.type>=0&&!cl.bucket)state.collectedGems[cl.type]=(state.collectedGems[cl.type]||0)+1;
  }
  if(_pts1>0){state.score+=_pts1;spawnFloatingScore(r,c,_pts1,'#ec4899');updateGoalProgress();}
  if(_ch1.length){
    if(_matchEpoch!==_myEpoch)return;
    const _ch1B=_ch1.filter(s=>s.special===SPECIAL.BOMB);
    const _ch1O=_ch1.filter(s=>s.special!==SPECIAL.BOMB);
    if(_ch1B.length) await Promise.all(_ch1B.map(({r:cr,c:cc})=>_bombBlast3x3(cr,cc)));
    if(_matchEpoch!==_myEpoch)return;
    for(const{r:cr,c:cc,special:sp,type:tp}of _ch1O){if(_matchEpoch!==_myEpoch)return;await triggerSpecial(cr,cc,sp,tp);}
  }
}

async function _bombBlast5x5(cr, cc) {
  const td=[];
  for(let dr=-2;dr<=2;dr++) for(let dc=-2;dc<=2;dc++){const nr=cr+dr,nc=cc+dc;if(nr>=0&&nr<ROWS&&nc>=0&&nc<COLS)td.push([nr,nc]);}
  const cells=td.map(([r,c])=>({r,c}));
  cells.forEach(({r,c})=>{const cl=state.board[r]?.[c];if(cl&&!cl.stone){const g=GEMS[cl.type];if(g)spawnParticles(r,c,getSkinColor(cl.type),8);}});
  spawnExplosionSparks(cr,cc,20,'#ec4899');
  spawnBombBeams(cr,cc,2,'rgba(236,72,153,0.9)');
  await animateBombBlast(cr,cc); spawnScreenShake(14);
  await animateDestroyWave(cells,cr,cc);
  const chains=[];let pts=0;
  for(const[r,c]of td){
    const cl=state.board[r]?.[c];if(!cl)continue;
    if(state.iceGrid[r]?.[c]){state.iceGrid[r][c]--;if(!state.iceGrid[r][c]){state.iceBroken++;updateQuestProgress('ice',1);}}
    _hitFrost(r,c);
    if(cl.bucket){}
    else if(cl.stone){cl.stone=false;cl.type=randGem();SFX.stoneBreak&&SFX.stoneBreak();state.stonesBroken++;spawnParticles(r,c,'#6b7280');updateQuestProgress('stones',1);breakAdjacentLava(r,c);}else if(cl.geode>0){_hitGeode(cl,r,c);}
    else if(cl.lava){destroyLava(r,c);breakAdjacentLava(r,c);}
    else if(cl.web){cl.web=false;SFX.webBreak&&SFX.webBreak();}
    else if(cl.locked){cl.locked=false;cl.anim={};spawnParticles(r,c,'#a78bfa',4);}
    else if(cl.chain>0){cl.chain--;spawnParticles(r,c,'#8899aa',cl.chain===0?6:3);if(cl.chain===0)rings.push({x:boardOffX+c*cellSize+cellSize/2,y:boardOffY+r*cellSize+cellSize/2,color:'rgba(100,140,170,0.8)',r:4,maxR:cellSize*1.0,life:1,lw:2});}
    else if(cl.sand>0){cl.sand=0;spawnParticles(r,c,'#b45309',6);}
    else if(cl.amber>0){_hitAmber(cl,r,c);}
    else if(cl.mystery){}
    else{if(cl.special!==SPECIAL.NONE)chains.push({r,c,special:cl.special,type:cl.type});state.board[r][c]=null;pts+=50;breakAdjacentLava(r,c);}
    if(!cl.bucket){clearDirtAt(r,c);clearBricksAt(r,c,false);}
    if(cl.type>=0&&!cl.bucket)state.collectedGems[cl.type]=(state.collectedGems[cl.type]||0)+1;
  }
  if(pts>0){state.score+=pts;spawnFloatingScore(cr,cc,pts,'#ec4899');updateGoalProgress();}
  if(!chains.length) return;
  const _cb5=chains.filter(s=>s.special===SPECIAL.BOMB);
  const _co5=chains.filter(s=>s.special!==SPECIAL.BOMB);
  if(_cb5.length) await Promise.all(_cb5.map(({r,c})=>_bombBlast3x3(r,c)));
  for(const{r,c,special:sp,type:tp}of _co5)await triggerSpecial(r,c,sp,tp);
}

async function triggerSpecial(r,c,special,partnerType=-1) {
  const _myEpoch = _matchEpoch; // захватываем эпоху для прерывания при смене уровня
  updateQuestProgress('specials', 1);
  state.totalSpecials = (state.totalSpecials || 0) + 1;
  if (state.totalSpecials >=  5) unlockAchievement('special_5');
  if (state.totalSpecials >= 50) unlockAchievement('special_50');
  // Rainbow — при активации в цепочке взрывает все гемы целевого цвета
  if (special===SPECIAL.RAINBOW) {
    // When triggered standalone (no partner, colorless gem), pick most-common color on board
    function _mostCommonType() {
      const counts={}; let best=-1, bestN=0;
      for (let rr=0;rr<ROWS;rr++) for (let cc=0;cc<COLS;cc++) {
        const t=state.board[rr]?.[cc]?.type;
        if (t>=0) { counts[t]=(counts[t]||0)+1; if(counts[t]>bestN){bestN=counts[t];best=t;} }
      }
      return best>=0?best:Math.floor(Math.random()*_activeGemTypes);
    }
    const targetType = partnerType>=0 ? partnerType :
      ((state.board[r]?.[c]?.type ?? -1) >= 0 ? state.board[r][c].type : _mostCommonType());
    await animateRainbowBurst(targetType, r, c);
    if (_matchEpoch !== _myEpoch) return;
    let pts=0;
    const _rbChains=[];
    for (let rr=0;rr<ROWS;rr++) for (let cc=0;cc<COLS;cc++) {
      const cl=state.board[rr]?.[cc];
      if (cl && cl.type===targetType && !cl.stone && !cl.lava && !cl.bucket) {
        if(state.iceGrid[rr]?.[cc]){state.iceGrid[rr][cc]--;if(!state.iceGrid[rr][cc]){state.iceBroken++;updateQuestProgress('ice',1);}}
        _hitFrost(rr,cc);
        spawnParticles(rr,cc,getSkinColor(targetType),6);
        if (cl.special!==SPECIAL.NONE) _rbChains.push({r:rr,c:cc,special:cl.special,type:cl.type});
        clearDirtAt(rr,cc); clearBricksAt(rr,cc,false);
        if(cl.type>=0) state.collectedGems[cl.type]=(state.collectedGems[cl.type]||0)+1;
        breakAdjacentLava(rr,cc);
        state.board[rr][cc]=null; pts+=50;
      }
    }
    if (pts>0){state.score+=pts; updateGoalProgress();}
    // Все цепные спешлы взрываются одновременно (не по одному)
    if (_rbChains.length) await Promise.all(_rbChains.map(({r,c,special:sp,type:tp})=>triggerSpecial(r,c,sp,tp)));
    if (_matchEpoch !== _myEpoch) return;
    applyGravity(); fillFromTop(); await animateDrop();
    return;
  }
  // Coloring — перекрашивает все гемы своего цвета в цвет партнёра
  if (special===SPECIAL.COLORING) {
    const _clrGemType = state.board[r]?.[c]?.type ?? (partnerType >= 0 ? partnerType : -1);
    await animateColoringWave(r, c, _clrGemType);
    if (_matchEpoch !== _myEpoch) return;
    const cellOnBoard = state.board[r]?.[c];
    // srcColor: if cell has a real color use it; otherwise use partnerType; else random
    const srcColor = (cellOnBoard?.type >= 0) ? cellOnBoard.type
      : (partnerType >= 0 ? partnerType : Math.floor(Math.random()*_activeGemTypes));
    let painted=0;
    if (partnerType >= 0 && partnerType !== srcColor) {
      // Intentional player swap: paint all srcColor → partnerType (original mechanic)
      for (let rr=0;rr<ROWS;rr++) for (let cc=0;cc<COLS;cc++) {
        const cl=state.board[rr]?.[cc];
        if (cl&&cl.type===srcColor&&!cl.stone&&!cl.lava&&!cl.locked&&!cl.bucket) {
          cl.type=partnerType; painted++;
          spawnParticles(rr,cc,getSkinColor(partnerType),3);
        }
      }
      if (painted>0) { showToast('🎨 Перекрашено!'); drawBoard(); }
    } else {
      // Standalone / cascade: scatter srcColor gems across all other colors to keep board balanced
      // Greedy: each gem goes to whichever non-src color currently has the fewest gems
      const _sc = new Array(_activeGemTypes).fill(0);
      for (let rr=0;rr<ROWS;rr++) for (let cc=0;cc<COLS;cc++) {
        const t=state.board[rr]?.[cc]?.type; if(t>=0&&t<_activeGemTypes&&t!==srcColor) _sc[t]++;
      }
      for (let rr=0;rr<ROWS;rr++) for (let cc=0;cc<COLS;cc++) {
        const cl=state.board[rr]?.[cc];
        if (cl&&cl.type===srcColor&&!cl.stone&&!cl.lava&&!cl.locked&&!cl.bucket) {
          let best=-1, bestN=Infinity;
          for (let i=0;i<_activeGemTypes;i++) { if(i!==srcColor&&_sc[i]<bestN){bestN=_sc[i];best=i;} }
          if (best<0) best=(srcColor===0)?1:0;
          _sc[best]++;
          cl.type=best; painted++;
          spawnParticles(rr,cc,getSkinColor(best),3);
        }
      }
      if (painted>0) { showToast('🎨 Разброс!'); drawBoard(); }
    }
    return;
  }
  // BOMB — Candy Crush style: first blast around bomb (bomb stays), bomb falls, second blast at landing
  if (special===SPECIAL.BOMB) {
    const bombCell = state.board[r]?.[c];
    await _bombPhase1(r, c);
    if(_matchEpoch!==_myEpoch)return;
    // Bomb falls to new position
    applyGravity();fillFromTop();await animateDrop();
    if(_matchEpoch!==_myEpoch)return;
    // Find where bomb landed (track by object reference)
    let _br=r,_bc=c;
    if(bombCell){let _found=false;for(let rr=0;rr<ROWS&&!_found;rr++)for(let cc=0;cc<COLS&&!_found;cc++){if(state.board[rr]?.[cc]===bombCell){_br=rr;_bc=cc;_found=true;}}}
    // Smoke while waiting for second blast (shortened during bonus explosion)
    if (state._inBonusExplosion) {
      spawnParticles(_br,_bc,'#cccccc',2);
      await new Promise(res=>setTimeout(res,_d(50)));
    } else {
      for(let i=0;i<3;i++){spawnParticles(_br,_bc,'#cccccc',2);await new Promise(res=>setTimeout(res,_d(150)));if(_matchEpoch!==_myEpoch)return;}
    }
    if(_matchEpoch!==_myEpoch)return;
    // Phase 2: remove bomb and blast 3×3 at landed position
    if (bombCell && state.board[_br]?.[_bc] === bombCell) state.board[_br][_bc]=null;
    await _bombBlast3x3(_br,_bc);
    return;
  }
  // Rocket — flies to highest-priority target and destroys it
  if (special===SPECIAL.ROCKET) {
    const _rCol = getSkinColor(partnerType) || '#ff4040';
    const target=findRocketTarget();
    console.log('[DBG] ROCKET fire r='+r+' c='+c+' target='+JSON.stringify(target)+' color='+_rCol);
    if (target) {
      await animateRocketFlight(r,c,target.r,target.c,_rCol);
      console.log('[DBG] ROCKET flight done, epoch match='+ (_matchEpoch===_myEpoch));
      if (_matchEpoch !== _myEpoch) return;
      spawnExplosionSparks(target.r,target.c,18,_rCol);
      await animateRocketBlast(target.r,target.c,_rCol);
      console.log('[DBG] ROCKET blast done');
      if (_matchEpoch !== _myEpoch) return;
      await explodeCell(target.r,target.c);
      console.log('[DBG] ROCKET explodeCell done');
    }
    return;
  }
  const td=[];
  if (special===SPECIAL.STRIPE_H) for (let cc=0;cc<COLS;cc++) td.push([r,cc]);
  if (special===SPECIAL.STRIPE_V) for (let rr=0;rr<ROWS;rr++) td.push([rr,c]);
  // Порталы: стрипы продолжают весь ряд/столбец у выхода
  if (state.portalGrid && td.length > 0) {
    const _tdKeys=new Set(td.map(([tr,tc])=>`${tr},${tc}`));
    const _ext=[];
    for (const [tr,tc] of td) {
      const _p=state.portalGrid[tr]?.[tc]; if (!_p) continue;
      if (special===SPECIAL.STRIPE_H) {
        for (let ec=0;ec<COLS;ec++) { const k=`${_p.exitR},${ec}`; if(!_tdKeys.has(k)){_tdKeys.add(k);_ext.push([_p.exitR,ec]);} }
      } else if (special===SPECIAL.STRIPE_V) {
        for (let er=0;er<ROWS;er++) { const k=`${er},${_p.exitC}`; if(!_tdKeys.has(k)){_tdKeys.add(k);_ext.push([er,_p.exitC]);} }
      } else {
        const k=`${_p.exitR},${_p.exitC}`; if(!_tdKeys.has(k)){_tdKeys.add(k);_ext.push([_p.exitR,_p.exitC]);}
      }
    }
    td.push(..._ext);
  }
  if (!td.length) return;
  // Специфические анимации для каждого типа
  if (special===SPECIAL.STRIPE_H) { await animateStripeBeam(r,c,true); if (_matchEpoch !== _myEpoch) return; spawnScreenShake(6); }
  if (special===SPECIAL.STRIPE_V) { await animateStripeBeam(r,c,false); if (_matchEpoch !== _myEpoch) return; spawnScreenShake(6); }
  const cells=td.map(([rr,cc])=>({r:rr,c:cc}));
  cells.forEach(({r,c})=>{ const cl=state.board[r]?.[c]; if(cl&&!cl.stone) { const g=GEMS[cl.type]; if(g) spawnParticles(r,c,getSkinColor(cl.type),8); }});
  const useStripe=special===SPECIAL.STRIPE_H||special===SPECIAL.STRIPE_V;
  if (useStripe) await animateDestroyWave(cells,r,c);
  else await animateDestroy(cells);
  if (_matchEpoch !== _myEpoch) return;
  // Цепочка: собираем спешлы в зоне взрыва перед удалением (для последующего трига)
  const chainSpecials=[];
  let bonusPts=0;
  for (const [rr,cc] of td) {
    const cl=state.board[rr]?.[cc]; if (!cl) continue;
    if (state.iceGrid[rr]?.[cc]) { state.iceGrid[rr][cc]--; if(!state.iceGrid[rr][cc]){state.iceBroken++;updateQuestProgress('ice',1);} }
    _hitFrost(rr,cc);
    if (cl.bucket) { /* ингредиенты взрывами не уничтожаются — падают сами */ }
    else if (cl.stone) { cl.stone=false; cl.type=randGem(); SFX.stoneBreak&&SFX.stoneBreak(); state.stonesBroken++; spawnParticles(rr,cc,'#6b7280'); updateQuestProgress('stones',1); breakAdjacentLava(rr,cc); }else if (cl.geode > 0) { _hitGeode(cl,rr,cc); }
    else if (cl.lava) { destroyLava(rr, cc); breakAdjacentLava(rr, cc); }
    else if (cl.web) { cl.web=false; SFX.webBreak&&SFX.webBreak(); }
    else if (cl.locked) { cl.locked=false; cl.anim={}; spawnParticles(rr,cc,'#a78bfa',4); }
    else if (cl.chain > 0) { cl.chain--; spawnParticles(rr,cc,'#8899aa',cl.chain===0?6:3); if(cl.chain===0)rings.push({x:boardOffX+cc*cellSize+cellSize/2,y:boardOffY+rr*cellSize+cellSize/2,color:'rgba(100,140,170,0.8)',r:4,maxR:cellSize*1.0,life:1,lw:2}); }
    else if (cl.sand > 0) { cl.sand=0; spawnParticles(rr,cc,'#b45309',6); }
    else if (cl.amber > 0) { _hitAmber(cl,rr,cc); }
    else if (cl.mycelium > 0) { cl.mycelium--; spawnParticles(rr,cc,'#f5e6ca',4); if(cl.mycelium===0){cl.type=randGem();state.myceliumBrokenThisMove=true;} }
    else if (cl.mystery) { /* mystery иммунен к прямым взрывам */ }
    else {
      if (cl.special!==SPECIAL.NONE) chainSpecials.push({r:rr,c:cc,special:cl.special,type:cl.type});
      state.board[rr][cc]=null;
      bonusPts+=30;
      breakAdjacentLava(rr, cc);
    }
    if (!cl.bucket) { clearDirtAt(rr, cc); clearBricksAt(rr, cc, false); }
    if (cl.type>=0 && !cl.bucket) state.collectedGems[cl.type]=(state.collectedGems[cl.type]||0)+1;
  }
  // Начисляем очки за взрыв
  if (bonusPts>0) {
    state.score+=bonusPts;
    const mid=cells[Math.floor(cells.length/2)];
    if(mid) spawnFloatingScore(mid.r,mid.c,bonusPts,'#f97316');
    updateGoalProgress();
  }
  // Тригерим спешлы, попавшие в зону взрыва
  // Чейн-бомбы взрываются сразу (ячейка уже null — двухфазовый путь не нужен)
  if(!chainSpecials.length) return;
  if (_matchEpoch !== _myEpoch) return;
  const _csBombs=chainSpecials.filter(s=>s.special===SPECIAL.BOMB);
  const _csOther=chainSpecials.filter(s=>s.special!==SPECIAL.BOMB);
  if(_csBombs.length) await Promise.all(_csBombs.map(({r,c})=>_bombBlast3x3(r,c)));
  if (_matchEpoch !== _myEpoch) return;
  for (const {r,c,special,type} of _csOther) {
    if (_matchEpoch !== _myEpoch) return;
    await triggerSpecial(r,c,special,type);
  }
}

// ══════════════════════════════════════════
//  МИСТИЧЕСКИЙ КОНТЕЙНЕР (MYSTERY)
// ══════════════════════════════════════════
function popMystery(r, c) {
  const cl = state.board[r]?.[c]; if (!cl || !cl.mystery) return;
  const roll = Math.random();
  const newSpecial =
    roll < 0.30 ? SPECIAL.STRIPE_H :
    roll < 0.60 ? SPECIAL.STRIPE_V :
    roll < 0.85 ? SPECIAL.BOMB  :
    SPECIAL.RAINBOW;
  const newGem = createGem();
  newGem.special = newSpecial;
  state.board[r][c] = newGem;
  SFX.mysteryReveal && SFX.mysteryReveal();
  spawnParticles(r, c, '#d8b4fe', 8);
  // Golden flash ring
  rings.push({ x:boardOffX+c*cellSize+cellSize/2, y:boardOffY+r*cellSize+cellSize/2,
    color:'rgba(255,215,0,0.9)', r:4, maxR:cellSize*1.1, life:1, lw:3 });
  showToast('📦 Сюрприз!');
}

function popFlask(r, c) {
  const cl = state.board[r]?.[c]; if (!cl || !cl.flask) return;
  cl.flask = false;
  state.flasksBroken++;
  // Расширяем сода-зону пропорционально: все колбы → вода до верха
  { const _bl = getLevel(state.currentLevel);
    const _bn = Math.max(1, _bl?.flaskCount || 1);
    const _bi = Math.min(2, Math.floor(_bn / 2) + 1);
    state.floodLevel = Math.min(ROWS, _bi + Math.round((ROWS - _bi) * state.flasksBroken / _bn)); }
  spawnParticles(r, c, '#38bdf8', 8);
  rings.push({ x:boardOffX+c*cellSize+cellSize/2, y:boardOffY+r*cellSize+cellSize/2,
    color:'rgba(56,189,248,0.9)', r:4, maxR:cellSize*1.2, life:1, lw:3 });
  showToast('🥤 Газировка!');
  updateGoalProgress();
}

// ══════════════════════════════════════════
//  РАКЕТА (ROCKET)
// ══════════════════════════════════════════
function findRocketTarget(exclude=null) {
  // Priority: dirt-2 > dirt-1 > ice > stone > lava > random gem
  const check=(fn)=>{
    for (let r=0;r<ROWS;r++) for (let c=0;c<COLS;c++) {
      if (state.holes.has(`${r},${c}`)) continue;
      if (exclude&&exclude.has(`${r},${c}`)) continue;
      if (fn(r,c)) return {r,c};
    }
    return null;
  };
  return check((r,c)=>state.dirtGrid?.[r]?.[c]>=2)
      || check((r,c)=>state.dirtGrid?.[r]?.[c]>=1)
      || check((r,c)=>state.iceGrid?.[r]?.[c])
      || check((r,c)=>state.board[r]?.[c]?.stone)
      || check((r,c)=>state.board[r]?.[c]?.lava)
      || (()=>{
           const gems=[];
           for (let r=0;r<ROWS;r++) for (let c=0;c<COLS;c++) {
             if (state.holes.has(`${r},${c}`)) continue;
             const cl=state.board[r]?.[c];
             if (cl&&!cl.stone&&!cl.lava&&cl.type>=0) gems.push({r,c});
           }
           return gems.length?gems[Math.floor(Math.random()*gems.length)]:null;
         })();
}

function animateRocketFlight(fromR,fromC,toR,toC,gemColor) {
  gemColor = gemColor || '#ff4040';
  return new Promise(res=>{
    const dur=_d(440), t0=performance.now();
    const fx=boardOffX+fromC*cellSize+cellSize/2, fy=boardOffY+fromR*cellSize+cellSize/2;
    const tx=boardOffX+toC*cellSize+cellSize/2,   ty=boardOffY+toR*cellSize+cellSize/2;
    const mx=(fx+tx)/2, my=(fy+ty)/2;
    const arcH=Math.max(cellSize*2, Math.hypot(tx-fx,ty-fy)*0.55);
    const cpx=mx, cpy=my-arcH;
    const trail=[];
    function bezier(t){ return { x:(1-t)*(1-t)*fx+2*(1-t)*t*cpx+t*t*tx, y:(1-t)*(1-t)*fy+2*(1-t)*t*cpy+t*t*ty }; }
    function bezierTangent(t){ return { dx:2*(1-t)*(cpx-fx)+2*t*(tx-cpx), dy:2*(1-t)*(cpy-fy)+2*t*(ty-cpy) }; }
    const _ep=_matchEpoch, id=++_animOverlayId;
    _animOverlays.set(id,(now)=>{
      if (_matchEpoch!==_ep) { _animOverlays.delete(id); res(); return; }
      if (state.screen!=='game') { _animOverlays.delete(id); res(); return; }
      const t=Math.min((now-t0)/dur,1);
      const {x:px,y:py}=bezier(t);
      const {dx,dy}=bezierTangent(t);
      const angle=Math.atan2(dy,dx);
      // Генерируем частицы трейла
      if (t<0.97) {
        // Серые дымовые клубы
        for (let i=0;i<3;i++) trail.push({
          x:px+(Math.random()-0.5)*cellSize*0.15, y:py+(Math.random()-0.5)*cellSize*0.15,
          vx:(Math.random()-0.5)*0.8, vy:-0.5-Math.random()*0.7,
          life:1, r:3+Math.random()*4.5, smoke:true
        });
        // Цветной светящийся туман (в цвет флэра)
        trail.push({
          x:px+(Math.random()-0.5)*cellSize*0.1, y:py+(Math.random()-0.5)*cellSize*0.1,
          vx:(Math.random()-0.5)*0.4, vy:-0.3,
          life:0.60, r:5+Math.random()*7, glow:true
        });
        // Белые искры от сопла
        if (Math.random()<0.5) {
          const ba=angle+Math.PI+( Math.random()-0.5)*0.8;
          trail.push({
            x:px-Math.cos(angle)*cellSize*0.22, y:py-Math.sin(angle)*cellSize*0.22,
            vx:Math.cos(ba)*(2+Math.random()*4), vy:Math.sin(ba)*(2+Math.random()*4),
            life:0.38, r:1.2+Math.random()*1.8, spark:true
          });
        }
      }
      ctx.save();
      // Отрисовка частиц трейла
      for (let i=trail.length-1;i>=0;i--) {
        const p=trail[i];
        p.x+=p.vx; p.y+=p.vy; p.vx*=0.91; p.vy*=0.91; p.life-=0.038;
        if (p.life<=0){trail.splice(i,1);continue;}
        if (p.smoke) {
          const sr=p.r*(1+0.85*(1-p.life));
          const sg=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,sr);
          sg.addColorStop(0,`rgba(200,195,190,${(p.life*0.52).toFixed(2)})`);
          sg.addColorStop(0.45,`rgba(110,105,100,${(p.life*0.28).toFixed(2)})`);
          sg.addColorStop(1,'rgba(0,0,0,0)');
          ctx.fillStyle=sg; ctx.beginPath(); ctx.arc(p.x,p.y,sr,0,Math.PI*2); ctx.fill();
        } else if (p.glow) {
          const gg=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,p.r);
          gg.addColorStop(0,gemColor); gg.addColorStop(1,'rgba(0,0,0,0)');
          ctx.globalAlpha=p.life*0.30; ctx.fillStyle=gemColor;
          ctx.shadowColor=gemColor; ctx.shadowBlur=p.r*0.6;
          ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2); ctx.fill();
          ctx.shadowBlur=0;
        } else if (p.spark) {
          ctx.globalAlpha=p.life*0.95;
          ctx.fillStyle='rgba(255,255,230,0.96)';
          ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2); ctx.fill();
        }
        ctx.globalAlpha=1;
      }
      ctx.globalAlpha=1;
      // Рисуем сигнальный флэр
      ctx.save();
      ctx.translate(px,py);
      ctx.rotate(angle+Math.PI/2); // нос вперёд
      const fs=cellSize*0.40;
      const flicker=0.85+0.15*Math.sin(Date.now()/32);
      // Горящий хвост сопла (снизу после поворота)
      const flameH=fs*(0.60+0.22*Math.sin(Date.now()/48));
      ctx.shadowColor=gemColor; ctx.shadowBlur=fs*1.0*flicker;
      const fg=ctx.createLinearGradient(0,fs*0.20,0,fs*0.20+flameH);
      fg.addColorStop(0,'rgba(255,255,245,0.99)');
      fg.addColorStop(0.18,'rgba(255,255,200,0.95)');
      fg.addColorStop(0.55,gemColor);
      fg.addColorStop(1,'rgba(0,0,0,0)');
      ctx.fillStyle=fg;
      ctx.beginPath(); ctx.ellipse(0,fs*0.20+flameH*0.50,fs*0.17,flameH*0.52,0,0,Math.PI*2); ctx.fill();
      // Внутреннее белое ядро пламени
      ctx.shadowBlur=0;
      const fi=ctx.createLinearGradient(0,fs*0.20,0,fs*0.20+flameH*0.45);
      fi.addColorStop(0,'rgba(255,255,255,0.99)'); fi.addColorStop(1,'rgba(255,255,220,0)');
      ctx.fillStyle=fi;
      ctx.beginPath(); ctx.ellipse(0,fs*0.20+flameH*0.18,fs*0.07,flameH*0.22,0,0,Math.PI*2); ctx.fill();
      // Цилиндрическое тело флэра в цвет фишки
      ctx.shadowColor=gemColor; ctx.shadowBlur=fs*0.45*flicker;
      const bodyG=ctx.createLinearGradient(-fs*0.20,0,fs*0.20,0);
      bodyG.addColorStop(0,'rgba(0,0,0,0.30)');
      bodyG.addColorStop(0.22,'rgba(255,255,255,0.38)');
      bodyG.addColorStop(0.55,gemColor);
      bodyG.addColorStop(1,'rgba(0,0,0,0.40)');
      ctx.fillStyle=gemColor;
      ctx.beginPath();
      ctx.moveTo(0,-fs*0.72);
      ctx.bezierCurveTo(-fs*0.18,-fs*0.60,-fs*0.20,-fs*0.05,-fs*0.18,fs*0.20);
      ctx.lineTo(fs*0.18,fs*0.20);
      ctx.bezierCurveTo(fs*0.20,-fs*0.05,fs*0.18,-fs*0.60,0,-fs*0.72);
      ctx.fill();
      // Блик на теле (вертикальная полоса)
      ctx.shadowBlur=0;
      ctx.globalAlpha=0.52;
      ctx.fillStyle='rgba(255,255,255,0.80)';
      ctx.beginPath();
      ctx.moveTo(-fs*0.05,-fs*0.62);
      ctx.bezierCurveTo(-fs*0.14,-fs*0.52,-fs*0.14,-fs*0.08,-fs*0.11,fs*0.12);
      ctx.bezierCurveTo(-fs*0.06,fs*0.16,-fs*0.02,-fs*0.08,fs*0.01,-fs*0.58);
      ctx.closePath(); ctx.fill();
      ctx.globalAlpha=1;
      // Горящий нос флэра (яркий белый огонь спереди)
      ctx.shadowColor='#ffffff'; ctx.shadowBlur=fs*0.5*flicker;
      const ng=ctx.createRadialGradient(0,-fs*0.68,0,0,-fs*0.68,fs*0.28);
      ng.addColorStop(0,'rgba(255,255,255,0.99)');
      ng.addColorStop(0.4,'rgba(255,255,230,0.75)');
      ng.addColorStop(1,'rgba(255,255,200,0)');
      ctx.fillStyle=ng;
      ctx.beginPath(); ctx.arc(0,-fs*0.68,fs*0.28,0,Math.PI*2); ctx.fill();
      ctx.shadowBlur=0;
      // Декоративная полоска на теле
      ctx.globalAlpha=0.28;
      ctx.fillStyle='rgba(0,0,0,0.6)';
      ctx.fillRect(-fs*0.18,-fs*0.10,fs*0.36,fs*0.07);
      ctx.globalAlpha=1;
      ctx.restore();
      ctx.restore();
      if (t>=1) { _animOverlays.delete(id); res(); }
    });
  });
}

async function explodeCell(r,c) {
  const cl=state.board[r]?.[c]; if(!cl) return;
  spawnParticles(r,c,getSkinColor(Math.max(0,cl.type))||'#00cccc',8);
  await animateDestroy([{r,c}]);
  if (state.iceGrid[r]?.[c]) { state.iceGrid[r][c]--; if(!state.iceGrid[r][c]){state.iceBroken++;updateQuestProgress('ice',1);} }
  _hitFrost(r,c);
  if (cl.bucket) { /* buckets fall on their own */ }
  else if (cl.stone) { cl.stone=false; cl.type=randGem(); SFX.stoneBreak&&SFX.stoneBreak(); state.stonesBroken++; spawnParticles(r,c,'#6b7280'); updateQuestProgress('stones',1); breakAdjacentLava(r,c); }else if (cl.geode > 0) { _hitGeode(cl,r,c); }
  else if (cl.lava) { destroyLava(r, c); breakAdjacentLava(r, c); }
  else if (cl.web) { cl.web=false; SFX.webBreak&&SFX.webBreak(); spawnParticles(r,c,'#f97316',4); }
  else if (cl.locked) { cl.locked=false; cl.anim={}; spawnParticles(r,c,'#a78bfa',4); }
  else if (cl.chain > 0) { cl.chain--; spawnParticles(r,c,'#8899aa',cl.chain===0?6:3); if(cl.chain===0)rings.push({x:boardOffX+c*cellSize+cellSize/2,y:boardOffY+r*cellSize+cellSize/2,color:'rgba(100,140,170,0.8)',r:4,maxR:cellSize*1.0,life:1,lw:2}); }
  else if (cl.sand > 0) { cl.sand=0; spawnParticles(r,c,'#b45309',6); }
  else if (cl.amber > 0) { _hitAmber(cl,r,c); }
  else if (cl.mycelium > 0) { cl.mycelium--; spawnParticles(r,c,'#f5e6ca',6); if(cl.mycelium===0){cl.type=randGem();state.myceliumBrokenThisMove=true;} }
  else { const _sp=cl.special,_tp=cl.type; state.board[r][c]=null; state.score+=30; breakAdjacentLava(r,c); if(_sp!==SPECIAL.NONE){await triggerSpecial(r,c,_sp,_tp);} }
  clearDirtAt(r,c); clearBricksAt(r,c,false);
  if(cl.type>=0&&!cl.bucket) state.collectedGems[cl.type]=(state.collectedGems[cl.type]||0)+1;
  updateGoalProgress(); updateHUD();
}

// ══════════════════════════════════════════
//  АНИМАЦИИ
// ══════════════════════════════════════════
function animateDestroy(cells) {
  return new Promise(res => {
    const dur=180, t0=performance.now(), _ep=_matchEpoch;
    function f(now) {
      if (_matchEpoch!==_ep) { cells.forEach(({r,c})=>{ const cl=state.board[r]?.[c]; if(cl) cl.anim={}; }); res(); return; }
      const t=Math.min((now-t0)/dur,1);
      const scale = t<0.28 ? 1+t/0.28*0.35 : 1.35*(1-(t-0.28)/0.72);
      const alpha = t<0.28 ? 1 : Math.max(0, 1-(t-0.28)/0.72);
      cells.forEach(({r,c})=>{ const cl=state.board[r]?.[c]; if(cl) cl.anim={scale,alpha}; });
      t<1?requestAnimationFrame(f):res();
    }
    requestAnimationFrame(f);
  });
}

function animateDestroyWave(cells, centerR, centerC) {
  if (!cells.length) return Promise.resolve();
  return new Promise(res => {
    const dur=200, waveDur=60, t0=performance.now(), _ep=_matchEpoch;
    const maxDist = Math.max(...cells.map(({r,c})=>Math.abs(r-centerR)+Math.abs(c-centerC)),1);
    function f(now) {
      if (_matchEpoch!==_ep) { res(); return; }
      const elapsed=now-t0;
      let anyAlive=false;
      cells.forEach(({r,c})=>{
        const cl=state.board[r]?.[c]; if(!cl) return;
        const dist=Math.abs(r-centerR)+Math.abs(c-centerC);
        const delay=(dist/maxDist)*waveDur;
        const local=elapsed-delay;
        if (local<0) { cl.anim={scale:1,alpha:1,oy:0}; anyAlive=true; return; }
        const t=Math.min(local/dur,1);
        const scale = t<0.3 ? 1+t/0.3*0.3 : 1.3*(1-(t-0.3)/0.7);
        const alpha = t<0.3 ? 1 : Math.max(0, 1-(t-0.3)/0.7);
        const oy = t<0.15 ? -t/0.15*10 : t<0.5 ? -10*(1-(t-0.15)/0.35) : 0;
        cl.anim={scale,alpha,oy};
        if (t<1) anyAlive=true;
      });
      anyAlive?requestAnimationFrame(f):res();
    }
    requestAnimationFrame(f);
  });
}

// Радиальные лучи-молнии от взрыва бомбы/меги
function spawnBombBeams(r, c, radius, color) {
  if (!pCtx) return;
  const cx=boardOffX+c*cellSize+cellSize/2, cy=boardOffY+r*cellSize+cellSize/2;
  for (let dr=-radius;dr<=radius;dr++) for (let dc=-radius;dc<=radius;dc++) {
    if (Math.abs(dr)<radius && Math.abs(dc)<radius) continue; // только периметр
    const tx=cx+dc*cellSize, ty=cy+dr*cellSize;
    const segs=4;
    const pts=[[cx,cy]];
    for (let i=1;i<=segs;i++) {
      const f=i/segs;
      const jx=(Math.random()-0.5)*cellSize*0.25, jy=(Math.random()-0.5)*cellSize*0.25;
      pts.push([cx+(tx-cx)*f+jx, cy+(ty-cy)*f+jy]);
    }
    lightningBolts.push({pts,life:1,dur:260,t0:performance.now(),color:color||'rgba(255,200,50,0.95)'});
  }
}

// Молния вдоль строки/столбца — zigzag на pCanvas
function spawnLightning(r, c, horizontal) {
  if (!pCtx) return;
  const segments=14, amp=cellSize*0.18;
  const x0=boardOffX+(horizontal?0:c*cellSize+cellSize/2);
  const y0=boardOffY+(horizontal?r*cellSize+cellSize/2:0);
  const x1=boardOffX+(horizontal?COLS*cellSize:c*cellSize+cellSize/2);
  const y1=boardOffY+(horizontal?r*cellSize+cellSize/2:ROWS*cellSize);
  const pts=[];
  for (let i=0;i<=segments;i++) {
    const f=i/segments;
    const ox=horizontal?0:(Math.random()-0.5)*2*amp;
    const oy=horizontal?(Math.random()-0.5)*2*amp:0;
    pts.push([x0+(x1-x0)*f+ox, y0+(y1-y0)*f+oy]);
  }
  const bolt={pts,life:1,dur:320,t0:performance.now()};
  lightningBolts.push(bolt);
}
let lightningBolts=[];
function updateLightning() {
  if (!pCtx||!lightningBolts.length) return;
  const now=performance.now();
  lightningBolts=lightningBolts.filter(b=>(now-b.t0)<b.dur);
  for (const b of lightningBolts) {
    const t=(now-b.t0)/b.dur;
    pCtx.save();
    pCtx.globalAlpha=Math.max(0,(1-t)*0.85);
    const baseColor = b.color || 'rgba(180,220,255,1)';
    const alpha = (1-t).toFixed(2);
    pCtx.strokeStyle = baseColor.replace(/[\d.]+\)$/, alpha+')');
    pCtx.lineWidth = 2.5*(1-t)+0.5;
    pCtx.shadowColor = b.color || 'rgba(100,180,255,0.9)';
    pCtx.shadowBlur = 8;
    pCtx.beginPath();
    b.pts.forEach(([x,y],i)=>i===0?pCtx.moveTo(x,y):pCtx.lineTo(x,y));
    pCtx.stroke();
    pCtx.restore();
  }
}

// Радиальные искры от взрыва (BOMB)
function spawnExplosionSparks(r, c, count=18, color='#ff8800') {
  const cx=boardOffX+c*cellSize+cellSize/2, cy=boardOffY+r*cellSize+cellSize/2;
  for (let i=0;i<count;i++) {
    const a=Math.random()*Math.PI*2;
    const sp=2.5+Math.random()*3.5;
    particles.push({x:cx,y:cy,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp-1,color,life:0.9,r:2,star:true});
  }
}

function animateDrop() {
  // CCSS physics (tweakdata.json):
  //   Fall:  t ∝ √(distance)  — from constant falling_acceleration (proxy: wrapped_explosion_acceleration=8000px/s²)
  //   Slide: constant speed   — tile_speed_slow=800px/s, tile_width=74px → 92.5ms/cell
  //   Bounce: all falls ≥1 cell bounce — min landing speed=√(2×8000×74)=1089px/s > item_bounce_above_speed=800px/s
  //   Stagger: 1 CCSS gravity tick = 1000/60 ≈ 17ms, cannon fills top→bottom
  const STAGGER = 17;               // 1/60 s — one CCSS gravity tick (ticks_per_second=60)
  const SLIDE_MS_PER_CELL = 74 / 800 * 1000; // tile_speed_slow=800px/s, tile_width=74px → 92.5ms
  const colNewIdx = {};
  for (let c = 0; c < COLS; c++) colNewIdx[c] = 0;

  const gemData = [];
  for (let c = 0; c < COLS; c++) {
    for (let r = 0; r < ROWS; r++) {  // top→bottom: topmost new gem = delay 0 (cannon fires top first)
      const cl = state.board[r]?.[c];
      if (!cl?.anim || (!cl.anim.oy && !cl.anim.ox)) continue;
      const startOy = cl.anim.oy || 0;
      const startOx = cl.anim.ox || 0;
      const isNew   = !!cl.anim._new;
      const isSlide = !!cl.anim._slide;
      const dist    = Math.max(Math.abs(startOy), Math.abs(startOx));
      const cells   = dist / cellSize;
      // slide: constant tile_speed_slow; fall: √-physics calibrated to DROP_MS for ROWS cells
      const dur = isSlide
        ? _d(Math.round(cells * SLIDE_MS_PER_CELL))
        : Math.round(PHYSICS.DROP_MS * Math.sqrt(Math.max(cells, 0.5) / ROWS));
      const delay  = isNew ? (colNewIdx[c]++ * STAGGER) : 0;
      const bounce = !isSlide && cells >= 1.0;  // all ≥1-cell falls bounce (landing speed always > 800px/s)
      gemData.push({ cl, startOy, startOx, dur, delay, bounce });
    }
  }

  if (!gemData.length) return Promise.resolve();
  const t0 = performance.now(), _ep = _matchEpoch;
  return new Promise(res => {
    function f(now) {
      if (_matchEpoch !== _ep) {
        gemData.forEach(({ cl }) => { if (cl.anim) { cl.anim.oy = 0; cl.anim.ox = 0; } });
        res(); return;
      }
      let allDone = true;
      for (const { cl, startOy, startOx, dur, delay, bounce } of gemData) {
        const elapsed = now - t0 - delay;
        if (elapsed <= 0) { allDone = false; continue; }
        const t = Math.min(elapsed / dur, 1);
        if (t < 1) allDone = false;
        const ease = bounce ? EASE.outBounce(t) : EASE.outQuad(t);
        if (cl.anim) { cl.anim.oy = startOy * (1 - ease); cl.anim.ox = startOx * (1 - ease); }
      }
      if (!allDone) requestAnimationFrame(f);
      else {
        gemData.forEach(({ cl }) => {
          if (cl.anim) { cl.anim.oy = 0; cl.anim.ox = 0; delete cl.anim._new; delete cl.anim._slide; }
        });
        res();
      }
    }
    requestAnimationFrame(f);
  });
}

function animateSwap(r1,c1,r2,c2) {
  return new Promise(res => {
    const dur=PHYSICS.SWAP_MS, t0=performance.now(), _ep=_matchEpoch;
    const dx=(c2-c1)*cellSize, dy=(r2-r1)*cellSize;
    const cl1=state.board[r1][c1], cl2=state.board[r2][c2];
    function f(now) {
      if (_matchEpoch!==_ep) { if(cl1)cl1.anim={}; if(cl2)cl2.anim={}; res(); return; }
      const t=EASE.outQuad(Math.min((now-t0)/dur,1));
      if(cl1)cl1.anim={ox:dx*t,oy:dy*t};
      if(cl2)cl2.anim={ox:-dx*t,oy:-dy*t};
      if(t<1) requestAnimationFrame(f);
      else { if(cl1)cl1.anim={}; if(cl2)cl2.anim={}; res(); }
    }
    requestAnimationFrame(f);
  });
}

function easeOut(t) { return EASE.outQuad(t); }
function easeOutBounce(t) { return EASE.outBounce(t); }

function animateBoardEntry() {
  _boardEntryScale = 0.84;
  _boardEntryOffY  = 12;
  const dur = 420, t0 = performance.now();
  function frame(now) {
    const t = Math.min((now - t0) / dur, 1);
    const ease = EASE.outBack(t);
    _boardEntryScale = 0.84 + (1 - 0.84) * ease;
    _boardEntryOffY  = 12 * (1 - ease);
    drawBoard();
    if (t < 1) requestAnimationFrame(frame);
    else { _boardEntryScale = 1; _boardEntryOffY = 0; }
  }
  requestAnimationFrame(frame);
}

function _showDifficultyBanner(tier) {
  const cfg = tier >= 3
    ? { label: '🔥 ЭКСТРЕМАЛЬНЫЙ УРОВЕНЬ', color: '#a855f7', bg: 'rgba(88,28,135,0.92)', freq1: 440, freq2: 880 }
    : tier >= 2
    ? { label: '💥 ОЧЕНЬ СЛОЖНЫЙ УРОВЕНЬ', color: '#ef4444', bg: 'rgba(127,29,29,0.92)', freq1: 784, freq2: 0 }
    : { label: '🔥 СЛОЖНЫЙ УРОВЕНЬ',       color: '#f97316', bg: 'rgba(120,53,15,0.92)', freq1: 660, freq2: 0 };

  if (state.soundOn) {
    const ac = getBgmAC();
    [[cfg.freq1, 0], ...(cfg.freq2 ? [[cfg.freq2, 0.08]] : [])].forEach(([f, d]) => {
      try {
        const o = ac.createOscillator(), g = ac.createGain();
        o.connect(g); g.connect(ac.destination);
        o.type = 'triangle'; o.frequency.value = f;
        const st = ac.currentTime + d;
        g.gain.setValueAtTime(0.14, st);
        g.gain.exponentialRampToValueAtTime(0.001, st + 0.22);
        o.start(st); o.stop(st + 0.25);
      } catch(e) {}
    });
  }

  let el = document.getElementById('diff-banner');
  if (!el) {
    el = document.createElement('div');
    el.id = 'diff-banner';
    el.style.cssText = 'position:fixed;left:50%;transform:translateX(-50%) translateY(100px);bottom:80px;z-index:150;padding:10px 24px;border-radius:24px;font-size:15px;font-weight:900;letter-spacing:0.5px;text-align:center;pointer-events:none;transition:transform .3s cubic-bezier(.2,1,.4,1),opacity .3s;opacity:0;white-space:nowrap;';
    document.body.appendChild(el);
  }
  el.textContent = cfg.label;
  el.style.color = cfg.color;
  el.style.background = cfg.bg;
  el.style.boxShadow = `0 0 16px ${cfg.color}66`;
  requestAnimationFrame(() => {
    el.style.transform = 'translateX(-50%) translateY(0)';
    el.style.opacity = '1';
    setTimeout(() => {
      el.style.transform = 'translateX(-50%) translateY(100px)';
      el.style.opacity = '0';
    }, 1700);
  });
}

