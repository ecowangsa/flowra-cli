'use strict';

const { asClass, asFunction, asValue } = require('awilix');
const SystemInfoQuery = require('./SystemInfo.query');
const WelcomeService = require('./Welcome.service');
const WelcomeController = require('./Welcome.controller');
const registerWelcomeRoutes = require('./welcome.routes');

module.exports = (scope) => {
  scope.register({
    queries: {
      systemInfo: asClass(SystemInfoQuery).singleton(),
    },
    services: {
      landing: asClass(WelcomeService)
        .inject(({ resolve }) => ({
          logger: resolve('logger'),
          systemInfoQuery: resolve('modules.welcome.queries.systemInfo'),
        }))
        .singleton(),
    },
    controllers: {
      home: asClass(WelcomeController)
        .inject(({ resolve }) => ({
          logger: resolve('logger'),
          welcomeService: resolve('modules.welcome.services.landing'),
        }))
        .singleton(),
    },
    routes: asValue(registerWelcomeRoutes),
  });

  scope.registerAlias('homeController', 'controllers.home');
};
