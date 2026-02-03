'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const pkg = require('../package.json');

const runner = pkg.name === '__PACKAGE_NAME__' ? test.skip : test;

runner('package metadata is initialised', () => {
  assert.ok(pkg.name && pkg.name !== '__PACKAGE_NAME__', 'package name should be replaced');
  assert.ok(typeof pkg.version === 'string' && pkg.version.length > 0, 'version should be set');
});
