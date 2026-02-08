const { execa } = require('execa');

function getPlatformCommand(prefix, platform) {
  const upper = platform.toUpperCase();
  const key = `${prefix}_${upper}`;
  return process.env[key];
}

async function runCommand(label, command, platform, cwd) {
  if (!command) {
    throw new Error(`${label} command not configured for ${platform}. Set ${label.toUpperCase()}_${platform.toUpperCase()}.`);
  }

  const opts = { stdio: 'inherit', shell: true };
  if (cwd) opts.cwd = cwd;
  await execa(command, opts);
}

async function buildAndLaunch(platform, cwd) {
  if (!platform || !['ios', 'android'].includes(platform)) {
    throw new Error(`Invalid platform: ${platform}. Expected 'ios' or 'android'.`);
  }

  const buildCommand = getPlatformCommand('BUILD_COMMAND', platform);
  const launchCommand = getPlatformCommand('LAUNCH_COMMAND', platform);

  await runCommand('BUILD_COMMAND', buildCommand, platform, cwd);

  if (launchCommand) {
    await runCommand('LAUNCH_COMMAND', launchCommand, platform, cwd);
  }
}

module.exports = { buildAndLaunch };
