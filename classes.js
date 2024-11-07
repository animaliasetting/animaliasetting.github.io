import fs from 'fs';
import * as config from './config.js';

export class WikiFile {
    constructor(path) {
        this.fileName = path.toLowerCase()
            .slice(path.lastIndexOf('/') + 1)
            .replace('.md', '.html');

        this.mdFilePath = path;

        this.htmlFilePath = path.toLowerCase()
            .slice(0, path.lastIndexOf('/') + 1)
            .replaceAll(config.MD_DIRECTORY, config.SITE_DIRECTORY)
            .replaceAll('_', '-');

        this.categories = this.htmlFilePath
            .slice(this.htmlFilePath.indexOf('/'))
            .split('/').filter(Boolean);

        this.title = this.fileName
            .replace('.html', '')
            .replace('_', ' ')
            .replace(/\b\w/g, l => l.toUpperCase());
        if (this.title === "Index") this.title = `${this.title} - ${this.categories.pop()}`
    }

    createDirectoryIfNeeded() {
        if (!fs.existsSync(this.htmlFilePath)) {
            fs.mkdirSync(this.htmlFilePath, { recursive: true });
        }
    }
}