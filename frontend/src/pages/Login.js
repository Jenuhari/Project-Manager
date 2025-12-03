import React, { useState, useContext, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login } from '../services/authService';
import { AuthContext } from '../context/AuthContext';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const [errors, setErrors] = useState({
    username: '',
    password: '',
  });

  // NEW: global login error (for invalid credentials)
  const [loginError, setLoginError] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [isShaking, setIsShaking] = useState(false);

  const usernameRef = useRef(null);
  const passwordRef = useRef(null);

  const navigate = useNavigate();
  const { setToken } = useContext(AuthContext);

  // ----------------------------
  // VALIDATION FUNCTIONS
  // ----------------------------
  const validateUsername = (value) => {
    if (!value.trim()) return 'Username is required';
    if (value.length < 3 || value.length > 20) return 'Username must be 3–20 characters';
    if (!/^[A-Za-z0-9]+$/.test(value)) return 'Username can contain only letters & numbers';
    return '';
  };

  const validatePassword = (value) => {
    if (!value.trim()) return 'Password is required';
    if (value.length < 8 || value.length > 12) return 'Password must be between 8–12 characters';
    if (!/^[A-Z]/.test(value)) return 'Password must start with a capital letter';
    if (!/^[A-Za-z0-9]+$/.test(value)) return 'Password must contain only letters & numbers';
    return '';
  };

  // ----------------------------
  // HANDLE SUBMIT
  // ----------------------------
  const handleSubmit = async (e) => {
    e.preventDefault();

    // clear old global error
    setLoginError('');

    const userError = validateUsername(username);
    const passError = validatePassword(password);

    setErrors({
      username: userError,
      password: passError,
    });

    // if any client-side error, shake + focus first invalid field
    if (userError || passError) {
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 400); // match CSS animation duration

      if (userError && usernameRef.current) {
        usernameRef.current.focus();
      } else if (passError && passwordRef.current) {
        passwordRef.current.focus();
      }
      return;
    }

    // valid → call API
    try {
      const response = await login({ username, password });
      const token = response.data.token;
      setToken(token);
      navigate('/dashboard');
    } catch (error) {
      // backend returns 401 for invalid credentials
      if (error.response && error.response.status === 401) {
        setLoginError('Invalid username or password');
      } else {
        setLoginError('Something went wrong. Please try again.');
      }

      // shake the form on failed login
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 400);
    }
  };

  // classes with green success state
  const usernameClass =
    'form-control ' +
    (errors.username
      ? 'is-invalid'
      : username && !errors.username
      ? 'is-valid'
      : '');

  const passwordClass =
    'form-control ' +
    (errors.password
      ? 'is-invalid'
      : password && !errors.password
      ? 'is-valid'
      : '');

  return (
    <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
      <form
        onSubmit={handleSubmit}
        className={`border p-5 rounded shadow bg-white ${isShaking ? 'shake' : ''}`}
        style={{ minWidth: '320px' }}
        noValidate
      >
        <h2 className="mb-4 text-center">Login</h2>

        {/* GLOBAL LOGIN ERROR (invalid credentials) */}
        {loginError && (
          <div className="alert alert-danger py-2 mb-3" style={{ fontSize: '0.9rem' }}>
            {loginError}
          </div>
        )}

        {/* USERNAME */}
        <div className="form-group mb-3">
          <label htmlFor="username">Username</label>
          <input
            id="username"
            ref={usernameRef}
            className={usernameClass}
            type="text"
            placeholder="Enter username"
            value={username}
            onChange={(e) => {
              const value = e.target.value;
              setUsername(value);
              setErrors((prev) => ({
                ...prev,
                username: validateUsername(value),
              }));
            }}
          />
          {errors.username && (
            <div className="text-danger mt-1" style={{ fontSize: '0.9rem' }}>
              {errors.username}
            </div>
          )}
        </div>

        {/* PASSWORD + SHOW/HIDE */}
        <div className="form-group mb-4">
          <label htmlFor="password">Password</label>
          <div className="input-group">
            <input
              id="password"
              ref={passwordRef}
              className={passwordClass}
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter password"
              value={password}
              onChange={(e) => {
                const value = e.target.value;
                setPassword(value);
                setErrors((prev) => ({
                  ...prev,
                  password: validatePassword(value),
                }));
              }}
            />
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={() => setShowPassword((prev) => !prev)}
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
          {errors.password && (
            <div className="text-danger mt-1" style={{ fontSize: '0.9rem' }}>
              {errors.password}
            </div>
          )}
        </div>

        <button type="submit" className="btn btn-primary w-100 mb-3">
          Login
        </button>

        <div className="text-center">
          <p>
            First time user? <Link to="/signup">Create an account</Link>
          </p>
          <p>
            <Link to="/forgot-password">Forgot Password?</Link>
          </p>
        </div>
      </form>
    </div>
  );
}

export default Login;
