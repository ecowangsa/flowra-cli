#!/usr/bin/env node

// Entry point for the Flowra CLI. The CLI logic lives inside cli.js so that
// it can be imported and unit tested without executing process specific code.
// The bin simply forwards execution.

require('../cli').run(process.argv);
