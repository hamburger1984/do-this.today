# do this - today!

A mobile-first Progressive Web App that helps you decide what to do next by randomly selecting from your personal task list. Perfect for managing both one-time tasks and daily routines with smart cooldown periods.

**🌐 Live App: [do-this.today](https://do-this.today)**



## 🌟 What It Does

- **Random task selection** - Can't decide what to do? Let the app pick for you!
- **Two task types** - One-time tasks you complete once, or repeatable tasks with cooldowns
- **8-hour focus timer** - When you accept a task, you get 8 hours to complete it with progress notifications
- **Works offline** - Install as an app on your phone and use anywhere
- **Privacy-first** - All your data stays on your device, no accounts needed

## 🚀 Quick Start

1. Open the app in your web browser
2. Click "My Tasks" to add your first task
3. Choose between one-time or repeatable (with cooldown options)
4. Click "Pick Random Task" to get started!
5. Accept the task to start your 8-hour timer

## 📱 Installation

### On Mobile (iPhone/Android)
1. Open the app in Safari (iOS) or Chrome (Android)
2. Look for "Add to Home Screen" or install prompt
3. Add it to your home screen like any other app



### On Desktop
1. Open in Chrome, Edge, or Firefox
2. Look for the install button in the address bar
3. Click to install as a desktop app

## 🎯 How to Use

### Managing Your Tasks
- **Add tasks** - Expand "My Tasks" and use the form at the top
- **Edit tasks** - Click the pencil icon to edit any task
- **Delete tasks** - Click the trash icon (they go to recoverable trash)
- **Choose types** - One-time tasks or repeatable with cooldown periods

### Task Types & Cooldowns
- **One-time tasks** - Complete once and they're done (like "Buy groceries")
- **Repeatable tasks** - Can be done multiple times with cooldowns:

  - No cooldown (always available)
  - 1, 3, 6, or 12 hours (exact time from completion)
  - Daily (resets at midnight)
  - Weekly (resets Monday at midnight)
  - Monthly (resets 1st of month at midnight)

### Working with Tasks
1. **Pick a random task** - Click the "Pick Random Task" button
2. **Try another** - Don't like it? Pick again
3. **Accept it** - Click "Let's Do It!" to start the timer (you'll get notifications at 50% and 75% progress)
4. **Complete or abandon** - Mark done when finished, or give up with a reason



### Task Status
- ✅ **Available** (green) - Ready to be picked
- ⏰ **Cooldown** (orange) - Waiting for cooldown to end
- 🏁 **Completed** (blue) - One-time task finished (stays visible for 24h)
- 🔄 **Repeatable** - Shows cooldown period

**Note:** Completed one-time tasks remain visible in your task list for 24 hours after completion, then automatically move to trash to keep your list clean.



## ⚙️ Settings & Data

### Export Your Data
- Go to Settings → "Export Tasks as JSON"
- Downloads a backup file you can save
- Includes all tasks, stats, and completion history

### Recover Deleted Tasks
- Go to Settings → "View Trash"
- Restore tasks you deleted by mistake
- Or permanently delete them forever

### Troubleshooting
- **Data problems?** Use Settings → "Debug Data" or "Cleanup Corrupted Data"
- **Need help?** Use browser console commands when app is loaded (see development docs)
- **Want to start over?** Settings → "Reset Everything"

## 🎨 Design & Theming

### Sunset-Inspired Color Theme ✨
**do this - today!** features a warm, eye-friendly sunset-inspired design that creates a perfect balance between visibility and comfort:

- **Bright, Comfortable Background**: Very light cream base that's easy on the eyes in any lighting
- **High Contrast Elements**: Excellent readability with carefully chosen text colors
- **Sunset Color Palette**: Warm oranges and complementary ocean blues
- **Enhanced Focus**: The Randomize button and task list are prominently featured
- **Semantic Color System**: All colors are purpose-named for easy customization

### Current Sunset Theme Colors
- **Sunset Orange** (`#ff6b35`) - Primary actions (especially the Randomize button)
- **Ocean Blue** (`#2d5a87`) - Secondary actions and status indicators
- **Cream Background** (`#fef9f3`) - Main background for comfortable viewing
- **Coral Accent** (`#f7931e`) - Hover states and warnings
- **Deep Slate** (`#1f2937`) - Primary text for excellent contrast

### Design Philosophy
The new theme prioritizes:
- **Eye comfort** with bright, warm backgrounds
- **Visual hierarchy** that draws attention to key actions
- **Accessibility** with high contrast ratios
- **Warmth** through sunset-inspired color combinations

### For Developers
Want to customize the colors? See [Development Guide](docs/development.md) for details on the semantic CSS variable system that makes theme switching incredibly easy.

## 🔒 Privacy & Security

- **Your data stays with you** - Everything is stored on your device only
- **No tracking** - We don't collect any information about you
- **No accounts** - No sign-up, passwords, or personal info required
- **Open source** - You can see exactly how it works
- **Works offline** - No internet connection needed after first load

## 🌟 Why Use This?

Perfect for when you:
- Have a to-do list but can't decide what to tackle first
- Want to gamify your productivity with random selection
- Need to manage both daily habits and one-time tasks
- Prefer simple, distraction-free tools
- Value privacy and want your data to stay private
- Like mobile-first apps that work offline

## 🛠️ Technical Details

For developers and technical users, see our comprehensive documentation:

### [Technical Documentation](docs/technical-details.md)
- Architecture and code structure
- Data storage format and schemas
- PWA implementation details
- Two-tier color system details
- Performance optimizations

### [Development Guide](docs/development.md)
- Getting started with development
- Adding new features
- Customizing themes and colors
- Testing and deployment
- Contributing guidelines

## 🤝 Contributing

This is an open source project! Feel free to:
- Report bugs or suggest features
- Submit pull requests
- Fork and customize for your own needs
- Share improvements with the community

---

**Made with ❤️ for productivity and decision-making**

🌐 **Visit: [do-this.today](https://do-this.today)**