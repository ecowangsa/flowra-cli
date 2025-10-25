'use strict';

const fs = require('fs/promises');
const path = require('path');
const pkg = require('../../../package.json');
const {
  CLIError,
  findFlowraProjectRoot,
  ensureTargetDirectory,
  toPackageName,
  pathExists,
} = require('../utils/project');

const TEMPLATE_DIRECTORY = path.join(__dirname, '../templates/create-app');
const IGNORED_TEMPLATE_ENTRIES = new Set(['node_modules', 'package-lock.json']);

function registerCreateAppCommand(program) {
  program
    .command('create-app <projectName>')
    .alias('create')
    .description('Create a new Flowra project scaffold')
    .option('-f, --force', 'Overwrite existing files when the target directory is not empty')
    .action(async (projectName, options) => {
      const cwd = process.cwd();
      const flowraRoot = await findFlowraProjectRoot(cwd);
      if (flowraRoot) {
        throw new CLIError('You are already inside a Flowra project. Please move to another folder.');
      }

      const projectDirName = projectName.trim();
      if (!projectDirName) {
        throw new CLIError('Project name cannot be empty.');
      }

      const targetDir = path.resolve(cwd, projectDirName);
      await ensureTargetDirectory(targetDir, { force: options.force, projectName: projectDirName });

      await scaffoldProject(targetDir, projectDirName, { force: options.force });

      // eslint-disable-next-line no-console
      console.log(`\nFlowra project created at ${targetDir}`);
      // eslint-disable-next-line no-console
      console.log('Next steps:');
      // eslint-disable-next-line no-console
      const relativePath = path.relative(cwd, targetDir) || '.';
      console.log(`  cd ${relativePath}`);
      // eslint-disable-next-line no-console
      console.log('  npm install');
      // eslint-disable-next-line no-console
      console.log('  npm run dev');
    });
}

async function scaffoldProject(targetDir, projectDirName, { force = false }) {
  const projectBaseName = path.basename(projectDirName);
  const packageName = toPackageName(projectBaseName);
  const replacements = new Map([
    ['__PACKAGE_NAME__', packageName],
    ['__PROJECT_DISPLAY_NAME__', projectBaseName],
    ['__FLOWRA_VERSION__', `^${pkg.version}`],
    ['__CURRENT_YEAR__', String(new Date().getFullYear())],
  ]);

  await copyTemplateDirectory(TEMPLATE_DIRECTORY, targetDir, { force, replacements });
}

async function copyTemplateDirectory(source, destination, { force, replacements }) {
  const entries = await fs.readdir(source, { withFileTypes: true });

  for (const entry of entries) {
    if (IGNORED_TEMPLATE_ENTRIES.has(entry.name)) {
      continue;
    }

    const sourcePath = path.join(source, entry.name);
    const targetPath = path.join(destination, entry.name);

    if (entry.isDirectory()) {
      await fs.mkdir(targetPath, { recursive: true });
      await copyTemplateDirectory(sourcePath, targetPath, { force, replacements });
      continue;
    }

    if (!force && (await pathExists(targetPath))) {
      const relative = path.relative(destination, targetPath) || entry.name;
      throw new CLIError(`File ${relative} already exists. Re-run with --force to overwrite.`);
    }

    let contents = await fs.readFile(sourcePath, 'utf8');
    for (const [token, value] of replacements) {
      contents = contents.split(token).join(value);
    }

    await fs.writeFile(targetPath, contents, 'utf8');
  }
}

module.exports = registerCreateAppCommand;
