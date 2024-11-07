import { getCookie, setCookie } from "./persist.js";


const themes = {
    'dark': ['#555555', '#323232', '#FFFFFF'],
    'light': ['#FFFFFF', '#C8C8C8', '#000000'],
    'forest': ['#68a368', '#325a32', '#0c130c']
}

const themeKeys = Object.keys(themes);
let currentIndex = 0;

window.addEventListener('load', () => {
    const root = document.querySelector(':root');
    const button = document.querySelector('button#light-mode-toggle');

    let currentTheme = getCookie('currentTheme');
    if (!themeKeys.includes(currentTheme)) {
        currentTheme = themeKeys[currentIndex];
    } else {
        currentIndex = themeKeys.indexOf(currentTheme);
    }

    setCookie('currentTheme', currentTheme);
    updateTheme(currentTheme);

    button.addEventListener('click', () => {
        currentIndex = (currentIndex + 1) % themeKeys.length;
        currentTheme = themeKeys[currentIndex]; // Get the next theme

        setCookie('currentTheme', currentTheme);
        updateTheme(currentTheme);
    });

    function updateTheme(newThemeName) {
        button.innerHTML = newThemeName;

        root.style.setProperty('--primary', themes[newThemeName][0]);
        root.style.setProperty('--accent', themes[newThemeName][1])
        root.style.setProperty('--font', themes[newThemeName][2])
    }

    document.body.style.visibility = 'visible';
});

