/**
 * DataManager - Handles all data persistence operations with localStorage
 * Responsible for saving and loading tasks, deleted tasks, active task, statistics, and UI state
 */
export class DataManager {
  constructor(app) {
    this.app = app;
  }

  // ===== SAVE METHODS =====

  saveTaskData() {
    localStorage.setItem("dothis-tasks", JSON.stringify(this.app.tasks));
  }

  saveDeletedTasks() {
    localStorage.setItem(
      "dothis-deleted",
      JSON.stringify(this.app.deletedTasks),
    );
  }

  saveActiveTask() {
    localStorage.setItem("dothis-active", JSON.stringify(this.app.activeTask));
  }

  saveStatistics() {
    localStorage.setItem(
      "dothis-completed",
      this.app.completedTasks.toString(),
    );
  }

  saveUIState() {
    localStorage.setItem(
      "dothis-tasklist-collapsed",
      this.app.taskListCollapsed.toString(),
    );
    localStorage.setItem(
      "dothis-settings-collapsed",
      this.app.settingsCollapsed.toString(),
    );
  }

  saveAllData() {
    this.saveTaskData();
    this.saveDeletedTasks();
    this.saveActiveTask();
    this.saveStatistics();
    this.saveUIState();
  }

  // ===== LOAD METHODS =====

