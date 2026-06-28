/**
 * App principal — auth, navegación, pagos Bizum
 */

let state = null;
let currentView = 'home';
let loginMode = 'login';

const els = {
  loginScreen: () => document.getElementById('login-screen'),
  appRoot: () => document.getElementById('app-root'),
  views: () => document.getElementById('views'),
  appMain: () => document.getElementById('app-main'),
  navItems: () => document.querySelectorAll('.bottom-nav [data-nav]'),
  modalOverlay: () => document.getElementById('modal-overlay'),
  modalTitle: () => document.getElementById('modal-title'),
  modalBody: () => document.getElementById('modal-body'),
  modalClose: () => document.getElementById('modal-close'),
  toastContainer: () => document.getElementById('toast-container'),
  webviewTitle: () => document.getElementById('webview-title'),
  webviewBack: () => document.getElementById('webview-back'),
  webviewBadge: () => document.getElementById('webview-badge'),
};

function getUserId() {
  return getCurrentUserId();
}

function persist() {
  const uid = getUserId();
  if (uid && state) saveStateForUser(uid, state);
}

function loadUserState() {
  const uid = getUserId();
  if (!uid) return null;
  state = loadStateForUser(uid);
  return state;
}

function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  els.toastContainer().appendChild(toast);
  BizumBridge.vibrate(8);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.25s';
    setTimeout(() => toast.remove(), 250);
  }, 3000);
}

/* ── Auth UI ── */

function renderLogin() {
  els.loginScreen().innerHTML = renderLoginScreen(loginMode);
  bindLoginEvents();
}

function showLogin() {
  els.loginScreen().classList.remove('is-hidden');
  els.appRoot().classList.remove('is-visible');
  renderLogin();
}

function showApp() {
  loadUserState();
  els.loginScreen().classList.add('is-hidden');
  els.appRoot().classList.add('is-visible');
  setActiveNav(currentView);
  updateChrome();
  render();
  handlePendingJoin();
}

function setLoginError(id, msg) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = msg;
  el.classList.toggle('hidden', !msg);
}

function handleLoginSubmit(e) {
  e.preventDefault();
  const fd = new FormData(e.target);
  const phone = fd.get('phone')?.toString().trim();
  const pin = fd.get('pin')?.toString().trim();
  const btn = document.getElementById('login-submit');

  setLoginError('login-error', '');
  btn.disabled = true;
  btn.querySelector('.btn-label').textContent = 'Entrando…';

  setTimeout(() => {
    const result = validateLogin(phone, pin);
    if (!result.ok) {
      setLoginError('login-error', result.error);
      btn.disabled = false;
      btn.querySelector('.btn-label').textContent = 'Acceder';
      BizumBridge.vibrate([20, 30, 20]);
      return;
    }

    saveSession(result.account.id);
    BizumBridge.vibrate([10, 20, 10]);
    showApp();
    showToast(`Bienvenido, ${result.account.name}`, 'success');
  }, 600);
}

function handleRegisterSubmit(e) {
  e.preventDefault();
  const fd = new FormData(e.target);
  const btn = document.getElementById('register-submit');

  setLoginError('register-error', '');
  btn.disabled = true;
  btn.querySelector('.btn-label').textContent = 'Creando…';

  setTimeout(() => {
    const result = registerAccount({
      name: fd.get('name')?.toString().trim(),
      phone: fd.get('phone')?.toString().trim(),
      pin: fd.get('pin')?.toString().trim(),
    });

    if (!result.ok) {
      setLoginError('register-error', result.error);
      btn.disabled = false;
      btn.querySelector('.btn-label').textContent = 'Crear cuenta';
      return;
    }

    saveSession(result.account.id);
    showApp();
    showToast(`¡Cuenta creada! Hola ${result.account.name}`, 'success');
  }, 700);
}

function switchLoginMode(mode) {
  loginMode = mode;
  renderLogin();
}

function logout() {
  clearSession();
  state = null;
  currentView = 'home';
  history.replaceState({ view: 'home' }, '', '#home');
  showLogin();
  showToast('Sesión cerrada', 'info');
}

