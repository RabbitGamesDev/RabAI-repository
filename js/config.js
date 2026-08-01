/* ═══════════════════════════════════════════════════════════════════════════
   RabAI v5.0 "IndieDev Edition" — Config
   RabbitGamesStudio™ / RGS Labs™
   ═══════════════════════════════════════════════════════════════════════════ */

// ─────────────────────────────────────────────────────────────────────────
// 1. Supabase
// ─────────────────────────────────────────────────────────────────────────

const SUPABASE_URL = 'https://gjxyweszlqpfmcnqimqk.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_l86Pc13sU6hKJJ6mwNm68A_z3jftgbB';

// ─────────────────────────────────────────────────────────────────────────
// 2. Groq API (backend only — frontend uses /api/chat)
// ─────────────────────────────────────────────────────────────────────────

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

const MODELS = {
  free: {
    id: 'llama-3.1-8b-instant',
    name: 'Llama 3.1 8B',
    maxTokens: 8192,
    contextWindow: 128000
  },
  pro: {
    id: 'llama-3.3-70b-versatile',
    name: 'Llama 3.3 70B',
    maxTokens: 32768,
    contextWindow: 128000
  }
};

// ─────────────────────────────────────────────────────────────────────────
// 3. App Constants
// ─────────────────────────────────────────────────────────────────────────

const APP_NAME = 'RabAI';
const APP_VERSION = '5.0';
const APP_SUBTITLE = 'IndieDev Edition';

const STORAGE_KEYS = {
  theme: 'rabai_theme',
  accent: 'rabai_accent',
  language: 'rabai_lang',
  cursor: 'rabai_cursor',
  sounds: 'rabai_sounds',
  tone: 'rabai_tone',
  sidebarCollapsed: 'rabai_sidebar',
  lastProject: 'rabai_last_project',
  lastChat: 'rabai_last_chat'
};

const MODERATION = {
  strikes: 3,
  banDuration: 60, // seconds
  maxMsgLength: 4000
};

const GENRES = [
  'Action', 'Adventure', 'RPG', 'Strategy', 'Simulation',
  'Puzzle', 'Platformer', 'Roguelike', 'Metroidvania', 'Horror',
  'Racing', 'Fighting', 'Shooter', 'Survival', 'Sandbox',
  'Visual Novel', 'Tower Defense', 'MMO', 'Battle Royale', 'Other'
];

// ─────────────────────────────────────────────────────────────────────────
// 4. Export
// ─────────────────────────────────────────────────────────────────────────

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SUPABASE_URL, SUPABASE_ANON_KEY, GROQ_API_URL, MODELS, APP_NAME, APP_VERSION, APP_SUBTITLE, STORAGE_KEYS, MODERATION, GENRES };
}