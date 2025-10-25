'use strict';

function registerUsersRoutes({ router, container } = {}) {
  if (!router || !container) {
    return router;
  }

  const controller = container.resolve('modules.users.controllers.main');
  router.post('/users', controller.create.bind(controller));
  return router;
}

module.exports = registerUsersRoutes;
