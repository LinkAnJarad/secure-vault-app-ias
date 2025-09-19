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
      alert('User created successfully!');
    } catch (error) {
      alert('Failed to create user: ' + (error.response?.data?.errors || error.message));
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) {
      return;
    }

    try {
      await axios.delete(`/admin/users/${userId}`);
      setUsers(users.filter(u => u.id !== userId));
      alert('User deleted successfully!');
    } catch (error) {
      alert('Failed to delete user: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleBackup = async () => {
    try {
      setLoading(true);
      await axios.post('/admin/backup');
      alert('Backup completed successfully!');
    } catch (error) {
      alert('Backup failed: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
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

  return (
    <div className="admin-panel">
      <h1>Admin Panel</h1>
      
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

      {activeTab === 'users' && (
        <div className="users-tab">
          <h2>User Management</h2>
          
          <div className="create-user-form">
            <h3>Create New User</h3>
            <form onSubmit={handleCreateUser}>
              <div className="form-row">
                <input
                  type="text"
                  placeholder="Name"
                  value={newUser.name}
                  onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                  required
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                  required
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                  required
                />
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                >
                  <option value="user">User</option>
                  <option value="staff">Staff</option>
                  <option value="admin">Admin</option>
                </select>
                {newUser.role === 'staff' && (
                  <input
                    type="text"
                    placeholder="Department"
                    value={newUser.department}
                    onChange={(e) => setNewUser({...newUser, department: e.target.value})}
                    required
                  />
                )}
                <button type="submit" className="btn btn-primary">Create User</button>
              </div>
            </form>
          </div>

          {loading ? (
            <div className="loading">Loading users...</div>
          ) : (
            <div className="users-table">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
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
                      <td>{user.name}</td>
                      <td>{user.email}</td>
                      <td>
                        <span className={`badge badge-${user.role}`}>
                          {user.role}
                        </span>
                      </td>
                      <td>{user.department || '-'}</td>
                      <td>{formatDate(user.created_at)}</td>
                      <td>
                        <button 
                          onClick={() => handleDeleteUser(user.id)}
                          className="btn btn-danger btn-sm"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'audit' && (
        <div className="audit-tab">
          <h2>Audit Logs</h2>
          
          {loading ? (
            <div className="loading">Loading audit logs...</div>
          ) : (
            <div className="audit-log">
              <table>
                <thead>
                  <tr>
                    <th>Date/Time</th>
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
                      <td>{formatDate(log.created_at)}</td>
                      <td>{log.user?.name || 'System'}</td>
                      <td>
                        <span className={`badge ${getActionBadgeClass(log.action)}`}>
                          {log.action}
                        </span>
                      </td>
                      <td>{log.file?.original_name || '-'}</td>
                      <td>{log.ip_address}</td>
                      <td>
                        {log.details && (
                          <details>
                            <summary>View</summary>
                            <pre>{JSON.stringify(log.details, null, 2)}</pre>
                          </details>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'backup' && (
        <div className="backup-tab">
          <h2>Backup & Restore</h2>
          
          <div className="backup-section">
            <h3>Manual Backup</h3>
            <p>Create a backup of the database and files</p>
            <button 
              onClick={handleBackup}
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Creating Backup...' : 'Create Backup'}
            </button>
          </div>

          <div className="backup-info">
            <h3>Automatic Backups</h3>
            <p>✅ Automatic backups are scheduled daily at 2:00 AM UTC</p>
            <p>📁 Backups are stored in the /backups directory</p>
            <p>🗂️ Old backups are automatically cleaned up after 7 days</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;