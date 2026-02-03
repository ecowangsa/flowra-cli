'use strict';

const { execFileSync } = require('child_process');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

function runGit(args) {
  return execFileSync('git', args, { cwd: ROOT, encoding: 'utf8' }).trim();
}

function main() {
  const args = process.argv.slice(2);
  const allowMissing = args.includes('--allow-missing');
  const skipHooks =
    process.env.SKIP_GIT_HOOKS === '1' ||
    process.env.npm_config_ignore_scripts === 'true' ||
    process.env.NPM_CONFIG_IGNORE_SCRIPTS === 'true';

  if (skipHooks) {
    return;
  }

  try {
    runGit(['rev-parse', '--is-inside-work-tree']);
  } catch (error) {
    // eslint-disable-next-line no-console
    if (allowMissing) {
      // eslint-disable-next-line no-console
      console.log('Hook install skipped: not a git repository.');
      return;
    }
    // eslint-disable-next-line no-console
    console.error('Hook install failed: this is not a git repository.');
    process.exitCode = 1;
    return;
  }

  try {
    runGit(['config', 'core.hooksPath', '.githooks']);
  } catch (error) {
    // eslint-disable-next-line no-console
    if (allowMissing) {
      // eslint-disable-next-line no-console
      console.log('Hook install skipped: unable to set core.hooksPath.');
      return;
    }
    // eslint-disable-next-line no-console
    console.error('Hook install failed: unable to set core.hooksPath.');
    process.exitCode = 1;
    return;
  }

  // eslint-disable-next-line no-console
  console.log('Git hooks installed (core.hooksPath = .githooks).');
}

main();
