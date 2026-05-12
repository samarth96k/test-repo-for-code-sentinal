import dotenv from "dotenv";
import { Octokit } from "octokit";
import { getPullRequestFiles, getSHA, postComments } from "./github.js";
import { parsePatchLibrary } from "./diffParser.js";
import { chunkingParsed } from "./chunk.js";
import {reviewChunksWithLLM} from "./llm.js";
import { preprocessParsedFiles } from "./prePrcessParsedFile.js";
import * as github from "@actions/github";

//for environment variables
dotenv.config();

const context = github.context;
const pullRequest = context.payload.pull_request;

if (!pullRequest) {
    throw new Error("No pull request found.");
}

export  const owner = context.repo.owner;
export const repo = context.repo.repo;
const pullNumber = pullRequest.number;
// console.log(context);
//interact with Github api object
export const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN || process.env.TOKEN_GITHUB,
});

//gives open pr
// const prs = await getPullRequests(); 
// console.log("*********************for testing purpose****************************getprs")
// console.log(prs)
//select which pull to be used from the above array
// const pullNumber = prs[2].number;
//******************************************for testing purpose over */
//gets file differences and metadata
const files = await getPullRequestFiles(pullNumber);
// console.log("************************************************files");
// console.log(files);
const commit_id = await getSHA(pullNumber);
// console.log("***********************************************commit id")
// console.log(commit_id);
//taking a single one
const allChunks: any[] = [];
// console.log("**************************************************file")
// const file = files[0];
// console.log(file);
//using  diff  parser  library
// const parsed = parsePatchLibrary(file.patch);
// console.log("**************************************************parsed");
// console.log(parsed);
// const processedParsed = preprocessParsedFiles(parsed, file.filename);
// if (processedParsed.length === 0) {
//     console.log("SKIPPED:", file.filename);
// } else {
//     const chunks = chunkingParsed(processedParsed, file.filename);
//     console.log(chunks);
// }
//changing parsed string to chunks within a file
// const chunks = chunkingParsed(processedParsed, file.filename);

//checking each file retrieved
for (const file of files) {
    if (!file.patch) {
        console.log("SKIPPED: No patch found for", file.filename);
        continue;
    }
    const parsed = parsePatchLibrary(file.patch);
    const processedParsed = preprocessParsedFiles(parsed, file.filename);
    if (processedParsed.length === 0) {
        console.log("SKIPPED:", file.filename);
        continue;
    }
    const chunks = chunkingParsed(processedParsed, file.filename);
    allChunks.push(...chunks);
}
if (allChunks.length === 0) {
    console.log("No reviewable chunks found.");
    process.exit(0);
}

// console.log("***************************************************chunks");
// const reviewChunks = reviewChunksWithLLM();
// console.log(JSON.stringify(chunks, null, 2));
const result = await reviewChunksWithLLM(allChunks);
if (result.reviews.length === 0) {
    console.log("No issues found by AI.");
    process.exit(0);
}
// console.log("*************************************************ai review json")
// console.log(result);


// console.log("**************************************************comment");
const postResult = await postComments(
    result,
    commit_id,
    pullNumber
);

console.log(
    JSON.stringify(postResult, null, 2)
);