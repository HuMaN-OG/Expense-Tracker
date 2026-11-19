const test = require('node:test');
const assert = require('node:assert/strict');
const { app } = require('../server');

test('health endpoint reports unavailable MongoDB as degraded', async () => {
  const server = app.listen(0, '127.0.0.1');
  try {
    await new Promise(resolve => server.once('listening', resolve));
    const port = server.address().port;
    const response = await fetch(`http://127.0.0.1:${port}/health`);
    assert.equal(response.status, 503);
    assert.deepEqual(await response.json(), {
      status: 'degraded',
      database: 'disconnected',
    });
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
});
