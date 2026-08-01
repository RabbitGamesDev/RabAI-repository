/* ═══════════════════════════════════════════════════════════════════════════
   RabAI v5.0 "IndieDev Edition" — Projects
   RabbitGamesStudio™ / RGS Labs™
   ═══════════════════════════════════════════════════════════════════════════ */

// ─────────────────────────────────────────────────────────────────────────
// 1. State
// ─────────────────────────────────────────────────────────────────────────

let currentProjectId = null;

// ─────────────────────────────────────────────────────────────────────────
// 2. Initialize Projects Screen
// ─────────────────────────────────────────────────────────────────────────

function initProjects() {
  const newProjectBtn = document.getElementById('btn-new-project');
  const newProjectModal = document.getElementById('new-project-modal');
  const projectForm = document.getElementById('new-project-form');

  newProjectBtn?.addEventListener('click', () => openModal('new-project-modal'));
  
  projectForm?.addEventListener('submit', onCreateProject);

  // Close modal on cancel
  document.getElementById('btn-cancel-project')?.addEventListener('click', () => {
    closeModal('new-project-modal');
    projectForm?.reset();
  });

  // Populate genre select
  const genreSelect = document.getElementById('project-genre');
  if (genreSelect) {
    genreSelect.innerHTML = GENRES.map(g => 
      `<option value="${escHtml(g)}">${escHtml(g)}</option>`
    ).join('');
  }
}

// ─────────────────────────────────────────────────────────────────────────
// 3. Load & Render Projects
// ─────────────────────────────────────────────────────────────────────────

function loadProjects() {
  const user = getCurrentUser?.();
  if (!user) return;

  const projects = getProjects(user.id);
  renderProjectsGrid(projects);
}

function renderProjectsGrid(projects) {
  const grid = document.getElementById('projects-grid');
  const lang = getSetting('language', 'es');

  if (!grid) return;

  // Always show "New Project" card first
  let html = `
    <div class="project-card new" onclick="openNewProjectModal()">
      <div class="new-icon">+</div>
      <div class="new-text">${t('newProject', lang)}</div>
    </div>
  `;

  // Render existing projects
  html += projects.map(p => renderProjectCard(p, lang)).join('');

  grid.innerHTML = html;
}

function renderProjectCard(project, lang) {
  const date = project.createdAt 
    ? new Date(project.createdAt).toLocaleDateString(lang) 
    : t('today', lang);

  return `
    <div class="project-card" data-project-id="${escHtml(project.id)}">
      <div class="project-card-header">
        <div class="project-card-icon">🎮</div>
        <div class="project-card-actions">
          <button onclick="event.stopPropagation(); editProjectSettings('${escHtml(project.id)}')" title="${t('projectSettings', lang)}">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
          </button>
          <button onclick="event.stopPropagation(); deleteProjectConfirm('${escHtml(project.id)}')" title="${t('deleteProject', lang)}">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            </svg>
          </button>
        </div>
      </div>
      <div class="project-card-name">${escHtml(project.name)}</div>
      <div class="project-card-genre">${escHtml(project.genre)}</div>
      <div class="project-card-desc">${escHtml(project.description || '')}</div>
      <div class="project-card-meta">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/>
          <line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
        ${date}
        <span style="margin-left: auto;">
          ${getChatCount(project.id)} ${getChatCount(project.id) === 1 ? 'chat' : 'chats'}
        </span>
      </div>
    </div>
  `;
}

function getChatCount(projectId) {
  const user = getCurrentUser?.();
  if (!user) return 0;
  return getChats(user.id, projectId).length;
}

// ─────────────────────────────────────────────────────────────────────────
// 4. Create Project
// ─────────────────────────────────────────────────────────────────────────

function openNewProjectModal() {
  const form = document.getElementById('new-project-form');
  form?.reset();
  openModal('new-project-modal');
}

async function onCreateProject(e) {
  e.preventDefault();
  const form = e.target;
  const lang = getSetting('language', 'es');

  const name = form.querySelector('[name="name"]')?.value.trim();
  const genre = form.querySelector('[name="genre"]')?.value;
  const description = form.querySelector('[name="description"]')?.value.trim();

  if (!name) {
    showToast('error', t('errorRequired', lang), '');
    return;
  }

  const user = getCurrentUser?.();
  if (!user) {
    showToast('error', t('errorAuth', lang), '');
    return;
  }

  const project = createProject(user.id, {
    name,
    genre: genre || 'Other',
    description: description || '',
    createdAt: new Date().toISOString()
  });

  closeModal('new-project-modal');
  form.reset();
  
  showToast('success', t('newProject', lang), `"${name}" ${t('created', lang) || 'creado'}`, 3000);
  
  loadProjects();
  
  // Auto-enter the new project
  enterProject(project.id);
}

