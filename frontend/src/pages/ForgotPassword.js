import React, { useState } from 'react';
import { forgotPassword } from '../services/authService';

function ForgotPassword() {
  const [email, setEmail] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await forgotPassword(email);
      alert('Password reset email sent. Check your inbox.');
    } catch (error) {
      alert('Error sending email. Please try again.');
    }
  };

  return (
    <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
      <form onSubmit={handleSubmit} className="border p-5 rounded shadow" style={{ minWidth: '300px', backgroundColor: '#fff' }}>
        <h2 className="mb-4 text-center">Forgot Password</h2>
        <div className="form-group mb-3">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            className="form-control"
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required 
          />
        </div>
        <button type="submit" className="btn btn-primary w-100">Send Reset Email</button>
      </form>
    </div>
  );
}

export default ForgotPassword;