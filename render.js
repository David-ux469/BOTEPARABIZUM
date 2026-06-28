/**
 * Renderizado — login + vistas con animaciones
 */

const VIEW_TITLES = {
  home: 'Bote para Bizum',
  botes: 'Mis Botes',
  activity: 'Actividad',
  profile: 'Mi Perfil',
};

const ICONS = {
  check: '<svg class="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>',
  clock: '<svg class="h-3.5 w-3.5 text-amber-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>',
  bizum: '<svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 12h3l2-4 2 8 2-4h3"/></svg>',
  share: '<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/></svg>',
  jar: '<svg class="h-8 w-8 text-violet-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M8 4h8l1 3v11a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V7l1-3z"/><path d="M8 7h8"/><circle cx="12" cy="13" r="2.5" fill="currentColor" opacity="0.35"/></svg>',
};

function renderLoginScreen(mode = 'login') {
  const isLogin = mode === 'login';
  return `
    <div class="login-wrap">
      <div class="login-glow login-glow-1"></div>
      <div class="login-glow login-glow-2"></div>

      <div class="login-brand anim-fade-down">
        <div class="login-logo liquid-ring">${ICONS.jar}</div>
        <h1 class="login-title">Bote</h1>
        <p class="login-subtitle">para Bizum</p>
      </div>

      <div class="liquid-card login-card anim-slide-up">
        <div class="login-tabs">
          <button type="button" class="login-tab ${isLogin ? 'is-active' : ''}" data-login-mode="login">Entrar</button>
          <button type="button" class="login-tab ${!isLogin ? 'is-active' : ''}" data-login-mode="register">Registro</button>
        </div>

        <form id="login-form" class="${isLogin ? '' : 'hidden'}">
          <div class="field-group anim-stagger" style="--i:0">
            <label class="label-glass" for="login-phone">Teléfono</label>
            <input class="input-glass input-glow" id="login-phone" name="phone" type="tel" inputmode="tel" placeholder="600 123 456" autocomplete="tel" required />
          </div>
          <div class="field-group anim-stagger" style="--i:1">
            <label class="label-glass" for="login-pin">PIN (4 dígitos)</label>
            <input class="input-glass input-glow pin-input" id="login-pin" name="pin" type="password" inputmode="numeric" maxlength="4" pattern="\\d{4}" placeholder="••••" autocomplete="current-password" required />
          </div>
          <p id="login-error" class="login-error hidden" role="alert"></p>
          <button type="submit" id="login-submit" class="btn-bizum btn-shimmer w-full rounded-2xl py-3.5 text-sm anim-stagger" style="--i:2">
            <span class="btn-label">Acceder</span>
          </button>
        </form>

        <form id="register-form" class="${!isLogin ? '' : 'hidden'}">
          <div class="field-group anim-stagger" style="--i:0">
            <label class="label-glass" for="reg-name">Nombre</label>
            <input class="input-glass input-glow" id="reg-name" name="name" type="text" placeholder="Tu nombre" autocomplete="name" required />
          </div>
          <div class="field-group anim-stagger" style="--i:1">
            <label class="label-glass" for="reg-phone">Teléfono</label>
            <input class="input-glass input-glow" id="reg-phone" name="phone" type="tel" inputmode="tel" placeholder="600 123 456" autocomplete="tel" required />
          </div>
          <div class="field-group anim-stagger" style="--i:2">
            <label class="label-glass" for="reg-pin">Crear PIN</label>
            <input class="input-glass input-glow pin-input" id="reg-pin" name="pin" type="password" inputmode="numeric" maxlength="4" pattern="\\d{4}" placeholder="4 dígitos" required />
          </div>
          <p id="register-error" class="login-error hidden" role="alert"></p>
          <button type="submit" id="register-submit" class="btn-bizum btn-shimmer w-full rounded-2xl py-3.5 text-sm anim-stagger" style="--i:3">
            <span class="btn-label">Crear cuenta</span>
          </button>
        </form>

        <p class="login-legal anim-stagger text-center text-[11px] text-white/35 mt-4" style="--i:4">
          Al registrarte aceptas la <a href="${APP_CONFIG.privacyUrl}" class="text-violet-300/80 underline">política de privacidad</a>.
          Los Bizums se envían desde tu banco al organizador.
        </p>
      </div>
    </div>
  `;
}

