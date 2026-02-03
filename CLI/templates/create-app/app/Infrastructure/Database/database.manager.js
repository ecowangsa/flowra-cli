const EventEmitter = require('events');
const knex = require('knex');

let instance;

class DatabaseManager extends EventEmitter {
  constructor({ config, logger }) {
    super();
    if (!config || !config.connections) {
      throw new Error('Database configuration with at least one connection is required');
    }

    this.config = config;
    this.logger = logger;
    this.connections = new Map();
  }

  connection(name = this.config.default) {
    const connectionName = name || this.config.default;
    if (this.connections.has(connectionName)) {
      return this.connections.get(connectionName);
    }

    const connectionConfig = this.config.connections[connectionName];
    if (!connectionConfig) {
      throw new Error(`Database connection '${connectionName}' is not defined`);
    }

    const client = knex(connectionConfig);

    client.on('query', (query) => {
      if (this.logger && typeof this.logger.debug === 'function') {
        this.logger.debug('database.query', {
          sql: query.sql,
          bindings: query.bindings,
          connection: connectionName,
        });
      }
    });

    client.on('query-error', (error, query) => {
      if (this.logger && typeof this.logger.error === 'function') {
        this.logger.error('database.query_error', {
          message: error.message,
          sql: query?.sql,
          bindings: query?.bindings,
          connection: connectionName,
        });
      }
    });

    this.connections.set(connectionName, client);
    this.emit('connected', connectionName);
    return client;
  }

  async shutdown() {
    const closing = [];
    for (const [name, connection] of this.connections.entries()) {
      if (typeof connection.destroy === 'function') {
        closing.push(
          connection.destroy().catch((error) => {
            if (this.logger && typeof this.logger.error === 'function') {
              this.logger.error('database.shutdown_error', { connection: name, message: error.message });
            }
          })
        );
      }
    }

    await Promise.all(closing);
    this.connections.clear();
    this.emit('shutdown');
  }

  static initialize(options) {
    if (!instance) {
      instance = new DatabaseManager(options);
    }
    return instance;
  }

  static getInstance() {
    if (!instance) {
      throw new Error('DatabaseManager has not been initialised');
    }
    return instance;
  }
}

module.exports = DatabaseManager;
