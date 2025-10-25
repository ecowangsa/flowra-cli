'use strict';

require('dotenv').config({ path: '.env' });

const path = require('path');

const databaseConfig = require('./app/Config/Database');

function resolveConnection(name) {
  const key = name || databaseConfig.default;
  const connection = databaseConfig.connections?.[key];
  if (!connection) {
    throw new Error(`Unknown database connection '${key}' in ORM configuration.`);
  }
  return { key, config: connection };
}

function resolveDirectory(defaultPath, override) {
  const target = override || defaultPath;
  return path.isAbsolute(target) ? target : path.resolve(process.cwd(), target);
}

function buildConfig({ connectionName, migrationsDir, seedsDir } = {}) {
  const { key, config } = resolveConnection(connectionName || process.env.KNEX_CONNECTION);

  return {
    client: config.client,
    connection: config.connection,
    pool: config.pool,
    migrations: {
      ...config.migrations,
      directory: resolveDirectory(
        config.migrations?.directory || 'database/migrations',
        migrationsDir || process.env.KNEX_MIGRATIONS_DIR
      ),
    },
    seeds: {
      ...config.seeds,
      directory: resolveDirectory(config.seeds?.directory || 'database/seeds', seedsDir || process.env.KNEX_SEEDS_DIR),
    },
    log: config.log,
    connectionName: key,
  };
}

const configurations = {
  development: buildConfig(),
  test: buildConfig({ connectionName: process.env.KNEX_TEST_CONNECTION }),
  staging: buildConfig({ connectionName: process.env.KNEX_STAGING_CONNECTION }),
  production: buildConfig({ connectionName: process.env.KNEX_PRODUCTION_CONNECTION }),
};

module.exports = configurations;
module.exports.buildConfig = buildConfig;
module.exports.resolveConnection = resolveConnection;
