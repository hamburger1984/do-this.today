/**
 * ActiveTaskManager - Active task timer and lifecycle management
 * Handles 8-hour task timer, notifications, completion, and abandonment
 */
export class ActiveTaskManager {
  constructor(app) {
    this.app = app;
    this.activeTaskTimer = null;
  }

  // ===== ACTIVE TASK LIFECYCLE =====

  checkActiveTask() {
    if (this.app.activeTask) {
      const now = Date.now();
      const elapsed = now - this.app.activeTask.startTime;
      const remaining = this.app.activeTask.duration - elapsed;
      const progress = elapsed / this.app.activeTask.duration;

      // Initialize notification flags based on current progress
      // (for tasks that were already active when the app loads)
      if (!this.app.notificationsSent) {
        this.app.notificationsSent = {
          halfTime: false,
          threeQuarterTime: false,
        };
      }
      if (progress >= 0.5) {
        this.app.notificationsSent.halfTime = true;
      }
      if (progress >= 0.75) {
        this.app.notificationsSent.threeQuarterTime = true;
      }

      if (remaining <= 0) {
        // Task expired - show abandon reason modal
        this.app.abandonDueToExpiration = true;
        this.showAbandonReasonModal();
        this.app.ui.showToast(
          "Active task expired! Please provide a reason for abandoning.",
          "error",
        );
      } else {
        // Task still active
        this.app.randomizer.showActiveTask();
        this.startActiveTaskTimer();
      }
    }
  }

  quickLogTask(index) {
    const task = this.app.tasks[index];
    if (!task) return;

    // Check if task is available
    const status = this.app.taskManager.getTaskStatus(task);
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
    this.app.taskManager.renderTasks();
    this.app.ui.showToast(
      this.app.i18n.t("messages.success.taskQuickLogged", {
        taskText: task.text,
      }),
      "success",
    );
  }

  completeActiveTask() {
    if (this.app.activeTask) {
      const task = this.app.tasks.find(
        (t) => t.id === this.app.activeTask.task.id,
      );

      if (task) {
        // Record execution
        task.executions.push({
          timestamp: Date.now(),
          duration: Date.now() - this.app.activeTask.startTime,
        });

        // Mark one-off tasks as completed
        if (task.type === "oneoff") {
          task.completed = true;
        }
      }

      this.app.completedTasks++;
      this.app.activeTask = null;
      this.clearActiveTaskTimer();
      this.app.data.saveAllData();
      this.app.ui.refreshUI();
      this.app.ui.updateStats();
      this.app.ui.updateRandomizeButton();
      this.app.randomizer.showTaskCompleted();
      //this.app.ui.showToast("Great job! Task completed! 🎉", "success");
      playConfetti();
    }
  }

  abandonActiveTask() {
    if (this.app.activeTask) {
      this.app.abandonDueToExpiration = false; // Manual abandonment, not due to expiration
      this.showAbandonReasonModal();
    }
  }

  // ===== ABANDON REASON MODAL =====

  showAbandonReasonModal() {
    const modal = document.getElementById("abandonReasonModal");
    const input = document.getElementById("abandonReasonInput");

    modal.classList.remove("hidden");
    input.value = "";
    input.focus();
  }

  hideAbandonReasonModal() {
    // Don't allow hiding the modal if task expired and no reason was provided
    if (this.app.abandonDueToExpiration && this.app.activeTask) {
      this.app.ui.showToast(
        "You must provide a reason for abandoning the expired task",
        "error",
      );
      return;
    }

    const modal = document.getElementById("abandonReasonModal");
    modal.classList.add("hidden");
  }

  saveAbandonReason() {
    const reasonInput = document.getElementById("abandonReasonInput");
    const reason = reasonInput.value.trim();

    if (!reason) {
      this.app.ui.showToast(
        this.app.i18n.t("messages.errors.pleaseEnterReason"),
        "error",
      );
      return;
    }

    if (this.app.activeTask) {
      // Find the task and add abandon reason to executions
      const task = this.app.tasks.find(
        (t) => t.id === this.app.activeTask.task.id,
      );
      if (task) {
        task.executions.push({
          timestamp: Date.now(),
          duration: Date.now() - this.app.activeTask.startTime,
          abandoned: true,
          reason: reason,
        });
      }

      this.app.activeTask = null;
      this.clearActiveTaskTimer();
      this.app.abandonDueToExpiration = false; // Reset the flag
      this.app.data.saveAllData();
      this.app.ui.refreshUI();
      this.app.randomizer.resetRandomizer();
      this.hideAbandonReasonModal();
      this.app.ui.showToast(
        this.app.i18n.t("messages.success.taskAbandoned"),
        "default",
      );
    }
  }

  // ===== TIMER MANAGEMENT =====

  startActiveTaskTimer() {
    this.clearActiveTaskTimer();
    this.app.randomizer.setLoadingState(false);

    this.activeTaskTimer = setInterval(() => {
      if (!this.app.activeTask) {
        this.clearActiveTaskTimer();
        return;
      }

      const now = Date.now();
      const elapsed = now - this.app.activeTask.startTime;
      const remaining = this.app.activeTask.duration - elapsed;

      if (remaining <= 0) {
        this.clearActiveTaskTimer();
        this.app.abandonDueToExpiration = true;
        this.showAbandonReasonModal();
        this.app.ui.showToast(
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

    // Check for notification triggers
    if (this.app.activeTask) {
      const elapsed = Date.now() - this.app.activeTask.startTime;
      const totalDuration = this.app.activeTask.duration;
      const progress = elapsed / totalDuration;

      // 50% notification (4 hours)
      if (progress >= 0.5 && !this.app.notificationsSent.halfTime) {
        this.app.notificationsSent.halfTime = true;
        this.app.ui.sendTaskTimerNotification(
          "Task Progress: 50% Complete",
          `You're halfway through your task: "${this.app.activeTask.task.text}". ${hours} hours remaining.`,
        );
      }

      // 75% notification (6 hours)
      if (progress >= 0.75 && !this.app.notificationsSent.threeQuarterTime) {
        this.app.notificationsSent.threeQuarterTime = true;
        this.app.ui.sendTaskTimerNotification(
          "Task Progress: 75% Complete",
          `You're three-quarters done with: "${this.app.activeTask.task.text}". ${hours} hours remaining.`,
        );
      }
    }
  }
}
