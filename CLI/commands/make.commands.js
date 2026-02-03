const {
  generateModuleScaffold,
  generateModel,
  generateController,
  generateService,
  generateRoute,
  generateValidator,
  generateQuery,
  generateResource,
} = require('../services/scaffolding.service');

function registerMakeCommands(program) {
  program
    .command('make:module <name>')
    .description('Generate a module scaffold and update the manifest.')
    .option('--force', 'Overwrite existing module directory')
    .option(
      '--controllers <controllers>',
      'Comma-separated list of controller segments (e.g. registrations,sessions)'
    )
    .action((name, options) => {
      const directory = generateModuleScaffold({
        name,
        controllers: options.controllers,
        force: Boolean(options.force),
      });
      // eslint-disable-next-line no-console
      console.log(`Module scaffold created at ${directory}`);
    });

  program
    .command('make:model <name>')
    .description('Generate a model.')
    .option('--db <alias>', 'Database connection alias to use')
    .option('--table <name>', 'Database table name override')
    .option('--module <module>', 'Target module to own the model')
    .action((name, options) => {
      const file = generateModel({ name, dbAlias: options.db, table: options.table, module: options.module });
      // eslint-disable-next-line no-console
      console.log(`Model created at ${file}`);
    });

  program
    .command('make:controller <name>')
    .description('Generate a controller.')
    .option('--module <module>', 'Target module')
    .action((name, options) => {
      const file = generateController({ name, module: options.module });
      // eslint-disable-next-line no-console
      console.log(`Controller created at ${file}`);
    });

  program
    .command('make:service <name>')
    .description('Generate a service.')
    .option('--module <module>', 'Target module')
    .action((name, options) => {
      const file = generateService({ name, module: options.module });
      // eslint-disable-next-line no-console
      console.log(`Service created at ${file}`);
    });

  program
    .command('make:route <name>')
    .description('Generate a route file.')
    .option('--module <module>', 'Target module')
    .action((name, options) => {
      const file = generateRoute({ name, module: options.module });
      // eslint-disable-next-line no-console
      console.log(`Route created at ${file}`);
    });

  program
    .command('make:validator <name>')
    .description('Generate a Zod validator.')
    .option('--module <module>', 'Target module')
    .action((name, options) => {
      const file = generateValidator({ name, module: options.module });
      // eslint-disable-next-line no-console
      console.log(`Validator created at ${file}`);
      // eslint-disable-next-line no-console
      console.log('Remember to install zod (npm install zod) if it is not already available in your project.');
    });

  program
    .command('make:query <name>')
    .description('Generate query helpers.')
    .option('--module <module>', 'Target module')
    .action((name, options) => {
      const file = generateQuery({ name, module: options.module });
      // eslint-disable-next-line no-console
      console.log(`Query created at ${file}`);
    });

  program
    .command('make:resource <name>')
    .description('Generate a full REST resource scaffold.')
    .option('--db <alias>', 'Database connection alias to use')
    .action((name, options) => {
      const directory = generateResource({ name, dbAlias: options.db });
      // eslint-disable-next-line no-console
      console.log(`Resource scaffold available at ${directory}`);
    });
}

module.exports = registerMakeCommands;
