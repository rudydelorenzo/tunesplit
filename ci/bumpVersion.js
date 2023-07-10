import {execSync} from "child_process";
import { readFile } from 'fs/promises';

const IN_DEVELOPMENT = true;
const BUMP_COMMIT_USERNAME = 'GitHub Actions'
const BUMP_COMMIT_EMAIL = 'ci@rudydelorenzo.noreply.ca'

const bump = (type) => {
    execSync(`npm version ${type} -m "Bump to v%s" --force`)
}

const getMatchInMessages = (messages, matchRegex) => {
    for (const message of messages) {
        if (matchRegex.test(message)) return true;
    }
}

if (!process.env.GITHUB_EVENT_PATH && !IN_DEVELOPMENT) {
    process.exit(1);
}

// Begin script logic proper

// SET USER AND EMAIL
execSync(`git config user.name "${BUMP_COMMIT_USERNAME}" --replace-all`).toString()
execSync(`git config user.email "${BUMP_COMMIT_EMAIL}" --replace-all`).toString()

const commits = JSON.parse(
    await readFile(
        new URL(process.env.GITHUB_EVENT_PATH, import.meta.url)
    )
).commits;

const commitMessages = commits.map((commit) => commit.message)

console.log('commitMessages:')
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
