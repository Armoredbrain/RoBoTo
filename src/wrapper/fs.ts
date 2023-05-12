/* istanbul ignore file */
import fs, {
    MakeDirectoryOptions,
    ObjectEncodingOptions,
    PathLike,
    PathOrFileDescriptor,
    RmOptions,
    WriteFileOptions,
} from "fs";

export default {
    readdirSync: (
        path: string,
        options?:
            | {
                  encoding: BufferEncoding | null;
                  withFileTypes?: false | undefined;
              }
            | BufferEncoding
            | null
    ) => fs.readdirSync(path, options),
    existsSync: (path: string): boolean => fs.existsSync(path),
    isDirEmpty: (path: string) => fs.readdirSync(path).length === 0,
    readFileSync: (
        path: PathOrFileDescriptor,
        options?:
            | (ObjectEncodingOptions & {
                  flag?: string | undefined;
              })
            | BufferEncoding
            | null
    ): string | Buffer => fs.readFileSync(path, options),
    renameSync: (oldPath: PathLike, newPath: PathLike): void => fs.renameSync(oldPath, newPath),
    writeFileSync: (
        file: PathOrFileDescriptor,
        data: string | NodeJS.ArrayBufferView,
        options?: WriteFileOptions
    ): void => fs.writeFileSync(file, data, options),
    unlinkSync: (path: PathLike): void => fs.unlinkSync(path),
    rmSync: (path: PathLike, options?: RmOptions): void => fs.rmSync(path, options),
    mkdirSync: (
        path: PathLike,
        options?: MakeDirectoryOptions & {
            recursive: true;
        }
    ): string | undefined => fs.mkdirSync(path, options),
};
