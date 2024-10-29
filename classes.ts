import { MD_DIRECTORY, SITE_DIRECTORY } from "./generate";
import fs from "fs";

export class WikiFile {
    readonly fileName: string;
    readonly mdFilePath: string;
    public htmlFilePath: string;
    readonly categories: string[];

    constructor(path: string) {
        this.fileName = path.toLowerCase()
            .slice(path.lastIndexOf('/') + 1)
            .replace('.md', '.html');

        this.mdFilePath = path;

        this.htmlFilePath = path.toLowerCase()
            .slice(0, path.lastIndexOf('/') + 1)
            .replaceAll(MD_DIRECTORY, SITE_DIRECTORY)
            .replaceAll('_', '-');

        this.categories = this.htmlFilePath
            .slice(this.htmlFilePath.indexOf('/'))
            .split('/').filter(Boolean);
    }

    createDirectoryIfNeeded() {
        if (!fs.existsSync(this.htmlFilePath)) {
            fs.mkdirSync(this.htmlFilePath, { recursive: true });
        }
    }
}