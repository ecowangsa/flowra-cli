const {
  makeMigration,
  migrateLatest,
  migrateRollback,
  migrateStatus,
  makeSeed,
  runSeeds,
} = require('../services/database-cli.service');

function registerDatabaseCommands(program) {
  program
    .command('db:migrate:make <name>')
    .description('Create a migration file for an alias.')
    .option('--env <alias>', 'Database alias configured in orm.cli.config.js')
    .action(async (name, options) => {
      const file = await makeMigration(name, { env: options.env });
      // eslint-disable-next-line no-console
      console.log(`Migration created: ${file}`);
    });

  program
    .command('db:migrate:latest')
    .description('Run migrations.')
    .option('--env <alias>', 'Database alias configured in orm.cli.config.js')
    .action(async (options) => {
      const { batch, migrations } = await migrateLatest({ env: options.env });
      // eslint-disable-next-line no-console
      console.log(`Batch ${batch} executed.`);
      if (migrations?.length) {
        // eslint-disable-next-line no-console
        console.table(migrations.map((migration) => ({ Migration: migration })));
      } else {
        // eslint-disable-next-line no-console
        console.log('No migrations executed.');
      }
    });

  program
    .command('db:rollback')
    .description('Roll back migrations.')
    .option('--env <alias>', 'Database alias configured in orm.cli.config.js')
    .option('--all', 'Rollback all batches')
    .action(async (options) => {
      const { batch, migrations } = await migrateRollback({ env: options.env, all: options.all });
      // eslint-disable-next-line no-console
      console.log(`Rolled back batch ${batch}.`);
      if (migrations?.length) {
        // eslint-disable-next-line no-console
        console.table(migrations.map((migration) => ({ Migration: migration })));
      }
    });

  program
    .command('db:status')
    .description('Show migration status.')
    .option('--env <alias>', 'Database alias configured in orm.cli.config.js')
    .action(async (options) => {
      const { completed, pending } = await migrateStatus({ env: options.env });
      // eslint-disable-next-line no-console
      console.table([
        { Stage: 'Completed', Count: completed.length },
        { Stage: 'Pending', Count: pending.length },
      ]);
    });

  program
    .command('db:seed:make <name>')
    .description('Create a seed file.')
    .option('--env <alias>', 'Database alias configured in orm.cli.config.js')
    .action(async (name, options) => {
      const file = await makeSeed(name, { env: options.env });
      // eslint-disable-next-line no-console
      console.log(`Seed file created: ${file}`);
    });

  program
    .command('db:seed:run')
    .description('Execute seeds.')
    .option('--env <alias>', 'Database alias configured in orm.cli.config.js')
    .action(async (options) => {
      const files = await runSeeds({ env: options.env });
      if (files?.length) {
        // eslint-disable-next-line no-console
        console.table(files.map((file) => ({ Seed: file })));
      } else {
        // eslint-disable-next-line no-console
        console.log('No seeds executed.');
      }
    });
}

module.exports = registerDatabaseCommands;
