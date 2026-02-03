'use strict';

const fs = require('fs');
const path = require('path');

const DEFAULT_TYPES = new Set([
  'feat',
  'fix',
  'perf',
  'refactor',
  'docs',
  'test',
  'build',
  'ci',
  'chore',
  'revert',
]);

function usage() {
  return 'Usage: node scripts/commitlint.js --message "<msg>" | --edit <file>';
}

function readMessage(args) {
  const messageIndex = args.indexOf('--message');
  if (messageIndex !== -1) {
    return args[messageIndex + 1] || '';
  }

  const editIndex = args.indexOf('--edit');
  if (editIndex !== -1) {
    const filePath = args[editIndex + 1];
    if (!filePath) return '';
    return fs.readFileSync(path.resolve(process.cwd(), filePath), 'utf8');
  }

  return '';
}

function normalizeMessage(raw) {
  return raw
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .join('\n');
}

function validateHeader(header) {
  if (!header) {
    return 'Commit message is empty.';
  }

  const match = header.match(/^(\w+)(\(([^)]+)\))?:\s+(.+)$/);
  if (!match) {
    return 'Commit header must match "type(scope?): description".';
  }

  const type = match[1];
  if (!DEFAULT_TYPES.has(type)) {
    return `Unknown commit type "${type}". Allowed: ${Array.from(DEFAULT_TYPES).join(', ')}.`;
  }

  const description = match[4];
  if (description.length < 3) {
    return 'Commit description is too short.';
  }

  if (description[0] !== description[0].toLowerCase()) {
    return 'Commit description should start with a lowercase letter.';
  }

  return null;
}

function main() {
  const args = process.argv.slice(2);
  if (!args.length) {
    // eslint-disable-next-line no-console
    console.error(usage());
    process.exitCode = 1;
    return;
  }

  const rawMessage = readMessage(args);
  const message = normalizeMessage(rawMessage);
  const [header] = message.split('\n');

  const error = validateHeader(header);
  if (error) {
    // eslint-disable-next-line no-console
    console.error(`Commitlint failed: ${error}`);
    process.exitCode = 1;
    return;
  }

  // eslint-disable-next-line no-console
  console.log('Commitlint OK.');
}

main();
