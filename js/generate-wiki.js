const showdown = require('showdown');
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const WIKI_DIRECTORY = './wiki';
const MD_DIRECTORY = './md';
const WIKI_ENTRY_FILE = './html/index.html';
const INDENT_SIZE = 4;

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
            createWikiFileStructure(filePath);
        } else if (file.endsWith('.md')) {
            const htmlDir = path.dirname(htmlPath);
            if (!fs.existsSync(htmlDir)) {
                fs.mkdirSync(htmlDir, { recursive: true });
            }

            // TODO remove later after action is finished
            const data = parseMarkdown(filePath)
            fs.writeFileSync(htmlPath, data);
        }
    });
}

function parseMarkdown(file) {
    const markdown = fs.readFileSync(file).toString()
    const parsedHtml = converter.makeHtml(markdown);

    const entryTemplate = fs.readFileSync(WIKI_ENTRY_FILE).toString();

    const { window } = new JSDOM(entryTemplate);
    const document = window.document;
    document.body.innerHTML = parsedHtml;

    return formatHtml(document.documentElement.outerHTML)
}

function formatHtml(html) {
    let formatted = `<!DOCTYPE html>\n${html}`;

    formatted = formatted.replace(/></g, '>\n<');
    // We also remove whitespace from everything to add it properly
    formatted = formatted.split('\n').map(line => line.trim()).join('\n');

    let indentLevel = 0;

    formatted = formatted.split('\n').map((line, index) => {
        // First line is always the doctype tag, which isn't technically
        // self-closing but is still a tag, so we ignore it manually
        if (index === 0) return line;

        const strippedLine = line.replaceAll(' ', '');

        let isSelfClosing = strippedLine.match(/^<([a-z][a-z0-9]*)>.*<\/\1>$/) != null;
        if (!isSelfClosing) isSelfClosing = strippedLine.match(/^<meta/);

        if (isSelfClosing) {
            const indent = ' '.repeat(INDENT_SIZE * indentLevel);
            return indent + line;
        }

        const hasOpeningTag = strippedLine.match(/^<[a-z][a-z0-9]*(.*?)>.*$/) != null;
        const hasClosingTag = strippedLine.match(/^.*<\/[a-z][a-z0-9]*(.*?)>$/)!= null;

        if (hasClosingTag)  indentLevel -= 1;
        const indent = ' '.repeat(INDENT_SIZE * indentLevel);
        if (hasOpeningTag) indentLevel += 1;

        return `${indent}${line}`;
    }).join('\n');

    return formatted;
}

const ignoredDirectories = [
    ".git",
    "node_modules"
]
function listFilesRecursively(dir) {
    // Read the contents of the directory
    const files = fs.readdirSync(dir);
    // Loop through the contents
    files.forEach(file => {
        // Get the full path of the file/directory
        const fullPath = path.join(dir, file);
        // Check if it's a directory
        if (fs.lstatSync(fullPath).isDirectory()) {
            console.log(`Directory: ${fullPath}`);
            if (ignoredDirectories.includes(fullPath)) return;
            // Recurse into the directory
            listFilesRecursively(fullPath);
        } else {
            // It's a file, so just print its path
            console.log(`File: ${fullPath}`);
        }
    });
}

createWikiFileStructure(MD_DIRECTORY);
listFilesRecursively("./");




