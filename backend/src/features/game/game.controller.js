import { pool, query } from '../../db/pool.js';
import { HttpError } from '../../utils/httpError.js';
import { generateCrashTime, MAX_TRAVEL_SECONDS, multiplierForTime, nowElapsedSeconds } from './game.utils.js';

function validateBet(betPoints, availablePoints) {
  const bet = Number(betPoints);

  if (!Number.isInteger(bet) || bet <= 0) {
    throw new HttpError(400, 'Bet must be a positive whole number');
  }

  if (availablePoints !== null && bet > availablePoints) {
    throw new HttpError(400, 'Not enough points');
  }

  return bet;
}

function publicRound(round, hideCrashTime = true) {
  const response = {
    id: round.id,
    user_id: round.user_id,
    bet_points: Number(round.bet_points),
    stopped_at: round.stopped_at === null ? null : Number(round.stopped_at),
    multiplier: round.multiplier === null ? null : Number(round.multiplier),
    payout_points: Number(round.payout_points),
    result: round.result,
    created_at: round.created_at
  };

  if (!hideCrashTime) {
    response.crash_time = Number(round.crash_time);
  }

  return response;
}

export async function startRound(req, res, next) {
  console.log("start round OK")
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    let updatedUser = null;
    const userId = req.user?.id || null;
    const userPoints = req.user ? Number(req.user.points) : null;
    const bet = validateBet(req.body.bet_points, userPoints);
    const crashTime = generateCrashTime();

    if (req.user) {
      const userResult = await client.query('SELECT id, points FROM users WHERE id = $1 FOR UPDATE', [req.user.id]);
      const user = userResult.rows[0];
      validateBet(bet, Number(user.points));

      const updatedUserResult = await client.query(
        `UPDATE users SET points = points - $1, points_updated_at = NOW(), updated_at = NOW()
         WHERE id = $2 AND points >= $1
         RETURNING id, email, username, role, status, points, points_updated_at, last_login_at, created_at`,
        [bet, req.user.id]
      );

      if (!updatedUserResult.rows[0]) {
        throw new HttpError(400, 'Not enough points');
      }

      updatedUser = updatedUserResult.rows[0];
    }

    const roundResult = await client.query(
      `INSERT INTO game_rounds (user_id, bet_points, crash_time, result)
       VALUES ($1, $2, $3, 'active')
       RETURNING *`,
      [userId, bet, crashTime]
    );

    await client.query('COMMIT');

    res.status(201).json({
      round: publicRound(roundResult.rows[0]),
      user: updatedUser,
      max_travel_seconds: MAX_TRAVEL_SECONDS
    });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
}

