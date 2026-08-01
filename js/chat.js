/* ═══════════════════════════════════════════════════════════════════════════
   RabAI v5.0 "IndieDev Edition" — Chat (Frontend)
   RabbitGamesStudio™ / RGS Labs™
   ═══════════════════════════════════════════════════════════════════════════ */

// ─────────────────────────────────────────────────────────────────────────
// 1. State
// ─────────────────────────────────────────────────────────────────────────

let currentChatId = null;
let currentProjectId = null;
let isSending = false;
let abortController = null;

// ─────────────────────────────────────────────────────────────────────────
// 2. Initialize Chat Interface
// ─────────────────────────────────────────────────────────────────────────

function initChat() {
  const input = document.getElementById('chat-input');
  const sendBtn = document.getElementById('btn-send');

  if (input) {
    input.addEventListener('keydown', onInputKeydown);
    input.addEventListener('input', onInputChange);
  }

  if (sendBtn) {
    sendBtn.addEventListener('click', () => sendMsg());
  }

  // Welcome suggestions
  document.querySelectorAll('.welcome-suggestion').forEach(el => {
    el.addEventListener('click', () => {
      const text = el.dataset.prompt || el.querySelector('.welcome-suggestion-title')?.textContent || '';
      if (input) {
        input.value = text;
        input.focus();
      }
    });
  });
}

function onInputKeydown(e) {
  const input = e.target;

  // Command autocomplete navigation
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
    e.preventDefault();
    navigateAutocomplete(e.key === 'ArrowDown' ? 'down' : 'up');
    return;
  }

  if (e.key === 'Tab' || e.key === 'Enter') {
    if (selectAutocomplete(input)) {
      e.preventDefault();
      return;
    }
  }

  // Send on Enter (Shift+Enter for new line)
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMsg();
  }
}

function onInputChange(e) {
  const input = e.target;
  const value = input.value;

  // Auto-resize textarea
  input.style.height = 'auto';
  input.style.height = Math.min(input.scrollHeight, 200) + 'px';

  // Show command autocomplete
  if (value.startsWith('/')) {
    showCommandAutocomplete(input, getSetting('language', 'es'));
  } else {
    hideCommandAutocomplete();
  }

  // Toggle send button
  const sendBtn = document.getElementById('btn-send');
  if (sendBtn) {
    sendBtn.disabled = !value.trim();
  }
}

// ─────────────────────────────────────────────────────────────────────────
// 3. Send Message
// ─────────────────────────────────────────────────────────────────────────

async function sendMsg() {
  const input = document.getElementById('chat-input');
  const text = input?.value?.trim();
  if (!text || isSending) return;

  // Check moderation
  const modCheck = checkMod(text);
  if (!modCheck.allowed) {
    if (modCheck.banned) {
      showBanScreen(modCheck.remaining);
    } else {
      showToast('warning', t('warning'), modCheck.message, 3000);
    }
    return;
  }

  // Check auth
  const user = getCurrentUser?.();
  if (!user) {
    showToast('error', t('errorAuth', getSetting('language', 'es')), '');
    return;
  }

  // Check project
  if (!currentProjectId) {
    showToast('warning', t('noProjectSelected', getSetting('language', 'es')), '');
    return;
  }

  // Create chat if needed
  if (!currentChatId) {
    const newChat = createChat(user.id, currentProjectId, { name: 'Nueva conversación' });
    currentChatId = newChat.id;
    refreshChatList();
  }

  // Add user message to UI
  const chatArea = document.getElementById('chat-area');
  const userMsg = { role: 'user', content: text, timestamp: new Date().toISOString() };
  addMessage(user.id, currentProjectId, currentChatId, userMsg);
  renderMessage(userMsg, chatArea);

  // Clear input
  input.value = '';
  input.style.height = 'auto';
  hideCommandAutocomplete();

  // Show typing indicator
  showTyping();

  // Determine if command
  const command = getCommandByInput(text);
  const messages = buildMessages(user.id, currentProjectId, currentChatId, command);

  isSending = true;
  updateSendButton(true);

  try {
    abortController = new AbortController();

    const response = await fetch(BACKEND_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: getModelForUser(),
        messages: messages,
        temperature: getTemperature(),
        max_tokens: 4096
      }),
      signal: abortController.signal
    });

    hideTyping();

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'API Error');
    }

    const data = await response.json();
    const aiContent = data.choices?.[0]?.message?.content || 'Error: No response';

    const aiMsg = { role: 'assistant', content: aiContent, timestamp: new Date().toISOString() };
    addMessage(user.id, currentProjectId, currentChatId, aiMsg);
    renderMessage(aiMsg, chatArea);

    // Auto-name chat on first exchange
    autoNameChat(user.id, currentProjectId, currentChatId);

  } catch (err) {
    hideTyping();
    if (err.name === 'AbortError') {
      renderSystemMessage(t('cancelled', getSetting('language', 'es')), chatArea);
    } else {
      renderSystemMessage(t('errorGeneric', getSetting('language', 'es')) + ': ' + err.message, chatArea);
      showToast('error', t('errorGeneric', getSetting('language', 'es')), err.message);
    }
  } finally {
    isSending = false;
    updateSendButton(false);
    abortController = null;
  }
}

