module.exports = {
  default: 'redis',
  stores: {
    redis: {
      driver: 'redis',
      host: process.env.REDIS_HOST || '127.0.0.1',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
      username: process.env.REDIS_USERNAME || undefined,
      password: process.env.REDIS_PASSWORD || undefined,
      db: parseInt(process.env.REDIS_DB || '0', 10),
      tls: process.env.REDIS_TLS === 'true',
    },
    array: {
      driver: 'array',
    },
  },
};
