import axios from 'axios';

// Use environment variable for API URL, fallback to localhost for development
const API_URL = process.env.REACT_APP_API_URL
  ? `${process.env.REACT_APP_API_URL}/api`
  : 'http://localhost:5001/api';

// Set up axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Function to handle user login
export const login = async (email, password) => {
  const response = await api.post('/auth/login', { email, password });
  return response.data;
};

// Function to get leads for the logged-in telepro
export const getMyLeads = async (token) => {
  const response = await api.get('/leads/my', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

// Function to import leads
export const importLeads = async (formData, token) => {
  const response = await api.post('/leads/import', formData, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

// Function to assign leads
export const assignLeads = async (leadIds, teleproId, token) => {
  const response = await api.post('/leads/assign', { leadIds, teleproId }, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

// Function to update lead status and comment
export const updateLead = async (leadId, data, token) => {
  const response = await api.put(`/leads/${leadId}`, data, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};