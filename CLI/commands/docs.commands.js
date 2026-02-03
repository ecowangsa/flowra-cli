'use strict';

const fs = require('fs/promises');
const path = require('path');
const { ensureFlowraProject } = require('../utils/project');

function registerDocsCommands(program) {
  program
    .command('docs:generate')
    .description('Generate starter documentation for the current Flowra project')
    .option('-o, --output <file>', 'Documentation output file', 'docs/overview.md')
    .action(async (options) => {
      const projectRoot = await ensureFlowraProject(process.cwd());
      const outputPath = path.join(projectRoot, options.output);
      const dir = path.dirname(outputPath);
      await fs.mkdir(dir, { recursive: true });

      const content = buildDocsTemplate(path.relative(projectRoot, outputPath));
      await fs.writeFile(outputPath, content, 'utf8');

      // eslint-disable-next-line no-console
      console.log(`Documentation generated at ${path.relative(projectRoot, outputPath)}`);
    });
}

function buildDocsTemplate(relativePath) {
  const now = new Date();
  return [
    '# Project Overview',
    '',
    `Generated on ${now.toISOString()} using the Flowra CLI.`,
    '',
    '## Getting Started',
    '',
    '- Install dependencies with `npm install`.',
    '- Start the development server using `flowra serve`.',
    `- Explore documentation in \`${relativePath}\`.`,
    '',
    '## Directory Layout',
    '',
    '| Directory | Purpose |',
    '| --- | --- |',
    '| app/ | Application bootstrapping and modules |',
    '| core/ | Shared services and framework extensions |',
    '| main/ | Application entry point |',
    '| resources/ | Views and static assets |',
    '| database/ | Database migrations and seeds |',
    '| docs/ | Project documentation |',
    '',
    'Happy building!',
    '',
  ].join('\n');
}

module.exports = registerDocsCommands;
