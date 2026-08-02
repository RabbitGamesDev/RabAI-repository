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

function exportProject(format) {
  const user = getCurrentUser();
  if (!user || !window.currentProjectId) {
    showToast('error', t('noProjectSelected', getSetting('language', 'es')), '');
    return;
  }

  const project = getProject(user.id, window.currentProjectId);
  if (!project) {
    showToast('error', 'Proyecto no encontrado', '', 3000);
    return;
  }

  const chats = getChats(user.id, window.currentProjectId);
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
  md += `# 🎮 ${project.name}

`;
  md += `> **Género:** ${project.genre}  
`;
  md += `> **Creado:** ${new Date(project.createdAt).toLocaleDateString(lang)}  
`;
  md += `> **Exportado:** ${new Date(now).toLocaleDateString(lang)}  
`;
  md += `> **Por:** ${user.email}  

`;

  // Description
  if (project.description) {
    md += `## 📋 Descripción

${project.description}

`;
  }

  // Project Context Block (optimized for AI consumption)
  md += `---

`;
  md += `## 🤖 Contexto para IA

`;
  md += `Este documento contiene el contexto completo del proyecto de videojuego indie **"${project.name}"**, incluyendo todas las conversaciones de diseño, análisis y decisiones tomadas con RabAI.

`;
  md += `**Instrucciones para la IA:** Lee todo el contexto antes de responder. Mantén la coherencia con las decisiones previas. Respeta el scope y recursos del equipo.

`;

  // Chats
  md += `---

`;
  md += `## 💬 Conversaciones (${chats.length})

`;

  if (chats.length === 0) {
    md += `_No hay conversaciones registradas._

`;
  } else {
    for (let i = 0; i < chats.length; i++) {
      const chat = chats[i];
      md += `### ${i + 1}. ${chat.name}

`;
      md += `**Creada:** ${new Date(chat.createdAt).toLocaleDateString(lang)}  
`;
      md += `**Mensajes:** ${chat.messages?.length || 0}

`;

      if (chat.messages && chat.messages.length > 0) {
        for (const msg of chat.messages) {
          const role = msg.role === 'user' ? '👤 Usuario' : '🤖 RabAI';
          const time = new Date(msg.timestamp).toLocaleString(lang);
          md += `**${role}** *(${time})*

`;
          md += `${msg.content}

`;
          md += `---

`;
        }
      } else {
        md += `_Sin mensajes._

`;
      }
    }
  }

  // Summary / Stats
  md += `## 📊 Resumen del Proyecto

`;
  md += `- **Total de conversaciones:** ${chats.length}
`;
  md += `- **Total de mensajes:** ${chats.reduce((sum, c) => sum + (c.messages?.length || 0), 0)}
`;
  md += `- **Comandos usados:** ${extractCommandsUsed(chats)}
`;
  md += `- **Última actividad:** ${getLastActivity(chats, lang)}

`;

  // Footer
  md += `---

`;
  md += `*Exportado con ❤️ desde [RabAI](https://rabai.vercel.app) — IndieDev Edition v${APP_VERSION}*
`;
  md += `*RabbitGamesStudio™ / RGS Labs™*
`;

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

  txt += `===============================================
`;
  txt += `  ${project.name}
`;
  txt += `  ${project.genre}
`;
  txt += `===============================================

`;

  if (project.description) {
    txt += `DESCRIPCION:
${project.description}

`;
  }

  txt += `CONTEXTO PARA IA:
`;
  txt += `Este es el proyecto indie "${project.name}".
`;
  txt += `A continuacion todas las conversaciones de diseno.

`;

  txt += `-----------------------------------------------
`;
  txt += `CONVERSACIONES (${chats.length}):
`;
  txt += `-----------------------------------------------

`;

  for (const chat of chats) {
    txt += `=== ${chat.name} ===

`;
    if (chat.messages) {
      for (const msg of chat.messages) {
        const label = msg.role === 'user' ? 'USUARIO' : 'RABAI';
        txt += `[${label}]:
${msg.content}

`;
      }
    }
    txt += `---

`;
  }

  txt += `===============================================
`;
  txt += `Exportado desde RabAI v${APP_VERSION}
`;
  txt += `${new Date().toLocaleDateString(lang)}
`;
  txt += `===============================================
`;

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
