'use strict';

const registerContainer = require('./welcome.container');
const registerRoutes = require('./welcome.routes');

module.exports = {
  name: 'welcome',
  register: registerContainer,
  routes: registerRoutes,
  aliases: {},
};
