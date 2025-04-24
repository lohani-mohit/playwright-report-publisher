# Playwright Report Publisher

[![GitHub release](https://img.shields.io/github/release/speechify/playwright-report-publisher.svg)](https://github.com/speechify/playwright-report-publisher/releases)
[![License](https://img.shields.io/github/license/speechify/playwright-report-publisher.svg)](LICENSE)

A GitHub Action for publishing Playwright test reports to Google Cloud Storage (GCS), Slack, and GitHub PR comments.

## Features

- ☁️ Upload Playwright HTML reports to Google Cloud Storage (GCS)
- 💬 Post test results to Slack with customizable messages
- 💬 Add test result comments to GitHub Pull Requests
- 🔄 Works with any Playwright test setup

## Usage

This action is designed to be used after your Playwright tests have been run. It will take the generated report and publish it to various destinations.

### Basic Example

```yaml
- name: Run Playwright tests
  id: run-tests
  run: npx playwright test
  continue-on-error: true

- name: Publish Playwright Report
  uses: speechify/playwright-report-publisher@v1
  with:
    environment: "dev"
    report-prefix: "e2e-tests"
    gcp-sa-key: ${{ secrets.GCP_SA_KEY }}
    slack-webhook-url: ${{ secrets.SLACK_WEBHOOK_URL }}
    test-status: ${{ steps.run-tests.outcome == 'success' && 'passed' || 'failed' }}
```

### Complete Example with All Options

```yaml
name: Playwright Tests with Report Publishing

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    name: Run Tests and Publish Report
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"
          cache-dependency-path: "tests/package-lock.json"

      - name: Install dependencies
        run: |
          cd tests
          npm ci

      - name: Install Playwright browsers
        run: |
          cd tests
          npx playwright install --with-deps chromium

      - name: Run Playwright tests
        id: run-tests
        run: |
          cd tests
          npx playwright test
        continue-on-error: true

      - name: Publish Playwright Report
        uses: speechify/playwright-report-publisher@v1
        with:
          report-directory: "tests/playwright-report"
          environment: "dev"
          report-prefix: "e2e-tests"
          post-to: "both"
          working-directory: "tests"
          gcs-bucket: "my-playwright-reports"
          github-token: ${{ github.token }}
          gcp-sa-key: ${{ secrets.GCP_SA_KEY }}
          slack-webhook-url: ${{ secrets.SLACK_WEBHOOK_URL }}
          test-status: ${{ steps.run-tests.outcome == 'success' && 'passed' || 'failed' }}
```

## Inputs

| Input               | Description                                       | Required | Default                      |
| ------------------- | ------------------------------------------------- | -------- | ---------------------------- |
| `report-directory`  | Directory containing the Playwright report        | No       | `playwright-report`          |
| `environment`       | Environment the tests were run against            | Yes      | `dev`                        |
| `gcp-sa-key`        | GCP service account key (JSON) for GCS uploads    | Yes      | -                            |
| `post-to`           | Where to post results (github, slack, both, none) | No       | `both`                       |
| `working-directory` | Directory containing Playwright tests             | No       | `tests`                      |
| `gcs-bucket`        | GCS bucket name for uploading reports             | No       | `website_playwright_reports` |
| `report-prefix`     | Prefix for the report folder in GCS               | No       | `test-report`                |
| `github-token`      | GitHub token for PR comments                      | No       | `github.token`               |
| `slack-webhook-url` | Slack webhook URL for posting results             | No       | -                            |
| `test-status`       | Status of the tests (passed or failed)            | No       | Determined from report       |

## Outputs

| Output        | Description                            |
| ------------- | -------------------------------------- |
| `report-url`  | URL to the published Playwright report |
| `test-status` | Status of the tests (passed or failed) |

## How It Works

1. **Report Location**: The action looks for Playwright reports in the specified directory (defaults to `playwright-report`)
2. **GCS Upload**: The report is uploaded to Google Cloud Storage with a timestamp
3. **Result Posting**: Results are posted to Slack and/or GitHub PR comments based on your configuration

## Requirements

For this action to work correctly, you need:

1. **Playwright Tests**: Your repository should have Playwright tests set up and already run
2. **GCP Service Account**: A Google Cloud service account with permissions to upload to a GCS bucket
3. **Slack Webhook** (optional): A Slack webhook URL if you want to post results to Slack

## Setting Up the Required Secrets

### GCP Service Account

1. Create a service account in Google Cloud Platform
2. Grant it the `Storage Object Creator` role
3. Create a key for the service account in JSON format
4. Add the JSON content to your GitHub repository secrets as `GCP_SA_KEY`

### Slack Webhook URL

1. Create a Slack app in your workspace
2. Enable Incoming Webhooks
3. Create a webhook for the channel where you want to post test results
4. Add the webhook URL to your GitHub repository secrets as `SLACK_WEBHOOK_URL`

## Customizing the Report URL Format

The default format for the report URL is:

```
https://storage.googleapis.com/{bucket}/{prefix}-{env}/{timestamp}/index.html
```

You can customize this by forking the action and modifying the `generate-paths` step in the action.yml file.

## Examples

### Publishing Reports with Custom Directory

```yaml
- name: Publish Visual Comparison Test Reports
  uses: speechify/playwright-report-publisher@v1
  with:
    report-directory: "visual-tests/playwright-report"
    environment: "prod"
    report-prefix: "visual-comparison"
    gcp-sa-key: ${{ secrets.GCP_SA_KEY }}
```

### Daily Test Reports with Slack Notifications Only

```yaml
name: Daily Test Reports

on:
  schedule:
    - cron: "0 2 * * *" # Run daily at 2 AM UTC

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      # Steps to run your tests...

      - name: Publish Test Reports
        uses: speechify/playwright-report-publisher@v1
        with:
          environment: "prod"
          report-prefix: "daily-tests"
          post-to: "slack"
          gcp-sa-key: ${{ secrets.GCP_SA_KEY }}
          slack-webhook-url: ${{ secrets.SLACK_WEBHOOK_URL }}
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
