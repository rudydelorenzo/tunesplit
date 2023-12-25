import archiver from "archiver";
import * as fs from "fs";

/**
 * @param {string} sourceDir /some/folder/to/compress
 * @param {string} outPath /path/to/created.zip
 * @returns {Promise}
 */
export const zipDirectory = (
  sourceDir: string,
  outPath: string
): Promise<void> => {
  const archive = archiver("zip", { zlib: { level: 9 } });
  const stream = fs.createWriteStream(outPath);

  return new Promise((resolve, reject) => {
    archive
      .directory(sourceDir, false)
      .on("error", (err) => reject(err))
      .pipe(stream);

    stream.on("close", () => resolve());
    archive.finalize();
  });
};
