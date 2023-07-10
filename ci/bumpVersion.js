import {execSync} from "child_process";
import { readFile } from 'fs/promises';

const IN_DEVELOPMENT = true;

if (!process.env.GITHUB_EVENT_PATH && !IN_DEVELOPMENT) {
    process.exit(1);
}

const commits = JSON.parse(
    await readFile(
        new URL(process.env.GITHUB_EVENT_PATH, import.meta.url)
    )
);

console.log('commits:', commits)
console.log('commits:', commits.commits)

const commitHistory = execSync('git log').toString()

console.log('commitHistory', commitHistory)