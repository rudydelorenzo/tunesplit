import { execSync } from "child_process";
import { readFile } from 'fs/promises';

const IN_DEVELOPMENT = false;
const BUMP_COMMIT_USERNAME = 'GitHub Actions'
const BUMP_COMMIT_EMAIL = 'ci@rudydelorenzo.noreply.ca'

const bump = (type) => {
    // use --force option if "dirty working tree" errors
    execSync(`npm version ${type} -m "Bump to v%s"`)
}

const getMatchInMessages = (messages, matchRegex) => {
    for (const message of messages) {
        if (matchRegex.test(message)) return true;
    }
}

// Check that GitHub ENV variables are present
if (!process.env.GITHUB_EVENT_PATH && !IN_DEVELOPMENT) {
    process.exit(1);
}

// Begin script logic proper

// SET USER AND EMAIL
// use --replace-all flag if errors
execSync(`git config user.name "${BUMP_COMMIT_USERNAME}"`).toString()
execSync(`git config user.email "${BUMP_COMMIT_EMAIL}"`).toString()

const commits = JSON.parse(
    await readFile(
        new URL(process.env.GITHUB_EVENT_PATH, import.meta.url)
    )
).commits;

if (!commits) {
    console.log('NO COMMITS, SKIPPING BUMP AND PUSH')
    process.exit(0)
}

console.log(commits)

const commitMessages = commits.map((commit) => commit.message)

console.log('Commit Messages:')
console.log(commitMessages)

if (getMatchInMessages(commitMessages, /BREAKING/)) {
    console.log('BUMPING MAJOR')
    bump('major')
} else if (getMatchInMessages(commitMessages, /feat:/)) {
    console.log('BUMPING MINOR')
    bump('minor')
} else {
    console.log('BUMPING PATCH')
    bump('patch')
}

console.log('PUSHING')
execSync('git push')
console.log('PUSHED')
