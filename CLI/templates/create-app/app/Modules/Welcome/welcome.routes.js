'use strict';

function registerWelcomeRoutes({ router, container } = {}) {
  if (!router || !container) {
    return router;
  }

  const home = container.resolve('modules.welcome.controllers.home');
  router.get('/', home.index.bind(home));
  return router;
}

module.exports = registerWelcomeRoutes;
