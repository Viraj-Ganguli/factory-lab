// Auth helper for tests under tests/**.
const request = require('supertest');

// Returns a supertest agent (persistent cookie jar) already authenticated as
// the given user, for exercising routes behind requireAuth/requireAdmin.
async function loginAs(app, { email, password }) {
  const agent = request.agent(app);
  const res = await agent.post('/api/auth/login').send({ email, password });
  if (res.status !== 200) {
    throw new Error(`loginAs(${email}) failed: ${res.status} ${JSON.stringify(res.body)}`);
  }
  return agent;
}

module.exports = { loginAs };
