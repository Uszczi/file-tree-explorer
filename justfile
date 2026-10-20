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