function renderAppHeader(state) {
  const { user } = state;
  return `
    <header class="app-header anim-fade-down">
      <div class="flex items-center gap-3 min-w-0">
        <div class="liquid-icon">${ICONS.jar.replace('h-8 w-8', 'h-5 w-5')}</div>
        <div class="min-w-0">
          <p class="truncate text-base font-bold sm:text-lg">Hola, ${user.name}</p>
          <p class="text-xs text-white/45">Bizum · ${user.bizumAlias || user.phone}</p>
        </div>
      </div>
      <button type="button" data-action="profile" class="liquid-avatar glass-interactive" aria-label="Perfil">${getInitial(user.name)}</button>
    </header>
  `;
}

function renderParticipantCard(participant, bote, index) {
  const gradient = getGradient(index);
  const initial = getInitial(participant.name);
  const isMe = participant.isMe;
  const amount = formatMoney(bote.amountPerPerson);

  const statusIcon = participant.paid
    ? `<div class="check-paid anim-pop flex h-6 w-6 items-center justify-center rounded-full">${ICONS.check}</div>`
    : `<div class="pulse-wait flex h-6 w-6 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/20">${ICONS.clock}</div>`;

  let statusText;
  if (participant.paid) {
    statusText = `<p class="text-xs text-emerald-400">${amount} · Pagado</p>`;
  } else if (isMe) {
    statusText = `<p class="text-xs text-amber-300">${amount} · Pendiente</p>`;
  } else {
    statusText = `<button type="button" data-remind="${participant.id}" class="btn-ghost text-xs font-semibold text-violet-300">Recordar</button>`;
  }

  return `
    <article class="liquid-card participant-card anim-stagger glass-interactive ${isMe && !participant.paid ? 'ring-glow' : ''}" style="--i:${index}">
      <div class="mb-2 flex items-start justify-between">
        <div class="avatar-ring flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br ${gradient} text-sm font-bold">${initial}</div>
        ${statusIcon}
      </div>
      <p class="truncate text-sm font-medium">${participant.name}${isMe ? ' <span class="text-white/35">(tú)</span>' : ''}</p>
      ${statusText}
    </article>
  `;
}

