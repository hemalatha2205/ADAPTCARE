import api from './api';

export const feedbackService = {
  submitFeedback: (data) => api.post('/feedback', data),
  getPatientFeedback: () => api.get('/feedback/patient'),
  getDoctorFeedback: (doctorId) => api.get(`/feedback/doctor/${doctorId}`),
  getDoctorAverageRating: (doctorId) => api.get(`/feedback/doctor/${doctorId}/average`),
};
