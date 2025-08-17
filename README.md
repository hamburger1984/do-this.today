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
  - Daily (24 hours)
  - Weekly (7 days) 
  - Monthly (30 days)
  - Custom durations (1h, 3h, 6h, 12h)
- **Visual status indicators:**
  - ✅ Available (green) - ready to be selected
  - ⏰ Cooldown (orange) - waiting for cooldown to expire
  - 🏁 Completed (blue) - one-time task finished
- **Full task editing** - modify text, type, and cooldown periods after creation
- **Execution tracking** - keeps history of when tasks were completed

### 🎲 Intelligent Randomization
- **Smart filtering** - only shows available tasks for selection
- **Loading animations** for better user experience
- **Real-time availability count** - see how many tasks are ready
- **Prevents selection** of tasks on cooldown or completed one-offs

### ⏱️ Active Task System
- **8-hour focus window** - when you accept a task, you have up to 8 hours to complete it
- **Real-time countdown timer** showing remaining time (HH:MM:SS format)
- **Persistent active tasks** - survives browser refreshes and closures
- **Flexible completion** - mark done or abandon at any time
- **Auto-expiration** - tasks automatically expire after 8 hours

### 📊 Progress Tracking
- **Completion statistics** - track total tasks and completed count
- **Individual execution history** for repeatable tasks
- **Cooldown management** - see exactly when tasks become available again

### 🎨 User Experience
- **Beautiful gradient design** with consistent branding
- **Smooth animations** and micro-interactions
- **Toast notifications** for user feedback
- **Keyboard shortcuts** for power users:
  - `Enter`: Save new task
  - `Escape`: Cancel task input
  - `Space`: Randomize task (when not typing)
- **Dark mode support** based on system preference
- **Accessibility features** - ARIA labels, focus management, screen reader support

## 🚀 Getting Started

### Quick Start
1. Open `index.html` in any modern web browser
2. Start with the pre-loaded sample tasks or add your own
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
1. Click the **"+"** button in the task list
2. Enter your task description
3. Choose task type:
   - **One-time task**: Complete once and it's done forever
   - **Repeatable task**: Can be done multiple times with cooldown
4. For repeatable tasks, select cooldown period
5. Click **"Save"**

### Editing Tasks
1. Click the **pencil icon (✏️)** next to any task
2. Modify the task description, type, or cooldown period
3. Click **"Update"** to save changes or **"Cancel"** to discard
4. Tasks can be converted between one-time and repeatable types

### Working with Tasks
1. **Pick a Task**: Click "Pick Random Task" to get a random available task
2. **Decide**: Either "Try Another" if you don't like it, or "Let's Do It!" to commit
3. **Focus**: When you accept, the task becomes active for up to 8 hours
4. **Complete**: Click "Mark as Done" when finished, or "Give Up" to try something else
5. **Repeat**: Pick another task when ready!

### Task States
- **Available**: Ready to be selected in randomization
- **Active**: Currently working on (8-hour window)
- **Cooldown**: Waiting for cooldown period to expire (repeatable tasks only)
- **Completed**: Finished (one-time tasks only)

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
│   ├── x.svg          # Cancel/close icon
│   └── clock.svg      # Timer/cooldown icon
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
  executions: [             // History of completions
    {
      timestamp: 1234567890,  // When completed
      duration: 7200000       // How long it took
    }
  ],
  completed: false          // For one-off tasks
}
```

## 🔧 Customization

The app is designed to be easily customizable:

### Visual Customization
- **Colors**: Modify CSS gradient variables in `styles.css`
- **Icons**: Replace SVG files in the `img/` directory
- **Layout**: Adjust responsive breakpoints and spacing
- **Animations**: Modify transition timing and effects

### Functional Customization
- **Sample tasks**: Edit default tasks in `script.js` `loadTasks()` method
- **Cooldown options**: Add/modify options in the HTML select element
- **Active task duration**: Change the 8-hour limit in `acceptTask()` method
- **Timer intervals**: Adjust countdown update frequency

### Adding New Features
The modular JavaScript class structure makes it easy to:
- Add new task types
- Implement custom cooldown calculations
- Add task categories or tags
- Integrate with external APIs
- Add data export/import functionality

## 🔒 Privacy & Security

- **Local-first**: All data stays on your device
- **No tracking**: No analytics, cookies, or data collection
- **No accounts**: No registration or personal information required
- **Offline capable**: Works completely offline after first load
- **Open source**: Full source code available for inspection

## 🌟 Why Use Now What?

Perfect for when you:
- Have a list of tasks but can't decide what to do next
- Want to gamify your productivity with random selection
- Need to manage both daily routines and one-off tasks
- Want a simple, distraction-free task management tool
- Prefer mobile-first, touch-friendly interfaces
- Value privacy and offline functionality

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