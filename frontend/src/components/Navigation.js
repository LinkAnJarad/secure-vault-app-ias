import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Navigation = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <nav className="navigation">
      <div className="nav-brand">
        <h3>Secure File Sharing</h3>
      </div>
      
      <ul className="nav-links">
        <li><Link to="/dashboard">Dashboard</Link></li>
        <li><Link to="/upload">Upload</Link></li>
        <li><Link to="/files">My Files</Link></li>
        {user?.role === 'admin' && (
          <li><Link to="/admin">Admin Panel</Link></li>
        )}
      </ul>
      
      <div className="nav-user">
        <span>Welcome, {user?.name} ({user?.role})</span>
        <button onClick={handleLogout} className="logout-btn">Logout</button>
      </div>
    </nav>
  );
};

export default Navigation;