function buildMessages(userId, projectId, chatId, command) {
  const chat = getChat(userId, projectId, chatId);
  const messages = [];

  // System prompt
  let systemPrompt = getSystemPrompt(command);
  messages.push({ role: 'system', content: systemPrompt });

  // Add project context if available
  const project = getProject(userId, projectId);
  if (project) {
    messages.push({
      role: 'system',
      content: `Contexto del proyecto: "${project.name}" (${project.genre}). ${project.description || ''}`
    });
  }

  // Add chat history (last 20 messages to stay within context)
  if (chat?.messages) {
    const history = chat.messages.slice(-20);
    for (const msg of history) {
      messages.push({ role: msg.role, content: msg.content });
    }
  }

  return messages;
}

function getSystemPrompt(command) {
  const tone = getSetting('tone', 'balanced');
  const toneInstructions = {
    creative: 'Sé creativo, expansivo y brainstorming-friendly. Genera ideas fuera de lo común.',
    balanced: 'Sé equilibrado: creativo pero práctico. Prioriza lo viable.',
    precise: 'Sé directo, conciso y orientado a acción. Lista pasos concretos.'
  };

  let prompt = `Eres RabAI, un asistente especializado en desarrollo de videojuegos independientes. `;
  prompt += toneInstructions[tone] || toneInstructions.balanced;

  if (command) {
    const cmdPrompt = getCommandPrompt(command.cmd);
    if (cmdPrompt) {
      prompt += '\n\n' + cmdPrompt;
    }
  }

  return prompt;
}

function getModelForUser() {
  const profile = getCurrentProfile?.();
  const isPro = profile?.is_admin || profile?.plan === 'pro';
  return isPro ? MODELS.pro.id : MODELS.free.id;
}

function getTemperature() {
  const tone = getSetting('tone', 'balanced');
  return { creative: 0.9, balanced: 0.7, precise: 0.3 }[tone] || 0.7;
}

// ─────────────────────────────────────────────────────────────────────────
// 4. Auto-Name Chat
// ─────────────────────────────────────────────────────────────────────────

async function autoNameChat(userId, projectId, chatId) {
  const chat = getChat(userId, projectId, chatId);
  if (!chat || chat.name !== 'Nueva conversación') return;
  if (chat.messages.length < 2) return;

  // Generate name from first user message
  const firstUserMsg = chat.messages.find(m => m.role === 'user');
  if (!firstUserMsg) return;

  const newName = generateChatName(chat.messages);
  updateChat(userId, projectId, chatId, { name: newName });
  refreshChatList();
}

function refreshChatList() {
  const user = getCurrentUser?.();
  if (!user || !currentProjectId) return;
  const chats = getChats(user.id, currentProjectId);
  renderChatList(chats, currentChatId, getSetting('language', 'es'));
}

// ─────────────────────────────────────────────────────────────────────────
// 5. Render Messages
// ─────────────────────────────────────────────────────────────────────────

function renderMessage(msg, container) {
  if (!container) container = document.getElementById('chat-area');
  if (!container) return;

  const isUser = msg.role === 'user';
  const isSystem = msg.role === 'system';
  const lang = getSetting('language', 'es');

  if (isSystem) {
    renderSystemMessage(msg.content, container);
    return;
  }

  const div = document.createElement('div');
  div.className = 'message';
  div.dataset.msgIndex = container.querySelectorAll('.message').length;

  const avatar = isUser
    ? `<div class="message-avatar user">${t('you', lang).charAt(0)}</div>`
    : `<div class="message-avatar ai"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg></div>`;

  const time = msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString(lang, { hour: '2-digit', minute: '2-digit' }) : '';

  const content = renderMarkdown(msg.content);

  div.innerHTML = `
    ${avatar}
    <div class="message-content">
      <div class="message-header">
        <span class="message-author">${isUser ? t('you', lang) : t('aiName', lang)}</span>
        <span class="message-time">${time}</span>
      </div>
      <div class="message-body">${content}</div>
      ${!isUser ? renderMessageActions(div.dataset.msgIndex, msg.feedback) : ''}
    </div>
  `;

  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}

