import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';
import { gameApi } from '../services/api.js';

export default function Dashboard() {
  const { user, loadingUser } = useAuth();
  const [rounds, setRounds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    gameApi.history()
      .then((data) => setRounds(data.rounds))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [user]);

  if (loadingUser) {
    return <div className="page"><p className="message">Loading account...</p></div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="page">
      <section className="dashboard-head">
        <div>
          <p className="eyebrow">Dashboard</p>
          <h1>{user.username}</h1>
        </div>
        <div className="balance-card">
          <span>Saved balance</span>
          <strong>{user.points} pts</strong>
        </div>
      </section>

      <section className="history-panel">
        <h2>Round history</h2>
        {loading && <p className="message">Loading rounds...</p>}
        {error && <p className="error">{error}</p>}
        {!loading && !error && rounds.length === 0 && (
          <div className="empty-state">
            <p>No saved rounds yet.</p>
            <Link className="button-link" to="/">Play a round</Link>
          </div>
        )}
        {rounds.length > 0 && (
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
