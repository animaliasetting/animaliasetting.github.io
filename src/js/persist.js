const DAY_IN_MS = 24 * 60 * 60 * 1000;

export function setCookie(name, value, days = 999) {
    const date = new Date();

    date.setTime(date.getTime() + (days * DAY_IN_MS));
    let expires = `expires=${date.toUTCString()}`

    document.cookie = `${name}=${value};expires=${expires};path=/;samesite=lax;`;
}

export function getCookie(name) {
    name = `${name}=`;

    for (const component of document.cookie.split(';')) {
        const trimmed = component.trim();
        if (!trimmed.startsWith(name)) continue;
        return trimmed.slice(name.length);
    }

    return null;
}

export function delCookie(name) {
    // No way actually delete a cookie directly so we update the cookie
    // to have an expiry date that has already passed
    setCookie(name, '', -1);
}