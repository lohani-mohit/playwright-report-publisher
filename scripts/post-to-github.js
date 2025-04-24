#!/usr/bin/env node

const fs = require("fs");
const https = require("https");
const path = require("path");

// Environment variables
const githubToken = process.env.GITHUB_TOKEN;
const repoFullName = process.env.GITHUB_REPOSITORY;
const pullRequestNumber = process.env.PULL_REQUEST_NUMBER;
const reportUrl = process.env.REPORT_URL;
const testStatus = process.env.TEST_STATUS || "unknown";

// Check for required variables
if (!githubToken || !repoFullName || !pullRequestNumber || !reportUrl) {
  console.error(
    "Required environment variables are missing. GITHUB_TOKEN, GITHUB_REPOSITORY, PULL_REQUEST_NUMBER, and REPORT_URL are required."
  );
  process.exit(1);
}

// Try to read the test report
const reportPath = path.join(process.cwd(), "playwright-report/pw_report.json");
let stats = { duration: 0, expected: 0, unexpected: 0, flaky: 0 };

try {
  if (fs.existsSync(reportPath)) {
    const report = JSON.parse(fs.readFileSync(reportPath, "utf8"));
    stats = report.stats || stats;
  } else {
    console.warn("Report file not found at:", reportPath);
    console.warn("Using default statistics.");
  }
} catch (error) {
  console.error("Error reading or parsing the report file:", error);
  console.warn("Using default statistics.");
}

// Extract test results
const { expected: passCount, unexpected: failCount, flaky } = stats;
const totalPass = passCount + flaky;
const totalTest = passCount + failCount + flaky;
const duration = (stats.duration / 1000).toFixed(2); // in seconds

// Prepare the results summary
let resultsSummary = `## Playwright Test Results: ${
  failCount > 0 ? "❌ Some tests failed" : "🎉 All tests passed"
}\n\n`;
resultsSummary += `- **Total Duration:** ${duration} seconds\n`;
resultsSummary += `- **Total Test(s):** ${totalTest}\n`;
resultsSummary += `- **Passed Test(s) ✅:** ${totalPass}\n`;
resultsSummary += `- **Failed Test(s) ❌:** ${failCount}\n`;
resultsSummary += `- **Flaky Test(s) ⚠️:** ${flaky}\n\n`;
resultsSummary += `You can see the detailed [Playwright Report here](${reportUrl}).\n`;

// GitHub API HTTP request helper
const makeGitHubApiRequest = (method, path, body = null) => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: "api.github.com",
      path,
      method,
      headers: {
        Authorization: `token ${githubToken}`,
        "User-Agent": "Playwright-Report-Publisher-Action",
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json",
      },
    };

    const req = https.request(options, (res) => {
      let data = "";

      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(data));
          } catch (error) {
            resolve(data);
          }
        } else {
          console.error(
            `API request failed with status code ${res.statusCode}`
          );
          console.error(`Response data: ${data}`);
          reject(new Error(`HTTP status ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on("error", (error) => {
      console.error("Error making API request:", error);
      reject(error);
    });

    if (body) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
};

// Get existing comments on the PR
const getExistingComments = async () => {
  const commentsPath = `/repos/${repoFullName}/issues/${pullRequestNumber}/comments`;
  return makeGitHubApiRequest("GET", commentsPath);
};

// Create a new comment on the PR
const createComment = async (body) => {
  const commentPath = `/repos/${repoFullName}/issues/${pullRequestNumber}/comments`;
  return makeGitHubApiRequest("POST", commentPath, { body });
};

// Update an existing comment
const updateComment = async (commentId, body) => {
  const commentPath = `/repos/${repoFullName}/issues/comments/${commentId}`;
  return makeGitHubApiRequest("PATCH", commentPath, { body });
};

// Main execution
(async () => {
  try {
    const comments = await getExistingComments();
    const existingComment = comments.find((comment) =>
      comment.body.includes("## Playwright Test Results")
    );

    if (existingComment) {
      // Update existing comment
      await updateComment(existingComment.id, resultsSummary);
      console.log(`Updated existing comment #${existingComment.id}`);
    } else {
      // Create new comment
      const newComment = await createComment(resultsSummary);
      console.log(`Created new comment #${newComment.id}`);
    }

    // Exit with appropriate code
    if (failCount > 0) {
      process.exit(1); // Exit with error if tests failed
    }
  } catch (error) {
    console.error("Error executing script:", error);
    process.exit(1);
  }
})();
