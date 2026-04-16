import axios from 'axios';

// In production (Vercel), set VITE_API_BASE_URL=https://your-render-app.onrender.com/api/v1
// For local development this automatically falls back to localhost.
const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

const apiClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json'
  }
});

export default apiClient;
