import { Link, NavLink, Route, Routes } from "react-router-dom";
import { LogOut, Moon, Rocket } from "lucide-react";
import { useAuth } from "./hooks/useAuth.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Home from "./pages/Home.jsx";
import Login from "./pages/Login.jsx";
import NotFound from "./pages/NotFound.jsx";
import Register from "./pages/Register.jsx";

function App() {
  const { user, logout } = useAuth();

  return (
    <div className="app-shell">
      <header className="topbar">
        <Link className="brand" to="/">
          <Rocket size={24} />
          <span>Rocket to the Moon</span>
        </Link>
        <nav className="nav">
          <NavLink to="/">Game</NavLink>
          {user ? (
            <>
              <NavLink to="/dashboard">Dashboard</NavLink>
              <span className="points-pill">
                <Moon size={16} /> {user.points} pts
              </span>
              <button className="icon-button" onClick={logout} title="Log out">
                <LogOut size={18} />
              </button>
            </>
          ) : (
            <>
              <NavLink to="/dashboard">Dashboard</NavLink>
              <NavLink to="/login">Login</NavLink>
              <NavLink className="button-link" to="/register">
                Register
              </NavLink>
            </>
          )}
        </nav>
      </header>

      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
