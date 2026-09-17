const username = process.argv[2];

function printError(message) {
    console.error(`error: ${message}`);
    process.exitCode = 1;
}

async function fetchGitHubActivity(username) {
    const url = `https://api.github.com/users/${encodeURIComponent(
        username
    )}/events`;

    let response;

    try {
        response = await fetch(url, {
        headers: {
            Accept: "application/vnd.github+json",
            "User-Agent": "github-activity-cli",
        },
        });
    } catch {
        printError("could not reach GitHub");
        return null;
    }

    let data;

    try {
        data = await response.json();
    } catch {
        printError("could not read GitHub response");
        return null;
    }

    if (response.status === 404) {
        printError(`GitHub user not found: ${username}`);
        return null;
    }

    if (!response.ok) {
        printError(
        data?.message ||
            `GitHub request failed with status ${response.status}`
        );

        return null;
    }

    return data;
}

function getRepositoryName(event) {
    return event.repo?.name || "an unknown repository";
}

function formatEvent(event) {
    const repository = getRepositoryName(event);

    switch (event.type) {
        case "PushEvent": {
        const commitCount = event.payload?.size || 0;
        const commitText = commitCount === 1 ? "commit" : "commits";

        return `Pushed ${commitCount} ${commitText} to ${repository}`;
        }

        case "IssuesEvent": {
        const action = event.payload?.action || "updated";
        return `${capitalize(action)} an issue in ${repository}`;
        }

        case "IssueCommentEvent": {
        const action = event.payload?.action || "created";
        return `${capitalize(action)} a comment on an issue in ${repository}`;
        }

        case "WatchEvent":
        return `Starred ${repository}`;

        case "ForkEvent":
        return `Forked ${repository}`;

        case "CreateEvent":
        return `Created ${event.payload?.ref_type || "a resource"} in ${repository}`;

        case "DeleteEvent":
        return `Deleted ${event.payload?.ref_type || "a resource"} in ${repository}`;

        case "PullRequestEvent": {
        const action = event.payload?.action || "updated";
        return `${capitalize(action)} a pull request in ${repository}`;
        }

        case "PullRequestReviewEvent": {
        const action = event.payload?.action || "submitted";
        return `${capitalize(action)} a pull request review in ${repository}`;
        }

        case "ReleaseEvent": {
        const action = event.payload?.action || "published";
        return `${capitalize(action)} a release in ${repository}`;
        }

        case "PublicEvent":
        return `Made ${repository} public`;

        default:
        return `${event.type.replace("Event", "")} activity in ${repository}`;
    }
}

function capitalize(text) {
    return text.charAt(0).toUpperCase() + text.slice(1);
}

function printActivity(events) {
    if (events.length === 0) {
        console.log("No recent activity found.");
        return;
    }

    for (const event of events) {
        console.log(`- ${formatEvent(event)}`);
    }
}

async function main() {
    if (!username) {
        printError("please provide a GitHub username");
        return;
    }

    const events = await fetchGitHubActivity(username);

    if (!events) {
        return;
    }

    printActivity(events);
}

await main();