import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';
import { gameApi, usersApi } from '../services/api.js';

export default function Dashboard() {
  const { user, loadingUser } = useAuth();
  const [rounds, setRounds] = useState([]);
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingLeaders, setLoadingLeaders] = useState(true);
  const [error, setError] = useState('');
  const [leaderError, setLeaderError] = useState('');

  useEffect(() => {
    setLoadingLeaders(true);

    usersApi.leaderboard()
      .then((data) => {
        setLeaders(data.users);
        setLeaderError('');
      })
      .catch((err) => {
        setLeaderError(err.message);
      })
      .finally(() => {
        setLoadingLeaders(false);
      });

    if (!user) {
      setRounds([]);
      setError('');
      setLoading(false);
      return;
    }

    setLoading(true);
    gameApi.history()
      .then((data) => {
        setRounds(data.rounds);
        setError('');
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [user]);

  if (loadingUser) {
    return <div className="page"><p className="message">Loading account...</p></div>;
  }

  return (
    <div className="page">
      <section className="dashboard-head">
        <div>
          <p className="eyebrow">Dashboard</p>
          <h1>{user ? user.username : 'Leaderboard'}</h1>
        </div>
        {user && (
          <div className="balance-card">
            <span>Saved balance</span>
            <strong>{user.points} pts</strong>
          </div>
        )}
      </section>

      <section className="history-panel leaderboard-panel">
        <h2>Top 10 scores</h2>
        {loadingLeaders && <p className="message">Loading leaderboard...</p>}
        {leaderError && <p className="error">{leaderError}</p>}
        {!loadingLeaders && !leaderError && leaders.length === 0 && (
          <div className="empty-state">
            <p>No ranked users yet.</p>
          </div>
        )}
        {leaders.length > 0 && (
          <div className="table-wrap">
            <table className="leaderboard-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Username</th>
                  <th>Points</th>
                </tr>
              </thead>
              <tbody>
                {leaders.map((leader, index) => (
                  <tr key={leader.username}>
                    <td>{index + 1}</td>
                    <td>{leader.username}</td>
                    <td>{leader.points} pts</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="history-panel">
        <h2>Round history</h2>
        {!user && (
          <div className="empty-state">
            <p>Log in to view your saved rounds.</p>
            <Link className="button-link" to="/login">Login</Link>
          </div>
        )}
        {user && loading && <p className="message">Loading rounds...</p>}
        {error && <p className="error">{error}</p>}
        {user && !loading && !error && rounds.length === 0 && (
          <div className="empty-state">
            <p>No saved rounds yet.</p>
            <Link className="button-link" to="/">Play a round</Link>
          </div>
        )}
        {user && rounds.length > 0 && (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Bet</th>
                  <th>Crash</th>
                  <th>Stopped</th>
                  <th>Multiplier</th>
                  <th>Payout</th>
                  <th>Result</th>
                </tr>
              </thead>
              <tbody>
                {rounds.map((round) => (
                  <tr key={round.id}>
                    <td>{new Date(round.created_at).toLocaleString()}</td>
                    <td>{round.bet_points}</td>
                    <td>{Number(round.crash_time).toFixed(2)}s</td>
                    <td>{round.stopped_at === null ? '-' : `${Number(round.stopped_at).toFixed(2)}s`}</td>
                    <td>{round.multiplier === null ? '-' : `${Number(round.multiplier).toFixed(2)}x`}</td>
                    <td>{round.payout_points}</td>
                    <td><span className={`result ${round.result}`}>{round.result}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
