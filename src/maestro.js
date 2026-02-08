const { execa } = require('execa');

async function runMaestroTests(testsPath, cwd) {
  if (!testsPath) {
    throw new Error('Missing tests path.');
  }

  const opts = { all: true, reject: false };
  if (cwd) opts.cwd = cwd;
  const result = await execa('maestro', ['test', testsPath], opts);

  return {
    exitCode: result.exitCode,
    stdout: result.stdout || '',
    stderr: result.stderr || '',
    all: result.all || ''
  };
}

module.exports = { runMaestroTests };
