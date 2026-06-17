// Business logic for authentication.
// No req/res here — routes translate between HTTP and this layer.
const bcrypt = require('bcrypt');
const usersDao = require('../data-access/users.dao');

function toSafeUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    email: user.email,
    isAdmin: user.is_admin,
  };
}

/**
 * Verify email/password credentials.
 * @returns {Promise<{id:number,email:string,isAdmin:boolean}|null>}
 *   The safe user object on success, or null if credentials are invalid.
 */
async function verifyCredentials(email, password) {
  if (!email || !password) return null;

  const user = await usersDao.findByEmail(email);
  if (!user) return null;

  const matches = await bcrypt.compare(password, user.password_hash);
  if (!matches) return null;

  return toSafeUser(user);
}

async function getUserById(id) {
  const user = await usersDao.findById(id);
  return toSafeUser(user);
}

module.exports = {
  verifyCredentials,
  getUserById,
  toSafeUser,
};
