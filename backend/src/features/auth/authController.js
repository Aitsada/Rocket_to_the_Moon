import bcrypt from 'bcryptjs';
import { HttpError } from '../../utils/httpError.js';
import { signToken } from '../../utils/tokens.js';
import {
  createUser,
  findUserByEmail,
  findUserByUsername,
  touchLastLogin
} from '../users/userRepository.js';

function sanitizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function sanitizeUsername(username) {
  return String(username || '').trim();
}

function validateCredentials({ email, username, password }, mode) {
  const cleanEmail = sanitizeEmail(email);
  const cleanUsername = sanitizeUsername(username);
  const cleanPassword = String(password || '');

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    throw new HttpError(400, 'Valid email is required');
  }

  if (mode === 'register' && (cleanUsername.length < 3 || cleanUsername.length > 30)) {
    throw new HttpError(400, 'Username must be 3-30 characters');
  }

  if (cleanPassword.length < 6) {
    throw new HttpError(400, 'Password must be at least 6 characters');
  }

  return { email: cleanEmail, username: cleanUsername, password: cleanPassword };
}

export async function register(req, res, next) {
  try {
    const { email, username, password } = validateCredentials(req.body, 'register');

    const existingEmail = await findUserByEmail(email);
    if (existingEmail) {
      throw new HttpError(409, 'Email already registered');
    }

    const existingUsername = await findUserByUsername(username);
    if (existingUsername) {
      throw new HttpError(409, 'Username already taken');
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await createUser({ email, username, passwordHash });
    const token = signToken(user);

    res.status(201).json({ user, token });
  } catch (error) {
    next(error);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = validateCredentials(req.body, 'login');
    const account = await findUserByEmail(email);

    if (!account || account.status !== 'active') {
      throw new HttpError(401, 'Invalid email or password');
    }

    const isValid = await bcrypt.compare(password, account.password_hash);
    if (!isValid) {
      throw new HttpError(401, 'Invalid email or password');
    }

    const user = await touchLastLogin(account.id);
    const token = signToken(user);

    res.json({ user, token });
  } catch (error) {
    next(error);
  }
}

export async function me(req, res) {
  res.json({ user: req.user });
}
