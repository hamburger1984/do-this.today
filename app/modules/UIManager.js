/**
 * UIManager - UI navigation, state management, and user interactions
 * Handles page navigation, UI updates, toasts, and form interactions
 */
export class UIManager {
  constructor(app) {
    this.app = app;
  }

  // ===== UI REFRESH & UPDATE =====

  refreshUI() {
    this.updateRandomizerSection();
    this.updateTaskListSection();
    this.updateControlButtons();
    this.updateStats();
  }

  updateRandomizerSection() {
    this.updateRandomizerText();
    this.updateRandomizeButton();
  }

  updateTaskListSection() {
    this.updateTaskListCollapse();
    if (!this.app.taskListCollapsed || this.app.currentPage !== "main") {
      this.app.taskManager.renderTasks();
      this.toggleEmptyState();
    }
  }

  updateControlButtons() {
    this.updateDefaultTasksButton();
  }

  updateRandomizerText() {
    const randomizerStart = document.getElementById("randomizerStart");
    const description = randomizerStart.querySelector("p");

    if (this.app.tasks.length === 0) {
      description.textContent = this.app.i18n.t(
        "randomizer.addTasksToGetStarted",
      );
    } else {
      const availableTasks = this.app.taskManager.getAvailableTasks();

      if (availableTasks.length === 0) {
        description.textContent = this.app.i18n.t(
          "randomizer.allTasksCooldownMessage",
        );
      } else if (availableTasks.length === 1) {
        description.textContent = this.app.i18n.t(
          "randomizer.clickSelectOneTask",
        );
      } else {
        description.textContent = this.app.i18n.t(
          "randomizer.clickSelectMultipleTasks",
          { count: availableTasks.length },
        );
      }
    }
  }

