import React, { useEffect, useState } from 'react';
import { getProjects, getTasks, updateTask, deleteTask } from '../services/projectService';

function ProjectList() {
  const [projects, setProjects] = useState([]);
  const [activeProjectId, setActiveProjectId] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [editedTask, setEditedTask] = useState(null); // task object being edited

  useEffect(() => {
    fetchProjects();
  }, []);

  // Fetch all projects
  const fetchProjects = async () => {
    try {
      const res = await getProjects();
      setProjects(res.data);
      if (res.data.length > 0) {
        setActiveProjectId(res.data[0].id); // select first project by default
      }
    } catch (error) {
      alert('Failed to load projects');
    }
  };

  // Fetch tasks for active project
  useEffect(() => {
    if (activeProjectId) {
      fetchTasks(activeProjectId);
    }
  }, [activeProjectId]);

  const fetchTasks = async (projectId) => {
    try {
      const res = await getTasks(projectId);
      setTasks(res.data);
    } catch (error) {
      alert('Failed to load tasks');
    }
  };

  // Handle edit button - set task to be edited
  const handleEdit = (task) => {
    setEditedTask({ ...task });
  };

  // Handle cancel edit
  const handleCancel = () => {
    setEditedTask(null);
  };

  // Handle save edited task
  const handleSave = async () => {
    if (!editedTask.title.trim()) {
      alert('Task title cannot be empty');
      return;
    }
    try {
      await updateTask(editedTask.id, editedTask);
      setEditedTask(null);
      fetchTasks(activeProjectId);
    } catch (error) {
      alert('Failed to save task');
    }
  };

  // Handle input changes in edit mode
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedTask(prev => ({ ...prev, [name]: value }));
  };

  // Handle task deletion
  const handleDelete = async (taskId) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await deleteTask(taskId);
        fetchTasks(activeProjectId);
      } catch (error) {
        alert('Failed to delete task');
      }
    }
  };

  // Group tasks by status for display
  const groupedTasks = tasks.reduce((acc, task) => {
    const statusKey = task.status.toLowerCase().replace(' ', '-'); // e.g. "To Do" -> "to-do"
    if (!acc[statusKey]) acc[statusKey] = [];
    acc[statusKey].push(task);
    return acc;
  }, {});

  return (
    <div className="container mt-4">
      <h2>Projects</h2>
      <div className="d-flex mb-3">
        {projects.map(p => (
          <button
            key={p.id}
            className={`btn me-2 ${p.id === activeProjectId ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => setActiveProjectId(p.id)}
          >
            {p.name}
          </button>
        ))}
      </div>

      <h3>Tasks for Project: {projects.find(p => p.id === activeProjectId)?.name || ''}</h3>

      {Object.entries(groupedTasks).map(([status, tasks]) => (
        <div key={status} className="mb-4">
          <h4>{status.replace('-', ' ').toUpperCase()}</h4>
          {tasks.map(task => (
            <div key={task.id} className="border rounded p-3 mb-2 bg-light">
              {editedTask && editedTask.id === task.id ? (
                <>
                  <input
                    type="text"
                    name="title"
                    value={editedTask.title}
                    onChange={handleInputChange}
                    className="form-control mb-2"
                    placeholder="Task Title"
                  />
                  <input
                    type="text"
                    name="assigned_to"
                    value={editedTask.assigned_to || ''}
                    onChange={handleInputChange}
                    className="form-control mb-2"
                    placeholder="Assigned To (User ID)"
                  />
                  <select
                    name="status"
                    value={editedTask.status}
                    onChange={handleInputChange}
                    className="form-select mb-2"
                  >
                    <option value="todo">To Do</option>
                    <option value="in-progress">In Progress</option>
                    <option value="done">Done</option>
                  </select>
                  <button onClick={handleSave} className="btn btn-success me-2">Save</button>
                  <button onClick={handleCancel} className="btn btn-secondary">Cancel</button>
                </>
              ) : (
                <>
                  <h5>{task.title}</h5>
                  <p><strong>Assigned to:</strong> {task.assigned_to || 'Unassigned'}</p>
                  <p><strong>Status:</strong> {task.status}</p>
                  <button onClick={() => handleEdit(task)} className="btn btn-warning me-2 btn-sm">Edit</button>
                  <button onClick={() => handleDelete(task.id)} className="btn btn-danger btn-sm">Delete</button>
                </>
              )}
            </div>
          ))}
        </div>
      ))}

    </div>
  );
}

export default ProjectList;
