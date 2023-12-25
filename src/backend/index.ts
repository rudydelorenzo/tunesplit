import express from "express";
import multer from "multer";
import { execSync } from "child_process";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { zipDirectory } from "./zipDirectory.js";
import * as fs from "fs";
import { schedule } from "node-cron";

const UPLOAD_FOLDER_NAME = "uploads";
const SPLEETER_OUTPUT_DIR = "demucs_output";
const ZIP_OUTPUT_FOLDER_NAME = "zipped_output";
const MODEL_NAME = "htdemucs";

const SPEETER_MODES = {
    TWO_STEMS: "--two-stems vocals",
    FOUR_STEMS: "",
} as const;

const ENV = process.env.ENVIRONMENT || "development";
const backendPort = process.env.PORT || 3003;

console.log("env = " + ENV);

const log = (message?: unknown, ...optionalParams: unknown[]): void => {
    if (ENV !== "production") {
        if (optionalParams) {
            console.log(message, optionalParams);
        } else {
            console.log(message);
        }
    }
};

const app = express();

const storage = multer.diskStorage({
    destination: function (_req, _file, cb) {
        const path = `${UPLOAD_FOLDER_NAME}/`;
        fs.mkdirSync(path, { recursive: true });
        cb(null, path);
    },
    filename: function (_req, file, cb) {
        cb(null, uuidv4() + path.extname(file.originalname)); //Appending .jpg
    },
});

const upload = multer({ storage: storage });

const getBaseFileName = (fullname: string): string => path.parse(fullname).name;

const split = async (file: Express.Multer.File): Promise<string> => {
    const SPLEETER_RESULT_FOLDER_NAME = getBaseFileName(file.filename);

    log("START SPLITTING...");

    // demucs --two-stem vocals -d cpu -n htdemucs --clip-mode rescale -o "spleeter_output" "Joel Corry - HISTORY.flac"

    execSync(
        `demucs -d cpu -n ${MODEL_NAME} --clip-mode rescale ${SPEETER_MODES.TWO_STEMS} -o ${SPLEETER_OUTPUT_DIR} "${file.path}"`,
        {
            stdio: ENV !== "production" ? "inherit" : "ignore",
        }
    );

    // delete original uploaded file
    fs.rmSync(file.path, { recursive: true, force: true });

    log(`DONE SPLITTING`);

    const FULL_SPLEETER_RESULT_DIR = `${SPLEETER_OUTPUT_DIR}/${MODEL_NAME}/${SPLEETER_RESULT_FOLDER_NAME}`;

    log(`\tFOLDER NAME: ${SPLEETER_RESULT_FOLDER_NAME}`);
    log(`\tFULL OUTPUT DIR: ${FULL_SPLEETER_RESULT_DIR}`);

    log("START ZIPPING...");

    if (!fs.existsSync(ZIP_OUTPUT_FOLDER_NAME)) {
        fs.mkdirSync(ZIP_OUTPUT_FOLDER_NAME, { recursive: true });
    }

    const ZIP_OUTPUT_PATH = `${ZIP_OUTPUT_FOLDER_NAME}/${SPLEETER_RESULT_FOLDER_NAME}.zip`;

    await zipDirectory(FULL_SPLEETER_RESULT_DIR, ZIP_OUTPUT_PATH);

    // delete folder with outputted spleeter stems
    fs.rmSync(FULL_SPLEETER_RESULT_DIR, { recursive: true, force: true });

    log("DONE ZIPPING");

    return ZIP_OUTPUT_PATH;
};

app.listen(backendPort, () =>
    console.log(`Listening on http://localhost:${backendPort}`)
);

app.use(express.static("dist/frontend"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// create a GET route
app.post(`/convert`, upload.array("files"), async (req, res) => {
    try {
        const requestIp =
            req.headers["x-real-ip"] ??
            req.headers["x-forwarded-for"] ??
            req.socket.remoteAddress;
        log(`REQUEST: ${requestIp}`);
        const files = req.files;

        const filesToDownload: string[] = [];

        if (files && files instanceof Array) {
            for (const file of files) {
                filesToDownload.push(await split(file));
            }
        }

        for (const path of filesToDownload) {
            log(`SERVING DOWNLOAD FOR ${path}...`);
            res.download(path, (_err) => {
                fs.rmSync(path, { recursive: true, force: true });
                log("DONE SERVING. REMOVED OUTPUT ZIP");
            });
        }
    } catch (e) {
        res.sendStatus(500);
    }

    return;
});

// 5 minutes
const MAX_FILE_AGE_MINUTES = 5;

const removeFilesIfOlder = (folder: string, age: number): void => {
    try {
        fs.readdirSync(folder).forEach((file) => {
            const isOlder =
                fs.statSync(`${folder}/${file}`).ctime.getTime() <
                Date.now() - age * 60 * 1000; // 604800000 = 7 * 24 * 60 * 60 * 1000

            if (isOlder) {
                fs.unlinkSync(`${folder}/${file}`);
            }
        });
    } catch (e) {
        log(`DIRECTORY ${folder} DOES NOT EXIST`);
    }
};

const sweepAllDirectories = () => {
    log("CLEANING DIRECTORIES");

    removeFilesIfOlder(UPLOAD_FOLDER_NAME, MAX_FILE_AGE_MINUTES);
    removeFilesIfOlder(ZIP_OUTPUT_FOLDER_NAME, MAX_FILE_AGE_MINUTES);
    removeFilesIfOlder(SPLEETER_OUTPUT_DIR, MAX_FILE_AGE_MINUTES);

    log("DONE CLEANING DIRECTORIES");
};

schedule("*/10 * * * *", () => {
    sweepAllDirectories();
});
