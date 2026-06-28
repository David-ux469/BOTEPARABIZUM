/**
 * Configuración PWA y comportamiento de web app móvil
 */
const WebApp = {
  init() {
    WebApp.registerServiceWorker();
    WebApp.preventIOSZoom();
    WebApp.handleDeepLinks();
    WebApp.setupViewportHeight();
    WebApp.setupStandaloneClass();
  },

  registerServiceWorker() {
    if (!('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  },

  preventIOSZoom() {
    document.addEventListener('touchstart', () => {}, { passive: true });
  },

  setupViewportHeight() {
    const setVH = () => {
      document.documentElement.style.setProperty('--app-vh', `${window.innerHeight * 0.01}px`);
    };
    setVH();
    window.addEventListener('resize', setVH);
    window.addEventListener('orientationchange', () => setTimeout(setVH, 100));
  },

  setupStandaloneClass() {
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;
    document.documentElement.classList.toggle('is-standalone', standalone);
    document.documentElement.classList.toggle('is-embedded', BizumBridge.isEmbedded());
  },

  handleDeepLinks() {
    const params = new URLSearchParams(window.location.search);
    const joinCode = params.get('join');
    if (joinCode) {
      window.__pendingJoinCode = joinCode.toUpperCase();
    }
  },

  getShareUrl(shareCode) {
    const url = new URL(window.location.href);
    url.search = '';
    url.hash = '';
    url.searchParams.set('join', shareCode);
    return url.toString();
  },

  isShareableUrl(url) {
    return /^https?:\/\//i.test(url);
  },

  buildInviteMessage({ title, shareCode, url }) {
    const lines = [
      `Únete al bote "${title}" en Bote para Bizum`,
      `Código: ${shareCode}`,
    ];
    if (WebApp.isShareableUrl(url)) lines.push(`Enlace: ${url}`);
    else lines.push('Abre la app y pulsa Unirme → introduce el código.');
    return lines.join('\n');
  },

  async copyToClipboard(text) {
    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch {
        /* fallback below */
      }
    }
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.top = '-9999px';
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  },

  async share({ title, text, url }) {
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url: WebApp.isShareableUrl(url) ? url : undefined });
        return 'shared';
      } catch (err) {
        if (err.name === 'AbortError') return 'cancelled';
      }
    }
    if (await WebApp.copyToClipboard(text || url)) return 'copied';
    return 'failed';
  },
};

document.addEventListener('DOMContentLoaded', () => WebApp.init());
