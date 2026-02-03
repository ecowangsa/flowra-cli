const { analyzeModules, pruneIssues } = require('../services/cleaner.service');

function registerCleanCommands(program) {
  program
    .command('clean:analyze')
    .description('Dry-run cleanup analysis.')
    .action(() => {
      const analysis = analyzeModules();
      if (!analysis.issues.length) {
        // eslint-disable-next-line no-console
        console.log('No cleanup actions required.');
        return;
      }

      // eslint-disable-next-line no-console
      console.table(
        analysis.issues.map((issue) => ({
          Type: issue.type,
          Module: issue.name,
          Path: issue.path,
          Message: issue.message,
        }))
      );
    });

  program
    .command('clean:prune')
    .description('Delete flagged files and folders.')
    .option('--yes', 'Confirm deletion of orphaned resources')
    .option('--force', 'Force deletion using rm -rf semantics')
    .action((options) => {
      const analysis = analyzeModules();
      if (!analysis.issues.length) {
        // eslint-disable-next-line no-console
        console.log('No cleanup actions required.');
        return;
      }

      const result = pruneIssues(analysis, { yes: Boolean(options.yes), force: Boolean(options.force) });

      if (!options.yes) {
        // eslint-disable-next-line no-console
        console.log('No files were deleted. Re-run with --yes to confirm.');
        return;
      }

      if (result.deleted.length) {
        // eslint-disable-next-line no-console
        console.table(
          result.deleted.map((issue) => ({
            Module: issue.name,
            Path: issue.path,
            Status: 'deleted',
          }))
        );
      }

      if (result.skipped.length) {
        // eslint-disable-next-line no-console
        console.table(
          result.skipped.map((issue) => ({
            Module: issue.name,
            Path: issue.path,
            Status: issue.error ? issue.error : 'skipped',
          }))
        );
      }
    });
}

module.exports = registerCleanCommands;
