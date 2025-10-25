const { randomUUID } = require('crypto');

function requestContext(logger) {
  return (req, res, next) => {
    const startedAt = process.hrtime.bigint();
    const requestId = req.headers['x-request-id'] || randomUUID();
    req.requestId = requestId;
    res.setHeader('X-Request-ID', requestId);

    const childLogger = typeof logger?.child === 'function' ? logger.child({ requestId }) : logger;
    req.logger = childLogger;

    const computeDurationMs = () => {
      const diffNs = process.hrtime.bigint() - startedAt;
      return Number(diffNs / BigInt(1e6));
    };

    const originalEnd = res.end;
    res.end = function endPatched(...args) {
      if (!res.headersSent) {
        const durationMs = computeDurationMs();
        res.setHeader('X-Response-Time', `${durationMs}ms`);
      }
      res.end = originalEnd;
      return originalEnd.apply(this, args);
    };

    res.on('finish', () => {
      const durationMs = computeDurationMs();
      if (childLogger && typeof childLogger.info === 'function') {
        childLogger.info('http.request.completed', {
          requestId,
          method: req.method,
          url: req.originalUrl,
          statusCode: res.statusCode,
          duration: durationMs,
        });
      }
    });

    res.on('close', () => {
      const durationMs = computeDurationMs();
      if (childLogger && typeof childLogger.warn === 'function' && !res.writableEnded) {
        childLogger.warn('http.request.aborted', {
          requestId,
          method: req.method,
          url: req.originalUrl,
          duration: durationMs,
        });
      }
    });

    next();
  };
}

module.exports = requestContext;
