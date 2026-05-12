import { octokit } from "./index.js";
import { owner, repo } from "./index.js";
export async function getPullRequests() {
  const prs = await octokit.request("GET /repos/{owner}/{repo}/pulls", {
    owner,
    repo,
    per_page: 5,
    headers: {
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });
  return prs.data;
}

export async function getPullRequestFiles(pullNumber: number) {
  const response = await octokit.request(
    "GET /repos/{owner}/{repo}/pulls/{pull_number}/files",
    {
      owner,
      repo,
      pull_number: pullNumber,
      headers: {
        "X-GitHub-Api-Version": "2022-11-28",
      },
    }
  );

  return response.data.map((file) => ({
    filename: file.filename,
    status: file.status,
    additions: file.additions,
    deletions: file.deletions,
    changes: file.changes,
    patch: file.patch,
    // sha:file.sha,
  }));
}

export async function getSHA(pullNumber: number) {
  const response = await octokit.request(
    "GET /repos/{owner}/{repo}/pulls/{pull_number}",
    {
      owner,
      repo,
      pull_number: pullNumber,
      headers: {
        "X-GitHub-Api-Version": "2022-11-28",
      },
    }
  );
  const commit_id = response.data.head.sha;
  return commit_id;
}


export async function postComments(
    result: any,
    commit_id: string,
    pullNumber: number
) {

    const responses = [];

    for (const review of result.reviews) {

        try {

            console.log("\n====================================");
            console.log("POSTING COMMENT:");
            console.log(review.githubComment);

            const res = await octokit.request(
                "POST /repos/{owner}/{repo}/pulls/{pull_number}/comments",
                {
                    owner,
                    repo,

                    pull_number: pullNumber,

                    commit_id,

                    ...review.githubComment,

                    headers: {
                        "X-GitHub-Api-Version": "2022-11-28",
                    },
                }
            );

            console.log("SUCCESS");
            console.log("COMMENT ID:", res.data.id);

            responses.push({
                success: true,

                path: review.githubComment.path,

                line: review.githubComment.line,

                response: res.data,
            });

        } catch (error: any) {

            console.log("FAILED");
            console.log(error);

            responses.push({
                success: false,

                path: review.githubComment.path,

                line: review.githubComment.line,

                error: {
                    message: error.message,

                    status: error.status,

                    response: error.response?.data,
                },
            });
        }
    }

    return responses;
}