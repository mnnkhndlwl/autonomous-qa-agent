# qa-agent

CLI-based Autonomous QA Agent that runs Maestro E2E tests and reports results to Jira and Slack.

## Install

```bash
cd qa-agent
npm install
```

## Environment Variables

- `JIRA_BASE_URL` - Jira base URL, e.g. https://your-domain.atlassian.net
- `JIRA_EMAIL` - Jira account email
- `JIRA_API_TOKEN` - Jira API token
- `SLACK_WEBHOOK_URL` - Slack incoming webhook URL (required only when using `--slack`)
- `BUILD_COMMAND_IOS` - Build command for iOS
- `BUILD_COMMAND_ANDROID` - Build command for Android
- `LAUNCH_COMMAND_IOS` - Launch command for iOS (optional)
- `LAUNCH_COMMAND_ANDROID` - Launch command for Android (optional)
- `MAESTRO_ARTIFACTS_DIR` - Optional path where Maestro outputs artifacts (default: `./maestro-artifacts`)

A `.env` file in the project root is loaded automatically when you run the CLI (via `dotenv`). Copy `.env.example` to `.env` and fill in your values. Do not commit `.env` (it is in `.gitignore`).

### Build and launch commands (spaces and special characters)

The build/launch values are run as a **single shell command**. Use the full command as one string. When **setting** the variable, quote the value so your shell doesn’t split it.

**In the shell (export):**

```bash
# Command with spaces (e.g. yarn buyer android)
export BUILD_COMMAND_ANDROID="yarn buyer android"

# Command with path (e.g. yarn buyer/android)
export BUILD_COMMAND_ANDROID="yarn buyer/android"

# More complex example
export BUILD_COMMAND_ANDROID="yarn workspace @app/buyer run build:android"
```

**In a `.env` file** (no `export`; quotes optional but safe):

```bash
BUILD_COMMAND_ANDROID="yarn buyer android"
LAUNCH_COMMAND_ANDROID="yarn buyer android --run"
```

**Rule of thumb:** Set the variable to the exact command you would type in the terminal (including spaces, slashes, dashes). Always use quotes when the value contains spaces.

## Usage

### Basic (run from project root)

When you are already in the repo you want to test:

```bash
qa-agent \
  --branch feature/foo \
  --tests ./apps/mobile/.maestro \
  --jira APP-231 \
  --platform ios \
  --slack
```

### Running in a specific project

Use `--project <path>` when you have multiple projects or when you run the CLI from outside the repo. Git checkout, build, launch, and Maestro all run **inside** that directory.

| You want to… | Do this |
|--------------|--------|
| Run from another folder (e.g. monorepo root or scripts dir) | `--project /absolute/path/to/app-repo` or `--project ../other-app` |
| Run from inside the repo (same as before) | Omit `--project` (or use `--project .`) |

**Examples:**

```bash
# Absolute path — run QA for a specific app while your shell is anywhere
qa-agent \
  --project /Users/you/repos/my-mobile-app \
  --branch feature/login \
  --tests ./.maestro \
  --jira APP-456 \
  --platform ios

# Relative path — run from monorepo root for one of several apps
qa-agent \
  --project ./packages/app-ios \
  --branch release/1.2 \
  --tests ./e2e \
  --jira APP-789 \
  --platform ios
```

### Test path (`--tests`)

- **Meaning**: Path to a Maestro YAML file or a directory containing Maestro flows (e.g. `.maestro/` or `e2e/`).
- **Without `--project`**: Path is relative to your **current working directory** (or use an absolute path).
- **With `--project`**: Path is relative to the **project directory** unless you pass an absolute path.

| Scenario | `--tests` value |
|----------|-----------------|
| Tests in project root | `./.maestro` or `.maestro` |
| Tests in a subfolder | `./apps/mobile/.maestro` or `apps/mobile/e2e` |
| Single flow file | `./.maestro/smoke.yaml` |
| Absolute path (same in both modes) | `/Users/you/shared/.maestro` |

**Examples with `--project`:**

```bash
# Project at /path/to/app; tests at /path/to/app/.maestro
--project /path/to/app --tests ./.maestro

# Project at ./packages/app; tests at ./packages/app/apps/mobile/.maestro
--project ./packages/app --tests ./apps/mobile/.maestro
```

### Options reference

| Option | Required | Description |
|--------|----------|-------------|
| `--branch <name>` | Yes | Git branch to checkout and test |
| `--tests <path>` | Yes | Maestro YAML file or directory (relative to project when using `--project`) |
| `--platform <platform>` | Yes | `ios` or `android` |
| `--jira <key>` | No | Jira issue key (e.g. `APP-231`); only if provided, a test result comment is posted to Jira |
| `--project <path>` | No | Path to the project repo; default is current directory |
| `--slack` or `--slack true` | No | Send a Slack notification when tests fail; omit or use `false` to skip |

## Exit Codes

- `0` - All tests passed
- `1` - Maestro tests failed
- `2` - Infrastructure failure (git checkout/build/launch)

## Notes

- Maestro must be installed and available on PATH.
- Artifacts are collected under `./qa-agent-artifacts/<timestamp>`.
