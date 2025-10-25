const configHelper = require('../../../core/Support/config');

function safeConfig(key, fallback) {
  try {
    return configHelper(key, fallback);
  } catch (error) {
    if (error.message.startsWith('Configuration file not found')) {
      return fallback;
    }
    throw error;
  }
}

module.exports = safeConfig;
