import { http } from './http'

export const visitesApi = {
  getAll: (params = {}) => {
    const query = new URLSearchParams()
    if (params.search) query.append('search', params.search)
    if (params.statut) query.append('statut', params.statut)
    if (params.date) query.append('date', params.date)
    const qs = query.toString()
    return http.get(`/api/visites${qs ? `?${qs}` : ''}`)
  },

  creerVisite: (patientId, data) =>
    http.post(`/api/patients/${patientId}/visites`, data),

  findByPatient: (patientId) =>
    http.get(`/api/patients/${patientId}/visites`),

  findById: (visiteId) =>
    http.get(`/api/visites/${visiteId}`),

  updateVisite: (visiteId, data) =>
    http.put(`/api/visites/${visiteId}`, data),

  findByPriseEnCharge: (priseEnChargeId) =>
    http.get(`/api/prises-en-charge/${priseEnChargeId}/visite`),

  findSousFactureById: (sousFactureId) =>
    http.get(`/api/sous-factures/${sousFactureId}`),

  updateSousFacture: (sousFactureId, data) =>
    http.put(`/api/sous-factures/${sousFactureId}`, data),

  deleteSousFacture: (sousFactureId) =>
    http.delete(`/api/sous-factures/${sousFactureId}`),

  findSousFacturesByPatient: (patientId) =>
    http.get(`/api/patients/${patientId}/sous-factures`),
}
