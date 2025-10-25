const configHelper = require('../../../core/Support/config');
const createLogger = require('../../../core/Services/LoggerService');
const Validation = require('../../Config/Validation');

function registerCore(container) {
  container
    .register('config', () => ({
      get: (key, defaultValue) => configHelper(key, defaultValue),
      all: (namespace) => configHelper.all(namespace),
    }))
    .register('logger', () => {
      const options = configHelper('logger');
      return createLogger(options);
    })
    .register(
      'validationFactory',
      (c) => {
        const logger = c.resolve('logger');
        return (rules, options = {}) =>
          new Validation(rules, { logger, connection: options.connection || 'default' });
      },
      { singleton: false }
    );

  return container;
}

module.exports = registerCore;
