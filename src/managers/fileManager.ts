import { Flow } from "../types";
import FS from "../wrapper/fs";
import { FLOWS } from "./stepManager";

export function fileReader(flowFilename: string): Flow {
    return JSON.parse(FS.readFileSync(`${FLOWS()}/${flowFilename}.json`, "utf-8") as string);
}
