#!/usr/bin/env node

const fs = require("fs");
const https = require("https");
const path = require("path");

// Environment variables
const slackWebhookUrl = process.env.SLACK_WEBHOOK_URL;
const reportUrl = process.env.REPORT_URL;
const lastCommitMsg = process.env.LAST_COMMIT_MSG || "Unknown commit";
const testStatus = process.env.TEST_STATUS || "unknown";
const testTag = process.env.TEST_TAG || "@unknown";
const environment = process.env.ENVIRONMENT || "unknown";

// Check for required variables
if (!slackWebhookUrl || !reportUrl) {
  console.error(
    "Required environment variables are missing. SLACK_WEBHOOK_URL and REPORT_URL are required."
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
let resultsSummary = "";

if (testStatus === "failed") {
  resultsSummary = `*Playwright ${testTag} Tests Failed (${environment} environment)*\n\n`;
} else {
  resultsSummary = `*Playwright ${testTag} Tests Passed (${environment} environment)*\n\n`;
}

resultsSummary += `*Commit:* ${lastCommitMsg}\n`;
resultsSummary += `*Total Duration:* ${duration} seconds\n`;
resultsSummary += `*Total Tests:* ${totalTest}\n`;
resultsSummary += `*Passed Tests ✅:* ${totalPass}\n`;
resultsSummary += `*Failed Tests ❌:* ${failCount}\n`;
resultsSummary += `*Flaky Tests ⚠️:* ${flaky}\n\n`;

// Only add failure message if there are failures
if (failCount > 0) {
  resultsSummary += `# *${failCount} test(s) failed ❌*\n`;
}

resultsSummary += `View detailed test results and report: \n${reportUrl}`;

// Send to Slack
const postToSlack = (message) => {
  return new Promise((resolve, reject) => {
    const webhookUrl = new URL(slackWebhookUrl);

    const options = {
      hostname: webhookUrl.hostname,
      path: webhookUrl.pathname + webhookUrl.search,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    };

    const req = https.request(options, (res) => {
      if (res.statusCode === 200) {
        console.log("Message posted to Slack successfully");
        resolve();
      } else {
        console.error(
          `Failed to post to Slack. Status code: ${res.statusCode}`
        );
        reject(new Error(`HTTP status ${res.statusCode}`));
      }

      res.on("data", (chunk) => {
        console.log(`Response: ${chunk}`);
      });
    });

    req.on("error", (error) => {
      console.error("Error posting to Slack:", error);
      reject(error);
    });

    req.write(JSON.stringify({ text: message }));
    req.end();
  });
};

// Main execution
(async () => {
  try {
    await postToSlack(resultsSummary);
  } catch (error) {
    console.error("Error executing script:", error);
    process.exit(1);
  }
})();
