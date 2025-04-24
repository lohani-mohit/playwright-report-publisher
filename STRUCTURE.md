# Playwright Report Publisher Action Structure

This document outlines the file and directory structure of the Playwright Report Publisher Action.

## Directory Structure

```
playwright-report-publisher-action/
├── action.yml                   # Main action definition
├── LICENSE                      # MIT License file
├── README.md                    # Documentation and usage instructions
├── PUBLISHING.md                # Guide for publishing to GitHub Marketplace
├── STRUCTURE.md                 # This file
├── examples/                    # Example workflow files
│   └── basic-workflow.yml       # Basic workflow example
└── scripts/                     # JavaScript scripts for the action
    ├── post-to-github.js        # Script to post results to GitHub PR comments
    └── post-to-slack.js         # Script to post results to Slack
```

## File Descriptions

### Main Files

- **action.yml**: The core file that defines the GitHub Action, its inputs, outputs, and steps.
- **LICENSE**: The MIT License file indicating the terms under which the action can be used.
- **README.md**: Comprehensive documentation including features, usage examples, and input/output details.
- **PUBLISHING.md**: Step-by-step guide on how to publish the action to GitHub Marketplace.
- **STRUCTURE.md**: This file, explaining the organization of the codebase.

### Examples

- **examples/basic-workflow.yml**: A starter example of a GitHub workflow file using this action.

### Scripts

- **scripts/post-to-github.js**: JavaScript script that parses test results and posts them as comments on GitHub pull requests.
- **scripts/post-to-slack.js**: JavaScript script that formats test results and sends them to a Slack webhook.

## How the Action Works

1. The action is defined in `action.yml`, which uses composite actions to coordinate multiple steps.
2. When the action runs, it:

   - Sets up the environment (Node.js, Playwright)
   - Runs the specified Playwright tests
   - Uploads the test reports to Google Cloud Storage
   - Uses the scripts to post results to Slack and/or GitHub PR comments

3. The scripts read the test report JSON to extract statistics and format messages.

## Customizing the Action

You can customize this action by:

1. Modifying `action.yml` to change the steps, inputs, or outputs
2. Updating the scripts in the `scripts/` directory to change how results are formatted or posted
3. Adding additional scripts for other notification channels or features

All file paths in the action are relative to the repository root when the action is run.
