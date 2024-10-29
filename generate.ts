import fs from 'fs';
import { WikiFile } from './classes';
import { JSDOM } from 'jsdom';
import { Stats } from "node:fs";
import { Converter } from "showdown";
import path from "node:path";

export const SITE_DIRECTORY: string = 'site/';
export const SRC_DIRECTORY: string = 'src/';
export const MD_DIRECTORY: string = 'md/';

const ENTRY_TEMPLATE: string = 'src/entry-template.html';

const INDENT_SIZE: number = 4;
const converter: Converter = new Converter({
    ghCodeBlocks: true,
    underline: true,
    strikethrough: true,
    metadata: true,
    tasklists: true,
});

function generateSite(): void {
    const wikiFiles: WikiFile[] = locateMDFiles(MD_DIRECTORY);

    wikiFiles.forEach(wikiFile => {
        wikiFile.createDirectoryIfNeeded();
        const fullFilePath: string = `${wikiFile.htmlFilePath}${wikiFile.fileName}`;

        const entryTemplate: string = fs.readFileSync(ENTRY_TEMPLATE).toString();
        const document: Document = new JSDOM(entryTemplate).window.document;

        addParsedMarkdown(document, wikiFile);
        addTableOfContents(document);
        addSuggestedEntries(document, wikiFile);

        let formattedHtml: string = correctStructure(document, wikiFile);
        // Interacting with the DOM screws up whitespace when adding elements, so if
        // we're outside GitHub actions we correct it to be easily human-readable
        if (!process.env.GITHUB_ACTIONS) formattedHtml = correctWhitespace(formattedHtml);

        fs.writeFileSync(fullFilePath, formattedHtml);
    });

    fs.cpSync(`${SRC_DIRECTORY}css`, `${SITE_DIRECTORY}css`, { recursive: true });
    fs.cpSync(`${SRC_DIRECTORY}img`, `${SITE_DIRECTORY}img`, { recursive: true });

    fs.readdirSync(`${SRC_DIRECTORY}js`).forEach(file => {
        if (file.endsWith('.js')) {
            const srcPath = path.join(SRC_DIRECTORY, 'js', file);
            const destPath = path.join(SITE_DIRECTORY, 'js', file);
            fs.copyFileSync(srcPath, destPath);
        }
    })
}

function locateMDFiles(directory: string) {
    const pathsInDirectory: string[] = fs.readdirSync(directory);
    const wikiFiles: WikiFile[] = [];

    pathsInDirectory.forEach(path => {
        const filePath: string = `${directory}${path}`;
        const stats: Stats = fs.lstatSync(filePath);

        if (stats.isDirectory()) {
            wikiFiles.push(...locateMDFiles(`${filePath}/`));
        } else if (filePath.endsWith('.md')) {
            wikiFiles.push(new WikiFile(filePath));
        }
    });

    return wikiFiles;
}

function addParsedMarkdown(document: Document, wikiFile: WikiFile): void {
    const markdown: string = fs.readFileSync(wikiFile.mdFilePath).toString();
    const convertedMarkdown: string = converter.makeHtml(markdown).toString();

    const mainContent: Element | null = document.querySelector('section#main-content');

    if (mainContent) {
        mainContent.innerHTML = convertedMarkdown;
    } else {
        console.error('Failed to find the main-content section.');
        process.exit(1);
    }
}

function addTableOfContents(document: Document): void {
    const headers: NodeListOf<Element> = document.querySelectorAll('h1, h2, h3');
    const sidebar: Element | null = document.querySelector('section#left-sidebar');

    if (sidebar && headers) {
        headers.forEach(element => {
            const sidebarLink: HTMLParagraphElement = document.createElement('p');
            sidebarLink.textContent = element.textContent ?? 'ERROR - SHOW MACHIE';

            sidebar.appendChild(sidebarLink);
        });
    } else {
        console.error('Failed to find headers / sidebar section.');
        process.exit(1);
    }
}

function addSuggestedEntries(document: Document, wikiFile: WikiFile): void {
  // TODO document why this function 'addSuggestedEntries' is empty
}

function correctStructure(document: Document, wikiFile: WikiFile): string {
    let escapePaths = '../'.repeat(wikiFile.categories.length);

    document.querySelectorAll('link[rel="stylesheet"]').forEach(element => {
        const href: string | null = element.getAttribute('href');
        element.setAttribute('href', escapePaths + href);
    })

    document.querySelectorAll('script').forEach(element => {
        const src: string | null = element.getAttribute('src');
        element.setAttribute('src', escapePaths + src);
    })

    return `<!DOCTYPE html>\n${document.documentElement.outerHTML}`;
}

function correctWhitespace(html: string): string {
    let formattedHtml: string = html.replaceAll(/<\/[^>]+><[^/]/g, '>\n<');
    let indentLevel: number = 0;

    formattedHtml = formattedHtml.split('\n').map((line, index) => {
        line = line.trim();
        let strippedLine: string = line.replaceAll(' ', '');

        // First line is always the doctype tag, which isn't technically
        // self-closing but is still a tag, so we ignore it manually
        if (index === 0) return line;

        const isSelfClosing: boolean = /^<([a-z][a-z0-9]*)>.*<\/\1>$/.test(strippedLine);
        const isSpecialTag: boolean =  /^(<meta|<link)/.test(strippedLine);

        if (isSelfClosing || isSpecialTag) {
            const indent: string = ' '.repeat(INDENT_SIZE * indentLevel);
            return indent + line;
        }

        const hasOpeningTag: boolean = /^<[a-z][a-z0-9]*(.*?)>.*$/.test(strippedLine);
        const hasClosingTag: boolean = /^.*<\/[a-z][a-z0-9]*(.*?)>$/.test(strippedLine);

        if (hasClosingTag)  indentLevel -= 1;
        const indent = ' '.repeat(INDENT_SIZE * indentLevel);
        if (hasOpeningTag) indentLevel += 1;

        return `${indent}${line}`;
    }).join('\n');

    return formattedHtml;
}

generateSite();



