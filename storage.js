/**
 * Persistencia en localStorage para Bote para Bizum
 */
const STORAGE_KEY = 'boteParaBizum_v1';

const AVATAR_GRADIENTS = [
  'from-blue-400 to-cyan-400',
  'from-violet-400 to-purple-500',
  'from-pink-400 to-rose-500',
  'from-amber-400 to-orange-500',
  'from-teal-400 to-emerald-500',
  'from-indigo-400 to-blue-500',
  'from-fuchsia-400 to-pink-500',
];

function createId(prefix = 'id') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function createShareCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

function findBoteByShareCode(state, code) {
  return state.botes.find((b) => b.shareCode === code?.toUpperCase());
}

const SHARED_BOTES_KEY = 'boteParaBizum_shared';

function loadSharedBotes() {
  try {
    return JSON.parse(localStorage.getItem(SHARED_BOTES_KEY)) || {};
  } catch {
    return {};
  }
}

function saveSharedBote(bote, ownerUserId) {
  const shared = loadSharedBotes();
  shared[bote.shareCode] = {
    ownerUserId,
    bote: JSON.parse(JSON.stringify(bote)),
  };
  localStorage.setItem(SHARED_BOTES_KEY, JSON.stringify(shared));
}

function getSharedBote(code) {
  return loadSharedBotes()[code?.toUpperCase()] || null;
}

function getDefaultState(user = {}) {
  return {
    user: {
      id: user.id || 'user-me',
      name: user.name || '',
      phone: user.phone || '',
      bizumAlias: user.bizumAlias || user.phone || '',
    },
    activeBoteId: null,
    botes: [],
    activity: [],
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefaultState();
    const parsed = JSON.parse(raw);
    const state = { ...getDefaultState(), ...parsed, user: { ...getDefaultState().user, ...parsed.user } };
    state.botes = (state.botes || []).map((b) => ({
      ...b,
      shareCode: b.shareCode || createShareCode(),
    }));
    return state;
  } catch {
    return getDefaultState();
  }
}

function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function getInitial(name) {
  return (name || '?').trim().charAt(0).toUpperCase();
}

function getGradient(index) {
  return AVATAR_GRADIENTS[index % AVATAR_GRADIENTS.length];
}

function formatMoney(amount) {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(amount);
}

function formatDate(iso) {
  if (!iso) return '';
  return new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(iso));
}

function formatRelative(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Ahora';
  if (mins < 60) return `Hace ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Hace ${hours}h`;
  const days = Math.floor(hours / 24);
  return `Hace ${days}d`;
}

function getCollected(bote) {
  return bote.participants.filter((p) => p.paid).reduce((sum, p) => sum + bote.amountPerPerson, 0);
}

function getProgress(bote) {
  if (!bote.goal) return 0;
  return Math.min(100, Math.round((getCollected(bote) / bote.goal) * 100));
}

function getPaidCount(bote) {
  return bote.participants.filter((p) => p.paid).length;
}

function getActiveBote(state) {
  if (!state?.botes?.length) return null;
  if (state.activeBoteId) {
    const found = state.botes.find((b) => b.id === state.activeBoteId);
    if (found) return found;
  }
  return state.botes[0] || null;
}

function addActivity(state, message, type = 'info') {
  state.activity.unshift({
    id: createId('act'),
    type,
    message,
    date: new Date().toISOString(),
  });
  if (state.activity.length > 50) state.activity.length = 50;
}
