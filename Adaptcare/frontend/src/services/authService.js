import api from './api';

export const authService = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (data) => api.post('/auth/register', data),
  doctorRegister: (data) => api.post('/auth/doctor-register', data),
  getCurrentUser: () => api.get('/auth/me'),
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
};
