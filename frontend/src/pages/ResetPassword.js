import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { resetPassword } from '../services/authService';

function ResetPassword() {
  const [newPassword, setNewPassword] = useState('');
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      alert('Invalid reset link');
      navigate('/login');
    }
  }, [token, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await resetPassword(token, newPassword);
      alert('Password reset successful. Please log in.');
      navigate('/login');
    } catch (error) {
      alert('Error resetting password. The link may have expired.');
    }
  };

  return (
    <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
      <form onSubmit={handleSubmit} className="border p-5 rounded shadow" style={{ minWidth: '300px', backgroundColor: '#fff' }}>
        <h2 className="mb-4 text-center">Reset Password</h2>
        <div className="form-group mb-3">
          <label htmlFor="newPassword">New Password</label>
          <input
            id="newPassword"
            className="form-control"
            type="password"
            placeholder="Enter new password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required 
          />
        </div>
        <button type="submit" className="btn btn-primary w-100">Reset Password</button>
      </form>
    </div>
  );
}

export default ResetPassword;