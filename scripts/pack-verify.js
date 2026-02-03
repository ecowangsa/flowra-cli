'use strict';

const { execFileSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const pkg = require(path.join(ROOT, 'package.json'));

const ALWAYS_INCLUDED = new Set([
  'package.json',
  'README.md',
  'README',
  'LICENSE',
  'LICENSE.md',
  'LICENCE',
  'LICENCE.md',
  'CHANGELOG.md',
  'CODE_OF_CONDUCT.md',
  'CONTRIBUTING.md',
  'SECURITY.md',
  'RELEASING.md',
]);

function normalizeEntry(entry) {
  if (!entry) return '';
  return entry.replace(/\/+$/, '');
}

function isAllowed(filePath) {
  if (ALWAYS_INCLUDED.has(filePath)) {
    return true;
  }
  const allowList = Array.isArray(pkg.files) ? pkg.files : [];
  return allowList.some((entry) => {
    const normalized = normalizeEntry(entry);
    return filePath === normalized || filePath.startsWith(`${normalized}/`);
  });
}

function main() {
  let result;
  try {
    const npmCache = path.join(os.tmpdir(), 'flowra-cli-npm-cache');
    fs.mkdirSync(npmCache, { recursive: true });
    const packDest = path.join(os.tmpdir(), 'flowra-cli-npm-pack');
    fs.mkdirSync(packDest, { recursive: true });
    const hasNpmExecPath = Boolean(process.env.npm_execpath);
    const npmCommand = hasNpmExecPath
      ? process.execPath
      : (process.platform === 'win32' ? 'npm.cmd' : 'npm');
    const npmArgs = [
      ...(hasNpmExecPath ? [process.env.npm_execpath] : []),
      'pack',
      '--json',
      '--pack-destination',
      packDest,
    ];
    const output = execFileSync(npmCommand, npmArgs, {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      env: {
        ...process.env,
        NPM_CONFIG_CACHE: npmCache,
        NPM_CONFIG_IGNORE_SCRIPTS: 'true',
        NPM_CONFIG_LOGLEVEL: 'silent',
        npm_config_ignore_scripts: 'true',
        npm_config_loglevel: 'silent',
        SKIP_GIT_HOOKS: '1',
      },
    });
    const trimmed = output.trim();
    let jsonSlice = trimmed;
    const startArray = trimmed.indexOf('[');
    const endArray = trimmed.lastIndexOf(']');
    if (startArray !== -1 && endArray > startArray) {
      jsonSlice = trimmed.slice(startArray, endArray + 1);
    } else {
      const startObj = trimmed.indexOf('{');
      const endObj = trimmed.lastIndexOf('}');
      if (startObj !== -1 && endObj > startObj) {
        jsonSlice = trimmed.slice(startObj, endObj + 1);
      }
    }

    const parsed = JSON.parse(jsonSlice);
    result = Array.isArray(parsed) ? parsed[0] : parsed;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Pack verify failed: unable to run npm pack.');
    // eslint-disable-next-line no-console
    console.error(error.message);
    process.exitCode = 1;
    return;
  }

  const files = Array.isArray(result?.files) ? result.files.map((file) => file.path) : [];
  if (!files.length) {
    // eslint-disable-next-line no-console
    console.error('Pack verify failed: no files found in npm pack output.');
    process.exitCode = 1;
    return;
  }

  const unexpected = files.filter((filePath) => !isAllowed(filePath));
  if (unexpected.length) {
    // eslint-disable-next-line no-console
    console.error('Pack verify failed: unexpected files found.');
    unexpected.forEach((filePath) => {
      // eslint-disable-next-line no-console
      console.error(`- ${filePath}`);
    });
    process.exitCode = 1;
  } else {
    // eslint-disable-next-line no-console
    console.log(`Pack verify OK (${files.length} files).`);
  }

  if (result?.filename) {
    const tarDir = result.packDestination || path.join(os.tmpdir(), 'flowra-cli-npm-pack');
    const tarPath = path.isAbsolute(result.filename)
      ? result.filename
      : path.join(tarDir, result.filename);
    if (fs.existsSync(tarPath)) {
      fs.unlinkSync(tarPath);
    }
  }
}

main();
