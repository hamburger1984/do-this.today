/**
 * TaskManager - Task CRUD operations and rendering
 * Handles task creation, editing, deletion, rendering, and status management
 */
export class TaskManager {
  constructor(app) {
    this.app = app;
  }

  // ===== TASK STATUS & FILTERING =====

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

        const nextAvailable = this.app.utils.calculateNextAvailableTime(
          lastSuccessfulExecution,
          task.cooldown,
        );

        if (Date.now() < nextAvailable) {
          return {
            type: "cooldown",
            availableAt: this.app.utils.formatCooldownTime(nextAvailable),
          };
        }
      }
    }

    return { type: "available" };
  }

  getAvailableTasks() {
    return this.app.tasks.filter((task) => {
      const status = this.getTaskStatus(task);
      return status.type === "available";
    });
  }

  isTaskActive(task) {
    return this.app.activeTask && this.app.activeTask.task.id === task.id;
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
      statsHtml += `<span class="task-stat success" title="${this.app.i18n.t("timeAgo.successfulCompletions")}"><svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" style="vertical-align: text-top; margin-right: 4px;"><path d="M13.854 4.146a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.793l6.646-6.647a.5.5 0 0 1 .708 0z"/></svg>${successful.length}</span>`;
    }

    if (abandoned.length > 0) {
      statsHtml += `<span class="task-stat abandoned" title="${this.app.i18n.t("timeAgo.abandonedAttempts")}"><svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" style="vertical-align: text-top; margin-right: 4px;"><path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/></svg>${abandoned.length}</span>`;
    }

    if (lastSuccessful) {
      const lastDate = new Date(lastSuccessful);
      const timeAgo = this.app.utils.getTimeAgo(lastSuccessful);
      statsHtml += `<span class="task-stat last-completed" title="${this.app.i18n.t("timeAgo.lastCompleted", { date: lastDate.toLocaleString() })}"><svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" style="vertical-align: text-top; margin-right: 4px;"><path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/><path d="M8 3.5a.5.5 0 0 0-1 0V9a.5.5 0 0 0 .252.434l3.5 2a.5.5 0 0 0 .496-.868L8 8.71V3.5z"/></svg>${timeAgo}</span>`;
    }

    return {
      successful: successful.length,
      abandoned: abandoned.length,
      lastSuccessful,
      html: statsHtml,
    };
  }

  // ===== TASK CRUD OPERATIONS =====

  saveTask() {
    const input = document.getElementById("taskInput");
    const taskText = input.value.trim();
    const taskType = document.getElementById("taskType").value;
    const cooldownPeriod = document.getElementById("cooldownPeriod").value;

    if (!taskText) {
      this.app.ui.showToast(
        this.app.i18n.t("messages.errors.pleaseEnterTask"),
        "error",
      );
      return;
    }

    if (taskText.length > 200) {
      this.app.ui.showToast(
        this.app.i18n.t("messages.errors.taskTooLong"),
        "error",
      );
      return;
    }

    if (this.app.tasks.some((task) => task.text === taskText)) {
      this.app.ui.showToast(
        this.app.i18n.t("messages.errors.taskExists"),
        "error",
      );
      return;
    }

    const deadline = document.getElementById("taskDeadline").value || null;

    const newTask = {
      id: this.app.utils.generateUUID(),
      text: taskText,
      type: taskType,
      cooldown: cooldownPeriod,
      executions: [],
      completed: false,
      createdAt: Date.now(),
      deadline: deadline ? new Date(deadline).getTime() : null,
    };

    this.app.tasks.push(newTask);
    this.app.data.saveAllData();
    this.app.ui.refreshUI();
    this.app.ui.updateStats();
    this.app.ui.updateRandomizeButton();

    // Clear the main page form
    document.getElementById("taskInput").value = "";
    document.getElementById("taskType").value = "oneoff";
    document.getElementById("cooldownPeriod").value = "daily";
    document.getElementById("taskDeadline").value = "";
    document.getElementById("taskDeadline").disabled = true;

    // Reset toggle buttons
    document.querySelectorAll(".toggle-btn").forEach((btn) => {
      btn.classList.remove("active");
    });
    document.getElementById("toggleOneoff").classList.add("active");
    document.getElementById("deadlineToggleBtn").classList.remove("active");

    this.app.ui.toggleCooldownOptions();

    this.app.ui.showToast(
      this.app.i18n.t("messages.success.taskAdded"),
      "success",
    );
  }

  saveTaskEdit() {
    if (this.app.editingTaskIndex === null) {
      console.warn("No task being edited");
      return;
    }

    const input = document.getElementById(
      `editTaskInput-${this.app.editingTaskIndex}`,
    );
    const taskTypeSelect = document.getElementById(
      `editTaskType-${this.app.editingTaskIndex}`,
    );
    const cooldownSelect = document.getElementById(
      `editCooldownPeriod-${this.app.editingTaskIndex}`,
    );
    const deadlineInput = document.getElementById(
      `editTaskDeadline-${this.app.editingTaskIndex}`,
    );

    if (!input || !taskTypeSelect || !cooldownSelect || !deadlineInput) {
      console.error("Edit form elements not found");
      this.app.ui.showToast(
        this.app.i18n.t("messages.errors.editFormNotAvailable"),
        "error",
      );
      return;
    }

    const taskText = input.value.trim();
    const taskType = taskTypeSelect.value;
    const cooldownPeriod = cooldownSelect.value;
    const deadline = deadlineInput.value || null;

    // Validate task index
    if (
      this.app.editingTaskIndex < 0 ||
      this.app.editingTaskIndex >= this.app.tasks.length
    ) {
      console.error("Invalid editing task index:", this.app.editingTaskIndex);
      this.app.ui.showToast(
        this.app.i18n.t("messages.errors.invalidTaskEdit"),
        "error",
      );
      this.app.ui.hideTaskEdit();
      return;
    }

    if (!taskText) {
      this.app.ui.showToast(
        this.app.i18n.t("messages.errors.pleaseEnterTask"),
        "error",
      );
      return;
    }

    if (taskText.length > 200) {
      this.app.ui.showToast(
        this.app.i18n.t("messages.errors.taskTooLong"),
        "error",
      );
      return;
    }

    // Check if text already exists in other tasks
    const existingTask = this.app.tasks.find(
      (task, index) =>
        task.text === taskText && index !== this.app.editingTaskIndex,
    );
    if (existingTask) {
      this.app.ui.showToast(
        this.app.i18n.t("messages.errors.taskExists"),
        "error",
      );
      return;
    }

    // Update the task
    const task = this.app.tasks[this.app.editingTaskIndex];
    const oldType = task.type;

    task.text = taskText;
    task.type = taskType;
    task.cooldown = cooldownPeriod;
    task.deadline = deadline ? new Date(deadline).getTime() : null;

    // If changing from repeatable to oneoff or vice versa, reset completed status
    if (
      (oldType === "repeatable" && taskType === "oneoff") ||
      (oldType === "oneoff" && taskType === "repeatable")
    ) {
      task.completed = false;
    }

    this.app.data.saveTaskData();
    this.app.ui.refreshUI();
    this.app.ui.updateStats();
    this.app.ui.updateRandomizeButton();
    this.app.ui.hideTaskEdit();
    this.app.ui.showToast(
      this.app.i18n.t("messages.success.taskUpdated"),
      "success",
    );
  }

  deleteTask(index) {
    const task = this.app.tasks[index];
    task.deletedAt = Date.now();
    this.app.deletedTasks.push(task);
    this.app.tasks.splice(index, 1);
    this.app.data.saveAllData();
    this.app.ui.refreshUI();
    this.app.ui.updateStats();
    this.app.ui.showToast(
      this.app.i18n.t("messages.success.taskMovedToTrash", {
        taskText: task.text,
      }),
      "success",
    );

    // Update randomize button state
    this.app.ui.updateRandomizeButton();
    this.app.ui.updateDefaultTasksButton();

    // If current selected task was deleted, reset randomizer
    if (
      this.app.currentSelectedTask &&
      this.app.currentSelectedTask.id === task.id
    ) {
      this.app.randomizer.resetRandomizer();
    }
  }

  quickLogTask(index) {
    const task = this.app.tasks[index];
    if (!task) return;

    // Check if task is available
    const status = this.getTaskStatus(task);
    if (status.type !== "available") {
      this.app.ui.showToast(
        this.app.i18n.t("messages.errors.taskNotAvailable"),
        "error",
      );
      return;
    }

    // Record execution with minimal duration (1 second)
    task.executions.push({
      timestamp: Date.now(),
      duration: 1000, // 1 second placeholder duration
    });

    // Mark one-off tasks as completed
    if (task.type === "oneoff") {
      task.completed = true;
    }

    this.app.completedTasks++;
    this.app.data.saveAllData();
    this.renderTasks();
    this.app.ui.showToast(
      this.app.i18n.t("messages.success.taskQuickLogged", {
        taskText: task.text,
      }),
      "success",
    );
  }

  // ===== TASK RENDERING =====

  renderTasks() {
    const taskList = document.getElementById("taskList");
    taskList.innerHTML = "";

    this.app.tasks.forEach((task, index) => {
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
          statusText = this.app.i18n.t("taskStatus.available");
          break;
        case "cooldown":
          statusIcon =
            '<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" style="vertical-align: text-top; margin-right: 4px;"><path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/><path d="M8 3.5a.5.5 0 0 0-1 0V9a.5.5 0 0 0 .252.434l3.5 2a.5.5 0 0 0 .496-.868L8 8.71V3.5z"/></svg>';
          statusText = this.app.i18n.t("taskStatus.cooldown", {
            availableAt: status.availableAt,
          });
          break;
        case "completed":
          statusIcon =
            '<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" style="vertical-align: text-top; margin-right: 4px;"><rect x="1" y="0" width="1" height="16"/><rect x="2" y="2" width="2" height="2"/><rect x="6" y="2" width="2" height="2"/><rect x="10" y="2" width="2" height="2"/><rect x="14" y="2" width="1" height="2"/><rect x="4" y="4" width="2" height="2"/><rect x="8" y="4" width="2" height="2"/><rect x="12" y="4" width="2" height="2"/><rect x="2" y="6" width="2" height="2"/><rect x="6" y="6" width="2" height="2"/><rect x="10" y="6" width="2" height="2"/><rect x="14" y="6" width="1" height="2"/><rect x="4" y="8" width="2" height="2"/><rect x="8" y="8" width="2" height="2"/><rect x="12" y="8" width="2" height="2"/><path d="M2 2h13v8H2V2z" stroke="currentColor" stroke-width="0.5" fill="none"/></svg>';
          statusText = this.app.i18n.t("taskStatus.completed");
          break;
      }

      const typeDisplay =
        task.type === "repeatable"
          ? `<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" style="vertical-align: text-top; margin-right: 4px;"><path d="M11.534 7h3.932a.25.25 0 0 1 .192.41l-1.966 2.36a.25.25 0 0 1-.384 0l-1.966-2.36a.25.25 0 0 1 .192-.41zm-11 2h3.932a.25.25 0 0 0 .192-.41L2.692 6.23a.25.25 0 0 0-.384 0L.342 8.59A.25.25 0 0 0 .534 9z"/><path fill-rule="evenodd" d="M8 3c-1.552 0-2.94.707-3.857 1.818a.5.5 0 1 1-.771-.636A6.002 6.002 0 0 1 13.917 7H12.9A5.002 5.002 0 0 0 8 3zM3.1 9a5.002 5.002 0 0 0 8.757 2.182.5.5 0 1 1 .771.636A6.002 6.002 0 0 1 2.083 9H3.1z"/></svg> ${this.app.utils.formatCooldown(task.cooldown)}`
          : "";

      // Calculate execution statistics
      const execStats = this.getExecutionStats(task);
      const execStatsHtml = execStats.html;

      // Format deadline if present
      const deadlineInfo = this.app.utils.formatDeadline(task.deadline);
      const deadlineHtml = deadlineInfo
        ? `<span class="task-stat task-deadline ${deadlineInfo.className}" title="${deadlineInfo.title}">
             <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" style="vertical-align: text-top; margin-right: 4px;">
               <path d="M3.5 0a.5.5 0 0 1 .5.5V1h8V.5a.5.5 0 0 1 1 0V1h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h1V.5a.5.5 0 0 1 .5-.5zM1 4v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4H1z"/>
             </svg>${deadlineInfo.text}
           </span>`
        : "";

      // Check if this task is being edited
      if (this.app.editingTaskIndex === index) {
        taskItem.innerHTML = this._renderTaskEditForm(task, index);
      } else {
        taskItem.innerHTML = this._renderTaskDisplay(
          task,
          index,
          statusIcon,
          statusText,
          typeDisplay,
          execStatsHtml,
          deadlineHtml,
          status,
        );
      }

      taskList.appendChild(taskItem);
    });
  }

  _renderTaskEditForm(task, index) {
    return `
      <div class="task-edit-form">
        <div class="edit-input-group">
          <input
            type="text"
            id="editTaskInput-${index}"
            value="${this.app.utils.escapeHtml(task.text)}"
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
                  onclick="app.ui.handleEditTaskTypeToggle(event, ${index})"
                >
                  One-time
                </button>
                <button
                  type="button"
                  class="toggle-btn ${task.type === "repeatable" ? "active" : ""}"
                  data-type="repeatable"
                  onclick="app.ui.handleEditTaskTypeToggle(event, ${index})"
                >
                  Repeatable
                </button>
              </div>
              <input type="hidden" id="editTaskType-${index}" value="${task.type}" />
            </div>
            <div class="edit-option-group" id="editCooldownContainer-${index}">
              <label for="editCooldownPeriod-${index}">Cooldown:</label>
              <select id="editCooldownPeriod-${index}" ${task.type === "repeatable" ? "" : "disabled"}>
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
            <div class="edit-option-group">
              <label>Deadline:</label>
              <div class="deadline-toggle-wrapper">
                <button
                  type="button"
                  class="deadline-toggle-btn ${task.deadline ? "active" : ""}"
                  id="editDeadlineToggleBtn-${index}"
                  onclick="app.ui.toggleEditDeadlineInput(${index})"
                  aria-label="${this.app.i18n.t("buttons.toggleDeadline")}"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M3.5 0a.5.5 0 0 1 .5.5V1h8V.5a.5.5 0 0 1 1 0V1h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h1V.5a.5.5 0 0 1 .5-.5zM1 4v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4H1z"/>
                  </svg>
                </button>
                <input
                  type="date"
                  id="editTaskDeadline-${index}"
                  value="${task.deadline ? new Date(task.deadline).toISOString().split("T")[0] : ""}"
                  ${task.deadline ? "" : "disabled"}
                />
              </div>
            </div>
          </div>
          <div class="edit-actions">
            <button class="btn-secondary edit-cancel" onclick="app.ui.hideTaskEdit()">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
              Cancel
            </button>
            <button class="btn-primary edit-save" onclick="app.taskManager.saveTaskEdit()">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              Save
            </button>
          </div>
        </div>
      </div>
    `;
  }

  _renderTaskDisplay(
    task,
    index,
    statusIcon,
    statusText,
    typeDisplay,
    execStatsHtml,
    deadlineHtml,
    status,
  ) {
    return `
      <div class="task-content">
          <div class="task-text">${this.app.utils.escapeHtml(task.text)}</div>
          <div class="task-meta">
              ${typeDisplay ? `<span class="task-stat task-type ${task.type}" title="${this.app.utils.escapeHtml(task.type)}">${typeDisplay}</span>` : ""}
              <span class="task-stat task-status ${status.type}" title="${this.app.utils.escapeHtml(statusText)}">${statusIcon} ${statusText}</span>
              ${deadlineHtml}
              ${execStatsHtml}
          </div>
      </div>
      <div class="task-actions">
          ${
            status.type === "available" && !this.isTaskActive(task)
              ? `
          <button class="btn-icon-base quick-log-btn"
                  onclick="app.taskManager.quickLogTask(${index})"
                  aria-label="${this.app.i18n.t("buttons.quickLog")}"
                  title="${this.app.i18n.t("buttons.quickLogTitle")}">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
          </button>
          `
              : ""
          }
          <button class="btn-icon-base edit-btn${this.isTaskActive(task) ? " disabled" : ""}"
                  ${this.isTaskActive(task) ? `disabled title="${this.app.i18n.t("buttons.cannotEditActive")}"` : `onclick="app.ui.showTaskEdit(${index})"`}
                  aria-label="${this.app.i18n.t("buttons.edit")}">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="m18 2 4 4-14 14H4v-4L18 2z"></path>
                <path d="m14.5 5.5 4 4"></path>
              </svg>
          </button>
          <button class="btn-icon-base delete-btn${this.isTaskActive(task) ? " disabled" : ""}"
                  ${this.isTaskActive(task) ? `disabled title="${this.app.i18n.t("buttons.cannotDeleteActive")}"` : `onclick="app.taskManager.deleteTask(${index})"`}
                  aria-label="${this.app.i18n.t("buttons.delete")}">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path>
                <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
          </button>
      </div>
    `;
  }

  // ===== TRASH MANAGEMENT =====

  renderTrashList() {
    const trashList = document.getElementById("trashList");
    const emptyTrashState = document.getElementById("emptyTrashState");

    trashList.innerHTML = "";

    if (this.app.deletedTasks.length === 0) {
      emptyTrashState.classList.remove("hidden");
      trashList.classList.add("hidden");
      return;
    }

    emptyTrashState.classList.add("hidden");
    trashList.classList.remove("hidden");

    this.app.deletedTasks.forEach((task, index) => {
      const taskItem = document.createElement("div");
      taskItem.className = "trash-item";

      const typeIcon =
        task.type === "repeatable"
          ? '<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M11.534 7h3.932a.25.25 0 0 1 .192.41l-1.966 2.36a.25.25 0 0 1-.384 0l-1.966-2.36a.25.25 0 0 1 .192-.41zm-11 2h3.932a.25.25 0 0 0 .192-.41L2.692 6.23a.25.25 0 0 0-.384 0L.342 8.59A.25.25 0 0 0 .534 9z"/><path fill-rule="evenodd" d="M8 3c-1.552 0-2.94.707-3.857 1.818a.5.5 0 1 1-.771-.636A6.002 6.002 0 0 1 13.917 7H12.9A5.002 5.002 0 0 0 8 3zM3.1 9a5.002 5.002 0 0 0 8.757 2.182.5.5 0 1 1 .771.636A6.002 6.002 0 0 1 2.083 9H3.1z"/></svg>'
          : '<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M14 4.5V14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h5.5L14 4.5zm-3 0A1.5 1.5 0 0 1 9.5 3V1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V4.5h-2z"/></svg>';
      const deletedDate = new Date(task.deletedAt).toLocaleDateString();

      taskItem.innerHTML = `
          <div class="task-content">
            <div class="task-text">${this.app.utils.escapeHtml(task.text)}</div>
            <div class="task-meta">
              <span class="task-type">${typeIcon}</span>
              <span class="deleted-date">Deleted: ${deletedDate}</span>
            </div>
          </div>
          <div class="task-actions">
            <button class="btn-icon-base restore-btn" onclick="app.taskManager.restoreTask(${index})" aria-label="Restore task">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="23 4 23 10 17 10"></polyline>
                <polyline points="1 20 1 14 7 14"></polyline>
                <path d="M20.49 9A9 9 0 0 0 5.64 5.64l1.27 1.27"></path>
                <path d="M3.51 15a9 9 0 0 0 14.85 3.36l-1.27-1.27"></path>
              </svg>
            </button>
            <button class="btn-icon-base delete-forever-btn" onclick="app.taskManager.deleteTaskForever(${index})" aria-label="Delete forever">
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
    const task = this.app.deletedTasks[index];
    delete task.deletedAt;
    this.app.tasks.push(task);
    this.app.deletedTasks.splice(index, 1);
    this.app.data.saveAllData();
    this.renderTrashList();
    this.app.ui.showToast(
      this.app.i18n.t("messages.success.taskRestored", { taskText: task.text }),
      "success",
    );
  }

  deleteTaskForever(index) {
    if (confirm(this.app.i18n.t("confirmDialogs.deleteTaskForever"))) {
      const task = this.app.deletedTasks[index];
      this.app.deletedTasks.splice(index, 1);
      this.app.data.saveDeletedTasks();
      this.renderTrashList();
      this.app.ui.showToast(
        this.app.i18n.t("messages.success.taskDeletedPermanently", {
          taskText: task.text,
        }),
        "success",
      );
    }
  }

  clearAllTrash() {
    if (this.app.deletedTasks.length === 0) {
      this.app.ui.showToast(
        this.app.i18n.t("messages.info.trashAlreadyEmpty"),
        "default",
      );
      return;
    }

    if (
      confirm(
        this.app.i18n.t("confirmDialogs.clearAllTrash", {
          count: this.app.deletedTasks.length,
        }),
      )
    ) {
      this.app.deletedTasks = [];
      this.app.data.saveDeletedTasks();
      this.renderTrashList();
      this.app.ui.showToast(
        this.app.i18n.t("messages.success.allTrashCleared"),
        "success",
      );
    }
  }

  // ===== CLEANUP =====

  cleanupCompletedOneOffTasks() {
    const now = Date.now();
    const twentyFourHours = 24 * 60 * 60 * 1000;

    const tasksToMove = [];

    // Find completed one-off tasks older than 24 hours
    this.app.tasks.forEach((task, index) => {
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
      const task = this.app.tasks[index];
      task.deletedAt = now;
      this.app.deletedTasks.push(task);
      this.app.tasks.splice(index, 1);
    });

    if (tasksToMove.length > 0) {
      this.app.data.saveAllData();
      console.log(
        `Moved ${tasksToMove.length} completed one-off tasks to trash after 24h`,
      );
    }
  }

  // ===== DEFAULT TASKS =====

  addDefaultTasks() {
    const defaultTasks = [
      {
        id: this.app.utils.generateUUID(),
        text: "Read a book for 30 minutes",
        type: "repeatable",
        cooldown: "daily",
        executions: [],
        completed: false,
        createdAt: Date.now(),
        deadline: null,
      },
      {
        id: this.app.utils.generateUUID(),
        text: "Go for a 15-minute walk",
        type: "repeatable",
        cooldown: "daily",
        executions: [],
        completed: false,
        createdAt: Date.now(),
        deadline: null,
      },
      {
        id: this.app.utils.generateUUID(),
        text: "Organize your desk",
        type: "repeatable",
        cooldown: "weekly",
        executions: [],
        completed: false,
        createdAt: Date.now(),
        deadline: null,
      },
      {
        id: this.app.utils.generateUUID(),
        text: "Call a friend or family member",
        type: "repeatable",
        cooldown: "weekly",
        executions: [],
        completed: false,
        createdAt: Date.now(),
        deadline: null,
      },
      {
        id: this.app.utils.generateUUID(),
        text: "Practice a hobby",
        type: "repeatable",
        cooldown: "daily",
        executions: [],
        completed: false,
        createdAt: Date.now(),
        deadline: null,
      },
      {
        id: this.app.utils.generateUUID(),
        text: "Do 10 minutes of stretching",
        type: "repeatable",
        cooldown: "daily",
        executions: [],
        completed: false,
        createdAt: Date.now(),
        deadline: null,
      },
      {
        id: this.app.utils.generateUUID(),
        text: "Write in a journal",
        type: "repeatable",
        cooldown: "daily",
        executions: [],
        completed: false,
        createdAt: Date.now(),
        deadline: null,
      },
      {
        id: this.app.utils.generateUUID(),
        text: "Learn something new online",
        type: "oneoff",
        cooldown: "daily",
        executions: [],
        completed: false,
        createdAt: Date.now(),
        deadline: null,
      },
    ];

    this.app.tasks.push(...defaultTasks);
    this.app.data.saveAllData();
    this.app.ui.refreshUI();
    this.app.ui.updateStats();
    this.app.ui.updateRandomizeButton();
    this.app.ui.updateDefaultTasksButton();
    this.app.ui.showToast(
      this.app.i18n.t("messages.success.sampleTasksAdded"),
      "success",
    );
  }
}
