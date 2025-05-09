#!/usr/bin/env node

const https = require("https");

// Get environment variables
const token = process.env.GITHUB_TOKEN;
const reportUrl = process.env.REPORT_URL;
const testStatus = process.env.TEST_STATUS;
const prNumber = process.env.PULL_REQUEST_NUMBER;
const repoFullName = process.env.GITHUB_REPOSITORY;

// Create GitHub comment
const statusEmoji = testStatus === "passed" ? "✅" : "❌";
const commentBody = `## Playwright Test Results ${statusEmoji}

**Status:** ${testStatus.toUpperCase()}

[View Full Report](${reportUrl})

---
*This comment was automatically generated by the Playwright Report Publisher action.*`;

// Prepare the request
const data = JSON.stringify({
  body: commentBody,
});

const [owner, repo] = repoFullName.split("/");
const apiUrl = `/repos/${owner}/${repo}/issues/${prNumber}/comments`;

const options = {
  hostname: "api.github.com",
  port: 443,
  path: apiUrl,
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `token ${token}`,
    "User-Agent": "Playwright-Report-Publisher-Action",
    "Content-Length": data.length,
  },
};

// Send the request
const req = https.request(options, (res) => {
  console.log(`GitHub PR comment status: ${res.statusCode}`);

  let responseData = "";
  res.on("data", (chunk) => {
    responseData += chunk;
  });

  res.on("end", () => {
    if (res.statusCode >= 400) {
      console.error("Error response:", responseData);
    } else {
      console.log("PR comment posted successfully");
    }
  });
});

req.on("error", (error) => {
  console.error("Error posting GitHub PR comment:", error);
});

req.write(data);
req.end();
