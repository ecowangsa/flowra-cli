const { listModules, updateModule, findModule } = require('../services/module-manifest.service');
const { toKebabCase } = require('../utils/case-utils');

function registerModuleCommands(program) {
  program
    .command('module:list')
    .description('List module names and enabled status.')
    .action(() => {
      const modules = listModules();
      if (!modules.length) {
        // eslint-disable-next-line no-console
        console.log('No modules found in manifest.');
        return;
      }

      // eslint-disable-next-line no-console
      console.table(
        modules.map((module) => ({
          Module: module.name,
          Enabled: module.enabled,
          Path: module.path,
          Description: module.description || '',
        }))
      );
    });

  program
    .command('module:enable <name>')
    .description('Enable a module (by kebab-case name).')
    .action((name) => {
      const moduleName = toKebabCase(name);
      const existing = findModule(moduleName);
      if (!existing) {
        throw new Error(`Module '${moduleName}' is not registered.`);
      }
      updateModule(moduleName, { enabled: true });
      // eslint-disable-next-line no-console
      console.log(`Module '${moduleName}' enabled.`);
    });

  program
    .command('module:disable <name>')
    .description('Disable a module.')
    .action((name) => {
      const moduleName = toKebabCase(name);
      const existing = findModule(moduleName);
      if (!existing) {
        throw new Error(`Module '${moduleName}' is not registered.`);
      }
      updateModule(moduleName, { enabled: false });
      // eslint-disable-next-line no-console
      console.log(`Module '${moduleName}' disabled.`);
    });
}

module.exports = registerModuleCommands;