function bindLoginEvents() {
  document.getElementById('login-form')?.addEventListener('submit', handleLoginSubmit);
  document.getElementById('register-form')?.addEventListener('submit', handleRegisterSubmit);

  document.querySelectorAll('[data-login-mode]').forEach((tab) => {
    tab.addEventListener('click', () => switchLoginMode(tab.dataset.loginMode));
  });
}

/* ── Navegación ── */

function updateChrome() {
  els.webviewTitle().textContent = VIEW_TITLES[currentView] || 'Bote para Bizum';
  els.webviewBack().classList.toggle('is-visible', currentView !== 'home');
  els.webviewBadge().innerHTML = BizumBridge.isEmbedded()
    ? '<span class="webview-badge-dot"></span> Banco'
    : `<span class="webview-badge-dot"></span> v${APP_CONFIG.version}`;
}

function setActiveNav(view) {
  els.navItems().forEach((btn) => btn.classList.toggle('is-active', btn.dataset.nav === view));
}

function navigate(view, pushHistory = true) {
  if (!isAuthenticated()) return showLogin();
  if (!['home', 'botes', 'activity', 'profile'].includes(view)) return;
  currentView = view;
  setActiveNav(view);
  updateChrome();
  render();
  els.appMain()?.scrollTo({ top: 0, behavior: 'smooth' });
  if (pushHistory) history.pushState({ view }, '', `#${view}`);
}

function render() {
  const container = els.views();
  container.innerHTML = renderView(state, currentView);
  bindViewEvents();
  triggerViewAnimations(container);
  if (currentView === 'home') animateProgressBar(container);
}

function openModal(title, bodyHtml) {
  els.modalTitle().textContent = title;
  els.modalBody().innerHTML = bodyHtml;
  els.modalOverlay().classList.add('is-open');
  document.body.style.overflow = 'hidden';
  bindModalEvents();
}

function closeModal() {
  els.modalOverlay().classList.remove('is-open');
  document.body.style.overflow = '';
  els.modalBody().innerHTML = '';
}

/* ── Pagos ── */

function getOrganizerPhone(bote) {
  return (bote.organizerPhone || state.user.phone || '').replace(/\s/g, '');
}

function payWithBizum() {
  const bote = getActiveBote(state);
  if (!bote) return;
  const me = bote.participants.find((p) => p.isMe);
  if (!me || me.paid) { showToast('Ya has pagado', 'info'); return; }

  const phone = getOrganizerPhone(bote);
  const amount = bote.amountPerPerson;
  const paymentText = BizumBridge.formatPaymentText({ amount, phone, concept: bote.title });
  const isNative = BizumBridge.isNativePayAvailable();

  openModal(isNative ? 'Confirmar Bizum' : 'Enviar Bizum', `
    <div class="payment-sheet">
      <p class="mb-3 text-sm text-white/55">
        El dinero va directo al organizador. Esta app <strong class="text-white/75">no cobra ni guarda</strong> tu dinero.
      </p>
      <div class="liquid-card mb-4 p-5 text-left">
        <p class="payment-amount text-center">${formatMoney(amount)}</p>
        <p class="mt-2 text-center text-sm text-white/50">${bote.title}</p>
        <div class="mt-4 space-y-2 text-sm text-white/60">
          <p><span class="text-white/40">Destinatario</span><br><strong class="text-white/90">${phone}</strong></p>
          <p><span class="text-white/40">Concepto</span><br>${bote.title}</p>
        </div>
      </div>
      ${isNative ? `
        <button type="button" id="confirm-bizum" class="btn-bizum btn-shimmer w-full rounded-2xl py-3.5 text-sm">Pagar con Bizum</button>
      ` : `
        <div class="flex flex-col gap-2.5">
          <button type="button" id="copy-payment-data" class="btn-bizum btn-shimmer w-full rounded-2xl py-3.5 text-sm">Copiar datos del Bizum</button>
          <button type="button" id="open-bank-app" class="btn-secondary w-full rounded-2xl py-3 text-sm">Abrir app de mi banco</button>
          <p class="text-xs text-white/40 px-1">Haz el Bizum desde tu banco y luego confirma aquí abajo.</p>
          <button type="button" id="confirm-manual-payment" class="btn-secondary w-full rounded-2xl py-3 text-sm">Ya he enviado el Bizum</button>
        </div>
      `}
      <button type="button" data-modal-cancel class="btn-ghost mt-2 w-full rounded-2xl py-3 text-sm">Cancelar</button>
    </div>
  `);

  document.getElementById('copy-payment-data')?.addEventListener('click', async () => {
    if (await WebApp.copyToClipboard(paymentText)) showToast('Datos copiados', 'success');
    else showToast(paymentText.replace(/\n/g, ' · '), 'info');
  });

  document.getElementById('open-bank-app')?.addEventListener('click', () => {
    BizumBridge.openBankApp();
    showToast('Abre tu app bancaria y envía el Bizum', 'info');
  });

  document.getElementById('confirm-manual-payment')?.addEventListener('click', () => {
    if (!confirm(`¿Confirmas que has enviado ${formatMoney(amount)} a ${phone}?`)) return;
    markPaymentComplete(bote, me, amount, 'manual');
  });
}

