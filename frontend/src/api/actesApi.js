import { http } from './http'

export const actesApi = {
  list: () => http.get('/api/actes'),
  get: (id) => http.get(`/api/actes/${id}`),
  create: (payload) => http.post('/api/actes', payload),
  update: (id, payload) => http.put(`/api/actes/${id}`, payload),
  remove: (id) => http.delete(`/api/actes/${id}`),
}
