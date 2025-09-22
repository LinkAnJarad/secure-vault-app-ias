import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import './Dashboard.css';

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
    return (
      <div className="dashboard">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <div className="welcome-section">
          <h1 className="welcome-title">Welcome back, {user?.name}</h1>
          <p className="welcome-subtitle">
            {user?.role} {user?.department && `• ${user.department}`}
          </p>
        </div>
      </header>

      {/* Key Stats */}
      <section className="stats-section">
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">📁</div>
            <div className="stat-content">
              <h3 className="stat-label">Total Files</h3>
              <div className="stat-value">{stats.totalFiles}</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">💾</div>
            <div className="stat-content">
              <h3 className="stat-label">Storage Used</h3>
              <div className="stat-value">{formatFileSize(stats.storageUsed)}</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">👤</div>
            <div className="stat-content">
              <h3 className="stat-label">Account Type</h3>
              <div className="stat-value">{user?.role}</div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="actions-section">
        <h2 className="section-title">Quick Actions</h2>
        <div className="actions-grid">
          <Link to="/upload" className="action-btn primary">
            <span className="action-icon">📤</span>
            Upload File
          </Link>
          <Link to="/files" className="action-btn secondary">
            <span className="action-icon">📋</span>
            View Files
          </Link>
          {user?.role === 'admin' && (
            <Link to="/admin" className="action-btn admin">
              <span className="action-icon">⚙️</span>
              Admin Panel
            </Link>
          )}
        </div>
      </section>

      {/* Recent Files */}
      <section className="files-section">
        <h2 className="section-title">Recent Files</h2>
        {stats.recentFiles.length > 0 ? (
          <div className="files-list">
            {stats.recentFiles.map((file) => (
              <div key={file.id} className="file-card">
                <div className="file-content">
                  <h4 className="file-name">{file.original_name}</h4>
                  <div className="file-meta">
                    <span className="file-date">{formatDate(file.created_at)}</span>
                    <span className="file-size">{formatFileSize(file.size)}</span>
                    <span className="file-type">{file.mime_type}</span>
                  </div>
                  {file.labels?.length > 0 && (
                    <div className="file-labels">
                      {file.labels.map((label) => (
                        <span key={label} className="file-label">{label}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p className="empty-message">No files uploaded yet.</p>
            <Link to="/upload" className="empty-action">Upload your first file</Link>
          </div>
        )}
      </section>
    </div>
  );
};

export default Dashboard;