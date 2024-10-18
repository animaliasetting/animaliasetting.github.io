const showdown = require('showdown');
const fs = require('fs');
const { JSDOM } = require('jsdom');

const WIKI_DIRECTORY = '../wiki';
const MD_DIRECTORY = '../md';
const WIKI_ENTRY_FILE = '../html/index.html';

const converter = new showdown.Converter({
    'noHeaderId': true,
    'strikethrough': true,
    'underline': true
});

function createWikiFileStructure(directory) {
    const files = fs.readdirSync(directory);

    files.forEach((file) => {
        const filePath = `${directory}/${file}`;
        const stats = fs.lstatSync(filePath);

        const htmlPath = filePath
            .replace(MD_DIRECTORY, WIKI_DIRECTORY)
            .replace(file, file.toLowerCase())
            .replaceAll('_', '-')
            .replace('.md', '.html');

        if (stats.isDirectory()) {
            if (!fs.existsSync(htmlPath)) {
                fs.mkdirSync(htmlPath, { recursive: true });
            }
            createWikiFileStructure(filePath);
        } else if (file.endsWith('.md')) {
            // TODO remove later after action is finished
            const data = parseMarkdown(filePath)
            fs.writeFileSync(htmlPath, data);
        }
    });
}

function parseMarkdown(file) {
    const markdown = fs.readFileSync(file).toString()
    const html = converter.makeHtml(markdown);

    const entryTemplate = fs.readFileSync(WIKI_ENTRY_FILE).toString();
    const { window } = new JSDOM(entryTemplate);
    const document = window.document;

    document.body.innerHTML = html;

    return document.documentElement.outerHTML
}

createWikiFileStructure(MD_DIRECTORY);


