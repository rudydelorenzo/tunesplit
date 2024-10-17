import {readFileSync, writeFileSync} from 'fs'
import { execSync } from "child_process";

// importing from JSON works but is unsupported, thus we read and parse
const j = JSON.parse(readFileSync('./package.json', 'utf-8'))

const VERSION = j.version

console.log('tagging docker image with: ', VERSION)

const imageId = execSync('docker image ls rdelorenzo/tunesplit:latest -q').toString().trim()

execSync(`docker tag ${imageId} rdelorenzo/tunesplit:${VERSION}`)
execSync(`docker push rdelorenzo/tunesplit:${VERSION}`, {stdio: "inherit"})
execSync(`docker push rdelorenzo/tunesplit:latest`, {stdio: "inherit"})