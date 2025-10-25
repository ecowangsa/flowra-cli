class AppServiceProvider {
  constructor(container) {
    this.container = container;
  }

  async register() {
    // Register domain services or repositories here when the application grows.
  }

  async boot() {
    const logger = this.container.resolve('logger');
    logger.info('provider.app.booted');
  }
}

module.exports = AppServiceProvider;
