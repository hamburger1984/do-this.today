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
- `dothis-nextid` - Next task ID (integer)
- `dothis-tasklist-collapsed` - Task list collapse state (boolean)
- `dothis-settings-collapsed` - Settings collapse state (boolean)

### localStorage Management Methods
The app uses fine-grained localStorage operations for better performance:

**Save Methods:**
- `saveTaskData()` - Save only tasks array
- `saveDeletedTasks()` - Save only deleted/trash tasks
- `saveActiveTask()` - Save only active task state
- `saveStatistics()` - Save completion count and next ID
- `saveUIState()` - Save UI collapse states
- `saveAllData()` - Save all data (orchestrator method)

**Load Methods:**
- `loadTaskData()` - Load and validate tasks with migration
- `loadDeletedTasks()` - Load and validate deleted tasks
- `loadActiveTask()` - Load active task with error handling
- `loadStatistics()` - Load completion stats and ID counter
- `loadUIState()` - Load UI collapse states
- `loadAllData()` - Load all data (orchestrator method)

### Task Object Schema
```javascript
{
  id: number,                    // Unique identifier
  text: string,                  // Task description (max 200 chars)
  type: "oneoff"|"repeatable",   // Task type
  cooldown: string,              // "0"|"1"|"3"|"6"|"12"|"daily"|"weekly"|"monthly"
  executions: [{                 // Execution history
    timestamp: number,
    duration: number,
    abandoned?: boolean,
    reason?: string
  }],
  completed: boolean,            // For one-off tasks only
  deletedAt?: number            // For deleted tasks
}
```

## Key Application Logic

### Task Status System
Tasks have four states:
- **Available**: Ready for randomization (green ✅)
- **Cooldown**: Waiting for cooldown to expire (orange ⏰)
- **Completed**: One-off tasks that are done (blue 🏁)
- **Active**: Currently being worked on with 8-hour timer

### Randomization Logic
- Only selects from available tasks
- Avoids immediate repeats when possible
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

- Main app logic: `app/script.js` (DoThisApp class)
- Styles: `app/styles.css`
- PWA files: `app/pwa/` (manifest, service worker)
- All images: `app/img/` (favicons, PWA icons, UI icons)
- Documentation: `docs/development.md`, `docs/technical-details.md`
- Debug tools: Available via browser console commands

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
