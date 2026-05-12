import parse from "parse-diff";

type GitHubPRFile = {
    filename: string;
    status: string;
    additions: number;
    deletions: number;
    changes: number;
    patch?: string;
};

type ParsedLineType = "context" | "added" | "removed";

type ParsedLine = {
    type: ParsedLineType;
    oldLine: number | null;
    newLine: number | null;
    content: string;
    raw: string;
};

type ParsedHunk = {
    oldStart: number;
    oldLines: number;
    newStart: number;
    newLines: number;
    header: string;
    lines: ParsedLine[];
};

type ParsedFile = {
    filename: string;
    status: string;
    additions: number;
    deletions: number;
    changes: number;
    hunks: ParsedHunk[];
};

type ReviewChunk = {
    filename: string;
    startLine: number;
    endLine: number;
    addedLines: number[];
    codeWithContext: string;
    removedLines: string[];
};

export function parseHunkHeader(header: string) {
    // if (typeof header == undefined) throw new Error("Invalid hunk header:" + header);
        const regex = /^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/;
        const match = header.match(regex);
        if (!match) throw new Error("Invalid hunk header:" + header);
        // console.log(match);
        return {
            oldStart: Number(match[1]),
            oldLines: match[2] ? Number(match[2]) : 1,
            newStart: Number(match[3]),
            newLines: match[4] ? Number(match[4]) : 1,
        };
}

export function parsePatch(file: GitHubPRFile): ParsedFile {
  const result: ParsedFile = {
    filename: file.filename,
    status: file.status,
    additions: file.additions,
    deletions: file.deletions,
    changes: file.changes,
    hunks: [],
  };

  if (!file.patch) {
    return result;
  }

  const lines = file.patch.split("\n");

  let currentHunk: ParsedHunk | null = null;

  let oldLine = 0;
  let newLine = 0;

  for (const rawLine of lines) {
    if (rawLine.startsWith("@@")) {
      const parsedHeader = parseHunkHeader(rawLine);

      currentHunk = {
        header: rawLine,
        oldStart: parsedHeader.oldStart,
        oldLines: parsedHeader.oldLines,
        newStart: parsedHeader.newStart,
        newLines: parsedHeader.newLines,
        lines: [],
      };

      result.hunks.push(currentHunk);

      oldLine = parsedHeader.oldStart;
      newLine = parsedHeader.newStart;

      continue;
    }

    if (!currentHunk) {
      continue;
    }

    if (rawLine.startsWith("+")) {
      currentHunk.lines.push({
        type: "added",
        oldLine: null,
        newLine,
        content: rawLine.slice(1),
        raw: rawLine,
      });

      newLine++;
      continue;
    }

    if (rawLine.startsWith("-")) {
      currentHunk.lines.push({
        type: "removed",
        oldLine,
        newLine: null,
        content: rawLine.slice(1),
        raw: rawLine,
      });

      oldLine++;
      continue;
    }

    const content = rawLine.startsWith(" ") ? rawLine.slice(1) : rawLine;

    currentHunk.lines.push({
      type: "context",
      oldLine,
      newLine,
      content,
      raw: rawLine,
    });

    oldLine++;
    newLine++;
  }

  return result;
}

export function parsePatchLibrary(diff: any) {
    const files1 = parse(diff);
    const result = files1.map((file: any, fileIndex: number) => {
        return {
            fileIndex,
            additions: file.additions,
            deletions: file.deletions,
            totalHunks: file.chunks.length,
            hunks: file.chunks.map((chunk: any, chunkIndex: number) => {
                return {
                    chunkIndex,
                    oldStart: chunk.oldStart,
                    oldLines: chunk.oldLines,
                    newStart: chunk.newStart,
                    newLines: chunk.newLines,
                    changes: chunk.changes.map((change: any) => {
                        if (change.type === "add") {
                            return {
                                type: "added",
                                oldLine: null,
                                newLine: change.ln,
                                content: change.content.slice(1),
                            };
                        }
                        else if (change.type === "del") {
                            return {
                                type: "removed",
                                oldLine: change.ln,
                                newLine: null,
                                content: change.content.slice(1),
                            };
                        }
                        else {
                            return {
                                type: "context",
                                oldLine: change.ln1,
                                newLine: change.ln2,
                                content: change.content.slice(1),
                            };
                        }
                    }),
                };
            }),
        };
    });
    return result;
}

//***************************************************To BE USED LATER*********************************************************** */
//gives raw string which can be parsed by ourselves, it has no metdata
// const diffText = await getPullRequestDiff(pullNumber);
// console.log(`\nFull raw diff for PR #${pullNumber}:`);
// console.log(diffText.slice(0, 10000));
//***************************************************To BE USED LATER*********************************************************** */