// src/pages/Signup.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signup } from '../services/authService';

const HOBBY_OPTIONS = [
  'Watching movies or web series',
  'Playing or listening to musical instruments',
  'Playing outdoor sports (like cricket, football, volleyball)',
  'Reading books or magazines',
  'Dancing or singing',
];

function Signup() {
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    gender: '',
    hobbies: [], // array of selected hobbies
  });
  const [file, setFile] = useState(null);
  const [fileError, setFileError] = useState('');
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  // ---------- validation helpers ----------
  const validatePassword = (pw) => {
    if (!pw) return 'Password is required';

    if (pw.length < 8 || pw.length > 12) {
      return 'Password must be 8–12 characters long';
    }

    if (!/^[A-Z]/.test(pw)) {
      return 'Password must start with a capital letter';
    }

    if (!/^[A-Za-z0-9]+$/.test(pw)) {
      return 'Password can contain only letters and numbers';
    }

    return '';
  };

  const getFieldError = (name, value, currentForm) => {
    switch (name) {
      case 'username':
        if (!value) return 'Username is required';
        if (value.length < 3) return 'Username must be at least 3 characters';
        return '';
      case 'email':
        if (!value) return 'Email is required';
        // very simple email check
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          return 'Enter a valid email address';
        }
        return '';
      case 'password':
        return validatePassword(value);
      case 'gender':
        if (!value) return 'Please select your gender';
        return '';
      case 'hobbies': {
        const arr = currentForm.hobbies || [];
        if (arr.length === 0) return 'Please select at least one hobby';
        return '';
      }
      default:
        return '';
    }
  };

  // ---------- handlers ----------
  const handleChange = (e) => {
    const { name, value } = e.target;
    const updatedForm = { ...form, [name]: value };
    setForm(updatedForm);
    setErrors((prev) => ({
      ...prev,
      [name]: getFieldError(name, value, updatedForm),
    }));
  };

  const handleHobbyChange = (e) => {
    const { value, checked } = e.target;
    let updatedHobbies;

    if (checked) {
      updatedHobbies = [...form.hobbies, value];
    } else {
      updatedHobbies = form.hobbies.filter((h) => h !== value);
    }

    const updatedForm = { ...form, hobbies: updatedHobbies };
    setForm(updatedForm);
    setErrors((prev) => ({
      ...prev,
      hobbies: getFieldError('hobbies', updatedHobbies, updatedForm),
    }));
  };

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (!selected) {
      setFile(null);
      setFileError('');
      return;
    }

    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'application/pdf',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv',
    ];

    if (!allowedTypes.includes(selected.type)) {
      setFile(null);
      setFileError(
        'Only JPG, PNG, PDF, Excel (.xls, .xlsx) and CSV files are allowed.'
      );
      return;
    }

    const minSizeBytes = 1 * 1024 * 1024; // 1 MB
    if (selected.size < minSizeBytes) {
      setFile(null);
      setFileError('File must be at least 1 MB in size.');
      return;
    }

    setFile(selected);
    setFileError('');
  };

  const validateForm = () => {
    const newErrors = {
      username: getFieldError('username', form.username, form),
      email: getFieldError('email', form.email, form),
      password: getFieldError('password', form.password, form),
      gender: getFieldError('gender', form.gender, form),
      hobbies: getFieldError('hobbies', form.hobbies, form),
    };

    setErrors(newErrors);

    const hasFieldErrors = Object.values(newErrors).some((msg) => msg);
    const hasFileError = !!fileError;
    return !hasFieldErrors && !hasFileError;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      // do not submit if there are validation errors
      return;
    }

    const formData = new FormData();
    formData.append('username', form.username);
    formData.append('email', form.email);
    formData.append('password', form.password);
    formData.append('gender', form.gender);
    // send hobbies as comma-separated string
    formData.append('hobbies', form.hobbies.join(','));
    if (file) {
      formData.append('document', file);
    }

    try {
      await signup(formData);
      alert('Signup successful, please login');
      navigate('/login');
    } catch (error) {
      const msg =
        error.response?.data?.message ||
        error.response?.data?.error ||
        'Unknown error';
      alert('Failed to signup: ' + msg);
      console.error(error);
    }
  };

  // ---------- render ----------
  return (
    <div className="container mt-5" style={{ maxWidth: 600 }}>
      <h2 className="mb-4 text-center">Signup</h2>
      <form onSubmit={handleSubmit} encType="multipart/form-data">
        {/* Username */}
        <div className="mb-3">
          <label className="form-label">Username</label>
          <input
            name="username"
            placeholder="Enter username"
            value={form.username}
            onChange={handleChange}
            className={`form-control ${errors.username ? 'is-invalid' : ''}`}
            required
          />
          {errors.username && (
            <div className="invalid-feedback">{errors.username}</div>
          )}
        </div>

        {/* Email */}
        <div className="mb-3">
          <label className="form-label">Email address</label>
          <input
            name="email"
            type="email"
            placeholder="Enter email"
            value={form.email}
            onChange={handleChange}
            className={`form-control ${errors.email ? 'is-invalid' : ''}`}
            required
          />
          {errors.email && (
            <div className="invalid-feedback">{errors.email}</div>
          )}
        </div>

        {/* Password */}
        <div className="mb-3">
          <label className="form-label">Password</label>
          <input
            name="password"
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            className={`form-control ${errors.password ? 'is-invalid' : ''}`}
            required
          />
          {errors.password && (
            <div className="invalid-feedback">{errors.password}</div>
          )}
          <small className="text-muted">
            Must start with a capital letter, be 8–12 characters long, and
            contain only letters and numbers.
          </small>
        </div>

        {/* Gender dropdown */}
        <div className="mb-3">
          <label className="form-label">Gender</label>
          <select
            name="gender"
            value={form.gender}
            onChange={handleChange}
            className={`form-select ${errors.gender ? 'is-invalid' : ''}`}
            required
          >
            <option value="">Select gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
          {errors.gender && (
            <div className="invalid-feedback">{errors.gender}</div>
          )}
        </div>

        {/* Hobbies checkboxes */}
        <div className="mb-3">
          <label className="form-label">Hobbies</label>
          <div className="form-check">
            {HOBBY_OPTIONS.map((hobby) => (
              <div key={hobby} className="mb-1">
                <input
                  type="checkbox"
                  className="form-check-input"
                  id={hobby}
                  value={hobby}
                  checked={form.hobbies.includes(hobby)}
                  onChange={handleHobbyChange}
                />
                <label className="form-check-label" htmlFor={hobby}>
                  {hobby}
                </label>
              </div>
            ))}
          </div>
          {errors.hobbies && (
            <div className="text-danger" style={{ fontSize: '0.9rem' }}>
              {errors.hobbies}
            </div>
          )}
        </div>

        {/* File upload */}
        <div className="mb-3">
          <label className="form-label">Upload file (min 1 MB)</label>
          <input
            type="file"
            className={`form-control ${fileError ? 'is-invalid' : ''}`}
            onChange={handleFileChange}
            accept=".jpg,.jpeg,.png,.pdf,.xls,.xlsx,.csv"
          />
          {fileError && (
            <div className="invalid-feedback d-block">{fileError}</div>
          )}
        </div>

        <button type="submit" className="btn btn-primary w-100 mt-2">
          Signup
        </button>
      </form>
    </div>
  );
}

export default Signup;
