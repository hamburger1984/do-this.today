/**
 * I18nManager - Internationalization manager
 * Handles language loading, detection, translation, and UI updates
 */
export class I18nManager {
  constructor(app) {
    this.app = app;
    this.i18n = null;
    this.currentLanguage = "en-US";
  }

  async loadI18n() {
    try {
      // Detect user's preferred language
      this.currentLanguage = this.detectLanguage();

      // Load the appropriate translation file
      const response = await fetch(`i18n/${this.currentLanguage}.json`);
      if (!response.ok) {
        // Fallback to English if language file not found
        console.warn(
          `Language file for ${this.currentLanguage} not found, falling back to en-US`,
        );
        this.currentLanguage = "en-US";
        const fallbackResponse = await fetch(`i18n/en-US.json`);
        this.i18n = await fallbackResponse.json();
      } else {
        this.i18n = await response.json();
      }

      // Apply translations to static HTML elements
      this.applyTranslations();
    } catch (error) {
      console.error("Error loading translations:", error);
      // Continue without translations if loading fails
    }
  }

  detectLanguage() {
    // Check localStorage for saved preference
    const savedLang = localStorage.getItem("dothis-language");
    if (savedLang) {
      return savedLang;
    }

    // Check browser language
    const browserLang = navigator.language || navigator.userLanguage;

    // Map browser language to supported languages
    if (browserLang.startsWith("de")) {
      return "de-DE";
    }

    // Default to English
    return "en-US";
  }

  t(key, params = {}) {
    if (!this.i18n) {
      return key; // Return key if translations not loaded
    }

    // Navigate through nested object structure
    const keys = key.split(".");
    let value = this.i18n;

    for (const k of keys) {
      if (value && typeof value === "object" && k in value) {
        value = value[k];
      } else {
        console.warn(`Translation key not found: ${key}`);
        return key;
      }
    }

    // Replace parameters if any
    if (typeof value === "string" && Object.keys(params).length > 0) {
      return value.replace(/\{\{(\w+)\}\}/g, (match, param) => {
        return params[param] || match;
      });
    }

    return value;
  }

  applyTranslations() {
    if (!this.i18n) return;

    // Update static HTML elements
    document.title = this.t("app.title");

    // App header
    const appTitle = document.querySelector(".app-title");
    if (appTitle) appTitle.textContent = this.t("app.title");

    const appSubtitle = document.querySelector(".app-subtitle");
    if (appSubtitle) appSubtitle.textContent = this.t("app.subtitle");

    // Set language selector to current language
    const languageSelect = document.getElementById("languageSelect");
    if (languageSelect) {
      languageSelect.value = this.currentLanguage;
    }

    // Update all elements with data-i18n attributes
    document.querySelectorAll("[data-i18n]").forEach((element) => {
      const i18nAttr = element.getAttribute("data-i18n");

      // Check if it's an attribute-specific translation (e.g., [aria-label]key)
      const attrMatch = i18nAttr.match(/^\[([^\]]+)\](.+)$/);

      if (attrMatch) {
        // Translate specific attribute
        const [, attrName, key] = attrMatch;
        const translation = this.t(key);
        element.setAttribute(attrName, translation);
      } else {
        // Translate text content
        const translation = this.t(i18nAttr);

        if (element.tagName === "INPUT" && element.type === "text") {
          element.placeholder = translation;
        } else if (element.tagName === "TEXTAREA") {
          element.placeholder = translation;
        } else {
          element.textContent = translation;
        }
      }
    });
  }

  async changeLanguage(newLanguage) {
    if (newLanguage === this.currentLanguage) return;

    try {
      // Save language preference
      localStorage.setItem("dothis-language", newLanguage);
      this.currentLanguage = newLanguage;

      // Load new language file
      const response = await fetch(`i18n/${newLanguage}.json`);
      if (response.ok) {
        this.i18n = await response.json();
        this.applyTranslations();
        // Refresh UI to update any dynamic content
        this.app.ui.refreshUI();
      } else {
        console.error(`Failed to load language file: ${newLanguage}`);
      }
    } catch (error) {
      console.error("Error changing language:", error);
    }
  }
}
