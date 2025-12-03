// src/pages/ProjectDetails.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  getAllTasks,
  createTask,
  updateTask,
  getGlobalLogs,
  getProjectById,
  getUsers,
  getProjects,
} from '../services/projectService';
import Task from '../components/Task';

function ProjectDetails() {
  const { id: projectIdFromUrl } = useParams();
  const navigate = useNavigate();

  const [tasks, setTasks] = useState([]);
  const [logs, setLogs] = useState([]);
  const [projectInfo, setProjectInfo] = useState(null);

  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);

  const [newTask, setNewTask] = useState({
    project_id: projectIdFromUrl || '',
    title: '',
    assigned_to: '',
  });

  const numericProjectId = Number(projectIdFromUrl);

  // ---- helpers to find names ----
  const userNameById = (id) => {
    if (!id) return null;
    const u = users.find((user) => String(user.id) === String(id));
    return u ? (u.username || u.name || u.email) : null;
  };

  const projectNameById = (id) => {
    if (!id) return null;
    const p = projects.find((proj) => String(proj.id) === String(id));
    return p ? p.name : null;
  };

  // ---------- FETCH PROJECT INFO ----------
  const fetchProjectInfo = useCallback(async () => {
    if (!projectIdFromUrl) return;
    try {
      const res = await getProjectById(projectIdFromUrl);
      setProjectInfo(res.data);
    } catch (err) {
      console.error('Failed to load project info:', err?.response || err);
      setProjectInfo(null);
    }
  }, [projectIdFromUrl]);

  // ---------- FETCH USERS ----------
  const fetchUsers = useCallback(async () => {
    try {
      const res = await getUsers();
      setUsers(res.data || []);
    } catch (err) {
      console.error('Failed to load users:', err?.response || err);
      setUsers([]);
    }
  }, []);

  // ---------- FETCH PROJECT LIST (for dropdown when no :id) ----------
  const fetchProjectsList = useCallback(async () => {
    try {
      const res = await getProjects();
      setProjects(res.data || []);
    } catch (err) {
      console.error('Failed to load projects list:', err?.response || err);
      setProjects([]);
    }
  }, []);

  // ---------- FETCH TASKS ----------
  const fetchTasks = useCallback(async () => {
    try {
      const res = await getAllTasks();
      const allTasks = res.data || [];

      const hasProjectField = allTasks.some(
        (t) =>
          (t.project_id !== undefined && t.project_id !== null) ||
          (t.projectId   !== undefined && t.projectId   !== null) ||
          (t.project     !== undefined && t.project     !== null)
      );

      let filtered = allTasks;

      if (hasProjectField && numericProjectId) {
        filtered = allTasks.filter((t) => {
          const pid = t.project_id ?? t.projectId ?? t.project ?? null;
          if (pid == null) return false;
          return Number(pid) === numericProjectId;
        });
      }

      setTasks(filtered);
    } catch (err) {
      console.error('Load tasks error:', err.response || err);
      alert('Failed to load tasks');
      setTasks([]);
    }
  }, [numericProjectId]);

  // ---------- DATE FORMAT ----------
  const fmtDate = (raw) => {
    if (!raw) return 'Invalid Date';
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) return 'Invalid Date';
    const z = (n) => (n < 10 ? '0' + n : n);
    return `${z(d.getDate())}/${z(d.getMonth() + 1)}/${d.getFullYear()}, ${z(
      d.getHours()
    )}:${z(d.getMinutes())}:${z(d.getSeconds())}`;
  };

  // ---------- FETCH LOGS ----------
  const fetchLogs = useCallback(async () => {
    try {
      const res = await getGlobalLogs();
      const allLogs = res.data || [];

      const filtered = allLogs.filter((l) => {
        const pid = l.project_id ?? l.projectId ?? l.project ?? null;
        if (!numericProjectId) return true;
        if (pid == null) return false;
        return Number(pid) === numericProjectId;
      });

      const normalized = filtered.map((l, idx) => ({
        id: l.id ?? idx,
        user: l.user ?? l.username ?? 'Unknown',
        action: l.action ?? l.message ?? '—',
        created_at: l.created_at ?? l.timestamp ?? l.time ?? l.createdAt ?? null,
      }));

      setLogs(normalized);
    } catch (err) {
      console.error('Load logs error:', err.response || err);
      alert('Failed to load logs');
      setLogs([]);
    }
  }, [numericProjectId]);

  // ---------- INITIAL LOAD ----------
  useEffect(() => {
    fetchProjectInfo();
    fetchUsers();
    fetchProjectsList();
    fetchTasks();
    fetchLogs();
  }, [fetchProjectInfo, fetchUsers, fetchProjectsList, fetchTasks, fetchLogs]);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // ---------- ADD TASK ----------
  const handleAddTask = async () => {
    if (!newTask.title.trim()) {
      alert('Please enter a task title');
      return;
    }

    const projectIdToUseRaw =
      newTask.project_id && newTask.project_id.toString().trim() !== ''
        ? newTask.project_id
        : projectIdFromUrl;

    const projectIdToUse = parseInt(projectIdToUseRaw, 10);
    if (!projectIdToUse || Number.isNaN(projectIdToUse)) {
      alert('Please select a valid project');
      return;
    }

    let assignedTo = null;
    if (newTask.assigned_to && newTask.assigned_to.toString().trim() !== '') {
      assignedTo = parseInt(newTask.assigned_to, 10);
      if (Number.isNaN(assignedTo)) {
        alert('Assigned To must be a valid user ID');
        return;
      }
    }

    try {
      await createTask(projectIdToUse, {
        title: newTask.title.trim(),
        assigned_to: assignedTo,
        status: 'todo',
      });

      setNewTask((prev) => ({
        ...prev,
        title: '',
        assigned_to: '',
        // keep project_id for convenience
      }));

      await fetchTasks();
      await fetchLogs();
    } catch (err) {
      console.error('Failed to add task:', err.response || err.message || err);
      if (err.response?.data?.error) {
        alert(`Failed to add task: ${err.response.data.error}`);
      } else if (err.response?.status === 401) {
        alert('Unauthorized: Please login again.');
      } else {
        alert('Failed to add task');
      }
    }
  };

  // ---------- DnD UPDATE ----------
  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (!over) return;
    if (active.id === over.id) return;

    const activeTask = tasks.find((t) => t.id === active.id);
    const overTask = tasks.find((t) => t.id === over.id);
    if (!activeTask || !overTask) return;
    if (activeTask.status === overTask.status) return;

    try {
      await updateTask(activeTask.id, { ...activeTask, status: overTask.status });
      await fetchTasks();
      await fetchLogs();
    } catch (err) {
      console.error('Drag end update error:', err);
      alert('Failed to update task');
    }
  };

  const onTaskUpdate = async () => {
    await fetchTasks();
    await fetchLogs();
  };

  const onTaskDelete = async () => {
    await fetchTasks();
    await fetchLogs();
  };

  // decorate tasks with assigned_to_name for display
  const decoratedTasks = tasks.map((t) => ({
    ...t,
    assigned_to_name: userNameById(t.assigned_to),
  }));

  const columns = {
    todo: decoratedTasks.filter((t) => String(t.status).toLowerCase() === 'todo'),
    'in-progress': decoratedTasks.filter((t) => {
      const s = String(t.status || '').toLowerCase();
      return s === 'in-progress' || s === 'in progress' || s === 'in_progress';
    }),
    done: decoratedTasks.filter((t) => String(t.status).toLowerCase() === 'done'),
  };

  const handleBack = () => navigate(-1);
  const handleRefresh = () => {
    fetchProjectInfo();
    fetchUsers();
    fetchProjectsList();
    fetchTasks();
    fetchLogs();
  };

  // label for top project selector when not using URL
  const currentProjectName =
    projectInfo?.name || projectNameById(newTask.project_id) || '';

  return (
    <div className="container mt-5">
      {/* Header with Back + Refresh */}
      <div className="d-flex align-items-center mb-3">
        <h2 className="me-auto">
          Project Details
          {projectInfo && (
            <span className="ms-3 h5 text-muted">
              {projectInfo.name} (ID: {projectInfo.id})
            </span>
          )}
        </h2>
        <div>
          <button className="btn btn-outline-secondary me-2" onClick={handleBack}>
            Back
          </button>
          <button className="btn btn-outline-primary" onClick={handleRefresh}>
            Refresh
          </button>
        </div>
      </div>

      {/* Add task form */}
      <div className="mb-3">
        {/* If we are NOT on /project/:id, let admin choose project by NAME */}
        {!projectIdFromUrl && (
          <select
            value={newTask.project_id}
            onChange={(e) =>
              setNewTask((prev) => ({ ...prev, project_id: e.target.value }))
            }
            className="form-select mb-2"
          >
            <option value="">
              {projects.length ? 'Select project' : 'No projects available'}
            </option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} (ID: {p.id})
              </option>
            ))}
          </select>
        )}

        {/* If we *are* on /project/:id, you can optionally show name in a disabled box */}
        {projectIdFromUrl && currentProjectName && (
          <input
            type="text"
            className="form-control mb-2"
            value={currentProjectName}
            disabled
          />
        )}

        <input
          type="text"
          placeholder="Task Title"
          value={newTask.title}
          onChange={(e) =>
            setNewTask((prev) => ({ ...prev, title: e.target.value }))
          }
          className="form-control"
        />

        {/* Assigned user dropdown */}
        <select
          value={newTask.assigned_to}
          onChange={(e) =>
            setNewTask((prev) => ({ ...prev, assigned_to: e.target.value }))
          }
          className="form-select mt-2"
        >
          <option value="">Select user (optional)</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.username || u.name || u.email} (ID: {u.id})
            </option>
          ))}
        </select>

        <button onClick={handleAddTask} className="btn btn-primary mt-2">
          Add Task
        </button>
      </div>

      {/* Task board */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <div className="row">
          {Object.entries(columns).map(([status, tasksInColumn]) => (
            <div key={status} className="col-md-4">
              <h4>{status.replace('-', ' ').toUpperCase()}</h4>
              <SortableContext
                items={tasksInColumn.map((t) => t.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="border p-2" style={{ minHeight: '200px' }}>
                  {tasksInColumn.map((task) => (
                    <Task
                      key={task.id}
                      task={task}
                      assignedUserName={task.assigned_to_name}
                      onUpdate={onTaskUpdate}
                      onDelete={onTaskDelete}
                    />
                  ))}
                </div>
              </SortableContext>
            </div>
          ))}
        </div>
      </DndContext>

      {/* Activity logs */}
      <h3 className="mt-5">Activity Logs</h3>
      <ul className="list-group mb-4">
        {logs.length === 0 && (
          <li className="list-group-item">No logs found for this project.</li>
        )}
        {logs.map((log) => (
          <li key={log.id} className="list-group-item">
            <strong>{log.user}</strong> — {log.action} — {fmtDate(log.created_at)}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default ProjectDetails;
