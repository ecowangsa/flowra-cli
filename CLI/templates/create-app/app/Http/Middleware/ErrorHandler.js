const HttpError = require('../../Errors/HttpError');

function createErrorHandler(logger) {
  return (err, req, res, next) => {
    const error =
      err instanceof HttpError
        ? err
        : new HttpError(500, err.message || 'Internal server error', {
            stack: err.stack,
          });

    const payload = {
      code: error.code,
      statusCode: error.statusCode,
      message: error.message,
      details: error.details,
      timestamp: new Date().toISOString(),
      path: req.originalUrl,
      requestId: req.requestId,
    };

    if (logger && typeof logger.error === 'function') {
      logger.error('http.error', {
        ...payload,
        stack: error.stack,
      });
    }

    if (res.headersSent) {
      return next(err);
    }

    res.status(error.statusCode).json(payload);
    return undefined;
  };
}

module.exports = createErrorHandler;
