# GitHub Actions Workflows

This document explains the GitHub Actions workflows configured for the DC Tech Event Manager project.

## Workflows Overview

### 1. Test Workflow (`.github/workflows/test.yml`)

**Triggers:**
- Push to `main` or `develop` branches
- Pull requests to `main` branch

**What it does:**
1. Runs on Node.js 24.18.0
2. Installs dependencies with Bun
3. Runs linter
4. Performs type checking
5. Runs tests with coverage
6. Uploads coverage to Codecov
7. Builds the project
8. Verifies build artifacts
9. Verifies native Node runtime
10. Builds and tests Docker image

**Status Badge:**
```markdown
[![Test](https://github.com/YOUR_USERNAME/YOUR_REPO/actions/workflows/test.yml/badge.svg)](https://github.com/YOUR_USERNAME/YOUR_REPO/actions/workflows/test.yml)
```

---

### 2. Create Event Workflow (`.github/workflows/create-event.yml`)

**Triggers:**
- Manual workflow dispatch

**Inputs:**
| Input | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `template` | choice | Yes | `taoti-project-night` | Event template |
| `date` | string | Yes | - | Event date (YYYY-MM-DD) |
| `time` | string | No | `18:00` | Start time (HH:mm) |
| `duration` | string | No | `180` | Duration in minutes |
| `platforms` | string | No | `luma,meetup` | Platforms (comma-separated) |
| `dry_run` | boolean | No | `false` | Preview without creating |
| `format` | choice | No | `in-person` | Event format (in-person, online, hybrid) |
| `online_url` | string | No | - | Online meeting URL for online/hybrid events |

**What it does:**
1. Validates date and time formats
2. Ensures date is in the future
3. Runs in dry-run mode if requested
4. Creates event on specified platforms
5. Extracts and displays event URLs
6. Creates GitHub issue on failure

**Status Badge:**
```markdown
[![Create Event](https://github.com/YOUR_USERNAME/YOUR_REPO/actions/workflows/create-event.yml/badge.svg)](https://github.com/YOUR_USERNAME/YOUR_REPO/actions/workflows/create-event.yml)
```

---

### 3. Release Workflow (`.github/workflows/release.yml`)

**Triggers:**
- GitHub release published

**What it does:**
1. Runs tests
2. Builds the project
3. Builds Docker image with release tag
4. Pushes to GitHub Container Registry
5. Creates release artifacts (tar.gz and zip)

**Status Badge:**
```markdown
[![Release](https://github.com/YOUR_USERNAME/YOUR_REPO/actions/workflows/release.yml/badge.svg)](https://github.com/YOUR_USERNAME/YOUR_REPO/actions/workflows/release.yml)
```

---

## Setup Instructions

### 1. Required Secrets

Configure these secrets in your repository settings (`Settings > Secrets and variables > Actions`):

| Secret | Required | Description |
|--------|----------|-------------|
| `LUMA_API_KEY` | Yes | Luma API key for event creation |
| `MEETUP_ACCESS_TOKEN` | Yes | Meetup OAuth access token |
| `MEETUP_GROUP_URLNAME` | Yes | Your Meetup group URL name |
| `GITHUB_TOKEN` | Automatic | Provided by GitHub Actions |

### 2. Optional Configuration

#### Codecov Integration

