import "./App.css";
import { DropzoneButton } from "./Dropzone";
import { FileWithPath } from "@mantine/dropzone";
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

const submitFilesForSplitting = async (files: File[]): Promise<Blob> => {
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

  return response.blob();
};

function App() {
  const [isLoading, setIsLoading] = useState(false);

  const handleOnFileSelected = async (files: FileWithPath[]) => {
    setIsLoading(true);

    const fileWithPath = files[0];

    const fileBlob = await submitFilesForSplitting([fileWithPath]);

    setIsLoading(false);

    showDownload(
      fileBlob,
      `${getBaseFileName(fileWithPath.name)}.zip`,
      "application/zip"
    );
  };

  return (
    <>
      <h1>SplitIt</h1>
      <DropzoneButton
        onDrop={handleOnFileSelected}
        onReject={(files) => console.log("rejected files", files)}
        loading={isLoading}
      />

      <p className="read-the-docs">Created in Edmonton by @rudydelorenzo</p>
    </>
  );
}

export default App;
