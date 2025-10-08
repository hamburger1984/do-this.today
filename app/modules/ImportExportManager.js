/**
 * ImportExportManager - Import and export functionality
 * Handles JSON export, import with three modes (replace, merge, selective)
 */
export class ImportExportManager {
  constructor(app) {
    this.app = app;
  }

  // ===== EXPORT =====

  exportTasksAsJson() {
    try {
      const exportData = {
        metadata: {
          exportDate: new Date().toISOString(),
          version: "1.0",
          totalTasks: this.app.tasks.length,
          completedTasks: this.app.completedTasks,
        },
        tasks: this.app.tasks,
        deletedTasks: this.app.deletedTasks,
        statistics: {
          completedTasks: this.app.completedTasks,
          activeTask: this.app.activeTask,
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

      this.app.ui.showToast(
        this.app.i18n.t("messages.success.tasksExported"),
        "success",
      );
    } catch (error) {
      console.error("Error exporting tasks:", error);
      this.app.ui.showToast(
        this.app.i18n.t("messages.errors.exportError"),
        "error",
      );
    }
  }

  // ===== IMPORT =====

  importTasksFromJson() {
    const fileInput = document.getElementById("importFileInput");
    fileInput.click();
  }

  async handleImportFile(event) {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const text = await file.text();
      const importData = JSON.parse(text);

      // Validate the import data structure
      if (!importData || typeof importData !== "object") {
        throw new Error("Invalid import file format");
      }

      // Show import options dialog
      this.showImportDialog(importData);
    } catch (error) {
      console.error("Error reading import file:", error);
      this.app.ui.showToast(
        this.app.i18n.t("messages.errors.importError") ||
          "Failed to import tasks",
        "error",
      );
    } finally {
      // Clear the file input so the same file can be selected again
      event.target.value = "";
    }
  }

  // ===== IMPORT DIALOGS =====

  showImportDialog(importData) {
    const tasksToImport = importData.tasks || [];
    const deletedTasksToImport = importData.deletedTasks || [];

    if (tasksToImport.length === 0 && deletedTasksToImport.length === 0) {
      this.app.ui.showToast(
        this.app.i18n.t("messages.errors.noTasksInImport") ||
          "No tasks found in import file",
        "error",
      );
      return;
    }

    // Create modal dialog
    const modal = document.createElement("div");
    modal.className = "modal-overlay";
    modal.innerHTML = `
      <div class="modal-content import-dialog">
        <h3>${this.app.i18n.t("import.title") || "Import Tasks"}</h3>
        <p>${this.app.i18n.t("import.description") || "Choose how to import tasks:"}</p>

        <div class="import-stats">
          <div class="import-stat">
            <strong>${tasksToImport.length}</strong> ${this.app.i18n.t("import.tasksFound") || "tasks found"}
          </div>
          ${
            deletedTasksToImport.length > 0
              ? `<div class="import-stat">
            <strong>${deletedTasksToImport.length}</strong> ${this.app.i18n.t("import.deletedTasksFound") || "deleted tasks found"}
          </div>`
              : ""
          }
        </div>

        <div class="import-options">
          <label class="import-option">
            <input type="radio" name="importMode" value="replace" checked />
            <div class="option-content">
              <strong>${this.app.i18n.t("import.replaceAll") || "Replace All"}</strong>
              <span>${this.app.i18n.t("import.replaceAllDesc") || "Replace your entire task list with imported tasks"}</span>
            </div>
          </label>

          <label class="import-option">
            <input type="radio" name="importMode" value="merge" />
            <div class="option-content">
              <strong>${this.app.i18n.t("import.merge") || "Merge"}</strong>
              <span>${this.app.i18n.t("import.mergeDesc") || "Add imported tasks to your existing tasks (duplicates by text will be skipped)"}</span>
            </div>
          </label>

          <label class="import-option">
            <input type="radio" name="importMode" value="selective" />
            <div class="option-content">
              <strong>${this.app.i18n.t("import.selective") || "Select Specific Tasks"}</strong>
              <span>${this.app.i18n.t("import.selectiveDesc") || "Choose which tasks to import"}</span>
            </div>
          </label>
        </div>

        <div class="modal-actions">
          <button class="btn-secondary" id="cancelImportBtn">${this.app.i18n.t("buttons.cancel") || "Cancel"}</button>
          <button class="btn-primary" id="confirmImportBtn">${this.app.i18n.t("buttons.continue") || "Continue"}</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Event listeners
    document.getElementById("cancelImportBtn").addEventListener("click", () => {
      document.body.removeChild(modal);
    });

    document
      .getElementById("confirmImportBtn")
      .addEventListener("click", () => {
        const selectedMode = modal.querySelector(
          'input[name="importMode"]:checked',
        ).value;

        if (selectedMode === "selective") {
          document.body.removeChild(modal);
          this.showTaskSelectionDialog(importData);
        } else {
          this.executeImport(importData, selectedMode);
          document.body.removeChild(modal);
        }
      });
  }

  showTaskSelectionDialog(importData) {
    const tasksToImport = importData.tasks || [];

    const modal = document.createElement("div");
    modal.className = "modal-overlay";
    modal.innerHTML = `
      <div class="modal-content task-selection-dialog">
        <h3>${this.app.i18n.t("import.selectTasks") || "Select Tasks to Import"}</h3>
        <p>${this.app.i18n.t("import.selectTasksDesc") || "Choose which tasks you want to import:"}</p>

        <div class="task-selection-list">
          ${tasksToImport
            .map(
              (task, index) => `
            <label class="task-selection-item">
              <input type="checkbox" class="task-checkbox" data-index="${index}" checked />
              <div class="task-info">
                <div class="task-text">${this.app.utils.escapeHtml(task.text)}</div>
                <div class="task-meta">
                  <span class="task-type-badge ${task.type}">${task.type === "repeatable" ? this.app.i18n.t("tasks.repeatable") || "Repeatable" : this.app.i18n.t("tasks.oneTime") || "One-time"}</span>
                  ${task.cooldown && task.type === "repeatable" ? `<span class="cooldown-badge">${this.app.utils.formatCooldown(task.cooldown)}</span>` : ""}
                  ${task.deadline ? `<span class="deadline-badge">📅 ${new Date(task.deadline).toLocaleDateString()}</span>` : ""}
                </div>
              </div>
            </label>
          `,
            )
            .join("")}
        </div>

        <div class="selection-controls">
          <button class="btn-secondary" id="selectAllBtn">${this.app.i18n.t("buttons.selectAll") || "Select All"}</button>
          <button class="btn-secondary" id="deselectAllBtn">${this.app.i18n.t("buttons.deselectAll") || "Deselect All"}</button>
        </div>

        <div class="modal-actions">
          <button class="btn-secondary" id="cancelSelectionBtn">${this.app.i18n.t("buttons.cancel") || "Cancel"}</button>
          <button class="btn-primary" id="confirmSelectionBtn">${this.app.i18n.t("buttons.import") || "Import Selected"}</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Event listeners
    document
      .getElementById("cancelSelectionBtn")
      .addEventListener("click", () => {
        document.body.removeChild(modal);
      });

    document.getElementById("selectAllBtn").addEventListener("click", () => {
      modal
        .querySelectorAll(".task-checkbox")
        .forEach((cb) => (cb.checked = true));
    });

    document.getElementById("deselectAllBtn").addEventListener("click", () => {
      modal
        .querySelectorAll(".task-checkbox")
        .forEach((cb) => (cb.checked = false));
    });

    document
      .getElementById("confirmSelectionBtn")
      .addEventListener("click", () => {
        const selectedIndices = Array.from(
          modal.querySelectorAll(".task-checkbox:checked"),
        ).map((cb) => parseInt(cb.dataset.index));

        const selectedTasks = selectedIndices.map((i) => tasksToImport[i]);

        this.executeImport(
          {
            ...importData,
            tasks: selectedTasks,
            deletedTasks: [], // Don't import deleted tasks in selective mode
          },
          "merge",
        );

        document.body.removeChild(modal);
      });
  }

  // ===== IMPORT EXECUTION =====

  executeImport(importData, mode) {
    const tasksToImport = importData.tasks || [];
    const deletedTasksToImport = importData.deletedTasks || [];

    try {
      let importedCount = 0;

      if (mode === "replace") {
        // Replace everything
        this.app.tasks = tasksToImport.map((task) =>
          this.validateImportedTask(task),
        );
        this.app.deletedTasks = deletedTasksToImport.map((task) =>
          this.validateImportedTask(task),
        );
        importedCount = tasksToImport.length;

        this.app.ui.showToast(
          this.app.i18n.t("messages.success.tasksReplaced", {
            count: importedCount,
          }) || `Replaced all tasks with ${importedCount} imported tasks`,
          "success",
        );
      } else if (mode === "merge") {
        // Build lookup maps for existing tasks
        const existingTasksByText = new Map();
        this.app.tasks.forEach((task) => {
          existingTasksByText.set(task.text, task);
        });
        const existingIds = new Set(this.app.tasks.map((t) => t.id));
        let skippedCount = 0;

        tasksToImport.forEach((task) => {
          const isDuplicateText = existingTasksByText.has(task.text);
          const isDuplicateId = task.id && existingIds.has(task.id);

          if (!isDuplicateText && !isDuplicateId) {
            // Task is unique - import it (migrate numeric IDs if needed)
            const validatedTask = this.validateImportedTask(task);
            this.app.tasks.push(validatedTask);
            importedCount++;
          } else if (isDuplicateText && !isDuplicateId) {
            // Same text exists - try to preserve UUID from existing task if import has numeric ID
            const existingTask = existingTasksByText.get(task.text);
            if (
              this.app.utils.isNumericId(task.id) &&
              this.app.utils.isValidUUID(existingTask.id)
            ) {
              // Import has numeric ID, existing has UUID - use existing UUID
              console.log(
                `Preserving UUID ${existingTask.id} for task "${task.text}" (had numeric ID ${task.id})`,
              );
              const validatedTask = this.validateImportedTask({
                ...task,
                id: existingTask.id,
              });
              // Update existing task with imported data
              const existingIndex = this.app.tasks.findIndex(
                (t) => t.id === existingTask.id,
              );
              this.app.tasks[existingIndex] = validatedTask;
              importedCount++;
            } else {
              // Both have proper IDs but same text - skip to avoid duplicates
              skippedCount++;
            }
          } else {
            // Duplicate ID or already handled - skip
            skippedCount++;
          }
        });

        // Show appropriate message
        if (importedCount > 0 && skippedCount > 0) {
          this.app.ui.showToast(
            this.app.i18n.t("messages.success.tasksMergedWithSkips", {
              imported: importedCount,
              skipped: skippedCount,
            }) ||
              `Imported ${importedCount} new tasks (${skippedCount} duplicates skipped)`,
            "success",
          );
        } else if (importedCount > 0) {
          this.app.ui.showToast(
            this.app.i18n.t("messages.success.tasksMerged", {
              count: importedCount,
            }) || `Imported ${importedCount} new tasks`,
            "success",
          );
        } else {
          this.app.ui.showToast(
            this.app.i18n.t("messages.info.allTasksAlreadyExist") ||
              "All tasks already exist (no new tasks imported)",
            "default",
          );
        }
      }

      // Save and refresh
      this.app.data.saveAllData();
      this.app.ui.refreshUI();
      this.app.ui.updateStats();
      this.app.ui.updateRandomizeButton();
      this.app.ui.updateDefaultTasksButton();
    } catch (error) {
      console.error("Error executing import:", error);
      this.app.ui.showToast(
        this.app.i18n.t("messages.errors.importFailed") || "Import failed",
        "error",
      );
    }
  }

  validateImportedTask(task) {
    // Determine the ID to use
    let taskId;
    if (!task.id) {
      // No ID provided - generate new UUID
      taskId = this.app.utils.generateUUID();
    } else if (this.app.utils.isNumericId(task.id)) {
      // Numeric ID from legacy export - generate new UUID
      taskId = this.app.utils.generateUUID();
      console.log(
        `Migrating imported task "${task.text}" from numeric ID ${task.id} to UUID ${taskId}`,
      );
    } else if (this.app.utils.isValidUUID(task.id)) {
      // Valid UUID - use it
      taskId = task.id;
    } else {
      // Invalid ID format - generate new UUID
      console.warn(
        `Invalid ID format for task "${task.text}": ${task.id}, generating new UUID`,
      );
      taskId = this.app.utils.generateUUID();
    }

    return {
      id: taskId,
      text:
        typeof task.text === "string" && task.text.trim()
          ? task.text.trim()
          : "Imported task",
      type:
        task.type === "repeatable" || task.type === "oneoff"
          ? task.type
          : "oneoff",
      cooldown: task.cooldown || "daily",
      executions: Array.isArray(task.executions) ? task.executions : [],
      completed: Boolean(task.completed),
      createdAt: task.createdAt || Date.now(),
      deadline: task.deadline || null,
      deletedAt: task.deletedAt || null,
    };
  }
}
