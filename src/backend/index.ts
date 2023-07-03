import express from "express";
import multer from "multer";
import { execSync } from "child_process";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { zipDirectory } from "./zipDirectory.js";

const app = express();
const backendPort = process.env.PORT || 5004;

const storage = multer.diskStorage({
  destination: function (_req, _file, cb) {
    cb(null, "uploads/");
  },
  filename: function (_req, file, cb) {
    cb(null, uuidv4() + path.extname(file.originalname)); //Appending .jpg
  },
});
const upload = multer({ storage: storage });

const getBaseFileName = (fullname: string): string => path.parse(fullname).name;

const split = async (file: Express.Multer.File): Promise<string> => {
  execSync(`spleeter separate -p spleeter:2stems -o output ${file.path}`);

  console.log("FINISHED CONVERSION");

  const FOLDER_NAME = getBaseFileName(file.filename);
  const FILE_NAME_NO_EXT = getBaseFileName(file.originalname);

  console.log(`FOLDER NAME: ${FOLDER_NAME}`);

  const OUTPUT_DIR = `output/${FOLDER_NAME}`;

  await zipDirectory(OUTPUT_DIR, `output/${FILE_NAME_NO_EXT}.zip`);

  console.log("DONE ZIPPING");

  return `output/${FILE_NAME_NO_EXT}.zip`;
};

app.listen(backendPort, () => console.log(`Listening on port ${backendPort}`));

app.use(express.static("dist/frontend"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// create a GET route
app.post(`/convert`, upload.array("files"), async (req, res) => {
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
    res.download(path);
  }

  return;
});
