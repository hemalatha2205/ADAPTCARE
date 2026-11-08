import api from './api';

export const appointmentService = {
  bookAppointment: (data) => api.post('/appointments', data),
  getAppointmentById: (id) => api.get(`/appointments/${id}`),
  getPatientAppointments: () => api.get('/appointments/patient'),
  getDoctorAppointments: (doctorId, date) => api.get(`/appointments/doctor/${doctorId}`, { params: { date } }),
  getAvailableSlots: (doctorId, date) => api.get('/appointments/available-slots', { params: { doctorId, date } }),
  cancelAppointment: (id) => api.put(`/appointments/${id}/cancel`),
  updateStatus: (id, status) => api.put(`/appointments/${id}/status`, null, { params: { status } }),
  updatePriority: (id, priority) => api.put(`/appointments/${id}/priority`, null, { params: { priority } }),
  getTodayAppointments: () => api.get('/appointments/today'),
  getByDateRange: (start, end) => api.get('/appointments/date-range', { params: { start, end } }),
};
