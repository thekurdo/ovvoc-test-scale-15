const assert = require('assert');
const app = require('../src/index');
const http = require('http');
const { resetAll } = require('../src/store');

function makeRequest(base, method, path, body, cookies) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, base);
    const options = { method, hostname: url.hostname, port: url.port, path: url.pathname, headers: {} };
    if (cookies) options.headers['Cookie'] = cookies;
    if (body) { const d = JSON.stringify(body); options.headers['Content-Type'] = 'application/json'; options.headers['Content-Length'] = Buffer.byteLength(d); }
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const sc = res.headers['set-cookie'] || [];
        const c = sc.map(x => x.split(';')[0]).join('; ');
        try { resolve({ status: res.statusCode, body: JSON.parse(data || '{}'), cookies: c }); }
        catch { resolve({ status: res.statusCode, body: data, cookies: c }); }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function runTests() {
  const server = await new Promise(resolve => { const s = app.listen(0, () => resolve(s)); });
  const port = server.address().port;
  const base = `http://localhost:${port}`;
  let passed = 0, failed = 0;
  async function test(name, fn) { try { await fn(); passed++; } catch (err) { failed++; console.error(`FAIL: ${name} — ${err.message}`); } }

  resetAll();

  await test('GET /health', async () => {
    const r = await makeRequest(base, 'GET', '/health');
    assert.strictEqual(r.status, 200);
  });

  await test('Unauthenticated returns 401', async () => {
    const r = await makeRequest(base, 'GET', '/api/projects');
    assert.strictEqual(r.status, 401);
  });

  // Login as admin
  let cookies;
  await test('Login as admin', async () => {
    const r = await makeRequest(base, 'POST', '/auth/login', { username: 'admin', password: 'admin123' });
    assert.strictEqual(r.status, 200);
    cookies = r.cookies;
  });

  await test('GET /auth/me', async () => {
    const r = await makeRequest(base, 'GET', '/auth/me', null, cookies);
    assert.strictEqual(r.status, 200);
    assert.strictEqual(r.body.username, 'admin');
  });

  // Test all 6 protected resources
  const resources = [
    { name: 'projects', body: { name: 'Alpha' } },
    { name: 'tasks', body: { title: 'Setup CI' } },
    { name: 'teams', body: { name: 'Engineering' } },
    { name: 'comments', body: { text: 'Looks good' } },
    { name: 'files', body: { filename: 'report.pdf' } },
    { name: 'settings', body: { key: 'theme', value: 'dark' } },
  ];

  for (const res of resources) {
    await test(`POST /api/${res.name}`, async () => {
      const r = await makeRequest(base, 'POST', `/api/${res.name}`, res.body, cookies);
      assert.strictEqual(r.status, 201);
    });
    await test(`GET /api/${res.name}`, async () => {
      const r = await makeRequest(base, 'GET', `/api/${res.name}`, null, cookies);
      assert.strictEqual(r.status, 200);
      assert.ok(Array.isArray(r.body));
    });
    await test(`GET /api/${res.name}/1`, async () => {
      const r = await makeRequest(base, 'GET', `/api/${res.name}/1`, null, cookies);
      assert.strictEqual(r.status, 200);
    });
  }

  // Wildcard routes
  await test('GET /api/search/*', async () => {
    const r = await makeRequest(base, 'GET', '/api/search/alpha');
    assert.strictEqual(r.status, 200);
  });

  await test('GET /docs/*', async () => {
    const r = await makeRequest(base, 'GET', '/docs/getting-started');
    assert.strictEqual(r.status, 200);
  });

  // Logout
  await test('POST /auth/logout', async () => {
    const r = await makeRequest(base, 'POST', '/auth/logout', null, cookies);
    assert.strictEqual(r.status, 200);
  });

  // Role test — login as staff, try admin-only
  await test('Staff cannot access settings', async () => {
    const lr = await makeRequest(base, 'POST', '/auth/login', { username: 'staff', password: 'staff123' });
    assert.strictEqual(lr.status, 200);
    const r = await makeRequest(base, 'GET', '/api/settings', null, lr.cookies);
    assert.strictEqual(r.status, 403);
  });

  await test('GET /unknown returns 404', async () => {
    const r = await makeRequest(base, 'GET', '/unknown');
    assert.strictEqual(r.status, 404);
  });

  server.close();
  console.log(`${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

runTests().catch(err => { console.error(err); process.exit(1); });
