import axios from 'axios';

const API_URL = 'http://localhost:5000';

// Create axios instance with default configuration
const api = axios.create({
    baseURL: API_URL,
    withCredentials: true,
    timeout: 15000, // 15 seconds timeout
    headers: {
        'Content-Type': 'application/json',
    }
});

// Request interceptor for adding auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor for error handling
api.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        console.error('API Error:', error.message);

        if (error.response?.status === 401) {
            console.log('Unauthorized - redirecting to login');
            // Optionally redirect to login here
            // window.location.href = '/login';
        }

        return Promise.reject(error);
    }
);

export default api;