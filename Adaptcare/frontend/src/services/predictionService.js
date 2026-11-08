import api from './api';

export const predictionService = {
  predictWaitTime: (data) => api.post('/predictions/wait-time', data),
  predictDemand: (data) => api.post('/predictions/demand', data),
};
