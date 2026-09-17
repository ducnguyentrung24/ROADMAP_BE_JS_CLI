import { readFile } from "node:fs/promises";
import path from "node:path";

const filePath = process.argv[2];

function printError(message) {
    console.error(`error: ${message}`);
    process.exitCode = 1;
}

function getFileStats(text) {
    return {
        lines: text.length === 0 ? 0 : text.split(/\r?\n/).length,
        words: text.trim().split(/\s+/).filter(Boolean).length,
        characters: text.length,
    };
}

async function main() {
    if (!filePath) {
        printError("please provide a file path");
        return;
    }

    let text;

    try {
        text = await readFile(filePath, "utf8");
    } catch {
        printError(`could not read file: ${filePath}`);
        return;
    }

    const stats = getFileStats(text);

    console.log(`File: ${path.basename(filePath)}`);
    console.log(`Lines: ${stats.lines}`);
    console.log(`Words: ${stats.words}`);
    console.log(`Characters: ${stats.characters}`);
}

await main();