const HttpError = require('../../Errors/HttpError');

class UsersService {
  constructor({ logger, userModel, validationFactory, bcrypt}) {
    this.logger = logger;
    this.userModel = userModel;
    this.validationFactory = validationFactory;
    this.bcrypt = bcrypt
  }

  get rules() {
    return {
      username: { required: true, alpha_numeric: true },
      fullname: { required: true, alpha_numeric_space: true },
      email: { required: true, is_email: true, is_unique: 'users.email' },
      password: {required: true, minLength:8}
    };
  }

  async list() {
    if (this.userModel?.findAll) {
      try {
        const users = await this.userModel.findAll();
        return users;
      } catch (error) {
        this.logger?.warn('modules.users.list.fetch_failed', { message: error.message });
        throw new HttpError(500, 'Failed to fetch users');
      }
    }
    return [];
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
    if (this.userModel?.save) {
      const salt = await this.bcrypt.genSalt(10);
      const hashed = await this.bcrypt.hash(payload.password, salt);
      try {
        await this.userModel.save({
          username: payload.username,
          email: payload.email,
          password: hashed
        });
         return {
          message: 'User created successfully',
          username: payload.username,
        };
      } catch (error) {
        this.logger?.warn('modules.users.create.persist_failed', { message: error.message });
        throw new HttpError(500, 'Failed to create users');
      }
    }
  }
}

module.exports = UsersService;
