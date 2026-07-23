import { http } from './http'

export const assurancesApi = {
  list: () => http.get('/api/assurances'),
  get: (id) => http.get(`/api/assurances/${id}`),
  create: (payload) => http.post('/api/assurances', payload),
  update: (id, payload) => http.put(`/api/assurances/${id}`, payload),
  remove: (id) => http.delete(`/api/assurances/${id}`),
}
