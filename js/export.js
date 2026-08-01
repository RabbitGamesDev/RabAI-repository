/* ═══════════════════════════════════════════════════════════════════════════
   RabAI v5.0 "IndieDev Edition" — Export
   RabbitGamesStudio™ / RGS Labs™
   ═══════════════════════════════════════════════════════════════════════════ */

// ─────────────────────────────────────────────────────────────────────────
// 1. Export Formats
// ─────────────────────────────────────────────────────────────────────────

const EXPORT_FORMATS = {
  markdown: {
    ext: 'md',
    mime: 'text/markdown',
    name: 'Markdown'
  },
  json: {
    ext: 'json',
    mime: 'application/json',
    name: 'JSON'
  },
  txt: {
    ext: 'txt',
    mime: 'text/plain',
    name: 'Plain Text'
  }
};

// ─────────────────────────────────────────────────────────────────────────
// 2. Main Export Function
// ─────────────────────────────────────────────────────────────────────────

function exportProject(format = 'markdown') {
  const user = getCurrentUser?.();
  if (!user || !currentProjectId) {
    showToast('error', t('noProjectSelected', getSetting('language', 'es')), '');
    return;
  }

  const project = getProject(user.id, currentProjectId);
  if (!project) {
    showToast('error', 'Proyecto no encontrado', '', 3000);
    return;
  }

  const chats = getChats(user.id, currentProjectId);
  const lang = getSetting('language', 'es');

  let content, filename;

  switch (format) {
    case 'json':
      content = exportAsJSON(project, chats, user);
      filename = `${project.name}-context.${EXPORT_FORMATS.json.ext}`;
      break;
    case 'txt':
      content = exportAsTXT(project, chats, user);
      filename = `${project.name}-context.${EXPORT_FORMATS.txt.ext}`;
      break;
    case 'markdown':
    default:
      content = exportAsMarkdown(project, chats, user);
      filename = `${project.name}-context.${EXPORT_FORMATS.markdown.ext}`;
      break;
  }

  downloadFile(content, filename, EXPORT_FORMATS[format]?.mime || 'text/plain');
  showToast('success', t('exportSuccess', lang), filename, 3000);
}

// ─────────────────────────────────────────────────────────────────────────
// 3. Markdown Export (Primary)
// ─────────────────────────────────────────────────────────────────────────

function exportAsMarkdown(project, chats, user) {
  const now = new Date().toISOString();
  const lang = getSetting('language', 'es');

  let md = `<!-- RabAI Export - ${APP_NAME} ${APP_VERSION} -->
<!-- Generated: ${now} -->
<!-- Project: ${project.name} -->

`;

  // Header
  md += `# 🎮 ${project.name}\n\n`;
  md += `> **Género:** ${project.genre}  \n`;
  md += `> **Creado:** ${new Date(project.createdAt).toLocaleDateString(lang)}  \n`;
  md += `> **Exportado:** ${new Date(now).toLocaleDateString(lang)}  \n`;
  md += `> **Por:** ${user.email}  \n\n`;

  // Description
  if (project.description) {
    md += `## 📋 Descripción\n\n${project.description}\n\n`;
  }

  // Project Context Block (optimized for AI consumption)
  md += `---\n\n`;
  md += `## 🤖 Contexto para IA\n\n`;
  md += `Este documento contiene el contexto completo del proyecto de videojuego indie **"${project.name}"**, incluyendo todas las conversaciones de diseño, análisis y decisiones tomadas con RabAI.\n\n`;
  md += `**Instrucciones para la IA:** Lee todo el contexto antes de responder. Mantén la coherencia con las decisiones previas. Respeta el scope y recursos del equipo.\n\n`;

  // Chats
  md += `---\n\n`;
  md += `## 💬 Conversaciones (${chats.length})\n\n`;

  if (chats.length === 0) {
    md += `_No hay conversaciones registradas._\n\n`;
  } else {
    for (let i = 0; i < chats.length; i++) {
      const chat = chats[i];
      md += `### ${i + 1}. ${chat.name}\n\n`;
      md += `**Creada:** ${new Date(chat.createdAt).toLocaleDateString(lang)}  \n`;
      md += `**Mensajes:** ${chat.messages?.length || 0}\n\n`;

      if (chat.messages && chat.messages.length > 0) {
        for (const msg of chat.messages) {
          const role = msg.role === 'user' ? '👤 Usuario' : '🤖 RabAI';
          const time = new Date(msg.timestamp).toLocaleString(lang);
          md += `**${role}** *(${time})*\n\n`;
          md += `${msg.content}\n\n`;
          md += `---\n\n`;
        }
      } else {
        md += `_Sin mensajes._\n\n`;
      }
    }
  }

  // Summary / Stats
  md += `## 📊 Resumen del Proyecto\n\n`;
  md += `- **Total de conversaciones:** ${chats.length}\n`;
  md += `- **Total de mensajes:** ${chats.reduce((sum, c) => sum + (c.messages?.length || 0), 0)}\n`;
  md += `- **Comandos usados:** ${extractCommandsUsed(chats)}\n`;
  md += `- **Última actividad:** ${getLastActivity(chats, lang)}\n\n`;

  // Footer
  md += `---\n\n`;
  md += `*Exportado con ❤️ desde [RabAI](https://rabai.vercel.app) — IndieDev Edition v${APP_VERSION}*\n`;
  md += `*RabbitGamesStudio™ / RGS Labs™*\n`;

  return md;
}

