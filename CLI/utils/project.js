'use strict';

const fs = require('fs/promises');
const path = require('path');

/**
 * Custom error class used to signal expected CLI failures. These errors are
 * caught by the CLI runner so that users see a friendly message instead of a
 * stack trace.
 */
class CLIError extends Error {
  constructor(message, exitCode = 1) {
    super(message);
    this.name = 'CLIError';
    this.exitCode = exitCode;
  }
}

/**
 * Reads and parses a JSON file. Returns null when the file does not exist.
 *
 * @param {string} filePath
 * @returns {Promise<object|null>}
 */
async function readJsonFile(filePath) {
  try {
    const contents = await fs.readFile(filePath, 'utf8');
    return JSON.parse(contents);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return null;
    }

    if (error.name === 'SyntaxError') {
      throw new CLIError(`Failed to parse JSON file at ${filePath}: ${error.message}`);
    }

    throw new CLIError(`Unable to read ${filePath}: ${error.message}`);
  }
}

/**
 * Determines whether the provided package.json object declares Flowra in any
 * dependency section.
 *
 * @param {object|null} pkg
 * @returns {boolean}
 */
function packageHasFlowra(pkg) {
  if (!pkg) {
    return false;
  }

  const sections = ['dependencies', 'devDependencies', 'peerDependencies'];
  return sections.some((section) => pkg[section] && Object.prototype.hasOwnProperty.call(pkg[section], 'flowra'));
}

/**
 * Walks up from the provided directory until a Flowra project root is found.
 *
 * @param {string} startDir
 * @returns {Promise<string|null>}
 */
async function findFlowraProjectRoot(startDir) {
  let current = path.resolve(startDir);

  while (true) {
    const pkg = await readJsonFile(path.join(current, 'package.json'));
    if (packageHasFlowra(pkg)) {
      return current;
    }

    const parent = path.dirname(current);
    if (parent === current) {
      return null;
    }
    current = parent;
  }
}

/**
 * Ensures the current working directory is inside a Flowra project.
 *
 * @param {string} startDir
 * @returns {Promise<string>}
 */
async function ensureFlowraProject(startDir) {
  const root = await findFlowraProjectRoot(startDir);
  if (!root) {
    throw new CLIError('This command must be run inside a Flowra project.');
  }
  return root;
}

/**
 * Simple helper to determine whether a path exists.
 *
 * @param {string} targetPath
 * @returns {Promise<boolean>}
 */
async function pathExists(targetPath) {
  try {
    await fs.access(targetPath);
    return true;
  } catch (error) {
    if (error.code === 'ENOENT') {
      return false;
    }
    throw new CLIError(`Unable to access ${targetPath}: ${error.message}`);
  }
}

/**
 * Determines whether a directory is empty. Hidden files are considered part of
 * the directory contents.
 *
 * @param {string} directory
 * @returns {Promise<boolean>}
 */
async function isDirectoryEmpty(directory) {
  const entries = await fs.readdir(directory);
  return entries.length === 0;
}

/**
 * Ensures a target directory is ready for scaffolding. It either creates the
 * directory if it does not exist or verifies that it is empty unless --force
 * is provided.
 *
 * @param {string} targetDir
 * @param {{ force?: boolean, projectName: string }} options
 * @returns {Promise<void>}
 */
async function ensureTargetDirectory(targetDir, { force = false, projectName }) {
  const exists = await pathExists(targetDir);
  if (!exists) {
    await fs.mkdir(targetDir, { recursive: true });
    return;
  }

  const stats = await fs.stat(targetDir);
  if (!stats.isDirectory()) {
    throw new CLIError(`Target path "${projectName}" exists but is not a directory.`);
  }

  if (force) {
    return;
  }

  const empty = await isDirectoryEmpty(targetDir);
  if (!empty) {
    const suggestion = await findAvailableDirectoryName(path.dirname(targetDir), projectName);
    throw new CLIError(
      `Directory "${projectName}" already exists and is not empty. Consider using "${suggestion}" or re-run with --force.`
    );
  }
}

/**
 * Suggests a new directory name by appending `-new`, `-new1`, `-new2`, etc.
 *
 * @param {string} parentDir
 * @param {string} baseName
 * @returns {Promise<string>}
 */
async function findAvailableDirectoryName(parentDir, baseName) {
  let attempt = `${baseName}-new`;
  let counter = 1;

  while (await pathExists(path.join(parentDir, attempt))) {
    attempt = `${baseName}-new${counter}`;
    counter += 1;
  }

  return attempt;
}

/**
 * Normalises a string into a safe npm package name.
 *
 * @param {string} name
 * @returns {string}
 */
function toPackageName(name) {
  return (
    name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, '-')
      .replace(/-{2,}/g, '-')
      .replace(/^-+|-+$/g, '') || 'flowra-app'
  );
}

module.exports = {
  CLIError,
  findFlowraProjectRoot,
  ensureFlowraProject,
  ensureTargetDirectory,
  toPackageName,
  pathExists,
};
