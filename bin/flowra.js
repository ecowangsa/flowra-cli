#!/usr/bin/env node

// Entry point for the Flowra CLI. The CLI logic lives inside core/cli.js
// so that it can be imported and unit tested without executing process
// specific code. The bin simply forwards execution.

require('../core/cli').run(process.argv);
