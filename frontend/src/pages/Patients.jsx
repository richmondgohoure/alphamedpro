import { useEffect, useState } from 'react'
import { FaEdit, FaTrash, FaSearch, FaFileMedical } from 'react-icons/fa'
import PageHeader from '../components/PageHeader'
import Modal from '../components/Modal'
import PatientForm from '../components/PatientForm'
import PriseEnChargeForm from '../components/PriseEnChargeForm'
import { patientsApi } from '../api/patientsApi'
import { assurancesApi } from '../api/assurancesApi'
import '../styles/table.css'
import './Patients.css'

const formatDate = (isoDate) => {
  if (!isoDate) return null
  const [year, month, day] = isoDate.split('-')
  return `${day}/${month}/${year}`
}

function Patients() {
  const [patients, setPatients] = useState([])
  const [assurances, setAssurances] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')

  const [editingPatient, setEditingPatient] = useState(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState(null)

  const [cardPatient, setCardPatient] = useState(null)
  const [cardCode, setCardCode] = useState('')
  const [cardSubmitting, setCardSubmitting] = useState(false)
  const [cardError, setCardError] = useState(null)

  const [priseEnChargePatient, setPriseEnChargePatient] = useState(null)

  const loadData = async (query = searchTerm) => {
    setLoading(true)
    setLoadError(null)
    try {
      const [patientsData, assurancesData] = await Promise.all([
        patientsApi.list(query),
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

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData(searchTerm)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchTerm])

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value)
  }

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

  const openPriseEnCharge = (patient) => {
    setPriseEnChargePatient(patient)
  }

  const closePriseEnCharge = () => {
    setPriseEnChargePatient(null)
  }

  const openCardModal = (patient) => {
    setCardPatient(patient)
    setCardCode('')
    setCardError(null)
  }

  const closeCardModal = () => {
    setCardPatient(null)
    setCardCode('')
    setCardError(null)
  }

  const handleAssociateCard = async (e) => {
    e.preventDefault()
    if (!cardCode.trim()) {
      setCardError('Le code de la carte est obligatoire')
      return
    }
    setCardSubmitting(true)
    setCardError(null)
    try {
      await patientsApi.update(cardPatient.id, {
        ...cardPatient,
        code: cardCode.trim(),
      })
      closeCardModal()
      await loadData(searchTerm)
    } catch (err) {
      setCardError(err.message)
    } finally {
      setCardSubmitting(false)
    }
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
      />

      <div className="search-bar-wrapper">
        <div className="search-bar">
          <div className="search-input-group">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Rechercher par nom, prénom, téléphone ou code patient..."
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </div>
        </div>

        <button type="button" className="new-patient-button" onClick={openCreateForm}>
          + Nouveau patient
        </button>
      </div>

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
              <>
                {[...Array(5)].map((_, i) => (
                  <tr key={`skeleton-${i}`} className="skeleton-row">
                    <td><div className="skeleton-cell"></div></td>
                    <td><div className="skeleton-cell"></div></td>
                    <td><div className="skeleton-cell"></div></td>
                    <td><div className="skeleton-cell"></div></td>
                    <td><div className="skeleton-cell"></div></td>
                    <td><div className="skeleton-cell"></div></td>
                    <td><div className="skeleton-cell"></div></td>
                    <td><div className="skeleton-cell"></div></td>
                  </tr>
                ))}
              </>
            )}
            {!loading && loadError && (
              <tr className="empty-row error-row">
                <td colSpan={8}>
                  <div className="error-message">
                    <span>⚠️ Erreur : {loadError}</span>
                  </div>
                </td>
              </tr>
            )}
            {!loading && !loadError && patients.length === 0 && (
              <tr className="empty-row">
                <td colSpan={8}>
                  <div className="empty-message">
                    <span>Aucun patient enregistré pour le moment.</span>
                  </div>
                </td>
              </tr>
            )}
            {!loading &&
              !loadError &&
              patients.map((patient) => (
                <tr key={patient.id}>
                  <td>{patient.nom}</td>
                  <td>{patient.prenom}</td>
                  <td>{formatDate(patient.dateNaissance) || '—'}</td>
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
                        onClick={() => openCardModal(patient)}
                        title={patient.code ? `Carte: ${patient.code}` : 'Associer une carte'}
                      >
                        🎫 {patient.code ? 'Carte' : 'Associer carte'}
                      </button>
                      <button
                        type="button"
                        className="table-action-btn"
                        onClick={() => openEditForm(patient)}
                      >
                        <FaEdit /> Modifier
                      </button>
                      <button
                        type="button"
                        className="table-action-btn"
                        onClick={() => openPriseEnCharge(patient)}
                      >
                        <FaFileMedical /> Prise en charge
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

      {priseEnChargePatient && (
        <Modal
          title={`Prise en charge — ${priseEnChargePatient.prenom} ${priseEnChargePatient.nom}`}
          onClose={closePriseEnCharge}
          size="large"
        >
          <PriseEnChargeForm patient={priseEnChargePatient} />
        </Modal>
      )}

      {cardPatient && (
        <Modal
          title={`Associer une carte — ${cardPatient.prenom} ${cardPatient.nom}`}
          onClose={closeCardModal}
        >
          <form onSubmit={handleAssociateCard} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {cardError && (
              <div style={{
                padding: 12,
                background: '#fdecea',
                color: '#c0392b',
                borderRadius: 8,
                fontSize: 14,
              }}>
                {cardError}
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-dark)' }}>
                Code de la carte patient
              </label>
              <input
                type="text"
                autoFocus
                placeholder="Ex: ALPH-2024-001"
                value={cardCode}
                onChange={(e) => setCardCode(e.target.value)}
                style={{
                  padding: 12,
                  border: '1px solid var(--violet-200)',
                  borderRadius: 8,
                  fontSize: 15,
                  fontFamily: 'inherit',
                  color: 'var(--text-dark)',
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={closeCardModal}
                style={{
                  padding: '10px 24px',
                  border: 'none',
                  background: 'var(--violet-50)',
                  color: 'var(--violet-700)',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontSize: 14,
                  fontWeight: 600,
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => e.target.style.background = 'var(--violet-100)'}
                onMouseLeave={(e) => e.target.style.background = 'var(--violet-50)'}
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={cardSubmitting}
                style={{
                  padding: '10px 24px',
                  border: 'none',
                  background: 'var(--violet-600)',
                  color: 'white',
                  borderRadius: 8,
                  cursor: cardSubmitting ? 'not-allowed' : 'pointer',
                  fontSize: 14,
                  fontWeight: 600,
                  transition: 'all 0.2s',
                  opacity: cardSubmitting ? 0.7 : 1,
                }}
                onMouseEnter={(e) => !cardSubmitting && (e.target.style.background = 'var(--violet-700)')}
                onMouseLeave={(e) => !cardSubmitting && (e.target.style.background = 'var(--violet-600)')}
              >
                {cardSubmitting ? 'Association...' : 'Associer'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </main>
  )
}

export default Patients
