const { writeExample, checkEnvironment } = require('../services/environment.service');

function registerEnvironmentCommands(program) {
  program
    .command('env:example')
    .description('Regenerate .env.example.')
    .action(() => {
      const target = writeExample();
      // eslint-disable-next-line no-console
      console.log(`Environment example written to ${target}`);
    });

  program
    .command('env:check')
    .description('Validate required environment variables.')
    .action(() => {
      const { missing } = checkEnvironment();
      if (missing.length) {
        // eslint-disable-next-line no-console
        console.error('Missing environment variables:');
        // eslint-disable-next-line no-console
        missing.forEach((key) => console.error(` - ${key}`));
        process.exitCode = 1;
        return;
      }
      // eslint-disable-next-line no-console
      console.log('Environment variables look good.');
    });
}

module.exports = registerEnvironmentCommands;
