import { http } from './http'

export const priseEnChargeApi = {
  listByPatient: (patientId) => http.get(`/api/patients/${patientId}/prises-en-charge`),
  create: (patientId, payload) => http.post(`/api/patients/${patientId}/prises-en-charge`, payload),
  update: (id, payload) => http.put(`/api/prises-en-charge/${id}`, payload),
  remove: (id) => http.delete(`/api/prises-en-charge/${id}`),
}
