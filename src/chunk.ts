type AddedLine = {
    newLine: number;
    content: string;
};

type RemovedLine = {
    oldLine: number;
    content: string;
};

export type ReviewChunk = {
    filename: string;
    startLine: number;
    endLine: number;
    codeWithContext: string;
    addedLines: AddedLine[];
    removedLines: RemovedLine[];
    metadata: {
        language: string;
        hunkHeader: string;
    };
};

export function chunkingParsed(parsed: any, filename: string): ReviewChunk[] {
    const reviewChunks: ReviewChunk[] = [];
    const contextSize = 3;

    parsed.forEach((file: any) => {
        file.hunks.forEach((hunk: any) => {
            const changes = hunk.changes;
            let i = 0;
            while (i < changes.length) {
                if (changes[i].type !== "added") {
                    i++;
                    continue;
                }

                const addedStartIndex = i;
                let addedEndIndex = i;
                while (
                    addedEndIndex + 1 < changes.length &&
                    changes[addedEndIndex + 1].type === "added"
                ) {
                    addedEndIndex++;
                }

                const startIndex = Math.max(0, addedStartIndex - contextSize);
                const endIndex = Math.min(
                    changes.length - 1,
                    addedEndIndex + contextSize
                );
                const chunkChanges = changes.slice(startIndex, endIndex + 1);

                const addedLines: AddedLine[] = chunkChanges
                    .filter((change: any) => change.type === "added")
                    .map((change: any) => ({
                        newLine: change.newLine,
                        content: change.content,
                    }));

                const removedLines: RemovedLine[] = chunkChanges
                    .filter((change: any) => change.type === "removed")
                    .map((change: any) => ({
                        oldLine: change.oldLine,
                        content: change.content,
                    }));

                const newLines = chunkChanges
                    .filter((change: any) => change.newLine !== null)
                    .map((change: any) => change.newLine);

                const startLine = newLines[0];
                const endLine = newLines[newLines.length - 1];
                const codeWithContext = chunkChanges
                    .map((change: any) => {
                        if (change.type === "removed") {
                            const lineNo = String(change.oldLine ?? "").padStart(4, " ");
                            return `${lineNo} - ${change.content}`;
                        }

                        const lineNo = String(change.newLine ?? "").padStart(4, " ");
                        const marker = change.type === "added" ? "+" : " ";

                        return `${lineNo} ${marker} ${change.content}`;
                    })
                    .join("\n");

                reviewChunks.push({
                    filename,

                    startLine,
                    endLine,

                    codeWithContext,

                    addedLines,
                    removedLines,

                    metadata: {
                        language: getLanguageFromFilename(filename),
                        hunkHeader: `@@ -${hunk.oldStart},${hunk.oldLines} +${hunk.newStart},${hunk.newLines} @@`,
                    },
                });
                i = addedEndIndex + 1;
            }
        });
    });

    return reviewChunks;
}

function getLanguageFromFilename(filename: string): string {
    if (filename.endsWith(".ts")) return "typescript";
    if (filename.endsWith(".tsx")) return "typescript-react";
    if (filename.endsWith(".js")) return "javascript";
    if (filename.endsWith(".jsx")) return "javascript-react";
    if (filename.endsWith(".py")) return "python";
    if (filename.endsWith(".java")) return "java";
    if (filename.endsWith(".cpp")) return "cpp";
    if (filename.endsWith(".c")) return "c";
    if (filename.endsWith(".go")) return "go";
    if (filename.endsWith(".rs")) return "rust";
    return "unknown";
}