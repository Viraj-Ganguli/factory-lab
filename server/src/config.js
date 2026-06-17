// Centralized environment configuration.
// Loads server/.env (if present) and exposes typed-ish config values.
require('dotenv').config();

const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 4000,
  databaseUrl: process.env.DATABASE_URL || 'postgres://factorylab:factorylab@localhost:5432/factorylab',
  sessionSecret: process.env.SESSION_SECRET || 'dev-only-secret-change-me',
  seedAdminEmail: process.env.SEED_ADMIN_EMAIL || 'admin@example.com',
  seedAdminPassword: process.env.SEED_ADMIN_PASSWORD || 'admin123',
};

module.exports = config;