// ─────────────────────────────────────────────────────────────────────────
// 5. Enter Project (go to chat interface)
// ─────────────────────────────────────────────────────────────────────────

function enterProject(projectId) {
  const user = getCurrentUser?.();
  if (!user) return;

  const project = getProject(user.id, projectId);
  if (!project) {
    showToast('error', 'Proyecto no encontrado', '', 3000);
    return;
  }

  currentProjectId = projectId;
  setLastProject(user.id, projectId);

  // Update UI
  showChatInterface();
  updateTopbar(project.name, project.genre);

  // Load chats for this project
  const chats = getChats(user.id, projectId);
  renderChatList(chats, null, getSetting('language', 'es'));

  // Show welcome or last chat
  const lastChatId = getLastChat(user.id, projectId);
  if (lastChatId && chats.find(c => c.id === lastChatId)) {
    selectChat(lastChatId);
  } else if (chats.length > 0) {
    selectChat(chats[0].id);
  } else {
    renderWelcomeScreen();
  }

  // Show export button
  document.getElementById('btn-export')?.classList.remove('hidden');
}

// ─────────────────────────────────────────────────────────────────────────
// 6. Delete Project
// ─────────────────────────────────────────────────────────────────────────

function deleteProjectConfirm(projectId) {
  const user = getCurrentUser?.();
  if (!user) return;

  const project = getProject(user.id, projectId);
  if (!project) return;

  const lang = getSetting('language', 'es');
  const message = t('deleteProjectConfirm', lang).replace('{name}', project.name);

  if (!confirm(message)) return;

  deleteProject(user.id, projectId);

  // If we were in this project, go back to projects screen
  if (currentProjectId === projectId) {
    currentProjectId = null;
    currentChatId = null;
    showProjectsScreen();
    document.getElementById('btn-export')?.classList.add('hidden');
  }

  showToast('success', t('deleteProject', lang), `"${project.name}" eliminado`, 3000);
  loadProjects();
}

// ─────────────────────────────────────────────────────────────────────────
// 7. Project Settings Modal
// ─────────────────────────────────────────────────────────────────────────

function editProjectSettings(projectId) {
  const user = getCurrentUser?.();
  if (!user) return;

  const project = getProject(user.id, projectId);
  if (!project) return;

  const lang = getSetting('language', 'es');

  // Populate settings form
  const form = document.getElementById('project-settings-form');
  if (form) {
    form.querySelector('[name="projectId"]').value = project.id;
    form.querySelector('[name="name"]').value = project.name;
    form.querySelector('[name="genre"]').value = project.genre;
    form.querySelector('[name="description"]').value = project.description || '';
  }

  openModal('project-settings-modal');
}

function initProjectSettings() {
  const form = document.getElementById('project-settings-form');
  form?.addEventListener('submit', onUpdateProjectSettings);

  document.getElementById('btn-cancel-project-settings')?.addEventListener('click', () => {
    closeModal('project-settings-modal');
  });
}

async function onUpdateProjectSettings(e) {
  e.preventDefault();
  const form = e.target;
  const lang = getSetting('language', 'es');

  const projectId = form.querySelector('[name="projectId"]')?.value;
  const name = form.querySelector('[name="name"]')?.value.trim();
  const genre = form.querySelector('[name="genre"]')?.value;
  const description = form.querySelector('[name="description"]')?.value.trim();

  if (!name) {
    showToast('error', t('errorRequired', lang), '');
    return;
  }

  const user = getCurrentUser?.();
  if (!user) return;

  updateProject(user.id, projectId, {
    name,
    genre: genre || 'Other',
    description: description || ''
  });

  closeModal('project-settings-modal');

  // Refresh UI if currently in this project
  if (currentProjectId === projectId) {
    updateTopbar(name, genre);
  }

  showToast('success', t('save', lang), '', 2000);
  loadProjects();
}

// ─────────────────────────────────────────────────────────────────────────
// 8. Back to Projects
// ─────────────────────────────────────────────────────────────────────────

function backToProjects() {
  currentProjectId = null;
  currentChatId = null;
  showProjectsScreen();
  document.getElementById('btn-export')?.classList.add('hidden');
  loadProjects();
}

// ─────────────────────────────────────────────────────────────────────────
// 9. Export
// ─────────────────────────────────────────────────────────────────────────

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    initProjects, loadProjects, renderProjectsGrid,
    openNewProjectModal, onCreateProject,
    enterProject, deleteProjectConfirm,
    editProjectSettings, initProjectSettings, onUpdateProjectSettings,
    backToProjects,
    currentProjectId
  };
}