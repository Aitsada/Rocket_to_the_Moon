import { query } from '../../db/pool.js';

export const publicUserFields =
  'id, email, username, role, status, points, points_updated_at, last_login_at, created_at';

export async function findUserByEmail(email) {
  const result = await query('SELECT * FROM users WHERE email = $1', [email]);
  return result.rows[0];
}

export async function findUserByUsername(username) {
  const result = await query('SELECT * FROM users WHERE username = $1', [username]);
  return result.rows[0];
}

export async function createUser({ email, username, passwordHash }) {
  const result = await query(
    `INSERT INTO users (email, username, password_hash, points)
     VALUES ($1, $2, $3, 500)
     RETURNING ${publicUserFields}`,
    [email, username, passwordHash]
  );
  return result.rows[0];
}

export async function touchLastLogin(userId) {
  const result = await query(
    `UPDATE users SET last_login_at = NOW()
     WHERE id = $1
     RETURNING ${publicUserFields}`,
    [userId]
  );
  return result.rows[0];
}

export async function getLeaderboard() {
  const result = await query(
    `SELECT username, points_updated_at AS last_point_update
     FROM users
     WHERE status = 'active'
     ORDER BY points DESC, points_updated_at DESC
     LIMIT 10`
  );
  return result.rows;
}
