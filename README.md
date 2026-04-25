# Base Table

Base Table is a local-first multidimensional table desktop app built with Tauri, React, TypeScript, Rust, and SQLite.

## Features

- Local Base/Table/Field/Record CRUD
- Inline grid editing
- Excel workbook import with one table per sheet
- Grid, Kanban, Gantt, and transpose views
- CSV export for the active table
- Collapsible and resizable column settings panel
- Arch Linux package build support

## Development

```bash
npm ci
npm run tauri:dev
```

## Verify

```bash
npm run test
npm run build
cd src-tauri && cargo fmt --check && cargo test
```

## Build

```bash
npm run tauri:build
./packaging/arch/build-arch-package.sh
```

## Release

Push a version tag to trigger the GitHub Release workflow:

```bash
git tag v0.1.0
git push origin main --tags
```

The workflow builds Linux bundles, an Arch package, and a Windows x64 `.exe` installer, then publishes them to a GitHub Release.

## License

MIT
