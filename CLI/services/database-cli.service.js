const path = require('path');

const { loadProjectModule } = require('../utils/flowra-project');
const { ensureDir } = require('../utils/file-system');

function buildOrmConfig(alias, overrides = {}) {
  const ormConfig = loadProjectModule('orm.cli.config.js');
  return ormConfig.buildConfig({ connectionName: alias, ...overrides });
}

async function withKnex(alias, task) {
  const config = buildOrmConfig(alias);
  const knexFactory = loadProjectModule('node_modules/knex');
  const knex = knexFactory(config);
  try {
    return await task(knex, config);
  } finally {
    await knex.destroy();
  }
}

async function makeMigration(name, { env, directory } = {}) {
  if (!name) {
    throw new Error('Migration name is required');
  }

  return withKnex(env, async (knex, config) => {
    const targetDir = directory || config.migrations.directory;
    ensureDir(targetDir);
    const file = await knex.migrate.make(name, { directory: targetDir });
    return path.relative(process.cwd(), file);
  });
}

async function migrateLatest({ env } = {}) {
  return withKnex(env, async (knex, config) => {
    const [batch, log] = await knex.migrate.latest(config);
    return { batch, migrations: log };
  });
}

async function migrateRollback({ env, all } = {}) {
  return withKnex(env, async (knex, config) => {
    const [batch, log] = await knex.migrate.rollback(config, all === true ? true : undefined);
    return { batch, migrations: log };
  });
}

async function migrateStatus({ env } = {}) {
  return withKnex(env, async (knex, config) => {
    const [completed, pending] = await knex.migrate.list(config);
    return { completed, pending };
  });
}

async function makeSeed(name, { env, directory } = {}) {
  if (!name) {
    throw new Error('Seed name is required');
  }

  return withKnex(env, async (knex, config) => {
    const targetDir = directory || config.seeds.directory;
    ensureDir(targetDir);
    const file = await knex.seed.make(name, { directory: targetDir });
    return path.relative(process.cwd(), file);
  });
}

async function runSeeds({ env } = {}) {
  return withKnex(env, async (knex, config) => {
    const files = await knex.seed.run(config);
    return files;
  });
}

module.exports = {
  buildOrmConfig,
  makeMigration,
  migrateLatest,
  migrateRollback,
  migrateStatus,
  makeSeed,
  runSeeds,
};
