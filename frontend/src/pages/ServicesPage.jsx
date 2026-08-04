import { useEffect, useState } from 'react'
import { FaEdit, FaTrash } from 'react-icons/fa'
import PageHeader from '../components/PageHeader'
import Modal from '../components/Modal'
import { servicesApi } from '../api/servicesApi'
import '../styles/table.css'
import '../styles/form.css'
import './GestionActes.css'

const initialForm = { libelle: '' }

function ServicesPage() {
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [form, setForm] = useState(initialForm)
  const [editingService, setEditingService] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState(null)

  const loadData = async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const data = await servicesApi.list()
      setServices(data)
    } catch (err) {
      setLoadError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const openCreate = () => {
    setEditingService(null)
    setForm(initialForm)
    setFormError(null)
    setIsModalOpen(true)
  }

  const openEdit = (service) => {
    setEditingService(service)
    setForm({ libelle: service.libelle })
    setFormError(null)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingService(null)
    setForm(initialForm)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setFormError(null)
    try {
      const payload = { libelle: form.libelle.trim() }
      if (editingService) {
        await servicesApi.update(editingService.id, payload)
      } else {
        await servicesApi.create(payload)
      }
      closeModal()
      await loadData()
    } catch (err) {
      setFormError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (service) => {
    if (!window.confirm(`Supprimer le service ${service.libelle} ?`)) {
      return
    }
    try {
      await servicesApi.remove(service.id)
      await loadData()
    } catch (err) {
      window.alert(err.message)
    }
  }

  return (
    <main className="management-page">
      <PageHeader
        title="Services"
        subtitle="Gérez les services de la clinique : IMAGERIE, LABORATOIRE, GYNECOLOGIE, PEDIATRIE"
        actionLabel="Nouveau service"
        onAction={openCreate}
      />

      <section className="management-section">
        <div className="section-title-row">
          <h2>Liste des services</h2>
          <button type="button" className="page-header-action" onClick={openCreate}>
            Nouveau service
          </button>
        </div>
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Libellé</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr className="empty-row">
                  <td colSpan={2}>Chargement...</td>
                </tr>
              )}
              {!loading && loadError && (
                <tr className="empty-row">
                  <td colSpan={2}>Erreur : {loadError}</td>
                </tr>
              )}
              {!loading && !loadError && services.length === 0 && (
                <tr className="empty-row">
                  <td colSpan={2}>Aucun service enregistré.</td>
                </tr>
              )}
              {!loading &&
                !loadError &&
                services.map((service) => (
                  <tr key={service.id}>
                    <td>{service.libelle}</td>
                    <td>
                      <div className="table-actions">
                        <button type="button" className="table-action-btn" onClick={() => openEdit(service)}>
                          <FaEdit /> Modifier
                        </button>
                        <button type="button" className="table-action-btn danger" onClick={() => handleDelete(service)}>
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

      {isModalOpen && (
        <Modal title={editingService ? 'Modifier le service' : 'Nouveau service'} onClose={closeModal} size="medium">
          <form onSubmit={handleSubmit}>
            {formError && <div className="form-error-banner">{formError}</div>}
            <div className="form-grid">
              <div className="form-field full-width">
                <label htmlFor="service-libelle">Libellé</label>
                <input id="service-libelle" value={form.libelle} onChange={(event) => setForm({ libelle: event.target.value })} required />
              </div>
            </div>
            <div className="form-actions">
              <button type="button" className="btn-secondary" onClick={closeModal}>
                Annuler
              </button>
              <button type="submit" className="btn-primary" disabled={submitting}>
                {submitting ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </main>
  )
}

export default ServicesPage
