const { Command } = require('commander');
const pkg = require('../../package.json');

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
      // eslint-disable-next-line no-console
      program.commands
        .filter((command) => command.name() !== 'list')
        .forEach((command) => {
          const aliases = command.aliases ? command.aliases() : [];
          const label = [command.name(), ...aliases].join(', ');
          // eslint-disable-next-line no-console
          console.log(`${label.padEnd(25)} ${command.description()}`);
        });
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
