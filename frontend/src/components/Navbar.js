import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { setAuthToken } from '../services/authService';

function Navbar() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  const handleLogout = () => {
    localStorage.removeItem('token');
    setAuthToken(null);
    navigate('/login');
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const trimmed = searchTerm.trim();
    if (!trimmed) return;
    // go to /search?q=term → SearchResults.js will read this
    navigate(`/search?q=${encodeURIComponent(trimmed)}`);
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-primary">
      <div className="container">
        <Link className="navbar-brand" to="/dashboard">
          Project Manager
        </Link>

        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="navbarNav">
          {/* LEFT SIDE LINKS */}
          <ul className="navbar-nav ms-auto align-items-center">
            <li className="nav-item">
              <Link className="nav-link" to="/dashboard">
                Dashboard
              </Link>
            </li>

            <li className="nav-item">
              <Link className="nav-link" to="/profile">
                Profile
              </Link>
            </li>

            {/* SEARCH FORM */}
            <li className="nav-item">
              <form
                className="d-flex ms-2"
                onSubmit={handleSearchSubmit}
                role="search"
              >
                <input
                  className="form-control form-control-sm me-2"
                  type="search"
                  placeholder="Search..."
                  aria-label="Search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <button
                  className="btn btn-sm btn-light"
                  type="submit"
                >
                  Search
                </button>
              </form>
            </li>

            {/* LOGOUT BUTTON */}
            <li className="nav-item">
              <button
                className="btn btn-link nav-link"
                onClick={handleLogout}
              >
                Logout
              </button>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
