/*
 * do this - today! - A mobile-first Progressive Web App for task randomization
 * Copyright (c) 2025 Andreas Krohn
 * Licensed under the MIT License. See LICENSE file for details.
 *
 * Refactored modular architecture:
 * - DataManager: Data persistence with localStorage
 * - Utils: UUID generation, formatting, validation
 * - I18nManager: Internationalization and translations
 * - TaskManager: Task CRUD operations and rendering
 * - UIManager: UI navigation, updates, and interactions
 * - RandomizerManager: Task randomization and selection
 * - ActiveTaskManager: Active task timer and lifecycle
 * - ImportExportManager: Import/export functionality
 */

import { DataManager } from "./modules/DataManager.js";
import { Utils } from "./modules/Utils.js";
import { I18nManager } from "./modules/I18nManager.js";
import { TaskManager } from "./modules/TaskManager.js";
import { UIManager } from "./modules/UIManager.js";
import { RandomizerManager } from "./modules/RandomizerManager.js";
import { ActiveTaskManager } from "./modules/ActiveTaskManager.js";
import { ImportExportManager } from "./modules/ImportExportManager.js";

class DoThisApp {
  constructor() {
    // Core state
    this.tasks = [];
    this.deletedTasks = [];
    this.completedTasks = 0;
    this.currentSelectedTask = null;
    this.activeTask = null;
    this.taskListCollapsed = true;
    this.settingsCollapsed = true;
    this.currentPage = "main";
    this.editingTaskIndex = null;
    this.abandonDueToExpiration = false;
    this.notificationsGranted = false;
    this.notificationsSent = { halfTime: false, threeQuarterTime: false };

    // Initialize modules
    this.utils = new Utils(this);
    this.data = new DataManager(this);
    this.i18n = new I18nManager(this);
    this.taskManager = new TaskManager(this);
    this.ui = new UIManager(this);
    this.randomizer = new RandomizerManager(this);
    this.activeTaskManager = new ActiveTaskManager(this);
    this.importExport = new ImportExportManager(this);

    this.init();
  }

  async init() {
    try {
      await this.i18n.loadI18n();
      this.data.loadAllData();
      this.taskManager.cleanupCompletedOneOffTasks(); // Clean up completed one-off tasks after 24h
      this.bindEvents();
      this.ui.applySectionStates();
      this.ui.refreshUI();
      this.ui.updateTaskListCollapse();
      this.activeTaskManager.checkActiveTask();
      this.ui.requestNotificationPermission();
      this.ui.setupDevelopmentFeatures();

      // Run a quick data integrity check on startup
      this.data.validateDataIntegrity();
    } catch (error) {
      console.error("Error during app initialization:", error);
    }
  }

  // ===== EVENT BINDING =====

