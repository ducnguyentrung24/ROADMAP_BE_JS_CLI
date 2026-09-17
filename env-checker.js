const requiredNames = process.argv.slice(2);

function printError(message) {
    console.error(`error: ${message}`);
    process.exitCode = 1;
}

function getMissingNames(names) {
    return names.filter((name) => !process.env[name]);
}

function printSuccess(names) {
    for (const name of names) {
        console.log(`Set: ${name}`);
    }

    console.log("All required environment variables are set.");
}

function main() {
    if (requiredNames.length === 0) {
        printError("please provide at least one environment variable name");
        return;
    }

    const missingNames = getMissingNames(requiredNames);

    if (missingNames.length > 0) {
        printError(`missing environment variables: ${missingNames.join(", ")}`);
        return;
    }

    printSuccess(requiredNames);
}

main();