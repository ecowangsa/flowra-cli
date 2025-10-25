const BaseController = require('../Shared/controllers/BaseController');
const HttpError = require('../../Errors/HttpError');

class UsersController extends BaseController {
  constructor({ logger, usersService } = {}) {
    super({ logger });
    this.logger = logger;
    this.usersService = usersService;
  }

  create = async (req, res, next) => {
    try {
      if (!this.usersService) {
        throw new HttpError(500, 'UsersService is not configured');
      }

      const result = await this.usersService.create(req.body);
      res.status(201).json(result);
    } catch (error) {
      const log = req.logger || this.logger;
      if (!(error instanceof HttpError)) {
        log?.error('http.users.create.failed', {
          message: error.message,
          stack: error.stack,
        });
      }
      next(error);
    }
  };
}

module.exports = UsersController;
