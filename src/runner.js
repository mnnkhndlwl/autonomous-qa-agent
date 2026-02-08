const fs = require("fs-extra");
const path = require("path");
const { checkoutBranch } = require("./git");
const { buildAndLaunch } = require("./build");
const { runMaestroTests } = require("./maestro");
const {
  createArtifactsDir,
  writeLogs,
  collectMaestroArtifacts,
} = require("./artifacts");
const { postComment } = require("./jira");
const { notifySlack } = require("./slack");

const EXIT = {
  PASS: 0,
  TEST_FAILURE: 1,
  INFRA_FAILURE: 2,
};

function formatJiraSuccess({ branch, tests, platform }) {
  return [
    "✅ Maestro tests passed",
    "",
    `Branch: ${branch}`,
    `Tests: ${tests}`,
    `Platform: ${platform}`,
  ].join("\n");
}

function formatJiraFailure({ branch, tests, platform }) {
  return [
    "❌ Maestro tests failed",
    "",
    `Branch: ${branch}`,
    `Failed test: ${tests}`,
    `Platform: ${platform}`,
    "See attached screenshots. (TODO: attach artifacts in future version.)",
  ].join("\n");
}

function formatSlackFailure({ branch, jiraKey }) {
  return [
    "🚨 E2E Tests Failed",
    `Branch: ${branch}`,
    `Jira: ${jiraKey || "N/A"}`,
  ].join("\n");
}

async function ensureTestsPath(testsPath) {
  if (!testsPath) {
    throw new Error("Missing tests path.");
  }

  const exists = await fs.pathExists(testsPath);
  if (!exists) {
    throw new Error(`Tests path does not exist: ${testsPath}`);
  }
}

async function run({
  branch,
  tests,
  jiraKey,
  platform,
  projectPath,
  notifySlack: slackFlag,
}) {
  const normalizedPlatform = platform ? platform.toLowerCase() : platform;
  const cwd = projectPath || process.cwd();
  const resolvedTests = path.isAbsolute(tests)
    ? tests
    : path.resolve(cwd, tests);

  await ensureTestsPath(resolvedTests);

  const artifactsDir = await createArtifactsDir();
  const logsFile = path.join(artifactsDir, "maestro.log");

  try {
    console.log(
      `Checking out branch: ${branch}${cwd !== process.cwd() ? ` (in ${cwd})` : ""}`,
    );
    await checkoutBranch(branch, cwd);
  } catch (err) {
    console.error(
      "Git checkout failed:",
      err && err.message ? err.message : err,
    );
    return EXIT.INFRA_FAILURE;
  }

  // try {
  //   console.log(`Building and launching app for platform: ${normalizedPlatform}`);
  //   await buildAndLaunch(normalizedPlatform, cwd);
  // } catch (err) {
  //   console.error('Build/launch failed:', err && err.message ? err.message : err);
  //   return EXIT.INFRA_FAILURE;
  // }

  console.log(`Running Maestro tests: ${resolvedTests}`);
  const result = await runMaestroTests(resolvedTests, cwd);

  await writeLogs(
    artifactsDir,
    result.all || result.stdout || result.stderr || "",
  );
  const artifactsInfo = await collectMaestroArtifacts(artifactsDir, cwd);

  if (!artifactsInfo.copied) {
    console.log(`No Maestro artifacts found at: ${artifactsInfo.sourceDir}`);
  } else {
    console.log(`Collected Maestro artifacts from ${artifactsInfo.sourceDir}`);
  }

  if (result.exitCode === 0) {
    if (jiraKey) {
      const comment = formatJiraSuccess({
        branch,
        tests,
        platform: normalizedPlatform,
      });
      try {
        await postComment(jiraKey, comment);
      } catch (err) {
        console.error(
          "Failed to post Jira comment:",
          err && err.message ? err.message : err,
        );
      }
    }

    console.log(`Maestro passed. Logs: ${logsFile}`);
    return EXIT.PASS;
  }

  if (jiraKey) {
    const comment = formatJiraFailure({
      branch,
      tests,
      platform: normalizedPlatform,
    });
    try {
      await postComment(jiraKey, comment);
    } catch (err) {
      console.error(
        "Failed to post Jira comment:",
        err && err.message ? err.message : err,
      );
    }
  }

  if (slackFlag) {
    try {
      await notifySlack(formatSlackFailure({ branch, jiraKey }));
    } catch (err) {
      console.error(
        "Failed to notify Slack:",
        err && err.message ? err.message : err,
      );
    }
  }

  console.error(
    `Maestro failed with exit code ${result.exitCode}. Logs: ${logsFile}`,
  );
  return EXIT.TEST_FAILURE;
}

module.exports = { run, EXIT };
