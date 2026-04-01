import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL
  || (import.meta.env.PROD ? 'https://ai-careerpilo.onrender.com/api' : 'http://localhost:8000/api');

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('careerpilot_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API
export const authAPI = {
  signup: (data) => api.post('/auth/signup', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
};

// Resume API
export const resumeAPI = {
  analyze: (formData) => api.post('/resume/analyze', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  get: () => api.get('/resume'),
};

// Skills API
export const skillsAPI = {
  analyze: (data) => api.post('/skills/analyze', data),
  get: () => api.get('/skills'),
  getGapAnalyses: () => api.get('/skills/gap-analyses'),
};

// Roadmap API
export const roadmapAPI = {
  get: () => api.get('/roadmap'),
  generate: (data) => api.post('/roadmap/generate', data),
  getTaskProgress: () => api.get('/roadmap/tasks/progress'),
  completeTask: (data) => api.post('/roadmap/tasks/complete', data),
  startTask: (data) => api.post('/roadmap/tasks/start', data),
};

// Interview API
export const interviewAPI = {
  start: (data) => api.post('/interview/start', data),
  continue: (data) => api.post('/interview/continue', data),
  getFeedback: (data) => api.post('/interview/feedback', data),
  getSessions: () => api.get('/interview/sessions'),
};

// User API
export const userAPI = {
  create: (data) => api.post('/user/create', data),
  setGoal: (data) => api.post('/user/goal', data),
  get: (userId) => api.get(`/user/${userId}`), // For public profiles
  getMe: () => api.get('/user/me'),
  updateProfile: (data) => api.put('/user/profile', data),
  getStats: () => api.get('/user/stats'),
  getAchievements: (all = false) => api.get('/user/achievements', { params: { all } }),
};

// Practice API
export const practiceAPI = {
  getQuestions: (filters) => api.get('/practice/questions', { params: filters }),
  getQuestion: (questionId) => api.get(`/practice/questions/${questionId}`),
  executeCode: (data) => api.post('/practice/execute', data),
  submitSolution: (data) => api.post('/practice/submit', data),
  getProgress: () => api.get('/practice/progress'),
  getHint: (questionId, code) => api.post('/practice/hint', { questionId, code }),
  getUserCode: (questionId) => api.get(`/practice/code/${questionId}`),
};

// Technical Challenges API (read-only problem catalog)
export const technicalChallengesAPI = {
  getChallenges: (filters) => api.get('/technical-challenges', { params: filters }),
  getChallenge: (challengeId) => api.get(`/technical-challenges/${challengeId}`),
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

