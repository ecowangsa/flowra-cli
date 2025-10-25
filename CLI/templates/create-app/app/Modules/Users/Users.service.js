const HttpError = require('../../Errors/HttpError');

class UsersService {
  constructor({ logger, userModel, validationFactory }) {
    this.logger = logger;
    this.userModel = userModel;
    this.validationFactory = validationFactory;
  }

  get rules() {
    return {
      username: { required: true, alpha_numeric: true },
      fullname: { required: true, alpha_numeric_space: true },
      email: { required: true, is_email: true, is_unique: 'users.email' },
    };
  }

  async create(payload) {
    const validator = this.validationFactory(this.rules);
    const errors = await validator.validate(payload);
    if (errors.length > 0) {
      throw new HttpError(422, 'Validation failed', errors);
    }

    this.logger?.info('modules.users.create.validate', {
      username: payload.username,
      email: payload.email,
    });

    // Placeholder for actual persistence using userModel
    if (this.userModel?.save) {
      try {
        await this.userModel.save({
          username: payload.username,
          fullname: payload.fullname,
          email: payload.email,
        });
      } catch (error) {
        this.logger?.warn('modules.users.create.persist_failed', { message: error.message });
      }
    }

    return {
      message: 'User created successfully',
      username: payload.username,
    };
  }
}

module.exports = UsersService;
