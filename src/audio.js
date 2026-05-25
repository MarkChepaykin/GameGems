// ══════════════════════════════════════════
//  ФОНОВАЯ МУЗЫКА (Web Audio API)
// ══════════════════════════════════════════
// ── Общий AudioContext для BGM ──────────────────────────────
let _bgmAC=null;
function getBgmAC(){
  if(!_bgmAC)_bgmAC=new(window.AudioContext||window.webkitAudioContext)();
  return _bgmAC;
}
// ── BGM-плеер (factory): OGG первым, MP3 как запасной ────────────
function _makeBgm(oggSrc) {
  const _el = document.createElement('audio');
  _el.loop = true;
  _el.preload = 'auto';
  _el.volume = 0.8;
  if (oggSrc) { const s = document.createElement('source'); s.src = oggSrc; s.type = 'audio/ogg'; _el.appendChild(s); }
  return {
    start() {
      _el.volume = (state && state.musicVol != null) ? state.musicVol / 100 : 0.8;
      _el.play().catch(() => {});
    },
    stop() {
      _el.pause();
      _el.currentTime = 0;
    },
    set(on) { on ? this.start() : this.stop(); },
    isPlaying() { return !_el.paused; },
    _setVol(v) { _el.volume = Math.max(0, Math.min(1, v)); },
    getEl() { return _el; },
  };
}

// ── Музыка для меню ───────────────────────────────────────────────
const MENU_BGM = _makeBgm('audio/menubgm.ogg');

// ── Музыка для уровней ────────────────────────────────────────────
const BGM = _makeBgm('audio/levelbgm.ogg');

// ── 3-слойная адаптивная музыка + тональные переходы ──────────────
// stub: MIDI-layered adaptive BGM disabled (was producing oscillator-based cascade music)
// Original implementation kept in git history; this stub keeps the public API intact.
const BGM_LAYERS = {
  onMovesChange() {},
  triggerEGP() {},
  fadeOut() {},
  reset() {},
  getMusicState() { return 'off'; }
};

// Разблокировка AudioContext на первом жесте пользователя
(function(){
  function _unlockBGM(){
    const doStart=()=>{
      try{
        const ms=state.musicOn;
        const sc=state.screen;
        // stop() сбрасывает playing=false, чтобы start() не ушёл в if(playing)return
        if(ms&&(sc==='menu'||sc==='levels'||sc==='pregame')){MENU_BGM.stop();MENU_BGM.start();}
        else if(ms&&sc==='game'){BGM.stop();BGM.start();}
      }catch(e){}
    };
    if(!_bgmAC){doStart();return;}
    if(_bgmAC.state==='suspended'){_bgmAC.resume().then(doStart);}
    else doStart();
  }
  document.addEventListener('click',_unlockBGM,{once:true,capture:true});
  document.addEventListener('touchstart',_unlockBGM,{once:true,capture:true});
})();

