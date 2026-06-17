// Jest config for the server.
//
// rootDir points at the monorepo root so that future tests written under
// the repo-level `tests/` directory (see tests/golden/README.md) are
// discovered by `npm test` (run from server/, or `npm test` at the root).
module.exports = {
  rootDir: '..',
  roots: ['<rootDir>/server/src', '<rootDir>/tests'],
  testEnvironment: 'node',
  testMatch: ['**/?(*.)+(spec|test).[jt]s'],
  // Allow `npm test` to succeed before any tests exist yet — the test
  // harness under tests/golden/ is written by hand separately.
  passWithNoTests: true,
  // All suites share one Postgres DB via tests/golden/db.js's resetDb().
  // Run test files serially so they don't truncate tables out from under
  // each other.
  maxWorkers: 1,
};
