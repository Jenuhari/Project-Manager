// src/pages/UsersPage.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getUsers } from "../services/projectService";

export default function UsersPage() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadUsers = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getUsers();
      setUsers(res.data || []);
    } catch (err) {
      console.error("Failed to load users:", err?.response || err);
      // Don’t show an alert here – just a nice message on the page
      setError(
        err?.response?.data?.error ||
          err?.response?.data?.message ||
          "Could not load users."
      );
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  return (
    <div className="container py-4">
      <div className="d-flex align-items-center mb-3">
        <h2 className="me-auto">All Users</h2>
        <div>
          <button
            className="btn btn-outline-secondary me-2"
            onClick={() => navigate(-1)}
          >
            Back
          </button>
          <button
            className="btn btn-outline-primary"
            onClick={loadUsers}
          >
            Refresh
          </button>
        </div>
      </div>

      {loading && <div className="mb-3 text-muted">Loading users…</div>}

      {error && !loading && (
        <div className="alert alert-warning mb-3">
          {error}
        </div>
      )}

      <ul className="list-group shadow-sm">
        {(!loading && users.length === 0 && !error) && (
          <li className="list-group-item">
            No users found.
          </li>
        )}

        {users.map((u) => (
          <li
            key={u.id}
            className="list-group-item d-flex justify-content-between align-items-start"
          >
            <div>
              <div>
                <strong>{u.username}</strong>{" "}
                <span className="text-muted">({u.role || "user"})</span>
              </div>
              <div className="text-muted small">
                Email: {u.email || "—"}
              </div>
              <div className="text-muted small">
                Gender: {u.gender || "—"}
              </div>
              <div className="text-muted small">
                Hobbies: {u.hobbies || "—"}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
