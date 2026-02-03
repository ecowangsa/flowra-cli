'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const IGNORE_DIRS = new Set([
  '.git',
  'node_modules',
  'dist',
  'build',
  'coverage',
  '.cache',
  '.turbo',
]);

const CHECK_EXTENSIONS = new Set([
  '.js',
  '.cjs',
  '.mjs',
  '.json',
  '.md',
  '.yml',
  '.yaml',
  '.toml',
  '.txt',
  '.sh',
  '.bash',
  '.css',
  '.scss',
  '.html',
]);

const CHECK_FILES = new Set([
  'Dockerfile',
  '.editorconfig',
  '.gitattributes',
  '.gitignore',
]);

function shouldCheck(filePath) {
  const base = path.basename(filePath);
  if (CHECK_FILES.has(base)) {
    return true;
  }
  return CHECK_EXTENSIONS.has(path.extname(base).toLowerCase());
}

function walk(dir, files = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === '.' || entry.name === '..') {
      continue;
    }
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (IGNORE_DIRS.has(entry.name)) {
        continue;
      }
      walk(fullPath, files);
    } else if (entry.isFile() && shouldCheck(fullPath)) {
      files.push(fullPath);
    }
  }
  return files;
}

function checkFile(filePath) {
  const contents = fs.readFileSync(filePath, 'utf8');
  const relative = path.relative(ROOT, filePath);
  const issues = [];

  if (contents.includes('\r\n')) {
    issues.push({ line: 0, message: 'CRLF line endings detected (expected LF)' });
  }

  if (!contents.endsWith('\n')) {
    issues.push({ line: 0, message: 'Missing final newline' });
  }

  const lines = contents.split('\n');
  lines.forEach((rawLine, index) => {
    const line = rawLine.replace(/\r$/, '');
    if (/[ \t]+$/.test(line)) {
      issues.push({
        line: index + 1,
        message: 'Trailing whitespace',
      });
    }
  });

  return issues.map((issue) => ({ ...issue, file: relative }));
}

function main() {
  const files = walk(ROOT);
  const issues = files.flatMap(checkFile);

  if (issues.length === 0) {
    // eslint-disable-next-line no-console
    console.log(`Lint clean (${files.length} files checked).`);
    return;
  }

  // eslint-disable-next-line no-console
  console.error(`Lint found ${issues.length} issue(s):`);
  for (const issue of issues) {
    const location = issue.line ? `${issue.file}:${issue.line}` : issue.file;
    // eslint-disable-next-line no-console
    console.error(`- ${location} ${issue.message}`);
  }

  process.exitCode = 1;
}

main();
