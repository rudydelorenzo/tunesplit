import express from "express";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { zipDirectory } from "./zipDirectory.js";
import * as fs from "fs";
import { schedule } from "node-cron";
import { customSpawnSync } from "./spawnSync.js";
import expressWs from "express-ws";
import { MessageType, ProgressMessageType } from "./typesBackend.js";
import { fileTypeFromBuffer } from "file-type";

const UPLOAD_FOLDER_NAME = "uploads";
const SPLEETER_OUTPUT_DIR = "demucs_output";
const ZIP_OUTPUT_FOLDER_NAME = "zipped_output";
const MODEL_NAME = "htdemucs";

const SPLEETER_MODES = {
    TWO_STEMS: "--two-stems vocals",
    FOUR_STEMS: "",
} as const;

const ENV = process.env.ENVIRONMENT || "development";
const USE_GPU = process.env.USE_GPU === "true" || false;
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

const { app } = expressWs(express());

const getBaseFileName = (fullname: string): string => path.parse(fullname).name;

const split = async (
    filePath: string,
    logCallback?: (s: string) => unknown
): Promise<string> => {
    const SPLEETER_RESULT_FOLDER_NAME = getBaseFileName(filePath);

    log("START SPLITTING...");

    // demucs --two-stem vocals -d cpu -n htdemucs --clip-mode rescale -o "spleeter_output" "Joel Corry - HISTORY.flac"

    const flags: string[] = USE_GPU ? [] : [
        "-d",
        "cpu",
    ];

    flags.push(...[
        "-n",
        MODEL_NAME,
        "--clip-mode",
        "rescale",
        ...SPLEETER_MODES.TWO_STEMS.split(" "),
        "-o",
        `${SPLEETER_OUTPUT_DIR}`,
        `"${filePath}"`,
    ])

    await customSpawnSync(`demucs`, flags, {}, logCallback);

    log("FINISHED SPLITTING");

    // delete original uploaded file
    fs.rmSync(filePath, { recursive: true, force: true });

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

// WS Route
app.ws("/separate", (ws, req) => {
    ws.binaryType = "arraybuffer";
    try {
        const requestIp =
            req.headers["x-real-ip"] ??
            req.headers["x-forwarded-for"] ??
            req.socket.remoteAddress;
        log(`REQUEST: ${requestIp}`);

        ws.on("message", async (msg: ArrayBuffer | string) => {
            if (msg instanceof ArrayBuffer) {
                // handle file
                const path = `${UPLOAD_FOLDER_NAME}/`;
                if (!fs.existsSync(path))
                    fs.mkdirSync(path, { recursive: true });

                const filenameToConvert = `${uuidv4()}.${
                    (await fileTypeFromBuffer(msg))?.ext
                }`;

                log(filenameToConvert);

                const fullFilePathToConvert = `${path}${filenameToConvert}`;

                fs.appendFileSync(fullFilePathToConvert, new Uint8Array(msg));

                const logCallback = (s: string) => {
                    const matches = s.match(/\d+(?:\.\d+)?%/);
                    if (matches) {
                        try {
                            const num = parseFloat(
                                matches[matches.length - 1].slice(0, -1)
                            );
                            const progressUpdate: ProgressMessageType = {
                                type: "progress",
                                progress: num,
                            };
                            ws.send(JSON.stringify(progressUpdate));
                        } catch (e) {
                            log("ERROR PARSING NUMBER FROM LOG");
                        }
                    }
                };

                const fileToDownload = await split(
                    fullFilePathToConvert,
                    logCallback
                );

                const arrayBufferToReturn: ArrayBuffer =
                    fs.readFileSync(fileToDownload);

                log(`SERVING DOWNLOAD FOR ${fileToDownload}...`);
                ws.send(arrayBufferToReturn);

                fs.rmSync(fileToDownload, { recursive: true, force: true });
                log("DONE SERVING. REMOVED OUTPUT ZIP");
            } else {
                const message: MessageType = JSON.parse(msg);
                console.log(message);
            }
        });
    } catch (e) {
        ws.close(1);
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
