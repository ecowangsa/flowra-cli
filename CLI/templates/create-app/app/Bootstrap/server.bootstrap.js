const express = require('express');
const path = require('path');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const optional = require('../../core/Support/optional');
const cors = optional('cors', () => (options = {}) => {
  const allowMethods = options.methods || ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'];
  const allowHeaders = options.allowedHeaders || ['Content-Type', 'Authorization'];
  const exposed = options.exposedHeaders || ['X-Request-ID', 'X-Response-Time'];
  return (req, res, next) => {
    const origin = Array.isArray(options.origin) ? options.origin[0] : options.origin || req.headers.origin || '*';
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
    res.setHeader('Access-Control-Allow-Methods', allowMethods.join(', '));
    res.setHeader('Access-Control-Allow-Headers', allowHeaders.join(', '));
    res.setHeader('Access-Control-Expose-Headers', exposed.join(', '));
    if (options.credentials) {
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    }
    if (options.maxAge) {
      res.setHeader('Access-Control-Max-Age', String(options.maxAge));
    }
    if (req.method === 'OPTIONS') {
      res.statusCode = 204;
      res.end();
      return;
    }
    next();
  };
});

const { buildContainer } = require('./Container/container.module');
const HttpRouter = require('../Http/http.router');
const createErrorHandler = require('../Http/Middleware/ErrorHandler');
const notFoundHandler = require('../Http/Middleware/NotFoundHandler');
const requestContext = require('../Http/Middleware/RequestContextMiddleware');

async function loadProviders(container, providerPaths = []) {
  for (const providerPath of providerPaths) {
    // eslint-disable-next-line import/no-dynamic-require, global-require
    const Provider = require(path.join(process.cwd(), 'app', providerPath));
    const provider = new Provider(container);
    if (typeof provider.register === 'function') {
      await provider.register();
    }
    if (typeof provider.boot === 'function') {
      await provider.boot();
    }
  }
}

function configureMorgan(logger) {
  const stream = {
    write: (message) => logger.info(message.trim()),
  };
  morgan.token('requestId', (req) => req.requestId);
  return morgan(':remote-addr :method :url :status :response-time ms :requestId', { stream });
}

function applyCors(app, appConfig) {
  if (!appConfig.http?.cors?.enabled) {
    return;
  }

  const corsOptions = {
    origin: appConfig.http.cors.origin || '*',
    credentials: Boolean(appConfig.http.cors.credentials),
    methods: appConfig.http.cors.methods || ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: appConfig.http.cors.allowedHeaders || ['Content-Type', 'Authorization'],
    exposedHeaders: appConfig.http.cors.exposedHeaders || ['X-Request-ID', 'X-Response-Time'],
    maxAge: appConfig.http.cors.maxAge || 3600,
  };

  app.use(cors(corsOptions));
}

function createApp() {
  const container = buildContainer();
  const logger = container.resolve('logger');
  const config = container.resolve('config');
  const appConfig = config.get('app');

  process.env.TZ = appConfig.timezone;

  const app = express();
  app.set('trust proxy', appConfig.http?.trustProxy || false);
  app.set('views', path.join(process.cwd(), 'resources', 'views'));
  app.set('view engine', 'ejs');

  app.disable('x-powered-by');

  app.use(helmet());
  app.use(compression());
  app.use(bodyParser.json({ limit: '1mb' }));
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(cookieParser());

  const handleFavicon = (req, res) => {
    res.status(204);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.setHeader('Content-Length', '0');
    res.end();
  };

  app.get('/favicon.ico', handleFavicon);
  app.head('/favicon.ico', handleFavicon);

  app.use(express.static(path.join(process.cwd(), 'public')));
  app.use(requestContext(logger));

  applyCors(app, appConfig);
  app.use(configureMorgan(logger));

  const routes = new HttpRouter(container).defineRoutes();
  app.use(routes);

  app.use(notFoundHandler);
  app.use(createErrorHandler(logger));

  loadProviders(container, appConfig.providers || []).catch((error) => {
    logger.error('provider.boot_error', { message: error.message, stack: error.stack });
  });

  return { app, container };
}

module.exports = { createApp };
