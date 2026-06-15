// Idempotent seed script: creates an admin user and a few sample events.
// Run with: npm run seed (from server/, or root via `npm run seed`).
const bcrypt = require('bcrypt');
const pool = require('../src/db/pool');
const config = require('../src/config');

const SAMPLE_EVENTS = [
  {
    title: 'Welcome Mixer',
    description: 'Kick off the semester with snacks, games, and introductions.',
    location: 'Student Union, Room 204',
    startsAt: '2026-09-05T18:00:00Z',
  },
  {
    title: 'Hackathon Kickoff',
    description: '24-hour build event. Teams of up to 4. Prizes for top 3 projects.',
    location: 'Engineering Hall, Atrium',
    startsAt: '2026-10-17T17:00:00Z',
  },
  {
    title: 'End-of-Year Showcase',
    description: 'Members present projects from the year to faculty and guests.',
    location: 'Main Auditorium',
    startsAt: '2027-04-30T19:00:00Z',
  },
];

async function seedAdmin() {
  const existing = await pool.query('SELECT id FROM users WHERE email = $1', [
    config.seedAdminEmail,
  ]);

  if (existing.rows.length > 0) {
    console.log(`Admin user already exists: ${config.seedAdminEmail}`);
    return existing.rows[0].id;
  }

  const passwordHash = await bcrypt.hash(config.seedAdminPassword, 10);
  const { rows } = await pool.query(
    `INSERT INTO users (email, password_hash, is_admin)
     VALUES ($1, $2, true)
     RETURNING id`,
    [config.seedAdminEmail, passwordHash]
  );

  console.log(`Created admin user: ${config.seedAdminEmail} / ${config.seedAdminPassword}`);
  return rows[0].id;
}

async function seedEvents(adminId) {
  const { rows } = await pool.query('SELECT COUNT(*)::int AS count FROM events');
  if (rows[0].count > 0) {
    console.log(`Events table already has ${rows[0].count} row(s); skipping event seed.`);
    return;
  }

  for (const event of SAMPLE_EVENTS) {
    await pool.query(
      `INSERT INTO events (title, description, location, starts_at, created_by)
       VALUES ($1, $2, $3, $4, $5)`,
      [event.title, event.description, event.location, event.startsAt, adminId]
    );
  }

  console.log(`Inserted ${SAMPLE_EVENTS.length} sample event(s).`);
}

async function main() {
  const adminId = await seedAdmin();
  await seedEvents(adminId);
  await pool.end();
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exitCode = 1;
});
