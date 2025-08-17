class TaskRandomizer {
  constructor() {
    this.tasks = [];
    this.completedTasks = 0;
    this.currentSelectedTask = null;
    this.activeTask = null;
    this.activeTaskTimer = null;
    this.nextTaskId = 1;
    this.taskListCollapsed = true;
    this.init();
  }

  init() {
    this.loadTasks();
    this.bindEvents();
    this.updateUI();
    this.updateStats();
    this.updateRandomizeButton();
    this.checkActiveTask();
  }

  // Event binding
  bindEvents() {
    // Task management - handled in HTML onclick to prevent event bubbling
    document
      .getElementById("cancelTaskBtn")
      .addEventListener("click", () => this.hideTaskInput());
    document
      .getElementById("saveTaskBtn")
      .addEventListener("click", () => this.saveTask());
    document.getElementById("taskInput").addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        this.saveTask();
      }
    });

    // Randomizer
    document
      .getElementById("randomizeBtn")
      .addEventListener("click", () => this.randomizeTask());
    document
      .getElementById("randomizeAgainBtn")
      .addEventListener("click", () => this.randomizeTask());
    document
      .getElementById("acceptTaskBtn")
      .addEventListener("click", () => this.acceptTask());
    document
      .getElementById("nextTaskBtn")
      .addEventListener("click", () => this.nextTask());

    // Active task buttons
    document
      .getElementById("completeActiveBtn")
      .addEventListener("click", () => this.completeActiveTask());
    document
      .getElementById("abandonActiveBtn")
      .addEventListener("click", () => this.abandonActiveTask());

    // Task type selection
    document
      .getElementById("taskType")
      .addEventListener("change", () => this.toggleCooldownOptions());

    // Task editing
    document
      .getElementById("saveEditBtn")
      .addEventListener("click", () => this.saveTaskEdit());
    document
      .getElementById("cancelEditBtn")
      .addEventListener("click", () => this.hideTaskEdit());
    document
      .getElementById("editTaskType")
      .addEventListener("change", () => this.toggleEditCooldownOptions());
  }

  // Local storage management
  saveTasks() {
    localStorage.setItem("nowwhat-tasks", JSON.stringify(this.tasks));
    localStorage.setItem("nowwhat-completed", this.completedTasks.toString());
    localStorage.setItem("nowwhat-active", JSON.stringify(this.activeTask));
    localStorage.setItem("nowwhat-nextid", this.nextTaskId.toString());
  }

  loadTasks() {
    const saved = localStorage.getItem("nowwhat-tasks");
    const completedSaved = localStorage.getItem("nowwhat-completed");
    const activeSaved = localStorage.getItem("nowwhat-active");
    const nextIdSaved = localStorage.getItem("nowwhat-nextid");

    if (saved) {
      this.tasks = JSON.parse(saved);
      // Migrate old string tasks to new object format
      this.tasks = this.tasks.map((task) => {
        if (typeof task === "string") {
          return {
            id: this.nextTaskId++,
            text: task,
            type: "oneoff",
            cooldown: "daily",
            executions: [],
            completed: false,
          };
        }
        return task;
      });
    } else {
      // Add some sample tasks for first-time users
      this.tasks = [
        {
          id: this.nextTaskId++,
          text: "Read a book for 30 minutes",
          type: "repeatable",
          cooldown: "daily",
          executions: [],
          completed: false,
        },
        {
          id: this.nextTaskId++,
          text: "Go for a 15-minute walk",
          type: "repeatable",
          cooldown: "daily",
          executions: [],
          completed: false,
        },
        {
          id: this.nextTaskId++,
          text: "Organize your desk",
          type: "repeatable",
          cooldown: "weekly",
          executions: [],
          completed: false,
        },
        {
          id: this.nextTaskId++,
          text: "Call a friend or family member",
          type: "repeatable",
          cooldown: "weekly",
          executions: [],
          completed: false,
        },
        {
          id: this.nextTaskId++,
          text: "Practice a hobby",
          type: "repeatable",
          cooldown: "daily",
          executions: [],
          completed: false,
        },
        {
          id: this.nextTaskId++,
          text: "Do 10 minutes of stretching",
          type: "repeatable",
          cooldown: "daily",
          executions: [],
          completed: false,
        },
        {
          id: this.nextTaskId++,
          text: "Write in a journal",
          type: "repeatable",
          cooldown: "daily",
          executions: [],
          completed: false,
        },
        {
          id: this.nextTaskId++,
          text: "Learn something new online",
          type: "oneoff",
          cooldown: "daily",
          executions: [],
          completed: false,
        },
      ];
      this.saveTasks();
    }

    if (completedSaved) {
      this.completedTasks = parseInt(completedSaved);
    }

    if (activeSaved && activeSaved !== "null") {
      this.activeTask = JSON.parse(activeSaved);
    }

    if (nextIdSaved) {
      this.nextTaskId = Math.max(
        parseInt(nextIdSaved),
        this.getMaxTaskId() + 1,
      );
    }
  }

  getMaxTaskId() {
    return this.tasks.length > 0
      ? Math.max(...this.tasks.map((t) => t.id || 0))
      : 0;
  }

  // Task management methods
  toggleTaskList() {
    this.taskListCollapsed = !this.taskListCollapsed;
    const taskContent = document.getElementById("taskContent");
    const indicator = document.getElementById("collapseIndicator");

    if (this.taskListCollapsed) {
      taskContent.style.display = "none";
      indicator.textContent = "▼";
    } else {
      taskContent.style.display = "block";
      indicator.textContent = "▲";
    }
  }

  showTaskInput() {
    // First expand the task list if collapsed
    if (this.taskListCollapsed) {
      this.toggleTaskList();
    }

    const container = document.getElementById("taskInputContainer");
    const input = document.getElementById("taskInput");

    container.style.display = "block";
    input.focus();
    input.value = "";

    // Reset form
    document.getElementById("taskType").value = "oneoff";
    document.getElementById("cooldownPeriod").value = "daily";
    this.toggleCooldownOptions();
  }

  showTaskEdit(index) {
    // First expand the task list if collapsed
    if (this.taskListCollapsed) {
      this.toggleTaskList();
    }

    const task = this.tasks[index];
    const container = document.getElementById("taskEditContainer");

    // Populate form with task data
    document.getElementById("editTaskInput").value = task.text;
    document.getElementById("editTaskType").value = task.type;
    document.getElementById("editCooldownPeriod").value = task.cooldown;

    // Show/hide cooldown options based on task type
    this.toggleEditCooldownOptions();

    // Store the index being edited
    this.editingTaskIndex = index;

    container.style.display = "block";
    document.getElementById("editTaskInput").focus();
  }

  hideTaskEdit() {
    const container = document.getElementById("taskEditContainer");
    container.style.display = "none";
    this.editingTaskIndex = null;
  }

  hideTaskInput() {
    const container = document.getElementById("taskInputContainer");
    container.style.display = "none";
  }

  toggleCooldownOptions() {
    const taskType = document.getElementById("taskType").value;
    const cooldownContainer = document.getElementById("cooldownContainer");

    if (taskType === "repeatable") {
      cooldownContainer.style.display = "block";
    } else {
      cooldownContainer.style.display = "none";
    }
  }

  toggleEditCooldownOptions() {
    const taskType = document.getElementById("editTaskType").value;
    const cooldownContainer = document.getElementById("editCooldownContainer");

    if (taskType === "repeatable") {
      cooldownContainer.style.display = "block";
    } else {
      cooldownContainer.style.display = "none";
    }
  }

  saveTask() {
    const input = document.getElementById("taskInput");
    const taskText = input.value.trim();
    const taskType = document.getElementById("taskType").value;
    const cooldownPeriod = document.getElementById("cooldownPeriod").value;

    if (!taskText) {
      this.showToast("Please enter a task", "error");
      return;
    }

    if (taskText.length > 200) {
      this.showToast("Task is too long (max 200 characters)", "error");
      return;
    }

    if (this.tasks.some((task) => task.text === taskText)) {
      this.showToast("This task already exists", "error");
      return;
    }

    const newTask = {
      id: this.nextTaskId++,
      text: taskText,
      type: taskType,
      cooldown: cooldownPeriod,
      executions: [],
      completed: false,
    };

    this.tasks.push(newTask);
    this.saveTasks();
    this.updateUI();
    this.updateStats();
    this.hideTaskInput();
    this.showToast("Task added successfully", "success");

    // Enable randomize button if it was disabled
    this.updateRandomizeButton();
  }

  saveTaskEdit() {
    if (this.editingTaskIndex === null) return;

    const input = document.getElementById("editTaskInput");
    const taskText = input.value.trim();
    const taskType = document.getElementById("editTaskType").value;
    const cooldownPeriod = document.getElementById("editCooldownPeriod").value;

    if (!taskText) {
      this.showToast("Please enter a task", "error");
      return;
    }

    if (taskText.length > 200) {
      this.showToast("Task is too long (max 200 characters)", "error");
      return;
    }

    // Check if text already exists in other tasks
    const existingTask = this.tasks.find(
      (task, index) =>
        task.text === taskText && index !== this.editingTaskIndex,
    );
    if (existingTask) {
      this.showToast("This task already exists", "error");
      return;
    }

    // Update the task
    const task = this.tasks[this.editingTaskIndex];
    const oldType = task.type;

    task.text = taskText;
    task.type = taskType;
    task.cooldown = cooldownPeriod;

    // If changing from repeatable to oneoff, reset executions and completed status
    if (oldType === "repeatable" && taskType === "oneoff") {
      task.executions = [];
      task.completed = false;
    }

    // If changing from oneoff to repeatable, ensure proper structure
    if (oldType === "oneoff" && taskType === "repeatable") {
      task.completed = false;
      // Keep executions array as is
    }

    this.saveTasks();
    this.updateUI();
    this.updateStats();
    this.updateRandomizeButton();
    this.hideTaskEdit();
    this.showToast("Task updated successfully", "success");
  }

  deleteTask(index) {
    const task = this.tasks[index];
    this.tasks.splice(index, 1);
    this.saveTasks();
    this.updateUI();
    this.updateStats();
    this.showToast(`"${task.text}" deleted`, "success");

    // Update randomize button state
    this.updateRandomizeButton();

    // If current selected task was deleted, reset randomizer
    if (this.currentSelectedTask && this.currentSelectedTask.id === task.id) {
      this.resetRandomizer();
    }
  }

  // UI update methods
  updateUI() {
    this.renderTasks();
    this.toggleEmptyState();
  }

  renderTasks() {
    const taskList = document.getElementById("taskList");
    taskList.innerHTML = "";

    this.tasks.forEach((task, index) => {
      const taskItem = document.createElement("div");
      const status = this.getTaskStatus(task);
      taskItem.className = `task-item task-${status.type}`;

      let statusIcon = "";
      let statusText = "";

      switch (status.type) {
        case "available":
          statusIcon = "✅";
          statusText = "Available";
          break;
        case "cooldown":
          statusIcon = "⏰";
          statusText = `Cooldown until ${status.availableAt}`;
          break;
        case "completed":
          statusIcon = "🏁";
          statusText = "Completed";
          break;
      }

      const typeIcon = task.type === "repeatable" ? "🔄" : "📝";
      const cooldownText =
        task.type === "repeatable"
          ? ` - ${this.formatCooldown(task.cooldown)}`
          : "";

      taskItem.innerHTML = `
                <div class="task-content">
                    <div class="task-text">${this.escapeHtml(task.text)}</div>
                    <div class="task-meta">
                        <span class="task-type" title="${task.type}">${typeIcon}${cooldownText}</span>
                        <span class="task-status ${status.type}" title="${statusText}">${statusIcon} ${statusText}</span>
                    </div>
                </div>
                <div class="task-actions">
                    <button class="edit-btn" onclick="app.showTaskEdit(${index})" aria-label="Edit task">
                        <img src="img/edit.svg" alt="Edit" width="16" height="16" />
                    </button>
                    <button class="delete-btn" onclick="app.deleteTask(${index})" aria-label="Delete task">
                        <img src="img/trash.svg" alt="Delete" width="16" height="16" />
                    </button>
                </div>
            `;
      taskList.appendChild(taskItem);
    });
  }

  getTaskStatus(task) {
    if (task.type === "oneoff" && task.completed) {
      return { type: "completed" };
    }

    if (task.type === "repeatable" && task.executions.length > 0) {
      const lastExecution = Math.max(
        ...task.executions.map((e) => e.timestamp),
      );
      const cooldownMs = this.getCooldownMs(task.cooldown);
      const nextAvailable = lastExecution + cooldownMs;

      if (Date.now() < nextAvailable) {
        return {
          type: "cooldown",
          availableAt: new Date(nextAvailable).toLocaleString(),
        };
      }
    }

    return { type: "available" };
  }

  getCooldownMs(cooldown) {
    switch (cooldown) {
      case "daily":
        return 24 * 60 * 60 * 1000;
      case "weekly":
        return 7 * 24 * 60 * 60 * 1000;
      case "monthly":
        return 30 * 24 * 60 * 60 * 1000;
      default:
        return parseInt(cooldown) * 60 * 60 * 1000; // custom hours
    }
  }

  formatCooldown(cooldown) {
    switch (cooldown) {
      case "daily":
        return "Daily";
      case "weekly":
        return "Weekly";
      case "monthly":
        return "Monthly";
      default:
        return `${cooldown}h`;
    }
  }

  getAvailableTasks() {
    return this.tasks.filter((task) => {
      const status = this.getTaskStatus(task);
      return status.type === "available";
    });
  }

  toggleEmptyState() {
    const emptyState = document.getElementById("emptyState");
    const taskList = document.getElementById("taskList");

    if (this.tasks.length === 0) {
      emptyState.style.display = "block";
      taskList.style.display = "none";
    } else {
      emptyState.style.display = "none";
      taskList.style.display = "block";
    }
  }

  updateRandomizeButton() {
    const randomizeBtn = document.getElementById("randomizeBtn");
    const availableTasks = this.getAvailableTasks();
    randomizeBtn.disabled = availableTasks.length === 0;

    if (this.tasks.length === 0) {
      randomizeBtn.innerHTML = `
                <img src="img/dice.svg" alt="Dice" width="20" height="20" />
                Add tasks first
            `;
    } else if (availableTasks.length === 0) {
      randomizeBtn.innerHTML = `
                <img src="img/clock.svg" alt="Clock" width="20" height="20" />
                All tasks on cooldown
            `;
    } else {
      randomizeBtn.innerHTML = `
                <img src="img/dice.svg" alt="Dice" width="20" height="20" />
                Pick Random Task (${availableTasks.length})
            `;
    }
  }

  updateStats() {
    document.getElementById("totalTasks").textContent = this.tasks.length;
    document.getElementById("completedTasks").textContent = this.completedTasks;
  }

  // Randomizer methods
  randomizeTask() {
    const availableTasks = this.getAvailableTasks();

    if (availableTasks.length === 0) {
      this.showToast("No tasks available for selection!", "error");
      return;
    }

    // Add a brief loading effect
    const randomizeBtn = document.getElementById("randomizeBtn");
    const randomizeAgainBtn = document.getElementById("randomizeAgainBtn");

    this.setLoadingState(true);

    setTimeout(() => {
      const randomIndex = Math.floor(Math.random() * availableTasks.length);
      this.currentSelectedTask = availableTasks[randomIndex];
      this.showSelectedTask();
      this.setLoadingState(false);
    }, 800); // Brief delay for effect
  }

  showSelectedTask() {
    const randomizerStart = document.getElementById("randomizerStart");
    const currentTask = document.getElementById("currentTask");
    const taskCompleted = document.getElementById("taskCompleted");
    const selectedTaskText = document.getElementById("selectedTaskText");

    randomizerStart.style.display = "none";
    taskCompleted.style.display = "none";
    currentTask.style.display = "block";

    selectedTaskText.textContent = this.currentSelectedTask.text;
  }

  acceptTask() {
    this.activeTask = {
      task: this.currentSelectedTask,
      startTime: Date.now(),
      duration: 8 * 60 * 60 * 1000, // 8 hours in milliseconds
    };
    this.saveTasks();
    this.showActiveTask();
    this.startActiveTaskTimer();
    this.showToast(
      "Task is now active! You have 8 hours to complete it.",
      "success",
    );
  }

  showActiveTask() {
    const randomizerStart = document.getElementById("randomizerStart");
    const currentTask = document.getElementById("currentTask");
    const taskCompleted = document.getElementById("taskCompleted");
    const activeTaskElement = document.getElementById("activeTask");

    randomizerStart.style.display = "none";
    currentTask.style.display = "none";
    taskCompleted.style.display = "none";
    activeTaskElement.style.display = "block";

    const activeTaskText = document.getElementById("activeTaskText");
    activeTaskText.textContent = this.activeTask.task.text;
  }

  showTaskCompleted() {
    const currentTask = document.getElementById("currentTask");
    const taskCompleted = document.getElementById("taskCompleted");
    const activeTaskElement = document.getElementById("activeTask");

    currentTask.style.display = "none";
    activeTaskElement.style.display = "none";
    taskCompleted.style.display = "block";
  }

  nextTask() {
    this.resetRandomizer();
  }

  completeActiveTask() {
    if (this.activeTask) {
      const task = this.tasks.find((t) => t.id === this.activeTask.task.id);

      if (task) {
        // Record execution
        task.executions.push({
          timestamp: Date.now(),
          duration: Date.now() - this.activeTask.startTime,
        });

        // Mark one-off tasks as completed
        if (task.type === "oneoff") {
          task.completed = true;
        }
      }

      this.completedTasks++;
      this.activeTask = null;
      this.clearActiveTaskTimer();
      this.saveTasks();
      this.updateUI();
      this.updateStats();
      this.updateRandomizeButton();
      this.showTaskCompleted();
      this.showToast("Great job! Task completed! 🎉", "success");
    }
  }

  abandonActiveTask() {
    if (this.activeTask) {
      this.activeTask = null;
      this.clearActiveTaskTimer();
      this.saveTasks();
      this.resetRandomizer();
      this.showToast("Task abandoned. You can try another one!", "default");
    }
  }

  resetRandomizer() {
    const randomizerStart = document.getElementById("randomizerStart");
    const currentTask = document.getElementById("currentTask");
    const taskCompleted = document.getElementById("taskCompleted");
    const activeTaskElement = document.getElementById("activeTask");

    currentTask.style.display = "none";
    taskCompleted.style.display = "none";
    activeTaskElement.style.display = "none";
    randomizerStart.style.display = "block";

    this.currentSelectedTask = null;
  }

  checkActiveTask() {
    if (this.activeTask) {
      const now = Date.now();
      const elapsed = now - this.activeTask.startTime;
      const remaining = this.activeTask.duration - elapsed;

      if (remaining <= 0) {
        // Task expired
        this.activeTask = null;
        this.saveTasks();
        this.showToast(
          "Active task expired! Time to try another one.",
          "error",
        );
        this.resetRandomizer();
      } else {
        // Task still active
        this.showActiveTask();
        this.startActiveTaskTimer();
      }
    }
  }

  startActiveTaskTimer() {
    this.clearActiveTaskTimer();
    this.setLoadingState(false);

    this.activeTaskTimer = setInterval(() => {
      if (!this.activeTask) {
        this.clearActiveTaskTimer();
        return;
      }

      const now = Date.now();
      const elapsed = now - this.activeTask.startTime;
      const remaining = this.activeTask.duration - elapsed;

      if (remaining <= 0) {
        this.activeTask = null;
        this.clearActiveTaskTimer();
        this.saveTasks();
        this.showToast("Time's up! Task expired.", "error");
        this.resetRandomizer();
      } else {
        this.updateActiveTaskTimer(remaining);
      }
    }, 1000);
  }

  clearActiveTaskTimer() {
    if (this.activeTaskTimer) {
      clearInterval(this.activeTaskTimer);
      this.activeTaskTimer = null;
    }
  }

  updateActiveTaskTimer(remaining) {
    const hours = Math.floor(remaining / (60 * 60 * 1000));
    const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
    const seconds = Math.floor((remaining % (60 * 1000)) / 1000);

    const timerElement = document.getElementById("activeTaskTimer");
    if (timerElement) {
      timerElement.textContent = `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    }
  }

  setLoadingState(isLoading) {
    const randomizeBtn = document.getElementById("randomizeBtn");
    const randomizeAgainBtn = document.getElementById("randomizeAgainBtn");

    if (isLoading) {
      randomizeBtn.classList.add("loading");
      randomizeAgainBtn.classList.add("loading");
      randomizeBtn.disabled = true;
      randomizeAgainBtn.disabled = true;
    } else {
      randomizeBtn.classList.remove("loading");
      randomizeAgainBtn.classList.remove("loading");
      randomizeBtn.disabled = this.getAvailableTasks().length === 0;
      randomizeAgainBtn.disabled = false;
    }
  }

  // Utility methods
  showToast(message, type = "default") {
    const toast = document.getElementById("toast");
    toast.textContent = message;
    toast.className = `toast ${type}`;

    // Show toast
    toast.classList.add("show");

    // Hide after 3 seconds
    setTimeout(() => {
      toast.classList.remove("show");
    }, 3000);
  }

  escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  // Public method to clear all data (useful for testing/reset)
  clearAllData() {
    if (
      confirm(
        "Are you sure you want to delete all tasks and reset your progress? This cannot be undone.",
      )
    ) {
      localStorage.removeItem("nowwhat-tasks");
      localStorage.removeItem("nowwhat-completed");
      this.tasks = [];
      this.completedTasks = 0;
      this.currentSelectedTask = null;
      this.activeTask = null;
      this.clearActiveTaskTimer();
      this.updateUI();
      this.updateStats();
      this.resetRandomizer();
      this.showToast("All data cleared", "success");
    }
  }
}

// Initialize the app when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  window.app = new TaskRandomizer();
});

// Service Worker registration for PWA capabilities (optional enhancement)
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        console.log("SW registered: ", registration);
      })
      .catch((registrationError) => {
        console.log("SW registration failed: ", registrationError);
      });
  });
}

// Add keyboard shortcuts for better UX
document.addEventListener("keydown", (e) => {
  // ESC to close task input
  if (e.key === "Escape") {
    const container = document.getElementById("taskInputContainer");
    if (container.style.display !== "none") {
      window.app.hideTaskInput();
    }
  }

  // Space bar to randomize (when not typing)
  if (e.code === "Space" && e.target.tagName !== "INPUT") {
    const randomizerStart = document.getElementById("randomizerStart");
    const currentTask = document.getElementById("currentTask");

    if (randomizerStart.style.display !== "none") {
      e.preventDefault();
      window.app.randomizeTask();
    } else if (currentTask.style.display !== "none") {
      e.preventDefault();
      window.app.randomizeTask();
    }
  }
});

// Handle visibility change to save data
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden" && window.app) {
    window.app.saveTasks();
  }
});

// Prevent zoom on double tap for mobile
let lastTouchEnd = 0;
document.addEventListener(
  "touchend",
  (event) => {
    const now = new Date().getTime();
    if (now - lastTouchEnd <= 300) {
      event.preventDefault();
    }
    lastTouchEnd = now;
  },
  false,
);
