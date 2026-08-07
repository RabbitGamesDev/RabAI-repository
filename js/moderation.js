/* ═══════════════════════════════════════════════════════════════════════════
   RabAI v5.0 "IndieDev Edition" — Moderation
   RabbitGamesStudio™ / RGS Labs™
   ═══════════════════════════════════════════════════════════════════════════ */

// ─────────────────────────────────────────────────────────────────────────
// 1. Bad Words List (basic, can be expanded)
// ─────────────────────────────────────────────────────────────────────────

const BAD_WORDS = [
  // Spanish
  'puta', 'puto', 'mierda', 'joder', 'coño', 'gilipollas', 'cabron', 'maricon',
  'pendejo', 'chinga', 'verga', 'pinche', 'culero', 'pendeja', 'chingada',
  // English
  'fuck', 'shit', 'bitch', 'asshole', 'dick', 'cunt', 'bastard', 'whore',
  'slut', 'nigger', 'faggot', 'retard', 'crap', 'damn',
  // Portuguese
  'caralho', 'porra', 'puta', 'bosta', 'fdp', 'corno', 'viado', 'arrombado',
  // French
  'putain', 'merde', 'connard', 'salope', 'enculé', 'bâtard', 'foutre',
  // German
  'scheiße', 'arschloch', 'hure', 'schwuchtel', 'wichser', 'verdammt',
  // Japanese (romaji)
  'kuso', 'bakayaro', 'chikusho', 'shine', 'busu',
  // Chinese (pinyin)
  'caonima', 'shabi', 'tmd', 'nm', 'wocao',
  // Universal
  'hitler', 'nazi', 'stalin', 'isis', 'alqaeda', 'kkk', 'rape', 'rapist',
  'pedo', 'pedophile', 'childporn', 'cp', 'gore', 'beheading'
];

// ─────────────────────────────────────────────────────────────────────────
// 2. Moderation State
// ─────────────────────────────────────────────────────────────────────────

let moderationState = {
  strikes: 0,
  bannedUntil: 0,
  lastWarning: null
};

const MODERATION_KEY = 'rabai_moderation';

// ─────────────────────────────────────────────────────────────────────────
// 3. Load/Save State
// ─────────────────────────────────────────────────────────────────────────

function loadModState() {
  try {
    const saved = localStorage.getItem(MODERATION_KEY);
    if (saved) {
      moderationState = JSON.parse(saved);
    }
  } catch (e) {
    moderationState = { strikes: 0, bannedUntil: 0, lastWarning: null };
  }
  return moderationState;
}

function saveModState() {
  try {
    localStorage.setItem(MODERATION_KEY, JSON.stringify(moderationState));
  } catch (e) {
    // localStorage might be full or unavailable
  }
}

// ─────────────────────────────────────────────────────────────────────────
// 4. Check Functions
// ─────────────────────────────────────────────────────────────────────────

function checkMod(text) {
  loadModState();

  // Check if currently banned
  const now = Date.now();
  if (moderationState.bannedUntil > now) {
    const remaining = Math.ceil((moderationState.bannedUntil - now) / 1000);
    return {
      allowed: false,
      banned: true,
      remaining: remaining,
      reason: 'banned',
      message: `Cuenta suspendida. Espera ${remaining} segundos.`
    };
  }

  // Check for bad words
  const lowerText = text.toLowerCase();
  const foundWords = [];

  for (const word of BAD_WORDS) {
    // Match whole words or substrings (for compound words)
    const regex = new RegExp(`\b${word}\b|${word}`, 'i');
    if (regex.test(lowerText)) {
      foundWords.push(word);
    }
  }

  if (foundWords.length > 0) {
    moderationState.strikes++;
    moderationState.lastWarning = now;

    // 3 strikes = ban
    if (moderationState.strikes >= MODERATION.strikes) {
      moderationState.bannedUntil = now + (MODERATION.banDuration * 1000);
      moderationState.strikes = 0;
      saveModState();

      return {
        allowed: false,
        banned: true,
        remaining: MODERATION.banDuration,
        reason: 'banned',
        message: `Has alcanzado el límite de advertencias. Cuenta suspendida por ${MODERATION.banDuration} segundos.`,
        strikes: 0,
        foundWords: foundWords
      };
    }

    saveModState();

    return {
      allowed: false,
      banned: false,
      reason: 'warning',
      message: `Advertencia ${moderationState.strikes}/${MODERATION.strikes}: Lenguaje inapropiado detectado.`,
      strikes: moderationState.strikes,
      foundWords: foundWords
    };
  }

  // Check message length
  if (text.length > MODERATION.maxMsgLength) {
    return {
      allowed: false,
      banned: false,
      reason: 'length',
      message: `Mensaje demasiado largo. Máximo ${MODERATION.maxMsgLength} caracteres.`,
      maxLength: MODERATION.maxMsgLength,
      currentLength: text.length
    };
  }

  return {
    allowed: true,
    banned: false,
    reason: null,
    message: null
  };
}

function isBanned() {
  loadModState();
  const now = Date.now();
  return moderationState.bannedUntil > now;
}

function getBanRemaining() {
  loadModState();
  const now = Date.now();
  if (moderationState.bannedUntil > now) {
    return Math.ceil((moderationState.bannedUntil - now) / 1000);
  }
  return 0;
}

function getStrikes() {
  loadModState();
  return moderationState.strikes;
}

// ─────────────────────────────────────────────────────────────────────────
// 5. Reset Functions
// ─────────────────────────────────────────────────────────────────────────

function resetStrikes() {
  moderationState.strikes = 0;
  moderationState.lastWarning = null;
  saveModState();
}

function clearBan() {
  moderationState.bannedUntil = 0;
  moderationState.strikes = 0;
  saveModState();
}

function resetAllModeration() {
  moderationState = { strikes: 0, bannedUntil: 0, lastWarning: null };
  saveModState();
}

// ─────────────────────────────────────────────────────────────────────────
// 6. Escaping HTML (utility, used by chat.js too)
// ─────────────────────────────────────────────────────────────────────────

function escHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ─────────────────────────────────────────────────────────────────────────
// 7. Export
// ─────────────────────────────────────────────────────────────────────────

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { 
    BAD_WORDS, 
    checkMod, 
    isBanned, 
    getBanRemaining, 
    getStrikes, 
    resetStrikes, 
    clearBan, 
    resetAllModeration,
    escHtml 
  };
}