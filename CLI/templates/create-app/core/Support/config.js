const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const CONFIG_DIRECTORY = path.join(process.cwd(), 'app', 'Config');
const configCache = new Map();

function toStudlyCase(namespace) {
  return namespace
    .split('/')
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(path.sep);
}

function readConfigFile(namespace) {
  if (configCache.has(namespace)) {
    return configCache.get(namespace);
  }

  const fileName = `${toStudlyCase(namespace)}.js`;
  const filePath = path.join(CONFIG_DIRECTORY, fileName);

  if (!fs.existsSync(filePath)) {
    throw new Error(`Configuration file not found for namespace '${namespace}' (${filePath})`);
  }

  // eslint-disable-next-line global-require, import/no-dynamic-require
  const value = require(filePath);
  configCache.set(namespace, value);
  return value;
}

function getValue(target, segments, defaultValue) {
  if (!segments.length) {
    return target;
  }

  let current = target;
  for (const segment of segments) {
    if (current && Object.prototype.hasOwnProperty.call(current, segment)) {
      current = current[segment];
    } else {
      return defaultValue;
    }
  }
  return current;
}

function config(key, defaultValue = undefined) {
  if (!key) {
    throw new Error('Configuration key is required');
  }

  const [namespace, ...rest] = key.split('.');
  const configuration = readConfigFile(namespace);
  const value = getValue(configuration, rest, defaultValue);
  return value === undefined ? defaultValue : value;
}

config.all = function all(namespace) {
  if (!namespace) {
    const values = {};
    for (const file of fs.readdirSync(CONFIG_DIRECTORY)) {
      if (file.endsWith('.js')) {
        const ns = file.replace(/\.js$/, '').toLowerCase();
        values[ns] = readConfigFile(ns);
      }
    }
    return values;
  }

  return readConfigFile(namespace);
};

config.reload = function reload(namespace) {
  configCache.delete(namespace);
  return config.all(namespace);
};

module.exports = config;
