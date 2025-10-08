/**
 * RandomizerManager - Task randomization and selection logic
 * Handles weighted random selection, cooldown checking, and task flow
 */
export class RandomizerManager {
  constructor(app) {
    this.app = app;
    this.cooldownCheckInterval = null;
  }

  // ===== RANDOMIZATION LOGIC =====

  getTaskWeight(task) {
    if (!task.deadline) {
      return 1.0; // Normal weight for tasks without deadlines
    }

    const now = Date.now();
    const deadline = task.deadline;
    const daysUntilDeadline = (deadline - now) / (1000 * 60 * 60 * 24);

    if (daysUntilDeadline < 0) {
      // Overdue
      return 20.0;
    } else if (daysUntilDeadline <= 1) {
      // Due today or tomorrow
      return 10.0;
    } else if (daysUntilDeadline <= 2) {
      // Due in 1-2 days
      return 6.0;
    } else if (daysUntilDeadline <= 7) {
      // Due in 3-7 days
      return 3.0;
    } else {
      // Due in >7 days
      return 1.5;
    }
  }

  randomizeTask() {
    // Stop cooldown checking since we're moving to task selection
    this.stopCooldownChecking();

    const availableTasks = this.app.taskManager.getAvailableTasks();

    if (availableTasks.length === 0) {
      this.app.ui.showToast(
        this.app.i18n.t("messages.errors.noTasksAvailable"),
        "error",
      );
      return;
    }

    // Add a brief loading effect
    const randomizeBtn = document.getElementById("randomizeBtn");
    const randomizeAgainBtn = document.getElementById("randomizeAgainBtn");

    this.setLoadingState(true);

    setTimeout(() => {
      let selectedTask;

      // Filter out current task if we have multiple options
      let tasksToChooseFrom = availableTasks;
      if (availableTasks.length >= 2 && this.app.currentSelectedTask) {
        tasksToChooseFrom = availableTasks.filter(
          (task) => task.id !== this.app.currentSelectedTask.id,
        );
      }

      // Calculate weights for each task
      const weights = tasksToChooseFrom.map((task) =>
        this.getTaskWeight(task),
      );
      const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);

      // Weighted random selection
      let random = Math.random() * totalWeight;
      let selectedIndex = 0;

      for (let i = 0; i < weights.length; i++) {
        random -= weights[i];
        if (random <= 0) {
          selectedIndex = i;
          break;
        }
      }

      selectedTask = tasksToChooseFrom[selectedIndex];

      this.app.currentSelectedTask = selectedTask;
      this.showSelectedTask();
      this.setLoadingState(false);
    }, 200); // Quick delay for effect
  }

  showSelectedTask() {
    const randomizerStart = document.getElementById("randomizerStart");
    const currentTask = document.getElementById("currentTask");
    const taskCompleted = document.getElementById("taskCompleted");
    const selectedTaskText = document.getElementById("selectedTaskText");

    randomizerStart.classList.add("hidden");
    taskCompleted.classList.add("hidden");
    currentTask.classList.remove("hidden");

    selectedTaskText.textContent = this.app.currentSelectedTask.text;
  }

  acceptTask() {
    // Stop cooldown checking since we're leaving the initial screen
    this.stopCooldownChecking();

    // Reset notification flags for new task
    this.app.notificationsSent = { halfTime: false, threeQuarterTime: false };

    this.app.activeTask = {
      task: this.app.currentSelectedTask,
      startTime: Date.now(),
      duration: 8 * 60 * 60 * 1000, // 8 hours in milliseconds
    };
    this.app.data.saveActiveTask();
    this.app.ui.refreshUI(); // Update task list to reflect active state
    this.showActiveTask();
    this.app.activeTaskManager.startActiveTaskTimer();
    this.app.ui.showToast(
      "Task is now active! You have 8 hours to complete it.",
      "success",
    );
  }

  showActiveTask() {
    const randomizerStart = document.getElementById("randomizerStart");
    const currentTask = document.getElementById("currentTask");
    const taskCompleted = document.getElementById("taskCompleted");
    const activeTaskElement = document.getElementById("activeTask");

    randomizerStart.classList.add("hidden");
    currentTask.classList.add("hidden");
    taskCompleted.classList.add("hidden");
    activeTaskElement.classList.remove("hidden");

    const activeTaskText = document.getElementById("activeTaskText");
    activeTaskText.textContent = this.app.activeTask.task.text;
  }

  showTaskCompleted() {
    const currentTask = document.getElementById("currentTask");
    const taskCompleted = document.getElementById("taskCompleted");
    const activeTaskElement = document.getElementById("activeTask");

    currentTask.classList.add("hidden");
    activeTaskElement.classList.add("hidden");
    taskCompleted.classList.remove("hidden");
  }

  nextTask() {
    // Go back to initial screen instead of randomizing immediately
    const randomizerStart = document.getElementById("randomizerStart");
    const currentTask = document.getElementById("currentTask");
    const taskCompleted = document.getElementById("taskCompleted");

    taskCompleted.classList.add("hidden");
    currentTask.classList.add("hidden");
    randomizerStart.classList.remove("hidden");

    // Start cooldown checking if needed
    this.app.ui.updateRandomizeButton();
  }

  resetRandomizer() {
    const randomizerStart = document.getElementById("randomizerStart");
    const currentTask = document.getElementById("currentTask");
    const taskCompleted = document.getElementById("taskCompleted");
    const activeTaskElement = document.getElementById("activeTask");

    currentTask.classList.add("hidden");
    taskCompleted.classList.add("hidden");
    activeTaskElement.classList.add("hidden");
    randomizerStart.classList.remove("hidden");

    this.app.currentSelectedTask = null;
  }

  // ===== COOLDOWN MANAGEMENT =====

  startCooldownChecking() {
    // Clear any existing interval first
    this.stopCooldownChecking();

    // Check every 2 minutes (120000ms) for tasks coming off cooldown
    this.cooldownCheckInterval = setInterval(() => {
      const availableTasks = this.app.taskManager.getAvailableTasks();
      if (availableTasks.length > 0) {
        // Tasks are now available, update the UI
        this.app.ui.updateRandomizeButton();
        this.stopCooldownChecking();
      }
    }, 120000);
  }

  stopCooldownChecking() {
    if (this.cooldownCheckInterval) {
      clearInterval(this.cooldownCheckInterval);
      this.cooldownCheckInterval = null;
    }
  }

  // ===== UI HELPERS =====

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
      randomizeBtn.disabled =
        this.app.taskManager.getAvailableTasks().length === 0;
      randomizeAgainBtn.disabled = false;
    }
  }
}
