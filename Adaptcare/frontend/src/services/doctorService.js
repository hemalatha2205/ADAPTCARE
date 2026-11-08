import api from './api';

export const doctorService = {
  getAllDoctors: () => api.get('/doctors'),
  getActiveDoctors: () => api.get('/doctors/active'),
  getDoctorById: (id) => api.get(`/doctors/${id}`),
  getDoctorByUserId: (userId) => api.get(`/doctors/user/${userId}`),
  getDoctorsByDepartment: (deptId) => api.get(`/doctors/department/${deptId}`),
  createDoctor: (data) => api.post('/doctors', data),
  updateDoctor: (id, data) => api.put(`/doctors/${id}`, data),
  toggleActive: (id) => api.put(`/doctors/${id}/toggle-active`),
  getDoctorAvailability: (id) => api.get(`/doctors/${id}/availability`),
  setDoctorAvailability: (id, data) => api.put(`/doctors/${id}/availability`, data),
  getDoctorDashboard: (id) => api.get(`/doctors/${id}/dashboard`),
  getPendingDoctors: () => api.get('/admin/doctors/pending'),
  approveDoctor: (id) => api.put(`/admin/doctors/${id}/approve`),
  rejectDoctor: (id) => api.put(`/admin/doctors/${id}/reject`),
};