  loadTaskData() {
    const saved = localStorage.getItem("dothis-tasks");
    if (saved) {
      try {
        this.app.tasks = JSON.parse(saved);
        let needsMigration = false;

        // Migrate and validate task objects
        this.app.tasks = this.app.tasks.map((task, index) => {
          if (typeof task === "string") {
            needsMigration = true;
            return {
              id: this.app.utils.generateUUID(),
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
            needsMigration = true;
            return {
              id: this.app.utils.generateUUID(),
              text: "Corrupted task (please edit)",
              type: "oneoff",
              cooldown: "daily",
              executions: [],
              completed: false,
            };
          }

          // Migrate numeric IDs to UUIDs
          let taskId = task.id;
          if (!taskId || this.app.utils.isNumericId(taskId)) {
            taskId = this.app.utils.generateUUID();
            needsMigration = true;
            console.log(
              `Migrating task "${task.text}" from numeric ID ${task.id} to UUID ${taskId}`,
            );
          }

          // Ensure all required properties exist and are valid
          const validTask = {
            id: taskId,
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
            deadline: task.deadline || null,
          };
          return validTask;
        });

        // Filter out any null/undefined tasks
        this.app.tasks = this.app.tasks.filter((task) => task && task.text);

        // Save migrated data back to localStorage
        if (needsMigration) {
          console.log("UUID migration completed, saving to localStorage");
          this.saveTaskData();
        }
      } catch (error) {
        console.error("Error loading tasks from localStorage:", error);
        this.app.tasks = [];
        localStorage.removeItem("dothis-tasks");
      }
    } else {
      this.app.tasks = [];
    }
  }

  loadDeletedTasks() {
    const deletedSaved = localStorage.getItem("dothis-deleted");
    if (deletedSaved) {
      try {
        let needsMigration = false;

        this.app.deletedTasks = JSON.parse(deletedSaved).map((task, index) => {
          if (typeof task === "string") {
            needsMigration = true;
            return {
              id: this.app.utils.generateUUID(),
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
            needsMigration = true;
            return {
              id: this.app.utils.generateUUID(),
              text: "Corrupted deleted task",
              type: "oneoff",
              cooldown: "daily",
              executions: [],
              completed: false,
              deletedAt: Date.now(),
            };
          }

          // Migrate numeric IDs to UUIDs
          let taskId = task.id;
          if (!taskId || this.app.utils.isNumericId(taskId)) {
            taskId = this.app.utils.generateUUID();
            needsMigration = true;
            console.log(
              `Migrating deleted task "${task.text}" from numeric ID ${task.id} to UUID ${taskId}`,
            );
          }

          const validTask = {
            id: taskId,
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
            deadline: task.deadline || null,
          };
          return validTask;
        });

        // Filter out any null/undefined tasks
        this.app.deletedTasks = this.app.deletedTasks.filter(
          (task) => task && task.text,
        );

        // Save migrated data back to localStorage
        if (needsMigration) {
          console.log(
            "Deleted tasks UUID migration completed, saving to localStorage",
          );
          this.saveDeletedTasks();
        }
      } catch (error) {
        console.error("Error loading deleted tasks from localStorage:", error);
        this.app.deletedTasks = [];
        localStorage.removeItem("dothis-deleted");
      }
    } else {
      this.app.deletedTasks = [];
    }
  }

  loadActiveTask() {
    const activeSaved = localStorage.getItem("dothis-active");
    if (activeSaved && activeSaved !== "null") {
      try {
        this.app.activeTask = JSON.parse(activeSaved);
      } catch (error) {
        console.error("Error loading active task:", error);
        this.app.activeTask = null;
        localStorage.removeItem("dothis-active");
      }
    } else {
      this.app.activeTask = null;
    }
  }

  loadStatistics() {
    const completedSaved = localStorage.getItem("dothis-completed");

    if (completedSaved) {
      this.app.completedTasks = parseInt(completedSaved) || 0;
    }

    // Clean up legacy nextTaskId from localStorage (no longer needed with UUIDs)
    if (localStorage.getItem("dothis-nextid")) {
      localStorage.removeItem("dothis-nextid");
      console.log("Removed legacy nextTaskId from localStorage");
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
      this.app.taskListCollapsed = taskListCollapsedSaved === "true";
    }

    if (settingsCollapsedSaved !== null) {
      this.app.settingsCollapsed = settingsCollapsedSaved === "true";
    }
  }

  loadAllData() {
    this.loadTaskData();
    this.loadDeletedTasks();
    this.loadActiveTask();
    this.loadStatistics();
    this.loadUIState();
  }

  // ===== DATA VALIDATION =====

  validateDataIntegrity() {
    let hasIssues = false;

    this.app.tasks.forEach((task, index) => {
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

  cleanupCorruptedData() {
    let cleaned = false;

    // Clean up tasks
    const originalTaskCount = this.app.tasks.length;
    this.app.tasks = this.app.tasks.filter((task) => {
      if (!task || typeof task !== "object" || typeof task.text !== "string") {
        cleaned = true;
        return false;
      }
      return true;
    });

    // Clean up deleted tasks
    const originalDeletedCount = this.app.deletedTasks.length;
    this.app.deletedTasks = this.app.deletedTasks.filter((task) => {
      if (!task || typeof task !== "object" || typeof task.text !== "string") {
        cleaned = true;
        return false;
      }
      return true;
    });

    if (cleaned) {
      this.saveAllData();
      this.app.ui.refreshUI();
      this.app.ui.updateStats();
      const removedTasks =
        originalTaskCount -
        this.app.tasks.length +
        (originalDeletedCount - this.app.deletedTasks.length);
      this.app.ui.showToast(
        this.app.i18n.t("messages.success.cleanedUpTasks", {
          count: removedTasks,
        }),
        "success",
      );
    } else {
      this.app.ui.showToast(
        this.app.i18n.t("messages.success.noCorruptedData"),
        "default",
      );
    }
  }

  // ===== RESET =====

  resetEverything() {
    if (!confirm(this.app.i18n.t("confirmDialogs.resetWarning"))) {
      return;
    }

    if (!confirm(this.app.i18n.t("confirmDialogs.resetConfirm"))) {
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
      this.app.tasks = [];
      this.app.deletedTasks = [];
      this.app.completedTasks = 0;
      this.app.currentSelectedTask = null;
      this.app.activeTask = null;
      this.app.editingTaskIndex = null;

      // Clear any active timers
      this.app.activeTaskManager.clearActiveTaskTimer();

      // Update UI
      this.app.ui.refreshUI();
      this.app.ui.updateStats();
      this.app.ui.updateDefaultTasksButton();
      this.app.randomizer.resetRandomizer();

      // Collapse settings after reset
      if (!this.app.settingsCollapsed) {
        this.app.ui.toggleSettings();
      }

      this.app.ui.showToast(
        this.app.i18n.t("messages.success.everythingReset"),
        "success",
      );
    } catch (error) {
      console.error("Error during reset:", error);
      this.app.ui.showToast(
        this.app.i18n.t("messages.errors.resetError"),
        "error",
      );
    }
  }
}
