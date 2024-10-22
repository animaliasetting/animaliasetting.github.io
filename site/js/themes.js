import {getCookie, setCookie} from "./persist.js";

let currentTheme;
const themes = {
    'light': ['#FFFFFF', '#C8C8C8', '#000000'],
    'dark': ['#555555', '#323232', '#FFFFFF'],
    'forest': ['#68a368', '#325a32', '#0c130c']
}

const themeKeys = Object.keys(themes);
let currentIndex = 0;

window.addEventListener('load', () => {
    document.body.style.visibility = 'visible';

    const root = document.querySelector(':root');
    const button = document.querySelector('button#light-mode-toggle');

    currentTheme = getCookie('currentTheme') || themeKeys[currentIndex];
    setCookie('currentTheme', currentTheme);
    updateTheme(currentTheme);

    button.addEventListener('click', () => {
        currentIndex = (currentIndex + 1) % themeKeys.length;
        currentTheme = themeKeys[currentIndex]; // Get the next theme

        setCookie('currentTheme', currentTheme);
        updateTheme(currentTheme);
    })

    function updateTheme(name) {
        button.innerHTML = name;

        root.style.setProperty('--primary', themes[name][0]);
        root.style.setProperty('--accent', themes[name][1])
        root.style.setProperty('--font', themes[name][2])
    }
})



