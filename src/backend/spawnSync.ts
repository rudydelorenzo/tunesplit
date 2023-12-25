import { spawn } from "child_process";

export const customSpawnSync = (
    command: Parameters<typeof spawn>[0],
    args: Parameters<typeof spawn>[1],
    options: Parameters<typeof spawn>[2],
    loggingCallback?: (data: string) => unknown
): Promise<void> => {
    return new Promise((resolve, reject) => {
        const opts: Parameters<typeof spawn>[2] = {
            ...options,
            ...{
                stdio: "pipe",
                shell: true,
                env: {
                    ...options.env,
                    ...{
                        ...{ FORCE_COLOR: "1" },
                    },
                },
            },
        };

        const proc = spawn(command, args, opts);

        if (loggingCallback) {
            proc.stderr?.on("data", (data) => loggingCallback(data.toString()));
            proc.stdout?.on("data", (data) => loggingCallback(data.toString()));
        }

        proc.on("exit", () => {
            resolve();
        });

        proc.on("error", () => {
            reject();
        });
    });
};
