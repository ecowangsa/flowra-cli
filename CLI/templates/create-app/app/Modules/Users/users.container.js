'use strict';

const { asClass, asValue } = require('awilix');
const UsersModel = require('./Users.model');
const UsersController = require('./Users.controller');
const UsersService = require('./Users.service');
const registerUsersRoutes = require('./users.routes');
const bcrypt = require("bcrypt");

module.exports = (scope) => {
  scope.register({
    models: {
      user: asClass(UsersModel)
        .classic()
        .inject(({ resolve }) => {
          resolve('databaseManager');
          return { connection: 'default' };
        })
        .singleton(),
    },
    services: {
      main: asClass(UsersService)
        .inject(({ resolve }) => ({
          logger: resolve('logger'),
          userModel: resolve('modules.users.models.user'),
          validationFactory: resolve('validationFactory'),
          bcrypt: bcrypt
        }))
        .singleton(),
    },
    controllers: {
      main: asClass(UsersController)
        .inject(({ resolve }) => ({
          logger: resolve('logger'),
          usersService: resolve('modules.users.services.main'),
        }))
        .singleton(),
    },
    routes: asValue(registerUsersRoutes),
  });

  scope.registerAlias('usersController', 'controllers.main');
};
