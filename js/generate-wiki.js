const showdown = require('showdown');
const fs = require('fs');

const WIKI_DIRECTORY = 'wiki';
const MD_DIRECTORY = 'md';

const converter = new showdown.Converter({
    "noHeaderId": true,
    "simpleLineBreaks": true,
    "simplifiedAutoLink": true,
    "strikethrough": true,
    "underline": true
});


function findMarkdownFiles(directory) {
    const files = fs.readdirSync(directory);
    const markdownFiles = [];

    files.forEach((file) => {
        const filePath = `${directory}/${file}`;
        const stats = fs.lstatSync(filePath);

        if (stats.isDirectory()) {
            markdownFiles.push(...findMarkdownFiles(filePath));
        } else if (file.endsWith('.md')) {
            convertToHtml(file);
        }
    });

    return markdownFiles;
}

function convertToHtml(filePath) {
    // Since we're just passing in the
    const relativeFilePath = `${MD_DIRECTORY}/${filePath}`;
    const markdown = fs.readFileSync(relativeFilePath, 'utf8');
    const html = converter.makeHtml(markdown);

    const htmlPath = `${WIKI_DIRECTORY}/${filePath}`;

    console.log(`Would output the html file in ${htmlPath}`)
}

const markdownFiles = findMarkdownFiles(MD_DIRECTORY);
console.log(markdownFiles);


