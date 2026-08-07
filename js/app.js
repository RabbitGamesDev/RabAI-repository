/* ═══════════════════════════════════════════════════════════════════════════
   RabAI v5.0 "IndieDev Edition" — App (Orchestrator)
   RabbitGamesStudio™ / RGS Labs™
   ═══════════════════════════════════════════════════════════════════════════ */

// ─────────────────────────────────────────────────────────────────────────
// 1. Initialization Sequence
// ─────────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', async () => {
  console.log(`🐰 ${APP_NAME} ${APP_VERSION} "${APP_SUBTITLE}" initializing...`);

  // Step 1: Show loading screen (min 1.2s for UX)
  const loadingStart = Date.now();
  showLoading();

  // Step 2: Initialize core systems
  initTheme();
  initCursor();
  initSidebar();

  // FIXED: initSupabase is a function, not an optional property
  if (typeof initSupabase === 'function') {
    initSupabase();
  }

  // Step 3: Check auth
  let isAuthenticated = false;
  try {
    isAuthenticated = await initAuth();
  } catch (err) {
    console.error('Auth init error:', err);
    showLoginScreen();
  }

  // Step 4: Initialize UI modules
  initAuthUI();
  initProjects();
  initProjectSettings();
  initChat();
  initExportUI();

  // Step 5: Setup global events
  setupGlobalEvents();
  setupKeyboardShortcuts();

  // Step 6: Hide loading (respect minimum time)
  const elapsed = Date.now() - loadingStart;
  const minLoadTime = 1200;
  const remaining = Math.max(0, minLoadTime - elapsed);

  setTimeout(() => {
    hideLoading();
    console.log(`🐰 ${APP_NAME} ready!`);

    if (isAuthenticated) {
      // Try to restore last project
      restoreLastSession();
    }
  }, remaining);
});

// ─────────────────────────────────────────────────────────────────────────
// 2. Session Restoration
// ─────────────────────────────────────────────────────────────────────────

function restoreLastSession() {
  const user = getCurrentUser();
  if (!user) return;

  const lastProjectId = getLastProject(user.id);
  if (lastProjectId) {
    const project = getProject(user.id, lastProjectId);
    if (project) {
      enterProject(lastProjectId);
      return;
    }
  }

  // No last project, show projects screen
  showProjectsScreen();
  loadProjects();
}

// ─────────────────────────────────────────────────────────────────────────
// 3. Global Event Listeners
// ─────────────────────────────────────────────────────────────────────────

function setupGlobalEvents() {
  // Topbar buttons
  document.getElementById('btn-back')?.addEventListener('click', backToProjects);
  document.getElementById('btn-new-chat')?.addEventListener('click', createNewChat);
  document.getElementById('btn-settings')?.addEventListener('click', () => openModal('settings-modal'));
  document.getElementById('btn-info')?.addEventListener('click', () => openModal('info-modal'));
  document.getElementById('btn-export')?.addEventListener('click', () => exportProject('markdown'));

  // Settings modal
  document.getElementById('btn-close-settings')?.addEventListener('click', () => closeModal('settings-modal'));
  document.getElementById('settings-form')?.addEventListener('submit', onSaveSettings);
  document.getElementById('btn-clear-data')?.addEventListener('click', onClearData);
  document.getElementById('btn-delete-account')?.addEventListener('click', deleteUserAccount);

  // Info modal
  document.getElementById('btn-close-info')?.addEventListener('click', () => closeModal('info-modal'));

  // Logout
  document.getElementById('btn-logout')?.addEventListener('click', logout);

  // Mobile sidebar toggle
  document.getElementById('btn-mobile-menu')?.addEventListener('click', () => {
    document.getElementById('sidebar')?.classList.toggle('open');
  });

  // Close mobile sidebar on backdrop click
  document.addEventListener('click', (e) => {
    const sidebar = document.getElementById('sidebar');
    if (sidebar?.classList.contains('open') && !sidebar.contains(e.target) && !e.target.closest('#btn-mobile-menu')) {
      sidebar.classList.remove('open');
    }
  });
}

// ─────────────────────────────────────────────────────────────────────────
// 4. Keyboard Shortcuts
// ─────────────────────────────────────────────────────────────────────────

function setupKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    // Ignore if typing in input/textarea
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
      // Allow Escape to close modals even when typing
      if (e.key === 'Escape') {
        closeAllModals();
        hideCommandAutocomplete();
      }
      return;
    }

    const lang = getSetting('language', 'es');

    // Ctrl/Cmd + N → New Chat
    if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
      e.preventDefault();
      createNewChat();
    }

    // Ctrl/Cmd + , → Settings
    if ((e.ctrlKey || e.metaKey) && e.key === ',') {
      e.preventDefault();
      openModal('settings-modal');
    }

    // Ctrl/Cmd + B → Toggle Sidebar
    if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
      e.preventDefault();
      toggleSidebar();
    }

    // Ctrl/Cmd + / → Focus input
    if ((e.ctrlKey || e.metaKey) && e.key === '/') {
      e.preventDefault();
      document.getElementById('chat-input')?.focus();
    }

    // Ctrl/Cmd + K → Command palette (future)
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      document.getElementById('chat-input')?.focus();
      // Could open command palette modal in future
    }

    // Escape → Close modals
    if (e.key === 'Escape') {
      closeAllModals();
      hideCommandAutocomplete();
    }
  });
}

// ─────────────────────────────────────────────────────────────────────────
// 5. Settings Management
// ─────────────────────────────────────────────────────────────────────────

