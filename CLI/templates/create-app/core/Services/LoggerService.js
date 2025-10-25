const fs = require('fs');
const path = require('path');
const { createLogger, format, transports } = require('winston');

function ensureLogDirectory(directory) {
  const resolved = path.isAbsolute(directory) ? directory : path.join(process.cwd(), directory);
  if (!fs.existsSync(resolved)) {
    fs.mkdirSync(resolved, { recursive: true });
  }
  return resolved;
}

function buildTransports(options) {
  const transportList = [];
  if (options.console?.enabled !== false) {
    transportList.push(
      new transports.Console({
        level: options.level,
        format: format.combine(
          format.colorize({ all: options.console?.colorize !== false }),
          format.timestamp(),
          format.printf(({ level, message, timestamp, ...metadata }) => {
            const context = metadata.context ? ` [${metadata.context}]` : '';
            const requestId = metadata.requestId ? ` (${metadata.requestId})` : '';
            const rest = { ...metadata };
            delete rest.context;
            delete rest.requestId;
            const metaString = Object.keys(rest).length ? ` ${JSON.stringify(rest)}` : '';
            return `${timestamp} ${level}:${context}${requestId} ${message}${metaString}\n`;
          })
        ),
      })
    );
  }

  if (options.file?.enabled) {
    const directory = ensureLogDirectory(options.file.directory || 'storage/logs');
    transportList.push(
      new transports.File({
        dirname: directory,
        filename: 'application.log',
        maxsize: options.file.maxSize || 5 * 1024 * 1024,
        maxFiles: options.file.maxFiles || 5,
        tailable: true,
        level: options.level,
        format: format.combine(format.timestamp(), format.json()),
      })
    );
  }

  return transportList;
}

function createApplicationLogger(options = {}) {
  const transportList = buildTransports(options);
  return createLogger({
    level: options.level || 'info',
    defaultMeta: options.defaultMeta || {},
    format: format.combine(format.errors({ stack: true }), format.splat(), format.json()),
    transports: transportList,
  });
}

module.exports = createApplicationLogger;
