import {execSync} from "child_process";
import { readFile } from 'fs/promises';

const IN_DEVELOPMENT = true;
const BUMP_COMMIT_USERNAME = 'ci'
const BUMP_COMMIT_EMAIL = 'ci@rudydelorenzo.noreply.ca'

const getMatchInMessages = (messages, matchRegex) => {
    for (const message of messages) {
        if (matchRegex.test(message)) return true;
    }
}


if (!process.env.GITHUB_EVENT_PATH && !IN_DEVELOPMENT) {
    process.exit(1);
}

const commits = JSON.parse(
    await readFile(
        new URL(process.env.GITHUB_EVENT_PATH, import.meta.url)
    )
).commits;

execSync(`git config user.name ${BUMP_COMMIT_USERNAME}`)
execSync(`git config user.email ${BUMP_COMMIT_EMAIL}`)

const commitMessages = commits.map((commit) => commit.message)

console.log('commitMessages:')
console.log(commitMessages)

if (getMatchInMessages(commitMessages, /BREAKING/)) {
    console.log('BUMPING MAJOR')
    execSync('npm version major --force')
} else if (getMatchInMessages(commitMessages, /feat/)) {
    console.log('BUMPING MINOR')
    execSync('npm version minor --force')
} else {
    console.log('BUMPING PATCH')
    execSync('npm version patch --force')
}


console.log('PUSHING')
execSync('git push')
console.log('PUSHED')
