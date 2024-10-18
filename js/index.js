const showdown = require('showdown');

const converter = new showdown.Converter({
    "noHeaderId": true,
    "simpleLineBreaks": true,
    "simplifiedAutoLink": true,
    "strikethrough": true,
    "underline": true
});

