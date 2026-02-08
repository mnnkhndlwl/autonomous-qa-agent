const path = require('path');
const fs = require('fs-extra');

function getDefaultArtifactsRoot() {
  return path.join(process.cwd(), 'qa-agent-artifacts');
}

async function createArtifactsDir() {
  const root = getDefaultArtifactsRoot();
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const dir = path.join(root, stamp);
  await fs.ensureDir(dir);
  return dir;
}

async function writeLogs(artifactsDir, logs) {
  const file = path.join(artifactsDir, 'maestro.log');
  await fs.writeFile(file, logs || '', 'utf8');
  return file;
}

async function collectMaestroArtifacts(artifactsDir, projectPath) {
  const defaultSource = projectPath
    ? path.join(projectPath, 'maestro-artifacts')
    : path.join(process.cwd(), 'maestro-artifacts');
  const sourceDir = process.env.MAESTRO_ARTIFACTS_DIR || defaultSource;

  const exists = await fs.pathExists(sourceDir);
  if (!exists) {
    return { copied: false, sourceDir };
  }

  const dest = path.join(artifactsDir, 'maestro-artifacts');
  await fs.copy(sourceDir, dest);
  return { copied: true, sourceDir, dest };
}

module.exports = {
  createArtifactsDir,
  writeLogs,
  collectMaestroArtifacts
};
