class TaskRandomizer {
  constructor() {
    this.tasks = [];
    this.deletedTasks = [];
    this.completedTasks = 0;
    this.currentSelectedTask = null;
    this.activeTask = null;
    this.activeTaskTimer = null;
    this.nextTaskId = 1;
    this.taskListCollapsed = true;
    this.settingsCollapsed = true;
    this.currentPage = "main";
    this.editingTaskIndex = null;
    this.init();
  }

  init() {
    try {
      this.loadTasks();
      this.cleanupCompletedOneOffTasks(); // Clean up completed one-off tasks after 24h
      this.bindEvents();
      this.updateUI();
      this.updateStats();
      this.updateRandomizeButton();
      this.checkActiveTask();

      // Run a quick data integrity check on startup
      this.validateDataIntegrity();
    } catch (error) {
      console.error("Error during app initialization:", error);
      this.handleInitializationError(error);
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

  handleInitializationError(error) {
    // Try to recover from initialization errors
    try {
      console.warn("Attempting recovery from initialization error...");
      this.tasks = [];
      this.deletedTasks = [];
      this.completedTasks = 0;
      this.activeTask = null;
      this.nextTaskId = 1;

      // Clear potentially corrupted data
      localStorage.removeItem("nowwhat-tasks");
      localStorage.removeItem("nowwhat-deleted");

      // Initialize with default tasks
      this.loadTasks();
      this.updateUI();
      this.updateStats();
      this.updateRandomizeButton();

      this.showToast(
        "App recovered from data corruption. Some tasks may have been lost.",
        "warning",
      );
    } catch (recoveryError) {
      console.error("Recovery failed:", recoveryError);
      this.showToast(
        "App failed to initialize properly. Please refresh the page.",
        "error",
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

  // Local storage management
  saveTasks() {
    localStorage.setItem("nowwhat-tasks", JSON.stringify(this.tasks));
    localStorage.setItem("nowwhat-deleted", JSON.stringify(this.deletedTasks));
    localStorage.setItem("nowwhat-completed", this.completedTasks.toString());
    localStorage.setItem("nowwhat-active", JSON.stringify(this.activeTask));
    localStorage.setItem("nowwhat-nextid", this.nextTaskId.toString());
  }

  loadTasks() {
    const saved = localStorage.getItem("nowwhat-tasks");
    const deletedSaved = localStorage.getItem("nowwhat-deleted");
    const completedSaved = localStorage.getItem("nowwhat-completed");
    const activeSaved = localStorage.getItem("nowwhat-active");
    const nextIdSaved = localStorage.getItem("nowwhat-nextid");

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
        // Clear corrupted data
        localStorage.removeItem("nowwhat-tasks");
      }
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
      this.saveTasks();
    }

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
        localStorage.removeItem("nowwhat-deleted");
      }
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

  // Navigation methods
  showMainPage() {
    this.currentPage = "main";
    document.getElementById("mainPage").style.display = "block";
    document.getElementById("trashPage").style.display = "none";
    this.updateUI();
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
      this.updateUI();
    }
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
    this.saveTasks();
    this.updateUI();
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
    task.deletedAt = Date.now();
    this.deletedTasks.push(task);
    this.tasks.splice(index, 1);
    this.saveTasks();
    this.updateUI();
    this.updateStats();
    this.showToast(`"${task.text}" moved to trash`, "success");

    // Update randomize button state
    this.updateRandomizeButton();

    // If current selected task was deleted, reset randomizer
    if (this.currentSelectedTask && this.currentSelectedTask.id === task.id) {
      this.resetRandomizer();
    }
  }

  // UI update methods
  updateUI() {
    if (!this.taskListCollapsed || this.currentPage !== "main") {
      this.renderTasks();
      this.toggleEmptyState();
    }
    this.updateRandomizeButton();
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

      const typeDisplay =
        task.type === "repeatable"
          ? `🔄 ${this.formatCooldown(task.cooldown)}`
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
                      One-time task
                    </button>
                    <button
                      type="button"
                      class="toggle-btn ${task.type === "repeatable" ? "active" : ""}"
                      data-type="repeatable"
                      onclick="app.handleEditTaskTypeToggle(event, ${index})"
                    >
                      Repeatable task
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
                  <img src="img/x.svg" alt="Cancel" width="16" height="16" />
                  Cancel
                </button>
                <button class="btn-primary edit-save" onclick="app.saveTaskEdit()">
                  <img src="img/check.svg" alt="Save" width="16" height="16" />
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
                  ${typeDisplay ? `<span class="task-stat task-type" title="${this.escapeHtml(task.type)}">${typeDisplay}</span>` : ""}
                  <span class="task-stat task-status ${status.type}" title="${this.escapeHtml(statusText)}">${statusIcon} ${statusText}</span>
                  ${execStatsHtml}
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
      }

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

      // Zero cooldown means always available
      if (cooldownMs === 0) {
        return { type: "available" };
      }

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
      statsHtml += `<span class="task-stat success" title="Successful completions">✓ ${successful.length}</span>`;
    }

    if (abandoned.length > 0) {
      statsHtml += `<span class="task-stat abandoned" title="Abandoned attempts">✗ ${abandoned.length}</span>`;
    }

    if (lastSuccessful) {
      const lastDate = new Date(lastSuccessful);
      const timeAgo = this.getTimeAgo(lastSuccessful);
      statsHtml += `<span class="task-stat last-completed" title="Last completed: ${lastDate.toLocaleString()}">🕒 ${timeAgo}</span>`;
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
    this.randomizeTask();
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
      this.saveTasks();
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
      this.saveTasks();
      this.updateUI();
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
    console.group("Now What? Debug Information");
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
    console.log("- tasks:", localStorage.getItem("nowwhat-tasks"));
    console.log("- deleted:", localStorage.getItem("nowwhat-deleted"));
    console.log("- completed:", localStorage.getItem("nowwhat-completed"));
    console.log("- active:", localStorage.getItem("nowwhat-active"));
    console.log("- nextid:", localStorage.getItem("nowwhat-nextid"));

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
      a.download = `nowwhat-tasks-${new Date().toISOString().split("T")[0]}.json`;
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
      localStorage.removeItem("nowwhat-tasks");
      localStorage.removeItem("nowwhat-deleted");
      localStorage.removeItem("nowwhat-completed");
      localStorage.removeItem("nowwhat-active");
      localStorage.removeItem("nowwhat-nextid");

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
      this.updateUI();
      this.updateStats();
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
    console.log("📊 Now What? Debug Information");
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
      this.saveTasks();
      console.log(
        `Moved ${tasksToMove.length} completed one-off tasks to trash after 24h`,
      );
    }
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

      const typeIcon = task.type === "repeatable" ? "🔄" : "📝";
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
              <img src="img/refresh.svg" alt="Restore" width="16" height="16" />
            </button>
            <button class="delete-forever-btn" onclick="app.deleteTaskForever(${index})" aria-label="Delete forever">
              <img src="img/trash.svg" alt="Delete Forever" width="16" height="16" />
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
    this.saveTasks();
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
      this.saveTasks();
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
      this.saveTasks();
      this.renderTrashList();
      this.showToast("All trash cleared", "success");
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
    window.app.saveTasks();
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
