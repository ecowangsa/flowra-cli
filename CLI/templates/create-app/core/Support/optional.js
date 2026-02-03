function optional(moduleName, fallbackFactory = () => undefined) {
  try {
    // eslint-disable-next-line global-require, import/no-dynamic-require
    return require(moduleName);
  } catch (error) {
    if (error.code === 'MODULE_NOT_FOUND') {
      return fallbackFactory();
    }
    throw error;
  }
}

module.exports = optional;
