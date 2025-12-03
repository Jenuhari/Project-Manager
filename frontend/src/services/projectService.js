// src/services/projectService.js
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

// Set axios base URL so axios.get('/tasks') or axios requests go to backend by default
axios.defaults.baseURL = API_URL;
// you can still override headers per-request if needed

// Set or remove Authorization header for Axios globally
export const setAuthToken = (token) => {
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete axios.defaults.headers.common['Authorization'];
  }
};

// Projects API calls
export const getProjects = async () => {
  return await axios.get(`/projects`);
};

export const createProject = async (projectData) => {
  return await axios.post(`/projects`, projectData);
};

// Tasks API calls
// Get tasks for a particular project
export const getTasks = async (projectId) => {
  return await axios.get(`/projects/${projectId}/tasks`);
};

// Get all tasks for current user
export const getAllTasks = async () => {
  return await axios.get(`/tasks`);
};

export const createTask = async (projectId, taskData) => {
  return await axios.post(`/projects/${projectId}/tasks`, taskData);
};

// Update and delete use tasks route
export const updateTask = async (taskId, taskData) => {
  return await axios.put(`/tasks/${taskId}`, taskData);
};

export const deleteTask = async (taskId) => {
  return await axios.delete(`/tasks/${taskId}`);
};

// Activity logs for a specific project
export const getActivityLogs = async (projectId) => {
  return await axios.get(`/projects/${projectId}/logs`);
};

// Additional endpoints
export const getUsers = async () => {
  return await axios.get(`/users`);
};

export const getGlobalLogs = async (params ) => {
  return await axios.get(`/global-logs`,{ params });
};
export const getProjectById = async(id) => {
  return axios.get(`/projects/${id}`);
};