function renderSystemMessage(text, container) {
  if (!container) container = document.getElementById('chat-area');
  const div = document.createElement('div');
  div.className = 'message';
  div.innerHTML = `
    <div class="message-content" style="margin-left: 52px;">
      <div class="message-body" style="color: var(--text-muted); font-style: italic; font-size: var(--font-size-sm);">
        ${escHtml(text)}
      </div>
    </div>
  `;
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}

function renderMessageActions(msgIndex, feedback) {
  const lang = getSetting('language', 'es');
  const upClass = feedback === 'up' ? 'active' : '';
  const downClass = feedback === 'down' ? 'active thumb-down' : '';

  return `
    <div class="message-actions">
      <button class="btn-feedback-up ${upClass}" onclick="submitFeedback(${msgIndex}, 'up')" title="${t('feedbackThumbUp', lang)}">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>
      </button>
      <button class="btn-feedback-down ${downClass}" onclick="submitFeedback(${msgIndex}, 'down')" title="${t('feedbackThumbDown', lang)}">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h3a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-3"/></svg>
      </button>
      <button onclick="copyMessage(${msgIndex})" title="Copy">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
      </button>
    </div>
  `;
}

// ─────────────────────────────────────────────────────────────────────────
// 6. Feedback
// ─────────────────────────────────────────────────────────────────────────

function submitFeedback(msgIndex, type) {
  const user = getCurrentUser?.();
  if (!user || !currentProjectId || !currentChatId) return;

  updateMessageFeedback(user.id, currentProjectId, currentChatId, msgIndex, type);

  // Update UI
  const msgEl = document.querySelector(`.message[data-msg-index="${msgIndex}"]`);
  if (msgEl) {
    msgEl.querySelector('.btn-feedback-up')?.classList.toggle('active', type === 'up');
    msgEl.querySelector('.btn-feedback-down')?.classList.toggle('active', type === 'down');
  }

  showToast('success', t('feedbackThanks', getSetting('language', 'es')), '', 2000);
}

function copyMessage(msgIndex) {
  const user = getCurrentUser?.();
  if (!user || !currentProjectId || !currentChatId) return;

  const chat = getChat(user.id, currentProjectId, currentChatId);
  const msg = chat?.messages?.[msgIndex];
  if (!msg) return;

  navigator.clipboard.writeText(msg.content).then(() => {
    showToast('success', t('copied', getSetting('language', 'es')), '', 1500);
  });
}

// ─────────────────────────────────────────────────────────────────────────
// 7. Typing Indicator
// ─────────────────────────────────────────────────────────────────────────

function showTyping() {
  const chatArea = document.getElementById('chat-area');
  const existing = document.getElementById('typing-indicator');
  if (existing) return;

  const div = document.createElement('div');
  div.id = 'typing-indicator';
  div.className = 'message';
  div.innerHTML = `
    <div class="message-avatar ai"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg></div>
    <div class="message-content">
      <div class="typing-indicator"><span></span><span></span><span></span></div>
    </div>
  `;
  chatArea.appendChild(div);
  chatArea.scrollTop = chatArea.scrollHeight;
}

function hideTyping() {
  document.getElementById('typing-indicator')?.remove();
}

// ─────────────────────────────────────────────────────────────────────────
// 8. UI Helpers
// ─────────────────────────────────────────────────────────────────────────

function updateSendButton(loading) {
  const btn = document.getElementById('btn-send');
  if (!btn) return;
  btn.disabled = loading;
  btn.innerHTML = loading
    ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="animate-spin"><circle cx="12" cy="12" r="10" stroke-opacity="0.25"/><path d="M12 2a10 10 0 0 1 10 10" stroke-opacity="1"/></svg>`
    : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>`;
}

function selectChat(chatId) {
  currentChatId = chatId;
  const user = getCurrentUser?.();
  if (!user || !currentProjectId) return;

  const chat = getChat(user.id, currentProjectId, chatId);
  if (!chat) return;

  // Save last chat
  setLastChat(user.id, currentProjectId, chatId);

  // Update UI
  refreshChatList();

  // Clear and render messages
  const chatArea = document.getElementById('chat-area');
  chatArea.innerHTML = '';

  if (!chat.messages || chat.messages.length === 0) {
    renderWelcomeScreen();
  } else {
    for (const msg of chat.messages) {
      renderMessage(msg, chatArea);
    }
  }

  // Update topbar
  updateTopbar(chat.name, t('aiName', getSetting('language', 'es')));
}