1. Sign up at [codecov.io](https://codecov.io)
2. Link your GitHub repository
3. Upload `CODECOV_TOKEN` as a secret (optional)
4. Coverage reports will appear in PR checks

#### Container Registry

The release workflow pushes Docker images to GitHub Container Registry (ghcr.io).

To use the published images:

```bash
# Pull latest image
docker pull ghcr.io/YOUR_USERNAME/YOUR_REPO:latest

# Pull specific version
docker pull ghcr.io/YOUR_USERNAME/YOUR_REPO:v1.0.0

# Run container
docker run --env-file .env ghcr.io/YOUR_USERNAME/YOUR_REPO:latest --help
```

---

## Usage Guide

### Running Tests

Tests run automatically on:
- Every push to `main` or `develop`
- Every pull request to `main`

**Manual trigger:**
Not available (tests run automatically)

**View results:**
1. Go to the "Actions" tab in GitHub
2. Click on the "Test" workflow
3. Select the specific run
4. View logs and coverage reports

---

### Creating Events

#### Via GitHub UI

1. Go to the "Actions" tab in GitHub
2. Select "Create Event" workflow
3. Click "Run workflow"
4. Fill in the form:
   - Select template
   - Enter date (YYYY-MM-DD)
   - Enter time (HH:mm)
   - Enter duration (minutes)
   - Select platforms
   - Check "dry run" to preview
5. Click "Run workflow"
6. Monitor progress in the workflow run

#### Via GitHub CLI

```bash
# Create event with defaults
gh workflow run create-event.yml \
  -f template=taoti-project-night \
  -f date=2024-01-15

# Create event with custom options
gh workflow run create-event.yml \
  -f template=virtru-project-night \
  -f date=2024-01-20 \
  -f time=19:00 \
  -f duration=120 \
  -f platforms=luma,meetup

# Dry run (preview only)
gh workflow run create-event.yml \
  -f template=taoti-project-night \
  -f date=2024-01-15 \
  -f dry_run=true

# View workflow run status
gh run list --workflow=create-event.yml
```

#### Via API

```bash
curl -X POST \
  -H "Accept: application/vnd.github.v3+json" \
  -H "Authorization: token YOUR_GITHUB_TOKEN" \
  https://api.github.com/repos/YOUR_USERNAME/YOUR_REPO/actions/workflows/create-event.yml/dispatches \
  -d '{
    "ref": "main",
    "inputs": {
      "template": "taoti-project-night",
      "date": "2024-01-15",
      "time": "18:00",
      "duration": "180",
      "platforms": "luma,meetup",
      "dry_run": "false"
    }
  }'
```

---

### Monitoring Workflows

#### Via GitHub UI

1. Go to "Actions" tab
2. View workflow runs
3. Click on a run to see detailed logs
4. Check artifacts if applicable

#### Via GitHub CLI

```bash
# List recent workflow runs
gh run list

# List runs for specific workflow
gh run list --workflow=test.yml

# View specific run
gh run view RUN_ID

# Watch run in real-time
gh run watch RUN_ID

# Download artifacts
gh run download RUN_ID
```

---

## Best Practices

### 1. Testing Before Event Creation

Always run in dry-run mode first:

```bash
gh workflow run create-event.yml \
  -f template=taoti-project-night \
  -f date=2024-01-15 \
  -f dry_run=true
```

Check the output to verify:
- Event details are correct
- Date/time are correct
- Platform selection is correct

### 2. Using Feature Branches

Create feature branches for testing:

```bash
# Create branch
git checkout -b test-event-workflow

# Make changes
# Push to test branch
git push origin test-event-workflow

# Tests will run automatically on PR
```

### 3. Managing Secrets

**Never commit secrets to the repository.**

- Use GitHub Secrets for sensitive data
- Rotate tokens regularly
- Use environment-specific secrets if needed

### 4. Monitoring Failures

- Check email notifications for workflow failures
- Review workflow logs for error details
- Issues are created automatically for event creation failures

### 5. Release Process

1. Create a git tag:
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```

2. Create GitHub release:
   - Go to "Releases" in GitHub
   - Click "Draft a new release"
   - Select tag
   - Fill in release notes
   - Click "Publish release"

3. Workflow will automatically:
   - Run tests
   - Build artifacts
   - Push Docker image to ghcr.io

---

## Troubleshooting

### Workflow Not Running

**Check:**
1. Workflow file is in `.github/workflows/`
2. File has `.yml` extension
3. YAML syntax is valid
4. Triggers are correctly configured

**Debug:**
```bash
# Validate YAML syntax
yamllint .github/workflows/test.yml

# Check workflow syntax
gh workflow view test.yml
```

### Event Creation Failing

**Common causes:**
1. Missing or invalid secrets
2. Invalid date/time format
3. Date in the past
4. API rate limits
5. Network issues

**Debug steps:**
1. Check workflow logs
2. Verify secrets are set correctly
3. Test with dry-run mode first
4. Check API status pages (Luma, Meetup)

### Tests Failing

**Check:**
1. Test logs for specific failures
2. Coverage reports
3. Type errors
4. Linting issues

**Fix:**
```bash
# Run tests locally
bun test

# Check types
bun run typecheck

# Run linter
bun run lint
```

### Docker Build Failing

**Check:**
1. Dockerfile syntax
2. Base image availability
3. Build context size
4. Dependency installation

**Debug:**
```bash
# Build locally
docker build -f docker/Dockerfile -t test .

# Check Docker daemon
docker info
```

---

## Advanced Configuration

### Custom Workflows

Create additional workflows for specific needs:

```yaml
# .github/workflows/custom-event.yml
name: Custom Event

on:
  workflow_dispatch:
    inputs:
      # Custom inputs here

jobs:
  create:
    runs-on: ubuntu-latest
    steps:
      # Custom steps here
```

### Scheduled Events

Create events on a schedule:

```yaml
# .github/workflows/scheduled-event.yml
name: Scheduled Event

on:
  schedule:
    - cron: '0 9 * * 1'  # Every Monday at 9 AM UTC

jobs:
  create:
    runs-on: ubuntu-latest
    steps:
      - name: Create recurring event
        # Your logic here
```

### Test Runner

The `test` job runs on a single Ubuntu runner and sets up the exact Node.js version used by this migration:

```yaml
test:
  runs-on: ubuntu-latest

  steps:
    - name: Setup Node.js
      uses: actions/setup-node@v5
      with:
        node-version: 24.18.0
```

The `docker` job also runs on `ubuntu-latest` and depends on the `test` job completing successfully.

---

## Security Considerations

### 1. Secret Management

- Use GitHub Secrets for all sensitive data
- Never log secrets in workflow outputs
- Use `add-mask` for dynamic secrets:
  ```bash
  echo "::add-mask::$SECRET_VALUE"
  ```

### 2. Permissions

- Use minimal required permissions
- Specify permissions explicitly:
  ```yaml
  permissions:
    contents: read
    issues: write
  ```

### 3. Branch Protection

Require status checks for main branch:
1. Go to Settings > Branches
2. Add rule for `main` branch
3. Require status checks:
   - Test workflow
   - Type check
   - Lint

---

## Monitoring and Alerts

### Email Notifications

Configure in GitHub settings:
1. Go to Settings > Notifications
2. Enable workflow notifications
3. Choose notification types

### Slack Integration

Use GitHub Slack app or custom webhook:

```yaml
- name: Notify Slack
  if: always()
  run: |
    curl -X POST -H 'Content-type: application/json' \
      --data '{"text":"Workflow completed: ${{ job.status }}"}' \
      ${{ secrets.SLACK_WEBHOOK }}
```

---

## Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Workflow Syntax](https://docs.github.com/en/actions/reference/workflow-syntax-for-github-actions)
- [Events that Trigger Workflows](https://docs.github.com/en/actions/reference/events-that-trigger-workflows)
- [GitHub CLI Manual](https://cli.github.com/manual/)
- [GitHub Actions Marketplace](https://github.com/marketplace?type=actions)

---

## Support

For issues or questions:
1. Check this documentation
2. Review workflow logs
3. Search GitHub Issues
4. Create a new issue with:
   - Workflow name
   - Run ID
   - Error message
   - Steps to reproduce
