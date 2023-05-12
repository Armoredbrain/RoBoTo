import { Flow } from "../types";
import FS from "../wrapper/fs";
import { FLOWSFOLDER } from "./flowManager";

export function fileReader(flowFilename: string): Flow {
    return JSON.parse(FS.readFileSync(`${FLOWSFOLDER()}/${flowFilename}.json`, "utf-8") as string);
}
