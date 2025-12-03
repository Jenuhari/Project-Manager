import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

export const signup = (userData) => {
  return axios.post(`${API_URL}/signup`, userData);
};

export const login = (credentials) => {
  return axios.post(`${API_URL}/login`, credentials);
};

export const setAuthToken = (token) => {
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete axios.defaults.headers.common['Authorization'];
  }
};
export const logout = () => axios.post('/logout');
export const forgotPassword = (email) => axios.post(`${API_URL}/forgot-password`, { email });
export const resetPassword = (token, newPassword) => axios.post(`${API_URL}/reset-password`, { token, new_password: newPassword });


