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
- `app/script.js` - Main DoThisApp orchestrator class (~350 lines)
- `app/modules/` - ES6 modules for organized code structure:
  - `DataManager.js` - Data persistence with localStorage (~380 lines)
  - `Utils.js` - UUID generation, formatting, validation (~300 lines)
  - `I18nManager.js` - Internationalization and translations (~140 lines)
  - `TaskManager.js` - Task CRUD operations and rendering (~1000 lines)
  - `UIManager.js` - UI navigation, updates, interactions (~500 lines)
  - `RandomizerManager.js` - Task randomization logic (~240 lines)
  - `ActiveTaskManager.js` - 8-hour task timer and lifecycle (~250 lines)
  - `ImportExportManager.js` - Import/export functionality (~480 lines)
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
The app uses fine-grained localStorage operations for better performance (managed by `DataManager` module):

**Save Methods (DataManager):**
- `data.saveTaskData()` - Save only tasks array
- `data.saveDeletedTasks()` - Save only deleted/trash tasks
- `data.saveActiveTask()` - Save only active task state
- `data.saveStatistics()` - Save completion count only
- `data.saveUIState()` - Save UI collapse states
- `data.saveAllData()` - Save all data (orchestrator method)

**Load Methods (DataManager):**
- `data.loadTaskData()` - Load and validate tasks with UUID migration from numeric IDs
- `data.loadDeletedTasks()` - Load and validate deleted tasks with UUID migration
- `data.loadActiveTask()` - Load active task with error handling
- `data.loadStatistics()` - Load completion stats (also cleans up legacy nextTaskId)
- `data.loadUIState()` - Load UI collapse states
- `data.loadAllData()` - Load all data (orchestrator method)

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
- Managed by `I18nManager` module
- Supports multiple languages (currently English and German)
- Language detection: checks localStorage → browser language → defaults to English
- Translation files located in `app/i18n/` (en-US.json, de-DE.json)
- Uses `i18n.t(key, params)` method for translating strings with parameter replacement

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
1. Update HTML forms with new type options in `app/index.html`
2. Modify `saveTask()` validation in `app/modules/TaskManager.js`
3. Update `getTaskStatus()` in `app/modules/TaskManager.js` for new type behavior
4. Add CSS styling for new type indicators in `app/styles.css`

### Adding New Cooldown Options
1. Add option to select elements in `app/index.html`
2. Update `getCooldownMs()` method in `app/modules/Utils.js` for duration calculation
3. Update `formatCooldown()` method in `app/modules/Utils.js` for display text

