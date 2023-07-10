import {execSync} from "child_process";

const IN_DEVELOPMENT = true;

if (!process.env.GITHUB_EVENT_PATH && !IN_DEVELOPMENT) {
    process.exit(1);
}

const commits = (await import(`${process.env.GITHUB_EVENT_PATH}`))

console.log('commits:', commits)
console.log('commits:', commits.commits)

const commitHistory = execSync('git log').toString()

console.log('commitHistory', commitHistory)