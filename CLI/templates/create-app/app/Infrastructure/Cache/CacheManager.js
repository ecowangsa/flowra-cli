const { createClient } = require('redis');

class CacheManager {
  constructor({ config, logger }) {
    this.config = config;
    this.logger = logger;
    this.clients = new Map();
  }

  async client(name = this.config.default) {
    if (this.clients.has(name)) {
      const existing = this.clients.get(name);
      if (existing && typeof existing.connect === 'function' && existing.isOpen === false) {
        await existing.connect();
      }
      return existing;
    }

    const store = this.config.stores[name];
    if (!store) {
      throw new Error(`Cache store '${name}' is not defined`);
    }

    if (store.driver === 'array') {
      const client = {
        type: 'array',
        isOpen: true,
        store: new Map(),
        async get(key) {
          return this.store.get(key) ?? null;
        },
        async set(key, value, options = {}) {
          this.store.set(key, value);
          if (options.EX) {
            setTimeout(() => this.store.delete(key), options.EX * 1000);
          }
        },
        async del(key) {
          this.store.delete(key);
        },
        async flushAll() {
          this.store.clear();
        },
      };
      this.clients.set(name, client);
      return client;
    }

    const client = createClient({
      socket: {
        host: store.host,
        port: store.port,
        tls: store.tls ? {} : undefined,
      },
      username: store.username,
      password: store.password,
      database: store.db,
    });

    client.on('error', (error) => {
      this.logger?.error('cache.error', { store: name, message: error.message });
    });

    client.on('connect', () => {
      this.logger?.info('cache.connected', { store: name });
    });

    await client.connect();
    this.clients.set(name, client);
    return client;
  }

  async shutdown() {
    for (const [name, client] of this.clients.entries()) {
      if (client && typeof client.quit === 'function') {
        await client.quit().catch((error) => {
          this.logger?.warn('cache.shutdown_error', { store: name, message: error.message });
        });
      } else if (client && typeof client.flushAll === 'function') {
        await client.flushAll();
      }
    }
    this.clients.clear();
  }
}

module.exports = CacheManager;
