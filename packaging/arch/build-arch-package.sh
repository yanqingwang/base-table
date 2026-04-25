#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
project_root="$(cd "${script_dir}/../.." && pwd)"

cd "${project_root}"
npm run tauri:build

cd "${script_dir}"
rm -rf pkg src ./*.pkg.tar.*
makepkg --force --clean --cleanbuild --nodeps

package_file="$(ls ./*.pkg.tar.* | head -n 1)"
echo "Arch package built: ${package_file}"
