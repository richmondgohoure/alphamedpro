import { http } from './http'

export const dossierPatientApi = {
  getByPatientId: (patientId) => http.get(`/api/patients/${patientId}/dossier`),
  getById: (id) => http.get(`/api/dossiers/${id}`),
  getByNumeroDossier: (numeroDossier) => http.get(`/api/dossiers/numero/${encodeURIComponent(numeroDossier)}`),
  updateDossier: (patientId, payload) => http.put(`/api/patients/${patientId}/dossier`, payload),
  addAntecedent: (patientId, payload) => http.post(`/api/patients/${patientId}/dossier/antecedents`, payload),
  updateAntecedent: (antecedentId, payload) => http.put(`/api/dossiers/antecedents/${antecedentId}`, payload),
  deleteAntecedent: (antecedentId) => http.delete(`/api/dossiers/antecedents/${antecedentId}`),
  associerExistants: () => http.post('/api/dossiers/associer-existants'),
}