  bindEvents() {
    // Task management
    document
      .getElementById("saveTaskBtn")
      .addEventListener("click", () => this.taskManager.saveTask());

    document.getElementById("taskInput").addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        this.taskManager.saveTask();
      }
    });

    // Randomizer
    document
      .getElementById("randomizeBtn")
      .addEventListener("click", () => this.randomizer.randomizeTask());
    document
      .getElementById("randomizeAgainBtn")
      .addEventListener("click", () => this.randomizer.randomizeTask());
    document
      .getElementById("acceptTaskBtn")
      .addEventListener("click", () => this.randomizer.acceptTask());
    document
      .getElementById("nextTaskBtn")
      .addEventListener("click", () => this.randomizer.nextTask());

    // Active task buttons
    document
      .getElementById("completeActiveBtn")
      .addEventListener("click", () =>
        this.activeTaskManager.completeActiveTask(),
      );
    document
      .getElementById("abandonActiveBtn")
      .addEventListener("click", () =>
        this.activeTaskManager.abandonActiveTask(),
      );

    // Task type toggle buttons
    document
      .getElementById("toggleOneoff")
      .addEventListener("click", (e) => this.ui.handleTaskTypeToggle(e));
    document
      .getElementById("toggleRepeatable")
      .addEventListener("click", (e) => this.ui.handleTaskTypeToggle(e));

    // Deadline toggle button
    document
      .getElementById("deadlineToggleBtn")
      .addEventListener("click", () => this.ui.toggleDeadlineInput());

    // Task list collapse/expand
    document
      .getElementById("taskListHeader")
      .addEventListener("click", () => this.ui.toggleTaskList());

    // Settings collapse/expand
    document
      .getElementById("settingsHeader")
      .addEventListener("click", () => this.ui.toggleSettings());

    // Settings actions
    document
      .getElementById("addDefaultTasksBtn")
      .addEventListener("click", () => this.taskManager.addDefaultTasks());
    document
      .getElementById("exportDataBtn")
      .addEventListener("click", () => this.importExport.exportTasksAsJson());
    document
      .getElementById("importDataBtn")
      .addEventListener("click", () => this.importExport.importTasksFromJson());
    document
      .getElementById("importFileInput")
      .addEventListener("change", (e) => this.importExport.handleImportFile(e));
    document
      .getElementById("resetAllBtn")
      .addEventListener("click", () => this.data.resetEverything());
    document
      .getElementById("debugDataBtn")
      .addEventListener("click", () => this.debugDataConsole());
    document
      .getElementById("cleanupDataBtn")
      .addEventListener("click", () => this.data.cleanupCorruptedData());

    // Test notifications button (localhost only)
    document
      .getElementById("testNotificationsBtn")
      .addEventListener("click", () => this.ui.testNotifications());

    // Language selection
    document
      .getElementById("languageSelect")
      .addEventListener("change", (e) =>
        this.i18n.changeLanguage(e.target.value),
      );

    // Navigation
    document
      .getElementById("trashBtn")
      .addEventListener("click", () => this.ui.showTrashPage());
    document
      .getElementById("backToMainBtn")
      .addEventListener("click", () => this.ui.showMainPage());

    // Trash actions
    document
      .getElementById("clearAllTrashBtn")
      .addEventListener("click", () => this.taskManager.clearAllTrash());

    // Abandon reason modal
    document
      .getElementById("saveAbandonReasonBtn")
      .addEventListener("click", () =>
        this.activeTaskManager.saveAbandonReason(),
      );
    document
      .getElementById("cancelAbandonReasonBtn")
      .addEventListener("click", () =>
        this.activeTaskManager.hideAbandonReasonModal(),
      );

    // Abandon reason keyboard support
    document
      .getElementById("abandonReasonInput")
      .addEventListener("keydown", (e) => {
        if (e.key === "Enter" && e.ctrlKey) {
          this.activeTaskManager.saveAbandonReason();
        } else if (e.key === "Escape") {
          this.activeTaskManager.hideAbandonReasonModal();
        }
      });
  }

  // ===== DEBUG METHODS =====

  debugDataConsole() {
    console.clear();
    console.log("📊 Task Dice - Debug Information");
    console.log("===============================");
    const debugInfo = this.utils.debugData();
    this.ui.showToast(this.i18n.t("messages.success.debugLogged"), "default");
    return debugInfo;
  }
}

// Initialize the app when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  window.app = new DoThisApp();
});

// Service Worker registration for PWA capabilities
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/pwa/sw.js")
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
      window.app.randomizer.randomizeTask();
    } else if (currentTask.style.display !== "none") {
      e.preventDefault();
      window.app.randomizer.randomizeTask();
    }
  }
});

// Handle visibility change to save data
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden" && window.app) {
    window.app.data.saveAllData();
  }
});

// Add error handling for uncaught errors
window.addEventListener("error", (event) => {
  console.error("Uncaught error:", event.error);
  if (window.app && event.error.message.includes("Object")) {
    console.warn("Possible data corruption detected, attempting cleanup...");
    window.app.data.cleanupCorruptedData();
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

// Make playConfetti globally accessible
window.playConfetti = playConfetti;
