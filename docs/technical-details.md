# Technical Documentation - Now What? Task Randomizer

This document contains detailed technical information about the implementation, architecture, and data structures of the Now What? Task Randomizer app.

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
NowWhat/
├── index.html              # Main application entry point
├── styles.css              # Mobile-first CSS with CSS variables
├── script.js               # Core application logic (TaskRandomizer class)
├── manifest.json           # PWA manifest for app installation
├── sw.js                   # Service Worker for offline support
├── favicon.svg             # App icon in SVG format
├── debug-test.html         # Standalone data integrity diagnostic tool
├── generate-favicon.html   # Utility for generating favicon files
├── docs/
│   └── technical-details.md # This file
└── img/                    # SVG icon assets
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
- **`script.js`**: Main application logic encapsulated in TaskRandomizer ES6 class

#### PWA Files
- **`manifest.json`**: Defines app metadata for installation and app store listing
- **`sw.js`**: Service Worker for caching and offline functionality

#### Utility Files
- **`debug-test.html`**: Standalone diagnostic tool for data corruption issues
- **`generate-favicon.html`**: Development utility for creating favicon assets

## 💾 Data Storage Implementation

### localStorage Keys
The app uses the following localStorage keys:

```javascript
'nowwhat-tasks'      // JSON array of active tasks
'nowwhat-deleted'    // JSON array of deleted tasks (trash)
'nowwhat-completed'  // Integer count of completed tasks
'nowwhat-active'     // JSON object of currently active task
'nowwhat-nextid'     // Integer for next task ID assignment
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

### TaskRandomizer Class Structure

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

#### Data Integrity
- `validateDataIntegrity()`: Checks for corrupted task objects
- `cleanupCorruptedData()`: Removes invalid entries
- `handleInitializationError()`: Recovers from startup failures

### Task Status Calculation

Tasks have four possible states:

1. **Available**: Ready for randomization
   - One-off tasks: not completed
   - Repeatable tasks: no executions or cooldown expired

2. **Cooldown**: Waiting for cooldown period (repeatable only)
   - Last execution timestamp + cooldown duration > current time

3. **Completed**: Finished (one-off only)
   - `completed` property set to `true`

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

The styling system uses CSS custom properties for consistent theming:

```css
:root {
  /* Primary Colors */
  --primary-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  --primary-color: #667eea;
  --secondary-color: #764ba2;
  
  /* Status Colors */
  --status-available: #38a169;
  --status-cooldown: #ed8936;
  --status-completed: #4299e1;
  --status-error: #e53e3e;
  
  /* Layout */
  --shadow-light: 0 2px 4px rgba(0, 0, 0, 0.05);
  --shadow-heavy: 0 10px 25px rgba(0, 0, 0, 0.2);
  --focus-ring: 0 0 0 3px rgba(102, 126, 234, 0.1);
}
```

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

`debug-test.html` provides a standalone interface for:
- Data integrity checking
- Corruption cleanup
- Backup export
- Complete data reset

Useful when the main app fails to load due to corrupted data.

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