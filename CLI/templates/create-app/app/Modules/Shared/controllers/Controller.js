class Controller {
  constructor({ models = {}, logger = null } = {}) {
    this.models = models;
    this.logger = logger;
  }
}

module.exports = Controller;
