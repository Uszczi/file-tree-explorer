default:
    @just --list

clean:
    rm -rf dist dist-ssr playwright-report test-results blob-report \
        node_modules/.tmp node_modules/.vite node_modules/.vite-temp

clean-all: clean
    rm -rf node_modules

check:
    npm run lint
    npm run format:check
    npx tsc -b
    npx vitest run

zip:
    #!/usr/bin/env bash
    set -euo pipefail
    if [ -n "$(git status --porcelain)" ]; then
        echo "Commit or stash these changes first, so the zip matches the history:" >&2
        git status --short >&2
        exit 1
    fi
    out="$(realpath ..)/file-tree-explorer.zip"
    tmp="$(mktemp -d)"
    trap 'rm -rf "$tmp"' EXIT
    git clone --quiet --no-local . "$tmp/file-tree-explorer"
    git -C "$tmp/file-tree-explorer" remote remove origin
    rm -f "$out"
    (cd "$tmp" && zip -qr "$out" file-tree-explorer)
    echo "Created $out ($(du -h "$out" | cut -f1))"
