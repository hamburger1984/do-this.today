/*
 * do this - today! - A mobile-first Progressive Web App for task randomization
 * Copyright (c) 2025 Andreas Krohn
 * Licensed under the MIT License. See LICENSE file for details.
 */
class DoThisApp {
  constructor() {
    this.tasks = [];
    this.deletedTasks = [];
    this.completedTasks = 0;
    this.currentSelectedTask = null;
    this.activeTask = null;
    this.cooldownCheckInterval = null;
    this.activeTaskTimer = null;
    this.nextTaskId = 1;
    this.taskListCollapsed = true;
    this.settingsCollapsed = true;
    this.currentPage = "main";
    this.editingTaskIndex = null;
    this.abandonDueToExpiration = false;
    this.init();
  }

  init() {
    try {
      this.loadAllData();
      this.cleanupCompletedOneOffTasks(); // Clean up completed one-off tasks after 24h
      this.bindEvents();
      this.applySectionStates();
      this.refreshUI();
      this.updateTaskListCollapse();
      this.checkActiveTask();

      // Run a quick data integrity check on startup
      this.validateDataIntegrity();
    } catch (error) {
      console.error("Error during app initialization:", error);
    }
  }

  validateDataIntegrity() {
    let hasIssues = false;

    this.tasks.forEach((task, index) => {
      if (!task || typeof task !== "object" || typeof task.text !== "string") {
        hasIssues = true;
        console.warn(`Invalid task detected at index ${index}:`, task);
      }
    });

    if (hasIssues) {
      console.warn(
        "Data integrity issues detected. Consider running app.cleanupCorruptedData() from console.",
      );
    }
  }

  // Event binding
  bindEvents() {
    // Task management

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

    // Task type toggle buttons
    document
      .getElementById("toggleOneoff")
      .addEventListener("click", (e) => this.handleTaskTypeToggle(e));
    document
      .getElementById("toggleRepeatable")
      .addEventListener("click", (e) => this.handleTaskTypeToggle(e));

    // Task editing is now handled inline, no global event listeners needed

    // Task list collapse/expand
    document
      .getElementById("taskListHeader")
      .addEventListener("click", () => this.toggleTaskList());

    // Settings collapse/expand
    document
      .getElementById("settingsHeader")
      .addEventListener("click", () => this.toggleSettings());

    // Settings actions
    document
      .getElementById("addDefaultTasksBtn")
      .addEventListener("click", () => this.addDefaultTasks());
    document
      .getElementById("exportDataBtn")
      .addEventListener("click", () => this.exportTasksAsJson());
    document
      .getElementById("resetAllBtn")
      .addEventListener("click", () => this.resetEverything());
    document
      .getElementById("debugDataBtn")
      .addEventListener("click", () => this.debugDataConsole());
    document
      .getElementById("cleanupDataBtn")
      .addEventListener("click", () => this.cleanupCorruptedData());

    // Navigation
    document
      .getElementById("trashBtn")
      .addEventListener("click", () => this.showTrashPage());
    document
      .getElementById("backToMainBtn")
      .addEventListener("click", () => this.showMainPage());

    // Trash actions
    document
      .getElementById("clearAllTrashBtn")
      .addEventListener("click", () => this.clearAllTrash());

    // Abandon reason modal
    document
      .getElementById("saveAbandonReasonBtn")
      .addEventListener("click", () => this.saveAbandonReason());
    document
      .getElementById("cancelAbandonReasonBtn")
      .addEventListener("click", () => this.hideAbandonReasonModal());

    // Abandon reason keyboard support
    document
      .getElementById("abandonReasonInput")
      .addEventListener("keydown", (e) => {
        if (e.key === "Enter" && e.ctrlKey) {
          this.saveAbandonReason();
        } else if (e.key === "Escape") {
          this.hideAbandonReasonModal();
        }
      });
  }

  // ===== LOCAL STORAGE MANAGEMENT =====
  // Fine-grained localStorage operations for better control and performance

  // Task data operations
  saveTaskData() {
    localStorage.setItem("dothis-tasks", JSON.stringify(this.tasks));
  }

  saveDeletedTasks() {
    localStorage.setItem("dothis-deleted", JSON.stringify(this.deletedTasks));
  }

  saveActiveTask() {
    localStorage.setItem("dothis-active", JSON.stringify(this.activeTask));
  }

  // Statistics and counters
  saveStatistics() {
    localStorage.setItem("dothis-completed", this.completedTasks.toString());
    localStorage.setItem("dothis-nextid", this.nextTaskId.toString());
  }

  // UI state persistence
  saveUIState() {
    localStorage.setItem(
      "dothis-tasklist-collapsed",
      this.taskListCollapsed.toString(),
    );
    localStorage.setItem(
      "dothis-settings-collapsed",
      this.settingsCollapsed.toString(),
    );
  }

  // Complete data persistence (calls all save methods)
  saveAllData() {
    this.saveTaskData();
    this.saveDeletedTasks();
    this.saveActiveTask();
    this.saveStatistics();
    this.saveUIState();
  }

  getMaxTaskId() {
    let maxId = 0;

    // Check tasks array
    if (this.tasks && this.tasks.length > 0) {
      const taskMaxId = Math.max(...this.tasks.map((t) => t.id || 0));
      maxId = Math.max(maxId, taskMaxId);
    }

    // Check deleted tasks array
    if (this.deletedTasks && this.deletedTasks.length > 0) {
      const deletedMaxId = Math.max(...this.deletedTasks.map((t) => t.id || 0));
      maxId = Math.max(maxId, deletedMaxId);
    }

    return maxId;
  }

  // Task data loading with validation and migration
  loadTaskData() {
    const saved = localStorage.getItem("dothis-tasks");
    if (saved) {
      try {
        this.tasks = JSON.parse(saved);
        // Migrate and validate task objects
        this.tasks = this.tasks.map((task, index) => {
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
          // Validate and fix corrupted task objects
          if (!task || typeof task !== "object") {
            console.warn(`Invalid task at index ${index}:`, task);
            return {
              id: this.nextTaskId++,
              text: "Corrupted task (please edit)",
              type: "oneoff",
              cooldown: "daily",
              executions: [],
              completed: false,
            };
          }
          // Ensure all required properties exist and are valid
          const validTask = {
            id: task.id || this.nextTaskId++,
            text:
              typeof task.text === "string"
                ? task.text
                : String(task.text || "Corrupted task (please edit)"),
            type:
              task.type === "repeatable" || task.type === "oneoff"
                ? task.type
                : "oneoff",
            cooldown: task.cooldown || "daily",
            executions: Array.isArray(task.executions) ? task.executions : [],
            completed: Boolean(task.completed),
            createdAt: task.createdAt || Date.now(),
          };
          return validTask;
        });
        // Filter out any null/undefined tasks
        this.tasks = this.tasks.filter((task) => task && task.text);
      } catch (error) {
        console.error("Error loading tasks from localStorage:", error);
        this.tasks = [];
        localStorage.removeItem("dothis-tasks");
      }
    } else {
      this.tasks = [];
    }
  }

