const { startHttpServer, watchHttpServer } = require('../services/application-runtime.service');

function registerServeCommands(program) {
  program
    .command('serve')
    .description('Run the HTTP server using the configured APP_PORT.')
    .option('-p, --port <port>', 'Override the configured port')
    .option('--once', 'Start the server and shut it down immediately after it is ready')
    .action(async (options) => {
      const port = options.port ? Number.parseInt(options.port, 10) : undefined;
      const runtime = startHttpServer({ port });
      const isOnce = Boolean(options.once);

      const handleShutdown = async (reason, exitCode = 0) => {
        await runtime.shutdown(reason);
        process.exit(exitCode);
      };

      if (isOnce) {
        const shutdownOnce = async () => {
          try {
            await runtime.shutdown('once');
            process.exit(0);
          } catch (error) {
            // eslint-disable-next-line no-console
            console.error('Failed to shutdown after --once:', error);
            process.exit(1);
          }
        };

        if (runtime.server?.listening) {
          setImmediate(shutdownOnce);
        } else {
          runtime.server?.once('listening', shutdownOnce);
        }
      }

      process.on('SIGTERM', () => handleShutdown('SIGTERM'));
      process.on('SIGINT', () => handleShutdown('SIGINT'));
      process.on('unhandledRejection', (reason) => {
        // eslint-disable-next-line no-console
        console.error('Unhandled promise rejection detected:', reason);
      });
      process.on('uncaughtException', (error) => {
        // eslint-disable-next-line no-console
        console.error('Uncaught exception detected:', error);
        handleShutdown('uncaughtException', 1);
      });
    });

  program
    .command('serve:watch')
    .description('Start the server with nodemon for live reloads.')
    .option('-p, --port <port>', 'Override the configured port')
    .action((options) => {
      const port = options.port ? Number.parseInt(options.port, 10) : undefined;
      try {
        const watcher = watchHttpServer({ port });
        watcher.on('exit', (code) => process.exit(code ?? 0));
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error(error.message);
        process.exit(1);
      }
    });
}

module.exports = registerServeCommands;
