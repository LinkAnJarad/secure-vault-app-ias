import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalFiles: 0,
    recentFiles: [],
    storageUsed: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await axios.get('/files?limit=5');
      const files = response.data.data;

      setStats({
        totalFiles: response.data.total,
        recentFiles: files,
        storageUsed: files.reduce((total, file) => total + file.size, 0),
      });
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  return (
    <div className="dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <h1>Welcome back, {user?.name} 👋</h1>
        <p className="subtitle">
          You are logged in as <strong>{user?.role}</strong>
          {user?.department && ` — ${user.department}`}
        </p>
      </header>

      {/* Key Stats */}
      <section className="dashboard-stats">
        <div className="dashboard-card">
          <h3>📁 Total Files</h3>
          <div className="stat-number">{stats.totalFiles}</div>
        </div>

        <div className="dashboard-card">
          <h3>💾 Storage Used</h3>
          <div className="stat-number">{formatFileSize(stats.storageUsed)}</div>
        </div>

        <div className="dashboard-card">
          <h3>👤 Account</h3>
          <div className="stat-number">{user?.role}</div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="dashboard-actions">
        <h2>Quick Actions</h2>
        <div className="actions-grid">
          <Link to="/upload" className="btn btn-primary">📤 Upload File</Link>
          <Link to="/files" className="btn btn-secondary">📋 View Files</Link>
          {user?.role === 'admin' && (
            <Link to="/admin" className="btn btn-admin">⚙️ Admin Panel</Link>
          )}
        </div>
      </section>

      {/* Recent Files */}
      <section className="recent-files">
        <h2>🕑 Recent Files</h2>
        {stats.recentFiles.length > 0 ? (
          <div className="file-list">
            {stats.recentFiles.map((file) => (
              <div key={file.id} className="file-item">
                <div className="file-info">
                  <h4>{file.original_name}</h4>
                  <p className="file-meta">
                    {formatDate(file.created_at)} • {formatFileSize(file.size)} • {file.mime_type}
                  </p>
                  {file.labels?.length > 0 && (
                    <div className="file-labels">
                      {file.labels.map((label) => (
                        <span key={label} className="label">{label}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p>No files uploaded yet. <Link to="/upload">Upload your first file!</Link></p>
        )}
      </section>
    </div>
  );
};

export default Dashboard;
