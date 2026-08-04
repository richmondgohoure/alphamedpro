import { http } from './http'

export const servicesApi = {
  list: () => http.get('/api/services'),
  get: (id) => http.get(`/api/services/${id}`),
  create: (payload) => http.post('/api/services', payload),
  update: (id, payload) => http.put(`/api/services/${id}`, payload),
  remove: (id) => http.delete(`/api/services/${id}`),
}
