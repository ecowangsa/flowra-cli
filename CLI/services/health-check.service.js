const knexFactory = require('knex');

const databaseConfig = require('../../../app/Config/Database');

async function verifyDatabaseConnections() {
  const results = [];
  const connections = databaseConfig.connections || {};

  // eslint-disable-next-line no-restricted-syntax
  for (const [alias, config] of Object.entries(connections)) {
    const knex = knexFactory(config);
    try {
      await knex.raw('select 1 as result');
      results.push({ alias, status: 'ok' });
    } catch (error) {
      results.push({ alias, status: 'error', message: error.message });
    } finally {
      await knex.destroy();
    }
  }

  return results;
}

module.exports = {
  verifyDatabaseConnections,
};
