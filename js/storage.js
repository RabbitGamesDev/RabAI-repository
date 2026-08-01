/* ═══════════════════════════════════════════════════════════════════════════
   RabAI v5.0 "IndieDev Edition" — Storage
   RabbitGamesStudio™ / RGS Labs™
   ═══════════════════════════════════════════════════════════════════════════ */

// ─────────────────────────────────────────────────────────────────────────
// 1. Generic localStorage Helpers
// ─────────────────────────────────────────────────────────────────────────

function lsGet(key, defaultValue = null) {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (e) {
    return defaultValue;
  }
}

function lsSet(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (e) {
    console.warn('Storage full or unavailable:', e);
    return false;
  }
}

function lsRemove(key) {
  try {
    localStorage.removeItem(key);
  } catch (e) {
    // ignore
  }
}

function lsClear() {
  try {
    localStorage.clear();
  } catch (e) {
    // ignore
  }
}

// ─────────────────────────────────────────────────────────────────────────
// 2. User Settings
// ─────────────────────────────────────────────────────────────────────────

function getSetting(key, defaultValue = null) {
  return lsGet(STORAGE_KEYS[key] || key, defaultValue);
}

function setSetting(key, value) {
  return lsSet(STORAGE_KEYS[key] || key, value);
}

function getAllSettings() {
  return {
    theme: getSetting('theme', 'dark'),
    accent: getSetting('accent', 'purple'),
    language: getSetting('language', 'es'),
    cursor: getSetting('cursor', true),
    sounds: getSetting('sounds', false),
    tone: getSetting('tone', 'balanced'),
    sidebarCollapsed: getSetting('sidebarCollapsed', false)
  };
}

// ─────────────────────────────────────────────────────────────────────────
// 3. Projects
// ─────────────────────────────────────────────────────────────────────────

function getProjectsKey(userId) {
  return `rabai_projects_${userId}`;
}

function getProjects(userId) {
  return lsGet(getProjectsKey(userId), []);
}

function saveProjects(userId, projects) {
  return lsSet(getProjectsKey(userId), projects);
}

function getProject(userId, projectId) {
  const projects = getProjects(userId);
  return projects.find(p => p.id === projectId) || null;
}

function createProject(userId, projectData) {
  const projects = getProjects(userId);
  const newProject = {
    id: generateId(),
    name: projectData.name,
    genre: projectData.genre,
    description: projectData.description,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...projectData
  };
  projects.push(newProject);
  saveProjects(userId, projects);
  return newProject;
}

function updateProject(userId, projectId, updates) {
  const projects = getProjects(userId);
  const idx = projects.findIndex(p => p.id === projectId);
  if (idx === -1) return null;
  projects[idx] = { ...projects[idx], ...updates, updatedAt: new Date().toISOString() };
  saveProjects(userId, projects);
  return projects[idx];
}

function deleteProject(userId, projectId) {
  const projects = getProjects(userId);
  const filtered = projects.filter(p => p.id !== projectId);
  saveProjects(userId, filtered);
  // Also delete all chats for this project
  lsRemove(getChatsKey(userId, projectId));
  return filtered;
}

// ─────────────────────────────────────────────────────────────────────────
// 4. Chats (per project)
// ─────────────────────────────────────────────────────────────────────────

function getChatsKey(userId, projectId) {
  return `rabai_chats_${userId}_proj_${projectId}`;
}

function getChats(userId, projectId) {
  return lsGet(getChatsKey(userId, projectId), []);
}

function saveChats(userId, projectId, chats) {
  return lsSet(getChatsKey(userId, projectId), chats);
}

function getChat(userId, projectId, chatId) {
  const chats = getChats(userId, projectId);
  return chats.find(c => c.id === chatId) || null;
}

function createChat(userId, projectId, chatData) {
  const chats = getChats(userId, projectId);
  const newChat = {
    id: generateId(),
    name: chatData.name || 'Nueva conversación',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    messages: [],
    ...chatData
  };
  chats.push(newChat);
  saveChats(userId, projectId, chats);
  return newChat;
}

function updateChat(userId, projectId, chatId, updates) {
  const chats = getChats(userId, projectId);
  const idx = chats.findIndex(c => c.id === chatId);
  if (idx === -1) return null;
  chats[idx] = { ...chats[idx], ...updates, updatedAt: new Date().toISOString() };
  saveChats(userId, projectId, chats);
  return chats[idx];
}

