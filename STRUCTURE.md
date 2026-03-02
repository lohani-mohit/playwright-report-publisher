# Playwright Report Publisher — Structure

## Directory Layout

```
playwright-report-publisher/
├── action.yml                     # Main composite action (merge + GCS + Slack + PR + summary)
├── setup/
│   └── action.yml                 # Sub-action: Playwright environment setup
├── scripts/
│   ├── post-to-slack.js           # Slack notification (Block Kit, notification modes)
│   └── post-to-github.js          # GitHub PR comment (auto-updating with stats table)
├── examples/
│   ├── basic-workflow.yml         # Simple single-run example
│   └── sharded-workflow.yml       # Parallel shards with blob report merging
├── README.md                      # Full documentation
├── STRUCTURE.md                   # This file
└── LICENSE                        # MIT
```

## Components

### `action.yml` — Report Publisher

The main composite action. Steps:

1. **Merge blob reports** (optional) — combines sharded Playwright blob reports into HTML + JSON
2. **Parse test results** — extracts pass/fail/flaky/duration stats from `pw_report.json`
3. **Detect test status** — uses explicit input or auto-detects from report data
4. **Upload to GCS** (optional) — authenticates with GCP and uploads the HTML report
5. **Slack notification** — sends Block Kit message respecting the `slack-notify` mode
6. **GitHub PR comment** — posts/updates a stats table comment on the pull request
7. **GitHub step summary** — writes a results table to the Actions run summary

### `setup/action.yml` — Playwright Setup

Sub-action for environment setup:

1. Setup Node.js (configurable version)
2. Install project dependencies (configurable command)
3. Cache Playwright browsers (keyed by Playwright version + OS)
4. Install browsers (skipped on cache hit)
5. Install system-level dependencies

### `scripts/post-to-slack.js`

Slack notification script using Block Kit format. Features:

- Header with status emoji and suite name
- Fields grid: total, duration, passed, failed, flaky, environment
- Context line: repo, branch, actor, commit message
- Action buttons: "View Report" + "GitHub Run" links
- Notification mode filtering (`always` / `on-failure` / `on-success` / `never`)
- Zero external dependencies (uses Node.js built-in `https`)

### `scripts/post-to-github.js`

GitHub PR comment script. Features:

- Markdown table with test stats
- Link to full HTML report
- Auto-updating: uses HTML comment markers to find and update existing comments
- Per-suite markers: multiple suites can post separate comments without conflicts
- Zero external dependencies
