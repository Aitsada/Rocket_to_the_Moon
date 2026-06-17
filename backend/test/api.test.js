import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { app } from '../src/app.js';
import { runMigrations } from '../src/db/migrate.js';
import { pool } from '../src/db/pool.js';
import { MAX_TRAVEL_SECONDS } from '../src/features/game/game.utils.js';

let server;
let baseUrl;

async function request(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    }
  });
  const data = await response.json().catch(() => ({}));
  return { response, data };
}

before(async () => {
  await runMigrations();
  await pool.query('TRUNCATE game_rounds, users RESTART IDENTITY CASCADE');

  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));

  const { port } = server.address();
  baseUrl = `http://127.0.0.1:${port}/api`;
});

after(async () => {
  if (server) {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }

  await pool.end();
});

test('health endpoint returns ok', async () => {
  const { response, data } = await request('/health');

  assert.equal(response.status, 200);
  assert.deepEqual(data, { status: 'ok' });
});

test('leaderboard is public', async () => {
  const { response, data } = await request('/users/leaderboard');

  assert.equal(response.status, 200);
  assert.ok(Array.isArray(data.users));
});

test('auth flow and protected account endpoint work', async () => {
  const email = `pilot-${Date.now()}@example.com`;
  const credentials = {
    email,
    username: `pilot_${Date.now()}`,
    password: 'secret123'
  };

  const registerResult = await request('/auth/register', {
    method: 'POST',
    body: JSON.stringify(credentials)
  });

  assert.equal(registerResult.response.status, 201);
  assert.equal(registerResult.data.user.email, email);
  assert.equal(registerResult.data.user.points, 500);
  assert.ok(registerResult.data.token);

  const loginResult = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password: credentials.password })
  });

  assert.equal(loginResult.response.status, 200);
  assert.ok(loginResult.data.token);

  const meResult = await request('/auth/me', {
    headers: {
      Authorization: `Bearer ${loginResult.data.token}`
    }
  });

  assert.equal(meResult.response.status, 200);
  assert.equal(meResult.data.user.email, email);
});

test('authenticated user can start a round and read history', async () => {
  const email = `round-${Date.now()}@example.com`;
  const registerResult = await request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      email,
      username: `round_${Date.now()}`,
      password: 'secret123'
    })
  });

  const { token } = registerResult.data;
  const startResult = await request('/game/start', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ bet_points: 10 })
  });

  assert.equal(startResult.response.status, 201);
  assert.equal(startResult.data.max_travel_seconds, MAX_TRAVEL_SECONDS);
  assert.equal(startResult.data.round.result, 'active');
  assert.equal(startResult.data.round.bet_points, 10);
  assert.equal(startResult.data.user.points, 490);

  const historyResult = await request('/game/history', {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  assert.equal(historyResult.response.status, 200);
  assert.equal(historyResult.data.rounds.length, 1);
  assert.equal(historyResult.data.rounds[0].id, startResult.data.round.id);
});