function deleteChat(userId, projectId, chatId) {
  const chats = getChats(userId, projectId);
  const filtered = chats.filter(c => c.id !== chatId);
  saveChats(userId, projectId, filtered);
  return filtered;
}

function addMessage(userId, projectId, chatId, message) {
  const chat = getChat(userId, projectId, chatId);
  if (!chat) return null;
  if (!chat.messages) chat.messages = [];
  chat.messages.push({
    id: generateId(),
    role: message.role,
    content: message.content,
    timestamp: new Date().toISOString(),
    feedback: null
  });
  chat.updatedAt = new Date().toISOString();
  updateChat(userId, projectId, chatId, { messages: chat.messages, updatedAt: chat.updatedAt });
  return chat;
}

function updateMessageFeedback(userId, projectId, chatId, msgIndex, feedback) {
  const chat = getChat(userId, projectId, chatId);
  if (!chat || !chat.messages[msgIndex]) return null;
  chat.messages[msgIndex].feedback = feedback;
  updateChat(userId, projectId, chatId, { messages: chat.messages });
  return chat;
}

// ─────────────────────────────────────────────────────────────────────────
// 5. Last Active (restore on reload)
// ─────────────────────────────────────────────────────────────────────────

function getLastProject(userId) {
  return lsGet(`${STORAGE_KEYS.lastProject}_${userId}`, null);
}

function setLastProject(userId, projectId) {
  return lsSet(`${STORAGE_KEYS.lastProject}_${userId}`, projectId);
}

function getLastChat(userId, projectId) {
  return lsGet(`${STORAGE_KEYS.lastChat}_${userId}_${projectId}`, null);
}

function setLastChat(userId, projectId, chatId) {
  return lsSet(`${STORAGE_KEYS.lastChat}_${userId}_${projectId}`, chatId);
}

// ─────────────────────────────────────────────────────────────────────────
// 6. Data Export/Import
// ─────────────────────────────────────────────────────────────────────────

function exportAllData(userId) {
  const data = {
    version: APP_VERSION,
    exportedAt: new Date().toISOString(),
    userId: userId,
    settings: getAllSettings(),
    projects: getProjects(userId),
    moderation: lsGet(MODERATION_KEY, { strikes: 0, bannedUntil: 0, lastWarning: null })
  };

  // Include chats for each project
  data.projects = data.projects.map(p => ({
    ...p,
    chats: getChats(userId, p.id)
  }));

  return data;
}

function importAllData(userId, data) {
  if (!data || !data.projects) return false;

  // Restore projects
  saveProjects(userId, data.projects.map(p => {
    const { chats, ...project } = p;
    return project;
  }));

  // Restore chats per project
  for (const project of data.projects) {
    if (project.chats) {
      saveChats(userId, project.id, project.chats);
    }
  }

  // Restore settings
  if (data.settings) {
    for (const [key, value] of Object.entries(data.settings)) {
      setSetting(key, value);
    }
  }

  return true;
}

function clearAllData(userId) {
  // Remove all project-related keys
  const projects = getProjects(userId);
  for (const p of projects) {
    lsRemove(getChatsKey(userId, p.id));
  }
  lsRemove(getProjectsKey(userId));
  lsRemove(`${STORAGE_KEYS.lastProject}_${userId}`);
  lsRemove(MODERATION_KEY);
}

// ─────────────────────────────────────────────────────────────────────────
// 7. Utility
// ─────────────────────────────────────────────────────────────────────────

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

function generateChatName(messages) {
  if (!messages || messages.length === 0) return 'Nueva conversación';
  const firstUserMsg = messages.find(m => m.role === 'user');
  if (!firstUserMsg) return 'Nueva conversación';
  // Take first 3-4 words
  const words = firstUserMsg.content.trim().split(/\s+/).slice(0, 4);
  let name = words.join(' ');
  if (firstUserMsg.content.length > name.length) name += '...';
  return name || 'Nueva conversación';
}

// ─────────────────────────────────────────────────────────────────────────
// 8. Export
// ─────────────────────────────────────────────────────────────────────────

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    lsGet, lsSet, lsRemove, lsClear,
    getSetting, setSetting, getAllSettings,
    getProjectsKey, getProjects, saveProjects,
    getProject, createProject, updateProject, deleteProject,
    getChatsKey, getChats, saveChats,
    getChat, createChat, updateChat, deleteChat,
    addMessage, updateMessageFeedback,
    getLastProject, setLastProject, getLastChat, setLastChat,
    exportAllData, importAllData, clearAllData,
    generateId, generateChatName
  };
}