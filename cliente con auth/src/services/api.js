import axios from 'axios';
//tomar el token
import { getIdToken } from './auth';


const API_URL = import.meta.env.VITE_API_URL || 'https://ivdgn6ag2l.execute-api.us-east-1.amazonaws.com/Prod';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' }
});

//para la autenticacion
api.interceptors.request.use(async (config) => {
  const jwt = getIdToken();
  if (jwt) config.headers.Authorization = `Bearer ${jwt}`;
  return config;
});


// GET /notes
export const getNotes = async () => {
  const { data } = await api.get('/notes');
  return Array.isArray(data) ? data : [];  // ← Maneja vacío/array
};

export const createNote = async ({ noteId, text }) => {
  const response = await api.post('/notes', { noteId, text });
  return response.data || { userId: 'testuser', noteId, text };
};

// GET /notes/{noteId}
export const getNote = async (noteId) => {
  const { data } = await api.get(`/notes/${noteId}`);
  return data || null;
};

// PUT /notes/{noteId} - body: {attributes: {text}}
export const updateNote = async (noteId, noteData) => {
  return api.put(`/notes/${encodeURIComponent(noteId)}`, {
    attributes: {
      text: noteData.text 
    }
  });
};

// DELETE /notes/{noteId}
export const deleteNote = async (noteId) => {
  await api.delete(`/notes/${noteId}`);
  return noteId;  // ← Confirma delete
};

// POST /notes/{noteId}/process
export const processNote = async (noteId) => {
  const { data } = await api.post(`/notes/${noteId}/process`);
  return data || { noteId, processing: 'completed' };
};

export default api;
