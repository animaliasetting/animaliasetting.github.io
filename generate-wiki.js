const showdown = require('showdown');
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const WIKI_DIRECTORY = 'site';
const MD_DIRECTORY = 'md';
const ENTRY_TEMPLATE = 'site/html/entry-template.html';
const INDENT_SIZE = 4;

const converter = new showdown.Converter({
    'noHeaderId': true,
    'strikethrough': true,
    'underline': true
});

function createWebsitePages() {
    const mdFiles = locateMdFiles(MD_DIRECTORY);
    console.log("Successfully located MD files...")

    mdFiles.forEach(mdFile => {
        console.log(`Attempting to convert ${mdFile}`)

        const siteFile = mdFile.toLowerCase()
            .replace(MD_DIRECTORY, WIKI_DIRECTORY)
            .replaceAll('_', '-')
            .replace('.md', '.html');

        const siteDir = siteFile.substring(0, siteFile.lastIndexOf('/'))

        if (!fs.existsSync(siteDir)) {
            fs.mkdirSync(siteDir, { recursive: true });
        }

        const entryTemplate = fs.readFileSync(ENTRY_TEMPLATE).toString();
        const document = new JSDOM(entryTemplate).window.document;

        const markdown = fs.readFileSync(mdFile).toString()
        const parsedHtml = converter.makeHtml(markdown);

        document.querySelector('section#main-content').innerHTML = parsedHtml;

        fs.writeFileSync(siteFile, formatHtml(document.documentElement.outerHTML));
    });

    console.log("Successfully created website pages!")
}

function locateMdFiles(directory) {
    const files = fs.readdirSync(directory);
    const mdFiles = [];

    files.forEach((file) => {
        const filePath = `${directory}/${file}`;
        const stats = fs.lstatSync(filePath);

        if (stats.isDirectory()) {
            mdFiles.push(locateMdFiles(filePath))
        } else if (file.endsWith('.md')) {
            mdFiles.push(filePath);
        }
    });

    return mdFiles;
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
        if (!isSelfClosing) isSelfClosing = strippedLine.match(/^<link/);

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

createWebsitePages();




