'use strict';

const registerContainer = require('./users.container');
const registerRoutes = require('./users.routes');

module.exports = {
  name: 'users',
  register: registerContainer,
  routes: registerRoutes,
  aliases: {},
};
