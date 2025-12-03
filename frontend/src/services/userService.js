import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

export const getProfile = () => axios.get(`${API_URL}/profile`);

export const updateProfile = (profileData) => axios.put(`${API_URL}/profile`, profileData);