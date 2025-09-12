# Technical Documentation - do this - today!

This document contains detailed technical information about the implementation, architecture, and data structures of the **do this - today!** app, including details about the new sunset-inspired color theme system.

**🌐 Live App: [do-this.today](https://do-this.today)**

## 🏗️ Architecture Overview

### Technology Stack
- **Frontend**: Vanilla HTML5, CSS3, JavaScript (ES6+)
- **Storage**: Browser localStorage API
- **PWA**: Service Worker for offline functionality
- **Assets**: SVG icons for scalability
- **Dependencies**: None (fully self-contained)

### Browser Requirements
- Chrome 60+ / Chromium-based browsers
- Firefox 55+
- Safari 11+
- Edge 79+
- Mobile browsers with equivalent feature support

### Core Design Principles
- Mobile-first responsive design
- Progressive Web App capabilities
- Offline-first data storage
- Zero external dependencies
- Privacy-focused (no tracking)

## 📁 File Structure & Functions

```
do-this-today/
├── app/
│   ├── index.html              # Main application entry point
│   ├── styles.css              # Mobile-first CSS with CSS variables
│   ├── script.js               # Core application logic (TaskDiceApp class)
│   ├── manifest.json           # PWA manifest for app installation
│   ├── sw.js                   # Service Worker for offline support
│   ├── favicon.svg             # App icon in SVG format
│   └── img/                    # SVG icon assets
├── docs/
│   ├── development.md          # Development guide
│   └── technical-details.md    # This file
└── debug-test.html             # Standalone data integrity diagnostic tool
    ├── arrow-left.svg      # Back navigation (24x24)
    ├── check.svg           # Complete/accept actions (20x20)
    ├── clock.svg           # Timer/cooldown indicators (20x20)
    ├── dice.svg            # Randomize task action (20x20)
    ├── download.svg        # Export data action (16x16)
    ├── edit.svg            # Edit task action (16x16)
    ├── info.svg            # Debug/info actions (16x16)
    ├── refresh.svg         # Try another/refresh actions (20x20)
    ├── trash.svg           # Delete task action (16x16)
    └── x.svg               # Cancel/close actions (20x20)
```

### File Descriptions

#### Core Application Files
- **`index.html`**: Single-page application structure with semantic HTML5
- **`styles.css`**: Mobile-first CSS with CSS custom properties for theming
- **`script.js`**: Main application logic encapsulated in DoThisApp ES6 class

#### PWA Files
- **`manifest.json`**: Defines app metadata for installation and app store listing
- **`sw.js`**: Service Worker for caching and offline functionality

#### Utility Files


## 💾 Data Storage Implementation

### localStorage Keys
The app uses the following localStorage keys:

```javascript
'dothis-tasks'      // JSON array of active tasks
'dothis-deleted'    // JSON array of deleted tasks (trash)
'dothis-completed'  // Integer count of completed tasks
'dothis-active'     // JSON object of currently active task
'dothis-nextid'     // Integer for next task ID assignment
```

### Task Data Structure

Each task is stored as a JavaScript object with the following schema:

```javascript
{
  id: 1,                    // Unique identifier (integer)
  text: "Clean kitchen",    // Task description (string, max 200 chars)
  type: "repeatable",       // Task type: "oneoff" | "repeatable"
  cooldown: "daily",        // Cooldown period (see options below)
  executions: [             // Array of execution history
    {
      timestamp: 1234567890,    // Unix timestamp (number)
      duration: 7200000,        // Duration in milliseconds (number)
      abandoned: false,         // Whether task was abandoned (boolean)
      reason: "Too difficult"   // Abandon reason (string, optional)
    }
  ],
  completed: false,         // Completion status for one-off tasks (boolean)
  deletedAt: 1234567890     // Deletion timestamp (number, deleted tasks only)
}
```

### Cooldown Options
Available cooldown periods for repeatable tasks:

```javascript
"0"        // No cooldown (immediate re-availability)
"1"        // 1 hour (3,600,000 ms)
"3"        // 3 hours (10,800,000 ms)
"6"        // 6 hours (21,600,000 ms)
"12"       // 12 hours (43,200,000 ms)
"daily"    // 24 hours (86,400,000 ms)
"weekly"   // 7 days (604,800,000 ms)
"monthly"  // 30 days (2,592,000,000 ms)
```

### Active Task Structure

When a task is active (user has accepted it), it's stored with additional metadata:

```javascript
{
  task: {/* full task object */},  // Reference to the original task
  startTime: 1234567890,          // When task was accepted (Unix timestamp)
  duration: 28800000              // 8 hours in milliseconds (constant)
}
```

## 🔧 Core Application Logic

### DoThisApp Class Structure

The main application is implemented as an ES6 class with the following key methods:

#### Initialization
- `constructor()`: Sets up initial state
- `init()`: Binds events, loads data, validates integrity
- `loadTasks()`: Loads and validates data from localStorage
- `bindEvents()`: Attaches event listeners to DOM elements

#### Task Management
- `saveTask()`: Creates new tasks with validation
- `saveTaskEdit()`: Updates existing tasks
- `deleteTask(index)`: Moves tasks to trash
- `getTaskStatus(task)`: Determines availability status

#### Randomization Logic
- `randomizeTask()`: Selects random available task (avoids immediate repeats)
- `getAvailableTasks()`: Filters tasks by availability status
- `acceptTask()`: Activates selected task with 8-hour timer

#### Active Task System
- `startActiveTaskTimer()`: Begins countdown timer
- `updateActiveTaskTimer(remaining)`: Updates display every second
- `completeActiveTask()`: Records completion and updates stats
- `abandonActiveTask()`: Records abandonment with reason

### Data Integrity
- `validateDataIntegrity()`: Checks for corrupted task objects
- `cleanupCorruptedData()`: Removes invalid entries
- `handleInitializationError()`: Recovers from startup failures
- `cleanupCompletedOneOffTasks()`: Auto-moves completed one-off tasks to trash after 24h

### Task Status Calculation

Tasks have four possible states:

1. **Available**: Ready for randomization
   - One-off tasks: not completed
   - Repeatable tasks: no executions or cooldown expired

2. **Cooldown**: Waiting for cooldown period (repeatable only)
   - Last execution timestamp + cooldown duration > current time

3. **Completed**: Finished (one-off only)
   - `completed` property set to `true`
   - Completion timestamp recorded in `executions` array
   - Visible in task list for 24 hours after last successful execution, then auto-moved to trash

4. **Active**: Currently being worked on
   - Referenced in `activeTask` localStorage entry

### Execution Statistics

The app tracks detailed execution statistics:

```javascript
// Calculated from executions array
{
  successful: 5,           // Count of non-abandoned executions
  abandoned: 2,            // Count of abandoned executions
  lastSuccessful: 1234567890,  // Timestamp of last successful completion
  html: "<span>...</span>" // Rendered HTML for display
}
```

## 🎨 CSS Architecture

### CSS Custom Properties (Variables)

The styling system uses a sophisticated semantic CSS custom properties system for the sunset-inspired theme:

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
  --ocean-mist: #87ceeb;        /* Very light ocean mist */

  /* Neutral Base Colors */
  --cream-base: #fef9f3;        /* Very light cream background */
  --cream-warm: #fdf6ed;        /* Slightly warmer cream */
  --sand-light: #f5f0e8;        /* Light sand color */
  --sand-medium: #e8ddd1;       /* Medium sand */
  --slate-soft: #6b7280;        /* Soft slate for muted text */
  --slate-medium: #4b5563;      /* Medium slate for secondary text */
  --slate-dark: #1f2937;        /* Dark slate for primary text */

  /* === SEMANTIC COLOR VARIABLES === */
  
  /* Primary Actions (Randomize button focus) */
  --color-primary-action: var(--sunset-orange);
  --color-primary-action-hover: var(--sunset-coral);
  --color-primary-action-active: #e55a2b;
  
  /* Backgrounds */
  --color-background-main: var(--cream-base);
  --color-background-card: var(--cream-warm);
  --color-background-elevated: #ffffff;
  
  /* Text Colors */
  --color-text-primary: var(--slate-dark);
  --color-text-secondary: var(--slate-medium);
  --color-text-muted: var(--slate-soft);
  --color-text-on-primary: #ffffff;
  --color-text-accent: var(--sunset-orange);
  
  /* Task List Colors */
  --color-task-background: var(--cream-warm);
  --color-task-background-hover: #ffffff;
  --color-task-border: var(--sand-medium);
  --color-task-border-hover: var(--sunset-peach);
  
  /* Status Colors */
  --color-status-available: var(--ocean-light);
  --color-status-cooldown: var(--sunset-coral);
  --color-status-completed: var(--slate-soft);
  --color-status-success: #10b981;
  --color-status-error: #ef4444;
  --color-status-warning: var(--sunset-gold);
}
```

#### Semantic Color System

The new color system is purpose-driven and easy to maintain:

1. **Raw Color Palette**: Defines the sunset and complementary colors
2. **Semantic Variables**: Map colors to their functional purpose (e.g., `--color-primary-action`, `--color-task-background`)
3. **Legacy Compatibility**: Old variable names are mapped to new semantic ones
4. **Enhanced UX**: Colors are chosen to draw attention to key elements like the Randomize button

Key design principles:
- **Bright backgrounds** (`--cream-base`) for eye comfort
- **High contrast text** (`--slate-dark` on light backgrounds)
- **Prominent primary actions** using sunset orange
- **Subtle secondary elements** using muted tones
- **Meaningful color coding** for task statuses

To customize the theme, update the raw color palette variables and the semantic mappings will automatically inherit the changes.

### Responsive Design

Mobile-first approach with breakpoints:

- **Base**: 320px+ (mobile)
- **Medium**: 481px+ (large mobile/small tablet)
- **Large**: 768px+ (tablet/desktop)

### Animation System

Consistent animation timing:

- **Fast interactions**: 0.1s ease (buttons, hovers)
- **UI transitions**: 0.15s ease (modals, slides)
- **Loading states**: 1s linear infinite (spinners)

## 🔄 PWA Implementation

### Service Worker Strategy

Cache-first strategy for offline support:

1. **Install**: Cache critical resources
2. **Fetch**: Serve from cache, fallback to network
3. **Activate**: Clean up old caches

### Cached Resources
- Main application files (HTML, CSS, JS)
- All SVG icons
- Google Fonts (Inter font family)

### Automatic Task Cleanup

One-off tasks follow a specific lifecycle:
1. **Created**: Available for randomization
2. **Completed**: Marked as done with execution timestamp in `executions` array
3. **24h Grace Period**: Remains visible in task list
4. **Auto-Trash**: Automatically moved to trash 24 hours after last successful execution

The cleanup process uses the most recent non-abandoned execution timestamp to determine when to move completed one-off tasks to trash. This prevents task list clutter while giving users time to see their accomplishments.

### Theme Color Integration

The app's theme color is set to match the primary sunset orange:
- HTML meta tag: `<meta name="theme-color" content="#ff6b35" />`
- PWA manifest integration for consistent branding
- Browser UI elements adapt to the warm sunset theme

### App Installation

The app can be installed on devices through:
- Chrome's "Add to Home Screen"
- iOS Safari "Add to Home Screen"
- Desktop browsers' install prompt

## 🛠️ Development Utilities

### Debug Console Commands

Available in browser console when app is loaded:

```javascript
// Data inspection
app.debugData()                 // Detailed data analysis
app.validateDataIntegrity()     // Check for corruption