// ─────────────────────────────────────────────────────────────────────────
// 4. JSON Export (for other apps/AI)
// ─────────────────────────────────────────────────────────────────────────

function exportAsJSON(project, chats, user) {
  const exportData = {
    meta: {
      app: APP_NAME,
      version: APP_VERSION,
      exportedAt: new Date().toISOString(),
      format: 'rabai-context-v1'
    },
    project: {
      id: project.id,
      name: project.name,
      genre: project.genre,
      description: project.description,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt
    },
    context: {
      totalChats: chats.length,
      totalMessages: chats.reduce((sum, c) => sum + (c.messages?.length || 0), 0),
      commandsUsed: extractCommandsArray(chats),
      lastActivity: getLastActivity(chats, 'en')
    },
    chats: chats.map(chat => ({
      id: chat.id,
      name: chat.name,
      createdAt: chat.createdAt,
      updatedAt: chat.updatedAt,
      messages: (chat.messages || []).map(msg => ({
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp,
        feedback: msg.feedback || null
      }))
    })),
    system: {
      userEmail: user.email,
      exportNote: 'This JSON contains full project context for AI consumption. Import into any compatible system.'
    }
  };

  return JSON.stringify(exportData, null, 2);
}

// ─────────────────────────────────────────────────────────────────────────
// 5. Plain Text Export
// ─────────────────────────────────────────────────────────────────────────

function exportAsTXT(project, chats, user) {
  const lang = getSetting('language', 'es');
  let txt = '';

  txt += `===============================================\n`;
  txt += `  ${project.name}\n`;
  txt += `  ${project.genre}\n`;
  txt += `===============================================\n\n`;

  if (project.description) {
    txt += `DESCRIPCION:\n${project.description}\n\n`;
  }

  txt += `CONTEXTO PARA IA:\n`;
  txt += `Este es el proyecto indie "${project.name}".\n`;
  txt += `A continuacion todas las conversaciones de diseno.\n\n`;

  txt += `-----------------------------------------------\n`;
  txt += `CONVERSACIONES (${chats.length}):\n`;
  txt += `-----------------------------------------------\n\n`;

  for (const chat of chats) {
    txt += `=== ${chat.name} ===\n\n`;
    if (chat.messages) {
      for (const msg of chat.messages) {
        const label = msg.role === 'user' ? 'USUARIO' : 'RABAI';
        txt += `[${label}]:\n${msg.content}\n\n`;
      }
    }
    txt += `---\n\n`;
  }

  txt += `===============================================\n`;
  txt += `Exportado desde RabAI v${APP_VERSION}\n`;
  txt += `${new Date().toLocaleDateString(lang)}\n`;
  txt += `===============================================\n`;

  return txt;
}

// ─────────────────────────────────────────────────────────────────────────
// 6. Helpers
// ─────────────────────────────────────────────────────────────────────────

function extractCommandsUsed(chats) {
  const commands = new Set();
  for (const chat of chats) {
    if (!chat.messages) continue;
    for (const msg of chat.messages) {
      if (msg.role === 'user' && msg.content.startsWith('/')) {
        const cmd = msg.content.split(' ')[0];
        commands.add(cmd);
      }
    }
  }
  return Array.from(commands).join(', ') || 'Ninguno';
}

function extractCommandsArray(chats) {
  const commands = new Set();
  for (const chat of chats) {
    if (!chat.messages) continue;
    for (const msg of chat.messages) {
      if (msg.role === 'user' && msg.content.startsWith('/')) {
        commands.add(msg.content.split(' ')[0]);
      }
    }
  }
  return Array.from(commands);
}

function getLastActivity(chats, lang) {
  let last = null;
  for (const chat of chats) {
    if (chat.updatedAt && (!last || new Date(chat.updatedAt) > new Date(last))) {
      last = chat.updatedAt;
    }
  }
  return last ? new Date(last).toLocaleDateString(lang) : 'N/A';
}

// ─────────────────────────────────────────────────────────────────────────
// 7. File Download
// ─────────────────────────────────────────────────────────────────────────

function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
}

// ─────────────────────────────────────────────────────────────────────────
// 8. Export UI
// ─────────────────────────────────────────────────────────────────────────

function initExportUI() {
  const btnExport = document.getElementById('btn-export');
  btnExport?.addEventListener('click', () => {
    // Default to markdown for now
    // Future: show format picker modal
    exportProject('markdown');
  });
}

// ─────────────────────────────────────────────────────────────────────────
// 9. Export
// ─────────────────────────────────────────────────────────────────────────

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    exportProject,
    exportAsMarkdown, exportAsJSON, exportAsTXT,
    EXPORT_FORMATS,
    downloadFile,
    initExportUI
  };
}