# tests/golden/

Hand-written shared test harness. Other suites under `tests/**` import these
helpers — **do not duplicate this setup logic in feature test directories.**

**No agent — QA, coder, or otherwise — may create, edit, or delete any file in
this directory.** See the root `CLAUDE.md` and `.factory/qa.nlspec.md` for the
authority rules. If something here appears wrong or insufficient for a given
test, record it in `.factory/ambiguity-checklist.md` and stop.

## Prerequisites

```bash
npm run db:up
npm run migrate
```

## Exports

### `tests/golden/app.js`

```js
const { createTestApp } = require('../golden/app');
const request = require('supertest');

const app = createTestApp();
const res = await request(app).get('/api/events');
```

`createTestApp()` returns the same Express `app` exported by
`server/src/app.js` (no `listen()` — safe to drive directly with supertest).

### `tests/golden/db.js`

```js
const { resetDb, seedAdmin, seedUser, closeDb, pool } = require('../golden/db');

beforeEach(async () => {
  await resetDb(); // TRUNCATEs events + users, resets identity sequences
});

afterAll(async () => {
  await closeDb(); // closes the shared pg pool
});

const admin = await seedAdmin(); // { id, email, is_admin: true, password }
const member = await seedUser(); // { id, email, is_admin: false, password }
```

`seedAdmin()` / `seedUser()` accept `{ email, password }` overrides and return
the plaintext `password` alongside the inserted row, for use with
`loginAs()`.

### `tests/golden/auth.js`

```js
const { loginAs } = require('../golden/auth');
const { ADMIN } = require('../golden/fixtures');

const agent = await loginAs(app, ADMIN); // supertest agent with session cookie
await agent.post('/api/events').send({ ... });
```

`loginAs(app, { email, password })` logs in via `POST /api/auth/login` and
returns a `supertest.agent` whose cookie jar carries the session for
subsequent requests. Throws if login fails (e.g. the user wasn't seeded).

### `tests/golden/fixtures.js`

`ADMIN`, `MEMBER` (credentials matching the defaults `seedAdmin()`/`seedUser()`
create), and `SAMPLE_EVENT` (a valid event payload shape).

## Concurrency note

All suites under `tests/**` share one Postgres database. `server/jest.config.js`
sets `maxWorkers: 1` so test files run serially — `resetDb()` in one file won't
race with another file's data. Keep it that way; don't add `--runInBand`-busting
parallelism without giving every suite its own schema/database.

## Full example

```js
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
it('lets an admin create an event', async () => {
  const agent = await loginAs(app, ADMIN);
  const res = await agent.post('/api/events').send(SAMPLE_EVENT);
  expect(res.status).toBe(201);
  expect(res.body.event.title).toBe(SAMPLE_EVENT.title);
});
```
