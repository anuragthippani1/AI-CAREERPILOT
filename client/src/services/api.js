import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Resume API
export const resumeAPI = {
  analyze: (formData) => api.post('/resume/analyze', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  get: (userId) => api.get(`/resume/${userId}`),
};

// Skills API
export const skillsAPI = {
  analyze: (data) => api.post('/skills/analyze', data),
  get: (userId) => api.get(`/skills/${userId}`),
};

// Roadmap API
export const roadmapAPI = {
  get: (userId) => api.get(`/roadmap/${userId}`),
  generate: (data) => api.post('/roadmap/generate', data),
};

// Interview API
export const interviewAPI = {
  start: (data) => api.post('/interview/start', data),
  continue: (data) => api.post('/interview/continue', data),
  getFeedback: (data) => api.post('/interview/feedback', data),
  getSessions: (userId) => api.get(`/interview/sessions/${userId}`),
};

// User API
export const userAPI = {
  create: (data) => api.post('/user/create', data),
  setGoal: (data) => api.post('/user/goal', data),
  get: (userId) => api.get(`/user/${userId}`),
  updateProfile: (userId, data) => api.put(`/user/${userId}/profile`, data),
  getStats: (userId) => api.get(`/user/${userId}/stats`),
  getAchievements: (userId, all = false) => api.get(`/user/${userId}/achievements`, { params: { all } }),
};

// Practice API
export const practiceAPI = {
  getQuestions: (filters) => api.get('/practice/questions', { params: filters }),
  getQuestion: (questionId) => api.get(`/practice/questions/${questionId}`),
  executeCode: (data) => api.post('/practice/execute', data),
  submitSolution: (data) => api.post('/practice/submit', data),
  getProgress: (userId) => api.get(`/practice/progress/${userId}`),
  getHint: (userId, questionId, code) => api.post('/practice/hint', { userId, questionId, code }),
  getUserCode: (userId, questionId) => api.get(`/practice/code/${userId}/${questionId}`),
};

// Leaderboard API
export const leaderboardAPI = {
  getTopUsers: (page = 1, limit = 20) => api.get('/leaderboard', { params: { page, limit } }),
  getTopByInterviews: (page = 1, limit = 20) => api.get('/leaderboard/interviews', { params: { page, limit } }),
  getTopByStreaks: (page = 1, limit = 20) => api.get('/leaderboard/streaks', { params: { page, limit } }),
  getUserRank: (userId) => api.get(`/leaderboard/rank/${userId}`),
};

// Achievements API
export const achievementsAPI = {
  getAll: (userId) => api.get(`/user/${userId}/achievements`),
};

export default api;

