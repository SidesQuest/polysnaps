let currentTheme = $state('');

const THEME_KEY = 'polysnaps_theme';
if (typeof localStorage !== 'undefined') {
    currentTheme = localStorage.getItem(THEME_KEY) || '';
}

export function getTheme() {
    return currentTheme;
}

export function setTheme(theme) {
    currentTheme = theme;
    if (typeof localStorage !== 'undefined') {
        localStorage.setItem(THEME_KEY, theme);
    }
}