export async function cashOut(req, res, next) {
  const client = await pool.connect();

  try {
    const { round_id: roundId } = req.body;
    if (!roundId) {
      throw new HttpError(400, 'round_id is required');
    }

    await client.query('BEGIN');

    const roundResult = req.user
      ? await client.query(
        `SELECT * FROM game_rounds
         WHERE id = $1 AND user_id = $2
         FOR UPDATE`,
        [roundId, req.user.id]
      )
      : await client.query(
        `SELECT * FROM game_rounds
         WHERE id = $1 AND user_id IS NULL
         FOR UPDATE`,
        [roundId]
      );
    const round = roundResult.rows[0];

    if (!round) {
      throw new HttpError(404, 'Round not found');
    }

    if (round.result !== 'active') {
      throw new HttpError(409, 'Round is already finished');
    }

    const elapsed = Math.min(nowElapsedSeconds(round.created_at), MAX_TRAVEL_SECONDS);
    const crashTime = Number(round.crash_time);

    if (elapsed >= crashTime && crashTime < MAX_TRAVEL_SECONDS) {
      const crashed = await client.query(
        `UPDATE game_rounds
         SET result = 'lost', stopped_at = NULL, multiplier = NULL, payout_points = 0
         WHERE id = $1
         RETURNING *`,
        [round.id]
      );
      await client.query('COMMIT');
      return res.status(409).json({
        error: 'Rocket already crashed',
        round: publicRound(crashed.rows[0], false)
      });
    }

    const stoppedAt = crashTime >= MAX_TRAVEL_SECONDS && elapsed >= MAX_TRAVEL_SECONDS
      ? MAX_TRAVEL_SECONDS
      : elapsed;
    const multiplier = multiplierForTime(stoppedAt);
    const payout = Math.floor(Number(round.bet_points) * multiplier);

    const finishedRound = await client.query(
      `UPDATE game_rounds
       SET stopped_at = $1, multiplier = $2, payout_points = $3, result = 'won'
       WHERE id = $4
       RETURNING *`,
      [stoppedAt, multiplier, payout, round.id]
    );

    let updatedUser = null;
    if (req.user) {
      const updatedUserResult = await client.query(
        `UPDATE users SET points = points + $1, points_updated_at = NOW(), updated_at = NOW()
         WHERE id = $2
         RETURNING id, email, username, role, status, points, points_updated_at, last_login_at, created_at`,
        [payout, req.user.id]
      );
      updatedUser = updatedUserResult.rows[0];
    }

    await client.query('COMMIT');

    res.json({
      round: publicRound(finishedRound.rows[0], false),
      user: updatedUser
    });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
}

export async function crashRound(req, res, next) {
  const client = await pool.connect();

  try {
    const { round_id: roundId } = req.body;
    if (!roundId) {
      throw new HttpError(400, 'round_id is required');
    }

    await client.query('BEGIN');

    const roundResult = req.user
      ? await client.query(
        `SELECT * FROM game_rounds
         WHERE id = $1 AND user_id = $2
         FOR UPDATE`,
        [roundId, req.user.id]
      )
      : await client.query(
        `SELECT * FROM game_rounds
         WHERE id = $1 AND user_id IS NULL
         FOR UPDATE`,
        [roundId]
      );
    const round = roundResult.rows[0];

    if (!round) {
      throw new HttpError(404, 'Round not found');
    }

    if (round.result !== 'active') {
      await client.query('COMMIT');
      return res.json({ round: publicRound(round, false), user: req.user });
    }

    const elapsed = nowElapsedSeconds(round.created_at);
    const crashTime = Number(round.crash_time);

    if (crashTime >= MAX_TRAVEL_SECONDS && elapsed >= MAX_TRAVEL_SECONDS) {
      const multiplier = 100;
      const payout = Math.floor(Number(round.bet_points) * multiplier);
      const finishedRound = await client.query(
        `UPDATE game_rounds
         SET stopped_at = $1, multiplier = $2, payout_points = $3, result = 'won'
         WHERE id = $4
         RETURNING *`,
        [MAX_TRAVEL_SECONDS, multiplier, payout, round.id]
      );
      let updatedUser = null;
      if (req.user) {
        const updatedUserResult = await client.query(
          `UPDATE users SET points = points + $1, points_updated_at = NOW(), updated_at = NOW()
           WHERE id = $2
           RETURNING id, email, username, role, status, points, points_updated_at, last_login_at, created_at`,
          [payout, req.user.id]
        );
        updatedUser = updatedUserResult.rows[0];
      }
      await client.query('COMMIT');
      return res.json({ round: publicRound(finishedRound.rows[0], false), user: updatedUser });
    }

    if (elapsed < crashTime) {
      throw new HttpError(409, 'Round is still flying');
    }

    const crashed = await client.query(
      `UPDATE game_rounds
       SET result = 'lost', payout_points = 0
       WHERE id = $1
       RETURNING *`,
      [round.id]
    );

    await client.query('COMMIT');

    res.json({ round: publicRound(crashed.rows[0], false), user: req.user });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
}

export async function history(req, res, next) {
  try {
    if (!req.user) {
      throw new HttpError(401, 'Login is required');
    }

    const result = await query(
      `SELECT *
       FROM game_rounds
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 50`,
      [req.user.id]
    );

    res.json({ rounds: result.rows.map((round) => publicRound(round, false)) });
  } catch (error) {
    next(error);
  }
}
