'use strict';

// ══════════════════════════════════════════
//  ШАГ 3: ЯНДЕКС SDK АДАПТЕР
//  Вся работа с SDK проходит через этот модуль.
//  Если SDK недоступен (localhost/VK) — заглушки.
// ══════════════════════════════════════════
const SDK = (() => {
  let ysdk = null;
  let _payments = null;
  let _player   = null;
  let _ready    = false;

  async function init() {
    if (window._sdkMissing || typeof YaGames === 'undefined') {
      console.log('[SDK] Яндекс SDK не найден, режим заглушек');
      _ready = false;
      return false;
    }
    try {
      ysdk     = await YaGames.init();
      _ready   = true;
      console.log('[SDK] Инициализирован');
      // Сигнал платформе что загрузка завершена
      ysdk.features.LoadingAPI?.ready();
      return true;
    } catch(e) {
      console.warn('[SDK] Ошибка инициализации:', e);
      return false;
    }
  }

  function isReady() { return _ready && ysdk !== null; }

  // ── Реклама ──────────────────────────────
  function showInterstitial(onClose) {
    if (!isReady()) { onClose?.(); return; }
    ysdk.adv.showFullscreenAdv({
      callbacks: {
        onClose:  ()  => onClose?.(),
        onError:  (e) => { console.warn('[SDK] interstitial err', e); onClose?.(); },
      }
    });
  }

  function showRewarded(onRewarded, onClose) {
    if (!isReady()) {
      // Заглушка для теста — сразу выдаём награду
      onRewarded?.();
      onClose?.();
      return;
    }
    ysdk.adv.showRewardedVideo({
      callbacks: {
        onRewarded: () => onRewarded?.(),
        onClose:    () => onClose?.(),
        onError: (e) => { console.warn('[SDK] rewarded err', e); onClose?.(); },
      }
    });
  }

  function showBanner() {
    if (!isReady()) {
      document.getElementById('ya-banner-wrap').style.display = 'flex';
      return;
    }
    ysdk.adv.getBannerAdvStatus().then(({ stickyAdvIsShowing }) => {
      if (!stickyAdvIsShowing) ysdk.adv.showBannerAdv();
    }).catch(() => {});
    document.getElementById('ya-banner-wrap').style.display = 'flex';
  }

  function hideBanner() {
    if (isReady()) ysdk.adv.hideBannerAdv?.().catch(()=>{});
    document.getElementById('ya-banner-wrap').style.display = 'none';
  }

  // ── Платежи ───────────────────────────────
  async function getPayments() {
    if (!isReady()) return null;
    if (_payments) return _payments;
    try {
      _payments = await ysdk.getPayments({ signed: true });
      return _payments;
    } catch(e) { console.warn('[SDK] payments:', e); return null; }
  }

  async function purchase(productId, onSuccess, onFail) {
    const p = await getPayments();
    if (!p) {
      // Режим разработки — симулируем покупку
      console.log('[SDK] DEV purchase:', productId);
      onSuccess?.({ productID: productId, purchaseToken: 'dev_' + Date.now() });
      return;
    }
    try {
      const result = await p.createPurchase({ id: productId });
      onSuccess?.(result);
      // Потребляем расходуемый товар
      if (!['no_ads','lives_24h'].includes(productId)) {
        await p.consumePurchase(result.purchaseToken).catch(()=>{});
      }
    } catch(e) {
      console.warn('[SDK] purchase error:', e);
      onFail?.(e);
    }
  }

  // Восстановление покупок при запуске
  async function restorePurchases(onItem) {
    const p = await getPayments();
    if (!p) return;
    try {
      const list = await p.getPurchases();
      list.forEach(item => onItem?.(item.productID, item.purchaseToken));
    } catch(e) { console.warn('[SDK] restorePurchases:', e); }
  }

  // ── Облачные сохранения ────────────────────
  async function getPlayer() {
    if (!isReady()) return null;
    if (_player) return _player;
    try {
      _player = await ysdk.getPlayer({ scopes: false });
      return _player;
    } catch(e) { console.warn('[SDK] getPlayer:', e); return null; }
  }

  async function cloudSave(data) {
    const pl = await getPlayer();
    if (!pl) return;
    try {
      await pl.setData({ save: data }, true); // true = flush immediately
    } catch(e) { console.warn('[SDK] cloudSave:', e); }
  }

  async function cloudLoad() {
    const pl = await getPlayer();
    if (!pl) return null;
    try {
      const d = await pl.getData(['save']);
      return d?.save ?? null;
    } catch(e) { console.warn('[SDK] cloudLoad:', e); return null; }
  }

  // ── Таблица лидеров ── (Шаг 4)
  async function submitScore(score) {
    if (!isReady()) return;
    try {
      const lb = await ysdk.getLeaderboards();
      await lb.setLeaderboardScore('weekly_score', score);
    } catch(e) { console.warn('[SDK] submitScore:', e); }
  }

  async function getLeaderboard(onResult) {
    if (!isReady()) { onResult?.([]); return; }
    try {
      const lb  = await ysdk.getLeaderboards();
      const res = await lb.getLeaderboardEntries('weekly_score', { quantityTop: 20, includeUser: true });
      onResult?.(res.entries ?? []);
    } catch(e) { console.warn('[SDK] getLeaderboard:', e); onResult?.([]); }
  }

  return { init, isReady, showInterstitial, showRewarded, showBanner, hideBanner,
           purchase, restorePurchases, cloudSave, cloudLoad, submitScore, getLeaderboard };
})();

