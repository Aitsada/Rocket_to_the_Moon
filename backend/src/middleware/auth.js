import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { query } from '../db/pool.js';
import { HttpError } from '../utils/httpError.js';

export async function authenticate(req, _res, next) {
  try {
    const header = req.headers.authorization;
    const token = header?.startsWith('Bearer ') ? header.slice(7) : null;

    if (!token) {
      throw new HttpError(401, 'Authentication required');
    }

    const payload = jwt.verify(token, env.jwtSecret);
    const result = await query(
      'SELECT id, email, username, role, status, points, points_updated_at, last_login_at, created_at FROM users WHERE id = $1',
      [payload.id]
    );

    const user = result.rows[0];
    if (!user || user.status !== 'active') {
      throw new HttpError(401, 'Invalid account');
    }

    req.user = user;
    next();
  } catch (error) {
    next(error.statusCode ? error : new HttpError(401, 'Invalid token'));
  }
}

export async function optionalAuth(req, _res, next) {
  console.log("auth.js OK")
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return next();
  }

  return authenticate(req, _res, next);
}
