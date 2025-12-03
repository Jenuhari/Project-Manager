// src/pages/TasksPage.js
import React, { useEffect, useState, useCallback } from 'react';
import TaskBoard from '../components/TaskBoard';
import {
  getAllTasks,
  updateTask,
  getUsers,        // ⬅️ NEW
  setAuthToken
} from '../services/projectService';
import { useNavigate } from "react-router-dom";

setAuthToken(localStorage.getItem('token'));

function TasksPage() {
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);      // ⬅️ NEW
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // ---- helper: id -> username ----
  const userNameById = (id) => {
    if (!id) return null;
    const u = users.find((user) => String(user.id) === String(id));
    return u ? (u.username || u.name || u.email) : null;
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) setAuthToken(token);
    fetchUsers();
    fetchTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await getUsers();
      setUsers(res.data || []);
    } catch (err) {
      console.error('Failed to load users for TasksPage:', err?.response || err);
      setUsers([]);
    }
  }, []);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAllTasks();
      setTasks(res.data || []);
      console.log('Loaded tasks:', res.data);
    } catch (err) {
      console.error('Failed to load tasks:', err?.response || err?.message || err);
      if (err?.response) {
        const status = err.response.status;
        if (status === 401 || status === 403) {
          alert('Unauthorized. Please login again.');
        } else {
          alert(`Failed to load tasks: ${status} ${err.response.data?.error || ''}`);
        }
      } else {
        alert('Failed to load tasks (check console/network).');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Decorate tasks with assigned_to_name so Task can show username
  const decoratedTasks = tasks.map((t) => ({
    ...t,
    assigned_to_name: userNameById(t.assigned_to),
  }));

  const tasksByStatus = {
    todo: decoratedTasks.filter(t => String(t.status).toLowerCase() === 'todo'),
    'in-progress': decoratedTasks.filter(t => {
      const s = String(t.status || '').toLowerCase();
      return s === 'in-progress' || s === 'in progress' || s === 'in_progress';
    }),
    done: decoratedTasks.filter(t => String(t.status).toLowerCase() === 'done'),
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (!over) return;
    if (active.id === over.id) return;

    const activeTask = tasks.find(t => t.id === active.id);
    const overTask = tasks.find(t => t.id === over.id);
    if (!activeTask || !overTask) return;

    const newStatus = overTask.status;
    if (activeTask.status === newStatus) return;

    try {
      await updateTask(activeTask.id, { status: newStatus });
      await fetchTasks();
    } catch (err) {
      console.error('Failed to update task status:', err?.response || err);
      alert('Failed to update task status');
    }
  };

  const handleUpdateTask = async () => {
    await fetchTasks();
  };

  const handleDeleteTask = async () => {
    await fetchTasks();
  };

  return (
    <div className="container mt-4">
      <div className="d-flex align-items-center mb-3">
        <h2 className="me-auto">Your Tasks</h2>

        <div>
          <button
            className="btn btn-outline-secondary me-2"
            onClick={() => navigate(-1)}
          >
            Back
          </button>

          <button
            className="btn btn-outline-primary"
            onClick={fetchTasks}
          >
            Refresh
          </button>
        </div>
      </div>

      {loading && <div className="mb-3 text-muted">Loading tasks...</div>}
      {!loading && decoratedTasks.length === 0 && <p>No tasks found.</p>}

      <TaskBoard
        tasksByStatus={tasksByStatus}
        onDragEnd={handleDragEnd}
        onUpdateTask={handleUpdateTask}
        onDeleteTask={handleDeleteTask}
      />
    </div>
  );
}

export default TasksPage;
