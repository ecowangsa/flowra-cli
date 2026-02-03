const express = require('express');
const Routing = require('./Routing');

class HttpRouter extends Routing {
  defineRoutes() {
    const router = express.Router();

    Object.values(this.modules || {}).forEach((module) => {
      if (module?.routes && typeof module.routes === 'function') {
        module.routes({
          router,
          container: this.container,
        });
      }
    });

    return router;
  }
}

module.exports = HttpRouter;
