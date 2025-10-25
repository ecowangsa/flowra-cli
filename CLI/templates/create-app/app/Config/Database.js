function toBoolean(value, fallback = false) {
  if (typeof value === 'undefined') {
    return fallback;
  }
  if (typeof value === 'boolean') {
    return value;
  }
  return ['true', '1', 'yes', 'on'].includes(String(value).toLowerCase());
}

function toInteger(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) {
    return fallback;
  }
  return parsed;
}

function normalizeAlias(alias) {
  return alias.trim().toLowerCase();
}

function resolveAliasKeys(rawAlias) {
  const alias = normalizeAlias(rawAlias);
  if (!alias || alias === 'default') {
    return { alias: 'default', token: '' };
  }

  const token = alias
    .replace(/[^a-z0-9]+/gi, '_')
    .replace(/_{2,}/g, '_')
    .replace(/^_|_$/g, '')
    .toUpperCase();

  return { alias, token };
}

function resolveEnv(aliasToken, key, fallback) {
  const scopedKey = aliasToken ? `DB_${aliasToken}_${key}` : undefined;
  const candidates = [scopedKey, `DB_${key}`, `DB_DEFAULT_${key}`].filter(Boolean);

  // eslint-disable-next-line no-restricted-syntax
  for (const candidate of candidates) {
    if (typeof process.env[candidate] !== 'undefined') {
      return process.env[candidate];
    }
  }

  return fallback;
}

function buildConnectionConfig(rawAlias) {
  const { alias, token } = resolveAliasKeys(rawAlias);
  const client = resolveEnv(token, 'CLIENT', 'mysql2');
  const host = resolveEnv(token, 'HOST', '127.0.0.1');
  const user = resolveEnv(token, 'USERNAME', 'root');
  const password = resolveEnv(token, 'PASSWORD', '');
  const database = resolveEnv(token, 'DATABASE', 'flowra');
  const port = toInteger(resolveEnv(token, 'PORT', '3306'), 3306);
  const sslEnabled = toBoolean(resolveEnv(token, 'SSL', false));
  const sslCa = resolveEnv(token, 'SSL_CA');
  const timezone = resolveEnv(token, 'TIMEZONE', '+07:00');
  const charset = resolveEnv(token, 'CHARSET', 'utf8mb4');

  const poolMin = toInteger(resolveEnv(token, 'POOL_MIN', '0'), 0);
  const poolMax = toInteger(resolveEnv(token, 'POOL_MAX', '10'), 10);
  const poolCreate = toInteger(resolveEnv(token, 'POOL_CREATE_TIMEOUT', '10000'), 10_000);
  const poolAcquire = toInteger(resolveEnv(token, 'POOL_ACQUIRE_TIMEOUT', '10000'), 10_000);
  const poolIdle = toInteger(resolveEnv(token, 'POOL_IDLE_TIMEOUT', '120000'), 120_000);

  const migrationsTable = resolveEnv(token, 'MIGRATIONS', 'migrations');
  const migrationsDir = resolveEnv(token, 'MIGRATIONS_DIR', 'database/migrations');
  const seedsDir = resolveEnv(token, 'SEEDS_DIR', 'database/seeds');
  const logLevel = resolveEnv(token, 'LOG_LEVEL', 'warn');

  return {
    name: alias,
    client,
    connection: {
      host,
      user,
      password,
      database,
      port,
      ssl: sslEnabled
        ? {
            rejectUnauthorized: false,
            ca: sslCa,
          }
        : false,
      timezone,
      charset,
    },
    pool: {
      min: poolMin,
      max: poolMax,
      createTimeoutMillis: poolCreate,
      acquireTimeoutMillis: poolAcquire,
      idleTimeoutMillis: poolIdle,
    },
    migrations: {
      tableName: migrationsTable,
      directory: migrationsDir,
    },
    seeds: {
      directory: seedsDir,
    },
    log: {
      level: logLevel,
    },
  };
}

const defaultAlias = normalizeAlias(process.env.DB_CONNECTION_NAME || 'default') || 'default';
const declaredAliases = new Set([defaultAlias]);

if (process.env.DB_CONNECTIONS) {
  process.env.DB_CONNECTIONS.split(',')
    .map((alias) => alias.trim())
    .filter(Boolean)
    .forEach((alias) => declaredAliases.add(normalizeAlias(alias)));
}

const connections = {};
declaredAliases.forEach((alias) => {
  const config = buildConnectionConfig(alias);
  connections[config.name] = config;
});

module.exports = {
  default: defaultAlias,
  connections,
};
