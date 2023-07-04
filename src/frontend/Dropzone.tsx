import { useRef } from "react";
import { Text, Group, Button, createStyles, rem } from "@mantine/core";
import { Dropzone, DropzoneProps } from "@mantine/dropzone";
import { IconCloudUpload, IconX, IconDownload } from "@tabler/icons-react";
import { MIME_AUDIO_TYPES } from "../types";

const useStyles = createStyles((theme) => ({
  wrapper: {
    position: "relative",
    marginBottom: rem(30),
  },

  dropzone: {
    borderWidth: rem(1),
    paddingBottom: rem(50),
  },

  icon: {
    color:
      theme.colorScheme === "dark"
        ? theme.colors.dark[3]
        : theme.colors.gray[4],
  },

  control: {
    position: "absolute",
    width: rem(250),
    left: `calc(50% - ${rem(125)})`,
    bottom: rem(-20),
  },
}));

export function DropzoneButton({
  onDrop,
  ...rest
}: Pick<DropzoneProps, "onDrop"> & Partial<DropzoneProps>) {
  const { classes, theme } = useStyles();
  const openRef = useRef<() => void>(null);

  const MAX_FILE_SIZE_GB = 5;

  return (
    <div className={classes.wrapper}>
      <Dropzone
        openRef={openRef}
        onDrop={onDrop}
        onReject={rest.onReject}
        className={classes.dropzone}
        radius="md"
        accept={Object.values(MIME_AUDIO_TYPES)}
        maxSize={MAX_FILE_SIZE_GB * 1_000_000_000}
        {...rest}
      >
        <div style={{ pointerEvents: "none" }}>
          <Group position="center">
            <Dropzone.Accept>
              <IconDownload
                size={rem(50)}
                color={theme.colors[theme.primaryColor][6]}
                stroke={1.5}
              />
            </Dropzone.Accept>
            <Dropzone.Reject>
              <IconX size={rem(50)} color={theme.colors.red[6]} stroke={1.5} />
            </Dropzone.Reject>
            <Dropzone.Idle>
              <IconCloudUpload
                size={rem(50)}
                color={
                  theme.colorScheme === "dark"
                    ? theme.colors.dark[0]
                    : theme.black
                }
                stroke={1.5}
              />
            </Dropzone.Idle>
          </Group>

          <Text ta="center" fw={700} fz="lg" mt="xl">
            <Dropzone.Accept>Drop files here</Dropzone.Accept>
            <Dropzone.Reject>
              Audio files less than {MAX_FILE_SIZE_GB}GB
            </Dropzone.Reject>
            <Dropzone.Idle>Upload audio</Dropzone.Idle>
          </Text>
          <Text ta="center" fz="sm" mt="xs" c="dimmed">
            Drag&apos;n&apos;drop files here to upload. We can accept only audio
            files.
          </Text>
        </div>
      </Dropzone>

      <Button
        className={classes.control}
        size="md"
        radius="xl"
        onClick={() => openRef.current?.()}
      >
        Select files
      </Button>
    </div>
  );
}