### Debugging Data Issues
Browser console commands available when app is loaded:
```javascript
app.utils.debugData()                 // View all data and statistics
app.data.cleanupCorruptedData()       // Fix corrupted entries
app.data.validateDataIntegrity()      // Check for data issues
app.importExport.exportTasksAsJson()  // Download backup
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

- Main app orchestrator: `app/script.js` (DoThisApp class - ~350 lines)
- Modular code structure: `app/modules/` (8 ES6 modules, ~3300 lines total)
- Styles: `app/styles.css`
- Translations: `app/i18n/` (en-US.json, de-DE.json)
- PWA files: `app/pwa/` (manifest, service worker)
- All images: `app/img/` (favicons, PWA icons, UI icons)
- Documentation: `CLAUDE.md` (this file), `docs/development.md`, `docs/technical-details.md`
- Debug tools: Available via browser console commands

## Code Organization

### Current Structure - Modular ES6 Architecture

The application uses a **modular ES6 architecture** with the main `DoThisApp` class acting as an orchestrator for specialized modules:

**Main Orchestrator: `app/script.js`** (~350 lines)
- `DoThisApp` class initializes all modules and manages global state
- Handles event binding and coordination between modules
- Provides browser-level event handlers (keyboard shortcuts, visibility changes)
- Includes `playConfetti()` animation function

**Module Structure: `app/modules/`**

Each module is a self-contained ES6 class that receives the app instance for cross-module communication:

1. **DataManager.js** (~380 lines) - Data persistence layer
   - Save/load methods for tasks, deleted tasks, active task, statistics, UI state
   - Data validation and integrity checking
   - Automatic UUID migration from legacy numeric IDs
   - Complete data reset functionality

2. **Utils.js** (~300 lines) - Utility functions and helpers
   - UUID generation (`generateUUID()`, `isNumericId()`, `isValidUUID()`)
   - Time formatting (`getTimeAgo()`, `formatCooldown()`, `formatCooldownTime()`)
   - Deadline formatting (`formatDeadline()`)
   - Cooldown calculations (`getCooldownMs()`, `calculateNextAvailableTime()`)
   - HTML escaping and debug tools (`debugData()`)

3. **I18nManager.js** (~140 lines) - Internationalization
   - Language loading and detection
   - Translation function (`t(key, params)`)
   - Dynamic UI translation application
   - Language switching

4. **TaskManager.js** (~1000 lines) - Task operations and rendering
   - Task CRUD operations (`saveTask()`, `saveTaskEdit()`, `deleteTask()`)
   - Task status calculation (`getTaskStatus()`, `getAvailableTasks()`)
   - Task list rendering (`renderTasks()`, `renderTrashList()`)
   - Execution statistics (`getExecutionStats()`)
   - Quick logging (`quickLogTask()`)
   - Trash management (`restoreTask()`, `deleteTaskForever()`, `clearAllTrash()`)
   - Default sample tasks (`addDefaultTasks()`)
   - Completed task cleanup (`cleanupCompletedOneOffTasks()`)

5. **UIManager.js** (~500 lines) - UI navigation and interactions
   - UI refresh orchestration (`refreshUI()`, `updateRandomizerSection()`)
   - Page navigation (`showMainPage()`, `showTrashPage()`)
   - Section collapse/expand (`toggleTaskList()`, `toggleSettings()`)
   - Task editing UI (`showTaskEdit()`, `hideTaskEdit()`)
   - Form interactions (toggles, deadlines)
   - Toast notifications (`showToast()`)
   - Browser notifications (`requestNotificationPermission()`, `sendTaskTimerNotification()`)
   - Empty state management

6. **RandomizerManager.js** (~240 lines) - Task randomization
   - Weighted random selection (`getTaskWeight()`, `randomizeTask()`)
   - Task flow management (`showSelectedTask()`, `acceptTask()`)
   - Randomizer UI states (`showTaskCompleted()`, `nextTask()`, `resetRandomizer()`)
   - Cooldown checking (`startCooldownChecking()`, `stopCooldownChecking()`)
   - Loading state management

7. **ActiveTaskManager.js** (~250 lines) - Active task lifecycle
   - Task timer management (`startActiveTaskTimer()`, `clearActiveTaskTimer()`)
   - Timer updates with notifications (`updateActiveTaskTimer()`)
   - Task completion (`completeActiveTask()`)
   - Task abandonment (`abandonActiveTask()`, `saveAbandonReason()`)
   - Abandon reason modal (`showAbandonReasonModal()`, `hideAbandonReasonModal()`)
   - Active task validation (`checkActiveTask()`)

8. **ImportExportManager.js** (~480 lines) - Import/export functionality
   - JSON export with metadata (`exportTasksAsJson()`)
   - File import handling (`importTasksFromJson()`, `handleImportFile()`)
   - Import dialogs (mode selection, task selection)
   - Three import modes: replace, merge, selective
   - Task validation and UUID migration (`validateImportedTask()`)

### Module Communication

Modules communicate through the main app instance:
```javascript
// In script.js
class DoThisApp {
  constructor() {
    // Initialize modules
    this.utils = new Utils(this);
    this.data = new DataManager(this);
    this.taskManager = new TaskManager(this);
    // ... etc
  }
}

// Modules can access each other via app instance
class TaskManager {
  saveTask() {
    // Access other modules
    const uuid = this.app.utils.generateUUID();
    this.app.data.saveTaskData();
    this.app.ui.showToast("Task saved!");
  }
}
```

### Benefits of Current Architecture

✅ **Improved readability** - Each module has a clear, focused purpose
✅ **Easy navigation** - Find functionality by module name
✅ **Better maintainability** - Changes isolated to specific modules
✅ **No build process** - Pure ES6 modules work in modern browsers
✅ **Modular testing** - Test individual modules independently
✅ **Clear dependencies** - Module structure makes relationships explicit

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
