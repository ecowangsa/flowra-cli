class HttpError extends Error {
  constructor(statusCode, message, details = undefined, code = 'E_HTTP_ERROR') {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.details = details;
    this.code = code;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = HttpError;
