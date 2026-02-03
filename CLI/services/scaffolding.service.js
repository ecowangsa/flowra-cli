const fs = require('fs');
const path = require('path');

const { addModule, findModule, updateModule } = require('./module-manifest.service');
const { ensureDir, writeFile, fileExists } = require('../utils/file-system');
const { toKebabCase, toPascalCase, toCamelCase, toSnakeCase, toConstantCase } = require('../utils/case-utils');

const MODULES_DIR = path.join(process.cwd(), 'app', 'Modules');
const MODELS_DIR = path.join(process.cwd(), 'app', 'Models');

function ensureModulesDir() {
  ensureDir(MODULES_DIR);
}

function resolveModuleDirectory(name) {
  const pascal = toPascalCase(name);
  return path.join(MODULES_DIR, pascal);
}

function resolveModuleNamespace(name) {
  return toKebabCase(name);
}

function assertModuleExists(name) {
  const directory = resolveModuleDirectory(name);
  if (!fs.existsSync(directory)) {
    throw new Error(`Module '${resolveModuleNamespace(name)}' does not exist. Create it with "flowra make:module ${resolveModuleNamespace(name)}".`);
  }
  return directory;
}

function createModuleDefinition({ moduleName }) {
  const kebab = resolveModuleNamespace(moduleName);
  return `'use strict';\n\nconst registerContainer = require('./${kebab}.container');\nconst registerRoutes = require('./${kebab}.routes');\n\nmodule.exports = {\n  name: '${kebab}',\n  register: registerContainer,\n  routes: registerRoutes,\n  aliases: {},\n};\n`;
}

function buildControllerConfigs(moduleName, controllers = []) {
  const list = Array.isArray(controllers) && controllers.length ? controllers : [null];
  const modulePascal = toPascalCase(moduleName);
  const moduleCamel = toCamelCase(moduleName);
  const moduleKebab = resolveModuleNamespace(moduleName);

  return list.map((entry, index) => {
    const featureName = typeof entry === 'string' && entry.trim().length ? entry.trim() : null;
    const featurePascal = featureName ? toPascalCase(featureName) : '';
    const featureKebab = featureName ? toKebabCase(featureName) : null;
    const classPrefix = featurePascal ? `${modulePascal}${featurePascal}` : modulePascal;
    const className = `${classPrefix}Controller`;
    const containerKey = featurePascal ? toCamelCase(featureName) : index === 0 ? 'main' : `controller${index + 1}`;
    const alias = featurePascal ? `${moduleCamel}${featurePascal}Controller` : `${moduleCamel}Controller`;
    const logKey = featureKebab ? `${moduleKebab}.${featureKebab}` : moduleKebab;

    return {
      feature: featureName,
      className,
      fileName: `${classPrefix}.controller.js`,
      containerKey,
      alias,
      propertyName: `${moduleCamel}Service`,
      logKey,
      isPrimary: index === 0,
    };
  });
}

function createModuleContainer({ moduleName, controllers: controllerConfigs }) {
  const pascal = toPascalCase(moduleName);
  const camel = toCamelCase(moduleName);
  const kebab = resolveModuleNamespace(moduleName);
  const configs = controllerConfigs || buildControllerConfigs(moduleName);

  const controllerImports = configs
    .map(({ className, fileName }) => `const ${className} = require('./${fileName}');`)
    .join('\n');

  const controllerRegistrations = configs
    .map(
      ({ className, containerKey, propertyName }) =>
        `      ${containerKey}: asClass(${className})\n        .inject(({ resolve }) => ({\n          logger: resolve('logger'),\n          ${propertyName}: resolve('modules.${kebab}.services.main'),\n        }))\n        .singleton(),`
    )
    .join('\n');

  const aliasLines = [];
  configs.forEach(({ alias, containerKey, isPrimary }) => {
    if (isPrimary) {
      aliasLines.push(`  scope.registerAlias('${camel}Controller', 'controllers.${containerKey}');`);
    }
    if (alias !== `${camel}Controller`) {
      aliasLines.push(`  scope.registerAlias('${alias}', 'controllers.${containerKey}');`);
    }
  });

  return `'use strict';\n\nconst { asClass, asValue } = require('awilix');\n${controllerImports}\nconst ${pascal}Service = require('./${pascal}.service');\nconst register${pascal}Routes = require('./${kebab}.routes');\n\nmodule.exports = (scope) => {\n  scope.register({\n    services: {\n      main: asClass(${pascal}Service)\n        .inject(({ resolve }) => ({\n          logger: resolve('logger'),\n        }))\n        .singleton(),\n    },\n    controllers: {\n${controllerRegistrations}\n    },\n    routes: asValue(register${pascal}Routes),\n  });\n\n${aliasLines.join('\n') || `  scope.registerAlias('${camel}Controller', 'controllers.main');`}\n};\n`;
}

