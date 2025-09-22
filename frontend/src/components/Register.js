import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
    role: 'user',
    department: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // Clear error for this field when user starts typing
    if (errors[e.target.name]) {
      setErrors({
        ...errors,
        [e.target.name]: null
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    const dataToSubmit = { ...formData };
    if (dataToSubmit.role !== 'staff') {
      delete dataToSubmit.department; // don’t send it unless staff
    }

    const result = await register(dataToSubmit);
    
    if (result.success) {
      navigate('/dashboard');
    } else {
      setErrors(result.error);
    }
    
    setLoading(false);
  };



  return (
    <div className="auth-container">
      <div className="auth-form">
        <h2>Secure File Sharing - Register</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Name:</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
            {errors.name && <div className="error-message">{errors.name[0]}</div>}
          </div>
          
          <div className="form-group">
            <label>Email:</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
            {errors.email && <div className="error-message">{errors.email[0]}</div>}
          </div>
          
          <div className="form-group">
            <label>Role:</label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
            >
              <option value="user">User</option>
              <option value="staff">Staff</option>
              <option value="admin">Admin</option>
            </select>
            {errors.role && <div className="error-message">{errors.role[0]}</div>}
          </div>
          
          {formData.role === 'staff' && (
            <div className="form-group">
              <label>Department:</label>
              <input
                type="text"
                name="department"
                value={formData.department}
                onChange={handleChange}
                placeholder="e.g. IT, HR, Finance"
                required
              />
              {errors.department && <div className="error-message">{errors.department[0]}</div>}
            </div>
          )}
          
          <div className="form-group">
            <label>Password:</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
            />
            {errors.password && <div className="error-message">{errors.password[0]}</div>}
            <small>Password must be at least 8 characters with uppercase, lowercase, numbers, and symbols.</small>
          </div>
          
          <div className="form-group">
            <label>Confirm Password:</label>
            <input
              type="password"
              name="password_confirmation"
              value={formData.password_confirmation}
              onChange={handleChange}
              required
            />
          </div>
          
          <button type="submit" disabled={loading}>
            {loading ? 'Creating Account...' : 'Register'}
          </button>
        </form>
        
        <p>
          Already have an account? <Link to="/login">Login here</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;