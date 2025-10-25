const { verifyDatabaseConnections } = require('../services/health-check.service');

function registerHealthCommands(program) {
  program
    .command('health:check')
    .description('Validate DB connection bootstrapping.')
    .action(async () => {
      const results = await verifyDatabaseConnections();
      const hasFailure = results.some((result) => result.status !== 'ok');

      // eslint-disable-next-line no-console
      console.table(
        results.map((result) => ({
          Connection: result.alias,
          Status: result.status,
          Message: result.message || '',
        }))
      );

      if (hasFailure) {
        process.exitCode = 1;
      }
    });
}

module.exports = registerHealthCommands;