function createModuleRoutes({ moduleName, primaryControllerKey }) {
  const pascal = toPascalCase(moduleName);
  const kebab = resolveModuleNamespace(moduleName);
  const controllerKey = primaryControllerKey || 'main';
  return `'use strict';\n\nfunction register${pascal}Routes({ router, container } = {}) {\n  if (!router || !container) {\n    return router;\n  }\n\n  const controller = container.resolve('modules.${kebab}.controllers.${controllerKey}');\n  router.get('/${kebab}', controller.index.bind(controller));\n\n  return router;\n}\n\nmodule.exports = register${pascal}Routes;\n`;
}

function createModuleController({ moduleName, controller }) {
  const configs = controller || buildControllerConfigs(moduleName)[0];
  const moduleKey = configs.logKey;
  const propertyName = configs.propertyName;
  return `'use strict';\n\nconst BaseController = require('../Shared/controllers/BaseController');\n\nclass ${configs.className} extends BaseController {\n  constructor({ logger, ${propertyName} }) {\n    super({ logger });\n    this.logger = logger;\n    this.${propertyName} = ${propertyName};\n  }\n\n  async index(req, res, next) {\n    try {\n      const payload = await this.${propertyName}.list();\n      res.json({ data: payload });\n    } catch (error) {\n      this.logger?.error('${moduleKey}.controller.index_failed', { message: error.message });\n      next(error);\n    }\n  }\n\n  async show(req, res, next) {\n    try {\n      const record = await this.${propertyName}.findById(req.params.id);\n      if (!record) {\n        res.status(404).json({ message: 'Resource not found' });\n        return;\n      }\n      res.json({ data: record });\n    } catch (error) {\n      this.logger?.error('${moduleKey}.controller.show_failed', { message: error.message });\n      next(error);\n    }\n  }\n\n  async create(req, res, next) {\n    try {\n      const created = await this.${propertyName}.create(req.body);\n      res.status(201).json({ data: created });\n    } catch (error) {\n      this.logger?.error('${moduleKey}.controller.create_failed', { message: error.message });\n      next(error);\n    }\n  }\n\n  async update(req, res, next) {\n    try {\n      const updated = await this.${propertyName}.update(req.params.id, req.body);\n      res.json({ data: updated });\n    } catch (error) {\n      this.logger?.error('${moduleKey}.controller.update_failed', { message: error.message });\n      next(error);\n    }\n  }\n\n  async destroy(req, res, next) {\n    try {\n      await this.${propertyName}.remove(req.params.id);\n      res.status(204).end();\n    } catch (error) {\n      this.logger?.error('${moduleKey}.controller.destroy_failed', { message: error.message });\n      next(error);\n    }\n  }\n}\n\nmodule.exports = ${configs.className};\n`;
}

function createModuleService({ moduleName }) {
  const pascal = toPascalCase(moduleName);
  const moduleKey = toKebabCase(moduleName);
  return `'use strict';\n\nclass ${pascal}Service {\n  constructor({ logger }) {\n    this.logger = logger;\n  }\n\n  async list() {\n    this.logger?.debug('${moduleKey}.service.list');\n    return [];\n  }\n\n  async findById(id) {\n    this.logger?.debug('${moduleKey}.service.find', { id });\n    return null;\n  }\n\n  async create(payload) {\n    this.logger?.info('${moduleKey}.service.create', { payload });\n    return payload;\n  }\n\n  async update(id, payload) {\n    this.logger?.info('${moduleKey}.service.update', { id, payload });\n    return { id, ...payload };\n  }\n\n  async remove(id) {\n    this.logger?.warn('${moduleKey}.service.remove', { id });\n    return true;\n  }\n}\n\nmodule.exports = ${pascal}Service;\n`;
}

function createModuleValidator({ moduleName, validatorName }) {
  const pascal = toPascalCase(validatorName || moduleName);
  const constant = toConstantCase(validatorName || moduleName);
  return `'use strict';\n\nconst { z } = require('zod');\n\nconst ${constant}Schema = z.object({\n  sample: z.string(),\n});\n\nmodule.exports = () => ${constant}Schema;\n`;
}

function createModuleQuery({ moduleName, queryName }) {
  const pascal = toPascalCase(queryName || moduleName);
  return `'use strict';\n\nclass ${pascal}Query {\n  constructor({ knex }) {\n    this.knex = knex;\n  }\n\n  async run() {\n    return this.knex.select('*');\n  }\n}\n\nmodule.exports = ${pascal}Query;\n`;
}

