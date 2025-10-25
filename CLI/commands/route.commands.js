const { listHttpRoutes } = require('../services/application-runtime.service');

function registerRouteCommands(program) {
  program
    .command('route:list')
    .description('Display registered routes from all enabled modules.')
    .action(() => {
      const routes = listHttpRoutes();
      if (!routes.length) {
        // eslint-disable-next-line no-console
        console.log('No routes registered.');
        return;
      }

      // eslint-disable-next-line no-console
      console.table(routes.map((route) => ({ Method: route.methods, Path: route.path })));
    });
}

module.exports = registerRouteCommands;
