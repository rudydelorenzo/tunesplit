import {readFileSync, writeFileSync} from 'fs'
import {parse, stringify} from "yaml";
import * as j from '../package.json' assert {type: 'json'}

console.log('tagging docker image with: ', j.default.version)

const COMPOSE_FILE_LOCATION = './docker-compose.prod.yml'

const fileContents = readFileSync(COMPOSE_FILE_LOCATION, 'utf-8')

const fcy = parse(fileContents)

fcy.services.version_tag.image =
    fcy.services.version_tag.image.replace('0.0.0', j.default.version)

writeFileSync(COMPOSE_FILE_LOCATION, stringify(fcy))