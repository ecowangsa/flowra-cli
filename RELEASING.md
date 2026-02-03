# Releasing Flowra CLI

This guide describes how to cut a release safely and consistently.

## Versioning Guide (SemVer)

- **Patch**: Bug fixes, internal improvements, no breaking changes.
- **Minor**: New features, backward compatible.
- **Major**: Breaking changes (requires migration guidance).

## Release Checklist

This project supports two release paths:

### Option A: Release Please (recommended)

1. Merge changes into `main` (or `master`).
2. The Release Please workflow will open a release PR.
3. Review and merge the release PR to create the tag and release.

### Option B: Manual scripts

1. Ensure the working tree is clean.
2. Update `CHANGELOG.md` with a new entry.
3. Run:
   - `npm test`
   - `npm run lint`
4. Choose the appropriate release script:
   - `npm run release:patch`
   - `npm run release:minor`
   - `npm run release:major`
5. Confirm the tag was pushed (e.g., `v0.2.0`).
6. Verify the GitHub Actions **Release** workflow completes.

## Notes

- The Release workflow publishes on tags matching `v*`.
- Ensure `NPM_TOKEN` is configured in GitHub Actions secrets.
- The `release:*` scripts run `release:verify` before pushing tags.
- The Release workflow uses npm provenance (OIDC) and requires `id-token: write`.
- Release Please requires `contents: write` and `pull-requests: write` permissions.
- Git hooks are installed automatically via the `prepare` script (run `npm run hooks:install` to re-install if needed).
