import api from './api';

export const departmentService = {
  getAllDepartments: () => api.get('/departments'),
  getActiveDepartments: () => api.get('/departments/active'),
  getDepartmentById: (id) => api.get(`/departments/${id}`),
  createDepartment: (data) => api.post('/departments', data),
  updateDepartment: (id, data) => api.put(`/departments/${id}`, data),
  toggleActive: (id) => api.put(`/departments/${id}/toggle-active`),
};
