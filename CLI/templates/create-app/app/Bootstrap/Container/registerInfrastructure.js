const optional = require('../../../core/Support/optional');
const configHelper = require('../../../core/Support/config');
const DatabaseManager = require('../../Infrastructure/Database/database.manager');
const CacheManager = require('../../Infrastructure/Cache/CacheManager');
const Service = require('../../Config/Service');
const safeConfig = require('./safeConfig');

function registerInfrastructure(container) {
  container
    .register('databaseManager', (c) => {
      const logger = c.resolve('logger');
      const databaseConfig = configHelper('database');
      const manager = DatabaseManager.initialize({ config: databaseConfig, logger });
      Service.setDatabaseManager(manager);
      return manager;
    })
    .register('cacheManager', (c) => {
      const cacheConfig = configHelper('cache');
      const logger = c.resolve('logger');
      return new CacheManager({ config: cacheConfig, logger });
    })
    .register('redisManager', (c) => c.resolve('cacheManager'))
    .register('redisFactory', (c) => (name) => c.resolve('cacheManager').client(name))
    .register('mailer', (c) => {
      const mailConfig = safeConfig('mail', {});
      const logger = c.resolve('logger');
      const nodemailer = optional('nodemailer', () => null);

      if (nodemailer && typeof nodemailer.createTransport === 'function') {
        const transport = nodemailer.createTransport(mailConfig.transport || {});
        return {
          async sendMail(message) {
            return transport.sendMail(message);
          },
        };
      }

      return {
        async sendMail(message) {
          logger.warn('mailer.transport.unavailable', {
            notice: 'Install nodemailer and configure mail.transport to enable email delivery.',
          });
          return undefined;
        },
      };
    })
    .register('queueFactory', (c) => (...args) => c.resolve('queueManager').createQueue(...args))
    .register('queueManager', (c) => {
      const logger = c.resolve('logger');
      const queueConfig = safeConfig('queue', {});
      const bullmq = optional('bullmq', () => null);

      if (bullmq && bullmq.Queue) {
        return {
          createQueue(name, options = {}) {
            const connectionName = options.connection || queueConfig.defaultConnection || 'redis';
            const connectionConfig = queueConfig.connections?.[connectionName] || {};
            return new bullmq.Queue(name, {
              connection: connectionConfig,
              ...options,
            });
          },
          async shutdown(queues = []) {
            await Promise.all(
              queues
                .filter((queue) => queue && typeof queue.close === 'function')
                .map((queue) =>
                  queue.close().catch((error) => {
                    logger.warn('queue.shutdown_error', { queue: queue.name, message: error.message });
                  })
                )
            );
          },
        };
      }

      return {
        createQueue() {
          return {
            async add(jobName, payload) {
              logger.warn('queue.transport.unavailable', {
                jobName,
                payload,
                notice: 'Install bullmq and configure queue connections to enable background jobs.',
              });
              return undefined;
            },
          };
        },
        async shutdown() {
          logger.warn('queue.shutdown.skipped', {
            notice: 'No queue transport configured; skipping graceful shutdown for queues.',
          });
        },
      };
    });

  return container;
}

module.exports = registerInfrastructure;
