import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getGlobalLogs } from "../services/projectService"; // must return { data: [...] }
import "../components/SideBar.css"; // optional: reuse your app styles or import a specific CSS

export default function ActivityLogs() {
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [limit, setLimit] = useState(25); // page size
  const [hasMore, setHasMore] = useState(false);

  // Format date to dd/mm/yyyy, hh:mm:ss — returns "Invalid Date" if invalid
  const fmtDate = (raw) => {
    if (!raw) return "Invalid Date";
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) return "Invalid Date";
    const z = (n) => (n < 10 ? "0" + n : n);
    return `${z(d.getDate())}/${z(d.getMonth() + 1)}/${d.getFullYear()}, ${z(d.getHours())}:${z(d.getMinutes())}:${z(d.getSeconds())}`;
  };

  const loadLogs = async (requestedLimit = 25) => {
    setLoading(true);
    setError(null);
    try {
      // getGlobalLogs should accept an options object — adapt if your implementation differs
      const res = await getGlobalLogs({ limit: requestedLimit });
      console.log("[ActivityLogs] raw response:", res.data); 
      const arr = (res && res.data) ? res.data : [];

      // Normalize incoming rows to { id, user, action, created_at }
      const normalized = arr.map((r, idx) => ({
        id: r.id ?? idx,
        user: r.user ?? r.username ?? "Unknown",
        action: r.action ?? r.message ?? "—",
        created_at: r.created_at ?? r.time ?? r.timestamp ?? r.createdAt ?? null,
      }));

      setLogs(normalized);
      setHasMore((res.data && res.data.length) ? res.data.length >= requestedLimit : false);
      setLoading(false);
    } catch (err) {
      console.error("Failed to load activity logs:", err);
      setError(err.message || "Failed to load logs");
      setLogs([]); // keep empty or fallback sample if you'd prefer
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs(limit);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadMore = () => {
    const next = limit + 25;
    setLimit(next);
    loadLogs(next);
  };

  return (
    <div className="container py-4">
      <div className="d-flex align-items-center mb-3">
        <h2 className="me-auto">Activity Logs</h2>
        <div>
          <button className="btn btn-outline-secondary me-2" onClick={() => navigate(-1)}>Back</button>
          <button className="btn btn-outline-primary" onClick={() => loadLogs(limit)}>Refresh</button>
        </div>
      </div>

      {loading && (
        <div className="mb-3 text-muted">Loading activity logs…</div>
      )}

      {error && (
        <div className="alert alert-warning" role="alert">
          Could not load logs — showing error: {error}
        </div>
      )}

      <div className="logs-list list-group shadow-sm" style={{ maxHeight: "64vh", overflowY: "auto", borderRadius: 8 }}>
        {(!loading && logs.length === 0) && (
          <div className="list-group-item">No activity found.</div>
        )}

        {logs.map((log) => (
          <div key={log.id} className="list-group-item d-flex align-items-center" style={{ borderBottom: "1px solid #f1f5f9" }}>
            <div style={{ fontSize: 16, color: "#111827" }}>
              <strong style={{ marginRight: 8 }}>{log.user}</strong>
              <span style={{ color: "#374151" }}>{` — ${log.action} — `}</span>
              <span style={{ color: "#374151", marginLeft: 6 }}>{fmtDate(log.created_at)}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="d-flex justify-content-center mt-3">
        {hasMore ? (
          <button className="btn btn-outline-secondary" onClick={loadMore} disabled={loading}>
            {loading ? "Loading…" : "Load more"}
          </button>
        ) : (
          <button className="btn btn-outline-secondary" onClick={() => loadLogs(25)} disabled={loading}>
            {loading ? "Refreshing…" : "Refresh"}
          </button>
        )}
      </div>
    </div>
  );
}
