import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import LoadingButton from '../components/LoadingButton.jsx';
import { useAuth } from '../hooks/useAuth.jsx';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      await register(form);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h1>Register</h1>
        <label className="field">
          Username
          <input value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} required minLength="3" />
        </label>
        <label className="field">
          Email
          <input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required />
        </label>
        <label className="field">
          Password
          <input type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} required minLength="6" />
        </label>
        <LoadingButton className="launch-button" loading={loading}>Create account</LoadingButton>
        {error && <p className="error">{error}</p>}
        <p className="hint">Already registered? <Link to="/login">Login</Link></p>
      </form>
    </div>
  );
}
