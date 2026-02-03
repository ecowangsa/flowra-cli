const { spawn } = require('child_process');
const path = require('path');

const { toKebabCase } = require('../utils/case-utils');
const { loadProjectModule } = require('../utils/flowra-project');

function joinRoutePath(base, segment) {
  const parts = [base, segment]
    .filter((value) => typeof value === 'string')
    .map((value) => value.replace(/(^\/+|\/+?$)/g, ''))
    .filter(Boolean);

  if (!parts.length) {
    return '/';
  }

  return `/${parts.join('/')}`.replace(/\/+/g, '/');
}

function parseLayerPath(layer) {
  if (!layer || !layer.regexp) {
    return '';
  }

  if (layer.regexp.fast_slash) {
    return '';
  }

  const match = layer.regexp
    .toString()
    .replace('/^', '')
    .replace('$/i', '')
    .replace('\/?(?=/|$)', '')
    .replace('\/?$', '')
    .replace('/i', '')
    .replace('(?=\\/|$)', '')
    .replace('^', '')
    .replace('$', '');

  return match
    .replace(/\\\//g, '/')
    .replace(/\(\?:\(\[\^\\\/\]\+\?\)\)/g, ':param')
    .replace(/\(\?:\(\[\^\\\/\]\+\?\)\)\?/g, ':param?')
    .replace(/\(\?:\(\.\*\)\)/g, '*')
    .replace(/\(\?:\)/g, '')
    .replace(/\(\[\^\)]+\)/g, ':param')
    .replace(/\/?\$/g, '')
    .replace(/\(\?:\)/g, '')
    .replace(/\?\//g, '/')
    .replace(/\?/g, '')
    .replace(/\$$/, '')
    .replace(/^\//, '');
}

function extractRoutesFromRouter(router, basePath = '') {
  const routes = [];

  if (!router || !router.stack) {
    return routes;
  }

  router.stack.forEach((layer) => {
    if (layer.route) {
      const methods = Object.keys(layer.route.methods || {})
        .filter((method) => layer.route.methods[method])
        .map((method) => method.toUpperCase())
        .sort();

      const fullPath = joinRoutePath(basePath, layer.route.path);
      routes.push({ methods, path: fullPath });
      return;
    }

    if (layer.name === 'router' && layer.handle?.stack) {
      const segment = layer.path || parseLayerPath(layer);
      const nestedBase = joinRoutePath(basePath, segment);
      routes.push(...extractRoutesFromRouter(layer.handle, nestedBase));
    }
  });

  return routes;
}

function listHttpRoutes() {
  const { buildContainer } = loadProjectModule('app/Bootstrap/Container/container.module.js');
  const HttpRouter = loadProjectModule('app/Http/http.router.js');

  const container = buildContainer();
  const router = new HttpRouter(container).defineRoutes();
  const routes = extractRoutesFromRouter(router);

  return routes
    .map((route) => ({
      methods: route.methods.join(','),
      path: route.path,
    }))
    .sort((a, b) => a.path.localeCompare(b.path));
}

function startHttpServer({ port: overridePort } = {}) {
  const { createApp } = loadProjectModule('app/Bootstrap/server.bootstrap.js');
  const { app, container } = createApp();
  const config = container.resolve('config');
  const logger = container.resolve('logger');
  const databaseManager = container.resolve('databaseManager');
  const cacheManager = container.resolve('cacheManager');
  const queueManager = container.resolve('queueManager');

  const port = overridePort || config.get('app.port');
  const server = app.listen(port, () => {
    logger.info(`flowra listening on port ${port}`);
  });

  const shutdown = async (reason) => {
    logger.info('cli.serve.shutdown', { reason });
    await new Promise((resolve) => {
      server.close(resolve);
    });

    const teardown = [databaseManager, cacheManager, queueManager]
      .filter(Boolean)
      .filter((manager) => typeof manager.shutdown === 'function')
      .map((manager) => manager.shutdown().catch((error) => logger.error('cli.shutdown.error', {
        manager: toKebabCase(manager.constructor?.name || 'manager'),
        message: error.message,
      })));

    await Promise.allSettled(teardown);
    logger.info('cli.serve.shutdown.complete', { reason });
  };

  return {
    server,
    container,
    port,
    shutdown,
  };
}

function watchHttpServer({ port, script = path.join('bin', 'flowra.js') } = {}) {
  let nodemonBin;
  try {
    nodemonBin = require.resolve('nodemon/bin/nodemon.js', { paths: [process.cwd()] });
  } catch (error) {
    throw new Error('Nodemon is required for serve:watch. Install it with "npm install --save-dev nodemon".');
  }

  const entryPoint = path.isAbsolute(script) ? script : path.join(process.cwd(), script);
  const watchArgs = [entryPoint, 'serve'];
  if (port) {
    watchArgs.push('--port', String(port));
  }

  return spawn(process.execPath, [nodemonBin, ...watchArgs], {
    stdio: 'inherit',
    env: { ...process.env, FORCE_COLOR: 'true' },
  });
}

module.exports = {
  listHttpRoutes,
  startHttpServer,
  watchHttpServer,
};
