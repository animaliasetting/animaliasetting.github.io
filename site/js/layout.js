

document.addEventListener('DOMContentLoaded', () => {
    const root = document.querySelector(':root');

    let currentMode = "light";

    const lightModeButton = document.querySelector('button#light-mode-toggle');
    lightModeButton.addEventListener('click', () => {
        if (currentMode === "light") {
            lightModeButton.textContent = "Dark Mode";
            currentMode = "dark";

            root.style.setProperty('--primary', 'rgb(0, 0, 0)')
            root.style.setProperty('--accent', 'rgb(50, 50, 50)')
            root.style.setProperty('--font', 'rgb(255, 255, 255)')

        } else {
            lightModeButton.textContent = "Light Mode";
            currentMode = "light";

            root.style.setProperty('--primary', 'rgb(255, 255, 255)')
            root.style.setProperty('--accent', 'rgb(200, 200, 200)')
            root.style.setProperty('--font', 'rgb(0, 0, 0)')
        }
    })
})

