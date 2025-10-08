# Development Guide - do this - today!

This guide is for developers who want to contribute to or customize the **do this - today!** app.

**🌐 Live App: [do-this.today](https://do-this.today)**



## 🚀 Getting Started

### Prerequisites
- Modern web browser (Chrome 60+, Firefox 55+, Safari 11+, Edge 79+)
- Text editor or IDE
- Basic knowledge of HTML5, CSS3, and JavaScript ES6+
- Local web server for PWA testing (optional)

### Setup
1. Clone or download the repository
2. Open `index.html` directly in browser for basic testing
3. For PWA features, serve locally:
   ```bash
   # Python
   python -m http.server 8000
   
   # Node.js
   npx serve
   
   # PHP
   php -S localhost:8000
   ```

## 📁 Project Structure

```
do-this-today/
├── app/
│   ├── index.html              # Main app entry point
│   ├── styles.css              # Mobile-first CSS
│   ├── script.js               # Main app orchestrator (~350 lines)
│   ├── modules/                # ES6 modules
│   │   ├── DataManager.js      # Data persistence (~380 lines)
│   │   ├── Utils.js            # Utilities & helpers (~300 lines)
│   │   ├── I18nManager.js      # Internationalization (~140 lines)
│   │   ├── TaskManager.js      # Task operations (~1000 lines)
│   │   ├── UIManager.js        # UI navigation (~500 lines)
│   │   ├── RandomizerManager.js # Randomization (~240 lines)
│   │   ├── ActiveTaskManager.js # Task timer (~250 lines)
│   │   └── ImportExportManager.js # Import/export (~480 lines)
│   ├── i18n/                   # Translation files
│   │   ├── en-US.json          # English translations
│   │   └── de-DE.json          # German translations
│   ├── pwa/
│   │   ├── manifest.json       # PWA manifest
│   │   └── sw.js               # Service Worker
│   ├── img/                    # Icons and images
│   │   ├── favicon.svg         # App icon
│   │   └── *.svg               # UI icons
└── docs/                       # Documentation
```

## 🏗️ Architecture Overview

### Modular ES6 Architecture
The app uses a **modular ES6 architecture** with the main `DoThisApp` class acting as an orchestrator for specialized modules:

```javascript
// Main orchestrator in script.js
class DoThisApp {
  constructor() {
    // Core state
    this.tasks = [];
    this.deletedTasks = [];
    this.activeTask = null;
    
    // Initialize modules
    this.utils = new Utils(this);
    this.data = new DataManager(this);
    this.i18n = new I18nManager(this);
    this.taskManager = new TaskManager(this);
    this.ui = new UIManager(this);
    this.randomizer = new RandomizerManager(this);
    this.activeTaskManager = new ActiveTaskManager(this);
    this.importExport = new ImportExportManager(this);
  }
  
  async init()           // Initialize app and modules
  bindEvents()           // Bind UI event handlers
}
```

### Module Responsibilities

1. **DataManager** (`app/modules/DataManager.js`)
   - localStorage save/load operations
   - Data validation and integrity checking
   - UUID migration from legacy numeric IDs
   
2. **Utils** (`app/modules/Utils.js`)
   - UUID generation and validation
   - Time and date formatting
   - Cooldown calculations
   - HTML escaping and debugging
   
3. **I18nManager** (`app/modules/I18nManager.js`)
   - Language loading and detection
   - Translation function `t(key, params)`
   - Dynamic UI translation updates
   
4. **TaskManager** (`app/modules/TaskManager.js`)
   - Task CRUD operations (create, read, update, delete)
   - Task rendering and status calculation
   - Execution statistics
   - Trash management
   
5. **UIManager** (`app/modules/UIManager.js`)
   - UI state management and navigation
   - Toast notifications
   - Form interactions
   - Browser notifications
   
6. **RandomizerManager** (`app/modules/RandomizerManager.js`)
   - Weighted random task selection
   - Cooldown checking
   - Task acceptance flow
   
7. **ActiveTaskManager** (`app/modules/ActiveTaskManager.js`)
   - 8-hour task timer
   - Progress notifications (50%, 75%)
   - Task completion/abandonment
   
8. **ImportExportManager** (`app/modules/ImportExportManager.js`)
   - JSON export with metadata
   - Three import modes (replace, merge, selective)
   - Task validation and UUID migration

### Module Communication
Modules communicate through the main app instance:

```javascript
class TaskManager {
  saveTask() {
    // Access other modules via app instance
    const uuid = this.app.utils.generateUUID();
    this.app.data.saveTaskData();
    this.app.ui.showToast("Task saved!");
  }
}
```

### Key App Properties
- `this.tasks[]` - Array of active tasks
- `this.deletedTasks[]` - Array of trashed tasks
- `this.activeTask` - Currently active task object
- `this.currentSelectedTask` - Task shown in randomizer
- Module instances: `utils`, `data`, `i18n`, `taskManager`, `ui`, `randomizer`, `activeTaskManager`, `importExport`

## 💾 Data Management

### localStorage Keys
- `dothis-tasks` - Active tasks array (JSON)
- `dothis-deleted` - Deleted tasks array (JSON)
- `dothis-completed` - Completion count (integer)
- `dothis-active` - Active task object (JSON)
- `dothis-language` - Preferred language (string: "en-US" or "de-DE")
- `dothis-tasklist-collapsed` - Task list collapse state (boolean)
- `dothis-settings-collapsed` - Settings collapse state (boolean)

**Note**: `dothis-nextid` is legacy and automatically removed (UUIDs are now used instead of integer IDs)

### localStorage Management Methods
The app uses fine-grained localStorage operations for better performance (managed by `DataManager`):

**Save Methods:**
- `app.data.saveTaskData()` - Save only tasks array
- `app.data.saveDeletedTasks()` - Save only deleted/trash tasks
- `app.data.saveActiveTask()` - Save only active task state
- `app.data.saveStatistics()` - Save completion count
- `app.data.saveUIState()` - Save UI collapse states
- `app.data.saveAllData()` - Save all data (orchestrator method)

**Load Methods:**
- `app.data.loadTaskData()` - Load and validate tasks with UUID migration
- `app.data.loadDeletedTasks()` - Load and validate deleted tasks with UUID migration
- `app.data.loadActiveTask()` - Load active task with error handling
- `app.data.loadStatistics()` - Load completion stats (also cleans up legacy nextTaskId)
- `app.data.loadUIState()` - Load UI collapse states
- `app.data.loadAllData()` - Load all data (orchestrator method)

### Task Object Schema
```javascript
{
  id: string,              // UUID v4 (e.g., "550e8400-e29b-41d4-a716-446655440000")
  text: string,            // Task description (max 200 chars)
  type: "oneoff"|"repeatable",
  cooldown: string,        // "0"|"1"|"3"|"6"|"12"|"daily"|"weekly"|"monthly"
  deadline: number|null,   // Optional deadline timestamp (milliseconds)
  executions: [{           // Execution history
    timestamp: number,
    duration: number,
    abandoned?: boolean,
    reason?: string
  }],
  completed: boolean,      // For one-off tasks only
  createdAt: number,       // Task creation timestamp
  deletedAt?: number       // For deleted tasks
}
```

**ID System**: The app uses UUID v4 for task IDs. Legacy numeric IDs are automatically migrated to UUIDs when loading from localStorage or importing tasks.

## 🎨 CSS Architecture

### CSS Custom Properties
The app uses a sophisticated semantic CSS variable system for the sunset-inspired theme:

```css
:root {
  /* === SUNSET THEME COLOR PALETTE === */
  
  /* Core Sunset Colors */
  --sunset-orange: #ff6b35;     /* Vibrant sunset orange - main theme color */
  --sunset-coral: #f7931e;      /* Warm coral orange */
  --sunset-peach: #ffb380;      /* Soft peachy orange */
  --sunset-gold: #ffd23f;       /* Golden sunset yellow */

  /* Ocean Blue Complement */
  --ocean-deep: #1e3a5f;        /* Deep ocean blue */
  --ocean-medium: #2d5a87;      /* Medium ocean blue */
  --ocean-light: #4a90b8;       /* Light ocean blue */

  /* Neutral Base Colors */
  --cream-base: #fef9f3;        /* Very light cream background */
  --slate-dark: #1f2937;        /* Dark slate for primary text */

  /* === SEMANTIC COLOR VARIABLES === */
  
  /* Primary Actions (Randomize button focus) */
  --color-primary-action: var(--sunset-orange);
  --color-primary-action-hover: var(--sunset-coral);
  
  /* Backgrounds */
  --color-background-main: var(--cream-base);
  --color-background-card: var(--cream-warm);
  
  /* Text Colors */
  --color-text-primary: var(--slate-dark);
  --color-text-secondary: var(--slate-medium);
  --color-text-on-primary: #ffffff;
  /* ... more semantic variables */
}
```

### Responsive Design
Mobile-first approach with breakpoints:
- Base: 320px+ (mobile)
- Medium: 481px+ (large mobile)
- Large: 768px+ (tablet/desktop)

### Component Classes
- `.btn-primary` - Main action buttons
- `.btn-secondary` - Secondary actions
- `.task-item` - Individual task display
- `.modal-overlay` - Modal dialogs

## 🔧 Common Development Tasks

### Adding New Task Types
1. Update task type options in HTML forms (`app/index.html`)
2. Modify `saveTask()` validation in `app/modules/TaskManager.js`
3. Update `getTaskStatus()` in `app/modules/TaskManager.js` for new type behavior
4. Add CSS styling for new type indicators in `app/styles.css`

### Adding Cooldown Options
1. Add option to select elements in `app/index.html`
2. Update `getCooldownMs()` method in `app/modules/Utils.js`
3. Update `formatCooldown()` method in `app/modules/Utils.js` for display text

### Customizing the Sunset Theme
The semantic color system makes theme changes easy and maintains design consistency:

#### Option 1: Modify Raw Colors
Update the base sunset palette while keeping the semantic structure:
```css
:root {
  /* Update these core colors for a different sunset variation */
  --sunset-orange: #your-primary-color;    /* Main theme color */
  --sunset-coral: #your-hover-color;       /* Hover states */
  --ocean-medium: #your-secondary-color;   /* Secondary actions */
  --cream-base: #your-background-color;    /* Main background */
  --slate-dark: #your-text-color;          /* Primary text */
}
```

#### Option 2: Change Semantic Mappings
Remap semantic variables to different raw colors:
```css
:root {
  /* Keep sunset palette but change how colors are used */
  --color-primary-action: var(--ocean-medium);    /* Use blue for primary */
  --color-secondary-action: var(--sunset-orange); /* Use orange for secondary */
  --color-background-main: var(--sand-light);     /* Different background */
}
```

#### Option 3: Completely New Theme
Replace the entire palette with your own colors:
```css
:root {
  /* Your custom theme colors */
  --forest-green: #2d5016;
  --sage-green: #a4b494;
  --cream-white: #faf7f0;
  
  /* Map to semantic variables */
  --color-primary-action: var(--forest-green);
  --color-background-main: var(--cream-white);
  --color-text-primary: var(--forest-green);
  /* ... continue mapping */
}
```

The semantic variables ensure consistent theming across all UI elements regardless of color choice.

### Adding New Icons
1. Add SVG file to `img/` directory
2. Keep consistent sizing (16x16 or 20x20)
3. Use `currentColor` for fill to inherit text color
4. Ensure icons work with both light and dark text
5. Reference in HTML: `<img src="img/your-icon.svg" />`
6. Test visibility against sunset theme backgrounds

## 🛠️ Debugging

### Browser Console Commands
```javascript
// Data inspection
app.utils.debugData()                 // View all data and statistics
app.data.validateDataIntegrity()      // Check for corruption

// Data management
app.importExport.exportTasksAsJson()  // Export backup
app.data.cleanupCorruptedData()       // Fix corruption
app.data.resetEverything()            // Clear all data
```

### Debug Tools
For debugging, use the browser console commands available when the main app is loaded. Additionally, when developing on localhost, a "Test Notifications" button appears in Settings → Debug Information to test the notification system.

### Common Issues
- **localStorage disabled**: App fails to save data
- **Corrupted data**: Use cleanup tools
- **Timer issues**: Check timestamp handling
- **PWA problems**: Ensure HTTPS and proper manifest

## 🧪 Testing

### Manual Testing Checklist
- [ ] Add tasks (both types)
- [ ] Edit tasks inline
- [ ] Delete and restore tasks
- [ ] Randomize task selection
- [ ] Accept and complete tasks
- [ ] Abandon tasks with reasons
- [ ] Export data
- [ ] PWA installation
- [ ] Offline functionality

### Browser Testing
Test across major browsers and mobile devices. Pay attention to:
- localStorage support
- CSS Grid/Flexbox compatibility
- Touch interactions
- PWA installation flow

### Data Testing
- Large numbers of tasks (1000+)
- Long task descriptions
- Invalid data in localStorage
- Clock changes affecting timers

## 📱 PWA Development

### Service Worker
The `sw.js` file implements:
- Cache-first strategy
- Offline support
- Cache versioning

### Manifest
The `manifest.json` defines:
- App metadata
- Icons and theme colors
- Display preferences

### Testing PWA Features
1. Serve over HTTPS (localhost is OK)
2. Test installation prompt
3. Verify offline functionality
4. Check cache behavior

## 🚀 Deployment

### Static Hosting
The app is pure static files - deploy anywhere:
- GitHub Pages
- Netlify
- Vercel
- Any web server

### Requirements
- HTTPS for PWA features
- Proper MIME types for SVG
- No server-side processing needed

### Pre-deployment Checklist
- [ ] Test in multiple browsers
- [ ] Verify PWA installation
- [ ] Check offline functionality
- [ ] Validate all icons load
- [ ] Test export/import features

## 🔄 Contributing Workflow

### Code Style
- Use ES6+ features
- Follow existing naming conventions
- Add comments for complex logic
- Keep functions focused and small

### CSS Guidelines
- Mobile-first responsive design
- Always use semantic CSS custom properties (never hardcode colors)
- Follow BEM-like naming conventions
- Minimize specificity conflicts
- Test color choices against sunset theme backgrounds
- Ensure sufficient contrast ratios for accessibility
- Use `--color-*` variables for consistency

### Submitting Changes
1. Test thoroughly across browsers
2. Ensure no console errors
3. Verify PWA functionality still works
4. Update documentation if needed

## 🎯 Performance Tips

### Optimization Strategies
- Minimize DOM manipulation
- Use CSS transforms for animations
- Leverage browser caching
- Keep localStorage data minimal

### Memory Management
- Clean up event listeners
- Clear intervals/timeouts
- Avoid memory leaks in closures

## 🔒 Security Considerations

### Client-Side Security
- Validate all user input
- Sanitize data before storage
- Handle localStorage failures gracefully
- No eval() or innerHTML with user data

### Privacy
- No external requests after load
- No tracking or analytics
- All data stays local
- No personal information required

## 📚 Resources

### Documentation
- [Technical Details](technical-details.md)
- [MDN Web Docs](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
- [PWA Best Practices](https://web.dev/pwa/)

### Tools
- Browser Developer Tools
- Lighthouse for PWA auditing
- Chrome DevTools Application tab for storage inspection

---

Happy coding! 🎉