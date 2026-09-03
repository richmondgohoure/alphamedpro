import { http } from './http'

export const medecinsApi = {
  list: (search, typeMedecin) => {
    const params = new URLSearchParams()
    if (search) params.append('search', search)
    if (typeMedecin && typeMedecin !== 'ALL') params.append('typeMedecin', typeMedecin)
    const query = params.toString()
    return http.get(query ? `/api/medecins?${query}` : '/api/medecins')
  },
  get: (id) => http.get(`/api/medecins/${id}`),
  create: (payload) => http.post('/api/medecins', payload),
  update: (id, payload) => http.put(`/api/medecins/${id}`, payload),
  remove: (id) => http.delete(`/api/medecins/${id}`),
}
