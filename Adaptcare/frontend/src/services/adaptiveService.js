import api from './api';

export const adaptiveService = {
  evaluateAllRules: () => api.post('/adaptive/evaluate'),
  evaluateRule: (ruleId) => api.post(`/adaptive/evaluate/${ruleId}`),
  simulateRule: (ruleId) => api.post(`/adaptive/simulate/${ruleId}`),
  getRules: () => api.get('/adaptive/rules'),
  updateRule: (id, data) => api.put(`/adaptive/rules/${id}`, data),
  getHistory: (page = 0, size = 10) => api.get('/adaptive/history', { params: { page, size } }),
};
