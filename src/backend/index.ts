import express from "express";
import multer from "multer";
import { execSync } from "child_process";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { zipDirectory } from "./zipDirectory.js";
import * as fs from "fs";
import { schedule } from "node-cron";

const UPLOAD_FOLDER_NAME = "uploads";
const SPLEETER_OUTPUT_DIR = "spleeter_output";
const ZIP_OUTPUT_FOLDER_NAME = "zipped_output";

const app = express();
const backendPort = process.env.PORT || 3003;

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
  execSync(
    `spleeter separate -p spleeter:2stems -o ${SPLEETER_OUTPUT_DIR} ${file.path}`
  );

  console.log("FINISHED CONVERSION");
  // delete original uploaded file
  fs.rmSync(file.path, { recursive: true, force: true });

  const FOLDER_NAME = getBaseFileName(file.filename);

  console.log(`FOLDER NAME: ${FOLDER_NAME}`);

  const OUTPUT_DIR = `${SPLEETER_OUTPUT_DIR}/${FOLDER_NAME}`;

  if (!fs.existsSync(ZIP_OUTPUT_FOLDER_NAME)) {
    fs.mkdirSync(ZIP_OUTPUT_FOLDER_NAME, { recursive: true });
  }

  const ZIP_OUTPUT_PATH = `${ZIP_OUTPUT_FOLDER_NAME}/${FOLDER_NAME}.zip`;

  await zipDirectory(OUTPUT_DIR, ZIP_OUTPUT_PATH);

  console.log("DONE ZIPPING");
  // delete folder with outputted stuffs
  fs.rmSync(OUTPUT_DIR, { recursive: true, force: true });

  return ZIP_OUTPUT_PATH;
};

app.listen(backendPort, () => console.log(`Listening on port ${backendPort}`));

app.use(express.static("dist/frontend"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// create a GET route
app.post(`/convert`, upload.array("files"), async (req, res) => {
  try {
    console.log("RECEIVED FILE");
    const files = req.files;

    const filesToDownload: string[] = [];

    if (files && files instanceof Array) {
      for (const file of files) {
        filesToDownload.push(await split(file));
      }
    }

    for (const path of filesToDownload) {
      console.log(`SENT RESPONSE WITH PATH ${path}`);
      res.download(path, (_err) => {
        fs.rmSync(path, { recursive: true, force: true });
        console.log("REMOVED OUTPUT ZIP");
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
  fs.readdirSync(folder).forEach((file) => {
    const isOlder =
      fs.statSync(`${folder}/${file}`).ctime.getTime() <
      Date.now() - age * 60 * 1000; // 604800000 = 7 * 24 * 60 * 60 * 1000

    if (isOlder) {
      fs.unlinkSync(`${folder}/${file}`);
    }
  });
};

const sweepAllDirectories = () => {
  console.log("CLEANING DIRECTORIES");

  removeFilesIfOlder(UPLOAD_FOLDER_NAME, MAX_FILE_AGE_MINUTES);
  removeFilesIfOlder(ZIP_OUTPUT_FOLDER_NAME, MAX_FILE_AGE_MINUTES);
  removeFilesIfOlder(SPLEETER_OUTPUT_DIR, MAX_FILE_AGE_MINUTES);

  console.log("DONE CLEANING DIRECTORIES");
};

schedule("*/10 * * * *", () => {
  sweepAllDirectories();
});
