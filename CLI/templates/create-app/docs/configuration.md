# Configuration

flowra centralises configuration under `app/Config`. Files export plain objects consumed through the `config(path, defaultValue)` helper.

## Available Files

- `App.js` – application metadata, HTTP options, and providers.
- `Database.js` – Knex connection pools, migrations, and logging settings.
- `Cache.js` – Redis and in-memory cache stores.
- `Logger.js` – log levels and transport configuration.

## Using the Helper

```js
const config = require('../../core/Support/config');
const port = config('app.port', 3387);
const redisHost = config('cache.stores.redis.host');
```

Call `config.all()` to retrieve a map of every configuration object. `config.reload(namespace)` busts the cache for hot reloading.

## Environment Variables

flowra reads `.env` via `dotenv`. Key variables include:

| Variable | Description | Default |
| --- | --- | --- |
| `APP_ENV` | Environment name | `development` |
| `APP_DEBUG` | Enable verbose logging | `true` |
| `APP_PORT` | HTTP port | `3387` |
| `APP_TIMEZONE` | Application timezone | `Asia/Jakarta` |
| `DB_CONNECTION_NAME` | Default database connection alias | `default` |
| `DB_CONNECTIONS` | Additional comma-separated aliases | – |
| `DB_CLIENT` | Knex client | `mysql2` |
| `DB_HOST`/`DB_USERNAME`/`DB_PASSWORD` | Database connection | – |
| `REDIS_HOST`/`REDIS_PORT` | Redis configuration | `127.0.0.1:6379` |

## Config Cache

Use `flowra config:print` to inspect the merged configuration at runtime. Pair it with `flowra env:example` to regenerate `.env.example` whenever configuration files or environment variables change.
