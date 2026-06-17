// Session-based auth guards. Routes attach these to protect mutations.
const { UnauthorizedError, ForbiddenError } = require('../errors');

function requireAuth(req, res, next) {
  if (!req.session || !req.session.userId) {
    return next(new UnauthorizedError('Login required'));
  }
  return next();
}

function requireAdmin(req, res, next) {
  if (!req.session || !req.session.userId) {
    return next(new UnauthorizedError('Login required'));
  }
  if (!req.session.isAdmin) {
    return next(new ForbiddenError('Admin access required'));
  }
  return next();
}

module.exports = {
  requireAuth,
  requireAdmin,
};
