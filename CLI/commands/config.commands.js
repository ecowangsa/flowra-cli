const { buildContainer } = require('../../../app/Bootstrap/Container/container.module');

function registerConfigCommands(program) {
  program
    .command('config:print')
    .description('Print active runtime configuration.')
    .option('--namespace <namespace>', 'Configuration namespace to inspect')
    .action((options) => {
      const container = buildContainer();
      const config = container.resolve('config');
      const namespace = options.namespace ? String(options.namespace).toLowerCase() : undefined;
      const payload = namespace ? config.all(namespace) : config.all();
      // eslint-disable-next-line no-console
      console.log(JSON.stringify(payload, null, 2));
    });
}

module.exports = registerConfigCommands;
