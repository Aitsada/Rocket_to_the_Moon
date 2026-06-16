import { getLeaderboard } from './userRepository.js';

export async function leaderboard(_req, res, next) {
  try {
    const users = await getLeaderboard();
    res.json({ users });
  } catch (error) {
    next(error);
  }
}
