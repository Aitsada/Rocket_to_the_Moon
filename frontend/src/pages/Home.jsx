import GamePanel from '../components/GamePanel.jsx';
import { useAuth } from '../hooks/useAuth.jsx';

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="page">
      <section className="intro">
        <div>
          <p className="eyebrow">{user ? `Pilot ${user.username}` : 'Guest pilots start with 300 points'}</p>
          <h1>Rocket to the Moon</h1>
          <p>Bet points, launch, and stop before the backend crash time catches the rocket.</p>
        </div>
      </section>
      <GamePanel />
    </div>
  );
}
