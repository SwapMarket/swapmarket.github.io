export const formatError = (message: unknown): string => {
    if (typeof message === "string") {
        return message;
    }

    if (typeof message === "object") {
        const msgObj = message as Record<string, unknown>;

        if (typeof msgObj.error === "object") {
            const err = msgObj.error as Record<string, unknown>;

            if (typeof err.message === "string") {
                return err.message;
            }
        }

        if (typeof msgObj.message === "string") {
            return msgObj.message;
        }

        if (typeof msgObj.error === "string") {
            return msgObj.error;
        }

        if (typeof msgObj.data === "string") {
            return msgObj.data;
        }

        if (
            typeof message.toString === "function" &&
            // eslint-disable-next-line @typescript-eslint/no-base-to-string
            message.toString() !== "[object Object]"
        ) {
            // eslint-disable-next-line @typescript-eslint/no-base-to-string
            return message.toString();
        }
    }

    return JSON.stringify(message);
};
