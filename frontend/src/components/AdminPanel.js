import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role: 'user',
    department: ''
  });

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    } else if (activeTab === 'audit') {
      fetchAuditLogs();
    }
  }, [activeTab]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/admin/users');
      setUsers(response.data.data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/admin/audit-logs');
      setAuditLogs(response.data.data);
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/admin/users', newUser);
      setNewUser({ name: '', email: '', password: '', role: 'user', department: '' });
      fetchUsers();
      showNotification('User created successfully!', 'success');
    } catch (error) {
      showNotification('Failed to create user: ' + (error.response?.data?.errors || error.message), 'error');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      await axios.delete(`/admin/users/${userId}`);
      setUsers(users.filter(u => u.id !== userId));
      showNotification('User deleted successfully!', 'success');
    } catch (error) {
      showNotification('Failed to delete user: ' + (error.response?.data?.error || error.message), 'error');
    }
  };

  const handleBackup = async () => {
    try {
      setLoading(true);
      await axios.post('/admin/backup');
      showNotification('Backup completed successfully!', 'success');
    } catch (error) {
      showNotification('Backup failed: ' + (error.response?.data?.error || error.message), 'error');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (message, type) => {
    // You can implement a toast notification system here
    // For now, using alert as fallback
    alert(message);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getActionBadgeClass = (action) => {
    const actionClasses = {
      'login': 'badge-success',
      'logout': 'badge-info',
      'upload': 'badge-primary',
      'download': 'badge-secondary',
      'delete': 'badge-danger',
      'share': 'badge-warning',
      'login_failed': 'badge-danger'
    };
    return actionClasses[action] || 'badge-default';
  };

  const getActionIcon = (action) => {
    const actionIcons = {
      'login': '🔐',
      'logout': '🚪',
      'upload': '📤',
      'download': '📥',
      'delete': '🗑️',
      'share': '🔗',
      'login_failed': '❌'
    };
    return actionIcons[action] || '📋';
  };

  const getRoleIcon = (role) => {
    const roleIcons = {
      'admin': '👑',
      'staff': '👔',
      'user': '👤'
    };
    return roleIcons[role] || '👤';
  };

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <h1>⚙️ Admin Panel</h1>
        <p>Manage users, monitor activity, and maintain system backups</p>
      </div>
      
      <div className="admin-tabs">
        <button 
          className={`admin-tab ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          👥 Users
        </button>
        <button 
          className={`admin-tab ${activeTab === 'audit' ? 'active' : ''}`}
          onClick={() => setActiveTab('audit')}
        >
          📋 Audit Logs
        </button>
        <button 
          className={`admin-tab ${activeTab === 'backup' ? 'active' : ''}`}
          onClick={() => setActiveTab('backup')}
        >
          💾 Backup
        </button>
      </div>

      <div className="admin-content">
        {activeTab === 'users' && (
          <div className="users-tab">
            <div className="section-header">
              <h2>👥 User Management</h2>
              <p>Create, manage, and monitor user accounts</p>
            </div>
            
            <div className="create-user-form">
              <div className="form-header">
                <h3>➕ Create New User</h3>
                <p>Add a new user to the system with appropriate permissions</p>
              </div>
              <form onSubmit={handleCreateUser}>
                <div className="form-row">
                  <div className="form-group">
                    <label>Full Name</label>
                    <input
                      type="text"
                      placeholder="Enter full name"
                      value={newUser.name}
                      onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Email Address</label>
                    <input
                      type="email"
                      placeholder="Enter email address"
                      value={newUser.email}
                      onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Password</label>
                    <input
                      type="password"
                      placeholder="Enter password"
                      value={newUser.password}
                      onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Role</label>
                    <select
                      value={newUser.role}
                      onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                    >
                      <option value="user">👤 User</option>
                      <option value="staff">👔 Staff</option>
                      <option value="admin">👑 Admin</option>
                    </select>
                  </div>
                  {newUser.role === 'staff' && (
                    <div className="form-group">
                      <label>Department</label>
                      <input
                        type="text"
                        placeholder="Enter department"
                        value={newUser.department}
                        onChange={(e) => setNewUser({...newUser, department: e.target.value})}
                        required
                      />
                    </div>
                  )}
                  <div className="form-group form-actions">
                    <button type="submit" className="btn btn-primary">
                      ➕ Create User
                    </button>
                  </div>
                </div>
              </form>
            </div>

            {loading ? (
              <div className="loading">
                <div className="loading-spinner"></div>
                <p>Loading users...</p>
              </div>
            ) : (
              <div className="users-table">
                <div className="table-header">
                  <h3>👥 All Users ({users.length})</h3>
                </div>
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>User</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Department</th>
                        <th>Created</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map(user => (
                        <tr key={user.id}>
                          <td>
                            <div className="user-info">
                              <span className="user-icon">{getRoleIcon(user.role)}</span>
                              <span className="user-name">{user.name}</span>
                            </div>
                          </td>
                          <td className="user-email">{user.email}</td>
                          <td>
                            <span className={`badge badge-${user.role}`}>
                              {user.role}
                            </span>
                          </td>
                          <td>{user.department || '-'}</td>
                          <td className="date-cell">{formatDate(user.created_at)}</td>
                          <td>
                            <button 
                              onClick={() => handleDeleteUser(user.id)}
                              className="btn btn-danger btn-sm"
                              title="Delete user"
                            >
                              🗑️ Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'audit' && (
          <div className="audit-tab">
            <div className="section-header">
              <h2>📋 Audit Logs</h2>
              <p>Monitor system activity and user actions</p>
            </div>
            
            {loading ? (
              <div className="loading">
                <div className="loading-spinner"></div>
                <p>Loading audit logs...</p>
              </div>
            ) : (
              <div className="audit-log">
                <div className="table-header">
                  <h3>📊 Activity Log ({auditLogs.length} entries)</h3>
                </div>
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Timestamp</th>
                        <th>User</th>
                        <th>Action</th>
                        <th>File</th>
                        <th>IP Address</th>
                        <th>Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {auditLogs.map(log => (
                        <tr key={log.id}>
                          <td className="date-cell">{formatDate(log.created_at)}</td>
                          <td className="user-cell">
                            {log.user?.name || 'System'}
                          </td>
                          <td>
                            <span className={`badge ${getActionBadgeClass(log.action)}`}>
                              {getActionIcon(log.action)} {log.action}
                            </span>
                          </td>
                          <td className="file-cell">
                            {log.file?.original_name || '-'}
                          </td>
                          <td className="ip-cell">{log.ip_address}</td>
                          <td>
                            {log.details && (
                              <details className="log-details">
                                <summary>View Details</summary>
                                <pre>{JSON.stringify(log.details, null, 2)}</pre>
                              </details>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'backup' && (
          <div className="backup-tab">
            <div className="section-header">
              <h2>💾 Backup & Restore</h2>
              <p>Manage system backups and data recovery</p>
            </div>
            
            <div className="backup-section">
              <div className="backup-card">
                <div className="backup-icon">🔄</div>
                <div className="backup-content">
                  <h3>Manual Backup</h3>
                  <p>Create an immediate backup of the database and files</p>
                  <button 
                    onClick={handleBackup}
                    className="btn btn-primary"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="loading-spinner small"></span>
                        Creating Backup...
                      </>
                    ) : (
                      <>💾 Create Backup</>
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="backup-info">
              <h3>⚙️ Backup Configuration</h3>
              <div className="backup-status">
                <div className="status-item">
                  <span className="status-icon">✅</span>
                  <div className="status-content">
                    <strong>Automatic Backups</strong>
                    <p>Scheduled daily at 2:00 AM UTC</p>
                  </div>
                </div>
                <div className="status-item">
                  <span className="status-icon">📁</span>
                  <div className="status-content">
                    <strong>Storage Location</strong>
                    <p>Backups are stored in the /backups directory</p>
                  </div>
                </div>
                <div className="status-item">
                  <span className="status-icon">🗂️</span>
                  <div className="status-content">
                    <strong>Retention Policy</strong>
                    <p>Old backups are automatically cleaned up after 7 days</p>
                  </div>
                </div>
                <div className="status-item">
                  <span className="status-icon">🔒</span>
                  <div className="status-content">
                    <strong>Encryption</strong>
                    <p>All backups are encrypted using AES-256</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;