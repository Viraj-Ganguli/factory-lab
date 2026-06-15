// Shared Supertest app factory for tests under tests/**.
//
// Re-exports the Express app from server/src/app.js. That module
// deliberately stops short of calling listen() so it can be imported
// directly into a test process and driven with supertest(app) /
// supertest.agent(app).
const app = require('../../server/src/app');

function createTestApp() {
  return app;
}

module.exports = { createTestApp };
