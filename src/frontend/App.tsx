import "./App.css";
import { DropzoneButton } from "./Dropzone";
import {FileRejection, FileWithPath} from "@mantine/dropzone";
import { useState } from "react";
import {Dialog, Flex, Group, Text, } from "@mantine/core";
import {useDisclosure} from "@mantine/hooks";
import {IconCloudExclamation, } from "@tabler/icons-react";

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
  const [error, setError] = useState<{errorCode: number; errorMessage: string}>()
  const [opened, { open, close }] = useDisclosure(false);

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
      open();
      setError({errorCode: response.status, errorMessage: response.statusText})
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

      <Dialog
          opened={opened}
          withCloseButton
          onClose={close}
          size="lg"
          radius="md"
          position={{ bottom: 40, left: 40 }}
          transition="slide-up"
          transitionDuration={300}
          transitionTimingFunction="ease"
          p={20}
          shadow={"md"}
      >
        <Group align={"flex-start"}>

          <IconCloudExclamation/>

          <div style={{minWidth: "3px", borderRadius: "10px", minHeight: "80px", clear:"both", backgroundColor: "#C92A2A"}}></div>

            <Flex align="flex-start" direction={'column'}>
              <Text size="lg" mb="xs" weight={500}>
                Oops!
              </Text>
              <Text size="xs" mb="xs" weight={100}>
                There's been a problem, try again
              </Text>
              <Text size="xs" mb="xs" weight={100}>
                {`${error?.errorCode}: ${error?.errorMessage}`}
              </Text>
            </Flex>
        </Group>
      </Dialog>

      <div className={"bottom-text"}>
        <p className="read-the-docs">Created with ❤️ by <a href={"https://github.com/rudydelorenzo"}>@rudydelorenzo</a></p>
        <p className="read-the-docs">Separation by <a href={"https://github.com/deezer/spleeter"}>spleeter</a></p>
      </div>

    </>
  );
}

export default App;
