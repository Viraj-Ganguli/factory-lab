// Express app assembly: middleware + routers only. No listen() here so
// tests (Supertest) can import this module directly.
const express = require('express');
const session = require('express-session');
const config = require('./config');
const authRoutes = require('./routes/auth.routes');
const eventsRoutes = require('./routes/events.routes');
const errorHandler = require('./middleware/error');

const app = express();

app.use(express.json());

app.use(
  session({
    name: 'connect.sid',
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: false, // dev/local only; set true behind HTTPS in production
    },
    // Default MemoryStore — fine for this throwaway app. Not suitable for
    // production (no persistence, leaks memory across many sessions).
  })
);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/events', eventsRoutes);

// 404 for unmatched /api routes.
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.use(errorHandler);

module.exports = app;
