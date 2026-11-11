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
            document.dispatchEvent(new CustomEvent('translationsready'));
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
        try {
            const language = window.localStorage.getItem('preferredLanguage');
            return ['es', 'en', 'ca'].includes(language) ? language : null;
        } catch (error) {
            console.warn('Could not read the saved language preference:', error);
            return null;
        }
    }

    /**
     * Save language preference to localStorage
     */
    saveLanguagePreference(lang) {
        try {
            window.localStorage.setItem('preferredLanguage', lang);
        } catch (error) {
            console.warn('Could not save the language preference:', error);
        }
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

        document.documentElement.lang = this.currentLanguage;
        const elements = document.querySelectorAll('[data-i18n]');
        
        elements.forEach(element => {
            const key = element.getAttribute('data-i18n');
            const translation = this.get(key);
            const target = element.getAttribute('data-i18n-target');

            if (element.getAttribute('data-i18n-html') === 'true' || target === 'html') {
                element.replaceChildren(...this.createSafeTranslationNodes(translation));
            } else if (target) {
                element.setAttribute(target, translation);
            } else {
                element.textContent = translation;
            }
        });
    }

    createSafeTranslationNodes(html) {
        const parsed = new DOMParser().parseFromString(html, 'text/html');
        const allowedTags = new Set(['A', 'BR', 'STRONG']);

        const copyNode = (node) => {
            if (node.nodeType === Node.TEXT_NODE) {
                return document.createTextNode(node.textContent || '');
            }

            if (node.nodeType !== Node.ELEMENT_NODE || !allowedTags.has(node.tagName)) {
                return document.createTextNode(node.textContent || '');
            }

            const safeNode = document.createElement(node.tagName.toLowerCase());
            if (node.tagName === 'A') {
                const href = node.getAttribute('href');
                if (href) {
                    try {
                        const url = new URL(href, window.location.href);
                        if (url.protocol === 'https:' || url.protocol === 'mailto:') {
                            safeNode.setAttribute('href', url.href);
                        }
                    } catch (error) {
                        console.warn('Discarded an invalid link in a translation:', error);
                    }
                }

                if (node.getAttribute('target') === '_blank') {
                    safeNode.setAttribute('target', '_blank');
                    safeNode.setAttribute('rel', 'noopener noreferrer');
                }
            }

            safeNode.replaceChildren(...Array.from(node.childNodes, copyNode));
            return safeNode;
        };

        return Array.from(parsed.body.childNodes, copyNode);
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
