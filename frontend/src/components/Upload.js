import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Upload = () => {
  const [uploading, setUploading] = useState(false);
  const [labels, setLabels] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const onDrop = async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setUploading(true);
    setMessage('');

    const formData = new FormData();
    formData.append('file', file);
    
    if (labels.trim()) {
      const labelArray = labels.split(',').map(label => label.trim());
      labelArray.forEach(label => formData.append('labels[]', label));
    }

    try {
      await axios.post('/files', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      setMessage('File uploaded successfully!');
      setLabels('');
      setTimeout(() => navigate('/files'), 2000);
    } catch (error) {
      setMessage(error.response?.data?.error || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/msword': ['.doc'],
      'text/plain': ['.txt'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    },
    maxSize: 10485760, // 10MB
    multiple: false
  });

  return (
    <div className="upload-container">
      <h2>Upload File</h2>
      
      <div className="form-group">
        <label>Labels (comma-separated):</label>
        <input
          type="text"
          value={labels}
          onChange={(e) => setLabels(e.target.value)}
          placeholder="e.g. document, important, project-x"
        />
      </div>

      <div
        {...getRootProps()}
        className={`dropzone ${isDragActive ? 'active' : ''} ${uploading ? 'uploading' : ''}`}
      >
        <input {...getInputProps()} />
        {uploading ? (
          <p>Uploading and encrypting file...</p>
        ) : isDragActive ? (
          <p>Drop the file here...</p>
        ) : (
          <div>
            <p>Drag & drop a file here, or click to select</p>
            <small>Supported: PDF, DOCX, DOC, TXT, JPG, PNG, XLS, XLSX (max 10MB)</small>
          </div>
        )}
      </div>

      {message && (
        <div className={`message ${message.includes('successfully') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}
    </div>
  );
};

export default Upload;