import dotenv from "dotenv";
import { Octokit } from "octokit";
import { getPullRequests ,getPullRequestFiles, getSHA, postComments } from "./github.js";
import { parsePatchLibrary } from "./diffParser.js";
import { chunkingParsed } from "./chunk.js";
import {reviewChunksWithLLM} from "./llm.js";
import { preprocessParsedFiles } from "./prePrcessParsedFile.js";
//for environment variables
dotenv.config();
//interact with Github api object
export const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

export  const owner = "samarth96k";
export const repo = "test-repo-for-code-sentinal";

//gives open pr
const prs = await getPullRequests(); 
console.log("*************************************************getprs")
console.log(prs)
//select which pull to be used from the above array
const pullNumber = prs[2].number;
//gets file differences and metadata
const files = await getPullRequestFiles(pullNumber);
console.log("************************************************files");
console.log(files);
const commit_id = await getSHA(pullNumber);
console.log("***********************************************commit id")
console.log(commit_id);
//taking a single one

console.log("**************************************************file")
const file = files[0];
console.log(file);
//using  diff  parser  library
const parsed = parsePatchLibrary(file.patch);
console.log("**************************************************parsed");
console.log(parsed);
const processedParsed = preprocessParsedFiles(parsed, file.filename);
if (processedParsed.length === 0) {
    console.log("SKIPPED:", file.filename);
} else {
    const chunks = chunkingParsed(processedParsed, file.filename);
    console.log(chunks);
}
//changing parsed string to chunks within a file
const chunks = chunkingParsed(processedParsed, file.filename);
console.log("***************************************************chunks");
// const reviewChunks = reviewChunksWithLLM();
console.log(JSON.stringify(chunks, null, 2));
const result = await reviewChunksWithLLM(chunks);
console.log("*************************************************ai review json")
console.log(result);

console.log("**************************************************comment");
const postResult = await postComments(
    result,
    commit_id,
    pullNumber
);

console.log(
    JSON.stringify(postResult, null, 2)
);