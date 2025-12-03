// src/pages/Dashboard.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/SideBar";
import {
  getProjects,
  getTasks,
  getUsers,
  getGlobalLogs,
  createProject,
} from "../services/projectService";
import { setAuthToken, logout } from "../services/authService";
import "../components/SideBar.css"; 


export default function DashboardPage() {
  const [projects, setProjects] = useState([]);
  const [newProjectName, setNewProjectName] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState("projects");
  const [tabData, setTabData] = useState({ projects: [], tasks: [], users: [], logs: [] });

  // NEW: recent logs for dashboard view
  const [recentLogs, setRecentLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);

  // Sidebar state
  const [collapsed, setCollapsed] = useState(true);
  const [activeSidebar, setActiveSidebar] = useState("dashboard");

  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      setAuthToken(token);
      fetchProjects();
      fetchRecentLogs();   // ⬅️ also load activity logs for dashboard
    } else {
      navigate("/login");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  const fetchProjects = async () => {
    try {
      const res = await getProjects();
      setProjects(res.data || []);
    } catch (err) {
      console.error("Failed to load projects", err);
      alert("Failed to load projects");
    }
  };

  // ⬇️ helper to format date like in ActivityLogs
  const fmtDate = (raw) => {
    if (!raw) return "Invalid Date";
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) return "Invalid Date";
    const z = (n) => (n < 10 ? "0" + n : n);
    return `${z(d.getDate())}/${z(d.getMonth() + 1)}/${d.getFullYear()}, ${z(
      d.getHours()
    )}:${z(d.getMinutes())}:${z(d.getSeconds())}`;
  };

  // ⬇️ new function to fetch a few recent logs for dashboard
  const fetchRecentLogs = async () => {
    setLogsLoading(true);
    try {
      const res = await getGlobalLogs({ limit: 10 }); 
      console.log('[Dashboard] raw logs:', res.data);
      const arr = (res && res.data) ? res.data : [];
      const normalized = arr.map((r, idx) => ({
        id: r.id ?? idx,
        user: r.user ?? r.username ?? "Unknown",
        action: r.action ?? r.message ?? "—",
        created_at: r.created_at ?? r.time ?? r.timestamp ?? r.createdAt ?? null,
      }));
      setRecentLogs(normalized);
    } catch (err) {
      console.error("Failed to load recent logs for dashboard:", err);
      setRecentLogs([]);
    } finally {
      setLogsLoading(false);
    }
  };

  const handleAddProject = async () => {
    if (!newProjectName.trim()) return;
    try {
      await createProject({ name: newProjectName.trim() });
      setNewProjectName("");
      await fetchProjects();
      if (showModal && activeTab === "projects") fetchTabData("projects");
    } catch (err) {
      console.error("Failed to add project", err);
      alert("Failed to add project");
    }
  };

  const handleLogout = async () => {
  try {
    await logout(); // calls backend, creates "Logged out" log
  } catch (err) {
    console.error("Logout API failed:", err?.response?.data || err.message);
    // Even if API fails, still clear token on frontend
  }

  localStorage.removeItem("token");
  setAuthToken(null);
  navigate("/login");
};


  // Sidebar + overview handlers (unchanged)
  const handleSidebarNavigate = (key) => {
    console.log('[Sidebar] clicked key:', key);
    setActiveSidebar(key);

    if (key === 'logout') {
      handleLogout();
      return;
    }

    const logsKeys = ['logs', 'activity', 'activity-logs', 'global-logs'];
    const tabKeys = ['projects', 'tasks', 'users'];

    if (logsKeys.includes(key)) {
      openOverviewOnTab('logs');
      return;
    }

    if (tabKeys.includes(key)) {
      openOverviewOnTab(key);
      return;
    }

    if (key === 'profile') {
      navigate('/profile'); return;
    }
    if (key === 'dashboard') {
      window.scrollTo({ top: 0, behavior: 'smooth' }); return;
    }
    if (key === 'projects-route') {
      navigate('/dashboard'); return;
    }

    console.warn('[Sidebar] unknown key:', key);
  };

  const openOverviewOnTab = async (tabKey) => {
    console.log('[Overview] open requested for tab:', tabKey);
    setActiveTab(tabKey);
    setShowModal(true);
    setTimeout(() => {
      fetchTabData(tabKey);
    }, 50);
  };

  const fetchTabData = async (tab) => {
    console.log('[fetchTabData] tab=', tab);
    try {
      let data = [];
      if (tab === 'projects') {
        const res = await getProjects();
        console.log('[fetchTabData] projects res', res);
        data = res.data || [];
      } else if (tab === 'tasks') {
        const all = [];
        for (const p of projects) {
          try {
            const r = await getTasks(p.id);
            all.push(...(r.data || []));
          } catch (err) {
            console.warn('task fetch fail for project', p.id, err?.response?.data ?? err?.message ?? err);
          }
        }
        data = all;
      } else if (tab === 'users') {
        const res = await getUsers();
        console.log('[fetchTabData] users res', res);
        data = res.data || [];
      } else if (tab === 'logs') {
        try {
          const res = await getGlobalLogs();
          console.log('[fetchTabData] global-logs res', res);
          data = res.data || [];
        } catch (err) {
          console.error('[fetchTabData] failed to get global logs:', err?.response?.data ?? err?.message ?? err);
          const serverMsg = err?.response?.data?.error || err?.response?.statusText || err?.message;
          alert(`Failed to load logs: ${serverMsg}`);
          data = [];
        }
      }
      setTabData((prev) => ({ ...prev, [tab]: data }));
      console.log('[fetchTabData] setTabData for', tab, data);
    } catch (err) {
      console.error('[fetchTabData] unexpected error', err);
      alert(`Failed to load ${tab}`);
    }
  };

  return (
    <div className="app-shell">
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((c) => !c)}
        active={activeSidebar}
        onNavigate={handleSidebarNavigate}
      />

      <main
        className="app-content"
        style={{ marginLeft: collapsed ? 72 : 260, transition: "margin-left 260ms ease" }}
      >
        <div className="container-fluid p-4">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h2>Dashboard</h2>
            <div>
              <button className="btn btn-secondary me-2" onClick={handleLogout}>
                Logout
              </button>
              <button
                className="btn btn-outline-primary"
                onClick={() => openOverviewOnTab("projects")}
              >
                Overview
              </button>
            </div>
          </div>

          {/* PROJECTS SECTION */}
          <section aria-labelledby="projects-heading" className="mb-4">
            <h3 id="projects-heading">Your Projects ({projects.length})</h3>
            <div className="row g-3">
              {projects.length === 0 && <div className="col-12">No projects found.</div>}
              {projects.map((project) => (
                <div key={project.id} className="col-sm-12 col-md-6 col-lg-4">
                  <div className="card h-100">
                    <div className="card-body d-flex flex-column">
                      <h5 className="card-title">{project.name}</h5>
                      <p className="card-text text-muted">{project.description}</p>
                      <div className="mt-auto d-flex justify-content-between">
                        <button
                          onClick={() => navigate(`/project/${project.id}`)}
                          className="btn btn-primary btn-sm"
                        >
                          Open
                        </button>
                        <small className="text-muted">
                          Owner: {project.owner_id || project.user_id || "You"}
                        </small>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* CREATE PROJECT */}
          <div className="mb-4">
            <label htmlFor="newProject" className="form-label">
              Create new project
            </label>
            <div className="d-flex gap-2">
              <input
                id="newProject"
                className="form-control"
                placeholder="Project name"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
              />
              <button className="btn btn-success" onClick={handleAddProject}>
                Add
              </button>
            </div>
          </div>

          {/* 🔵 NEW: RECENT ACTIVITY LOGS ON DASHBOARD */}
          <section className="mb-4">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <h4>Recent Activity Logs</h4>
              <button
                className="btn btn-sm btn-outline-primary"
                onClick={fetchRecentLogs}
              >
                {logsLoading ? "Refreshing..." : "Refresh"}
              </button>
            </div>

            <ul className="list-group shadow-sm" style={{ maxHeight: "260px", overflowY: "auto" }}>
              {recentLogs.length === 0 && !logsLoading && (
                <li className="list-group-item">No logs found or no permission.</li>
              )}
              {recentLogs.map((log) => (
                <li key={log.id} className="list-group-item">
                  <strong>{log.user}</strong> — {log.action} — {fmtDate(log.created_at)}
                </li>
              ))}
            </ul>
          </section>

          {/* Overview Modal (unchanged) */}
          {showModal && (
            <div
              className="modal show d-block"
              role="dialog"
              aria-modal="true"
              style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
            >
              <div className="modal-dialog modal-lg">
                <div className="modal-content">
                  <div className="modal-header">
                    <h5 className="modal-title">Overview</h5>
                    <button
                      type="button"
                      className="btn-close"
                      onClick={() => setShowModal(false)}
                      aria-label="Close"
                    ></button>
                  </div>
                  <div className="modal-body">
                    <ul className="nav nav-tabs" role="tablist">
                      {["projects", "tasks", "users", "logs"].map((tab) => (
                        <li key={tab} className="nav-item">
                          <button
                            className={`nav-link ${activeTab === tab ? "active" : ""}`}
                            onClick={() => {
                              setActiveTab(tab);
                              fetchTabData(tab);
                            }}
                            role="tab"
                          >
                            {tab === "logs"
                              ? "Activity Logs"
                              : tab.charAt(0).toUpperCase() + tab.slice(1)}
                          </button>
                        </li>
                      ))}
                    </ul>

                    <div className="mt-3" role="tabpanel">
                      {activeTab === "projects" && (
                        <div>
                          <h5>Your Projects ({tabData.projects.length})</h5>
                          <ul className="list-group">
                            {tabData.projects.length === 0 && (
                              <li className="list-group-item">No projects found.</li>
                            )}
                            {tabData.projects.map((p) => (
                              <li
                                key={p.id}
                                className="list-group-item d-flex justify-content-between align-items-center"
                              >
                                <div>
                                  <strong>{p.name}</strong>
                                  <div className="text-muted small">
                                    Tasks: {p.taskCount != null ? p.taskCount : "—"}
                                  </div>
                                </div>
                                <div>
                                  <button
                                    className="btn btn-sm btn-outline-primary"
                                    onClick={() => navigate(`/project/${p.id}`)}
                                  >
                                    Open
                                  </button>
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {activeTab === "tasks" && (
                        <div>
                          <h5>All Tasks ({tabData.tasks.length})</h5>
                          <ul className="list-group">
                            {tabData.tasks.length === 0 && (
                              <li className="list-group-item">No tasks found.</li>
                            )}
                            {tabData.tasks.map((t) => (
                              <li
                                key={t.id}
                                className="list-group-item d-flex justify-content-between align-items-center"
                              >
                                <div>
                                  <strong>{t.title}</strong>
                                  <div className="text-muted small">
                                    Status: {t.status}{" "}
                                    {t.assigned_to ? `— Assigned: ${t.assigned_to}` : ""}
                                  </div>
                                  <div className="text-muted small">
                                    Belongs to: {t.projectName || t.project_id}
                                  </div>
                                </div>
                                <div>
                                  <button
                                    className="btn btn-sm btn-outline-primary"
                                    onClick={() =>
                                      navigate(`/project/${t.projectId || t.project_id}`)
                                    }
                                  >
                                    Open
                                  </button>
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {activeTab === "users" && (
                        <div>
                          <h5>Users ({tabData.users.length})</h5>
                          <ul className="list-group">
                            {tabData.users.length === 0 && (
                              <li className="list-group-item">
                                No users found or no permission.
                              </li>
                            )}
                            {tabData.users.map((u) => (
                              <li key={u.id} className="list-group-item">
                                {u.username} ({u.email}) — {u.role}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {activeTab === "logs" && (
                        <div>
                          <h5>Activity Logs</h5>
                          <ul className="list-group">
                            {tabData.logs.length === 0 && (
                              <li className="list-group-item">
                                No logs found or no permission.
                              </li>
                            )}
                            {tabData.logs.map((log, idx) => (
                              <li key={idx} className="list-group-item">
                                {log.user} — {log.action} —{" "}
                                {new Date(log.timestamp || log.created_at).toLocaleString()}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
