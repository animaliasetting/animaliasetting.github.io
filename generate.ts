import fs from 'fs';
import { WikiFile } from './classes';
import { JSDOM } from 'jsdom';
import { Stats } from "node:fs";
import { Converter } from "showdown";

export const SITE_DIRECTORY: string = 'site/';
export const MD_DIRECTORY: string = 'md/';

const ENTRY_TEMPLATE: string = 'site/html/entry-template.html';

const INDENT_SIZE: number = 4;
const converter: Converter = new Converter({
    ghCodeBlocks: true,
    underline: true,
    strikethrough: true,
    metadata: true,
    tasklists: true
});

function generateSite(): void {
    console.log("Beginning website creation...");

    const wikiFiles: WikiFile[] = locateMDFiles(MD_DIRECTORY);

    console.log("Located MD files, generating pages.");

    wikiFiles.forEach(wikiFile => {
        wikiFile.createDirectoryIfNeeded();

        const entryTemplate: string = fs.readFileSync(ENTRY_TEMPLATE).toString();
        const document: Document = new JSDOM(entryTemplate).window.document;

        addParsedMarkdown(document, wikiFile);
        addTableOfContents(document, wikiFile);
        addSuggestedEntries(document, wikiFile);

        // Interacting with the DOM screws up formatting when adding elements, so if
        // we're outside GitHub actions we correct it to be easily human-readable
        if (process.env.GITHUB_ACTIONS) correctFormatting(document);

        const fullFilePath = `${wikiFile.htmlFilePath}/${wikiFile.fileName}`;
        fs.writeFileSync(fullFilePath, document.documentElement.outerHTML);
    });
}

function locateMDFiles(directory: string) {
    const pathsInDirectory: string[] = fs.readdirSync(directory);
    const wikiFiles: WikiFile[] = [];

    pathsInDirectory.forEach(path => {
        const filePath: string = `${directory}/${path}`;
        const stats: Stats = fs.lstatSync(filePath);

        if (stats.isDirectory()) {
            wikiFiles.push(...locateMDFiles(filePath));
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
        console.error('Failed to find the main-content section, was the ID changed?');
        process.exit(1);
    }
}

function addTableOfContents(document: Document, wikiFile: WikiFile): void {
    const headers: NodeListOf<Element> = document.querySelectorAll('h1, h2, h3');
    const sidebar: Element | null = document.querySelector('section#left-sidebar');

    if (sidebar && headers) {
        headers.forEach(element => {
            const sidebarLink = document.createElement('p');
            sidebarLink.textContent = element.textContent || 'CONTACT MACHIE :3';

            sidebar.appendChild(sidebarLink);
        });
    } else {
        console.error('Failed to find headers / sidebar section, was the ID changed?');
        process.exit(1);
    }
}

function addSuggestedEntries(document: Document, wikiFile: WikiFile): void {

}

function correctFormatting(document: Document): void {
    let indentLevel: number = 0;

    let formatted: string = `<!DOCTYPE html>\n${document.documentElement.outerHTML}`;
    formatted = formatted.replaceAll('><', '>\n<');

    formatted = formatted.split('\n').map((line, index) => {
        line = line.trim().replaceAll(' ', '');

        // First line is always the doctype tag, which isn't technically
        // self-closing but is still a tag, so we ignore it manually
        if (index === 0) return line;

        const isSelfClosing: boolean = RegExp(/^<([a-z][a-z0-9]*)>.*<\/\1>$/).exec(line) != null;
        const isSpecialTag: boolean = RegExp(/^(<meta|<link)/).exec(line) != null;

        if (isSelfClosing || isSpecialTag) {
            const indent = ' '.repeat(INDENT_SIZE * indentLevel);
            return indent + line;
        }

        const hasOpeningTag: boolean = RegExp(/^<[a-z][a-z0-9]*(.*?)>.*$/).exec(line) != null;
        const hasClosingTag: boolean = RegExp(/^.*<\/[a-z][a-z0-9]*(.*?)>$/).exec(line) != null;

        if (hasClosingTag)  indentLevel -= 1;
        const indent = ' '.repeat(INDENT_SIZE * indentLevel);
        if (hasOpeningTag) indentLevel += 1;

        return `${indent}${line}`;
    }).join('\n');

    document.documentElement.outerHTML = formatted;
}

generateSite();



