import api from './api';

export const queueService = {
  getQueueByDoctor: (doctorId) => api.get(`/queue/doctor/${doctorId}`),
  getQueueByDepartment: (deptId) => api.get(`/queue/department/${deptId}`),
  getPatientCurrentQueue: () => api.get('/queue/patient/current'),
  updateQueueStatus: (id, status) => api.put(`/queue/${id}/status`, null, { params: { status } }),
  recalculateQueue: (doctorId) => api.post(`/queue/recalculate/${doctorId}`),
  checkIn: (appointmentId) => api.post(`/queue/check-in/${appointmentId}`),
};