function markPaymentComplete(bote, me, amount, mode = 'native') {
  me.paid = true;
  if (getCollected(bote) >= bote.goal) bote.status = 'completed';
  addActivity(state, `${state.user.name} pagó ${formatMoney(amount)} · ${bote.title}`);
  saveSharedBote(bote, getUserId());
  persist();
  BizumBridge.vibrate([10, 30, 10]);

  els.modalBody().innerHTML = `
    <div class="payment-sheet">
      <div class="payment-success-icon">${ICONS.check.replace('h-3.5 w-3.5', 'h-8 w-8')}</div>
      <p class="text-lg font-bold">¡Registrado!</p>
      <p class="mt-1 text-sm text-white/50">${formatMoney(amount)} · ${bote.title}</p>
      ${mode === 'manual' ? '<p class="mt-2 text-xs text-white/40">El organizador verificará el Bizum en su banco.</p>' : ''}
      <button type="button" id="payment-done" class="btn-bizum btn-shimmer mt-6 w-full rounded-2xl py-3 text-sm">Continuar</button>
    </div>`;

  document.getElementById('payment-done')?.addEventListener('click', () => {
    closeModal();
    render();
    showToast('Pago registrado', 'success');
  });
}

async function executePayment() {
  const bote = getActiveBote(state);
  const me = bote?.participants.find((p) => p.isMe);
  if (!me || me.paid) return;

  const phone = getOrganizerPhone(bote);
  const amount = bote.amountPerPerson;

  els.modalBody().innerHTML = `<div class="payment-loading"><div class="spinner"></div><p class="text-sm text-white/60">Procesando Bizum…</p></div>`;

  try {
    const result = await BizumBridge.pay({ amount, phone, concept: bote.title, reference: bote.shareCode });
    if (!result.success) throw new Error(result.error || 'Pago rechazado');
    markPaymentComplete(bote, me, amount, 'native');
  } catch (err) {
    closeModal();
    showToast(err.message || 'Usa tu app bancaria para enviar el Bizum', 'error');
    payWithBizum();
  }
}

async function shareBote() {
  const bote = getActiveBote(state);
  if (!bote) {
    showToast('Crea un bote primero', 'error');
    return;
  }

  if (!bote.shareCode) bote.shareCode = createShareCode();

  state.activeBoteId = bote.id;
  saveSharedBote(bote, getUserId());
  persist();

  openInviteModal(bote);
}

