// Shared DB helpers for tests under tests/**.
//
// Operates against the same Postgres instance and pool the app itself uses
// (server/src/db/pool.js), pointed at by DATABASE_URL (server/.env). Run
// `npm run db:up && npm run migrate` before the suite so the schema exists.
const path = require('path');
const pool = require('../../server/src/db/pool');

// bcrypt is a dependency of server/, not of the repo root or tests/, so it
// isn't reachable via tests/golden's normal module resolution. Resolve it
// explicitly against the server package instead of duplicating the
// dependency at the root.
const bcrypt = require(
  require.resolve('bcrypt', { paths: [path.join(__dirname, '..', '..', 'server')] })
);

// Wipes all app tables and resets identity sequences. Call from beforeEach
// so every test starts from a clean, known-empty database.
async function resetDb() {
  await pool.query('TRUNCATE TABLE events, users RESTART IDENTITY CASCADE');
}

async function seedAdmin({ email = 'admin@example.com', password = 'admin123' } = {}) {
  const passwordHash = await bcrypt.hash(password, 10);
  const { rows } = await pool.query(
    `INSERT INTO users (email, password_hash, is_admin)
     VALUES ($1, $2, true)
     RETURNING id, email, is_admin`,
    [email, passwordHash]
  );
  return { ...rows[0], password };
}

async function seedUser({ email = 'member@example.com', password = 'member123' } = {}) {
  const passwordHash = await bcrypt.hash(password, 10);
  const { rows } = await pool.query(
    `INSERT INTO users (email, password_hash, is_admin)
     VALUES ($1, $2, false)
     RETURNING id, email, is_admin`,
    [email, passwordHash]
  );
  return { ...rows[0], password };
}

// Call once from afterAll so jest can exit cleanly.
async function closeDb() {
  await pool.end();
}

module.exports = { pool, resetDb, seedAdmin, seedUser, closeDb };
