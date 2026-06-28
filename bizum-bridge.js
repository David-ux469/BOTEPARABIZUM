/**
 * Bridge para WebView de app bancaria / Bizum.
 * En producción el banco inyecta BizumNative o webkit.messageHandlers.
 */
const BizumBridge = {
  isEmbedded() {
    return !!(
      window.BizumNative ||
      window.BankBridge ||
      window.webkit?.messageHandlers?.bizumPay ||
      window.webkit?.messageHandlers?.bankBridge
    );
  },

  isNativePayAvailable() {
    return !!(
      window.BizumNative?.pay ||
      window.BankBridge?.sendBizum ||
      window.webkit?.messageHandlers?.bizumPay
    );
  },

  getHostApp() {
    if (window.BizumNative) return 'bizum';
    if (window.BankBridge) return 'bank';
    if (window.webkit?.messageHandlers?.bizumPay) return 'bizum-ios';
    if (window.webkit?.messageHandlers?.bankBridge) return 'bank-ios';
    return 'standalone';
  },

  vibrate(pattern = 10) {
    if (navigator.vibrate) navigator.vibrate(pattern);
  },

  formatPaymentText({ amount, phone, concept }) {
    const euros = typeof amount === 'number' ? amount.toFixed(2) : amount;
    return [
      `Bizum: ${euros} €`,
      `Destinatario: ${phone}`,
      `Concepto: ${concept}`,
    ].join('\n');
  },

  /**
   * Abre la app Bizum o la app del banco si es posible.
   */
  openBankApp() {
    const ua = navigator.userAgent || '';
    if (/android/i.test(ua)) {
      const intent =
        'intent://#Intent;scheme=bizum;package=es.bancosantander.apps.bizum;S.browser_fallback_url=https%3A%2F%2Fplay.google.com%2Fstore%2Fapps%2Fdetails%3Fid%3Des.bancosantander.apps.bizum;end';
      window.location.href = intent;
      return 'android';
    }
    if (/iphone|ipad|ipod/i.test(ua)) {
      window.location.href = 'bizum://';
      return 'ios';
    }
    window.open('https://www.bizum.es', '_blank', 'noopener');
    return 'web';
  },

  /**
   * Inicia pago Bizum nativo (solo dentro de WebView bancaria).
   */
  pay({ amount, phone, concept, reference }) {
    const payload = { amount, phone, concept, reference, currency: 'EUR' };

    if (window.BizumNative?.pay) {
      return Promise.resolve(window.BizumNative.pay(JSON.stringify(payload)))
        .then((r) => (typeof r === 'string' ? JSON.parse(r) : r));
    }

    if (window.BankBridge?.sendBizum) {
      return Promise.resolve(window.BankBridge.sendBizum(JSON.stringify(payload)))
        .then((r) => (typeof r === 'string' ? JSON.parse(r) : r));
    }

    if (window.webkit?.messageHandlers?.bizumPay) {
      return new Promise((resolve) => {
        window.__bizumPayCallback = resolve;
        window.webkit.messageHandlers.bizumPay.postMessage(payload);
      });
    }

    return Promise.reject(new Error('Pago manual requerido'));
  },

  closeWebView() {
    if (window.BizumNative?.close) window.BizumNative.close();
    else if (window.BankBridge?.close) window.BankBridge.close();
    else if (window.webkit?.messageHandlers?.close) window.webkit.messageHandlers.close.postMessage({});
    else if (history.length > 1) history.back();
  },
};
