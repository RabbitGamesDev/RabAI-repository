# Changelog

All notable changes to RabAI will be documented in this file.

## [5.0.0] — 2026-08-01 — IndieDev Edition

### Added
- **Modular architecture**: Complete refactor into `css/`, `js/`, `api/` folders
- **Project system**: Create, manage, and organize multiple game projects
- **12 commands total**:
  - v4.3: `/auditoria`, `/gancho`, `/loop`, `/balance`, `/devlog`, `/target`
  - v5.0: `/scope`, `/pitchdeck`, `/steam`, `/burnout`, `/monetiza`, `/postmortem`
- **Export to Markdown/JSON/TXT**: Full project context export for any AI
- **5 accent colors**: purple (default), blue, green, red, amber
- **Loading screen**: Animated rabbit logo with minimum 1.2s display
- **Command autocomplete**: `/` triggers suggestion dropdown with keyboard navigation
- **Message feedback**: 👍/👎 per AI message
- **Keyboard shortcuts**: Ctrl+N (new chat), Ctrl+, (settings), Ctrl+B (sidebar), Ctrl+/ (focus input)

### Changed
- **API security**: Frontend no longer exposes Groq API key; uses `/api/chat` backend proxy
- **i18n**: 7 languages without duplicates (es, en, pt, fr, de, ja, zh)
- **Auto-naming**: Chat names generated from first user message locally
- **UI**: Completely redesigned with CSS variables, dark/light themes

### Fixed
- Critical: API key exposed in frontend → now uses secure backend proxy
- Critical: `autoName()` and `sendMsg()` made direct Groq calls → now use `/api/chat`
- Medium: Duplicate i18n entries eliminated
- Medium: `updateProjSettings()` called after login
- Medium: `escHtml()` now escapes quotes correctly
- Low: Footer label shows "v5.0"
- Low: Info modal lists all 12 commands

## [4.3.0] — 2026-06-15

### Added
- Secure backend `/api/chat` proxy to Groq API
- Supabase auth with email/password
- Admin badge and Pro lifetime for admins
- Pro waitlist system
- 6 commands: `/auditoria`, `/gancho`, `/loop`, `/balance`, `/devlog`, `/target`
- Full i18n: es, en, pt, fr, de, ja, zh
- Moderation: 3 strikes → 60s ban

## [4.0.0] — 2026-05-01

### Added
- Supabase authentication (email/password with confirmation)
- User profiles table
- Admin system with automatic Pro access
- Waitlist for Pro plan

## [3.1.0] — 2026-03-20

### Added
- Robust content detection
- Complete translation coverage
- Command fixes

## [3.0.0] — 2026-02-15

### Added
- Custom SVG cursor (toggleable)
- Collapsible sidebar
- Commands system
- Info modal
- System language detection
- Intelligent chat naming

## [2.0.0] — 2026-01-10

### Added
- Settings panel
- Light/dark theme
- AI tone selection
- Free/Pro plans
- Multi-language support

## [1.0.0] — 2025-12-01

### Added
- Initial release
- Groq API chat integration
- Multiple chats
- Dark theme design