function renderHomeView(state) {
  const bote = getActiveBote(state);
  if (!bote) {
    return `
      ${renderAppHeader(state)}
      <div class="liquid-card empty-state anim-scale-in">
        <p class="mb-2 text-base font-medium text-white/80">Sin bote activo</p>
        <p class="mb-5 text-sm text-white/45">Crea uno o únete con código</p>
        <button type="button" id="btn-join-bote" class="btn-bizum btn-shimmer w-full rounded-2xl py-3 text-sm">Unirme con código</button>
      </div>
    `;
  }

  const collected = getCollected(bote);
  const progress = getProgress(bote);
  const paidCount = getPaidCount(bote);
  const total = bote.participants.length;
  const me = bote.participants.find((p) => p.isMe);
  const alreadyPaid = me?.paid;
  const deadlineText = bote.deadline ? formatDate(bote.deadline) : '';

  return `
    ${renderAppHeader(state)}
    <div class="home-layout">
      <section class="home-hero anim-slide-up" aria-labelledby="bote-titulo">
        <article class="liquid-card liquid-hero glass-strong">
          <div class="liquid-border"></div>
          <div class="relative z-10 p-5 sm:p-6">
            <div class="mb-3 flex flex-wrap items-center gap-2">
              <span class="badge-live">${bote.status === 'completed' ? 'Completado' : 'Activo'}</span>
              <span class="text-xs text-white/40">${total} personas</span>
              ${bote.shareCode ? `<button type="button" id="btn-copy-code" class="badge-code" data-code="${bote.shareCode}">${bote.shareCode}</button>` : ''}
            </div>
            <h2 id="bote-titulo" class="mb-1 text-xl font-bold sm:text-2xl lg:text-3xl">${bote.title}</h2>
            <p class="mb-5 text-sm text-white/50">${bote.subtitle}${deadlineText ? ` · ${deadlineText}` : ''}</p>
            <p class="mb-4 text-xs text-white/40">Bizum del organizador · <strong class="text-white/60">${bote.organizerPhone || state.user.phone}</strong></p>

            <div class="mb-3 flex items-end justify-between">
              <div>
                <p class="payment-amount anim-count">${collected}<span class="text-lg text-white/50">€</span></p>
                <p class="text-xs text-white/40">de ${bote.goal}€ · ${formatMoney(bote.amountPerPerson)}/pax</p>
              </div>
              <span class="percent-badge anim-pop">${progress}%</span>
            </div>

            <div class="progress-track progress-liquid mb-5 h-3" role="progressbar" aria-valuenow="${collected}" aria-valuemin="0" aria-valuemax="${bote.goal}">
              <div class="progress-fill" data-progress-fill style="width:${progress}%"></div>
              <div class="progress-shine"></div>
            </div>

            <button type="button" id="btn-pay-bizum" class="btn-bizum btn-shimmer w-full rounded-2xl py-3.5 text-base" ${alreadyPaid ? 'disabled' : ''}>
              ${ICONS.bizum}
              ${alreadyPaid ? 'Ya pagado ✓' : `Enviar ${formatMoney(bote.amountPerPerson)}`}
            </button>
            <div class="hero-actions">
              <button type="button" id="btn-share-bote" class="btn-secondary w-full rounded-xl py-2.5 text-sm">${ICONS.share} Invitar</button>
              <button type="button" id="btn-join-bote" class="btn-secondary w-full rounded-xl py-2.5 text-sm">Unirme</button>
            </div>
          </div>
        </article>
      </section>

      <section class="home-participants anim-slide-up" style="--delay:0.1s" aria-labelledby="participantes-titulo">
        <div class="mb-3 flex items-center justify-between">
          <h3 id="participantes-titulo" class="text-base font-semibold sm:text-lg">Participantes</h3>
          <span class="text-xs text-white/40">${paidCount}/${total} pagados</span>
        </div>
        <div class="participants-grid">
          ${bote.participants.map((p, i) => renderParticipantCard(p, bote, i)).join('')}
        </div>
      </section>
    </div>
  `;
}

function renderBotesView(state) {
  const { botes, activeBoteId } = state;

  if (!botes.length) {
    return `${renderAppHeader(state)}<div class="liquid-card empty-state anim-scale-in"><p>Sin botes · Pulsa +</p></div>`;
  }

  const cards = botes.map((bote, i) => {
    const collected = getCollected(bote);
    const progress = getProgress(bote);
    const isSelected = bote.id === activeBoteId;
    return `
      <article class="liquid-card list-card glass-interactive anim-stagger p-4 ${isSelected ? 'is-selected' : ''}" style="--i:${i}" data-select-bote="${bote.id}">
        <div class="mb-1 flex items-start justify-between gap-2">
          <h3 class="font-semibold">${bote.title}</h3>
          ${isSelected ? '<span class="badge-live text-[10px]">Activo</span>' : ''}
        </div>
        <p class="mb-2 text-xs text-white/45">${collected}€/${bote.goal}€ · ${getPaidCount(bote)}/${bote.participants.length}</p>
        <div class="progress-track h-2"><div class="progress-fill" style="width:${progress}%"></div></div>
      </article>
    `;
  }).join('');

  return `
    ${renderAppHeader(state)}
    <section class="anim-slide-up">
      <h2 class="mb-4 text-lg font-bold sm:text-xl">Mis Botes</h2>
      <div class="botes-list">${cards}</div>
    </section>
  `;
}