  updateRandomizeButton() {
    const randomizeBtn = document.getElementById("randomizeBtn");
    const availableTasks = this.app.taskManager.getAvailableTasks();
    randomizeBtn.disabled = availableTasks.length === 0;

    if (this.app.tasks.length === 0) {
      randomizeBtn.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 24 24">
                  <rect x="3" y="3" width="18" height="18" rx="3" fill="none" stroke="currentColor" stroke-width="2"/>
                  <circle cx="8" cy="8" r="1.3" fill="currentColor"/>
                  <circle cx="16" cy="8" r="1.3" fill="currentColor"/>
                  <circle cx="8" cy="12" r="1.3" fill="currentColor"/>
                  <circle cx="16" cy="12" r="1.3" fill="currentColor"/>
                  <circle cx="8" cy="16" r="1.3" fill="currentColor"/>
                  <circle cx="16" cy="16" r="1.3" fill="currentColor"/>
                </svg>
                ${this.app.i18n.t("randomizer.addTasksFirst")}
            `;
    } else if (availableTasks.length === 0) {
      randomizeBtn.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor" style="margin-right: 8px;">
                  <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                  <path d="M8 3.5a.5.5 0 0 0-1 0V9a.5.5 0 0 0 .252.434l3.5 2a.5.5 0 0 0 .496-.868L8 8.71V3.5z"/>
                </svg>
                ${this.app.i18n.t("randomizer.allTasksOnCooldown")}
            `;
      // Start checking for tasks coming off cooldown
      this.app.randomizer.startCooldownChecking();
    } else {
      randomizeBtn.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 24 24">
                  <rect x="3" y="3" width="18" height="18" rx="3" fill="none" stroke="currentColor" stroke-width="2"/>
                  <circle cx="8" cy="8" r="1.3" fill="currentColor"/>
                  <circle cx="16" cy="8" r="1.3" fill="currentColor"/>
                  <circle cx="8" cy="12" r="1.3" fill="currentColor"/>
                  <circle cx="16" cy="12" r="1.3" fill="currentColor"/>
                  <circle cx="8" cy="16" r="1.3" fill="currentColor"/>
                  <circle cx="16" cy="16" r="1.3" fill="currentColor"/>
                </svg>
                ${this.app.i18n.t("randomizer.rollTheDice")}
            `;
      // Stop cooldown checking since tasks are available
      this.app.randomizer.stopCooldownChecking();
    }
  }

  updateDefaultTasksButton() {
    const addDefaultTasksBtn = document.getElementById("addDefaultTasksBtn");
    if (this.app.tasks.length === 0) {
      addDefaultTasksBtn.classList.remove("hidden");
    } else {
      addDefaultTasksBtn.classList.add("hidden");
    }
  }

  updateTaskListCollapse() {
    // Auto-expand task list when no tasks exist and no saved state exists (first-time user)
    const savedState = localStorage.getItem("dothis-tasklist-collapsed");

    if (
      this.app.tasks.length === 0 &&
      this.app.taskListCollapsed &&
      savedState === null
    ) {
      this.app.taskListCollapsed = false;
      const taskContent = document.getElementById("taskContent");
      const collapseIndicator = document.getElementById(
        "taskCollapseIndicator",
      );

      taskContent.classList.remove("hidden");
      collapseIndicator.textContent = "▲";

      // Save the new state
      this.app.data.saveUIState();
    }
  }

  updateStats() {
    document.getElementById("totalTasks").textContent = this.app.tasks.length;
    document.getElementById("completedTasks").textContent =
      this.app.completedTasks;
  }

  // ===== PAGE NAVIGATION =====

  showMainPage() {
    this.app.currentPage = "main";
    document.getElementById("mainPage").classList.remove("hidden");
    document.getElementById("trashPage").classList.add("hidden");
    this.refreshUI();
  }

  showTrashPage() {
    this.app.currentPage = "trash";
    document.getElementById("mainPage").classList.add("hidden");
    document.getElementById("trashPage").classList.remove("hidden");
    this.app.taskManager.renderTrashList();
  }

  // ===== SECTION COLLAPSE/EXPAND =====

  toggleTaskList() {
    this.app.taskListCollapsed = !this.app.taskListCollapsed;
    const taskContent = document.getElementById("taskContent");
    const collapseIndicator = document.getElementById("taskCollapseIndicator");

    if (this.app.taskListCollapsed) {
      taskContent.classList.add("hidden");
      collapseIndicator.textContent = "▼";
    } else {
      taskContent.classList.remove("hidden");
      collapseIndicator.textContent = "▲";
      this.refreshUI();
    }

    // Save state to localStorage
    this.app.data.saveUIState();
  }

  toggleSettings() {
    this.app.settingsCollapsed = !this.app.settingsCollapsed;
    const settingsContent = document.getElementById("settingsContent");
    const collapseIndicator = document.getElementById(
      "settingsCollapseIndicator",
    );

    if (this.app.settingsCollapsed) {
      settingsContent.classList.add("hidden");
      collapseIndicator.textContent = "▼";
    } else {
      settingsContent.classList.remove("hidden");
      collapseIndicator.textContent = "▲";
    }

    // Save state to localStorage
    this.app.data.saveUIState();
  }

  applySectionStates() {
    // Apply task list collapse state
    const taskContent = document.getElementById("taskContent");
    const taskCollapseIndicator = document.getElementById(
      "taskCollapseIndicator",
    );

    if (this.app.taskListCollapsed) {
      taskContent.classList.add("hidden");
      taskCollapseIndicator.textContent = "▼";
    } else {
      taskContent.classList.remove("hidden");
      taskCollapseIndicator.textContent = "▲";
    }

    // Apply settings collapse state
    const settingsContent = document.getElementById("settingsContent");
    const settingsCollapseIndicator = document.getElementById(
      "settingsCollapseIndicator",
    );

    if (this.app.settingsCollapsed) {
      settingsContent.classList.add("hidden");
      settingsCollapseIndicator.textContent = "▼";
    } else {
      settingsContent.classList.remove("hidden");
      settingsCollapseIndicator.textContent = "▲";
    }
  }

  // ===== TASK EDITING UI =====

  showTaskEdit(index) {
    const task = this.app.tasks[index];
    if (!task) {
      console.error("Task not found at index:", index);
      this.showToast(this.app.i18n.t("messages.errors.taskNotFound"), "error");
      return;
    }

    // Ensure task list is expanded
    if (this.app.taskListCollapsed) {
      this.toggleTaskList();
    }

    // Store the index being edited
    this.app.editingTaskIndex = index;

    // Re-render tasks to show inline edit form
    this.app.taskManager.renderTasks();

    // Auto-focus the edit input after render
    setTimeout(() => {
      const editInput = document.getElementById(`editTaskInput-${index}`);
      if (editInput) {
        editInput.focus();
        editInput.select();
      }
    }, 50);
  }

  hideTaskEdit() {
    this.app.editingTaskIndex = null;
    this.app.taskManager.renderTasks();
  }

  // ===== FORM INTERACTIONS =====

  handleTaskTypeToggle(event) {
    // Find the button element (could be clicked on span child)
    const clickedBtn = event.target.closest(".toggle-btn");
    if (!clickedBtn) return;

    const taskType = clickedBtn.dataset.type;

    // Update hidden input
    document.getElementById("taskType").value = taskType;

    // Update button states
    document.querySelectorAll(".toggle-btn").forEach((btn) => {
      btn.classList.remove("active");
    });
    clickedBtn.classList.add("active");

    // Show/hide cooldown options
    this.toggleCooldownOptions();
  }

  handleEditTaskTypeToggle(event, taskIndex) {
    // Find the button element (could be clicked on span child)
    const clickedBtn = event.target.closest(".toggle-btn");
    if (!clickedBtn) return;

    const taskType = clickedBtn.dataset.type;

    // Update hidden input
    document.getElementById(`editTaskType-${taskIndex}`).value = taskType;

    // Update button states within this specific toggle group
    const toggleGroup = document.getElementById(
      `editTaskTypeToggle-${taskIndex}`,
    );
    toggleGroup.querySelectorAll(".toggle-btn").forEach((btn) => {
      btn.classList.remove("active");
    });
    clickedBtn.classList.add("active");

    // Show/hide cooldown options
    this.toggleEditCooldownOptions(taskIndex);
  }

  toggleCooldownOptions() {
    const taskType = document.getElementById("taskType").value;
    const cooldownSelect = document.getElementById("cooldownPeriod");

    if (taskType === "repeatable") {
      cooldownSelect.disabled = false;
    } else {
      cooldownSelect.disabled = true;
    }
  }

  toggleEditCooldownOptions(taskIndex) {
    const taskType = document.getElementById(`editTaskType-${taskIndex}`).value;
    const cooldownSelect = document.getElementById(
      `editCooldownPeriod-${taskIndex}`,
    );

    if (taskType === "repeatable") {
      cooldownSelect.disabled = false;
    } else {
      cooldownSelect.disabled = true;
    }
  }

  toggleDeadlineInput() {
    const toggleBtn = document.getElementById("deadlineToggleBtn");
    const deadlineInput = document.getElementById("taskDeadline");

    if (deadlineInput.disabled) {
      // Enable deadline input
      deadlineInput.disabled = false;
      toggleBtn.classList.add("active");
      // Set today as default when enabling
      if (!deadlineInput.value) {
        const today = new Date().toISOString().split("T")[0];
        deadlineInput.value = today;
      }
      deadlineInput.focus();
    } else {
      // Disable deadline input
      deadlineInput.disabled = true;
      toggleBtn.classList.remove("active");
      deadlineInput.value = "";
    }
  }

  toggleEditDeadlineInput(index) {
    const toggleBtn = document.getElementById(`editDeadlineToggleBtn-${index}`);
    const deadlineInput = document.getElementById(`editTaskDeadline-${index}`);

    if (deadlineInput.disabled) {
      // Enable deadline input
      deadlineInput.disabled = false;
      toggleBtn.classList.add("active");
      // Set today as default when enabling
      if (!deadlineInput.value) {
        const today = new Date().toISOString().split("T")[0];
        deadlineInput.value = today;
      }
      deadlineInput.focus();
    } else {
      // Disable deadline input
      deadlineInput.disabled = true;
      toggleBtn.classList.remove("active");
      deadlineInput.value = "";
    }
  }

  // ===== EMPTY STATE =====

  toggleEmptyState() {
    const emptyState = document.getElementById("emptyState");
    const taskList = document.getElementById("taskList");

    if (this.app.tasks.length === 0) {
      emptyState.classList.remove("hidden");
      taskList.classList.add("hidden");
    } else {
      emptyState.classList.add("hidden");
      taskList.classList.remove("hidden");
    }
  }

  // ===== TOAST NOTIFICATIONS =====

  showToast(message, type = "default") {
    const toast = document.getElementById("toast");
    toast.textContent = message;
    toast.className = `toast ${type}`;

    // Show toast
    toast.classList.add("show");

    // Hide after 2 seconds
    setTimeout(() => {
      toast.classList.remove("show");
    }, 2000);
  }

  // ===== NOTIFICATIONS =====

  async requestNotificationPermission() {
    if (!("Notification" in window)) {
      console.log("This browser does not support desktop notifications.");
      return;
    }

    if (Notification.permission === "granted") {
      this.app.notificationsGranted = true;
      return;
    }

    if (Notification.permission !== "denied") {
      try {
        const permission = await Notification.requestPermission();
        this.app.notificationsGranted = permission === "granted";
      } catch (error) {
        console.log("Notification permission request failed:", error);
      }
    }
  }

  async sendTaskTimerNotification(title, body) {
    if (!this.app.notificationsGranted) return;

    if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
      // Send through service worker
      navigator.serviceWorker.controller.postMessage({
        type: "TASK_TIMER_NOTIFICATION",
        title: title,
        body: body,
        icon: "/img/icon-192.png",
      });
    } else {
      // Fallback to direct notification
      new Notification(title, {
        body: body,
        icon: "/img/icon-192.png",
        tag: "task-timer",
      });
    }
  }

  async testNotifications() {
    if (!this.app.notificationsGranted) {
      this.showToast(
        this.app.i18n.t("messages.errors.notificationsNotAllowed"),
        "error",
      );
      return;
    }

    // Test 50% notification
    await this.sendTaskTimerNotification(
      "Task Progress: 50% Complete",
      'You\'re halfway through your task: "Sample Task for Testing". 4 hours remaining.',
    );

    // Wait 2 seconds, then test 75% notification
    setTimeout(async () => {
      await this.sendTaskTimerNotification(
        "Task Progress: 75% Complete",
        'You\'re three-quarters done with: "Sample Task for Testing". 2 hours remaining.',
      );
    }, 2000);

    this.showToast(
      this.app.i18n.t("messages.success.testNotificationsSent"),
      "success",
    );
  }

  setupDevelopmentFeatures() {
    // Show test notifications button only on localhost
    if (
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1"
    ) {
      const testNotificationsBtn = document.getElementById(
        "testNotificationsBtn",
      );
      if (testNotificationsBtn) {
        testNotificationsBtn.classList.remove("hidden");
      }
    }
  }
}