function renderWelcomeScreen() {
  const chatArea = document.getElementById('chat-area');
  const lang = getSetting('language', 'es');

  chatArea.innerHTML = `
    <div class="welcome-screen">
      <div class="welcome-logo">
        <svg viewBox="0 0 96 96" fill="none">
          <circle cx="48" cy="48" r="40" fill="var(--accent-glow)"/>
          <path d="M48 20c-8 0-14 6-16 14-4-2-8 0-10 4-2 4 0 10 4 12-2 6 0 14 8 18 4 2 10 2 14 0 8-4 10-12 8-18 4-2 6-8 4-12-2-4-6-6-10-4-2-8-8-14-16-14z" fill="var(--accent)"/>
          <circle cx="42" cy="42" r="3" fill="var(--bg-primary)"/>
          <circle cx="54" cy="42" r="3" fill="var(--bg-primary)"/>
          <path d="M44 52q4 4 8 0" stroke="var(--bg-primary)" stroke-width="2" fill="none"/>
        </svg>
      </div>
      <h1 class="welcome-title">${t('welcomeTitle', lang)}</h1>
      <p class="welcome-subtitle">${t('welcomeSubtitle', lang)}</p>
      <div class="welcome-suggestions">
        <div class="welcome-suggestion" data-prompt="Quiero diseñar un juego de plataformas 2D con mecánicas de time rewind">
          <div class="welcome-suggestion-icon">🎮</div>
          <div class="welcome-suggestion-title">Diseñar un juego</div>
          <div class="welcome-suggestion-desc">Desde la idea hasta el GDD</div>
        </div>
        <div class="welcome-suggestion" data-prompt="/auditoria Tengo un RPG por turnos con 3 desarrolladores y 6 meses">
          <div class="welcome-suggestion-icon">🔍</div>
          <div class="welcome-suggestion-title">Auditar mi proyecto</div>
          <div class="welcome-suggestion-desc">Encuentra riesgos y debilidades</div>
        </div>
        <div class="welcome-suggestion" data-prompt="/scope Quiero hacer un metroidvania en 2 años con un equipo de 5 personas">
          <div class="welcome-suggestion-icon">📐</div>
          <div class="welcome-suggestion-title">Definir el MVP</div>
          <div class="welcome-suggestion-desc">Scope realista para tu equipo</div>
        </div>
        <div class="welcome-suggestion" data-prompt="/steam Mi juego se llama 'Void Walker', es un roguelike de acción en 3D">
          <div class="welcome-suggestion-icon">🎮</div>
          <div class="welcome-suggestion-title">Optimizar Steam</div>
          <div class="welcome-suggestion-desc">Tags, descripción y capsules</div>
        </div>
      </div>
    </div>
  `;

  // Re-attach click handlers
  chatArea.querySelectorAll('.welcome-suggestion').forEach(el => {
    el.addEventListener('click', () => {
      const input = document.getElementById('chat-input');
      const text = el.dataset.prompt || '';
      if (input) {
        input.value = text;
        input.focus();
      }
    });
  });

  updateTopbar(t('aiName', lang), '');
}

// ─────────────────────────────────────────────────────────────────────────
// 9. Chat Management
// ─────────────────────────────────────────────────────────────────────────

function createNewChat() {
  const user = getCurrentUser?.();
  if (!user || !currentProjectId) {
    showToast('warning', t('noProjectSelected', getSetting('language', 'es')), '');
    return;
  }

  const name = prompt(t('chatNamePlaceholder', getSetting('language', 'es')));
  if (!name) return;

  const chat = createChat(user.id, currentProjectId, { name: name.trim() });
  currentChatId = chat.id;
  refreshChatList();
  selectChat(chat.id);
}

function renameChat(chatId) {
  const user = getCurrentUser?.();
  if (!user || !currentProjectId) return;

  const chat = getChat(user.id, currentProjectId, chatId);
  if (!chat) return;

  const newName = prompt(t('renameChat', getSetting('language', 'es')), chat.name);
  if (!newName || newName.trim() === '') return;

  updateChat(user.id, currentProjectId, chatId, { name: newName.trim() });
  refreshChatList();
  if (currentChatId === chatId) {
    updateTopbar(newName.trim(), t('aiName', getSetting('language', 'es')));
  }
}

function deleteChat(chatId) {
  const user = getCurrentUser?.();
  if (!user || !currentProjectId) return;

  const chat = getChat(user.id, currentProjectId, chatId);
  if (!chat) return;

  const lang = getSetting('language', 'es');
  if (!confirm(t('deleteChatConfirm', lang))) return;

  deleteChat(user.id, currentProjectId, chatId);

  if (currentChatId === chatId) {
    currentChatId = null;
    const chatArea = document.getElementById('chat-area');
    chatArea.innerHTML = '';
    renderWelcomeScreen();
  }

  refreshChatList();
}

// ─────────────────────────────────────────────────────────────────────────
// 10. Export
// ─────────────────────────────────────────────────────────────────────────

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    initChat, sendMsg, selectChat,
    renderMessage, renderWelcomeScreen,
    createNewChat, renameChat, deleteChat,
    submitFeedback, copyMessage,
    currentChatId, currentProjectId
  };
}
