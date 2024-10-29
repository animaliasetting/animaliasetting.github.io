import { getCookie, setCookie } from "./persist.js";

type ThemeName = 'light' | 'dark' | 'forest';
let currentTheme: ThemeName;
const themes: Record<ThemeName, string[]> = {
    'light': ['#FFFFFF', '#C8C8C8', '#000000'],
    'dark': ['#555555', '#323232', '#FFFFFF'],
    'forest': ['#68a368', '#325a32', '#0c130c']
}

const themeKeys: ThemeName[] = Object.keys(themes) as ThemeName[];
let currentIndex: number = 0;

window.addEventListener('load', () => {
    const root: HTMLElement = document.querySelector(':root') as HTMLElement;
    const button: Element = document.querySelector('button#light-mode-toggle')!;

    currentTheme = getCookie('currentTheme') as ThemeName ?? themeKeys[currentIndex];
    setCookie('currentTheme', currentTheme);
    updateTheme(currentTheme);

    button.addEventListener('click', () => {
        currentIndex = (currentIndex + 1) % themeKeys.length;
        currentTheme = themeKeys[currentIndex]; // Get the next theme

        setCookie('currentTheme', currentTheme);
        updateTheme(currentTheme);
    });

    function updateTheme(name: ThemeName): void {
        button.innerHTML = name;

        root.style.setProperty('--primary', themes[name][0]);
        root.style.setProperty('--accent', themes[name][1])
        root.style.setProperty('--font', themes[name][2])
    }

    document.body.style.visibility = 'visible';
});

