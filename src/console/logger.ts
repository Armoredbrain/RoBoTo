import winston from "winston";
import dotenv from "dotenv";
import { AxiosError } from "axios";

dotenv.config();

export class BotError {
    code: number;
    information: Record<string, unknown>;
    isAxiosError: boolean;
    message: string;
    result: { code: number; message: string; information?: Record<string, unknown> };
    source: string;
    stack?: string;

    constructor(
        error: Error | AxiosError,
        data: { source: string; code: number; customMessage?: string; information?: Record<string, unknown> }
    ) {
        if (this.isAxiosErrorInstance(error)) {
            this.code = error.response?.status ?? data.code;
            this.isAxiosError = true;
            this.message = error.response?.statusText ?? data.customMessage ?? "Hu ho something went wrong";
            this.source = data.source;
            this.information = data.information ?? {
                baseUrl: error.response?.config?.baseURL,
                url: error.response?.config?.url,
                method: error.response?.config?.method,
            };
        } else {
            this.code = Reflect.get(error, "code") || data.code;
            this.isAxiosError = false;
            this.message = data.customMessage ?? error.message;
            this.source = data.source;
            this.stack = error.stack;
            this.information = data.information ?? {
                name: error.name,
            };
        }

        if (!this.code || typeof this.code !== "number" || this.code < 100 || this.code > 599) {
            this.information["errorCode"] = this.code;
            this.code = 500;
        }
        this.result = { code: this.code, message: this.message };
        this.code === 406 && (this.result.information = this.information);
    }

    isAxiosErrorInstance = (object: unknown): object is AxiosError => {
        if (object && typeof object === "object") {
            return "isAxiosError" in object;
        }

        return false;
    };
}

export function logFormat(data: {
    timestamp: string;
    level: "info" | "error" | "warn" | "http" | "debug";
    code: number;
    message: string;
    isAxiosError: boolean;
    source: string;
    stack: string;
    information: Record<string, unknown>;
}): string {
    const config = {
        color: {
            info: "\x1b[32m",
            error: "\x1b[31m",
            warn: "\x1b[33m",
            debug: "\x1b[33m",
            http: "\x1b[35m",
        },
        style: {
            bold: "\x1b[1m",
            resetBold: "\x1b[22m",
            italic: "\x1b[3m",
            resetItalic: "\x1b[23m",
        },
        reset: "\x1b[0m",
    };

    // Thanks @Arno -> https://github.com/Arno67000
    return data.level.includes("error")
        ? `${config.color[data.level]}${config.style.italic}${data.timestamp}${config.style.resetItalic} ${
              config.style.bold
          }${data.level.toUpperCase()} ${data.code} : ${config.style.resetBold}${data.source} -> ${data.message} \r\n${
              config.style.italic
          } AxiosError: ${data.isAxiosError}.${config.reset}${
              data.stack ? `\r\n Stack :" + ${data.stack}` : ""
          } \r\n Info: ${JSON.stringify(data.information, null, 2)}`
        : `${config.color[data.level]}${config.style.italic}${data.timestamp}${config.style.resetItalic} ${
              config.style.bold
          }${data.level.toUpperCase()}${config.style.resetBold} : ${data.message}`;
}

export const colors = {
    error: "red",
    warn: "yellow",
    info: "green",
    http: "magenta",
    debug: "white",
};
winston.addColors(colors);

const Logger = winston.createLogger({
    level: process.env.NODE_ENV === "development" ? "debug" : "info",
    levels: {
        error: 0,
        warn: 1,
        info: 2,
        http: 3,
        debug: 4,
    },
    format: winston.format.combine(
        // winston.format.colorize(),
        winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss:ms" }),
        winston.format.errors({
            code: true,
            isAxiosError: true,
            message: true,
            source: true,
            stack: true,
            information: true,
        }),
        winston.format.printf(({ timestamp, level, code, message, isAxiosError, source, stack, information }) =>
            logFormat({
                timestamp,
                level: level as "info" | "error" | "warn" | "http" | "debug",
                code,
                message,
                isAxiosError,
                source,
                stack,
                information,
            })
        )
    ),
    transports: [
        new winston.transports.Console({
            silent: process.argv.indexOf("--silent") >= 0 || process.env.NODE_ENV === "test",
        }),
        new winston.transports.File({
            filename: "logs/error.log",
            level: "error",
        }),
        new winston.transports.File({ filename: "logs/all.log" }),
    ],
    exceptionHandlers: [
        new winston.transports.Console({
            silent: process.argv.indexOf("--silent") >= 0 || process.env.NODE_ENV === "test",
        }),
    ],
});

export default Logger;
