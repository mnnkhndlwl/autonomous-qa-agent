#!/usr/bin/env node

const path = require('path');
require('dotenv').config();
const { program } = require('commander');
const { run } = require('../src/runner');

program
  .name('qa-agent')
  .description('Run Maestro E2E tests and report results to Jira/Slack')
  .requiredOption('--branch <name>', 'git branch name to test')
  .requiredOption('--tests <path>', 'path to Maestro YAML file or directory')
  .requiredOption('--platform <platform>', 'ios or android')
  .option('--jira <key>', 'Jira issue key (e.g. APP-231); if provided, post test result comment to Jira')
  .option('--project <path>', 'path to project repo (git checkout, build, and tests run here; default: cwd)')
  .option('--slack [value]', 'notify Slack on failure (use --slack or --slack true to enable)', false)
  .parse(process.argv);

const options = program.opts();
const projectPath = options.project
  ? path.resolve(process.cwd(), options.project)
  : process.cwd();

run({
  branch: options.branch,
  tests: options.tests,
  jiraKey: options.jira,
  platform: options.platform,
  projectPath,
  notifySlack: options.slack === true || options.slack === 'true'
})
  .then((code) => {
    process.exit(code);
  })
  .catch((err) => {
    console.error('Unexpected error:', err && err.stack ? err.stack : err);
    process.exit(2);
  });
