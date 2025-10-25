module.exports = {
  level: process.env.LOG_LEVEL || (process.env.APP_ENV === 'production' ? 'info' : 'debug'),
  defaultMeta: {},
  console: {
    enabled: true,
    colorize: process.env.APP_ENV !== 'production',
  },
  file: {
    enabled: process.env.APP_ENV === 'production',
    directory: process.env.LOG_DIRECTORY || 'storage/logs',
    maxSize: 5 * 1024 * 1024,
    maxFiles: 5,
  },
};
