const Controller = require('./Controller');

class BaseController extends Controller {
  constructor({ validationFactory = null, logger = null, models = {} } = {}) {
    super({ logger, models });
    this.validationFactory = validationFactory;
  }

  validator(rules) {
    if (!this.validationFactory) {
      throw new Error('Validation factory is not configured');
    }
    return this.validationFactory(rules);
  }
}

module.exports = BaseController;
