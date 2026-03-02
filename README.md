# Playwright Report Publisher

[![GitHub release](https://img.shields.io/github/release/lohani-mohit/playwright-report-publisher.svg)](https://github.com/lohani-mohit/playwright-report-publisher/releases)
[![License](https://img.shields.io/github/license/lohani-mohit/playwright-report-publisher.svg)](LICENSE)
[![GitHub Marketplace](https://img.shields.io/badge/Marketplace-Playwright%20Report%20Publisher-blue?logo=github)](https://github.com/marketplace/actions/playwright-report-publisher)

A GitHub Action for publishing Playwright test reports to Google Cloud Storage (GCS), Slack, and GitHub PR comments.

## Features

- **Merge sharded reports** — combine blob reports from parallel shards into a single HTML + JSON report
- **Upload to GCS** — publish HTML reports to Google Cloud Storage with auto-generated timestamps
- **Slack notifications** — rich Block Kit messages with configurable alert modes (`always`, `on-failure`, `on-success`, `never`)
- **GitHub PR comments** — auto-updating comments with test stats table (updates on re-run, no duplicate comments)
- **GitHub step summary** — test results table directly in the Actions run summary
- **Test stats outputs** — total, passed, failed, flaky, and duration available as action outputs
- **Playwright Setup sub-action** — Node.js, dependency install, Playwright browser caching in one step

## Components

| Component | Reference | Description |
|-----------|-----------|-------------|
| **Report Publisher** | `lohani-mohit/playwright-report-publisher@v2` | Main action — merge, upload, notify, summarize |
| **Playwright Setup** | `lohani-mohit/playwright-report-publisher/setup@v2` | Sub-action — Node.js, deps, cache, browsers |

---

## Quick Start

### Basic Usage (single test run, no sharding)

```yaml
- name: Run Playwright tests
  id: tests
  run: npx playwright test
  continue-on-error: true

- name: Publish Report
  uses: lohani-mohit/playwright-report-publisher@v2
  with:
    environment: "dev"
    gcs-path-prefix: "e2e-tests"
    gcp-sa-key: ${{ secrets.GCP_SA_KEY }}
    slack-webhook-url: ${{ secrets.SLACK_WEBHOOK_URL }}
    slack-notify: "on-failure"
    test-status: ${{ steps.tests.outcome == 'success' && 'passed' || 'failed' }}
```

### With Sharding (merge blob reports automatically)

```yaml
jobs:
  test:
    name: "Tests (${{ matrix.shardIndex }}/4)"
    runs-on: ubuntu-latest
    strategy:
      fail-fast: false
      matrix:
        shardIndex: [1, 2, 3, 4]
        shardTotal: [4]
    steps:
      - uses: actions/checkout@v4

      # Setup Playwright (Node + deps + cached browsers) in one step
      - uses: lohani-mohit/playwright-report-publisher/setup@v2
        with:
          working-directory: tests
          node-version: "20"

      - name: Run tests
        run: npx playwright test --shard=${{ matrix.shardIndex }}/${{ matrix.shardTotal }}
        working-directory: tests

      - uses: actions/upload-artifact@v4
        if: ${{ !cancelled() }}
        with:
          name: blob-report-${{ matrix.shardIndex }}
          path: tests/blob-report
          retention-days: 1

  report:
    name: Publish Report
    if: ${{ !cancelled() }}
    needs: [test]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
      - run: npm ci
        working-directory: tests

      - uses: actions/download-artifact@v5
        with:
          path: tests/all-blob-reports
          pattern: blob-report-*
          merge-multiple: true

      - uses: lohani-mohit/playwright-report-publisher@v2
        with:
          working-directory: tests
          merge-blob-reports: "true"
          suite-name: "E2E Tests"
          test-status: ${{ needs.test.result == 'success' && 'passed' || 'failed' }}
          gcs-path-prefix: "e2e"
          environment: "preview"
          gcp-sa-key: ${{ secrets.GCP_SA_KEY }}
          slack-webhook-url: ${{ secrets.SLACK_WEBHOOK_URL }}
          slack-notify: "on-failure"
```

---

## Inputs — Report Publisher

### Report Options

| Input | Required | Default | Description |
|-------|----------|---------|-------------|
| `working-directory` | No | `tests` | Working directory containing Playwright tests |
| `report-directory` | No | `playwright-report` | Directory containing the HTML report |
| `merge-blob-reports` | No | `false` | Merge sharded blob reports before publishing |
| `blob-report-path` | No | `all-blob-reports` | Path to blob reports (relative to `working-directory`) |
| `suite-name` | No | `Playwright` | Suite name shown in Slack, PR comments, and step summary |
| `test-status` | No | auto-detect | `passed`, `failed`, or `cancelled`. Auto-detected from report JSON if omitted |

### GCS Upload

| Input | Required | Default | Description |
|-------|----------|---------|-------------|
| `upload-to-gcs` | No | `true` | Whether to upload the HTML report to GCS |
| `gcs-bucket` | No | `website_playwright_reports` | GCS bucket name (without `gs://`) |
| `gcs-path-prefix` | No | `test-report` | Path prefix in bucket. Final: `{prefix}-{env}/{timestamp}/` |
| `environment` | No | `dev` | Environment name (appended to GCS path) |
| `gcp-sa-key` | No | — | GCP service account key JSON |
| `gcp-project-id` | No | — | GCP project ID |

### Notifications

| Input | Required | Default | Description |
|-------|----------|---------|-------------|
| `post-to` | No | `both` | Where to post: `github`, `slack`, `both`, or `none` |
| `slack-notify` | No | `always` | When to send Slack alerts (see table below) |
| `slack-webhook-url` | No | — | Slack incoming webhook URL |
| `github-token` | No | `github.token` | GitHub token for PR comments |
| `github-step-summary` | No | `true` | Write a GitHub Actions step summary |

### Slack Notification Modes

| Mode | Behavior |
|------|----------|
| `always` | Send a notification after every run |
| `on-failure` | Only notify when tests fail |
| `on-success` | Only notify when all tests pass |
| `never` | Skip Slack entirely |

## Outputs

| Output | Description |
|--------|-------------|
| `report-url` | URL of the uploaded HTML report |
| `test-status` | Test status (`passed` / `failed` / `cancelled` / `unknown`) |
| `total-tests` | Total number of tests |
| `passed-tests` | Number of passed tests |
| `failed-tests` | Number of failed tests |
| `flaky-tests` | Number of flaky tests |
| `duration` | Total test duration in seconds |

---

## Inputs — Playwright Setup (`setup/`)

| Input | Required | Default | Description |
|-------|----------|---------|-------------|
| `working-directory` | No | `.` | Directory with `package.json` |
| `node-version` | No | `20` | Node.js version |
| `install-command` | No | `npm ci` | Dependency install command |
| `playwright-install-args` | No | — | Extra args for `playwright install` (e.g. `chromium`) |

The setup sub-action handles:
1. Node.js setup (via `actions/setup-node@v4`)
2. Dependency installation (configurable command)
3. Playwright browser caching (via `actions/cache@v4`, keyed by Playwright version)
4. Browser installation (skipped on cache hit)
5. System dependency installation

---

## Slack Message Format

The Slack notification uses [Block Kit](https://api.slack.com/block-kit) with:

- **Header** — shows pass/fail status emoji and suite name
- **Fields** — total tests, duration, passed, failed, flaky, environment
- **Context** — repository, branch, actor, last commit message
- **Action buttons** — "View Report" (links to GCS report) and "GitHub Run" (links to the Actions run)

## GitHub PR Comments

PR comments include a test stats table and are **auto-updating** — if the action runs again on the same PR for the same suite, it updates the existing comment instead of creating duplicates.

---

## How It Works

```
┌──────────────────┐
│ Your test shards  │  (parallel jobs)
│  shard 1/4        │
│  shard 2/4        │──── upload blob-report artifacts
│  shard 3/4        │
│  shard 4/4        │
└────────┬─────────┘
         │ download artifacts
┌────────▼─────────┐
│  Report Publisher │
│                   │
│  1. Merge blobs   │  (optional, if merge-blob-reports: true)
│  2. Parse stats   │  (extract pass/fail/flaky/duration)
│  3. Upload to GCS │  (optional, if upload-to-gcs: true)
│  4. Slack notify  │  (respects slack-notify mode)
│  5. PR comment    │  (if pull_request event)
│  6. Step summary  │  (optional, if github-step-summary: true)
└──────────────────┘
```

---

## Migration from v1

### Breaking Changes in v2

- **New inputs**: `merge-blob-reports`, `blob-report-path`, `suite-name`, `slack-notify`, `gcs-path-prefix`, `gcp-project-id`, `github-step-summary`
- **Renamed input**: `report-prefix` → `gcs-path-prefix`
- **GCP auth upgraded**: Uses `google-github-actions/auth@v2` and `setup-gcloud@v2` (was v1)
- **Slack format changed**: Now uses Block Kit instead of attachments API
- **PR comments are auto-updating**: Uses marker comments to update rather than create duplicates

### v1 → v2 Migration

```yaml
# v1
- uses: lohani-mohit/playwright-report-publisher@v1
  with:
    environment: "dev"
    report-prefix: "e2e-tests"
    gcp-sa-key: ${{ secrets.GCP_SA_KEY }}
    slack-webhook-url: ${{ secrets.SLACK_WEBHOOK_URL }}
    test-status: ${{ steps.tests.outcome == 'success' && 'passed' || 'failed' }}

# v2 (drop-in compatible, just change the tag)
- uses: lohani-mohit/playwright-report-publisher@v2
  with:
    environment: "dev"
    gcs-path-prefix: "e2e-tests"        # renamed from report-prefix
    gcp-sa-key: ${{ secrets.GCP_SA_KEY }}
    slack-webhook-url: ${{ secrets.SLACK_WEBHOOK_URL }}
    slack-notify: "on-failure"           # NEW: control when Slack fires
    test-status: ${{ steps.tests.outcome == 'success' && 'passed' || 'failed' }}
```

---

## Requirements

1. **Playwright tests** already set up in your repository
2. **GCP service account** with `Storage Object Creator` role ([setup guide](#gcp-service-account))
3. **Slack webhook** (optional) — [setup guide](#slack-webhook-url)

### GCP Service Account

1. Create a service account in Google Cloud Platform
2. Grant it the `Storage Object Creator` role on your bucket
3. Create a JSON key for the service account
4. Add the JSON content to GitHub repository secrets as `GCP_SA_KEY`

### Slack Webhook URL

1. Create a Slack app in your workspace
2. Enable Incoming Webhooks
3. Create a webhook for the target channel
4. Add the webhook URL to GitHub repository secrets as `SLACK_WEBHOOK_URL`

---

## Examples

See the [`examples/`](examples/) directory for complete workflow files:

- **[basic-workflow.yml](examples/basic-workflow.yml)** — simple single-run test + publish
- **[sharded-workflow.yml](examples/sharded-workflow.yml)** — parallel shards with blob report merging

---

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