  loadDeletedTasks() {
    const deletedSaved = localStorage.getItem("dothis-deleted");
    if (deletedSaved) {
      try {
        this.deletedTasks = JSON.parse(deletedSaved).map((task, index) => {
          if (typeof task === "string") {
            return {
              id: this.nextTaskId++,
              text: task,
              type: "oneoff",
              cooldown: "daily",
              executions: [],
              completed: false,
              deletedAt: Date.now(),
            };
          }
          // Validate deleted task objects
          if (!task || typeof task !== "object") {
            console.warn(`Invalid deleted task at index ${index}:`, task);
            return {
              id: this.nextTaskId++,
              text: "Corrupted deleted task",
              type: "oneoff",
              cooldown: "daily",
              executions: [],
              completed: false,
              deletedAt: Date.now(),
            };
          }
          const validTask = {
            id: task.id || this.nextTaskId++,
            text:
              typeof task.text === "string"
                ? task.text
                : String(task.text || "Corrupted deleted task"),
            type:
              task.type === "repeatable" || task.type === "oneoff"
                ? task.type
                : "oneoff",
            cooldown: task.cooldown || "daily",
            executions: Array.isArray(task.executions) ? task.executions : [],
            completed: Boolean(task.completed),
            deletedAt: task.deletedAt || Date.now(),
          };
          return validTask;
        });
        // Filter out any null/undefined tasks
        this.deletedTasks = this.deletedTasks.filter(
          (task) => task && task.text,
        );
      } catch (error) {
        console.error("Error loading deleted tasks from localStorage:", error);
        this.deletedTasks = [];
        localStorage.removeItem("dothis-deleted");
      }
    } else {
      this.deletedTasks = [];
    }
  }

  loadActiveTask() {
    const activeSaved = localStorage.getItem("dothis-active");
    if (activeSaved && activeSaved !== "null") {
      try {
        this.activeTask = JSON.parse(activeSaved);
      } catch (error) {
        console.error("Error loading active task:", error);
        this.activeTask = null;
        localStorage.removeItem("dothis-active");
      }
    } else {
      this.activeTask = null;
    }
  }

  loadStatistics() {
    const completedSaved = localStorage.getItem("dothis-completed");
    const nextIdSaved = localStorage.getItem("dothis-nextid");

    if (completedSaved) {
      this.completedTasks = parseInt(completedSaved) || 0;
    }

    if (nextIdSaved) {
      this.nextTaskId = Math.max(
        parseInt(nextIdSaved) || 1,
        this.getMaxTaskId() + 1,
      );
    }
  }

  loadUIState() {
    const taskListCollapsedSaved = localStorage.getItem(
      "dothis-tasklist-collapsed",
    );
    const settingsCollapsedSaved = localStorage.getItem(
      "dothis-settings-collapsed",
    );

    if (taskListCollapsedSaved !== null) {
      this.taskListCollapsed = taskListCollapsedSaved === "true";
    }

    if (settingsCollapsedSaved !== null) {
      this.settingsCollapsed = settingsCollapsedSaved === "true";
    }
  }

  // Complete data loading (calls all load methods)
  loadAllData() {
    this.loadTaskData();
    this.loadDeletedTasks();
    this.loadActiveTask();
    this.loadStatistics();
    this.loadUIState();
  }

  getMaxTaskId() {
    return this.tasks.length > 0
      ? Math.max(...this.tasks.map((t) => t.id || 0))
      : 0;
  }

  // Navigation methods
  showMainPage() {
    this.currentPage = "main";
    document.getElementById("mainPage").style.display = "block";
    document.getElementById("trashPage").style.display = "none";
    this.refreshUI();
  }

  showTrashPage() {
    this.currentPage = "trash";
    document.getElementById("mainPage").style.display = "none";
    document.getElementById("trashPage").style.display = "block";
    this.renderTrashList();
  }

  toggleTaskList() {
    this.taskListCollapsed = !this.taskListCollapsed;
    const taskContent = document.getElementById("taskContent");
    const collapseIndicator = document.getElementById("taskCollapseIndicator");

    if (this.taskListCollapsed) {
      taskContent.style.display = "none";
      collapseIndicator.textContent = "▼";
    } else {
      taskContent.style.display = "block";
      collapseIndicator.textContent = "▲";
      this.refreshUI();
    }

    // Save state to localStorage
    this.saveUIState();
  }

  toggleSettings() {
    this.settingsCollapsed = !this.settingsCollapsed;
    const settingsContent = document.getElementById("settingsContent");
    const collapseIndicator = document.getElementById(
      "settingsCollapseIndicator",
    );

    if (this.settingsCollapsed) {
      settingsContent.style.display = "none";
      collapseIndicator.textContent = "▼";
    } else {
      settingsContent.style.display = "block";
      collapseIndicator.textContent = "▲";
    }

    // Save state to localStorage
    this.saveUIState();
  }

  applySectionStates() {
    // Apply task list collapse state
    const taskContent = document.getElementById("taskContent");
    const taskCollapseIndicator = document.getElementById(
      "taskCollapseIndicator",
    );

    if (this.taskListCollapsed) {
      taskContent.style.display = "none";
      taskCollapseIndicator.textContent = "▼";
    } else {
      taskContent.style.display = "block";
      taskCollapseIndicator.textContent = "▲";
    }

    // Apply settings collapse state
    const settingsContent = document.getElementById("settingsContent");
    const settingsCollapseIndicator = document.getElementById(
      "settingsCollapseIndicator",
    );

    if (this.settingsCollapsed) {
      settingsContent.style.display = "none";
      settingsCollapseIndicator.textContent = "▼";
    } else {
      settingsContent.style.display = "block";
      settingsCollapseIndicator.textContent = "▲";
    }
  }

  showTaskEdit(index) {
    const task = this.tasks[index];
    if (!task) {
      console.error("Task not found at index:", index);
      this.showToast("Error: Task not found", "error");
      return;
    }

    // Ensure task list is expanded
    if (this.taskListCollapsed) {
      this.toggleTaskList();
    }

    // Store the index being edited
    this.editingTaskIndex = index;

    // Re-render tasks to show inline edit form
    this.renderTasks();

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
    this.editingTaskIndex = null;
    this.renderTasks();
  }

  handleTaskTypeToggle(event) {
    const clickedBtn = event.target;
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
    const clickedBtn = event.target;
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
    const cooldownContainer = document.getElementById("cooldownContainer");

    if (taskType === "repeatable") {
      cooldownContainer.style.display = "block";
    } else {
      cooldownContainer.style.display = "none";
    }
  }

