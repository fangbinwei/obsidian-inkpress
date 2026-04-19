# Releasing

## Day-to-day flow

```bash
pnpm release:patch    # 0.1.0 → 0.1.1 (bug fixes)
pnpm release:minor    # 0.1.0 → 0.2.0 (new features)
pnpm release:major    # 0.1.0 → 1.0.0 (breaking)
```

Each script chains:

1. `pnpm version <level>` — bumps `package.json`
2. `version` lifecycle hook runs `version-bump.mjs`, which mirrors the new version into `manifest.json` and appends an entry to `versions.json`
3. All 3 files committed together with message `X.Y.Z`
4. Tag `X.Y.Z` created (no `v` prefix — Obsidian convention, configured in `.npmrc`)
5. Commit + tag pushed

The pushed tag triggers `.github/workflows/release.yml`, which builds `main.js` and uploads `main.js` + `manifest.json` + `styles.css` to a new GitHub Release. BRAT users pick it up on next plugin sync.

## Pre-flight checklist

- [ ] On `main`, working tree clean (`pnpm version` refuses dirty trees)
- [ ] `pnpm test` and `pnpm check:ci` pass locally
- [ ] If you used new Obsidian APIs, bump `minAppVersion` in `manifest.json` **before** running `release:*` (so the new versions.json entry uses the right floor)

## Recovery

- **Working tree dirty error**: `git stash` (or commit first), then re-run.
- **Wrong version pushed**: do not delete the tag remotely; instead bump again forward (`pnpm release:patch`). Deleting a published tag breaks anyone who pinned to it.
- **release.yml failed**: re-run from the Actions UI; the workflow is idempotent (uses `softprops/action-gh-release@v2` which updates an existing release).
