import { http } from './http'

export const patientsApi = {
  list: () => http.get('/api/patients'),
  get: (id) => http.get(`/api/patients/${id}`),
  create: (payload) => http.post('/api/patients', payload),
  update: (id, payload) => http.put(`/api/patients/${id}`, payload),
  remove: (id) => http.delete(`/api/patients/${id}`),
}