// Data management
app.exportTasksAsJson()         // Download backup
app.cleanupCorruptedData()      // Fix corrupted entries
app.resetEverything()           // Nuclear reset (with confirmations)

// Internal methods (for development)
app.saveTasks()                 // Force save to localStorage
app.loadTasks()                 // Reload from localStorage
```

### Debug Test Tool

The main app provides debug tools via browser console commands when corrupted data prevents normal operation.

## 📊 Performance Considerations

### Optimizations
- **No external dependencies**: Zero network requests after initial load
- **Efficient animations**: Hardware-accelerated CSS transforms
- **Minimal DOM manipulation**: Direct property updates where possible
- **Lazy evaluation**: Task status calculated on-demand

### Memory Management
- **Event listener cleanup**: Proper removal when needed
- **Timer management**: `clearInterval()` called appropriately
- **Object references**: Avoid memory leaks in task references

### Storage Limits
- localStorage typically has 5-10MB limit per origin
- Task data is minimal (~100-200 bytes per task)
- Realistic limit: 10,000+ tasks before storage concerns

## 🔐 Security & Privacy

### Data Security
- **Client-side only**: No server communication
- **No external requests**: All resources self-contained
- **Local storage**: Data never leaves user's device

### Privacy Features
- **No tracking**: No analytics or telemetry
- **No cookies**: Session storage only
- **No accounts**: No personal information required
- **Open source**: Complete code transparency

## 🧪 Testing Considerations

### Browser Testing
- Test across major browsers and versions
- Verify PWA installation on mobile devices
- Check offline functionality
- Validate localStorage limits

### Data Testing
- Test with large numbers of tasks (1000+)
- Verify data migration from older versions
- Test corruption recovery mechanisms
- Validate export/import functionality

### Edge Cases
- localStorage disabled/unavailable
- Extremely long task descriptions
- Invalid JSON in localStorage
- Clock/timezone changes affecting timers

## 🚀 Deployment

### Static Hosting Requirements
- Simple HTTP server (no server-side processing)
- HTTPS required for PWA features
- Proper MIME types for SVG files

### Recommended Hosting
- GitHub Pages
- Netlify
- Vercel
- Any static file hosting service

### Build Process
No build process required - files can be served directly as-is.