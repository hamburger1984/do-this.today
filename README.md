# Now What? - Task Randomizer

A mobile-first Progressive Web App that helps you decide what to do next by randomly selecting from your personal task list. Perfect for managing both one-time tasks and daily routines with smart cooldown periods.

## 🌟 Key Features

- **Two task types:** One-time tasks (complete once) and repeatable tasks (with customizable cooldowns)
- **Smart randomization** - intelligently selects from available tasks
- **8-hour active task system** with real-time countdown timer
- **Mobile-first design** with PWA capabilities for offline use
- **Execution tracking** - view completion stats and abandon reasons
- **Trash system** - safe deletion with recovery options
- **Data integrity** - automatic corruption detection and recovery

## 🚀 Quick Start

1. Open `index.html` in any modern web browser
2. Click "My Tasks" to expand and add your first task
3. Click "Pick Random Task" to get started!

For PWA features, serve locally:
```bash
python -m http.server 8000  # or npx serve
```

## 📖 How to Use

### Managing Tasks
- **Add Tasks**: Expand "My Tasks" section and use the form at the top
- **Edit Tasks**: Click the pencil icon to edit tasks inline
- **Delete Tasks**: Click the trash icon (tasks go to recoverable trash)
- **Task Types**: Choose between one-time or repeatable with cooldown options

### Working with Tasks
1. **Pick Random**: Click "Pick Random Task" for an available task
2. **Accept**: Click "Let's Do It!" to start the 8-hour timer
3. **Complete**: Mark as done or abandon with a reason
4. **Repeat**: Pick another task when ready

### Settings & Data
- **Export Data**: Download tasks as JSON backup
- **View Trash**: Restore or permanently delete tasks
- **Debug Tools**: Check data integrity and clean corrupted entries
- **Reset**: Nuclear option to start fresh

## 🏗️ Technical Details

- **Stack**: Vanilla HTML5, CSS3, JavaScript (ES6+)
- **Storage**: Browser localStorage
- **PWA**: Service Worker for offline support
- **No dependencies** - works completely offline

### File Structure
```
/
├── index.html          # Main application
├── styles.css          # Mobile-first styles
├── script.js           # Core logic
├── manifest.json       # PWA manifest
├── sw.js              # Service Worker
├── debug-test.html     # Debug tool
└── img/               # SVG icons
    ├── arrow-left.svg  # Back navigation
    ├── check.svg       # Complete/accept
    ├── clock.svg       # Timer/cooldown
    ├── dice.svg        # Randomize
    ├── download.svg    # Export data
    ├── edit.svg        # Edit task
    ├── info.svg        # Debug info
    ├── refresh.svg     # Try another
    ├── trash.svg       # Delete task
    └── x.svg           # Cancel/close
```

## 🔒 Privacy

- **Local-first**: All data stays on your device
- **No tracking**: No analytics or data collection
- **No accounts**: No registration required
- **Open source**: Full code available for inspection

## 🔧 Customization

Easily customize colors, icons, cooldown options, and add new features through the modular JavaScript class structure.

## 🛠️ Troubleshooting

### Common Issues
- **Data corruption**: Use Settings → "Debug Data" or "Cleanup Corrupted Data"
- **Tasks not showing**: Check console with `app.debugData()`
- **Need help**: Use the debug tool at `debug-test.html`

### Debug Commands
```javascript
app.debugData()           // Inspect current data
app.cleanupCorruptedData() // Fix corrupted entries  
app.exportTasksAsJson()   // Export data
app.resetEverything()     // Reset all data
```

---

**Made with ❤️ for productivity and decision-making**