function createModel({ name, tableName, connection, modelRequirePath }) {
  const pascal = toPascalCase(name);
  const table = tableName || toSnakeCase(name);
  const connectionName = connection || 'default';
  const requirePath = modelRequirePath || '../Config/Model';
  return `'use strict';\n\nconst Model = require('${requirePath}');\n\nclass ${pascal}Model extends Model {\n  constructor(connection = '${connectionName}') {\n    super(connection);\n    this.setTable('${table}');\n    this.setPrimaryKey('id');\n    this.setAllowedFields(['id']);\n    this.setTimestamps(false);\n    this.setSoftDelete(false);\n  }\n}\n\nmodule.exports = ${pascal}Model;\n`;
}

function parseControllerList(input) {
  if (!input) {
    return [];
  }
  if (Array.isArray(input)) {
    return input.filter((value) => typeof value === 'string' && value.trim().length).map((value) => value.trim());
  }
  if (typeof input === 'string') {
    return input
      .split(',')
      .map((value) => value.trim())
      .filter((value) => value.length);
  }
  return [];
}

function generateModuleScaffold({ name, controllers, force } = {}) {
  if (!name) {
    throw new Error('Module name is required');
  }

  ensureModulesDir();
  const directory = resolveModuleDirectory(name);
  const kebab = resolveModuleNamespace(name);
  const manifestEntry = findModule(name);
  const controllerList = buildControllerConfigs(name, parseControllerList(controllers));

  if (fs.existsSync(directory) && !force) {
    throw new Error(`Module directory ${directory} already exists. Use --force to overwrite.`);
  }

  ensureDir(directory);

  writeFile(path.join(directory, `${kebab}.module.js`), createModuleDefinition({ moduleName: name }));
  writeFile(
    path.join(directory, `${kebab}.container.js`),
    createModuleContainer({ moduleName: name, controllers: controllerList })
  );
  writeFile(
    path.join(directory, `${kebab}.routes.js`),
    createModuleRoutes({ moduleName: name, primaryControllerKey: controllerList[0]?.containerKey })
  );

  controllerList.forEach((controllerConfig) => {
    writeFile(
      path.join(directory, controllerConfig.fileName),
      createModuleController({ moduleName: name, controller: controllerConfig })
    );
  });

  writeFile(path.join(directory, `${toPascalCase(name)}.service.js`), createModuleService({ moduleName: name }));
  writeFile(
    path.join(directory, `${toPascalCase(name)}.validator.js`),
    createModuleValidator({ moduleName: name })
  );
  writeFile(path.join(directory, `${toPascalCase(name)}.query.js`), createModuleQuery({ moduleName: name }));

  const manifestPath = `./${toPascalCase(name)}/${kebab}.module.js`;
  if (!manifestEntry) {
    addModule({ name: kebab, path: manifestPath, enabled: true });
  } else if (manifestEntry.path !== manifestPath || manifestEntry.enabled === false) {
    updateModule(kebab, { path: manifestPath, enabled: true });
  }

  return directory;
}

function generateModel({ name, dbAlias, table, module } = {}) {
  if (!name) {
    throw new Error('Model name is required');
  }

  const pascal = toPascalCase(name);
  const moduleDir = module ? assertModuleExists(module) : null;
  const targetDir = moduleDir || MODELS_DIR;
  ensureDir(targetDir);
  const fileName = moduleDir ? `${pascal}.model.js` : `${pascal}Model.js`;
  const targetPath = path.join(targetDir, fileName);
  if (fileExists(targetPath)) {
    throw new Error(`Model file ${targetPath} already exists`);
  }
  const configModelPath = path.join(process.cwd(), 'app', 'Config', 'Model.js');
  let requirePath = path.relative(targetDir, configModelPath).replace(/\\/g, '/');
  requirePath = requirePath.replace(/\.js$/u, '');
  if (!requirePath.startsWith('.')) {
    requirePath = `./${requirePath}`;
  }
  writeFile(targetPath, createModel({ name, tableName: table, connection: dbAlias, modelRequirePath: requirePath }));
  return targetPath;
}

function generateController({ name, module } = {}) {
  if (!name) {
    throw new Error('Controller name is required');
  }
  if (!module) {
    throw new Error('A target module is required for controllers');
  }

  const moduleDirectory = assertModuleExists(module);
  const [controllerConfig] = buildControllerConfigs(module, [name]);
  const targetPath = path.join(moduleDirectory, controllerConfig.fileName);
  if (fileExists(targetPath)) {
    throw new Error(`Controller file ${targetPath} already exists`);
  }

  writeFile(targetPath, createModuleController({ moduleName: module, controller: controllerConfig }));
  return targetPath;
}

