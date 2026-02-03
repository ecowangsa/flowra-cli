const path = require('path');

const manifest = require('../../Modules/modules.manifest');

function normalizeManifestEntries(definitions) {
  if (!definitions) {
    return [];
  }

  if (Array.isArray(definitions)) {
    return definitions;
  }

  if (definitions && typeof definitions === 'object' && Array.isArray(definitions.modules)) {
    return definitions.modules;
  }

  if (definitions && typeof definitions === 'object') {
    return Object.values(definitions).flatMap((value) => normalizeManifestEntries(value));
  }

  return [];
}

function resolveEnabledModules(manifestEntries) {
  return manifestEntries
    .filter((entry) => entry && entry.enabled !== false)
    .map((entry) => {
      const modulePath = path.join(process.cwd(), 'app', 'Modules', entry.path || entry.name);
      // eslint-disable-next-line global-require, import/no-dynamic-require
      const definition = require(modulePath);

      if (!definition || typeof definition !== 'object') {
        throw new Error(`Module definition at ${modulePath} must export an object`);
      }

      const name = entry.name || definition.name;
      if (!name) {
        throw new Error(`Module at ${modulePath} requires a manifest name`);
      }

      return {
        ...definition,
        name,
        manifest: { ...entry, name },
      };
    });
}

function buildCatalog() {
  const manifestEntries = normalizeManifestEntries(manifest);
  return resolveEnabledModules(manifestEntries);
}

function registerModule(container, definition) {
  const { name, register: registerModuleContainer, routes, aliases = {} } = definition;

  if (!name || typeof name !== 'string') {
    throw new Error('Module definition requires a valid name');
  }

  const prefix = `modules.${name}`;
  const scope = container.createScope(prefix);

  if (typeof registerModuleContainer === 'function') {
    registerModuleContainer(scope);
  }

  if (routes) {
    scope.register({ routes: () => routes });
  }

  scope.finalize();

  Object.entries(aliases).forEach(([alias, target]) => {
    if (!alias || !target) {
      throw new Error(`Invalid alias configuration for module ${name}`);
    }

    container.register(alias, (c) => c.resolve(`${prefix}.${target}`));
  });
}

function registerModules(container) {
  const catalog = buildCatalog();

  catalog.forEach((definition) => registerModule(container, definition));

  container.register('modules', (c) => {
    const modulesAccessor = {};
    catalog.forEach(({ name }) => {
      Object.defineProperty(modulesAccessor, name, {
        enumerable: true,
        get() {
          return c.resolve(`modules.${name}`);
        },
      });
    });
    return Object.freeze(modulesAccessor);
  });

  container.register('modules.meta', () =>
    Object.freeze(
      catalog.reduce((acc, definition) => {
        acc[definition.name] = {
          hasRoutes: Boolean(definition.routes),
          manifest: definition.manifest,
        };
        return acc;
      }, {})
    )
  );

  return container;
}

module.exports = registerModules;
