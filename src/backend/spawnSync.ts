import { spawn } from "child_process";

export const spawnSync = (
    command: Parameters<typeof spawn>[0],
    args: Parameters<typeof spawn>[1],
    options: Parameters<typeof spawn>[2],
    loggingCallback?: (data: string) => unknown
): Promise<void> => {
    return new Promise((resolve, reject) => {
        const opts: Parameters<typeof spawn>[2] = {
            ...options,
            ...{
                stdio: "inherit",
            },
        };

        const proc = spawn(command, args, opts);

        if (loggingCallback) {
            proc.stderr?.on("data", (data) => {
                console.log("HIIII");
                loggingCallback(data.toString());
            });
            proc.stdout?.on("data", (data) => loggingCallback(data.toString()));
        }

        proc.on("exit", () => {
            console.log("EXITT");
            resolve();
        });

        proc.on("error", () => {
            console.log("ERRORRR");
            reject();
        });
    });
};
