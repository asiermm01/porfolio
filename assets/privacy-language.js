const isLanguage = (value) => value === 'es' || value === 'en' || value === 'ca';

document.addEventListener('DOMContentLoaded', async () => {
    if (!i18n.initialized) await i18n.init();

    const toggle = document.getElementById('language-toggle');
    const dropdown = document.getElementById('language-dropdown');
    const current = document.getElementById('current-language');

    if (!(toggle instanceof HTMLButtonElement) ||
        !(dropdown instanceof HTMLElement) ||
        !(current instanceof HTMLElement)) {
        console.error('Privacy page language selector is missing required elements.');
        return;
    }

    const options = document.querySelectorAll('.language-option');
    const codes = { es: 'ES', en: 'EN', ca: 'CA' };

    const updateSelector = () => {
        const language = i18n.getLanguage();
        current.textContent = codes[language] || 'ES';
        document.documentElement.lang = language;
        options.forEach(option => option.classList.toggle('active', option.dataset.lang === language));
    };

    toggle.addEventListener('click', event => {
        event.stopPropagation();
        const isOpen = dropdown.classList.toggle('active');
        toggle.classList.toggle('active', isOpen);
        toggle.setAttribute('aria-expanded', String(isOpen));
    });

    options.forEach(option => option.addEventListener('click', () => {
        const language = option.dataset.lang;
        if (isLanguage(language)) {
            i18n.setLanguage(language);
        }

        dropdown.classList.remove('active');
        toggle.classList.remove('active');
        toggle.setAttribute('aria-expanded', 'false');
    }));

    document.addEventListener('click', event => {
        if (!(event.target instanceof Element) || !event.target.closest('.nav-language-menu')) {
            dropdown.classList.remove('active');
            toggle.classList.remove('active');
            toggle.setAttribute('aria-expanded', 'false');
        }
    });

    document.addEventListener('languagechange', updateSelector);
    updateSelector();
});
