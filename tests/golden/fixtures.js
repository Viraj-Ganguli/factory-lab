// Canonical sample data for tests under tests/**.
// Pair with db.js's seedAdmin()/seedUser(), which accept these shapes
// directly as overrides if a test needs different credentials.

const ADMIN = { email: 'admin@example.com', password: 'admin123' };
const MEMBER = { email: 'member@example.com', password: 'member123' };

const SAMPLE_EVENT = {
  title: 'Welcome Mixer',
  description: 'Kick off the semester with snacks, games, and introductions.',
  location: 'Student Union, Room 204',
  startsAt: '2026-09-05T18:00:00.000Z',
};

module.exports = { ADMIN, MEMBER, SAMPLE_EVENT };
