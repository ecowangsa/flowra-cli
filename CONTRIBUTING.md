# Contributing to Flowra CLI

Thanks for your interest in contributing. We appreciate your time and effort.

## Development Setup

- Use Node.js 18 or newer.
- Install dependencies with `npm install`.
- Run tests with `npm test`.
- Run lint checks with `npm run lint`.

## Project Structure

- `bin/flowra.js` is the executable entry point.
- `cli.js` handles argument parsing and error normalization.
- `CLI/` contains the command implementations and utilities.
- `tests/` contains Node.js `node:test` test suites.

## Guidelines

- Keep changes focused and easy to review.
- Add or update tests for behavior changes.
- Prefer deterministic tests (no fixed ports, no timezone assumptions).
- Use LF line endings and 2-space indentation.
- Use conventional commits (e.g. `feat(cli): add command`). You can validate with `npm run commitlint:msg -- "feat(cli): add command"`.
- Git hooks are installed automatically on `npm install` via the `prepare` script. You can also run `npm run hooks:install` manually. The pre-commit hook runs `npm run lint` (set `SKIP_LINT=1` to bypass).

## Reporting Issues

If you find a bug or want to request a feature, please include:

- Steps to reproduce.
- Expected behavior.
- Actual behavior.
- Node.js version and OS.

## Code of Conduct

By participating, you agree to follow the Code of Conduct in `CODE_OF_CONDUCT.md`.
