import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const api = axios.create({
    baseURL: `${API_URL}/api`,
    withCredentials: true,
    headers: { 'Content-Type': 'application/json' }
});

// Simple error interceptor - NO automatic redirects
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Just log the error, don't redirect
        console.error('API Error:', error.response?.status, error.message);
        return Promise.reject(error);
    }
);

export const authApi = {
    getLoginUrl: () => api.get('/auth/login'),
    getMe: () => api.get('/auth/me'),
    logout: () => api.post('/auth/logout'),
    refresh: () => api.post('/auth/refresh')
};

export const instagramApi = {
    getOverview: () => api.get('/instagram/overview'),
    getGrowth: (period = '30d') => api.get(`/instagram/growth?period=${period}`),
    getBestTime: () => api.get('/instagram/best-time'),
    getHashtags: () => api.get('/instagram/hashtags'),
    getReels: () => api.get('/instagram/reels'),
    getPosts: (limit = 50) => api.get(`/instagram/posts?limit=${limit}`),
    exportData: (format = 'json', metrics = 'overview,growth,posts') =>
        api.get(`/instagram/export?format=${format}&metrics=${metrics}`)
};

export default api;
