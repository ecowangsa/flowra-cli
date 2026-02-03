# Flowra CLI

Flowra CLI is the official command-line tool for creating, running, and maintaining Flowra Framework projects. It ships as the `flowra` executable and is designed to work across macOS, Linux, and Windows on Node.js LTS.

## Requirements

- Node.js 18+ (LTS recommended)

## Installation

Global install:

```bash
npm install -g flowra-cli
```

Project-local install (recommended for teams and CI):

```bash
npm install --save-dev flowra-cli
```

## Quick Start

Create a new Flowra project:

```bash
flowra create-app my-flowra-app
```

Then:

```bash
cd my-flowra-app
npm install
npm run dev
```

The scaffolded project includes a ready-to-run server and a minimal test suite.

## Usage

Show all commands:

```bash
flowra --help
```

Common commands:

```bash
flowra serve
flowra serve:watch
flowra create-app my-flowra-app
flowra route:list
flowra health:check --json
```

Notes:

- `serve:watch` uses `nodemon` (already included in the generated app as a dev dependency).
- `flowra serve --once` starts the server and exits after it is ready (useful for smoke tests).
- `flowra health:check --json` emits machine-readable output.

## Project Detection

All commands except `create-app` and `list` must be run inside a Flowra project. A project is detected when `package.json` includes either `flowra` or `flowra-cli` in `dependencies`, `devDependencies`, or `peerDependencies`.

## Create-App Versioning

By default, `create-app` pins the generated project to the currently installed CLI version. You can override it:

```bash
flowra create-app my-app --framework-version 1.0.0
```

## Testing

Run the test suite:

```bash
npm test
```

Run the lightweight lint check:

```bash
npm run lint
```

## Release

Quick release steps:

1. Ensure the working tree is clean.
2. Run `npm test` and `npm run lint`.
3. Bump the version and tag:

```bash
npm run release:patch
# or release:minor / release:major
```

For full guidance, see `RELEASING.md`.

## License

MIT — see `LICENSE`.
