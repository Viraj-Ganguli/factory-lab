// HTTP layer for authentication: parse req, call service, shape res.
const express = require('express');
const authService = require('../services/auth.service');
const { UnauthorizedError, ValidationError } = require('../errors');

const router = express.Router();

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      throw new ValidationError('email and password are required');
    }

    const user = await authService.verifyCredentials(email, password);
    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    req.session.userId = user.id;
    req.session.isAdmin = user.isAdmin;

    res.json({ user });
  } catch (err) {
    next(err);
  }
});

router.post('/logout', (req, res, next) => {
  req.session.destroy((err) => {
    if (err) return next(err);
    res.clearCookie('connect.sid');
    res.status(204).end();
  });
});

router.get('/me', async (req, res, next) => {
  try {
    if (!req.session || !req.session.userId) {
      return res.json({ user: null });
    }

    const user = await authService.getUserById(req.session.userId);
    res.json({ user });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