function openInviteModal(bote) {
  const url = WebApp.getShareUrl(bote.shareCode);
  const message = WebApp.buildInviteMessage({ title: bote.title, shareCode: bote.shareCode, url });
  const hasHttpLink = WebApp.isShareableUrl(url);

  openModal('Invitar al bote', `
    <div class="space-y-4">
      <p class="text-sm text-white/55">Comparte el código o el mensaje con tus amigos</p>

      <div class="liquid-card p-4 text-center">
        <p class="text-xs text-white/40 mb-1">Código del bote</p>
        <p class="text-2xl font-bold tracking-[0.2em] text-violet-200">${bote.shareCode}</p>
        <p class="mt-2 text-sm text-white/50">${bote.title}</p>
      </div>

      ${hasHttpLink ? `<p class="break-all text-xs text-white/35">${url}</p>` : ''}

      <div class="flex flex-col gap-2.5">
        <button type="button" id="copy-invite-code" class="btn-bizum btn-shimmer w-full rounded-2xl py-3 text-sm">Copiar código</button>
        <button type="button" id="copy-invite-message" class="btn-secondary w-full rounded-2xl py-3 text-sm">Copiar mensaje completo</button>
        ${hasHttpLink ? '<button type="button" id="copy-invite-link" class="btn-secondary w-full rounded-2xl py-3 text-sm">Copiar enlace</button>' : ''}
        <button type="button" id="native-share-invite" class="btn-secondary w-full rounded-2xl py-3 text-sm">Compartir…</button>
      </div>
    </div>
  `);

  document.getElementById('copy-invite-code')?.addEventListener('click', async () => {
    if (await WebApp.copyToClipboard(bote.shareCode)) showToast('Código copiado', 'success');
    else showToast(`Código: ${bote.shareCode}`, 'info');
  });

  document.getElementById('copy-invite-message')?.addEventListener('click', async () => {
    if (await WebApp.copyToClipboard(message)) showToast('Mensaje copiado', 'success');
    else showToast('No se pudo copiar — anota el código manualmente', 'error');
  });

  document.getElementById('copy-invite-link')?.addEventListener('click', async () => {
    if (await WebApp.copyToClipboard(url)) showToast('Enlace copiado', 'success');
    else showToast('No se pudo copiar el enlace', 'error');
  });

  document.getElementById('native-share-invite')?.addEventListener('click', async () => {
    const result = await WebApp.share({
      title: bote.title,
      text: message,
      url: hasHttpLink ? url : '',
    });
    if (result === 'shared') showToast('Compartido', 'success');
    else if (result === 'copied') showToast('Mensaje copiado al portapapeles', 'success');
    else if (result === 'cancelled') return;
    else showToast('Usa "Copiar mensaje completo"', 'info');
  });
}

async function copyShareCode(code) {
  if (await WebApp.copyToClipboard(code)) showToast(`Código ${code} copiado`, 'success');
  else showToast(`Código: ${code}`, 'info');
}

function openJoinModal(prefill = '') {
  openModal('Unirme a un bote', `
    <form id="join-bote-form" class="space-y-4">
      <p class="text-sm text-white/55">Código del organizador</p>
      <input class="input-glass input-glow text-center uppercase tracking-widest" id="join-code" name="code" type="text" maxlength="8" value="${prefill}" placeholder="JUAN50" required />
      <button type="submit" class="btn-bizum btn-shimmer w-full rounded-2xl py-3 text-sm">Unirme</button>
    </form>`);
}

function joinBote(code) {
  const normalized = code?.trim().toUpperCase();
  if (!normalized) {
    showToast('Introduce un código válido', 'error');
    return;
  }

  let bote = findBoteByShareCode(state, normalized);

  if (!bote) {
    const shared = getSharedBote(normalized);
    if (!shared) {
      showToast('Código no encontrado', 'error');
      return;
    }
    bote = {
      ...shared.bote,
      id: createId('bote'),
      participants: shared.bote.participants.map((p) => ({ ...p, isMe: false })),
    };
    state.botes.push(bote);
  }

  if (bote.participants.some((p) => p.isMe)) {
    state.activeBoteId = bote.id;
    persist();
    closeModal();
    navigate('home');
    showToast('Bote seleccionado', 'info');
    return;
  }

  bote.participants.push({ id: createId('p'), name: state.user.name, paid: false, isMe: true });
  state.activeBoteId = bote.id;
  addActivity(state, `${state.user.name} se unió a "${bote.title}"`);
  persist();
  closeModal();
  navigate('home');
  showToast(`Unido a "${bote.title}"`, 'success');
}

