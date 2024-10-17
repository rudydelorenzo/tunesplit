import {readFileSync, writeFileSync} from 'fs'
import {parse, stringify} from "yaml";

// importing from JSON works but is unsupported, thus we read and parse
const j = JSON.parse(readFileSync('./package.json', 'utf-8'))

console.log('tagging docker image with: ', j.version)

const COMPOSE_FILE_LOCATION = './docker-compose.prod.yml'

const fileContents = readFileSync(COMPOSE_FILE_LOCATION, 'utf-8')

const fcy = parse(fileContents)

fcy.services.version_tag.image =
    fcy.services.version_tag.image.replace('0.0.0', j.version)

writeFileSync(COMPOSE_FILE_LOCATION, stringify(fcy))