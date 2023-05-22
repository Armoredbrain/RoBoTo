import { Flow } from "../types";
import FS from "../wrapper/fs";

export const FLOWS = () => {
    /* istanbul ignore next */
    if (process.env.NODE_ENV !== "test") {
        return process.env.FLOWSFOLDER ?? "./flows";
    } else {
        return "./src/tests/__mock__/flows";
    }
};

export const MAPPING = () => {
    /* istanbul ignore next */
    if (process.env.NODE_ENV !== "test") {
        return process.env.CONFIGFOLDER ?? "./config";
    } else {
        return "./src/tests/__mock__/config";
    }
};

export function fileReader(folder: string, filenameWithoutExtension: string): Flow {
    return JSON.parse(String(FS.readFileSync(`${folder}/${filenameWithoutExtension}.json`, "utf-8")));
}
