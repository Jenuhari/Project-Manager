// src/components/Task.jsx
import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { updateTask, deleteTask } from '../services/projectService';

function Task({ task, onUpdate, onDelete, assignedUserName }) {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editedTask, setEditedTask] = useState({
    title: task.title || '',
    assigned_to: task.assigned_to != null ? String(task.assigned_to) : '',
    status: task.status || 'todo',
  });

  // 🔐 role from localStorage (set at login)
  const role = localStorage.getItem('role');
  const isAdmin = role === 'admin';

  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({
      id: String(task.id),
    });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    pointerEvents: 'auto',
  };

  // disable drag while editing
  const dragProps = isEditing ? {} : { ...attributes, ...listeners };

  // Prefer username over ID for display
  const displayAssigned =
    task.assigned_to_username ||
    task.assigned_to_name ||
    assignedUserName ||
    task.assigned_to ||
    'Unassigned';

  const handleSave = async (e) => {
    e && e.preventDefault();

    if (!editedTask.status) {
      alert('Status is required');
      return;
    }

    // Build payload depending on role
    let payload;

    if (isAdmin) {
      // Admin can change everything
      if (!editedTask.title.trim()) {
        alert('Task title cannot be empty');
        return;
      }

      let assignedTo = editedTask.assigned_to.trim();
      if (assignedTo === '') assignedTo = null;
      else {
        if (!/^\d+$/.test(assignedTo)) {
          alert('Assigned To must be a numeric user ID');
          return;
        }
        assignedTo = Number(assignedTo);
      }

      payload = {
        title: editedTask.title.trim(),
        assigned_to: assignedTo,
        status: editedTask.status,
      };
    } else {
      // 🚫 Normal user: only status is allowed
      payload = {
        status: editedTask.status,
      };
    }

    try {
      setLoading(true);
      await updateTask(task.id, payload);
      setIsEditing(false);
      onUpdate && onUpdate();
    } catch (err) {
      const backendMsg =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        'Unknown error';

      console.error('Failed to update task:', err?.response || err);
      alert('Failed to update task: ' + backendMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure?')) return;
    try {
      setLoading(true);
      await deleteTask(task.id);
      onDelete && onDelete();
    } catch (err) {
      console.error('Delete error:', err);
      alert('Failed to delete task');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setEditedTask({
      title: task.title || '',
      assigned_to: task.assigned_to != null ? String(task.assigned_to) : '',
      status: task.status || 'todo',
    });
    setIsEditing(false);
  };

  return (
    <div ref={setNodeRef} style={style} {...dragProps} className="card mb-2">
      <div className="card-body">
        {isEditing ? (
          <>
            {/* TITLE */}
            {isAdmin ? (
              <input
                type="text"
                value={editedTask.title}
                onChange={(e) =>
                  setEditedTask({ ...editedTask, title: e.target.value })
                }
                className="form-control mb-2"
                placeholder="Task Title"
                autoFocus
              />
            ) : (
              <div className="mb-2">
                <strong>Title:</strong> {task.title}
              </div>
            )}

            {/* ASSIGNED TO */}
            {isAdmin ? (
              <input
                type="text"
                value={editedTask.assigned_to}
                onChange={(e) =>
                  setEditedTask({
                    ...editedTask,
                    assigned_to: e.target.value,
                  })
                }
                className="form-control mb-2"
                placeholder="Assigned To (User ID)"
              />
            ) : (
              <div className="mb-2">
                <strong>Assigned to:</strong> {displayAssigned}
              </div>
            )}

            {/* STATUS – editable for everyone */}
            <select
              value={editedTask.status}
              onChange={(e) =>
                setEditedTask({ ...editedTask, status: e.target.value })
              }
              className="form-select mb-2"
            >
              <option value="todo">To Do</option>
              <option value="in-progress">In Progress</option>
              <option value="done">Done</option>
            </select>

            <button
              disabled={loading}
              onClick={handleSave}
              className="btn btn-success btn-sm me-2"
            >
              Save
            </button>
            <button
              disabled={loading}
              onClick={handleCancel}
              className="btn btn-secondary btn-sm"
            >
              Cancel
            </button>
          </>
        ) : (
          <>
            <h5>{task.title}</h5>
            <p>
              <strong>Assigned to:</strong> {displayAssigned}
            </p>
            <p>
              <strong>Status:</strong> {task.status}
            </p>

            <button
              onClick={() => setIsEditing(true)}
              className="btn btn-warning btn-sm me-2"
            >
              Edit
            </button>
            <button
              onClick={handleDelete}
              className="btn btn-danger btn-sm"
            >
              Delete
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default Task;
