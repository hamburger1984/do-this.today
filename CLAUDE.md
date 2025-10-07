# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**do this - today!** is a mobile-first Progressive Web App that helps users decide what to do next by randomly selecting from their personal task list. It's built with vanilla HTML5, CSS3, and JavaScript ES6+ with no external dependencies.

**🌐 Live App: [do-this.today](https://do-this.today)**

## Architecture

### Core Structure
- **Single-page app** built around the `DoThisApp` ES6 class in `app/script.js`
- **Static files only** - no build process or server required
- **PWA enabled** with service worker for offline functionality
- **localStorage-based** data persistence (no backend)

### Key Files
- `app/index.html` - Main application entry point
- `app/script.js` - Core application logic (DoThisApp class)
- `app/styles.css` - Mobile-first CSS with sunset color theme
- `app/pwa/manifest.json` - PWA manifest
- `app/pwa/sw.js` - Service Worker for offline support
- `app/img/` - All images and icons:
  - `favicon.svg` - App icon (SVG)
  - `favicon.ico` - App icon (ICO)
  - `icon-192.png` - PWA icon 192x192
  - `icon-512.png` - PWA icon 512x512
  - Various UI SVG icons (16x16, 20x20, 24x24)

## Development Commands

Since this is a static web app, no build commands are needed. For development:

```bash
cd ./app
# Serve locally for PWA testing (choose one):
python -m http.server 8000
npx serve
php -S localhost:8000

# Then visit: http://localhost:8000/
```

For basic development, you can open `app/index.html` directly in a browser.

## Data Storage

### localStorage Keys
- `dothis-tasks` - Active tasks array (JSON)
- `dothis-deleted` - Trash/deleted tasks (JSON)
- `dothis-completed` - Completion count (integer)
- `dothis-active` - Currently active task (JSON object)
- `dothis-language` - User's preferred language (string: "en-US" or "de-DE")
- `dothis-tasklist-collapsed` - Task list collapse state (boolean)
- `dothis-settings-collapsed` - Settings collapse state (boolean)

**Note**: `dothis-nextid` is legacy and automatically removed on load (UUIDs are now used instead of integer IDs)

### localStorage Management Methods
The app uses fine-grained localStorage operations for better performance:

**Save Methods:**
- `saveTaskData()` - Save only tasks array
- `saveDeletedTasks()` - Save only deleted/trash tasks
- `saveActiveTask()` - Save only active task state
- `saveStatistics()` - Save completion count only
- `saveUIState()` - Save UI collapse states
- `saveAllData()` - Save all data (orchestrator method)

**Load Methods:**
- `loadTaskData()` - Load and validate tasks with UUID migration from numeric IDs
- `loadDeletedTasks()` - Load and validate deleted tasks with UUID migration
- `loadActiveTask()` - Load active task with error handling
- `loadStatistics()` - Load completion stats (also cleans up legacy nextTaskId)
- `loadUIState()` - Load UI collapse states
- `loadAllData()` - Load all data (orchestrator method)

### Task Object Schema
```javascript
{
  id: string,                    // UUID v4 (e.g., "550e8400-e29b-41d4-a716-446655440000")
  text: string,                  // Task description (max 200 chars)
  type: "oneoff"|"repeatable",   // Task type
  cooldown: string,              // "0"|"1"|"3"|"6"|"12"|"daily"|"weekly"|"monthly"
  deadline: number|null,         // Optional deadline timestamp (milliseconds)
  executions: [{                 // Execution history
    timestamp: number,
    duration: number,
    abandoned?: boolean,
    reason?: string
  }],
  completed: boolean,            // For one-off tasks only
  createdAt: number,             // Task creation timestamp
  deletedAt?: number            // For deleted tasks
}
```

**ID System**: The app uses UUID v4 for task IDs. Legacy numeric IDs are automatically migrated to UUIDs when loading from localStorage or importing tasks.

## Key Application Logic

### Task Status System
Tasks have four states:
- **Available**: Ready for randomization (green ✅)
- **Cooldown**: Waiting for cooldown to expire (orange ⏰)
- **Completed**: One-off tasks that are done (blue 🏁)
- **Active**: Currently being worked on with 8-hour timer

### Randomization Logic
- Only selects from available tasks
- Uses weighted selection based on deadline urgency (overdue: 20x, today: 10x, 3-7 days: 3x, etc.)
- Updates button text to show available task count

### Active Task System
- 8-hour timer starts when task is accepted
- Timer persists across browser sessions
- Progress notifications at 50% (4 hours) and 75% (6 hours)
- Tasks can be completed or abandoned with reason

### Notification System
- Requests browser notification permissions on startup
- Sends progress notifications via service worker or direct browser API
- Development test button available on localhost only (Settings → Debug Information)

### Import/Export System
- **Export**: Downloads tasks as JSON with metadata (date, version, task counts)
- **Import**: Three modes available:
  - **Replace All**: Replace entire task list with imported tasks
  - **Merge**: Add imported tasks to existing ones (skips duplicates by text or ID)
  - **Selective**: Choose specific tasks to import via modal dialog
- **UUID Migration**: Automatically converts legacy numeric IDs to UUIDs on import
- **Smart Matching**: When importing tasks with numeric IDs, tries to match by task text to preserve existing UUIDs

### Internationalization (i18n)
- Supports multiple languages (currently English and German)
- Language detection: checks localStorage → browser language → defaults to English
- Translation files located in `app/i18n/` (en-US.json, de-DE.json)
- Uses `t(key, params)` method for translating strings with parameter replacement

## CSS Theme System

The app uses a sophisticated semantic CSS variable system with a sunset-inspired color palette:

### Core Colors
```css
--sunset-orange: #ff6b35;    /* Primary actions (Randomize button) */
--sunset-coral: #f7931e;     /* Hover states */
--ocean-medium: #2d5a87;     /* Secondary actions */
--cream-base: #fef9f3;       /* Main background */
--slate-dark: #1f2937;       /* Primary text */
```

### Semantic Variables
Always use semantic variables instead of raw colors:
```css
--color-primary-action: var(--sunset-orange);
--color-background-main: var(--cream-base);
--color-text-primary: var(--slate-dark);
```

## Common Development Tasks

### Adding New Task Types
1. Update HTML forms with new type options
2. Modify `saveTask()` validation in app/script.js
3. Update `getTaskStatus()` for new type behavior
4. Add CSS styling for new type indicators

### Adding New Cooldown Options
1. Add option to select elements in app/index.html
2. Update `getCooldownMs()` method in app/script.js for duration calculation
3. Update `formatCooldown()` method in app/script.js for display text

### Debugging Data Issues
Browser console commands available when app is loaded:
```javascript
app.debugData()                 // View all data and statistics
app.cleanupCorruptedData()      // Fix corrupted entries
app.validateDataIntegrity()     // Check for data issues
app.exportTasksAsJson()         // Download backup
```

### Testing Offline Functionality
1. Serve over HTTP/HTTPS (localhost works)
2. Load the app
3. Disconnect network
4. Verify app still works (cached by service worker)
5. Test PWA installation on mobile devices

## Code Style Guidelines

- Use ES6+ features consistently
- Keep functions focused and small
- Use semantic CSS variables (never hardcode colors)
- Mobile-first responsive design
- Follow existing naming conventions
- Add comments for complex logic only

## File Locations to Remember

- Main app logic: `app/script.js` (DoThisApp class - ~3200 lines, 74 methods)
- Styles: `app/styles.css`
- Translations: `app/i18n/` (en-US.json, de-DE.json)
- PWA files: `app/pwa/` (manifest, service worker)
- All images: `app/img/` (favicons, PWA icons, UI icons)
- Documentation: `CLAUDE.md` (this file), `docs/development.md`, `docs/technical-details.md`
- Debug tools: Available via browser console commands

## Code Organization

### Current Structure (script.js)
The `DoThisApp` class is currently a single ~3200 line file with 74 methods. While this works, it can be challenging to navigate. The methods are logically grouped by functionality:

**Core Initialization** (~100 lines)
- `constructor()`, `init()`, `bindEvents()`

**UUID & ID Management** (~50 lines)
- `generateUUID()`, `isNumericId()`, `isValidUUID()`

**Internationalization** (~150 lines)
- `loadI18n()`, `detectLanguage()`, `t()`, `applyTranslations()`, `changeLanguage()`

**Data Persistence** (~400 lines)
- `saveTaskData()`, `loadTaskData()`, `saveDeletedTasks()`, `loadDeletedTasks()`, etc.
- Includes automatic UUID migration logic

**UI Navigation & State** (~200 lines)
- `showMainPage()`, `showTrashPage()`, `toggleTaskList()`, `toggleSettings()`, etc.

**Task Management** (~800 lines)
- `saveTask()`, `saveTaskEdit()`, `deleteTask()`, `renderTasks()`, `getTaskStatus()`, etc.

**Randomizer Logic** (~400 lines)
- `randomizeTask()`, `acceptTask()`, `showSelectedTask()`, `getAvailableTasks()`, etc.

**Active Task Timer** (~300 lines)
- `startActiveTaskTimer()`, `updateActiveTaskTimer()`, `completeActiveTask()`, `abandonActiveTask()`, etc.

**Import/Export** (~600 lines)
- `exportTasksAsJson()`, `importTasksFromJson()`, `showImportDialog()`, `executeImport()`, `validateImportedTask()`, etc.

**Utility Methods** (~200 lines)
- `showToast()`, `escapeHtml()`, `debugData()`, `cleanupCorruptedData()`, etc.

### Future Refactoring Considerations

If the codebase grows beyond 4000-5000 lines, consider splitting into modules:

**Option 1: ES6 Modules (requires minimal changes)**
```javascript
// app/modules/data-manager.js
export class DataManager {
  constructor(app) { this.app = app; }
  saveTaskData() { ... }
  loadTaskData() { ... }
}

// app/modules/task-manager.js
export class TaskManager {
  constructor(app) { this.app = app; }
  saveTask() { ... }
  deleteTask() { ... }
}

// app/script.js - becomes orchestrator
import { DataManager } from './modules/data-manager.js';
import { TaskManager } from './modules/task-manager.js';

class DoThisApp {
  constructor() {
    this.data = new DataManager(this);
    this.tasks = new TaskManager(this);
  }
}
```

**Option 2: Keep as single file (current approach)**
- Pros: No module loading complexity, works without build tools, easy to debug
- Cons: Large file, harder to navigate
- **Current best practice**: Use clear section comments and keep methods organized by functionality

**Recommended approach for now**: Keep the single-file architecture since:
- The app is still under 5000 lines
- No build process means better accessibility for contributors
- Modern IDEs handle navigation well with method outlines
- Clear commenting helps readability

## Development Guidelines

### Change Checklist
Before committing any change, verify:
- [ ] App loads and functions correctly in browser
- [ ] Mobile layout remains responsive
- [ ] No console errors or warnings
- [ ] localStorage functionality preserved
- [ ] Update documentation if user-facing changes made

### Code Style Principles
- **Minimize external dependencies** - Keep the app self-contained
- **Preserve data integrity** - Never break existing localStorage data structures
- **Maintain mobile-first design** - Always consider mobile experience first
- **Test before committing** - Ensure changes work across major browsers

### Quality Standards
- **Performance**: Keep app responsive on mobile devices, minimize DOM manipulation
- **Accessibility**: Ensure keyboard navigation works, maintain proper ARIA labels
- **Privacy & Security**: Never add tracking, keep all data local to device
- **Offline-first**: Maintain functionality without internet connection

### Commit Guidelines
- **ALWAYS create a commit AND push after completing changes** - Never leave work uncommitted
- Use descriptive commit messages (avoid "fix stuff" or "changes")
- Test functionality before committing
- Include affected areas in commit description when significant
- Push commits immediately after creating them to ensure changes are saved

### What NOT to Do
- Don't add external dependencies without strong justification
- Don't break existing data migration paths
- Don't remove debug/recovery tools
- Don't commit broken functionality
- Don't create outdated documentation

## Important Notes

- **No build process** - files are served directly
- **No external dependencies** - completely self-contained
- **Privacy-first** - all data stays on user's device
- **PWA-enabled** - can be installed as mobile/desktop app
- **Offline-capable** - works without internet after first load
- **Sunset theme** - warm, eye-friendly color palette optimized for the Randomize button prominence
