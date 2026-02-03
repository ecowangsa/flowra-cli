'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const { promisify } = require('node:util');
const { execFile, spawn } = require('node:child_process');

const { run } = require('../cli');

process.env.TZ = 'UTC';

const execFileAsync = promisify(execFile);
const ROOT_PACKAGE = require('../package.json');
const DEFAULT_FLOWRA_VERSION = process.env.FLOWRA_VERSION || ROOT_PACKAGE.version;
const EXPECTED_FLOWRA_VERSION = /^[~^><=]/.test(DEFAULT_FLOWRA_VERSION)
  ? DEFAULT_FLOWRA_VERSION
  : `^${DEFAULT_FLOWRA_VERSION}`;
const FLOWRA_BIN = path.join(__dirname, '..', 'bin', 'flowra.js');

async function createTempDir() {
  return fs.mkdtemp(path.join(os.tmpdir(), 'flowra-cli-'));
}

async function runCli(args, cwd) {
  const originalCwd = process.cwd();
  const originalExitCode = process.exitCode;
  const originalLog = console.log;
  const originalError = console.error;
  const originalTable = console.table;
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
    console.table = (data, properties) => {
      const rows = Array.isArray(data) ? data : [data];
      for (const row of rows) {
        if (row && typeof row === 'object') {
          const values = (properties && properties.length
            ? properties.map((prop) => row[prop])
            : Object.values(row)
          ).map((value) => String(value));
          logs.push(values.join(' | '));
        } else {
          logs.push(String(row));
        }
      }
    };

    await run(['node', 'flowra', ...args]);
  } finally {
    if (cwd) {
      process.chdir(originalCwd);
    }
    console.log = originalLog;
    console.error = originalError;
    console.table = originalTable;
  }

  const exitCode = process.exitCode ?? 0;
  process.exitCode = originalExitCode;

  return { exitCode, logs, errors };
}

async function runCliSpawn(args, cwd) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [FLOWRA_BIN, ...args], {
      cwd,
      env: { ...process.env, TZ: 'UTC' },
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });
    child.on('error', (error) => {
      resolve({ code: 1, stdout, stderr: `${stderr}${error.message}` });
    });
    child.on('close', (code) => {
      resolve({ code: code ?? 0, stdout, stderr });
    });
  });
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
  assert.equal(pkg.devDependencies['flowra-cli'], EXPECTED_FLOWRA_VERSION);

  await fs.access(path.join(projectDir, 'tests', 'project.test.js'));

  await execFileAsync(process.execPath, ['--test'], {
    cwd: projectDir,
    env: { ...process.env, TZ: 'UTC' },
  });

  const serviceConfig = await fs.readFile(path.join(projectDir, 'app', 'Config', 'Service.js'), 'utf8');
  assert.ok(!serviceConfig.includes('Libraries/Logger'), 'Service.js should not reference Libraries/Logger');
  assert.ok(serviceConfig.includes('LoggerService'), 'Service.js should use LoggerService');
  assert.ok(!serviceConfig.includes('Config/Database.js'), 'Service.js should not require Database directly');

  const databaseConfig = await fs.readFile(path.join(projectDir, 'app', 'Config', 'Database.js'), 'utf8');
  assert.ok(!databaseConfig.includes('class Database'), 'Database.js should export a config object');
  assert.ok(databaseConfig.includes('connections'), 'Database.js should define connections');
  assert.ok(databaseConfig.includes('mysql2'), 'Database.js should default to mysql2');
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
        devDependencies: { 'flowra-cli': '^1.0.0' },
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

  const result = await runCliSpawn(['list'], tempDir);
  assert.equal(result.code, 0);
  assert.equal(result.stderr.trim(), '');
  assert.match(result.stdout, /create-app/);
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

test('flowra --version prints the version and exits cleanly', { concurrency: false }, async (t) => {
  const tempDir = await createTempDir();
  t.after(() => fs.rm(tempDir, { recursive: true, force: true }));

  const result = await runCliSpawn(['--version'], tempDir);
  assert.equal(result.code, 0);
  assert.equal(result.stderr.trim(), '');
  assert.match(result.stdout, new RegExp(ROOT_PACKAGE.version.replace(/\./g, '\\.')));
});
