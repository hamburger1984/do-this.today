/**
 * Utils - Utility functions and helpers
 * Includes UUID generation, HTML escaping, time formatting, and validation
 */
export class Utils {
  constructor(app) {
    this.app = app;
  }

  // ===== UUID METHODS =====

  generateUUID() {
    if (window.crypto && window.crypto.randomUUID) {
      return window.crypto.randomUUID();
    }
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
      /[xy]/g,
      function (c) {
        const r = (Math.random() * 16) | 0;
        const v = c === "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      },
    );
  }

  isNumericId(id) {
    return typeof id === "number" || /^\d+$/.test(String(id));
  }

  isValidUUID(id) {
    if (typeof id !== "string") return false;
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(id);
  }

  // ===== STRING UTILITIES =====

  escapeHtml(text) {
    if (typeof text !== "string") {
      console.warn("escapeHtml received non-string input:", text);
      text = String(text || "");
    }
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  // ===== TIME FORMATTING =====

  getTimeAgo(timestamp) {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days > 0)
      return this.app.i18n.t("timeAgo.daysAgo", { days });
    if (hours > 0)
      return this.app.i18n.t("timeAgo.hoursAgo", { hours });
    if (minutes > 0)
      return this.app.i18n.t("timeAgo.minutesAgo", { minutes });
    return this.app.i18n.t("timeAgo.justNow");
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

  formatDeadline(deadline) {
    if (!deadline) return null;

    const deadlineDate = new Date(deadline);
    const today = new Date();

    // Normalize to start of day for proper date comparison
    const deadlineDay = new Date(
      deadlineDate.getFullYear(),
      deadlineDate.getMonth(),
      deadlineDate.getDate(),
    );
    const currentDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
    );

    // Calculate difference in days
    const daysDiff = Math.floor(
      (deadlineDay - currentDay) / (1000 * 60 * 60 * 24),
    );

    if (daysDiff < 0) {
      // Overdue
      const daysOverdue = Math.abs(daysDiff);
      return {
        text:
          daysOverdue === 1
            ? this.app.i18n.t("deadline.oneDayOverdue")
            : this.app.i18n.t("deadline.daysOverdue", { days: daysOverdue }),
        className: "deadline-overdue",
        title: this.app.i18n.t("deadline.overdueSince", {
          date: deadlineDate.toLocaleDateString(),
        }),
      };
    } else if (daysDiff === 0) {
      // Due today
      return {
        text: this.app.i18n.t("deadline.dueToday"),
        className: "deadline-today",
        title: this.app.i18n.t("deadline.due", {
          date: deadlineDate.toLocaleDateString(),
        }),
      };
    } else if (daysDiff === 1) {
      // Due tomorrow
      return {
        text: this.app.i18n.t("deadline.dueTomorrow"),
        className: "deadline-soon",
        title: this.app.i18n.t("deadline.due", {
          date: deadlineDate.toLocaleDateString(),
        }),
      };
    } else if (daysDiff <= 7) {
      // Due within a week
      return {
        text: this.app.i18n.t("deadline.dueInDays", { days: daysDiff }),
        className: "deadline-week",
        title: this.app.i18n.t("deadline.due", {
          date: deadlineDate.toLocaleDateString(),
        }),
      };
    } else {
      // Due later
      return {
        text: this.app.i18n.t("deadline.due", {
          date: deadlineDate.toLocaleDateString(),
        }),
        className: "deadline-future",
        title: this.app.i18n.t("deadline.due", {
          date: deadlineDate.toLocaleDateString(),
        }),
      };
    }
  }

  // ===== COOLDOWN CALCULATIONS =====

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

  // ===== DEBUG =====

  debugData() {
    console.group("Task Dice - Debug Information");
    console.log("Tasks:", this.app.tasks);
    console.log("Deleted Tasks:", this.app.deletedTasks);
    console.log("Completed Tasks:", this.app.completedTasks);
    console.log("Active Task:", this.app.activeTask);

    // Detailed execution statistics
    console.group("Execution Statistics");
    this.app.tasks.forEach((task, index) => {
      const stats = this.app.taskManager.getExecutionStats(task);
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
    this.app.tasks.forEach((task, index) => {
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
      tasks: this.app.tasks,
      deletedTasks: this.app.deletedTasks,
      completedTasks: this.app.completedTasks,
      activeTask: this.app.activeTask,
      issues: taskIssues,
    };
  }
}
