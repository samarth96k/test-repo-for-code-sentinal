export function preprocessParsedFiles(parsed: any, filename: string) {
    if (shouldIgnoreFile(filename)) {
        console.log("IGNORED FILE:", filename);
        return [];
    }

    if (!Array.isArray(parsed)) {
        console.log("INVALID PARSED DATA FOR:", filename);
        return [];
    }

    return parsed;
}

function shouldIgnoreFile(filename: string): boolean {
    const normalizedFilename = filename.replace(/\\/g, "/");

    const ignoredExactFiles = [
        "package-lock.json",
        "yarn.lock",
        "pnpm-lock.yaml",
        "package.json.lock",
    ];

    const ignoredFolders = [
        "dist/",
        "build/",
        "coverage/",
        "node_modules/",
        ".next/",
        ".vercel/",
        ".turbo/",
        "out/",
    ];

    const ignoredExtensions = [
        ".png",
        ".jpg",
        ".jpeg",
        ".gif",
        ".svg",
        ".webp",
        ".ico",
        ".pdf",
        ".zip",
        ".rar",
        ".7z",
        ".mp4",
        ".mp3",
        ".wav",
        ".map",
        ".snap",
        ".min.js",
        ".min.css",
    ];

    const fileNameOnly = normalizedFilename.split("/").pop() ?? normalizedFilename;

    if (ignoredExactFiles.includes(fileNameOnly)) {
        return true;
    }

    if (ignoredFolders.some((folder) => normalizedFilename.includes(folder))) {
        return true;
    }

    if (ignoredExtensions.some((ext) => normalizedFilename.endsWith(ext))) {
        return true;
    }

    return false;
}