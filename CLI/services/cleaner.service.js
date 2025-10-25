const fs = require('fs');
const path = require('path');

const { listModules } = require('./module-manifest.service');
const { toKebabCase } = require('../utils/case-utils');

const modulesDirectory = path.join(process.cwd(), 'app', 'Modules');

function listFilesystemModules() {
  try {
    return fs
      .readdirSync(modulesDirectory)
      .filter((entry) => !entry.startsWith('.'))
      .filter((entry) => entry !== 'modules.manifest.js')
      .filter((entry) => {
        const target = path.join(modulesDirectory, entry);
        return fs.statSync(target).isDirectory();
      })
      .map((entry) => ({ name: toKebabCase(entry), path: path.join(modulesDirectory, entry) }));
  } catch (error) {
    if (error.code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}

function analyzeModules() {
  const manifestModules = listModules();
  const manifestNames = new Set(manifestModules.map((module) => module.name));
  const filesystemModules = listFilesystemModules();

  const issues = [];

  filesystemModules.forEach((module) => {
    if (!manifestNames.has(module.name)) {
      issues.push({
        type: 'orphan-module',
        name: module.name,
        path: module.path,
        message: `Module directory ${module.path} is not registered in the manifest`,
      });
    }
  });

  manifestModules.forEach((module) => {
    const safePath = module.path.startsWith('.') ? module.path : `./${module.path}`;
    const modulePath = path.resolve(modulesDirectory, safePath);
    if (!fs.existsSync(modulePath)) {
      issues.push({
        type: 'missing-target',
        name: module.name,
        path: modulePath,
        message: `Manifest entry '${module.name}' points to missing target ${modulePath}`,
      });
    }
  });

  return {
    issues,
    filesystemModules,
    manifestModules,
  };
}

function pruneIssues(analysis, { yes = false, force = false } = {}) {
  if (!analysis || !Array.isArray(analysis.issues)) {
    return { deleted: [], skipped: [] };
  }

  const deletions = analysis.issues.filter((issue) => issue.type === 'orphan-module');
  const deleted = [];
  const skipped = [];

  deletions.forEach((issue) => {
    if (!yes) {
      skipped.push(issue);
      return;
    }

    try {
      fs.rmSync(issue.path, { recursive: true, force: Boolean(force) });
      deleted.push(issue);
    } catch (error) {
      skipped.push({ ...issue, error: error.message });
    }
  });

  return { deleted, skipped };
}

module.exports = {
  analyzeModules,
  pruneIssues,
};
