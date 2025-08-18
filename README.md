# Now What? - Task Randomizer

A mobile-first Progressive Web App that helps you decide what to do next by randomly selecting from your personal task list. Perfect for managing both one-time tasks and daily routines with smart cooldown periods.

## 🌟 Features

### 📱 Mobile-First Design
- **Responsive design** optimized for mobile devices first
- **Touch-friendly interface** with large, accessible buttons
- **PWA capabilities** - install on your device like a native app
- **Offline support** - works without internet connection
- **Cross-platform** - works on iOS, Android, and desktop

### ✅ Smart Task Management
- **Two task types:**
  - 📝 **One-time tasks** - Complete once and they're done (e.g., "Buy birthday present")
  - 🔄 **Repeatable tasks** - Can be done multiple times with cooldowns (e.g., "Clean kitchen")
- **Flexible cooldown system** with preset options:
  - No cooldown (immediate re-availability)
  - Custom durations (1h, 3h, 6h, 12h)
  - Daily (24 hours)
  - Weekly (7 days) 
  - Monthly (30 days)
- **Visual status indicators:**
  - ✅ Available (green) - ready to be selected
  - ⏰ Cooldown (orange) - waiting for cooldown to expire
  - 🏁 Completed (blue) - one-time task finished
- **Inline task editing** - edit tasks directly in place with a clean, focused interface
- **Robust data integrity** - automatic corruption detection and recovery
- **Trash system** - deleted tasks move to trash for recovery or permanent deletion
- **Execution tracking** - keeps history of when tasks were completed
- **Detailed execution statistics** - view completion counts, abandon counts, and last completion time

### 🎲 Intelligent Randomization
- **Smart filtering** - only shows available tasks for selection
- **Loading animations** for better user experience
- **Real-time availability count** - see how many tasks are ready
- **Prevents selection** of tasks on cooldown or completed one-offs

### ⏱️ Active Task System
- **8-hour focus window** - when you accept a task, you have up to 8 hours to complete it
- **Real-time countdown timer** showing remaining time (HH:MM:SS format)
- **Persistent active tasks** - survives browser refreshes and closures
- **Flexible completion** - mark done or abandon with reason tracking
- **Abandon reasons** - record why tasks are abandoned for future insights
- **Auto-expiration** - tasks automatically expire after 8 hours

### 📊 Progress Tracking
- **Completion statistics** - track total tasks and completed count
- **Individual execution history** for repeatable tasks
- **Cooldown management** - see exactly when tasks become available again
- **Per-task execution stats** - see successful completions (✓), abandoned attempts (✗), and time since last completion (🕒)
- **Smart statistics display** - execution stats only appear when tasks have been attempted

### 🎨 User Experience
- **Beautiful gradient design** with consistent branding
- **Smooth animations** and micro-interactions
- **Toast notifications** for user feedback
- **Keyboard shortcuts** for power users:
  - `Enter`: Save new task
  - `Escape`: Cancel task input / Close abandon reason modal
  - `Space`: Randomize task (when not typing)
  - `Ctrl+Enter`: Save abandon reason
- **Dark mode support** based on system preference
- **Single-page interface** - all functionality available on one page with collapsible sections
- **Collapsible task list** - task management integrated into main page, starts collapsed for clean interface
- **Quick task entry** - add form directly on main page for immediate task creation
- **Inline editing** - edit tasks in place with auto-focus and clean, borderless styling
- **Clean UI design** - minimal visual clutter, unified styling, icons only shown when needed
- **Unified task metadata** - consistent styling for all task information and statistics
- **Accessibility features** - ARIA labels, focus management, screen reader support
- **Error recovery** - automatic detection and fixing of corrupted data
- **Debug tools** - built-in data integrity checking and cleanup functions
- **Settings panel** - collapsible settings section with data management tools

## 🚀 Getting Started

### Quick Start
1. Open `index.html` in any modern web browser
2. Add your first task using the form on the main page
3. Click "Pick Random Task" to get started!

### Local Development
For development with proper PWA features, serve the files using a local server:

```bash
# Using Python
python -m http.server 8000

# Using Node.js
npx serve

# Using PHP
php -S localhost:8000
```

Then visit `http://localhost:8000`

## 📖 How to Use

### Adding Tasks
1. Use the **"Add New Task"** form to quickly add new tasks
2. Enter your task description
3. Choose task type and cooldown period
4. Click **"Add Task"**