function generateService({ name, module } = {}) {
  if (!name) {
    throw new Error('Service name is required');
  }
  if (!module) {
    throw new Error('A target module is required for services');
  }

  const moduleDirectory = assertModuleExists(module);
  const pascal = toPascalCase(name);
  const targetPath = path.join(moduleDirectory, `${pascal}.service.js`);
  if (fileExists(targetPath)) {
    throw new Error(`Service file ${targetPath} already exists`);
  }

  const moduleKey = resolveModuleNamespace(module);
  const contents = `'use strict';\n\nclass ${pascal}Service {\n  constructor({ logger }) {\n    this.logger = logger;\n  }\n\n  async execute(payload) {\n    this.logger?.info('${moduleKey}.${toKebabCase(name)}.service.execute', { payload });\n    return payload;\n  }\n}\n\nmodule.exports = ${pascal}Service;\n`;

  writeFile(targetPath, contents);
  return targetPath;
}

function generateRoute({ name, module } = {}) {
  if (!name) {
    throw new Error('Route name is required');
  }
  if (!module) {
    throw new Error('A target module is required for routes');
  }

  const moduleDirectory = assertModuleExists(module);
  const kebab = toKebabCase(name);
  const targetPath = path.join(moduleDirectory, `${kebab}.route.js`);
  if (fileExists(targetPath)) {
    throw new Error(`Route file ${targetPath} already exists`);
  }

  const moduleKey = resolveModuleNamespace(module);
  const contents = `'use strict';\n\nmodule.exports = ({ router, container }) => {\n  const controller = container.resolve('modules.${moduleKey}.controllers.main');\n  const handler =\n    (typeof controller.handle === 'function' && controller.handle.bind(controller)) ||\n    (typeof controller.index === 'function' && controller.index.bind(controller));\n\n  if (!handler) {\n    throw new Error('Expected controller to expose either a handle or index method.');\n  }\n\n  router.get('/${kebab}', handler);\n  return router;\n};\n`;

  writeFile(targetPath, contents);
  return targetPath;
}

function generateValidator({ name, module } = {}) {
  if (!name) {
    throw new Error('Validator name is required');
  }
  if (!module) {
    throw new Error('A target module is required for validators');
  }

  const moduleDirectory = assertModuleExists(module);
  const pascal = toPascalCase(name);
  const targetPath = path.join(moduleDirectory, `${pascal}.validator.js`);
  if (fileExists(targetPath)) {
    throw new Error(`Validator file ${targetPath} already exists`);
  }

  const contents = createModuleValidator({ moduleName: module, validatorName: name });
  writeFile(targetPath, contents);
  return targetPath;
}

function generateQuery({ name, module } = {}) {
  if (!name) {
    throw new Error('Query name is required');
  }
  if (!module) {
    throw new Error('A target module is required for queries');
  }

  const moduleDirectory = assertModuleExists(module);
  const pascal = toPascalCase(name);
  const targetPath = path.join(moduleDirectory, `${pascal}.query.js`);
  if (fileExists(targetPath)) {
    throw new Error(`Query file ${targetPath} already exists`);
  }

  const contents = createModuleQuery({ moduleName: module, queryName: name });
  writeFile(targetPath, contents);
  return targetPath;
}

function generateResource({ name, dbAlias } = {}) {
  if (!name) {
    throw new Error('Resource name is required');
  }

  let moduleDirectory;
  try {
    moduleDirectory = generateModuleScaffold({ name, force: false });
  } catch (error) {
    if (!error.message.includes('already exists')) {
      throw error;
    }
    moduleDirectory = resolveModuleDirectory(name);
  }
  const pascal = toPascalCase(name);
  const kebab = toKebabCase(name);

  try {
    generateModel({ name, dbAlias, module: name });
  } catch (error) {
    if (!error.message.includes('already exists')) {
      throw error;
    }
  }

  const routesFile = path.join(moduleDirectory, 'resource.routes.js');
  const moduleKey = resolveModuleNamespace(name);
  const routeContents = `'use strict';\n\nmodule.exports = ({ router, container }) => {\n  const controller = container.resolve('modules.${moduleKey}.controllers.main');\n\n  router.get('/${kebab}', controller.index.bind(controller));\n  router.post('/${kebab}', controller.create.bind(controller));\n  router.get('/${kebab}/:id', controller.show.bind(controller));\n  router.put('/${kebab}/:id', controller.update.bind(controller));\n  router.patch('/${kebab}/:id', controller.update.bind(controller));\n  router.delete('/${kebab}/:id', controller.destroy.bind(controller));\n\n  return router;\n};\n`;
  writeFile(routesFile, routeContents);

  return moduleDirectory;
}

module.exports = {
  generateModuleScaffold,
  generateModel,
  generateController,
  generateService,
  generateRoute,
  generateValidator,
  generateQuery,
  generateResource,
};
