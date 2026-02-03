const { Command } = require('commander');
const pkg = require('../package.json');

const registerServeCommands = require('./commands/serve.commands');
const registerCreateAppCommand = require('./commands/create-app.command');
const registerRouteCommands = require('./commands/route.commands');
const registerModuleCommands = require('./commands/module.commands');
const registerMakeCommands = require('./commands/make.commands');
const registerDatabaseCommands = require('./commands/database.commands');
const registerEnvironmentCommands = require('./commands/env.commands');
const registerConfigCommands = require('./commands/config.commands');
const registerHealthCommands = require('./commands/health.commands');
const registerCleanCommands = require('./commands/clean.commands');
const registerDocsCommands = require('./commands/docs.commands');
const { ensureFlowraProject } = require('./utils/project');

function buildProgram() {
  const program = new Command();
  program
    .name('flowra')
    .description('Flowra framework command line utilities')
    .version(pkg.version);

  registerServeCommands(program);
  registerRouteCommands(program);
  registerModuleCommands(program);
  registerMakeCommands(program);
  registerDatabaseCommands(program);
  registerEnvironmentCommands(program);
  registerConfigCommands(program);
  registerHealthCommands(program);
  registerCleanCommands(program);
  registerDocsCommands(program);
  registerCreateAppCommand(program);

  program
    .command('list')
    .description('List all available commands')
    .action(() => {
      const commands = program.commands.filter((cmd) => {
        const name = cmd.name();
        return name !== 'list' && name !== 'help';
      });

      if (!commands.length) {
        console.log('No commands registered.');
        return;
      }

      console.log('');
      console.log('Flowra CLI - Available Commands');
      console.log('───────────────────────────────────────────────');
      const longestName = commands.reduce(
        (max, cmd) => Math.max(max, cmd.name().length),
        0
      );

      commands.forEach((cmd) => {
        const name = cmd.name().padEnd(longestName + 2);
        const desc = cmd.description() || '';
        console.log(`  ${name}${desc}`);
      });

      console.log('───────────────────────────────────────────────');
      console.log('Tip: Run "flowra <command> --help" for more details.');
      console.log('');
    });

  program.hook('preAction', async (thisCommand, actionCommand) => {
    const target = actionCommand ?? thisCommand;
    const commandName = target.name();

    if (commandName === 'create-app' || commandName === 'list') {
      return;
    }

    await ensureFlowraProject(process.cwd());
  });

  return program;
}

async function run(argv = process.argv) {
  const program = buildProgram();
  await program.parseAsync(argv);
}

module.exports = { buildProgram, run };
