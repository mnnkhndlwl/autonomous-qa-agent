const { execa } = require('execa');

async function checkoutBranch(branch, cwd) {
  if (!branch) {
    throw new Error('Missing branch name.');
  }
  const opts = { stdio: 'inherit' };
  if (cwd) opts.cwd = cwd;
  await execa('git', ['checkout', branch], opts);
}

module.exports = { checkoutBranch };
