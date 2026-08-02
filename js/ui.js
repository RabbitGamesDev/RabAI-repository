/* ═══════════════════════════════════════════════════════════════════════════
   RabAI v5.0 "IndieDev Edition" — UI
   RabbitGamesStudio™ / RGS Labs™
   ═══════════════════════════════════════════════════════════════════════════ */

// ─────────────────────────────────────────────────────────────────────────
// 1. Theme & Accent Management
// ─────────────────────────────────────────────────────────────────────────

function initTheme() {
  const theme = getSetting('theme', 'dark');
  const accent = getSetting('accent', 'purple');
  applyTheme(theme);
  applyAccent(accent);
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  setSetting('theme', theme);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'dark';
  const next = current === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  return next;
}

function applyAccent(accent) {
  document.documentElement.setAttribute('data-accent', accent);
  setSetting('accent', accent);
  updateAccentUI(accent);
}

function updateAccentUI(accent) {
  document.querySelectorAll('.accent-option').forEach(el => {
    el.classList.toggle('selected', el.dataset.accent === accent);
  });
}

// ─────────────────────────────────────────────────────────────────────────
// 2. Custom Cursor
// ─────────────────────────────────────────────────────────────────────────

let cursorEl = null;
let cursorEnabled = true;

function initCursor() {
  cursorEnabled = getSetting('cursor', true);
  if (!cursorEnabled || isTouchDevice()) {
    disableCursor();
    return;
  }

  if (!cursorEl) {
    cursorEl = document.createElement('div');
    cursorEl.className = 'custom-cursor';
    cursorEl.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 0 1 .35-.15h6.87a.5.5 0 0 0 .35-.85L6.35 2.85a.5.5 0 0 0-.85.36Z"/></svg>`;
    document.body.appendChild(cursorEl);
  }

  document.body.style.cursor = 'none';

  document.addEventListener('mousemove', onCursorMove);
  document.addEventListener('mousedown', () => cursorEl?.classList.add('click'));
  document.addEventListener('mouseup', () => cursorEl?.classList.remove('click'));

  // Hover effect on interactive elements
  const hoverTargets = 'a, button, input, textarea, select, [role="button"], .chat-item, .project-card, .welcome-suggestion';
  document.addEventListener('mouseover', (e) => {
    if (e.target.closest(hoverTargets)) cursorEl?.classList.add('hover');
  });
  document.addEventListener('mouseout', (e) => {
    if (e.target.closest(hoverTargets)) cursorEl?.classList.remove('hover');
  });
}

function onCursorMove(e) {
  if (cursorEl) {
    cursorEl.style.left = e.clientX + 'px';
    cursorEl.style.top = e.clientY + 'px';
  }
}

function disableCursor() {
  cursorEnabled = false;
  document.body.style.cursor = '';
  if (cursorEl) {
    cursorEl.remove();
    cursorEl = null;
  }
  document.removeEventListener('mousemove', onCursorMove);
}

function toggleCursor() {
  cursorEnabled = !cursorEnabled;
  setSetting('cursor', cursorEnabled);
  if (cursorEnabled) initCursor();
  else disableCursor();
  return cursorEnabled;
}

function isTouchDevice() {
  return window.matchMedia('(pointer: coarse)').matches;
}

// ─────────────────────────────────────────────────────────────────────────
// 3. Sidebar
// ─────────────────────────────────────────────────────────────────────────

function initSidebar() {
  const sidebar = document.getElementById('sidebar');
  const collapsed = getSetting('sidebarCollapsed', false);

  if (collapsed) sidebar.classList.add('collapsed');

  document.getElementById('sidebar-toggle')?.addEventListener('click', toggleSidebar);
}

function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  sidebar.classList.toggle('collapsed');
  const collapsed = sidebar.classList.contains('collapsed');
  setSetting('sidebarCollapsed', collapsed);
  return collapsed;
}

