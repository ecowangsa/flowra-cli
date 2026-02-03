'use strict';

const { buildProgram } = require('./CLI/cli.program');
const { CLIError } = require('./CLI/utils/project');
const pkg = require('./package.json');

function printBanner() {
  const lines = [
    'Flowra CLI',
    `Version: ${pkg.version}`,
    'Create, serve, and manage Flowra applications from the command line.',
    '',
    'Usage:',
    '  flowra <command>',
    '',
    'Run "flowra list" to explore available commands.',
  ];

  for (const line of lines) {
    // eslint-disable-next-line no-console
    console.log(line);
  }
}

/**
 * Runs the CLI using the provided argv array. Any unhandled errors are caught
 * and displayed gracefully so we never crash with an unhelpful stack trace.
 *
 * @param {string[]} argv
 * @returns {Promise<void>}
 */
async function run(argv) {
  const program = buildProgram();

  // Prevent Commander from calling process.exit on its own so we can manage
  // error handling and exit codes in a single place.
  program.exitOverride();
  program.configureOutput({
    outputError: (str, write) => {
      write(`\nError: ${str.trim()}\n`);
    },
  });

  const tokens = Array.isArray(argv) ? argv.slice(2) : [];
  if (tokens.length === 0) {
    printBanner();
    return;
  }

  try {
    await program.parseAsync(argv);
  } catch (error) {
    handleError(error);
  }
}

/**
 * Handles errors thrown by commands, normalising the exit code and message.
 *
 * @param {Error} error
 */
function handleError(error) {
  if (error instanceof CLIError) {
    console.error(error.message);
    process.exitCode = error.exitCode;
    return;
  }

  if (error.code === 'commander.helpDisplayed') {
    process.exitCode = 0;
    return;
  }

  if (error.code === 'commander.version' || error.code === 'commander.versionOutput') {
    process.exitCode = 0;
    return;
  }

  if (error.code === 'commander.unknownCommand') {
    console.error(error.message);
    process.exitCode = 1;
    return;
  }

  if (error.code === 'commander.executeSubCommandAsync') {
    process.exitCode = error.exitCode || 1;
    return;
  }

  console.error('An unexpected error occurred:', error.message);
  if (process.env.DEBUG) {
    console.error(error.stack);
  }
  process.exitCode = 1;
}

module.exports = {
  run,
};