function remindParticipant(participantId) {
  const bote = getActiveBote(state);
  const p = bote?.participants.find((x) => x.id === participantId);
  if (!p || p.paid) return;
  p.lastReminder = new Date().toISOString();
  addActivity(state, `Recordatorio a ${p.name}`);
  persist();
  BizumBridge.vibrate(5);
  showToast(`Recordatorio a ${p.name}`, 'success');
}

function selectBote(id) {
  state.activeBoteId = id;
  persist();
  navigate('home');
}

function openCreateModal() {
  openModal('Nuevo bote', `
    <form id="create-bote-form" class="space-y-4">
      <div><label class="label-glass" for="bote-title">Evento</label><input class="input-glass input-glow" id="bote-title" name="title" required placeholder="Cena 🍽️" /></div>
      <div><label class="label-glass" for="bote-subtitle">Descripción</label><input class="input-glass input-glow" id="bote-subtitle" name="subtitle" placeholder="Opcional" /></div>
      <div class="form-grid-2">
        <div><label class="label-glass" for="bote-goal">Meta €</label><input class="input-glass input-glow" id="bote-goal" name="goal" type="number" min="1" value="200" required /></div>
        <div><label class="label-glass" for="bote-amount">/persona €</label><input class="input-glass input-glow" id="bote-amount" name="amountPerPerson" type="number" min="1" value="25" required /></div>
      </div>
      <div><label class="label-glass" for="bote-deadline">Fecha límite</label><input class="input-glass input-glow" id="bote-deadline" name="deadline" type="date" required /></div>
      <div><label class="label-glass" for="bote-participants">Invitados</label><input class="input-glass input-glow" id="bote-participants" name="participants" placeholder="Ana, Luis" /></div>
      <div><label class="label-glass" for="bote-phone">Tu Bizum</label><input class="input-glass input-glow" id="bote-phone" name="organizerPhone" type="tel" value="${state.user.bizumAlias || state.user.phone}" required /></div>
      <button type="submit" class="btn-bizum btn-shimmer w-full rounded-2xl py-3.5 text-sm">Crear bote</button>
    </form>`);

  const d = document.getElementById('bote-deadline');
  if (d) {
    const date = new Date();
    date.setDate(date.getDate() + 14);
    d.value = date.toISOString().split('T')[0];
    d.min = new Date().toISOString().split('T')[0];
  }
}

function createBote(fd) {
  const title = fd.get('title')?.trim();
  const goal = Number(fd.get('goal'));
  const amountPerPerson = Number(fd.get('amountPerPerson'));
  const deadline = fd.get('deadline');
  if (!title || !goal || !amountPerPerson || !deadline) {
    showToast('Completa los campos', 'error');
    return;
  }

  const participants = [{ id: createId('p'), name: state.user.name, paid: false, isMe: true }];
  const names = fd.get('participants')?.trim();
  if (names) {
    names.split(',').map((n) => n.trim()).filter(Boolean).forEach((name) => {
      if (name.toLowerCase() !== state.user.name.toLowerCase()) {
        participants.push({ id: createId('p'), name, paid: false, isMe: false, lastReminder: null });
      }
    });
  }

  const shareCode = createShareCode();
  state.botes.unshift({
    id: createId('bote'), shareCode, title,
    subtitle: fd.get('subtitle')?.trim() || '',
    goal, amountPerPerson, deadline,
    organizerPhone: fd.get('organizerPhone')?.trim(),
    status: 'active', createdAt: new Date().toISOString(), participants,
  });
  state.activeBoteId = state.botes[0].id;
  saveSharedBote(state.botes[0], getUserId());
  addActivity(state, `Bote "${title}" creado · ${shareCode}`);
  persist();
  closeModal();
  navigate('home');
  showToast(`Bote creado · ${shareCode}`, 'success');
}

