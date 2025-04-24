# Publishing the Playwright Report Publisher Action to GitHub Marketplace

This guide provides step-by-step instructions on how to publish the Playwright Report Publisher Action to the GitHub Marketplace.

## Prerequisites

Before publishing your action to the GitHub Marketplace, ensure you have:

1. A GitHub account with the necessary permissions to create repositories and publish actions
2. Git installed on your local machine
3. The complete action code (as provided in this repository)

## Step 1: Create a New GitHub Repository

1. Go to [GitHub](https://github.com/) and sign in to your account
2. Click on the "+" icon in the top-right corner and select "New repository"
3. Name your repository (e.g., `playwright-report-publisher`)
4. Add a description: "GitHub Action to run Playwright tests and publish reports to GCS, Slack, and GitHub PR comments"
5. Make the repository public (required for GitHub Marketplace)
6. Check "Add a README file"
7. Choose "MIT License" from the "Add a license" dropdown
8. Click "Create repository"

## Step 2: Upload the Action Code

You have a few options to upload the action code:

### Option A: Upload via Web Interface

1. Navigate to your newly created repository on GitHub
2. Create the necessary folders and files by clicking "Add file" > "Create new file"
3. Add each file with its correct path and content
4. For each file, add a commit message and commit directly to the main branch

### Option B: Upload via Git Command Line (Recommended)

1. Clone the repository to your local machine:

   ```bash
   git clone https://github.com/YOUR_USERNAME/playwright-report-publisher.git
   cd playwright-report-publisher
   ```

2. Copy all the files from the playwright-report-publisher-action folder to this directory:

   ```bash
   cp -r /path/to/playwright-report-publisher-action/* .
   ```

3. Commit and push the changes:
   ```bash
   git add .
   git commit -m "Initial action code"
   git push origin main
   ```

## Step 3: Create a Release

GitHub Actions in the Marketplace are versioned using releases:

1. Go to your repository on GitHub
2. Click on "Releases" on the right side
3. Click "Create a new release"
4. Click "Choose a tag" and enter "v1.0.0" (create a new tag)
5. Set the release title to "v1.0.0 - Initial Release"
6. Add a description of your action and what it does
7. Check "This is a pre-release" if you want to test it before making it official
8. Click "Publish release"

## Step 4: Publish to GitHub Marketplace

Once you've created a release, you can publish your action to the marketplace:

1. Go to your repository on GitHub
2. Click on "Settings" in the top menu
3. In the left sidebar, click on "Workflow" under "Code and automation"
4. Scroll down to "GitHub Marketplace" section
5. Check the box that says "Publish this Action to the GitHub Marketplace"
6. Review and accept the GitHub Marketplace Developer Agreement
7. Click "Save changes"
8. Fill out the required information about your action:

   - Primary Category: Select "Continuous integration"
   - Verification status: Choose appropriate option
   - Action description: A brief description of what your action does
   - Icon & Color: Choose from available icons and colors

9. Click "Publish to the Marketplace"

## Step 5: Update Your Action

To update your action in the future:

1. Make changes to your action code
2. Commit and push the changes to your repository
3. Create a new release with a new version tag (e.g., "v1.1.0")
4. The new version will automatically be available in the GitHub Marketplace

## Testing Your Published Action

To test your action after publishing:

1. Create a new repository or use an existing one with Playwright tests
2. Create a new workflow file (e.g., `.github/workflows/playwright-tests.yml`)
3. Use your published action in the workflow:

   ```yaml
   name: Playwright Tests

   on: [push, pull_request]

   jobs:
     test:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v4

         - name: Run Playwright tests
           uses: YOUR_USERNAME/playwright-report-publisher@v1
           with:
             test-tag: "@regression"
             environment: "dev"
             gcp-sa-key: ${{ secrets.GCP_SA_KEY }}
             slack-webhook-url: ${{ secrets.SLACK_WEBHOOK_URL }}
   ```

4. Commit the workflow file and push it to your repository
5. Go to the "Actions" tab to see your workflow running with your published action

## Troubleshooting

If you encounter any issues while publishing or using your action:

- Check the action logs in the GitHub Actions tab
- Ensure all dependencies and scripts are properly referenced
- Verify all required inputs are provided in workflows using your action
- Check for any errors in the GitHub Marketplace submission process

## Best Practices for GitHub Actions

- Keep your action's purpose focused and specific
- Use semantic versioning for your releases
- Document all inputs, outputs, and examples thoroughly
- Provide clear error messages for debugging
- Test your action thoroughly before publishing
- Respond to issues and feedback from users

Good luck publishing your Playwright Report Publisher Action to the GitHub Marketplace!
