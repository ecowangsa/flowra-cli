class Routing {
  constructor(container) {
    if (!container) {
      throw new Error('Routing requires a dependency container instance');
    }

    this.container = container;
    this.modules = container.resolve('modules');
  }
}

module.exports = Routing;
