import "./App.css";
import { DropzoneButton } from "./Dropzone";
import { FileRejection, FileWithPath } from "@mantine/dropzone";
import { useState } from "react";
import { Dialog, Flex, Group, Progress, Text } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconCloudExclamation, IconHeart } from "@tabler/icons-react";
import { version } from "../../package.json";
import { MessageType } from "../types";

const getWebSocketURL = (relativeUrl: string) => {
    const loc = window.location;
    let newUri;
    if (loc.protocol === "https:") {
        newUri = "wss:";
    } else {
        newUri = "ws:";
    }
    newUri += "//" + loc.host;
    newUri += loc.pathname + relativeUrl;

    return newUri;
};

const getBaseFileName = (fullname: string): string =>
    fullname.replace(/\.[^/.]+$/, "");

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

const submitFilesForSplitting = (
    files: File[],
    setProgress?: (num: number) => void
): Promise<Blob> => {
    return new Promise((resolve) => {
        const ws = new WebSocket(getWebSocketURL("separate"));
        ws.binaryType = "arraybuffer";

        ws.addEventListener("message", (message) => {
            if (message.data instanceof ArrayBuffer) {
                const fileArrayBuffer = message.data;
                resolve(new Blob([fileArrayBuffer]));
            } else {
                const data: MessageType = JSON.parse(message.data);
                if (data.type === "progress") {
                    if (setProgress) setProgress(data.progress);
                }
            }
        });

        ws.addEventListener("open", () => {
            if (files.length === 1) {
                const file: File = files[0];

                file.arrayBuffer().then((arrayBuffer) => {
                    ws.send(arrayBuffer);
                });
            }
        });
    });
};

function App() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<{
        errorCode: string;
        errorMessage: string;
    }>();
    const [opened, { open, close }] = useDisclosure(false);
    const [progress, setProgress] = useState(0);

    const DIALOG_AUTO_DISMISS_SECONDS = 5;

    const handleOnFileSelected = async (files: FileWithPath[]) => {
        setIsLoading(true);

        const fileWithPath = files[0];

        try {
            const responseFile: Blob = await submitFilesForSplitting(
                [fileWithPath],
                setProgress
            );

            showDownload(
                responseFile,
                `${getBaseFileName(fileWithPath.name)}.zip`,
                "application/zip"
            );
        } catch (e: unknown) {
            if (e instanceof Error) {
                open();
                setTimeout(() => close(), DIALOG_AUTO_DISMISS_SECONDS * 1000);
                setError({
                    errorCode: e.message,
                    errorMessage: "Error",
                });
            }
        }

        setIsLoading(false);
    };

    const handleFileRejection = (files: FileRejection[]) =>
        console.log("rejected files", files);

    return (
        <>
            <h1>TuneSplit2</h1>
            {!isLoading ? (
                <DropzoneButton
                    onDrop={handleOnFileSelected}
                    onReject={handleFileRejection}
                />
            ) : (
                <Progress value={progress} />
            )}

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
                withBorder
            >
                <Group align={"flex-start"}>
                    <IconCloudExclamation />

                    <div
                        style={{
                            minWidth: "3px",
                            borderRadius: "10px",
                            minHeight: "80px",
                            clear: "both",
                            backgroundColor: "#C92A2A",
                        }}
                    ></div>

                    <Flex align="flex-start" direction={"column"}>
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
                <Flex gap={5} align={"center"}>
                    <p className="read-the-docs">Made with </p>
                    <IconHeart size={20} />
                    <p className={"read-the-docs"}>
                        by{" "}
                        <a href={"https://github.com/rudydelorenzo"}>
                            @rudydelorenzo
                        </a>
                    </p>
                </Flex>
                <p className="read-the-docs">
                    Separation by{" "}
                    <a href={"https://github.com/deezer/spleeter"}>spleeter</a>{" "}
                    | v. {version}
                </p>
            </div>
        </>
    );
}

export default App;