  toggleEditCooldownOptions(taskIndex) {
    const taskType = document.getElementById(`editTaskType-${taskIndex}`).value;
    const cooldownContainer = document.getElementById(
      `editCooldownContainer-${taskIndex}`,
    );

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
      createdAt: Date.now(),
    };

    this.tasks.push(newTask);
    this.saveAllData();
    this.refreshUI();
    this.updateStats();
    this.updateRandomizeButton();

    // Clear the main page form
    document.getElementById("taskInput").value = "";
    document.getElementById("taskType").value = "oneoff";
    document.getElementById("cooldownPeriod").value = "daily";

    // Reset toggle buttons
    document.querySelectorAll(".toggle-btn").forEach((btn) => {
      btn.classList.remove("active");
    });
    document.getElementById("toggleOneoff").classList.add("active");

    this.toggleCooldownOptions();

    this.showToast("Task added successfully", "success");
  }

  saveTaskEdit() {
    if (this.editingTaskIndex === null) {
      console.warn("No task being edited");
      return;
    }

    const input = document.getElementById(
      `editTaskInput-${this.editingTaskIndex}`,
    );
    const taskTypeSelect = document.getElementById(
      `editTaskType-${this.editingTaskIndex}`,
    );
    const cooldownSelect = document.getElementById(
      `editCooldownPeriod-${this.editingTaskIndex}`,
    );

    if (!input || !taskTypeSelect || !cooldownSelect) {
      console.error("Edit form elements not found");
      this.showToast("Error: Edit form not available", "error");
      return;
    }

    const taskText = input.value.trim();
    const taskType = taskTypeSelect.value;
    const cooldownPeriod = cooldownSelect.value;

    // Validate task index
    if (
      this.editingTaskIndex < 0 ||
      this.editingTaskIndex >= this.tasks.length
    ) {
      console.error("Invalid editing task index:", this.editingTaskIndex);
      this.showToast("Error: Invalid task to edit", "error");
      this.hideTaskEdit();
      return;
    }

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

    // If changing from repeatable to oneoff or vice versa, reset completed status
    if (
      (oldType === "repeatable" && taskType === "oneoff") ||
      (oldType === "oneoff" && taskType === "repeatable")
    ) {
      task.completed = false;
    }

    this.saveTaskData();
    this.refreshUI();
    this.updateStats();
    this.updateRandomizeButton();
    this.hideTaskEdit();
    this.showToast("Task updated successfully", "success");
  }

  deleteTask(index) {
    const task = this.tasks[index];
    task.deletedAt = Date.now();
    this.deletedTasks.push(task);
    this.tasks.splice(index, 1);
    this.saveAllData();
    this.refreshUI();
    this.updateStats();
    this.showToast(`"${task.text}" moved to trash`, "success");

    // Update randomize button state
    this.updateRandomizeButton();
    this.updateDefaultTasksButton();

    // If current selected task was deleted, reset randomizer
    if (this.currentSelectedTask && this.currentSelectedTask.id === task.id) {
      this.resetRandomizer();
    }
  }

  // UI update methods
  // ===== UI SYNCHRONIZATION METHODS =====
  /*
   * UI Update Organization:
   *
   * 1. MAIN ORCHESTRATOR:
   *    - refreshUI() - Call this after any data changes
   *
   * 2. SECTION UPDATES:
   *    - updateRandomizerSection() - Updates randomizer text and button
   *    - updateTaskListSection() - Updates task list display and expansion
   *    - updateControlButtons() - Updates control buttons (sample tasks, etc.)
   *
   * 3. COMPONENT-SPECIFIC UPDATES:
   *    - updateRandomizeButton() - Enables/disables randomize button, updates text
   *    - updateRandomizerText() - Updates encouraging text in randomizer
   *    - updateTaskListCollapse() - Manages auto-expansion for empty states
   *    - updateDefaultTasksButton() - Shows/hides "Add Sample Tasks" button
   *    - updateStats() - Updates task count and completion statistics
   *
   * 4. STATE VALIDATION:
   *    - checkActiveTask() - Validates and handles active task timer expiration
   */

  // Main UI refresh - call this after any data changes
  refreshUI() {
    this.updateRandomizerSection();
    this.updateTaskListSection();
    this.updateControlButtons();
    this.updateStats();
  }

  // Updates the randomizer section text and behavior
  updateRandomizerSection() {
    this.updateRandomizerText();
    this.updateRandomizeButton();
  }

  // Updates task list display and expansion state
  updateTaskListSection() {
    this.updateTaskListCollapse();
    if (!this.taskListCollapsed || this.currentPage !== "main") {
      this.renderTasks();
      this.toggleEmptyState();
    }
  }

  // Updates control buttons (sample tasks, etc.)
  updateControlButtons() {
    this.updateDefaultTasksButton();
  }

  renderTasks() {
    const taskList = document.getElementById("taskList");
    taskList.innerHTML = "";

    this.tasks.forEach((task, index) => {
      // Debug logging for problematic tasks
      if (!task || typeof task !== "object" || typeof task.text !== "string") {
        console.warn(`Problematic task at index ${index}:`, task);
      }

      // Skip invalid tasks
      if (!task || !task.text) {
        console.warn(`Skipping invalid task at index ${index}:`, task);
        return;
      }

      const taskItem = document.createElement("div");
      const status = this.getTaskStatus(task);
      taskItem.className = `task-item task-${status.type}`;

      let statusIcon = "";
      let statusText = "";

      switch (status.type) {
        case "available":
          statusIcon =
            '<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" style="vertical-align: text-top; margin-right: 4px;"><path d="M13.854 4.146a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.793l6.646-6.647a.5.5 0 0 1 .708 0z"/></svg>';
          statusText = "Available";
          break;
        case "cooldown":
          statusIcon =
            '<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" style="vertical-align: text-top; margin-right: 4px;"><path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/><path d="M8 3.5a.5.5 0 0 0-1 0V9a.5.5 0 0 0 .252.434l3.5 2a.5.5 0 0 0 .496-.868L8 8.71V3.5z"/></svg>';
          statusText = `Cooldown until ${status.availableAt}`;
          break;
        case "completed":
          statusIcon =
            '<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" style="vertical-align: text-top; margin-right: 4px;"><rect x="1" y="0" width="1" height="16"/><rect x="2" y="2" width="2" height="2"/><rect x="6" y="2" width="2" height="2"/><rect x="10" y="2" width="2" height="2"/><rect x="14" y="2" width="1" height="2"/><rect x="4" y="4" width="2" height="2"/><rect x="8" y="4" width="2" height="2"/><rect x="12" y="4" width="2" height="2"/><rect x="2" y="6" width="2" height="2"/><rect x="6" y="6" width="2" height="2"/><rect x="10" y="6" width="2" height="2"/><rect x="14" y="6" width="1" height="2"/><rect x="4" y="8" width="2" height="2"/><rect x="8" y="8" width="2" height="2"/><rect x="12" y="8" width="2" height="2"/><path d="M2 2h13v8H2V2z" stroke="currentColor" stroke-width="0.5" fill="none"/></svg>';
          statusText = "Completed";
          break;
      }

      const typeDisplay =
        task.type === "repeatable"
          ? `<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" style="vertical-align: text-top; margin-right: 4px;"><path d="M11.534 7h3.932a.25.25 0 0 1 .192.41l-1.966 2.36a.25.25 0 0 1-.384 0l-1.966-2.36a.25.25 0 0 1 .192-.41zm-11 2h3.932a.25.25 0 0 0 .192-.41L2.692 6.23a.25.25 0 0 0-.384 0L.342 8.59A.25.25 0 0 0 .534 9z"/><path fill-rule="evenodd" d="M8 3c-1.552 0-2.94.707-3.857 1.818a.5.5 0 1 1-.771-.636A6.002 6.002 0 0 1 13.917 7H12.9A5.002 5.002 0 0 0 8 3zM3.1 9a5.002 5.002 0 0 0 8.757 2.182.5.5 0 1 1 .771.636A6.002 6.002 0 0 1 2.083 9H3.1z"/></svg> ${this.formatCooldown(task.cooldown)}`
          : "";

      // Calculate execution statistics
      const execStats = this.getExecutionStats(task);
      const execStatsHtml = execStats.html;

      // Check if this task is being edited
      if (this.editingTaskIndex === index) {
        taskItem.innerHTML = `
          <div class="task-edit-form">
            <div class="edit-input-group">
              <input
                type="text"
                id="editTaskInput-${index}"
                value="${this.escapeHtml(task.text)}"
                placeholder="Edit task..."
                maxlength="200"
                class="edit-task-input"
              />
              <div class="edit-task-options">
                <div class="edit-option-group">
                  <label>Task Type:</label>
                  <div class="task-type-toggle" id="editTaskTypeToggle-${index}">
                    <button
                      type="button"
                      class="toggle-btn ${task.type === "oneoff" ? "active" : ""}"
                      data-type="oneoff"
                      onclick="app.handleEditTaskTypeToggle(event, ${index})"
                    >
                      One-time
                    </button>
                    <button
                      type="button"
                      class="toggle-btn ${task.type === "repeatable" ? "active" : ""}"
                      data-type="repeatable"
                      onclick="app.handleEditTaskTypeToggle(event, ${index})"
                    >
                      Repeatable
                    </button>
                  </div>
                  <input type="hidden" id="editTaskType-${index}" value="${task.type}" />
                </div>
                <div class="edit-option-group" id="editCooldownContainer-${index}" style="${task.type === "repeatable" ? "display: block" : "display: none"}">
                  <label for="editCooldownPeriod-${index}">Cooldown:</label>
                  <select id="editCooldownPeriod-${index}">
                    <option value="0" ${task.cooldown === "0" ? "selected" : ""}>No cooldown</option>
                    <option value="1" ${task.cooldown === "1" ? "selected" : ""}>1 hour</option>
                    <option value="3" ${task.cooldown === "3" ? "selected" : ""}>3 hours</option>
                    <option value="6" ${task.cooldown === "6" ? "selected" : ""}>6 hours</option>
                    <option value="12" ${task.cooldown === "12" ? "selected" : ""}>12 hours</option>
                    <option value="daily" ${task.cooldown === "daily" ? "selected" : ""}>Daily (24h)</option>
                    <option value="weekly" ${task.cooldown === "weekly" ? "selected" : ""}>Weekly (7 days)</option>
                    <option value="monthly" ${task.cooldown === "monthly" ? "selected" : ""}>Monthly (30 days)</option>
                  </select>
                </div>
              </div>
              <div class="edit-actions">
                <button class="btn-secondary edit-cancel" onclick="app.hideTaskEdit()">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                  Cancel
                </button>
                <button class="btn-primary edit-save" onclick="app.saveTaskEdit()">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  Save
                </button>
              </div>
            </div>
          </div>
        `;
      } else {
        taskItem.innerHTML = `
          <div class="task-content">
              <div class="task-text">${this.escapeHtml(task.text)}</div>
              <div class="task-meta">
                  ${typeDisplay ? `<span class="task-stat task-type ${task.type}" title="${this.escapeHtml(task.type)}">${typeDisplay}</span>` : ""}
                  <span class="task-stat task-status ${status.type}" title="${this.escapeHtml(statusText)}">${statusIcon} ${statusText}</span>
                  ${execStatsHtml}
              </div>
          </div>
          <div class="task-actions">
              <button class="edit-btn${this.isTaskActive(task) ? " disabled" : ""}"
                      ${this.isTaskActive(task) ? 'disabled title="Cannot edit active task"' : `onclick="app.showTaskEdit(${index})"`}
                      aria-label="Edit task">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="m18 2 4 4-14 14H4v-4L18 2z"></path>
                    <path d="m14.5 5.5 4 4"></path>
                  </svg>
              </button>
              <button class="delete-btn${this.isTaskActive(task) ? " disabled" : ""}"
                      ${this.isTaskActive(task) ? 'disabled title="Cannot delete active task"' : `onclick="app.deleteTask(${index})"`}
                      aria-label="Delete task">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path>
                    <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  </svg>
              </button>
          </div>
        `;
      }

      taskList.appendChild(taskItem);
    });
  }

  getTaskStatus(task) {
    if (task.type === "oneoff" && task.completed) {
      return { type: "completed" };
    }

    if (task.type === "repeatable" && task.executions.length > 0) {
      // Only consider successful (non-abandoned) executions for cooldown
      const successfulExecutions = task.executions.filter((e) => !e.abandoned);

      if (successfulExecutions.length > 0) {
        const lastSuccessfulExecution = Math.max(
          ...successfulExecutions.map((e) => e.timestamp),
        );

        // Zero cooldown means always available
        if (task.cooldown === "0") {
          return { type: "available" };
        }

        const nextAvailable = this.calculateNextAvailableTime(
          lastSuccessfulExecution,
          task.cooldown,
        );

        if (Date.now() < nextAvailable) {
          return {
            type: "cooldown",
            availableAt: this.formatCooldownTime(nextAvailable),
          };
        }
      }
    }

    return { type: "available" };
  }

  getExecutionStats(task) {
    if (!task.executions || task.executions.length === 0) {
      return {
        successful: 0,
        abandoned: 0,
        lastSuccessful: null,
        html: "",
      };
    }

    const successful = task.executions.filter((exec) => !exec.abandoned);
    const abandoned = task.executions.filter((exec) => exec.abandoned);
    const lastSuccessful =
      successful.length > 0
        ? Math.max(...successful.map((exec) => exec.timestamp))
        : null;

    let statsHtml = "";

    if (successful.length > 0) {
      statsHtml += `<span class="task-stat success" title="Successful completions"><svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" style="vertical-align: text-top; margin-right: 4px;"><path d="M13.854 4.146a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.793l6.646-6.647a.5.5 0 0 1 .708 0z"/></svg>${successful.length}</span>`;
    }

    if (abandoned.length > 0) {
      statsHtml += `<span class="task-stat abandoned" title="Abandoned attempts"><svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" style="vertical-align: text-top; margin-right: 4px;"><path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/></svg>${abandoned.length}</span>`;
    }

    if (lastSuccessful) {
      const lastDate = new Date(lastSuccessful);
      const timeAgo = this.getTimeAgo(lastSuccessful);
      statsHtml += `<span class="task-stat last-completed" title="Last completed: ${lastDate.toLocaleString()}"><svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" style="vertical-align: text-top; margin-right: 4px;"><path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/><path d="M8 3.5a.5.5 0 0 0-1 0V9a.5.5 0 0 0 .252.434l3.5 2a.5.5 0 0 0 .496-.868L8 8.71V3.5z"/></svg>${timeAgo}</span>`;
    }

    return {
      successful: successful.length,
      abandoned: abandoned.length,
      lastSuccessful,
      html: statsHtml,
    };
  }

  getTimeAgo(timestamp) {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return "just now";
  }

  getCooldownMs(cooldown) {
    switch (cooldown) {
      case "0":
        return 0;
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

  calculateNextAvailableTime(lastExecutionTimestamp, cooldown) {
    const lastExecution = new Date(lastExecutionTimestamp);

    switch (cooldown) {
      case "daily":
        // Next midnight after the last execution
        const nextDay = new Date(lastExecution);
        nextDay.setDate(nextDay.getDate() + 1);
        nextDay.setHours(0, 0, 0, 0);
        return nextDay.getTime();

      case "weekly":
        // Next Monday at midnight after the last execution
        const nextWeek = new Date(lastExecution);
        const currentDayOfWeek = nextWeek.getDay();

        // Calculate days until next Monday (1 = Monday)
        let daysUntilMonday = (1 - currentDayOfWeek + 7) % 7;
        if (daysUntilMonday === 0) {
          daysUntilMonday = 7; // If it's already Monday, go to next Monday
        }

        nextWeek.setDate(nextWeek.getDate() + daysUntilMonday);
        nextWeek.setHours(0, 0, 0, 0);
        return nextWeek.getTime();

      case "monthly":
        // Next 1st of month at midnight after the last execution
        const nextMonth = new Date(lastExecution);
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        nextMonth.setDate(1);
        nextMonth.setHours(0, 0, 0, 0);
        return nextMonth.getTime();

      default:
        // For hour-based cooldowns, use the old behavior
        const cooldownMs = this.getCooldownMs(cooldown);
        return lastExecutionTimestamp + cooldownMs;
    }
  }

  formatCooldown(cooldown) {
    switch (cooldown) {
      case "0":
        return "No cooldown";
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

  formatCooldownTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();

    // Check if the time is midnight (00:00:00)
    const isMidnight =
      date.getHours() === 0 &&
      date.getMinutes() === 0 &&
      date.getSeconds() === 0;

    // Check if the date is today
    const isToday = date.toDateString() === now.toDateString();

    if (isMidnight && !isToday) {
      // Show just the date when it's midnight and not today
      return date.toLocaleDateString();
    } else if (isToday && !isMidnight) {
      // Show just the time when it's today but not midnight
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else {
      // Default: show both date and time
      return date.toLocaleString();
    }
  }

  getAvailableTasks() {
    return this.tasks.filter((task) => {
      const status = this.getTaskStatus(task);
      return status.type === "available";
    });
  }

  isTaskActive(task) {
    return this.activeTask && this.activeTask.task.id === task.id;
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

  // ===== COMPONENT-SPECIFIC UPDATE METHODS =====
  updateRandomizeButton() {
    const randomizeBtn = document.getElementById("randomizeBtn");
    const availableTasks = this.getAvailableTasks();
    randomizeBtn.disabled = availableTasks.length === 0;

    if (this.tasks.length === 0) {
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
                Add tasks first
            `;
    } else if (availableTasks.length === 0) {
      randomizeBtn.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor" style="margin-right: 8px;">
                  <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                  <path d="M8 3.5a.5.5 0 0 0-1 0V9a.5.5 0 0 0 .252.434l3.5 2a.5.5 0 0 0 .496-.868L8 8.71V3.5z"/>
                </svg>
                All tasks on cooldown
            `;
      // Start checking for tasks coming off cooldown
      this.startCooldownChecking();
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
                Roll the dice
            `;
      // Stop cooldown checking since tasks are available
      this.stopCooldownChecking();
    }
  }

  // Shows/hides "Add Sample Tasks" button based on task count
  updateDefaultTasksButton() {
    const addDefaultTasksBtn = document.getElementById("addDefaultTasksBtn");
    if (this.tasks.length === 0) {
      addDefaultTasksBtn.style.display = "inline-flex";
    } else {
      addDefaultTasksBtn.style.display = "none";
    }
  }

  // Updates encouraging text in randomizer section based on task availability
  updateRandomizerText() {
    const randomizerStart = document.getElementById("randomizerStart");
    const description = randomizerStart.querySelector("p");

    if (this.tasks.length === 0) {
      description.textContent =
        "Add some tasks below to get started with randomization";
    } else {
      const availableTasks = this.getAvailableTasks();

      if (availableTasks.length === 0) {
        description.textContent =
          "All tasks are currently on cooldown. Check back later!";
      } else if (availableTasks.length === 1) {
        description.textContent = "Click to select the 1 available task";
      } else {
        description.textContent = `Click to randomly select from ${availableTasks.length} available tasks`;
      }
    }
  }

  // Manages task list auto-expansion logic for empty states
  updateTaskListCollapse() {
    // Auto-expand task list when no tasks exist and no saved state exists (first-time user)
    const savedState = localStorage.getItem("dothis-tasklist-collapsed");

    if (
      this.tasks.length === 0 &&
      this.taskListCollapsed &&
      savedState === null
    ) {
      this.taskListCollapsed = false;
      const taskContent = document.getElementById("taskContent");
      const collapseIndicator = document.getElementById(
        "taskCollapseIndicator",
      );

      taskContent.style.display = "block";
      collapseIndicator.textContent = "▲";

      // Save the new state
      this.saveUIState();
    }
  }

  // Updates statistics display (task counts, completion stats)
  updateStats() {
    document.getElementById("totalTasks").textContent = this.tasks.length;
    document.getElementById("completedTasks").textContent = this.completedTasks;
  }

  // Randomizer methods
  randomizeTask() {
    // Stop cooldown checking since we're moving to task selection
    this.stopCooldownChecking();

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
      let selectedTask;

      // If there are at least 2 tasks and we have a current selection, avoid repeating it
      if (availableTasks.length >= 2 && this.currentSelectedTask) {
        const filteredTasks = availableTasks.filter(
          (task) => task.id !== this.currentSelectedTask.id,
        );
        const randomIndex = Math.floor(Math.random() * filteredTasks.length);
        selectedTask = filteredTasks[randomIndex];
      } else {
        const randomIndex = Math.floor(Math.random() * availableTasks.length);
        selectedTask = availableTasks[randomIndex];
      }

      this.currentSelectedTask = selectedTask;
      this.showSelectedTask();
      this.setLoadingState(false);
    }, 200); // Quick delay for effect
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
    // Stop cooldown checking since we're leaving the initial screen
    this.stopCooldownChecking();

    this.activeTask = {
      task: this.currentSelectedTask,
      startTime: Date.now(),
      duration: 8 * 60 * 60 * 1000, // 8 hours in milliseconds
    };
    this.saveActiveTask();
    this.refreshUI(); // Update task list to reflect active state
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
    // Go back to initial screen instead of randomizing immediately
    const randomizerStart = document.getElementById("randomizerStart");
    const currentTask = document.getElementById("currentTask");
    const taskCompleted = document.getElementById("taskCompleted");

    taskCompleted.style.display = "none";
    currentTask.style.display = "none";
    randomizerStart.style.display = "block";

    // Start cooldown checking if needed
    this.updateRandomizeButton();
  }

  // Cooldown checking methods
  startCooldownChecking() {
    // Clear any existing interval first
    this.stopCooldownChecking();

    // Check every 2 minutes (120000ms) for tasks coming off cooldown
    this.cooldownCheckInterval = setInterval(() => {
      const availableTasks = this.getAvailableTasks();
      if (availableTasks.length > 0) {
        // Tasks are now available, update the UI
        this.updateRandomizeButton();
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
      this.saveAllData();
      this.refreshUI();
      this.updateStats();
      this.updateRandomizeButton();
      this.showTaskCompleted();
      //this.showToast("Great job! Task completed! 🎉", "success");
      playConfetti();
    }
  }

  abandonActiveTask() {
    if (this.activeTask) {
      this.abandonDueToExpiration = false; // Manual abandonment, not due to expiration
      this.showAbandonReasonModal();
    }
  }

  showAbandonReasonModal() {
    const modal = document.getElementById("abandonReasonModal");
    const input = document.getElementById("abandonReasonInput");

    modal.style.display = "block";
    input.value = "";
    input.focus();
  }

  hideAbandonReasonModal() {
    // Don't allow hiding the modal if task expired and no reason was provided
    if (this.abandonDueToExpiration && this.activeTask) {
      this.showToast(
        "You must provide a reason for abandoning the expired task",
        "error",
      );
      return;
    }

    const modal = document.getElementById("abandonReasonModal");
    modal.style.display = "none";
  }

  saveAbandonReason() {
    const reasonInput = document.getElementById("abandonReasonInput");
    const reason = reasonInput.value.trim();

    if (!reason) {
      this.showToast("Please enter a reason for abandoning", "error");
      return;
    }

    if (this.activeTask) {
      // Find the task and add abandon reason to executions
      const task = this.tasks.find((t) => t.id === this.activeTask.task.id);
      if (task) {
        task.executions.push({
          timestamp: Date.now(),
          duration: Date.now() - this.activeTask.startTime,
          abandoned: true,
          reason: reason,
        });
      }

      this.activeTask = null;
      this.clearActiveTaskTimer();
      this.abandonDueToExpiration = false; // Reset the flag
      this.saveAllData();
      this.refreshUI();
      this.resetRandomizer();
      this.hideAbandonReasonModal();
      this.showToast("Task abandoned with reason recorded", "default");
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

  // ===== STATE VALIDATION METHODS =====
  // Validates active task timer and handles expiration
  checkActiveTask() {
    if (this.activeTask) {
      const now = Date.now();
      const elapsed = now - this.activeTask.startTime;
      const remaining = this.activeTask.duration - elapsed;

      if (remaining <= 0) {
        // Task expired - show abandon reason modal
        this.abandonDueToExpiration = true;
        this.showAbandonReasonModal();
        this.showToast(
          "Active task expired! Please provide a reason for abandoning.",
          "error",
        );
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
        this.clearActiveTaskTimer();
        this.abandonDueToExpiration = true;
        this.showAbandonReasonModal();
        this.showToast(
          "Time's up! Please provide a reason for abandoning.",
          "error",
        );
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

    // Hide after 2 seconds
    setTimeout(() => {
      toast.classList.remove("show");
    }, 2000);
  }

  escapeHtml(text) {
    // Ensure text is a string
    if (typeof text !== "string") {
      console.warn("escapeHtml received non-string input:", text);
      text = String(text || "");
    }
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  // Public method to clean up corrupted data
  cleanupCorruptedData() {
    let cleaned = false;

    // Clean up tasks
    const originalTaskCount = this.tasks.length;
    this.tasks = this.tasks.filter((task) => {
      if (!task || typeof task !== "object" || typeof task.text !== "string") {
        cleaned = true;
        return false;
      }
      return true;
    });

    // Clean up deleted tasks
    const originalDeletedCount = this.deletedTasks.length;
    this.deletedTasks = this.deletedTasks.filter((task) => {
      if (!task || typeof task !== "object" || typeof task.text !== "string") {
        cleaned = true;
        return false;
      }
      return true;
    });

    if (cleaned) {
      this.saveAllData();
      this.refreshUI();
      this.updateStats();
      const removedTasks =
        originalTaskCount -
        this.tasks.length +
        (originalDeletedCount - this.deletedTasks.length);
      this.showToast(`Cleaned up ${removedTasks} corrupted tasks`, "success");
    } else {
      this.showToast("No corrupted data found", "default");
    }
  }

  // Public method to debug and inspect data (useful for troubleshooting)
  debugData() {
    console.group("Task Dice - Debug Information");
    console.log("Tasks:", this.tasks);
    console.log("Deleted Tasks:", this.deletedTasks);
    console.log("Completed Tasks:", this.completedTasks);
    console.log("Active Task:", this.activeTask);
    console.log("Next Task ID:", this.nextTaskId);

    // Detailed execution statistics
    console.group("Execution Statistics");
    this.tasks.forEach((task, index) => {
      const stats = this.getExecutionStats(task);
      if (stats.successful > 0 || stats.abandoned > 0) {
        console.log(`Task ${index} (${task.text.substring(0, 30)}...):`, {
          successful: stats.successful,
          abandoned: stats.abandoned,
          lastCompleted: stats.lastSuccessful
            ? new Date(stats.lastSuccessful).toLocaleString()
            : "Never",
          totalAttempts: task.executions?.length || 0,
        });
      }
    });
    console.groupEnd();

    // Check for data integrity issues
    const taskIssues = [];
    this.tasks.forEach((task, index) => {
      if (!task || typeof task !== "object") {
        taskIssues.push(`Task ${index}: Not an object`);
      } else {
        if (typeof task.text !== "string") {
          taskIssues.push(
            `Task ${index}: text is not a string (${typeof task.text})`,
          );
        }
        if (!["oneoff", "repeatable"].includes(task.type)) {
          taskIssues.push(`Task ${index}: invalid type (${task.type})`);
        }
        if (!Array.isArray(task.executions)) {
          taskIssues.push(`Task ${index}: executions is not an array`);
        }
      }
    });

    if (taskIssues.length > 0) {
      console.warn("Task Issues Found:", taskIssues);
    } else {
      console.log("✅ All tasks appear valid");
    }

    // Check localStorage data
    console.log("Raw localStorage data:");
    console.log("- tasks:", localStorage.getItem("dothis-tasks"));
    console.log("- deleted:", localStorage.getItem("dothis-deleted"));
    console.log("- completed:", localStorage.getItem("dothis-completed"));
    console.log("- active:", localStorage.getItem("dothis-active"));
    console.log("- nextid:", localStorage.getItem("dothis-nextid"));

    console.groupEnd();

    return {
      tasks: this.tasks,
      deletedTasks: this.deletedTasks,
      completedTasks: this.completedTasks,
      activeTask: this.activeTask,
      issues: taskIssues,
    };
  }

  // Public method to export tasks as pretty-printed JSON
  exportTasksAsJson() {
    try {
      const exportData = {
        metadata: {
          exportDate: new Date().toISOString(),
          version: "1.0",
          totalTasks: this.tasks.length,
          completedTasks: this.completedTasks,
        },
        tasks: this.tasks,
        deletedTasks: this.deletedTasks,
        statistics: {
          completedTasks: this.completedTasks,
          activeTask: this.activeTask,
        },
      };

      const jsonString = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `dothis-tasks-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      this.showToast("Tasks exported successfully", "success");
    } catch (error) {
      console.error("Error exporting tasks:", error);
      this.showToast("Error exporting tasks", "error");
    }
  }

  // Add default sample tasks
  addDefaultTasks() {
    const defaultTasks = [
      {
        id: this.nextTaskId++,
        text: "Read a book for 30 minutes",
        type: "repeatable",
        cooldown: "daily",
        executions: [],
        completed: false,
        createdAt: Date.now(),
      },
      {
        id: this.nextTaskId++,
        text: "Go for a 15-minute walk",
        type: "repeatable",
        cooldown: "daily",
        executions: [],
        completed: false,
        createdAt: Date.now(),
      },
      {
        id: this.nextTaskId++,
        text: "Organize your desk",
        type: "repeatable",
        cooldown: "weekly",
        executions: [],
        completed: false,
        createdAt: Date.now(),
      },
      {
        id: this.nextTaskId++,
        text: "Call a friend or family member",
        type: "repeatable",
        cooldown: "weekly",
        executions: [],
        completed: false,
        createdAt: Date.now(),
      },
      {
        id: this.nextTaskId++,
        text: "Practice a hobby",
        type: "repeatable",
        cooldown: "daily",
        executions: [],
        completed: false,
        createdAt: Date.now(),
      },
      {
        id: this.nextTaskId++,
        text: "Do 10 minutes of stretching",
        type: "repeatable",
        cooldown: "daily",
        executions: [],
        completed: false,
        createdAt: Date.now(),
      },
      {
        id: this.nextTaskId++,
        text: "Write in a journal",
        type: "repeatable",
        cooldown: "daily",
        executions: [],
        completed: false,
        createdAt: Date.now(),
      },
      {
        id: this.nextTaskId++,
        text: "Learn something new online",
        type: "oneoff",
        cooldown: "daily",
        executions: [],
        completed: false,
        createdAt: Date.now(),
      },
    ];

    this.tasks.push(...defaultTasks);
    this.saveAllData();
    this.refreshUI();
    this.updateStats();
    this.updateRandomizeButton();
    this.updateDefaultTasksButton();
    this.showToast("Sample tasks added successfully", "success");
  }

  // Public method to reset everything
  resetEverything() {
    if (
      !confirm(
        "⚠️ WARNING: This will permanently delete ALL your tasks, progress, and settings. Are you absolutely sure?",
      )
    ) {
      return;
    }

    if (
      !confirm(
        "This action cannot be undone. You will lose all tasks, completion history, and statistics. Please confirm you want to reset everything.",
      )
    ) {
      return;
    }

    try {
      // Clear all localStorage data
      localStorage.removeItem("dothis-tasks");
      localStorage.removeItem("dothis-deleted");
      localStorage.removeItem("dothis-completed");
      localStorage.removeItem("dothis-active");
      localStorage.removeItem("dothis-nextid");
      localStorage.removeItem("dothis-tasklist-collapsed");
      localStorage.removeItem("dothis-settings-collapsed");

      // Reset all app state
      this.tasks = [];
      this.deletedTasks = [];
      this.completedTasks = 0;
      this.currentSelectedTask = null;
      this.activeTask = null;
      this.nextTaskId = 1;
      this.editingTaskIndex = null;

      // Clear any active timers
      this.clearActiveTaskTimer();

      // Update UI
      this.refreshUI();
      this.updateStats();
      this.updateDefaultTasksButton();
      this.resetRandomizer();

      // Collapse settings after reset
      if (!this.settingsCollapsed) {
        this.toggleSettings();
      }

      this.showToast("Everything has been reset successfully", "success");
    } catch (error) {
      console.error("Error during reset:", error);
      this.showToast("Error during reset", "error");
    }
  }

  // Debug data in console
  debugDataConsole() {
    console.clear();
    console.log("📊 Task Dice - Debug Information");
    console.log("===============================");
    const debugInfo = this.debugData();
    this.showToast("Debug information logged to console", "default");
    return debugInfo;
  }

  // Clean up completed one-off tasks after 24 hours
  cleanupCompletedOneOffTasks() {
    const now = Date.now();
    const twentyFourHours = 24 * 60 * 60 * 1000;

    const tasksToMove = [];

    // Find completed one-off tasks older than 24 hours
    this.tasks.forEach((task, index) => {
      if (
        task.type === "oneoff" &&
        task.completed &&
        task.executions.length > 0
      ) {
        // Find the most recent completion time from executions
        const lastExecution = Math.max(
          ...task.executions
            .filter((exec) => !exec.abandoned)
            .map((exec) => exec.timestamp),
        );

        if (lastExecution && now - lastExecution >= twentyFourHours) {
          tasksToMove.push(index);
        }
      }
    });

    // Move tasks to trash (process in reverse order to maintain indices)
    tasksToMove.reverse().forEach((index) => {
      const task = this.tasks[index];
      task.deletedAt = now;
      this.deletedTasks.push(task);
      this.tasks.splice(index, 1);
    });

    if (tasksToMove.length > 0) {
      this.saveAllData();
      console.log(
        `Moved ${tasksToMove.length} completed one-off tasks to trash after 24h`,
      );
    }
  }

  // Trash management methods
  renderTrashList() {
    const trashList = document.getElementById("trashList");
    const emptyTrashState = document.getElementById("emptyTrashState");

    trashList.innerHTML = "";

    if (this.deletedTasks.length === 0) {
      emptyTrashState.style.display = "block";
      trashList.style.display = "none";
      return;
    }

    emptyTrashState.style.display = "none";
    trashList.style.display = "block";

    this.deletedTasks.forEach((task, index) => {
      const taskItem = document.createElement("div");
      taskItem.className = "trash-item";

      const typeIcon =
        task.type === "repeatable"
          ? '<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M11.534 7h3.932a.25.25 0 0 1 .192.41l-1.966 2.36a.25.25 0 0 1-.384 0l-1.966-2.36a.25.25 0 0 1 .192-.41zm-11 2h3.932a.25.25 0 0 0 .192-.41L2.692 6.23a.25.25 0 0 0-.384 0L.342 8.59A.25.25 0 0 0 .534 9z"/><path fill-rule="evenodd" d="M8 3c-1.552 0-2.94.707-3.857 1.818a.5.5 0 1 1-.771-.636A6.002 6.002 0 0 1 13.917 7H12.9A5.002 5.002 0 0 0 8 3zM3.1 9a5.002 5.002 0 0 0 8.757 2.182.5.5 0 1 1 .771.636A6.002 6.002 0 0 1 2.083 9H3.1z"/></svg>'
          : '<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M14 4.5V14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h5.5L14 4.5zm-3 0A1.5 1.5 0 0 1 9.5 3V1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V4.5h-2z"/></svg>';
      const deletedDate = new Date(task.deletedAt).toLocaleDateString();

      taskItem.innerHTML = `
          <div class="task-content">
            <div class="task-text">${this.escapeHtml(task.text)}</div>
            <div class="task-meta">
              <span class="task-type">${typeIcon}</span>
              <span class="deleted-date">Deleted: ${deletedDate}</span>
            </div>
          </div>
          <div class="task-actions">
            <button class="restore-btn" onclick="app.restoreTask(${index})" aria-label="Restore task">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="23 4 23 10 17 10"></polyline>
                <polyline points="1 20 1 14 7 14"></polyline>
                <path d="M20.49 9A9 9 0 0 0 5.64 5.64l1.27 1.27"></path>
                <path d="M3.51 15a9 9 0 0 0 14.85 3.36l-1.27-1.27"></path>
              </svg>
            </button>
            <button class="delete-forever-btn" onclick="app.deleteTaskForever(${index})" aria-label="Delete forever">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path>
                <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
            </button>
          </div>
        `;
      trashList.appendChild(taskItem);
    });
  }

  restoreTask(index) {
    const task = this.deletedTasks[index];
    delete task.deletedAt;
    this.tasks.push(task);
    this.deletedTasks.splice(index, 1);
    this.saveAllData();
    this.renderTrashList();
    this.showToast(`"${task.text}" restored`, "success");
  }

  deleteTaskForever(index) {
    if (
      confirm(
        "Are you sure you want to permanently delete this task? This cannot be undone.",
      )
    ) {
      const task = this.deletedTasks[index];
      this.deletedTasks.splice(index, 1);
      this.saveDeletedTasks();
      this.renderTrashList();
      this.showToast(`"${task.text}" deleted permanently`, "success");
    }
  }

  clearAllTrash() {
    if (this.deletedTasks.length === 0) {
      this.showToast("Trash is already empty", "default");
      return;
    }

    if (
      confirm(
        `Are you sure you want to permanently delete all ${this.deletedTasks.length} tasks in trash? This cannot be undone.`,
      )
    ) {
      this.deletedTasks = [];
      this.saveDeletedTasks();
      this.renderTrashList();
      this.showToast("All trash cleared", "success");
    }
  }
}

// Initialize the app when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  window.app = new DoThisApp();
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
    if (container && container.style.display !== "none") {
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
    window.app.saveAllData();
  }
});

// Add error handling for uncaught errors
window.addEventListener("error", (event) => {
  console.error("Uncaught error:", event.error);
  if (window.app && event.error.message.includes("Object")) {
    console.warn("Possible data corruption detected, attempting cleanup...");
    window.app.cleanupCorruptedData();
  }
});

// Add error handling for unhandled promise rejections
window.addEventListener("unhandledrejection", (event) => {
  console.error("Unhandled promise rejection:", event.reason);
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

/**
 * A lightweight confetti animation that can be triggered anywhere.
 *
 * Usage:
 *   import { playConfetti } from './confetti.js';
 *   playConfetti();
 */

function playConfetti() {
  const canvas = document.createElement("canvas");
  canvas.id = "confettiCanvas";
  canvas.style.position = "fixed";
  canvas.style.top = "0";
  canvas.style.left = "0";
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  canvas.style.pointerEvents = "none";
  canvas.style.zIndex = "9999";
  document.body.appendChild(canvas);

  const ctx = canvas.getContext("2d");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const colors = ["#ff595e", "#ffca3a", "#8ac926", "#1982c4", "#6a4c93"];
  const confettiCount = 150;
  const confetti = [];

  for (let i = 0; i < confettiCount; i++) {
    confetti.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height + canvas.height / 2,
      size: Math.random() * 6 + 4,
      x_speed: (Math.random() - 0.5) * 3,
      y_speed: Math.random() * 3 + 4,
      color: colors[Math.floor(Math.random() * colors.length)],
    });
  }

  let frame = 0;

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const p of confetti) {
      p.y -= Math.cos(frame * 0.02) * p.y_speed;
      p.x += Math.sin(frame * 0.01) * p.x_speed;

      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, p.size, p.size);
    }

    frame++;
    if (frame < 200) {
      requestAnimationFrame(draw);
    } else {
      document.body.removeChild(canvas);
    }
  }

  draw();
}
