import { http } from './http'

export const caisseApi = {
  getVisites: (params = {}) => {
    const query = new URLSearchParams()
    if (params.search) query.append('search', params.search)
    if (params.statut) query.append('statut', params.statut)
    if (params.date) query.append('date', params.date)
    const qs = query.toString()
    return http.get(`/api/visites${qs ? `?${qs}` : ''}`)
  },

  getVisiteById: (visiteId) => http.get(`/api/visites/${visiteId}`),

  enregistrerVersement: (visiteId, data) =>
    http.post(`/api/visites/${visiteId}/versements`, data),

  getVersementsByVisite: (visiteId) =>
    http.get(`/api/visites/${visiteId}/versements`),

  getVersementById: (versementId) =>
    http.get(`/api/versements/${versementId}`),

  getAllVersements: () => http.get('/api/versements'),

  getVersementsByPatient: (patientId) =>
    http.get(`/api/patients/${patientId}/versements`),
}
