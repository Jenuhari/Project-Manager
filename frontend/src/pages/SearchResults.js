// src/pages/SearchResults.js
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getProjects, getAllTasks, getUsers } from "../services/projectService";

export default function SearchResults() {
  const location = useLocation();
  const navigate = useNavigate();

  // Read the search term from the URL: /search?q=something
  const params = new URLSearchParams(location.search);
  const searchTerm = (params.get("q") || params.get("query") || "").trim();

  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    // If nothing typed → clear everything
    if (!searchTerm) {
      setProjects([]);
      setTasks([]);
      setUsers([]);
      setError(null);
      return;
    }

    let mounted = true;

    (async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch all data in parallel
        const [pRes, tRes, uRes] = await Promise.allSettled([
          getProjects(),
          getAllTasks(),
          getUsers(),
        ]);

        const projList =
          pRes.status === "fulfilled" ? pRes.value.data || [] : [];
        const taskList =
          tRes.status === "fulfilled" ? tRes.value.data || [] : [];
        const userList =
          uRes.status === "fulfilled" ? uRes.value.data || [] : [];

        if (!mounted) return;

        const qLower = searchTerm.toLowerCase();

        // 1️⃣ Users that match text (username or email)
        const matchedUsers = userList.filter((u) =>
          ((u.username || "") + " " + (u.email || ""))
            .toLowerCase()
            .includes(qLower)
        );
        const matchedUserIds = new Set(matchedUsers.map((u) => u.id));

        // 2️⃣ Tasks that match text OR are assigned to a matched user
        const filteredTasks = taskList.filter((t) => {
          const text = (
            (t.title || "") +
            " " +
            (t.description || "") +
            " " +
            (t.status || "")
          ).toLowerCase();

          const textMatch = text.includes(qLower);
          const userMatch = t.assigned_to && matchedUserIds.has(t.assigned_to);

          return textMatch || userMatch;
        });

        // 3️⃣ Projects that match text OR have any of the filtered tasks
        const projectIdsFromTasks = new Set(
          filteredTasks
            .map((t) => t.project_id)
            .filter((id) => id != null)
        );

        const filteredProjects = projList.filter((p) => {
          const text = (
            (p.name || "") +
            " " +
            (p.description || "")
          ).toLowerCase();

          const textMatch = text.includes(qLower);
          const hasMatchingTask = projectIdsFromTasks.has(p.id);

          return textMatch || hasMatchingTask;
        });

        setProjects(filteredProjects);
        setTasks(filteredTasks);
        setUsers(matchedUsers);
      } catch (err) {
        if (!mounted) return;
        console.error("Search error:", err);
        setError("Search failed. Please try again.");
        setProjects([]);
        setTasks([]);
        setUsers([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [searchTerm]);

  return (
    <div className="container py-4">
      <div className="d-flex align-items-center mb-3">
        <h2 className="me-auto">
          {searchTerm ? `Search results for “${searchTerm}”` : "Search"}
        </h2>
        <button
          className="btn btn-outline-secondary"
          onClick={() => navigate(-1)}
        >
          Back
        </button>
      </div>

      {!searchTerm && (
        <div className="text-muted mb-3">
          Type something in the search box to see results.
        </div>
      )}

      {loading && <div>Searching…</div>}
      {error && (
        <div className="alert alert-warning mt-2" role="alert">
          {error}
        </div>
      )}

      {searchTerm && !loading && !error && (
        <>
          {/* PROJECTS */}
          <section className="mb-4">
            <h4>Projects ({projects.length})</h4>
            {projects.length === 0 ? (
              <div className="text-muted">No matching projects</div>
            ) : (
              <ul className="list-group mb-3">
                {projects.map((p) => (
                  <li
                    key={p.id}
                    className="list-group-item d-flex justify-content-between align-items-center"
                  >
                    <div>
                      <strong>{p.name}</strong>
                      {p.description && (
                        <div className="text-muted small">
                          {p.description}
                        </div>
                      )}
                    </div>
                    <button
                      className="btn btn-sm btn-outline-primary"
                      onClick={() => navigate(`/project/${p.id}`)}
                    >
                      Open
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* TASKS */}
          <section className="mb-4">
            <h4>Tasks ({tasks.length})</h4>
            {tasks.length === 0 ? (
              <div className="text-muted">No matching tasks</div>
            ) : (
              <ul className="list-group mb-3">
                {tasks.map((t) => (
                  <li
                    key={t.id}
                    className="list-group-item d-flex justify-content-between align-items-center"
                  >
                    <div>
                      <strong>{t.title}</strong>
                      <div className="text-muted small">
                        Status: {t.status}
                      </div>
                      {t.project_id && (
                        <div className="text-muted small">
                          Project ID: {t.project_id}
                        </div>
                      )}
                    </div>
                    {t.project_id && (
                      <button
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => navigate(`/project/${t.project_id}`)}
                      >
                        Open
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* USERS */}
          <section>
            <h4>Users ({users.length})</h4>
            {users.length === 0 ? (
              <div className="text-muted">No matching users</div>
            ) : (
              <ul className="list-group">
                {users.map((u) => (
                  <li key={u.id} className="list-group-item">
                    {u.username} — {u.email}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}
