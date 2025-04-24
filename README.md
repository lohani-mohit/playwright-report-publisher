# Playwright Report Publisher Action

[![GitHub release](https://img.shields.io/github/release/speechify/playwright-report-publisher.svg)](https://github.com/speechify/playwright-report-publisher/releases)
[![License](https://img.shields.io/github/license/speechify/playwright-report-publisher.svg)](LICENSE)

A GitHub Action to run Playwright tests, publish reports to Google Cloud Storage (GCS), and post results to Slack and GitHub PR comments.

## Features

- ✅ Run Playwright tests with specific test tags
- 🌐 Test against different environments (dev, preview, prod)
- ☁️ Upload test reports to Google Cloud Storage (GCS)
- 💬 Post test results to Slack
- 💬 Post test results as comments on GitHub pull requests
- 🔄 Support for visual comparison tests

## Screenshot

![Playwright Report in GitHub PR Comment](https://user-images.githubusercontent.com/your-username/your-repo/raw/main/docs/images/pr-comment-example.png)

## Usage

### Basic Usage

```yaml
name: Playwright Tests

on:
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Run Playwright tests
        uses: speechify/playwright-report-publisher@v1
        with:
          test-tag: "@regression"
          environment: "dev"
          post-to: "both"
          gcp-sa-key: ${{ secrets.GCP_SA_KEY }}
          slack-webhook-url: ${{ secrets.SLACK_WEBHOOK_URL }}
```

### Complete Example with All Options

```yaml
name: Playwright Tests with All Options

on:
  pull_request:
    branches: [main, develop]
  schedule:
    - cron: "0 2 * * *" # Run daily at 2 AM UTC
  workflow_dispatch:
    inputs:
      test-tag:
        description: "Test tag to run"
        required: true
        default: "@regression"
      environment:
        description: "Environment to test"
        required: true
        default: "dev"

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Run Playwright tests
        uses: speechify/playwright-report-publisher@v1
        with:
          # Required inputs
          test-tag: ${{ github.event.inputs.test-tag || '@regression' }}
          environment: ${{ github.event.inputs.environment || 'dev' }}
          gcp-sa-key: ${{ secrets.GCP_SA_KEY }}

          # Optional inputs with defaults
          post-to: "both"
          working-directory: "tests"
          gcs-bucket: "my-playwright-reports"
          node-version: "20.11.1"
          github-token: ${{ github.token }}
          slack-webhook-url: ${{ secrets.SLACK_WEBHOOK_URL }}
```

## Inputs

| Input               | Description                                    | Required | Default                      |
| ------------------- | ---------------------------------------------- | -------- | ---------------------------- |
| `test-tag`          | Test tag to run (e.g., @sanity, @regression)   | Yes      | `@regression`                |
| `environment`       | Environment to run tests against               | Yes      | `dev`                        |
| `gcp-sa-key`        | GCP service account key (JSON) for GCS uploads | Yes      | -                            |
| `post-to`           | Where to post results (github, slack, both)    | No       | `both`                       |
| `working-directory` | Directory containing Playwright tests          | No       | `tests`                      |
| `gcs-bucket`        | GCS bucket name for uploading reports          | No       | `website_playwright_reports` |
| `node-version`      | Node.js version to use                         | No       | `20.11.1`                    |
| `github-token`      | GitHub token for PR comments                   | No       | `github.token`               |
| `slack-webhook-url` | Slack webhook URL for posting results          | No       | -                            |

## Outputs

| Output        | Description                            |
| ------------- | -------------------------------------- |
| `report-url`  | URL to the published Playwright report |
| `test-status` | Status of the tests (passed or failed) |

## How It Works

1. **Test Execution**: The action runs Playwright tests with the specified tag
2. **Report Generation**: A test report is generated in HTML and JSON formats
3. **GCS Upload**: The report is uploaded to Google Cloud Storage with a timestamp
4. **Result Posting**: Results are posted to Slack and/or GitHub PR comments

## Requirements

For this action to work correctly, you need:

1. **Playwright Tests**: Your repository should have Playwright tests set up
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
https://storage.googleapis.com/{bucket}/{tag}-{env}/{timestamp}/index.html
```

You can customize this by forking the action and modifying the `generate-paths` step in the action.yml file.

## Examples

### Running Visual Comparison Tests

```yaml
- name: Run Visual Comparison Tests
  uses: speechify/playwright-report-publisher@v1
  with:
    test-tag: "@visualcomparison"
    environment: "prod"
    gcp-sa-key: ${{ secrets.GCP_SA_KEY }}
```

### Daily Sanity Tests with Slack Notifications Only

```yaml
name: Daily Sanity Tests

on:
  schedule:
    - cron: "0 2 * * *" # Run daily at 2 AM UTC

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Run Sanity Tests
        uses: speechify/playwright-report-publisher@v1
        with:
          test-tag: "@sanity"
          environment: "prod"
          post-to: "slack"
          gcp-sa-key: ${{ secrets.GCP_SA_KEY }}
          slack-webhook-url: ${{ secrets.SLACK_WEBHOOK_URL }}
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