**Task List Management:**
1. Click **"My Tasks"** section header to expand/collapse the task list
2. View, edit, and delete existing tasks directly in the list

### Managing Tasks
- **Add Tasks**: Use the "Add New Task" form to quickly add new tasks
- **Collapsible List**: Click the "My Tasks" header to show/hide your task list (starts collapsed)
- **Inline Editing**: Click the **pencil icon (✏️)** to edit tasks directly in place
- **Delete Tasks**: Click the **trash icon** to move tasks to trash (access via Settings)
- **Task Types**: Switch between one-time and repeatable tasks
- **Cooldown Options**: Choose from no cooldown to monthly intervals for repeatable tasks
- **View Statistics**: Each task shows execution stats when available:
  - ✓ **Successful completions** count (green badge)
  - ✗ **Abandoned attempts** count (red badge)
  - 🕒 **Time since last completion** (blue badge, e.g., "2h ago", "3d ago")
- **Clean Display**: Repeatable tasks show 🔄 with cooldown info, one-time tasks have minimal visual footprint
- **Unified Styling**: All task metadata uses consistent badge styling for a polished look

### Working with Tasks
1. **Pick a Task**: Click "Pick Random Task" to get a random available task (avoids repeating the same task)
2. **Decide**: Either "Try Another" if you don't like it, or "Let's Do It!" to commit
3. **Focus**: When you accept, the task becomes active for up to 8 hours
4. **Complete**: Click "Mark as Done" when finished, or "Give Up" with a reason
5. **Abandon with Reason**: When giving up, explain why (tracked for insights)
6. **Repeat**: "Pick Another Task" button automatically selects a new random task

### Task States
- **Available**: Ready to be selected in randomization
- **Active**: Currently working on (8-hour window)
- **Cooldown**: Waiting for cooldown period to expire (repeatable tasks only)
- **Completed**: Finished (one-time tasks only)

### Managing Deleted Tasks
- **Access Trash**: Click the **trash icon** in the "My Tasks" section header to view deleted tasks
- **Restore Tasks**: Click the **restore icon** to bring tasks back to your active list
- **Delete Forever**: Click the **delete icon** to permanently remove tasks
- **Clear All**: Remove all deleted tasks permanently with one click
- **Safe Deletion**: Tasks are moved to trash first, giving you a chance to recover them

### Settings & Data Management
- **Access Settings**: Click the "Settings" header (below task list) to expand options
- **Export Data**: Download all your tasks as pretty-printed JSON with metadata
- **View Trash**: Access deleted tasks for restoration or permanent deletion
- **Reset Everything**: Nuclear option to clear all data with double confirmation
- **Debug Tools**: Access data integrity checking and corruption cleanup
- **Collapsible Interface**: Settings section starts collapsed to keep interface clean

## 🏗️ Technical Details

### Architecture
- **Frontend**: Vanilla HTML5, CSS3, JavaScript (ES6+)
- **Storage**: Browser localStorage for data persistence
- **PWA**: Service Worker for offline support and app installation
- **Assets**: External SVG files for scalable icons
- **No dependencies**: Works without internet or external libraries

### Browser Support
- Chrome 60+
- Firefox 55+
- Safari 11+
- Edge 79+
- Mobile browsers with equivalent versions

### File Structure
```
/
├── index.html          # Main application
├── styles.css          # Mobile-first responsive styles
├── script.js           # Core application logic
├── manifest.json       # PWA manifest
├── sw.js              # Service Worker for offline support
├── img/               # SVG icons and assets
│   ├── plus.svg       # Add task icon
│   ├── dice.svg       # Randomize icon
│   ├── check.svg      # Complete/accept icon
│   ├── refresh.svg    # Try another icon
│   ├── edit.svg       # Edit task icon
│   ├── trash.svg      # Delete task icon
│   ├── arrow-left.svg # Back navigation icon
│   ├── x.svg          # Cancel/close icon
│   ├── clock.svg      # Timer/cooldown icon
│   ├── download.svg   # Export data icon
│   └── info.svg       # Debug info icon
└── README.md          # This documentation
```

