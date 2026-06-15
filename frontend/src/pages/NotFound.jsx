import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Page not found</h1>
        <p className="message">This flight path does not exist.</p>
        <Link className="button-link" to="/">Return to game</Link>
      </div>
    </div>
  );
}
