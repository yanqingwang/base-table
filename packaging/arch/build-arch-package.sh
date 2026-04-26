#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
project_root="$(cd "${script_dir}/../.." && pwd)"

cd "${project_root}"
rm -rf src-tauri/target/release/bundle
npm run tauri:build

cd "${script_dir}"
rm -rf pkg src ./*.pkg.tar.*
makepkg --force --clean --cleanbuild --nodeps

packages=(./*.pkg.tar.*)
package_file="${packages[0]}"
echo "Arch package built: ${package_file}"
