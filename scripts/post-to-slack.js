#!/usr/bin/env node

const https = require("https");

const {
  SLACK_WEBHOOK_URL,
  SLACK_NOTIFY_MODE,
  REPORT_URL,
  LAST_COMMIT_MSG,
  TEST_STATUS,
  ENVIRONMENT,
  SUITE_NAME,
  TOTAL_TESTS,
  PASSED_TESTS,
  FAILED_TESTS,
  FLAKY_TESTS,
  DURATION,
  GITHUB_RUN_URL,
  GITHUB_REPOSITORY,
  GITHUB_REF_NAME,
  GITHUB_ACTOR,
} = process.env;

const failed = parseInt(FAILED_TESTS, 10) || 0;
const passed = parseInt(PASSED_TESTS, 10) || 0;
const flaky = parseInt(FLAKY_TESTS, 10) || 0;
const total = parseInt(TOTAL_TESTS, 10) || 0;
const hasFailed = failed > 0 || TEST_STATUS === "failed";

function shouldNotify() {
  const mode = (SLACK_NOTIFY_MODE || "always").toLowerCase();
  switch (mode) {
    case "always":
      return true;
    case "on-failure":
      return hasFailed;
    case "on-success":
      return !hasFailed;
    case "never":
      return false;
    default:
      return true;
  }
}

if (!shouldNotify()) {
  console.log(
    `Slack notification skipped (mode: ${SLACK_NOTIFY_MODE}, hasFailed: ${hasFailed})`,
  );
  process.exit(0);
}

if (!SLACK_WEBHOOK_URL) {
  console.error("SLACK_WEBHOOK_URL is not set");
  process.exit(1);
}

const statusEmoji = hasFailed ? "🔴" : "🟢";
const statusText = hasFailed ? "Failed" : "Passed";
const suiteName = SUITE_NAME || "Playwright";

const blocks = [
  {
    type: "header",
    text: {
      type: "plain_text",
      text: `${statusEmoji} ${suiteName} Tests ${statusText}`,
      emoji: true,
    },
  },
];

if (total > 0) {
  const fields = [
    { type: "mrkdwn", text: `*Total Tests:*\n${total}` },
    { type: "mrkdwn", text: `*Duration:*\n${DURATION || "N/A"}s` },
    { type: "mrkdwn", text: `*Passed ✅:*\n${passed + flaky}` },
    { type: "mrkdwn", text: `*Failed ❌:*\n${failed}` },
  ];
  if (flaky > 0) {
    fields.push({ type: "mrkdwn", text: `*Flaky ⚠️:*\n${flaky}` });
  }
  fields.push({
    type: "mrkdwn",
    text: `*Environment:*\n${ENVIRONMENT || "N/A"}`,
  });
  blocks.push({ type: "section", fields });
}

const contextParts = [];
if (GITHUB_REPOSITORY)
  contextParts.push(`*Repo:* ${GITHUB_REPOSITORY}`);
if (GITHUB_REF_NAME) contextParts.push(`*Branch:* ${GITHUB_REF_NAME}`);
if (GITHUB_ACTOR) contextParts.push(`*Actor:* ${GITHUB_ACTOR}`);
if (LAST_COMMIT_MSG && LAST_COMMIT_MSG !== "N/A")
  contextParts.push(`*Commit:* ${LAST_COMMIT_MSG}`);

if (contextParts.length > 0) {
  blocks.push({
    type: "context",
    elements: [{ type: "mrkdwn", text: contextParts.join("  |  ") }],
  });
}

const actions = [];
if (REPORT_URL) {
  actions.push({
    type: "button",
    text: { type: "plain_text", text: "📊 View Report", emoji: true },
    url: REPORT_URL,
    style: "primary",
  });
}
if (GITHUB_RUN_URL) {
  actions.push({
    type: "button",
    text: { type: "plain_text", text: "🔗 GitHub Run", emoji: true },
    url: GITHUB_RUN_URL,
  });
}
if (actions.length > 0) {
  blocks.push({ type: "actions", elements: actions });
}

const payload = JSON.stringify({ blocks });
const url = new URL(SLACK_WEBHOOK_URL);

const options = {
  hostname: url.hostname,
  path: url.pathname,
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(payload),
  },
};

const req = https.request(options, (res) => {
  let body = "";
  res.on("data", (chunk) => (body += chunk));
  res.on("end", () => {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      console.log("Slack notification sent successfully");
    } else {
      console.error(`Slack API returned ${res.statusCode}: ${body}`);
      process.exit(1);
    }
  });
});

req.on("error", (err) => {
  console.error("Failed to send Slack notification:", err.message);
  process.exit(1);
});

req.write(payload);
req.end();
