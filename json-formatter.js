import { readFile } from "node:fs/promises";

const filePath = process.argv[2];

function printError(message) {
  console.error(`error: ${message}`);
  process.exitCode = 1;
}

// Parse và format nội dung JSON
function formatJson(text, filePath) {
  let value;

  try {
    value = JSON.parse(text);
  } catch {
    printError(`invalid JSON in file: ${filePath}`);
    return null;
  }

  return JSON.stringify(value, null, 2);
}

async function main() {
  if (!filePath) {
    printError("please provide a JSON file path");
    return;
  }

  let text;

  try {
    text = await readFile(filePath, "utf8");
  } catch {
    printError(`could not read file: ${filePath}`);
    return;
  }

  const formattedJson = formatJson(text, filePath);
  if (formattedJson === null) return;
  console.log(formattedJson);
}

await main();