function renderActivityView(state) {
  const items = state.activity.length
    ? state.activity.map((act, i) => `
        <li class="liquid-card activity-item anim-stagger p-4" style="--i:${i}">
          <span class="activity-dot"></span>
          <div class="min-w-0">
            <p class="text-sm">${act.message}</p>
            <p class="mt-0.5 text-xs text-white/35">${formatRelative(act.date)}</p>
          </div>
        </li>
      `).join('')
    : '<li class="liquid-card empty-state"><p class="text-sm">Sin actividad</p></li>';

  return `
    ${renderAppHeader(state)}
    <section class="anim-slide-up">
      <h2 class="mb-4 text-lg font-bold sm:text-xl">Actividad</h2>
      <ul class="activity-list">${items}</ul>
    </section>
  `;
}

function renderProfileView(state) {
  const { user } = state;
  return `
    ${renderAppHeader(state)}
    <section class="anim-slide-up profile-section">
      <h2 class="mb-4 text-lg font-bold sm:text-xl">Mi Perfil</h2>
      <div class="liquid-card mb-4 p-4 text-sm text-white/55">
        Sesión activa · <strong class="text-white/85">${user.phone}</strong>
      </div>
      <form id="profile-form" class="liquid-card p-5 space-y-4">
        <div>
          <label class="label-glass" for="profile-name">Nombre</label>
          <input class="input-glass input-glow" id="profile-name" name="name" type="text" value="${user.name}" required />
        </div>
        <div>
          <label class="label-glass" for="profile-phone">Teléfono</label>
          <input class="input-glass input-glow" id="profile-phone" name="phone" type="tel" value="${user.phone}" required />
        </div>
        <div>
          <label class="label-glass" for="profile-bizum">Alias Bizum</label>
          <input class="input-glass input-glow" id="profile-bizum" name="bizumAlias" type="text" value="${user.bizumAlias}" required />
        </div>
        <button type="submit" class="btn-bizum btn-shimmer w-full rounded-2xl py-3 text-sm">Guardar</button>
        <button type="button" id="btn-logout" class="btn-secondary w-full rounded-2xl py-3 text-sm">Cerrar sesión</button>
        <button type="button" id="btn-reset-data" class="btn-danger w-full rounded-2xl py-3 text-sm">Vaciar mis botes</button>
      </form>
      <div class="legal-block liquid-card mt-4 p-4 text-xs text-white/45 leading-relaxed">
        <p class="font-semibold text-white/70 mb-2">Aviso legal</p>
        <p>Bote para Bizum v${APP_CONFIG.version} · Organizador de vacas en grupo.</p>
        <p class="mt-2">No somos entidad de pago. Los Bizums van al teléfono del organizador del bote, desde la app de tu banco.</p>
        <p class="mt-3">
          <a href="${APP_CONFIG.privacyUrl}" class="text-violet-300/90 underline">Política de privacidad</a>
        </p>
      </div>
    </section>
  `;
}

function renderView(state, viewName) {
  switch (viewName) {
    case 'home': return renderHomeView(state);
    case 'botes': return renderBotesView(state);
    case 'activity': return renderActivityView(state);
    case 'profile': return renderProfileView(state);
    default: return renderHomeView(state);
  }
}

function animateProgressBar(container) {
  const fill = container?.querySelector('[data-progress-fill]');
  if (!fill) return;
  const target = fill.style.width;
  fill.style.width = '0%';
  requestAnimationFrame(() => setTimeout(() => { fill.style.width = target; }, 200));
}

function triggerViewAnimations(container) {
  container?.querySelectorAll('.anim-stagger').forEach((el, i) => {
    el.style.animationDelay = `${(el.style.getPropertyValue('--i') || i) * 0.06}s`;
  });
}
