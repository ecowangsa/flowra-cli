'use strict';

const dotenv = require('dotenv');

dotenv.config();

const basePool = {
  min: 2,
  max: 10,
  acquireTimeoutMillis: 15000,
  createTimeoutMillis: 15000,
  idleTimeoutMillis: 30000,
  reapIntervalMillis: 10000,
};

function toNumber(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}

const mysqlSsl = process.env.DB_MYSQL_SSL === 'true'
  ? {
      rejectUnauthorized: false,
      ca: process.env.DB_MYSQL_SSL_CA,
    }
  : false;

const defaultConnection = {
  client: 'mysql2',
  debug: false,
  connection: {
    host: process.env.DB_MYSQL_HOST_PRIMARY || process.env.DB_MYSQL_HOST || '127.0.0.1',
    user: process.env.DB_DEFAULT_USERNAME || 'root',
    password: process.env.DB_DEFAULT_PASSWORD || '',
    database: process.env.DB_DEFAULT_DATABASE || 'flowra',
    port: toNumber(process.env.DB_MYSQL_PORT_PRIMARY || process.env.DB_MYSQL_PORT, 3306),
    ssl: mysqlSsl,
    timezone: '+07:00',
    charset: 'utf8',
  },
  pool: basePool,
};

const defaultReadConnection = {
  client: 'mysql2',
  debug: false,
  connection: {
    host:
      process.env.DB_MYSQL_HOST_READONLY ||
      process.env.DB_MYSQL_HOST_STANDBY ||
      process.env.DB_MYSQL_HOST_PRIMARY ||
      process.env.DB_MYSQL_HOST ||
      '127.0.0.1',
    user: process.env.DB_DEFAULT_USERNAME || 'root',
    password: process.env.DB_DEFAULT_PASSWORD || '',
    database: process.env.DB_DEFAULT_DATABASE || 'flowra',
    port: toNumber(
      process.env.DB_MYSQL_PORT_READONLY ||
        process.env.DB_MYSQL_PORT_STANDBY ||
        process.env.DB_MYSQL_PORT_PRIMARY ||
        process.env.DB_MYSQL_PORT,
      3306
    ),
    ssl: mysqlSsl,
    timezone: 'Z',
    charset: 'utf8',
  },
  pool: basePool,
};

module.exports = {
  default: 'default',
  connections: {
    default: defaultConnection,
    defaultRead: defaultReadConnection,
  },
};
