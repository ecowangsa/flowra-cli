'use strict';

const { execFileSync } = require('child_process');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const pkg = require(path.join(ROOT, 'package.json'));

function runGit(args) {
  return execFileSync('git', args, { cwd: ROOT, encoding: 'utf8' }).trim();
}

function main() {
  let status;
  try {
    status = runGit(['status', '--porcelain']);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Release verify failed: git is required.');
    process.exitCode = 1;
    return;
  }

  if (status) {
    // eslint-disable-next-line no-console
    console.error('Release verify failed: working tree is not clean.');
    process.exitCode = 1;
    return;
  }

  const expectedTag = `v${pkg.version}`;
  let headTag = '';
  try {
    headTag = runGit(['tag', '--points-at', 'HEAD']);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Release verify failed: unable to read git tags.');
    process.exitCode = 1;
    return;
  }

  const tags = headTag.split('\n').map((tag) => tag.trim()).filter(Boolean);
  if (!tags.includes(expectedTag)) {
    // eslint-disable-next-line no-console
    console.error(`Release verify failed: expected tag ${expectedTag} on HEAD.`);
    process.exitCode = 1;
    return;
  }

  // eslint-disable-next-line no-console
  console.log(`Release verify OK: ${expectedTag}`);
}

main();
