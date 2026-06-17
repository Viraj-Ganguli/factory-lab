// Process entrypoint: boot the HTTP server.
const app = require('./app');
const config = require('./config');

app.listen(config.port, () => {
  // eslint-disable-next-line no-console
  console.log(`factory-lab server listening on http://localhost:${config.port}`);
});