function saveProfile(fd) {
  const name = fd.get('name')?.trim();
  const phone = fd.get('phone')?.trim();
  const bizumAlias = fd.get('bizumAlias')?.trim();
  if (!name || !phone) { showToast('Datos incompletos', 'error'); return; }

  state.user.name = name;
  state.user.phone = phone;
  state.user.bizumAlias = bizumAlias || phone;
  state.botes.forEach((b) => { const me = b.participants.find((p) => p.isMe); if (me) me.name = name; });

  const accounts = loadAccounts();
  const acc = accounts.find((a) => a.id === state.user.id);
  if (acc) { acc.name = name; acc.phone = phone; acc.bizumAlias = bizumAlias || phone; saveAccounts(accounts); }

  persist();
  showToast('Perfil guardado', 'success');
  render();
}

function resetDemoData() {
  if (!confirm('¿Vaciar todos tus botes y actividad?')) return;
  const uid = getUserId();
  state = clearUserBotes(uid);
  navigate('home');
  showToast('Sin botes — crea el primero con +', 'info');
}

function handlePendingJoin() {
  const code = window.__pendingJoinCode;
  if (!code) return;
  delete window.__pendingJoinCode;
  if (findBoteByShareCode(state, code) || getSharedBote(code)) joinBote(code);
  else openJoinModal(code);
}

/* ── Events ── */

function bindViewEvents() {
  document.getElementById('btn-pay-bizum')?.addEventListener('click', payWithBizum);
  document.getElementById('btn-share-bote')?.addEventListener('click', shareBote);
  document.getElementById('btn-copy-code')?.addEventListener('click', (e) => copyShareCode(e.currentTarget.dataset.code));
  document.querySelectorAll('#btn-join-bote').forEach((b) => b.addEventListener('click', () => openJoinModal()));
  document.querySelector('[data-action="profile"]')?.addEventListener('click', () => navigate('profile'));
  document.querySelectorAll('[data-remind]').forEach((b) => b.addEventListener('click', (e) => { e.stopPropagation(); remindParticipant(b.dataset.remind); }));
  document.querySelectorAll('[data-select-bote]').forEach((c) => c.addEventListener('click', () => selectBote(c.dataset.selectBote)));
  document.getElementById('profile-form')?.addEventListener('submit', (e) => { e.preventDefault(); saveProfile(new FormData(e.target)); });
  document.getElementById('btn-logout')?.addEventListener('click', logout);
  document.getElementById('btn-reset-data')?.addEventListener('click', resetDemoData);
}

function bindModalEvents() {
  document.getElementById('confirm-bizum')?.addEventListener('click', executePayment);
  document.querySelectorAll('[data-modal-cancel]').forEach((b) => b.addEventListener('click', closeModal));
  document.getElementById('create-bote-form')?.addEventListener('submit', (e) => { e.preventDefault(); createBote(new FormData(e.target)); });
  document.getElementById('join-bote-form')?.addEventListener('submit', (e) => { e.preventDefault(); joinBote(new FormData(e.target).get('code')?.trim()); });
}

function bindGlobalEvents() {
  els.navItems().forEach((btn) => {
    btn.addEventListener('click', () => {
      if (!isAuthenticated()) return showLogin();
      btn.dataset.nav === 'create' ? openCreateModal() : navigate(btn.dataset.nav);
    });
  });
  els.modalClose()?.addEventListener('click', closeModal);
  els.modalOverlay()?.addEventListener('click', (e) => { if (e.target === els.modalOverlay()) closeModal(); });
  els.webviewBack()?.addEventListener('click', () => currentView === 'home' ? BizumBridge.closeWebView() : navigate('home'));
  window.addEventListener('popstate', (e) => { if (isAuthenticated()) navigate(e.state?.view || 'home', false); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });
}

function init() {
  loadAccounts();
  const hash = location.hash.replace('#', '');
  if (['home', 'botes', 'activity', 'profile'].includes(hash)) currentView = hash;

  bindGlobalEvents();

  if (isAuthenticated()) {
    history.replaceState({ view: currentView }, '', `#${currentView}`);
    showApp();
  } else {
    showLogin();
  }
}

document.addEventListener('DOMContentLoaded', init);
