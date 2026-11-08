import api from './api';

export const resourceService = {
  getAllResources: () => api.get('/resources'),
  getAvailableResources: () => api.get('/resources/available'),
  getResourcesByDepartment: (deptId) => api.get(`/resources/department/${deptId}`),
  getResourceById: (id) => api.get(`/resources/${id}`),
  createResource: (data) => api.post('/resources', data),
  updateResource: (id, data) => api.put(`/resources/${id}`, data),
  updateStatus: (id, status) => api.put(`/resources/${id}/status`, null, { params: { status } }),
  allocateResource: (id, appointmentId) => api.post(`/resources/${id}/allocate`, null, { params: { appointmentId } }),
  releaseResource: (allocationId) => api.post(`/resources/release/${allocationId}`),
};
