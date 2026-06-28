/**
 * Autenticación — login, registro y sesión
 */
const SESSION_KEY = 'boteParaBizum_session';
const ACCOUNTS_KEY = 'boteParaBizum_accounts';

function hashPin(pin) {
  return btoa(`bote:${pin}`).slice(0, 12);
}

function loadAccounts() {
  try {
    const raw = localStorage.getItem(ACCOUNTS_KEY);
    if (!raw) {
      saveAccounts([]);
      return [];
    }
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveAccounts(accounts) {
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}

function loadSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw);
    if (session.expiresAt && Date.now() > session.expiresAt) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

function saveSession(userId) {
  const session = {
    userId,
    expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
    createdAt: Date.now(),
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

function findAccountByPhone(phone) {
  const normalized = phone.replace(/\s/g, '');
  return loadAccounts().find((a) => a.phone.replace(/\s/g, '') === normalized);
}

function findAccountById(userId) {
  return loadAccounts().find((a) => a.id === userId);
}

function validateLogin(phone, pin) {
  const account = findAccountByPhone(phone);
  if (!account) return { ok: false, error: 'Teléfono no registrado' };
  if (account.pinHash !== hashPin(pin)) return { ok: false, error: 'PIN incorrecto' };
  return { ok: true, account };
}

function registerAccount({ name, phone, pin, bizumAlias }) {
  const normalized = phone.replace(/\s/g, '');
  if (!name || normalized.length < 9) return { ok: false, error: 'Datos incompletos' };
  if (!/^\d{4}$/.test(pin)) return { ok: false, error: 'El PIN debe tener 4 dígitos' };

  const accounts = loadAccounts();
  if (accounts.some((a) => a.phone.replace(/\s/g, '') === normalized)) {
    return { ok: false, error: 'Este teléfono ya está registrado' };
  }

  const account = {
    id: createId('user'),
    name: name.trim(),
    phone: normalized,
    bizumAlias: (bizumAlias || normalized).trim(),
    pinHash: hashPin(pin),
  };

  accounts.push(account);
  saveAccounts(accounts);
  initUserState(account);
  return { ok: true, account };
}

function initUserState(account) {
  const key = `${STORAGE_KEY}_${account.id}`;
  if (localStorage.getItem(key)) return;

  const empty = getDefaultState({
    id: account.id,
    name: account.name,
    phone: account.phone,
    bizumAlias: account.bizumAlias,
  });
  localStorage.setItem(key, JSON.stringify(empty));
}

function loadStateForUser(userId) {
  const key = `${STORAGE_KEY}_${userId}`;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      const account = findAccountById(userId);
      if (account) initUserState(account);
      return loadStateForUser(userId);
    }
    const parsed = JSON.parse(raw);
    const account = findAccountById(userId);
    const state = {
      ...getDefaultState(account || {}),
      ...parsed,
      botes: parsed.botes || [],
      activity: parsed.activity || [],
      activeBoteId: parsed.activeBoteId ?? null,
    };
    if (account) {
      state.user = {
        id: account.id,
        name: account.name,
        phone: account.phone,
        bizumAlias: account.bizumAlias,
      };
    }
    state.botes = state.botes.map((b) => ({
      ...b,
      shareCode: b.shareCode || createShareCode(),
    }));
    state.botes.forEach((b) => saveSharedBote(b, userId));
    return state;
  } catch {
    return getDefaultState();
  }
}

function saveStateForUser(userId, state) {
  localStorage.setItem(`${STORAGE_KEY}_${userId}`, JSON.stringify(state));
}

function getCurrentUserId() {
  return loadSession()?.userId || null;
}

function isAuthenticated() {
  return !!getCurrentUserId();
}

function clearUserBotes(userId) {
  const state = loadStateForUser(userId);
  state.botes = [];
  state.activity = [];
  state.activeBoteId = null;
  saveStateForUser(userId, state);
  return state;
}
