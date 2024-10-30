import fs from 'fs';
import {WikiFile} from './classes.js';
import * as config from './config.js';

import {JSDOM} from 'jsdom';

import pkg from 'showdown';
const { Converter } = pkg;

const INDENT_SIZE = 4;
const converter = new Converter({
    ghCodeBlocks: true,
    underline: true,
    strikethrough: true,
    metadata: true,
    tasklists: true,
});

function generateSite() {
    const wikiFiles = locateMDFiles(config.MD_DIRECTORY);

    wikiFiles.forEach(wikiFile => {
        wikiFile.createDirectoryIfNeeded();
        const fullFilePath = `${wikiFile.htmlFilePath}${wikiFile.fileName}`;

        const entryTemplate = fs.readFileSync(config.ENTRY_TEMPLATE).toString();
        const document = new JSDOM(entryTemplate).window.document;

        addParsedMarkdown(document, wikiFile);
        addTableOfContents(document);
        addSuggestedEntries(document, wikiFile);

        let formattedHtml = correctStructure(document, wikiFile);
        // Interacting with the DOM screws up whitespace when adding elements, so if
        // we're outside GitHub actions we correct it to be easily human-readable
        if (!process.env.GITHUB_ACTIONS) formattedHtml = correctWhitespaceOld(formattedHtml);

        fs.writeFileSync(fullFilePath, formattedHtml);
    });

    fs.cpSync(`${config.SRC_DIRECTORY}css`, `${config.SITE_DIRECTORY}css`, { recursive: true });
    fs.cpSync(`${config.SRC_DIRECTORY}img`, `${config.SITE_DIRECTORY}img`, { recursive: true });
    fs.cpSync(`${config.SRC_DIRECTORY}js`, `${config.SITE_DIRECTORY}js`, { recursive: true });
}

function locateMDFiles(directory) {
    const pathsInDirectory = fs.readdirSync(directory);
    const wikiFiles = [];

    pathsInDirectory.forEach(path => {
        const filePath = `${directory}${path}`;
        const stats = fs.lstatSync(filePath);

        if (stats.isDirectory()) {
            wikiFiles.push(...locateMDFiles(`${filePath}/`));
        } else if (filePath.endsWith('.md')) {
            wikiFiles.push(new WikiFile(filePath));
        }
    });

    return wikiFiles;
}

function addParsedMarkdown(document, wikiFile) {
    const markdown = fs.readFileSync(wikiFile.mdFilePath).toString();
    const convertedMarkdown = converter.makeHtml(markdown).toString();

    const mainContent = document.querySelector('section#main-content');

    if (mainContent) {
        mainContent.innerHTML = convertedMarkdown;
    } else {
        console.error('Failed to find the main-content section.');
        process.exit(1);
    }
}

function addTableOfContents(document) {
    const headers = document.querySelectorAll('h1, h2, h3');
    const sidebar = document.querySelector('ul#table-of-contents');

    if (sidebar && headers) {
        headers.forEach(element => {
            const listItem = document.createElement('li');
            const headerAnchor = document.createElement('a');

            headerAnchor.textContent = element.textContent;
            headerAnchor.setAttribute('href', `#${element.id}`);
            listItem.appendChild(headerAnchor);

            sidebar.appendChild(listItem);
        });
    } else {
        console.error('Failed to find headers / sidebar section.');
        process.exit(1);
    }
}

function addSuggestedEntries(document, wikiFile) {
  // TODO document why this function 'addSuggestedEntries' is empty
}

function correctStructure(document, wikiFile) {
    let escapePaths = '../'.repeat(wikiFile.categories.length);

    document.querySelectorAll('link').forEach(element => {
        const href = element.getAttribute('href');
        element.setAttribute('href', escapePaths + href);
    })

    document.querySelectorAll('script').forEach(element => {
        const src = element.getAttribute('src');
        element.setAttribute('src', escapePaths + src);
    })

    return `<!DOCTYPE html>\n${document.documentElement.outerHTML}`;
}

function correctWhitespace(html) {
    return html.split('\n').filter(line => Boolean(line.replaceAll(' ', ''))).join('\n');
}

function correctWhitespaceOld(html) {
    let formattedHtml = html.replace(/(<\/\w+>)(<\w+)/g, '$1\n$2');

    let indentLevel = 0;

    formattedHtml = formattedHtml.split('\n').map((line, index) => {
        line = line.trim();
        let strippedLine = line.replaceAll(' ', '');

        // First line is always the doctype tag, which isn't technically
        // self-closing but is still a tag, so we ignore it manually
        if (index === 0) return line;

        const isSelfClosing = /^<([a-z][a-z0-9]*)>.*<\/\1>$/.test(strippedLine);
        const isSpecialTag =  /^(<meta|<link)/.test(strippedLine);

        if (isSelfClosing || isSpecialTag) {
            const indent = ' '.repeat(INDENT_SIZE * indentLevel);
            return indent + line;
        }

        const hasOpeningTag = /^<[a-z][a-z0-9]*(.*?)>.*$/.test(strippedLine);
        const hasClosingTag = /^.*<\/[a-z][a-z0-9]*(.*?)>$/.test(strippedLine);

        if (hasClosingTag)  indentLevel -= 1;
        const indent = ' '.repeat(INDENT_SIZE * indentLevel);
        if (hasOpeningTag) indentLevel += 1;

        return `${indent}${line}`;
    }).join('\n');

    return formattedHtml;
}

generateSite();