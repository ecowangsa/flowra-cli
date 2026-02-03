module.exports = {
  name: process.env.APP_NAME || 'flowra',
  env: process.env.APP_ENV || process.env.NODE_ENV || 'development',
  debug: String(process.env.APP_DEBUG ?? 'true').toLowerCase() === 'true',
  url: process.env.APP_URL || 'http://localhost:3387',
  port: parseInt(process.env.APP_PORT || process.env.PORT || '3387', 10),
  timezone: process.env.APP_TIMEZONE || process.env.TZ || 'Asia/Jakarta',
  http: {
    trustProxy: ['127.0.0.1', '::1'],
    cors: {
      enabled: true,
      origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ['*'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
      exposedHeaders: ['X-Request-ID', 'X-Response-Time'],
      maxAge: 3600,
    },
    rateLimit: {
      enabled: false,
      windowMs: 60_000,
      max: 100,
    },
  },
  providers: ['Providers/AppServiceProvider'],
};
