

function getCookie() {

}

function delCookie() {

}

function setCookie(name, value) {
    const date = Date.
    setCookie(name, value, date);
}

function setCookie(name, value, days) {
    const d = new Date();
    d.setTime(d.getTime() + (exdays*24*60*60*1000));
    let expires = "expires="+ d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}