/**
 * i18n - Simple JSON-based Translation System
 * Supports: Spanish (es), English (en), Catalan (ca)
 */

class I18n {
    constructor() {
        this.translations = {};
        this.currentLanguage = this.getStoredLanguage() || this.detectBrowserLanguage();
        this.initialized = false;
    }

    getInlineTranslations() {
        const inlineScript = document.getElementById('translations-data');
        if (!inlineScript) return null;

        try {
            return JSON.parse(inlineScript.textContent);
        } catch (error) {
            console.warn('Could not parse inline translations:', error);
            return null;
        }
    }

    /**
     * Initialize the translation system
     */
    async init() {
        try {
            const inlineTranslations = this.getInlineTranslations();
            if (inlineTranslations) {
                this.translations = inlineTranslations;
            } else {
                const response = await fetch('./assets/translations.json');
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }
                this.translations = await response.json();
            }

            this.initialized = true;
            this.applyTranslations();
            return true;
        } catch (error) {
            console.error('Error loading translations:', error);
            return false;
        }
    }

    /**
     * Get stored language from localStorage
     */
    getStoredLanguage() {
        return localStorage.getItem('preferredLanguage');
    }

    /**
     * Save language preference to localStorage
     */
    saveLanguagePreference(lang) {
        localStorage.setItem('preferredLanguage', lang);
    }

    /**
     * Detect browser language (fallback to 'es' if not supported)
     */
    detectBrowserLanguage() {
        const browserLang = navigator.language || navigator.userLanguage;
        const langCode = browserLang.split('-')[0].toLowerCase();
        
        // Map browser language codes to supported languages
        const supportedLanguages = {
            'es': 'es',
            'en': 'en',
            'ca': 'ca'
        };

        return supportedLanguages[langCode] || 'es'; // Default to Spanish
    }

    /**
     * Get a translation by key path (e.g., 'nav.about')
     */
    get(key) {
        const keys = key.split('.');
        let value = this.translations[this.currentLanguage];

        for (const k of keys) {
            if (value && typeof value === 'object') {
                value = value[k];
            } else {
                console.warn(`Translation key not found: ${key}`);
                return key; // Return the key itself as fallback
            }
        }

        return value || key;
    }

    /**
     * Change the current language
     */
    setLanguage(lang) {
        if (this.translations[lang]) {
            this.currentLanguage = lang;
            this.saveLanguagePreference(lang);
            this.applyTranslations();
            this.dispatchLanguageChangeEvent();
            return true;
        } else {
            console.warn(`Language '${lang}' not supported`);
            return false;
        }
    }

    /**
     * Get current language
     */
    getLanguage() {
        return this.currentLanguage;
    }

    /**
     * Get available languages
     */
    getAvailableLanguages() {
        return Object.keys(this.translations);
    }

    /**
     * Apply translations to DOM elements
     * Elements should have data-i18n attributes like: data-i18n="nav.about"
     */
    applyTranslations() {
        if (!this.initialized) {
            console.warn('i18n not initialized yet');
            return;
        }

        const elements = document.querySelectorAll('[data-i18n]');
        
        elements.forEach(element => {
            const key = element.getAttribute('data-i18n');
            const translation = this.get(key);
            const target = element.getAttribute('data-i18n-target');

            if (element.getAttribute('data-i18n-html') === 'true' || target === 'html') {
                element.innerHTML = translation;
            } else if (target) {
                element.setAttribute(target, translation);
            } else {
                element.textContent = translation;
            }
        });
    }

    /**
     * Dispatch a custom event when language changes
     */
    dispatchLanguageChangeEvent() {
        const event = new CustomEvent('languagechange', {
            detail: { language: this.currentLanguage }
        });
        document.dispatchEvent(event);
    }

    /**
     * Get language name for display
     */
    getLanguageName(lang) {
        const names = {
            'es': 'Español',
            'en': 'English',
            'ca': 'Català'
        };
        return names[lang] || lang;
    }
}

// Create global instance
const i18n = new I18n();

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    await i18n.init();
});
