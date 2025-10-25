const { createApp } = require('../app/Bootstrap/server.bootstrap');

const { app, container } = createApp();
const config = container.resolve('config');
const logger = container.resolve('logger');
const databaseManager = container.resolve('databaseManager');
const cacheManager = container.resolve('cacheManager');
const queueManager = container.resolve('queueManager');

const port = config.get('app.port');

const server = app.listen(port, () => {
  logger.info(`Server running on port ${port}`);
});

async function shutdown({ code = 0, reason = 'shutdown' } = {}) {
  if (shutdown.inFlight) {
    return;
  }

  shutdown.inFlight = true;

  logger.info('application.shutdown.start', { reason });

  try {
    await new Promise((resolve) => {
      if (!server || server.listening === false) {
        resolve();
        return;
      }

      server.close((error) => {
        if (error) {
          logger.error('server.close.error', { message: error.message });
        }
        resolve();
      });
    });

    const tasks = [];

    if (databaseManager && typeof databaseManager.shutdown === 'function') {
      tasks.push(
        databaseManager.shutdown().catch((error) => {
          logger.error('database.shutdown.error', { message: error.message });
        })
      );
    }

    if (cacheManager && typeof cacheManager.shutdown === 'function') {
      tasks.push(
        cacheManager.shutdown().catch((error) => {
          logger.error('cache.shutdown.error', { message: error.message });
        })
      );
    }

    if (queueManager && typeof queueManager.shutdown === 'function') {
      tasks.push(
        queueManager.shutdown().catch((error) => {
          logger.error('queue.shutdown.error', { message: error.message });
        })
      );
    }

    await Promise.all(tasks);

    logger.info('application.shutdown.complete', { reason });
    process.exit(code);
  } catch (error) {
    logger.error('application.shutdown.failed', { message: error.message, stack: error.stack });
    process.exit(1);
  }
}

process.on('SIGTERM', () => shutdown({ code: 0, reason: 'SIGTERM' }));
process.on('SIGINT', () => shutdown({ code: 0, reason: 'SIGINT' }));
process.on('unhandledRejection', (reason) => {
  logger.error('application.unhandled_rejection', { reason });
});
process.on('uncaughtException', (error) => {
  logger.error('application.uncaught_exception', { message: error.message, stack: error.stack });
  shutdown({ code: 1, reason: 'uncaughtException' });
});
