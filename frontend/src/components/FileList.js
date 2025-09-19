import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

axios.defaults.baseURL = 'https://localhost/api';


const FileList = () => {
  const { user } = useAuth();
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState({});
  const [shareUserId, setShareUserId] = useState('');
  const [users, setUsers] = useState([]);
  const [sharingFile, setSharingFile] = useState(null);

  useEffect(() => {
    fetchFiles();
    if (user?.role !== 'user') {
      fetchUsers();
    }
  }, [search]);

  const fetchFiles = async (page = 1) => {
    try {
      setLoading(true);
      const params = { page };
      if (search) params.search = search;
      
      const response = await axios.get('/files', { params });
      setFiles(response.data.data);
      setPagination({
        current_page: response.data.current_page,
        last_page: response.data.last_page,
        total: response.data.total
      });
    } catch (error) {
      console.error('Failed to fetch files:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await axios.get('/users-for-sharing');
      setUsers(response.data.data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  const handleDownload = async (file) => {
    try {
      const response = await axios.get(`/files/${file.id}/download`, {
        responseType: 'blob'
      });
      
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.original_name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      alert('Failed to download file: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleDelete = async (file) => {
    if (!window.confirm(`Are you sure you want to delete "${file.original_name}"?`)) {
      return;
    }

    try {
      await axios.delete(`/files/${file.id}`);
      setFiles(files.filter(f => f.id !== file.id));
    } catch (error) {
      alert('Failed to delete file: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleShare = async (file) => {
    if (!shareUserId) {
      alert('Please select a user to share with');
      return;
    }

    try {
      await axios.post(`/files/${file.id}/share`, {
        user_ids: [parseInt(shareUserId)]
      });
      alert('File shared successfully!');
      setSharingFile(null);
      setShareUserId('');
    } catch (error) {
      alert('Failed to share file: ' + (error.response?.data?.error || error.message));
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

  const canDelete = (file) => {
    return user?.role === 'admin' || file.owner_id === user?.id;
  };

  const canShare = (file) => {
    return user?.role === 'admin' || file.owner_id === user?.id || 
           (user?.role === 'staff' && file.department === user?.department);
  };

  if (loading) {
    return <div className="loading">Loading files...</div>;
  }

  return (
    <div className="file-list-container">
      <h2>Files</h2>
      
      <div className="search-box">
        <input
          type="text"
          placeholder="Search files by name, uploader, labels, or content..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {files.length > 0 ? (
        <>
          <div className="file-list">
            {files.map(file => (
              <div key={file.id} className="file-item">
                <div className="file-info">
                  <h4>{file.original_name}</h4>
                  <p>
                    Owner: {file.owner?.name} | 
                    Uploaded: {formatDate(file.created_at)} | 
                    Size: {formatFileSize(file.size)}
                  </p>
                  {file.labels && file.labels.length > 0 && (
                    <div className="file-labels">
                      {file.labels.map(label => (
                        <span key={label} className="label">{label}</span>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="file-actions">
                  <button 
                    onClick={() => handleDownload(file)}
                    className="btn btn-primary"
                  >
                    Download
                  </button>
                  
                  {canShare(file) && (
                    <button 
                      onClick={() => setSharingFile(file)}
                      className="btn btn-secondary"
                    >
                      Share
                    </button>
                  )}
                  
                  {canDelete(file) && (
                    <button 
                      onClick={() => handleDelete(file)}
                      className="btn btn-danger"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {pagination.last_page > 1 && (
            <div className="pagination">
              {Array.from({ length: pagination.last_page }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => fetchFiles(page)}
                  className={`page-btn ${page === pagination.current_page ? 'active' : ''}`}
                >
                  {page}
                </button>
              ))}
            </div>
          )}
        </>
      ) : (
        <p>No files found. {!search && <span>Upload some files to get started!</span>}</p>
      )}

      {/* Share Modal */}
      {sharingFile && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Share "{sharingFile.original_name}"</h3>
            <div className="form-group">
              <label>Select User:</label>
              <select 
                value={shareUserId} 
                onChange={(e) => setShareUserId(e.target.value)}
              >
                <option value="">Choose a user...</option>
                {users.filter(u => u.id !== user?.id).map(u => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.email}) - {u.role}
                  </option>
                ))}
              </select>
            </div>
            <div className="modal-actions">
              <button 
                onClick={() => handleShare(sharingFile)}
                className="btn btn-primary"
                disabled={!shareUserId}
              >
                Share
              </button>
              <button 
                onClick={() => setSharingFile(null)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileList;