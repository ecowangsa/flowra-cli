'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const { promisify } = require('node:util');
const { execFile } = require('node:child_process');

const { run } = require('../cli');

const execFileAsync = promisify(execFile);
const ROOT_PACKAGE = require('../package.json');

async function createTempDir() {
  return fs.mkdtemp(path.join(os.tmpdir(), 'flowra-cli-'));
}

async function runCli(args, cwd) {
  const originalCwd = process.cwd();
  const originalExitCode = process.exitCode;
  const originalLog = console.log;
  const originalError = console.error;
  const logs = [];
  const errors = [];

  process.exitCode = 0;

  try {
    if (cwd) {
      process.chdir(cwd);
    }

    console.log = (...messages) => {
      logs.push(messages.join(' '));
    };
    console.error = (...messages) => {
      errors.push(messages.join(' '));
    };

    await run(['node', 'flowra', ...args]);
  } finally {
    if (cwd) {
      process.chdir(originalCwd);
    }
    console.log = originalLog;
    console.error = originalError;
  }

  const exitCode = process.exitCode ?? 0;
  process.exitCode = originalExitCode;

  return { exitCode, logs, errors };
}

test('create-app scaffolds a project outside Flowra workspaces', { concurrency: false }, async (t) => {
  const tempDir = await createTempDir();
  t.after(() => fs.rm(tempDir, { recursive: true, force: true }));

  const result = await runCli(['create-app', 'sample-app'], tempDir);
  assert.equal(result.exitCode, 0);
  assert.equal(result.errors.length, 0);

  const projectDir = path.join(tempDir, 'sample-app');
  const pkgPath = path.join(projectDir, 'package.json');
  const pkg = JSON.parse(await fs.readFile(pkgPath, 'utf8'));

  assert.equal(pkg.name, 'sample-app');
  assert.equal(pkg.dependencies.flowra, `^${ROOT_PACKAGE.version}`);

  await fs.access(path.join(projectDir, 'tests', 'project.test.js'));

  await execFileAsync('node', ['--test'], { cwd: projectDir });
});

test('create-app fails when executed inside an existing Flowra project', { concurrency: false }, async (t) => {
  const tempDir = await createTempDir();
  t.after(() => fs.rm(tempDir, { recursive: true, force: true }));

  await fs.writeFile(
    path.join(tempDir, 'package.json'),
    JSON.stringify(
      {
        name: 'existing-flowra-app',
        version: '1.0.0',
        dependencies: { flowra: '^1.0.0' },
      },
      null,
      2
    )
  );

  const result = await runCli(['create-app', 'duplicate-app'], tempDir);
  assert.equal(result.exitCode, 1);
  assert.equal(result.logs.length, 0);
  assert.match(result.errors.join('\n'), /already inside a Flowra project/);

  await assert.rejects(fs.access(path.join(tempDir, 'duplicate-app')));
});

test('commands other than create-app require a Flowra project', { concurrency: false }, async (t) => {
  const tempDir = await createTempDir();
  t.after(() => fs.rm(tempDir, { recursive: true, force: true }));

  const result = await runCli(['serve'], tempDir);
  assert.equal(result.exitCode, 1);
  assert.match(result.errors.join('\n'), /must be run inside a Flowra project/);
});

test('list command is available outside Flowra projects', { concurrency: false }, async (t) => {
  const tempDir = await createTempDir();
  t.after(() => fs.rm(tempDir, { recursive: true, force: true }));

  const result = await runCli(['list'], tempDir);
  assert.equal(result.exitCode, 0);
  assert.equal(result.errors.length, 0);
  assert.ok(result.logs.some((line) => line.includes('create-app')));
});

test('running the CLI without arguments displays the banner', { concurrency: false }, async (t) => {
  const tempDir = await createTempDir();
  t.after(() => fs.rm(tempDir, { recursive: true, force: true }));

  const result = await runCli([], tempDir);
  assert.equal(result.exitCode, 0);
  assert.equal(result.errors.length, 0);
  assert.ok(result.logs.some((line) => line.includes('Flowra CLI')));
  assert.ok(result.logs.some((line) => line.includes('flowra list')));
});