function onSaveSettings(e) {
  e.preventDefault();
  const form = e.target;
  const lang = getSetting('language', 'es');

  // Get values
  const themeCheckbox = document.getElementById('theme-toggle');
  const theme = themeCheckbox?.checked ? 'light' : 'dark';
  const accent = document.querySelector('.accent-option.selected')?.dataset.accent || 'purple';
  const language = form.querySelector('[name="language"]')?.value || 'es';
  const cursor = form.querySelector('[name="cursor"]')?.checked ?? true;
  const sounds = form.querySelector('[name="sounds"]')?.checked ?? false;
  const tone = form.querySelector('[name="tone"]:checked')?.value || 'balanced';

  // Apply
  applyTheme(theme);
  applyAccent(accent);
  setSetting('language', language);
  setSetting('cursor', cursor);
  setSetting('sounds', sounds);
  setSetting('tone', tone);

  // Re-init cursor if changed
  if (cursor !== getSetting('cursor')) {
    if (cursor) initCursor();
    else disableCursor();
  }

  closeModal('settings-modal');
  showToast('success', t('save', lang), '', 2000);

  // Refresh UI with new language
  if (language !== getSetting('language')) {
    location.reload(); // Simplest way to re-render all i18n
  }
}

function onClearData() {
  const lang = getSetting('language', 'es');
  if (!confirm(t('clearDataConfirm', lang))) return;

  const user = getCurrentUser();
  if (user) {
    clearAllData(user.id);
  }

  // Clear settings except auth
  const theme = getSetting('theme');
  const accent = getSetting('accent');
  const language = getSetting('language');

  lsClear();

  // Restore minimal settings
  setSetting('theme', theme);
  setSetting('accent', accent);
  setSetting('language', language);

  showToast('success', t('clearData', lang), '', 3000);
  location.reload();
}

// ─────────────────────────────────────────────────────────────────────────
// 6. Populate Settings Form
// ─────────────────────────────────────────────────────────────────────────

function populateSettingsForm() {
  const form = document.getElementById('settings-form');
  if (!form) return;

  const settings = getAllSettings();

  // Theme
  const themeRadio = form.querySelector(`[name="theme"][value="${settings.theme}"]`);
  if (themeRadio) themeRadio.checked = true;

  // Accent
  document.querySelectorAll('.accent-option').forEach(el => {
    el.classList.toggle('selected', el.dataset.accent === settings.accent);
  });

  // Language
  const langSelect = form.querySelector('[name="language"]');
  if (langSelect) {
    langSelect.value = settings.language;
  }

  // Cursor
  const cursorToggle = form.querySelector('[name="cursor"]');
  if (cursorToggle) cursorToggle.checked = settings.cursor;

  // Sounds
  const soundsToggle = form.querySelector('[name="sounds"]');
  if (soundsToggle) soundsToggle.checked = settings.sounds;

  // Tone
  const toneRadio = form.querySelector(`[name="tone"][value="${settings.tone}"]`);
  if (toneRadio) toneRadio.checked = true;
}

// ─────────────────────────────────────────────────────────────────────────
// 7. Global Error Handling
// ─────────────────────────────────────────────────────────────────────────

window.addEventListener('error', (e) => {
  console.error('Global error:', e.error);
  showToast('error', 'Error', e.message || 'Something went wrong', 5000);
});

window.addEventListener('unhandledrejection', (e) => {
  console.error('Unhandled rejection:', e.reason);
  showToast('error', 'Error', e.reason?.message || 'Promise rejected', 5000);
});

// ─────────────────────────────────────────────────────────────────────────
// 8. Service Worker (future: PWA)
// ─────────────────────────────────────────────────────────────────────────

if ('serviceWorker' in navigator) {
  // Future: register SW for offline support
  // navigator.serviceWorker.register('/sw.js');
}

// ─────────────────────────────────────────────────────────────────────────
// 9. Accent Selection (global function for onclick)
// ─────────────────────────────────────────────────────────────────────────

function selectAccent(el) {
  document.querySelectorAll('.accent-option').forEach(opt => opt.classList.remove('selected'));
  el.classList.add('selected');
}

// ─────────────────────────────────────────────────────────────────────────
// 10. Fix populateSettingsForm - use correct selectors
// ─────────────────────────────────────────────────────────────────────────

function populateSettingsForm() {
  const form = document.getElementById('settings-form');
  if (!form) return;

  const settings = getAllSettings();

  // Theme: checkbox checked = light theme
  const themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) themeToggle.checked = settings.theme === 'light';

  // Accent: update UI
  document.querySelectorAll('.accent-option').forEach(el => {
    el.classList.toggle('selected', el.dataset.accent === settings.accent);
  });

  // Language
  const langSelect = form.querySelector('[name="language"]');
  if (langSelect) langSelect.value = settings.language;

  // Cursor
  const cursorToggle = form.querySelector('[name="cursor"]');
  if (cursorToggle) cursorToggle.checked = settings.cursor;

  // Sounds
  const soundsToggle = form.querySelector('[name="sounds"]');
  if (soundsToggle) soundsToggle.checked = settings.sounds;

  // Tone
  const toneRadios = form.querySelectorAll('[name="tone"]');
  toneRadios.forEach(r => { r.checked = r.value === settings.tone; });
}

// ─────────────────────────────────────────────────────────────────────────
// 11. Export
// ─────────────────────────────────────────────────────────────────────────

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    restoreLastSession,
    setupGlobalEvents,
    setupKeyboardShortcuts,
    onSaveSettings,
    onClearData,
    populateSettingsForm,
    selectAccent
  };
}