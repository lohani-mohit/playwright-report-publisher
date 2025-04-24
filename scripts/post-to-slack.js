#!/usr/bin/env node

const https = require("https");

// Get environment variables
const webhookUrl = process.env.SLACK_WEBHOOK_URL;
const reportUrl = process.env.REPORT_URL;
const testStatus = process.env.TEST_STATUS;
const environment = process.env.ENVIRONMENT;
const reportPrefix = process.env.REPORT_PREFIX;
const lastCommitMsg =
  process.env.LAST_COMMIT_MSG || "No commit message available";

// Determine emoji based on test status
const statusEmoji = testStatus === "passed" ? ":white_check_mark:" : ":x:";
const color = testStatus === "passed" ? "#36a64f" : "#ff0000";

// Create Slack message
const message = {
  attachments: [
    {
      color: color,
      pretext: `${statusEmoji} Playwright Test Results for *${reportPrefix}* on *${environment}*`,
      title: "Test Report",
      title_link: reportUrl,
      fields: [
        {
          title: "Status",
          value: testStatus.toUpperCase(),
          short: true,
        },
        {
          title: "Environment",
          value: environment,
          short: true,
        },
        {
          title: "Last Commit",
          value: lastCommitMsg,
          short: false,
        },
      ],
      footer: "Playwright Report Publisher",
      footer_icon: "https://playwright.dev/img/playwright-logo.svg",
      ts: Math.floor(Date.now() / 1000),
    },
  ],
};

// Send to Slack
const data = JSON.stringify(message);

const options = {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Content-Length": data.length,
  },
};

const req = https.request(webhookUrl, options, (res) => {
  console.log(`Slack notification status: ${res.statusCode}`);
});

req.on("error", (error) => {
  console.error("Error sending Slack notification:", error);
});

req.write(data);
req.end();
