import api from './api';

export const adminService = {
  getDashboard: () => api.get('/admin/dashboard'),
  getStats: () => api.get('/admin/stats'),
  getUsers: (page = 0, size = 10, role = null) => api.get('/admin/users', { params: { page, size, role } }),
  createUser: (data) => api.post('/admin/users', data),
  toggleUserActive: (id) => api.put(`/admin/users/${id}/toggle-active`),
  createDoctor: (data) => api.post('/admin/doctors', data),
};