### Data Structure
Tasks are stored as objects with the following structure:
```javascript
{
  id: 1,                    // Unique identifier
  text: "Clean kitchen",    // Task description
  type: "repeatable",       // "oneoff" or "repeatable"
  cooldown: "daily",        // Cooldown period
  executions: [             // History of completions and abandons
    {
      timestamp: 1234567890,  // When completed/abandoned
      duration: 7200000,      // How long it took
      abandoned: false,       // Whether task was abandoned
      reason: "Too difficult" // Abandon reason (if abandoned)
    }
  ],
  completed: false,         // For one-off tasks
  deletedAt: 1234567890     // When moved to trash (deleted tasks only)
}
```

### 🛠️ Data Integrity & Recovery
The app includes robust data protection:
- **Automatic validation** - checks data integrity on startup
- **Corruption recovery** - fixes malformed task objects automatically  
- **Safe migration** - converts old data formats seamlessly
- **Debug console commands**:
  - `app.debugData()` - inspect current data state
  - `app.cleanupCorruptedData()` - manually clean corrupted entries
  - `app.clearAllData()` - reset everything (with confirmation)
- **Standalone debug tool** - `debug-test.html` for advanced troubleshooting

## 🔧 Customization

The app is designed to be easily customizable:

### Visual Customization
- **Colors**: Modify CSS gradient variables in `styles.css`
- **Icons**: Replace SVG files in the `img/` directory
- **Layout**: Adjust responsive breakpoints and spacing
- **Animations**: Modify transition timing and effects

### Functional Customization
### Sample tasks**: Edit default tasks in `script.js` `loadTasks()` method
- **Cooldown options**: Add/modify options including zero cooldown support
- **Active task duration**: Change the 8-hour limit in `acceptTask()` method
- **Timer intervals**: Adjust countdown update frequency
- **Edit form styling**: Customize borderless inline editing appearance and behavior
- **Task metadata styling**: Modify unified badge system for task information display

### Adding New Features
The modular JavaScript class structure makes it easy to:
- Add new task types
- Implement custom cooldown calculations
- Add task categories or tags
- Integrate with external APIs
- Add data export/import functionality
- Implement automatic trash cleanup after X days

## 🔒 Privacy & Security

- **Local-first**: All data stays on your device (including trash)
- **No tracking**: No analytics, cookies, or data collection
- **No accounts**: No registration or personal information required
- **Offline capable**: Works completely offline after first load
- **Safe deletion**: Trash system prevents accidental data loss
- **Open source**: Full source code available for inspection

## 🌟 Why Use Now What?

Perfect for when you:
- Have a list of tasks but can't decide what to do next
- Want to gamify your productivity with random selection
- Need to manage both daily routines and one-off tasks
- Want a simple, distraction-free task management tool with quick task entry
- Prefer mobile-first, touch-friendly interfaces with clear navigation
- Value privacy and offline functionality with safe task deletion
- Need reliable data integrity and automatic error recovery

## 🔧 Troubleshooting

### Common Issues
- **"[object Object]" in task list**: Fixed automatically with data validation
- **Tasks not showing**: Check browser console or use `app.debugData()`
- **Edit button not working**: Ensure task list is expanded
- **Data corruption**: Use `debug-test.html` for diagnosis and repair
- **Settings not visible**: Click "Settings" header to expand the section
- **Empty spaces in task list**: Fixed - no more empty spans for one-off tasks

### Debug Commands
Open browser console and try:
```javascript
app.debugData()           // Inspect current data with execution stats
app.cleanupCorruptedData() // Fix corrupted entries  
app.exportTasksAsJson()   // Export data programmatically
app.resetEverything()     // Nuclear reset option (with confirmations)
```

### Using the Settings Panel
1. **Expand Settings**: Click the "Settings" header (below task list)
2. **Export Tasks**: Click "Export Tasks as JSON" to download your data
3. **View Trash**: Click "View Trash" to see deleted tasks and restore or permanently delete them
4. **Debug Data**: Click "Debug Data" to inspect your data in console
5. **Clean Data**: Click "Cleanup Corrupted Data" to fix any issues
6. **Reset All**: Click "Reset Everything" to start completely fresh (with confirmations)

## 🤝 Contributing

This is an open source project. Feel free to:
- Report bugs or request features
- Submit pull requests
- Fork and customize for your needs
- Share improvements with the community

## 📄 License

This project is open source and available under the MIT License.

---

**Made with ❤️ for productivity and decision-making**