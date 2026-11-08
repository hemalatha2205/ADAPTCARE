import api from './api';

export const analyticsService = {
  getDashboard: () => api.get('/analytics/dashboard'),
  getAppointmentTrends: (days = 7) => api.get('/analytics/appointments', { params: { days } }),
  getDepartmentWorkload: (days = 7) => api.get('/analytics/departments', { params: { days } }),
};
