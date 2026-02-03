'use strict';
const group = require('routergroup');
function registerUsersRoutes({ router, container } = {}) {
  if (!router || !container) {
    return router;
  }

  const controller = container.resolve('modules.users.controllers.main');
  router.use(group('/users', (router) => {
    router.get('/list', controller.list.bind(controller));
    router.post('/create', controller.create.bind(controller));
  }));
  return router;
}

module.exports = registerUsersRoutes;
