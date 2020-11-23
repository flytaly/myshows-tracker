import storage from './storage.js';

let listenerAdded = false;
const className = 'dark-mode';

const toggleTheme = (theme, mql) => {
    let isDark = false;
    switch (theme) {
        case 'light':
            isDark = false;
            break;
        case 'dark':
            isDark = true;
            break;
        default:
            isDark = mql.matches;
    }
    if (isDark) {
        document.body.classList.add(className);
    } else {
        document.body.classList.remove(className);
    }
};

export default async (theme) => {
    if (!theme) {
        // eslint-disable-next-line no-param-reassign
        theme = (await storage.getOptions('theme')) || 'auto';
    }
    const preferDarkQuery = '(prefers-color-scheme: dark)';
    const mql = window.matchMedia(preferDarkQuery);
    toggleTheme(theme, mql);
    if (!listenerAdded) {
        mql.addEventListener('change', async (e) => {
            const opts = await storage.getOptions();
            toggleTheme(opts.theme, e);
        });
        listenerAdded = true;
    }
};
