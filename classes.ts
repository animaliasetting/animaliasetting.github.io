import { MD_DIRECTORY, SITE_DIRECTORY } from "./generate";
import fs from "fs";

export class WikiFile {
    readonly fileName: string;
    readonly mdFilePath: string;
    public htmlFilePath: string;
    readonly categories: string[];

    constructor(path: string) {
        this.fileName = path
            .slice(path.lastIndexOf('/') + 1)
            .toLowerCase()
            .replace('.md', '.html');

        this.mdFilePath = path;

        this.htmlFilePath = path.toLowerCase()
            .slice(0, path.lastIndexOf('/'))
            .replaceAll(MD_DIRECTORY, SITE_DIRECTORY)
            .replaceAll('_', '-');

        this.categories = path.slice(5, path.lastIndexOf('/')).trim().split('/');
        console.log(this.categories)
    }

    createDirectoryIfNeeded() {
        if (!fs.existsSync(this.htmlFilePath)) {
            fs.mkdirSync(this.htmlFilePath, { recursive: true });
        }
    }
}