function renderChatList(chats, activeChatId, lang) {
  const container = document.getElementById('chat-list');
  if (!container) return;

  if (!chats || chats.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="padding: var(--space-6) var(--space-4);">
        <p>${t('noChats', lang)}</p>
      </div>
    `;
    return;
  }

  container.innerHTML = chats.map(chat => `
    <div class="chat-item ${chat.id === activeChatId ? 'active' : ''}" data-chat-id="${escHtml(chat.id)}">
      <svg class="chat-item-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
      <span class="chat-item-name">${escHtml(chat.name)}</span>
      <div class="chat-item-actions">
        <button class="btn-rename" title="${t('renameChat', lang)}" onclick="event.stopPropagation(); window.renameChat('${escHtml(chat.id)}')">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        </button>
        <button class="btn-delete" title="${t('deleteChat', lang)}" onclick="event.stopPropagation(); window.deleteChat('${escHtml(chat.id)}')">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
        </button>
      </div>
    </div>
  `).join('');

  // Click to select chat
  container.querySelectorAll('.chat-item').forEach(item => {
    item.addEventListener('click', () => {
      const chatId = item.dataset.chatId;
      window.selectChat?.(chatId);
    });
  });
}

// ─────────────────────────────────────────────────────────────────────────
// 4. Modals
// ─────────────────────────────────────────────────────────────────────────

function openModal(modalId) {
  const overlay = document.getElementById(modalId);
  if (!overlay) return;
  overlay.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeModal(modalId) {
  const overlay = document.getElementById(modalId);
  if (!overlay) return;
  overlay.classList.remove('active');
  document.body.style.overflow = '';
}

function closeAllModals() {
  document.querySelectorAll('.modal-overlay.active').forEach(m => m.classList.remove('active'));
  document.body.style.overflow = '';
}

// Close on backdrop click
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.classList.remove('active');
    document.body.style.overflow = '';
  }
});

// Close on Escape
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeAllModals();
});

// ─────────────────────────────────────────────────────────────────────────
// 5. Toast Notifications
// ─────────────────────────────────────────────────────────────────────────

function showToast(type, title, message, duration = 4000) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const icons = {
    success: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
    error: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
    warning: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
    info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'
  };

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `
    <div class="toast-icon ${type}">${icons[type] || icons.info}</div>
    <div class="toast-content">
      <div class="toast-title">${escHtml(title)}</div>
      ${message ? `<div class="toast-message">${escHtml(message)}</div>` : ''}
    </div>
    <button class="toast-close" onclick="this.parentElement.remove()">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
    </button>
  `;

  container.appendChild(toast);

  // Auto remove
  setTimeout(() => {
    toast.classList.add('removing');
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// ─────────────────────────────────────────────────────────────────────────
// 6. Loading Screen
// ─────────────────────────────────────────────────────────────────────────

function showLoading() {
  const screen = document.getElementById('loading-screen');
  if (screen) screen.classList.remove('hidden');
}

function hideLoading() {
  const screen = document.getElementById('loading-screen');
  if (screen) {
    screen.classList.add('hidden');
    setTimeout(() => screen.style.display = 'none', 400);
  }
}

// ─────────────────────────────────────────────────────────────────────────
// 7. Topbar
// ─────────────────────────────────────────────────────────────────────────

function updateTopbar(title, subtitle) {
  const titleEl = document.getElementById('topbar-title');
  const subtitleEl = document.getElementById('topbar-subtitle');
  if (titleEl) titleEl.textContent = title;
  if (subtitleEl) subtitleEl.textContent = subtitle;
}

// ─────────────────────────────────────────────────────────────────────────
// 8. User Info in Sidebar
// ─────────────────────────────────────────────────────────────────────────

function renderUserInfo(user, profile, lang) {
  const container = document.getElementById('sidebar-user');
  if (!container) return;

  const plan = profile?.is_admin ? 'admin' : (profile?.plan || 'free');
  const planLabel = plan === 'admin' ? t('planAdmin', lang) : (plan === 'pro' ? t('planPro', lang) : t('planFree', lang));
  const email = user?.email || 'User';

  container.innerHTML = `
    <div class="user-avatar">${email.charAt(0).toUpperCase()}</div>
    <div class="user-info">
      <div class="user-email">${escHtml(email)}</div>
      <div class="user-plan">
        <span class="badge ${plan}">${planLabel}</span>
      </div>
    </div>
  `;
}

// ─────────────────────────────────────────────────────────────────────────
// 9. Screen Switching — FIXED
// ─────────────────────────────────────────────────────────────────────────

function showScreen(screenId) {
  // Hide all screens
  document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));

  // Show the target screen
  const screen = document.getElementById(screenId);
  if (screen) {
    screen.classList.remove('hidden');
  }

  // Ensure #app is visible when showing any screen inside it
  const app = document.getElementById('app');
  if (app && (screenId === 'projects-screen' || screenId === 'chat-interface')) {
    app.classList.remove('hidden');
  }
}

function showLoginScreen() {
  // Hide app, show login
  const app = document.getElementById('app');
  if (app) app.classList.add('hidden');

  const loginScreen = document.getElementById('login-screen');
  if (loginScreen) loginScreen.classList.remove('hidden');
}

function showProjectsScreen() {
  const app = document.getElementById('app');
  if (app) app.classList.remove('hidden');

  document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));

  const projectsScreen = document.getElementById('projects-screen');
  if (projectsScreen) projectsScreen.classList.remove('hidden');

  const chatInterface = document.getElementById('chat-interface');
  if (chatInterface) {
    chatInterface.classList.add('hidden');
    chatInterface.style.display = 'none';
  }
}

function showChatInterface() {
  const app = document.getElementById('app');
  if (app) app.classList.remove('hidden');

  const projectsScreen = document.getElementById('projects-screen');
  if (projectsScreen) projectsScreen.classList.add('hidden');

  const chatInterface = document.getElementById('chat-interface');
  if (chatInterface) {
    chatInterface.classList.remove('hidden');
    chatInterface.style.display = 'flex';
  }
}

// ─────────────────────────────────────────────────────────────────────────
// 10. Command Autocomplete
// ─────────────────────────────────────────────────────────────────────────

function showCommandAutocomplete(input, lang) {
  const container = document.getElementById('cmd-autocomplete');
  if (!container) return;

  const query = input.value.toLowerCase();
  if (!query.startsWith('/') || query.length < 1) {
    container.classList.add('hidden');
    return;
  }

  const suggestions = getCommandSuggestions(query.replace('/', ''));
  if (suggestions.length === 0) {
    container.classList.add('hidden');
    return;
  }

  container.classList.remove('hidden');
  container.innerHTML = suggestions.map((cmd, idx) => `
    <div class="cmd-autocomplete-item ${idx === 0 ? 'selected' : ''}" data-cmd="${escHtml(cmd.cmd)}">
      <div class="cmd-icon">${cmd.icon}</div>
      <div class="cmd-info">
        <div class="cmd-name">${escHtml(cmd.cmd)}</div>
        <div class="cmd-desc">${escHtml(t(cmd.desc_key, lang))}</div>
      </div>
      <span class="cmd-shortcut">${escHtml(cmd.cmd)}</span>
    </div>
  `).join('');

  // Click to select
  container.querySelectorAll('.cmd-autocomplete-item').forEach(item => {
    item.addEventListener('click', () => {
      input.value = item.dataset.cmd + ' ';
      input.focus();
      container.classList.add('hidden');
    });
  });
}

function hideCommandAutocomplete() {
  document.getElementById('cmd-autocomplete')?.classList.add('hidden');
}

function navigateAutocomplete(direction) {
  const container = document.getElementById('cmd-autocomplete');
  if (!container || container.classList.contains('hidden')) return;

  const items = container.querySelectorAll('.cmd-autocomplete-item');
  const current = container.querySelector('.selected');
  let nextIdx = 0;

  if (current) {
    const currentIdx = Array.from(items).indexOf(current);
    nextIdx = direction === 'down' 
      ? (currentIdx + 1) % items.length 
      : (currentIdx - 1 + items.length) % items.length;
    current.classList.remove('selected');
  }

  items[nextIdx]?.classList.add('selected');
  items[nextIdx]?.scrollIntoView({ block: 'nearest' });
}

function selectAutocomplete(input) {
  const container = document.getElementById('cmd-autocomplete');
  if (!container || container.classList.contains('hidden')) return false;

  const selected = container.querySelector('.selected');
  if (selected) {
    input.value = selected.dataset.cmd + ' ';
    input.focus();
    container.classList.add('hidden');
    return true;
  }
  return false;
}

// ─────────────────────────────────────────────────────────────────────────
// 11. Ban Screen
// ─────────────────────────────────────────────────────────────────────────

function showBanScreen(seconds) {
  const screen = document.getElementById('ban-screen');
  if (!screen) return;

  screen.classList.remove('hidden');
  const timerEl = document.getElementById('ban-timer');

  const interval = setInterval(() => {
    seconds--;
    if (timerEl) timerEl.textContent = seconds + 's';
    if (seconds <= 0) {
      clearInterval(interval);
      screen.classList.add('hidden');
    }
  }, 1000);
}

// ─────────────────────────────────────────────────────────────────────────
// 12. Markdown Rendering (simple)
// ─────────────────────────────────────────────────────────────────────────

function renderMarkdown(text) {
  if (!text) return '';

  // Escape HTML first
  let html = escHtml(text);

  // Headers
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

  // Bold & Italic
  html = html.replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>');
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');

  // Code blocks
  html = html.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');

  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');

  // Lists
  html = html.replace(/^\- (.*$)/gim, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>');
  html = html.replace(/<\/ul>\s?<ul>/g, '');

  // Blockquotes
  html = html.replace(/^> (.*$)/gim, '<blockquote>$1</blockquote>');

  // Horizontal rule
  html = html.replace(/^---$/gim, '<hr>');

  // Line breaks
  html = html.replace(/\n/g, '<br>');

  // Clean up extra breaks
  html = html.replace(/<br><br>/g, '</p><p>');
  html = html.replace(/^(.+)$/gm, (match) => {
    if (match.startsWith('<')) return match;
    return `<p>${match}</p>`;
  });
  html = html.replace(/<p><\/p>/g, '');
  html = html.replace(/<\/p><p>/g, '</p><p>');

  return html;
}

// ─────────────────────────────────────────────────────────────────────────
// 13. Export
// ─────────────────────────────────────────────────────────────────────────

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    initTheme, applyTheme, toggleTheme, applyAccent, updateAccentUI,
    initCursor, toggleCursor, disableCursor,
    initSidebar, toggleSidebar, renderChatList,
    openModal, closeModal, closeAllModals,
    showToast, showLoading, hideLoading,
    updateTopbar, renderUserInfo,
    showScreen, showLoginScreen, showProjectsScreen, showChatInterface,
    showCommandAutocomplete, hideCommandAutocomplete, navigateAutocomplete, selectAutocomplete,
    showBanScreen, renderMarkdown
  };
}
