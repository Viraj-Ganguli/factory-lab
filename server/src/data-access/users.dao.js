// Data-access layer for the `users` table.
// SQL only — no business logic, no req/res.
const pool = require('../db/pool');

async function findByEmail(email) {
  const { rows } = await pool.query(
    'SELECT id, email, password_hash, is_admin, created_at FROM users WHERE email = $1',
    [email]
  );
  return rows[0] || null;
}

async function findById(id) {
  const { rows } = await pool.query(
    'SELECT id, email, is_admin, created_at FROM users WHERE id = $1',
    [id]
  );
  return rows[0] || null;
}

async function create({ email, passwordHash, isAdmin = false }) {
  const { rows } = await pool.query(
    `INSERT INTO users (email, password_hash, is_admin)
     VALUES ($1, $2, $3)
     RETURNING id, email, is_admin, created_at`,
    [email, passwordHash, isAdmin]
  );
  return rows[0];
}

module.exports = {
  findByEmail,
  findById,
  create,
};
