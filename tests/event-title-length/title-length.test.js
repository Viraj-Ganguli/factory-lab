const request = require('supertest');
const { createTestApp } = require('../golden/app');
const { resetDb, seedAdmin, closeDb } = require('../golden/db');
const { loginAs } = require('../golden/auth');
const { ADMIN, SAMPLE_EVENT } = require('../golden/fixtures');

const app = createTestApp();

beforeEach(async () => {
  await resetDb();
  await seedAdmin(ADMIN);
});

afterAll(async () => {
  await closeDb();
});

// AC-1
it('POST /api/events with exactly 200-char title returns 201', async () => {
  const agent = await loginAs(app, ADMIN);
  const title = 'a'.repeat(200);
  const res = await agent.post('/api/events').send({ ...SAMPLE_EVENT, title });
  expect(res.status).toBe(201);
});

// AC-2
it('POST /api/events with 201-char title returns 400 with error mentioning title', async () => {
  const agent = await loginAs(app, ADMIN);
  const title = 'a'.repeat(201);
  const res = await agent.post('/api/events').send({ ...SAMPLE_EVENT, title });
  expect(res.status).toBe(400);
  expect(res.body).toHaveProperty('error');
  expect(res.body.error.toLowerCase()).toContain('title');
});

// AC-3
it('PUT /api/events/:id with 201-char title returns 400 with error mentioning title', async () => {
  const agent = await loginAs(app, ADMIN);
  // Create a valid event first
  const createRes = await agent.post('/api/events').send(SAMPLE_EVENT);
  expect(createRes.status).toBe(201);
  const eventId = createRes.body.event.id;

  const title = 'a'.repeat(201);
  const res = await agent.put(`/api/events/${eventId}`).send({ ...SAMPLE_EVENT, title });
  expect(res.status).toBe(400);
  expect(res.body).toHaveProperty('error');
  expect(res.body.error.toLowerCase()).toContain('title');
});

// Edge case: 200-char title after trim (205 raw, 2 leading + 3 trailing spaces) → 201
it('POST /api/events with 200-char trimmed title (padded to 205 raw) returns 201', async () => {
  const agent = await loginAs(app, ADMIN);
  const title = '  ' + 'a'.repeat(200) + '   ';
  const res = await agent.post('/api/events').send({ ...SAMPLE_EVENT, title });
  expect(res.status).toBe(201);
});

// Edge case: existing blank-title rejection still works
it('POST /api/events with empty title still returns 400', async () => {
  const agent = await loginAs(app, ADMIN);
  const res = await agent.post('/api/events').send({ ...SAMPLE_EVENT, title: '' });
  expect(res.status).toBe(400);
  expect(res.body).toHaveProperty('error');
});
