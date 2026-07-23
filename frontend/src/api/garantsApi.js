import { http } from './http'

export const garantsApi = {
  list: () => http.get('/api/garants'),
  get: (id) => http.get(`/api/garants/${id}`),
  create: (payload) => http.post('/api/garants', payload),
  update: (id, payload) => http.put(`/api/garants/${id}`, payload),
  remove: (id) => http.delete(`/api/garants/${id}`),
}
