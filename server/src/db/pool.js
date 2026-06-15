// Single shared pg Pool used by all data-access modules.
const { Pool } = require('pg');
const config = require('../config');

const pool = new Pool({
  connectionString: config.databaseUrl,
});

module.exports = pool;
