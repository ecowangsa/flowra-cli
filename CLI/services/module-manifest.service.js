const path = require('path');

const { writeFile } = require('../utils/file-system');
const { toKebabCase, toPascalCase } = require('../utils/case-utils');

const manifestPath = path.join(process.cwd(), 'app', 'Modules', 'modules.manifest.js');

function loadManifest() {
  delete require.cache[manifestPath];
  // eslint-disable-next-line global-require, import/no-dynamic-require
  const manifest = require(manifestPath);

  if (!manifest) {
    return { modules: [] };
  }

  if (Array.isArray(manifest.modules)) {
    return { modules: [...manifest.modules] };
  }

  if (Array.isArray(manifest)) {
    return { modules: [...manifest] };
  }

  return { modules: [] };
}

function formatEntry(entry = {}) {
  const canonicalName = toKebabCase(entry.name || entry.path || '');
  if (!canonicalName) {
    throw new Error('Module entries require a valid name');
  }

  const pascalName = toPascalCase(canonicalName);
  return {
    name: canonicalName,
    path: entry.path || `./${pascalName}/${canonicalName}.module.js`,
    enabled: entry.enabled !== false,
    description: entry.description || '',
  };
}

function saveManifest(manifest) {
  const payload = {
    modules: manifest.modules
      .map((entry) => formatEntry(entry))
      .sort((a, b) => a.name.localeCompare(b.name)),
  };

  const contents = `module.exports = ${JSON.stringify(payload, null, 2)};\n`;
  writeFile(manifestPath, contents);
}

function listModules() {
  const manifest = loadManifest();
  return manifest.modules.map((entry) => formatEntry(entry));
}

function findModule(name) {
  const target = toKebabCase(name);
  return listModules().find((entry) => entry.name === target);
}

function updateModule(name, updates) {
  const manifest = loadManifest();
  const target = toKebabCase(name);
  const nextModules = manifest.modules.map((entry) => {
    const formatted = formatEntry(entry);
    if (formatted.name === target) {
      return { ...formatted, ...updates, name: formatted.name };
    }
    return formatted;
  });

  const exists = nextModules.some((entry) => entry.name === target);
  if (!exists) {
    throw new Error(`Module '${target}' is not defined in the manifest`);
  }

  saveManifest({ modules: nextModules });
  return findModule(target);
}

function addModule(entry) {
  const manifest = loadManifest();
  const formatted = formatEntry(entry);

  if (manifest.modules.some((item) => toKebabCase(item.name) === formatted.name)) {
    throw new Error(`Module '${formatted.name}' already exists in the manifest`);
  }

  manifest.modules.push(formatted);
  saveManifest(manifest);
  return formatted;
}

module.exports = {
  manifestPath,
  loadManifest,
  saveManifest,
  listModules,
  findModule,
  updateModule,
  addModule,
};
