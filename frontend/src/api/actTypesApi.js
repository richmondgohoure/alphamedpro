import { http } from './http'

export const actTypesApi = {
  list: () => http.get('/api/act-types'),
  get: (id) => http.get(`/api/act-types/${id}`),
  create: (payload) => http.post('/api/act-types', payload),
  update: (id, payload) => http.put(`/api/act-types/${id}`, payload),
  remove: (id) => http.delete(`/api/act-types/${id}`),
}
