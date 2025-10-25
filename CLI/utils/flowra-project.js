'use strict';

const path = require('path');

const { CLIError, findFlowraProjectRootSync } = require('./project');

function resolveProjectPath(...segments) {
  const projectRoot = findFlowraProjectRootSync(process.cwd());
  if (!projectRoot) {
    throw new CLIError('Unable to locate a Flowra project. Run this command inside a Flowra project directory.');
  }
  return path.join(projectRoot, ...segments);
}

function loadProjectModule(relativePath) {
  const absolutePath = resolveProjectPath(relativePath);
  try {
    // eslint-disable-next-line global-require, import/no-dynamic-require
    return require(absolutePath);
  } catch (error) {
    throw new CLIError(`Failed to load Flowra module at "${relativePath}": ${error.message}`);
  }
}

module.exports = {
  resolveProjectPath,
  loadProjectModule,
};
