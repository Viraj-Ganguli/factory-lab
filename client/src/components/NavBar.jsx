import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function NavBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        Club Events
      </Link>
      <div className="navbar-links">
        <Link to="/">Events</Link>
        {user?.isAdmin && <Link to="/admin">Admin</Link>}
        {user ? (
          <button onClick={handleLogout} className="link-button">
            Log out ({user.email})
          </button>
        ) : (
          <Link to="/login">Log in</Link>
        )}
      </div>
    </nav>
  );
}
