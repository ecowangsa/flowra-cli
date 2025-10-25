function isPlainObject(value) {
  if (value === null || typeof value !== 'object') {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function isResolver(value) {
  if (!value || typeof value !== 'object') {
    return false;
  }

  if (value.__awilixResolver) {
    return true;
  }

  return typeof value.resolve === 'function';
}

class Container {
  constructor() {
    this.registry = new Map();
    this.options = { injectionMode: 'PROXY' };
    this.resolve = this.resolve.bind(this);
    this.register = this.register.bind(this);
    this.createScope = this.createScope.bind(this);
    this.cradle = this._createCradle();
  }

  register(nameOrMap, factory, options = {}) {
    if (typeof nameOrMap === 'string') {
      this._registerEntry(nameOrMap, factory, options);
      return this;
    }

    if (isPlainObject(nameOrMap)) {
      this._registerEntries('', nameOrMap);
      return this;
    }

    throw new Error('Invalid registration payload for the container');
  }

  resolve(name, options = {}) {
    const entry = this.registry.get(name);
    if (!entry) {
      if (options && options.allowUnregistered) {
        return undefined;
      }
      throw new Error(`Dependency '${name}' is not registered in the container.`);
    }

    if (entry.singleton) {
      if (!Object.prototype.hasOwnProperty.call(entry, 'instance')) {
        entry.instance = entry.factory(this);
      }

      return entry.instance;
    }

    return entry.factory(this);
  }

  has(name) {
    return this.registry.has(name);
  }

  createScope(prefix) {
    if (!prefix) {
      throw new Error('createScope requires a prefix');
    }

    const sections = new Map();
    const container = this;

    return {
      register(registrations) {
        container._registerEntries(prefix, registrations, sections);
        return this;
      },
      registerAlias(alias, target) {
        if (!alias || !target) {
          throw new Error('registerAlias requires both an alias and target');
        }
        container.register(alias, (c) => c.resolve(`${prefix}.${target}`));
        return this;
      },
      finalize() {
        container._registerScopeAccessors(prefix, sections);
        return this;
      },
    };
  }

  _registerEntries(prefix, registrations, sections) {
    Object.entries(registrations || {}).forEach(([key, value]) => {
      const fullKey = prefix ? `${prefix}.${key}` : key;

      if (isPlainObject(value) && !isResolver(value)) {
        this._registerEntries(fullKey, value, sections);
        return;
      }

      this._registerEntry(fullKey, value);

      if (sections && prefix) {
        const relativePath = fullKey.slice(prefix.length + 1);
        if (!relativePath) {
          return;
        }

        if (relativePath.includes('.')) {
          const [section, ...rest] = relativePath.split('.');
          if (!section || !rest.length) {
            return;
          }
          const entries = sections.get(section) || new Set();
          entries.add(rest.join('.'));
          sections.set(section, entries);
        } else {
          if (!sections.has(relativePath)) {
            sections.set(relativePath, new Set());
          }
        }
      }
    });
  }

  _registerEntry(name, resolver, options = {}) {
    const entry = this._normalizeResolver(resolver, options);
    this.registry.set(name, entry);
  }

  _registerScopeAccessors(prefix, sections = new Map()) {
    sections.forEach((keys, section) => {
      const sectionKey = `${prefix}.${section}`;
      if (keys.size === 0 || this.has(sectionKey)) {
        return;
      }

      this.register(sectionKey, (container) => {
        const accessor = {};
        keys.forEach((subKey) => {
          const fullKey = `${sectionKey}.${subKey}`;
          Object.defineProperty(accessor, subKey, {
            enumerable: true,
            get() {
              return container.resolve(fullKey);
            },
          });
        });
        return Object.freeze(accessor);
      });
    });

    if (!this.has(prefix)) {
      this.register(prefix, (container) => {
        const moduleRef = { name: prefix.split('.').pop() };
        sections.forEach((_, section) => {
          const sectionKey = `${prefix}.${section}`;
          if (!container.has(sectionKey)) {
            return;
          }

          Object.defineProperty(moduleRef, section, {
            enumerable: true,
            get() {
              return container.resolve(sectionKey);
            },
          });
        });

        return Object.freeze(moduleRef);
      });
    }
  }

  _createCradle() {
    const container = this;
    return new Proxy(
      {},
      {
        get(_, key) {
          if (key === Symbol.iterator) {
            return function* iterate() {
              for (const name of container.registry.keys()) {
                yield name;
              }
            };
          }

          if (typeof key !== 'string') {
            return undefined;
          }

          if (!container.has(key)) {
            return undefined;
          }

          return container.resolve(key);
        },
        has(_, key) {
          return typeof key === 'string' && container.has(key);
        },
        ownKeys() {
          return Array.from(container.registry.keys());
        },
        getOwnPropertyDescriptor(_, key) {
          if (typeof key === 'string' && container.has(key)) {
            return { enumerable: true, configurable: true };
          }
          return undefined;
        },
      }
    );
  }

  _normalizeResolver(resolver, options = {}) {
    if (isResolver(resolver)) {
      const lifetime = String(resolver.lifetime || '').toUpperCase();
      const singleton = lifetime === 'SINGLETON' || (lifetime && lifetime !== 'TRANSIENT');
      return {
        factory: (container) => resolver.resolve(container),
        singleton,
      };
    }

    if (typeof resolver === 'function') {
      const singleton = options.singleton !== false;
      return {
        factory: resolver,
        singleton,
      };
    }

    const singleton = options.singleton !== false;
    return {
      factory: () => resolver,
      singleton,
    };
  }
}

module.exports = Container;
