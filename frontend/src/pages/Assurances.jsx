import { useEffect, useState } from 'react'
import { FaEdit, FaTrash } from 'react-icons/fa'
import PageHeader from '../components/PageHeader'
import Modal from '../components/Modal'
import AssuranceForm from '../components/AssuranceForm'
import { assurancesApi } from '../api/assurancesApi'
import { garantsApi } from '../api/garantsApi'
import '../styles/table.css'
import './Assurances.css'

function Assurances() {
  const [assurances, setAssurances] = useState([])
  const [garants, setGarants] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)

  const [editingAssurance, setEditingAssurance] = useState(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState(null)

  const loadData = async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const [assurancesData, garantsData] = await Promise.all([
        assurancesApi.list(),
        garantsApi.list(),
      ])
      setAssurances(assurancesData)
      setGarants(garantsData)
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
    setEditingAssurance(null)
    setFormError(null)
    setIsFormOpen(true)
  }

  const openEditForm = (assurance) => {
    setEditingAssurance({
      ...assurance,
      garantIds: assurance.garants.map((g) => g.id),
    })
    setFormError(null)
    setIsFormOpen(true)
  }

  const closeForm = () => {
    setIsFormOpen(false)
    setEditingAssurance(null)
  }

  const handleGarantCreated = (created) => {
    setGarants((prev) => [...prev, created])
  }

  const handleSubmit = async (payload) => {
    setSubmitting(true)
    setFormError(null)
    try {
      if (editingAssurance) {
        await assurancesApi.update(editingAssurance.id, payload)
      } else {
        await assurancesApi.create(payload)
      }
      closeForm()
      await loadData()
    } catch (err) {
      setFormError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (assurance) => {
    if (!window.confirm(`Supprimer l'assurance ${assurance.libelle} ?`)) {
      return
    }
    try {
      await assurancesApi.remove(assurance.id)
      await loadData()
    } catch (err) {
      window.alert(err.message)
    }
  }

  const handleDeleteGarant = async (garant) => {
    if (!window.confirm(`Supprimer le garant ${garant.libelle} ?`)) {
      return
    }
    try {
      await garantsApi.remove(garant.id)
      await loadData()
    } catch (err) {
      window.alert(err.message)
    }
  }

  return (
    <main className="assurances-page">
      <PageHeader
        title="Assurances"
        subtitle="Compagnies d'assurance, grilles tarifaires et garants"
        actionLabel="Nouvelle assurance"
        onAction={openCreateForm}
      />

      <div className="data-table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Libellé</th>
              <th>NCC</th>
              <th>Téléphone</th>
              <th>Email</th>
              <th>Patients affiliés</th>
              <th>Garants</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr className="empty-row">
                <td colSpan={7}>Chargement...</td>
              </tr>
            )}
            {!loading && loadError && (
              <tr className="empty-row">
                <td colSpan={7}>Erreur : {loadError}</td>
              </tr>
            )}
            {!loading && !loadError && assurances.length === 0 && (
              <tr className="empty-row">
                <td colSpan={7}>Aucune assurance enregistrée pour le moment.</td>
              </tr>
            )}
            {!loading &&
              !loadError &&
              assurances.map((assurance) => (
                <tr key={assurance.id}>
                  <td>{assurance.libelle}</td>
                  <td>{assurance.ncc || '—'}</td>
                  <td>{assurance.numeroTelephone || '—'}</td>
                  <td>{assurance.email || '—'}</td>
                  <td>{assurance.nombrePatients}</td>
                  <td>
                    <div className="table-badges">
                      {assurance.garants.length === 0 && '—'}
                      {assurance.garants.map((g) => (
                        <span key={g.id} className="table-badge">
                          {g.libelle}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td>
                    <div className="table-actions">
                      <button
                        type="button"
                        className="table-action-btn"
                        onClick={() => openEditForm(assurance)}
                      >
                        <FaEdit /> Modifier
                      </button>
                      <button
                        type="button"
                        className="table-action-btn danger"
                        onClick={() => handleDelete(assurance)}
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

      {garants.length > 0 && (
        <section className="garants-section">
          <h2>Tous les garants</h2>
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Libellé</th>
                  <th>Téléphone</th>
                  <th>Email</th>
                  <th>Assurances garanties</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {garants.map((garant) => (
                  <tr key={garant.id}>
                    <td>{garant.libelle}</td>
                    <td>{garant.numeroTelephone || '—'}</td>
                    <td>{garant.email || '—'}</td>
                    <td>{garant.nombreAssurances}</td>
                    <td>
                      <div className="table-actions">
                        <button
                          type="button"
                          className="table-action-btn danger"
                          onClick={() => handleDeleteGarant(garant)}
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
        </section>
      )}

      {isFormOpen && (
        <Modal
          title={editingAssurance ? "Modifier l'assurance" : 'Nouvelle assurance'}
          onClose={closeForm}
          size="large"
        >
          <AssuranceForm
            initialValue={editingAssurance}
            garants={garants}
            onGarantCreated={handleGarantCreated}
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

export default Assurances
