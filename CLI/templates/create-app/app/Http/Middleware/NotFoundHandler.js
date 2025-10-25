const HttpError = require('../../Errors/HttpError');

module.exports = (req, res, next) => {
  next(new HttpError(404, 'Resource not found', { path: req.originalUrl }, 'E_ROUTE_NOT_FOUND'));
};
