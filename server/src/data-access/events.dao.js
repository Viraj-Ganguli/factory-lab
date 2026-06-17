// Data-access layer for the `events` table.
// SQL only — no business logic, no req/res.
const pool = require('../db/pool');

const COLUMNS = `
  id, title, description, location, starts_at,
  created_by, created_at, updated_at
`;

async function findAll() {
  const { rows } = await pool.query(
    `SELECT ${COLUMNS} FROM events ORDER BY starts_at ASC`
  );
  return rows;
}

async function findById(id) {
  const { rows } = await pool.query(
    `SELECT ${COLUMNS} FROM events WHERE id = $1`,
    [id]
  );
  return rows[0] || null;
}

async function create({ title, description, location, startsAt, createdBy }) {
  const { rows } = await pool.query(
    `INSERT INTO events (title, description, location, starts_at, created_by)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING ${COLUMNS}`,
    [title, description, location, startsAt, createdBy]
  );
  return rows[0];
}

async function update(id, { title, description, location, startsAt }) {
  const { rows } = await pool.query(
    `UPDATE events
     SET title = $1,
         description = $2,
         location = $3,
         starts_at = $4,
         updated_at = now()
     WHERE id = $5
     RETURNING ${COLUMNS}`,
    [title, description, location, startsAt, id]
  );
  return rows[0] || null;
}

async function remove(id) {
  const { rowCount } = await pool.query('DELETE FROM events WHERE id = $1', [id]);
  return rowCount > 0;
}

module.exports = {
  findAll,
  findById,
  create,
  update,
  remove,
};
