import { useEffect, useState } from 'react'
import { FaEdit, FaTrash } from 'react-icons/fa'
import PageHeader from '../components/PageHeader'
import Modal from '../components/Modal'
import PatientForm from '../components/PatientForm'
import { patientsApi } from '../api/patientsApi'
import { assurancesApi } from '../api/assurancesApi'
import '../styles/table.css'
import './Patients.css'

function Patients() {
  const [patients, setPatients] = useState([])
  const [assurances, setAssurances] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)

  const [editingPatient, setEditingPatient] = useState(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState(null)

  const loadData = async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const [patientsData, assurancesData] = await Promise.all([
        patientsApi.list(),
        assurancesApi.list(),
      ])
      setPatients(patientsData)
      setAssurances(assurancesData)
    } catch (err) {
      setLoadError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const openCreateForm = () => {
    setEditingPatient(null)
    setFormError(null)
    setIsFormOpen(true)
  }

  const openEditForm = (patient) => {
    setEditingPatient({
      ...patient,
      assurances: patient.assurances.map((a) => ({
        assuranceId: a.assuranceId,
        numeroMatricule: a.numeroMatricule || '',
      })),
    })
    setFormError(null)
    setIsFormOpen(true)
  }

  const closeForm = () => {
    setIsFormOpen(false)
    setEditingPatient(null)
  }

  const handleSubmit = async (payload) => {
    setSubmitting(true)
    setFormError(null)
    try {
      if (editingPatient) {
        await patientsApi.update(editingPatient.id, payload)
      } else {
        await patientsApi.create(payload)
      }
      closeForm()
      await loadData()
    } catch (err) {
      setFormError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (patient) => {
    if (!window.confirm(`Supprimer le patient ${patient.prenom} ${patient.nom} ?`)) {
      return
    }
    try {
      await patientsApi.remove(patient.id)
      await loadData()
    } catch (err) {
      window.alert(err.message)
    }
  }

  return (
    <main className="patients-page">
      <PageHeader
        title="Patients"
        subtitle="Liste des patients enregistrés à la clinique"
        actionLabel="Nouveau patient"
        onAction={openCreateForm}
      />

      <div className="data-table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Nom</th>
              <th>Prénom</th>
              <th>Date de naissance</th>
              <th>Téléphone</th>
              <th>Quartier</th>
              <th>Profession</th>
              <th>Assurances</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr className="empty-row">
                <td colSpan={8}>Chargement...</td>
              </tr>
            )}
            {!loading && loadError && (
              <tr className="empty-row">
                <td colSpan={8}>Erreur : {loadError}</td>
              </tr>
            )}
            {!loading && !loadError && patients.length === 0 && (
              <tr className="empty-row">
                <td colSpan={8}>Aucun patient enregistré pour le moment.</td>
              </tr>
            )}
            {!loading &&
              !loadError &&
              patients.map((patient) => (
                <tr key={patient.id}>
                  <td>{patient.nom}</td>
                  <td>{patient.prenom}</td>
                  <td>{patient.dateNaissance || '—'}</td>
                  <td>{patient.numeroTelephone || '—'}</td>
                  <td>{patient.quartier || '—'}</td>
                  <td>{patient.profession || '—'}</td>
                  <td>
                    <div className="table-badges">
                      {patient.assurances.length === 0 && '—'}
                      {patient.assurances.map((a) => (
                        <span key={a.assuranceId} className="table-badge">
                          {a.libelle}
                          {a.numeroMatricule ? ` · ${a.numeroMatricule}` : ''}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td>
                    <div className="table-actions">
                      <button
                        type="button"
                        className="table-action-btn"
                        onClick={() => openEditForm(patient)}
                      >
                        <FaEdit /> Modifier
                      </button>
                      <button
                        type="button"
                        className="table-action-btn danger"
                        onClick={() => handleDelete(patient)}
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {isFormOpen && (
        <Modal
          title={editingPatient ? 'Modifier le patient' : 'Nouveau patient'}
          onClose={closeForm}
        >
          <PatientForm
            initialValue={editingPatient}
            assurances={assurances}
            onSubmit={handleSubmit}
            onCancel={closeForm}
            submitting={submitting}
            serverError={formError}
          />
        </Modal>
      )}
    </main>
  )
}

export default Patients
