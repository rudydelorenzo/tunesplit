import "./App.css";
import { DropzoneButton } from "./Dropzone";
import {FileRejection, FileWithPath} from "@mantine/dropzone";
import { useState } from "react";

const getCurrentURL = () => {
  return (
    window.location.protocol +
    "//" +
    window.location.hostname +
    ":" +
    window.location.port
  );
};

const getBaseFileName = (fullname: string): string =>
  fullname.replace(/\.[^/.]+$/, "");

const URL = getCurrentURL();

function showDownload(data: Blob, name: string, _mimetype: string) {
  const url = window.URL.createObjectURL(data);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", name || "Download.bin");

  const event = document.createEvent("MouseEvents");
  event.initMouseEvent(
    "click",
    true,
    true,
    window,
    1,
    0,
    0,
    0,
    0,
    false,
    false,
    false,
    false,
    0,
    null
  );
  link.dispatchEvent(event);
}

const submitFilesForSplitting = async (files: File[]): Promise<Response> => {
  const formData = new FormData();
  for (let i = 0; i < files.length; i++) {
    formData.append("files", files[i]);
  }
  console.log(URL);
  const response = await fetch(`${URL}/convert`, {
    method: "POST",
    body: formData,
  });

  console.log(response);

  return response;
};

function App() {
  const [isLoading, setIsLoading] = useState(false);

  const handleOnFileSelected = async (files: FileWithPath[]) => {
    setIsLoading(true);

    const fileWithPath = files[0];

    const response = await submitFilesForSplitting([fileWithPath]);

    setIsLoading(false);

    if (response.status >= 200 && response.status < 300) {
      const fileBlob = await response.blob();

      showDownload(
        fileBlob,
        `${getBaseFileName(fileWithPath.name)}.zip`,
        "application/zip"
      );
    } else {
      console.error("ERROR: Received non-200 response from server");
    }
  };

  const handleFileRejection = (files: FileRejection[]) => console.log("rejected files", files)

  return (
    <>
      <h1>TuneSplit</h1>
      <DropzoneButton
        onDrop={handleOnFileSelected}
        onReject={handleFileRejection}
        loading={isLoading}
      />

      <div className={"bottom-text"}>
        <p className="read-the-docs">Created with ❤️ by <a href={"https://github.com/rudydelorenzo"}>@rudydelorenzo</a></p>
        <p className="read-the-docs">Separation by <a href={"https://github.com/deezer/spleeter"}>spleeter</a></p>
      </div>

    </>
  );
}

export default App;
