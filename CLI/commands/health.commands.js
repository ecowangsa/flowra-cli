const { verifyDatabaseConnections } = require('../services/health-check.service');

function registerHealthCommands(program) {
  program
    .command('health:check')
    .description('Validate DB connection bootstrapping.')
    .option('--json', 'Print machine-readable JSON output')
    .action(async (options) => {
      const results = await verifyDatabaseConnections();
      const hasFailure = results.some((result) => result.status !== 'ok');

      if (options.json) {
        const payload = results.map((result) => ({
          alias: result.alias,
          status: result.status,
          message: result.message || '',
        }));
        // eslint-disable-next-line no-console
        console.log(JSON.stringify(payload, null, 2));
      } else {
        // eslint-disable-next-line no-console
        console.table(
          results.map((result) => ({
            Connection: result.alias,
            Status: result.status,
            Message: result.message || '',
          }))
        );
      }

      if (hasFailure) {
        process.exitCode = 1;
      }
    });
}

module.exports = registerHealthCommands;
