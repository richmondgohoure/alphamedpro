import { useEffect, useState } from 'react'
import {
  FaEdit,
  FaTrash,
  FaSearch,
  FaFileMedical,
  FaPlus,
  FaUserInjured,
  FaIdCard,
  FaPhoneAlt,
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaBriefcase,
  FaShieldAlt,
  FaHandshake,
  FaTimes,
  FaFolderOpen,
  FaListUl,
} from 'react-icons/fa'
import PageHeader from '../components/PageHeader'
import Modal from '../components/Modal'
import PatientForm from '../components/PatientForm'
import DossierPatientModal from '../components/DossierPatientModal'
import ListeVisitesModal from '../components/ListeVisitesModal'
import PriseEnChargePage from './PriseEnChargePage'
import { patientsApi } from '../api/patientsApi'
import { assurancesApi } from '../api/assurancesApi'
import { formatDate } from '../utils/dateUtils'
import '../styles/table.css'
import '../styles/form.css'
import './Patients.css'

function getInitials(nom, prenom) {
  const n = (nom || '').trim()
  const p = (prenom || '').trim()
  const first = n ? n[0].toUpperCase() : ''
  const second = p ? p[0].toUpperCase() : ''
  return `${first}${second}` || 'P'
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
  const [editingVisite, setEditingVisite] = useState(null)
  const [dossierModalPatient, setDossierModalPatient] = useState(null)
  const [isVisitesListOpen, setIsVisitesListOpen] = useState(false)

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
      assurances: (patient.assurances || []).map((a) => ({
        assuranceId: a.assuranceId,
        garantId: a.garantId || '',
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
    setEditingVisite(null)
    setPriseEnChargePatient(patient)
  }

  const closePriseEnCharge = () => {
    const wasEditing = !!editingVisite
    setPriseEnChargePatient(null)
    setEditingVisite(null)
    if (wasEditing) {
      setIsVisitesListOpen(true)
    }
  }

  const handleEditVisiteFromList = async (visite) => {
    setIsVisitesListOpen(false)
    let pat = patients.find((p) => p.id === visite.patientId)
    if (!pat) {
      try {
        pat = await patientsApi.get(visite.patientId)
      } catch (err) {
        console.error('Erreur récupération patient:', err)
      }
    }
    const patientObj = pat || {
      id: visite.patientId,
      nom: visite.patientNom || '',
      prenom: visite.patientPrenom || '',
      numeroDossier: visite.patientNumeroDossier || '',
      assurances: [],
    }
    setEditingVisite(visite)
    setPriseEnChargePatient(patientObj)
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

    if (payload.nom && payload.numeroTelephone) {
      const nomClean = payload.nom.trim().toLowerCase()
      const telClean = payload.numeroTelephone.trim().toLowerCase()
      const duplicate = patients.find((p) => {
        if (editingPatient && p.id === editingPatient.id) return false
        return (
          p.nom?.trim().toLowerCase() === nomClean &&
          p.numeroTelephone?.trim().toLowerCase() === telClean
        )
      })
      if (duplicate) {
        setFormError('Un patient avec le même nom et le même numéro de téléphone existe déjà.')
        setSubmitting(false)
        return
      }
    }

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

  if (priseEnChargePatient) {
    return (
      <PriseEnChargePage
        patient={priseEnChargePatient}
        initialVisite={editingVisite}
        onBack={closePriseEnCharge}
        onPatientUpdated={() => loadData(searchTerm)}
      />
    )
  }

  return (
    <main className="management-page patients-management-page">
      <PageHeader
        title="Patients"
        subtitle="Gestion des dossiers médicaux, coordonnées et affiliations d'assurance"
      />

      <section className="management-section patient-section">
        <div className="section-title-row">
          <div className="section-title-group">
            <span className="section-icon patient-icon">
              <FaUserInjured />
            </span>
            <div>
              <h2>Répertoire des Patients</h2>
              <p className="section-subtitle">
                Fiches d'identité, contacts, cartes et historique de couverture médicale
              </p>
            </div>
            <span className="count-pill">
              {patients.length} patient{patients.length > 1 ? 's' : ''}
            </span>
          </div>
          <div className="section-actions-group">
            <button
              type="button"
              className="btn-visites-list-header"
              onClick={() => setIsVisitesListOpen(true)}
              title="Consulter l'historique de toutes les visites médicales"
            >
              <FaListUl /> Liste des visites
            </button>
            <button type="button" className="page-header-action" onClick={openCreateForm}>
              <FaPlus /> Nouveau patient
            </button>
          </div>
        </div>

        <div className="patient-search-toolbar">
          <div className="search-input-group">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Rechercher par nom, prénom, téléphone, profession ou code..."
              value={searchTerm}
              onChange={handleSearchChange}
            />
            {searchTerm && (
              <button
                type="button"
                className="search-clear-btn"
                onClick={() => setSearchTerm('')}
                title="Effacer la recherche"
              >
                <FaTimes />
              </button>
            )}
          </div>
          {searchTerm && (
            <span className="search-result-count">
              {patients.length} résultat{patients.length > 1 ? 's' : ''}
            </span>
          )}
        </div>

        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Patient</th>
                <th>N° Dossier</th>
                <th>Code Carte</th>
                <th>Date de naissance</th>
                <th>Téléphone</th>
                <th>Quartier</th>
                <th>Profession</th>
                <th>Couverture Assurance</th>
                <th className="text-right">Actions</th>
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
                      <td><div className="skeleton-cell"></div></td>
                    </tr>
                  ))}
                </>
              )}
              {!loading && loadError && (
                <tr className="empty-row error-row">
                  <td colSpan={9}>
                    <div className="error-message">
                      <span>⚠️ Erreur : {loadError}</span>
                    </div>
                  </td>
                </tr>
              )}
              {!loading && !loadError && patients.length === 0 && (
                <tr className="empty-row">
                  <td colSpan={9}>
                    <div className="empty-message">
                      <span>Aucun patient trouvé. Cliquez sur "Nouveau patient" pour en créer un.</span>
                    </div>
                  </td>
                </tr>
              )}
              {!loading &&
                !loadError &&
                patients.map((patient) => (
                  <tr key={patient.id}>
                    <td>
                      <div className="patient-identity-cell">
                        <div className="patient-avatar-circle">
                          {getInitials(patient.nom, patient.prenom)}
                        </div>
                        <div className="patient-identity-info">
                          <strong className="patient-name">
                            {patient.nom} {patient.prenom}
                          </strong>
                        </div>
                      </div>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="code-pill dp-pill dp-interactive"
                        onClick={() => setDossierModalPatient(patient)}
                        title="Consulter et mettre à jour le dossier médical & les antécédents"
                      >
                        <FaFolderOpen className="pill-icon" />
                        {patient.numeroDossier || `DP-${String(patient.id).padStart(7, '0')}`}
                      </button>
                    </td>
                    <td>
                      {patient.code ? (
                        <span className="code-pill card-pill">
                          <FaIdCard className="pill-icon" />
                          {patient.code}
                        </span>
                      ) : (
                        <button
                          type="button"
                          className="table-action-btn associate-card-chip"
                          onClick={() => openCardModal(patient)}
                          title="Associer une carte patient"
                        >
                          <FaIdCard /> + Carte
                        </button>
                      )}
                    </td>
                    <td>
                      {patient.dateNaissance ? (
                        <span className="cell-flex-item">
                          <FaCalendarAlt className="cell-item-icon" />
                          {formatDate(patient.dateNaissance)}
                        </span>
                      ) : (
                        <span className="cell-muted">—</span>
                      )}
                    </td>
                    <td>
                      {patient.numeroTelephone ? (
                        <span className="phone-pill">
                          <FaPhoneAlt className="cell-item-icon" />
                          {patient.numeroTelephone}
                        </span>
                      ) : (
                        <span className="cell-muted">—</span>
                      )}
                    </td>
                    <td>
                      {patient.quartier ? (
                        <span className="location-pill">
                          <FaMapMarkerAlt className="cell-item-icon" />
                          {patient.quartier}
                        </span>
                      ) : (
                        <span className="cell-muted">—</span>
                      )}
                    </td>
                    <td>
                      {patient.profession ? (
                        <span className="profession-pill">
                          <FaBriefcase className="cell-item-icon" />
                          {patient.profession}
                        </span>
                      ) : (
                        <span className="cell-muted">—</span>
                      )}
                    </td>
                    <td>
                      <div className="table-badges">
                        {patient.assurances.length === 0 ? (
                          <span className="cell-muted">Sans assurance</span>
                        ) : (
                          patient.assurances.map((a) => (
                            <span key={a.assuranceId} className="patient-assurance-badge">
                              <FaShieldAlt className="badge-shield-icon" />
                              <span className="assurance-name">{a.libelle}</span>
                              {a.garantLibelle && (
                                <span className="garant-tag" title="Garant rattaché">
                                  <FaHandshake className="garant-tag-icon" />
                                  {a.garantLibelle}
                                </span>
                              )}
                              {a.numeroMatricule && (
                                <span className="matricule-tag" title="N° Matricule de l'assuré">{a.numeroMatricule}</span>
                              )}
                            </span>
                          ))
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="table-actions justify-end">
                        {patient.code && (
                          <button
                            type="button"
                            className="table-action-btn"
                            onClick={() => openCardModal(patient)}
                            title={`Modifier la carte: ${patient.code}`}
                          >
                            <FaIdCard /> Carte
                          </button>
                        )}
                        <button
                          type="button"
                          className="table-action-btn"
                          onClick={() => openEditForm(patient)}
                          title="Modifier les informations"
                        >
                          <FaEdit /> Modifier
                        </button>
                        <button
                          type="button"
                          className="table-action-btn pec-action-btn"
                          onClick={() => openPriseEnCharge(patient)}
                          title="Créer une nouvelle visite / prise en charge"
                        >
                          <FaFileMedical /> Nouvelle visite
                        </button>
                        <button
                          type="button"
                          className="table-action-btn danger"
                          onClick={() => handleDelete(patient)}
                          title="Supprimer le dossier patient"
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

      {cardPatient && (
        <Modal
          title={`Associer une carte — ${cardPatient.prenom} ${cardPatient.nom}`}
          onClose={closeCardModal}
          size="medium"
        >
          <form onSubmit={handleAssociateCard}>
            {cardError && <div className="form-error-banner">{cardError}</div>}
            <div className="form-grid">
              <div className="form-field full-width">
                <label htmlFor="card-code-input">Code de la carte patient</label>
                <input
                  id="card-code-input"
                  type="text"
                  autoFocus
                  placeholder="Ex: ALPH-2024-001"
                  value={cardCode}
                  onChange={(e) => setCardCode(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="form-actions">
              <button type="button" className="btn-secondary" onClick={closeCardModal}>
                Annuler
              </button>
              <button type="submit" className="btn-primary" disabled={cardSubmitting}>
                {cardSubmitting ? 'Association...' : 'Associer la carte'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {dossierModalPatient && (
        <Modal
          title={`Dossier Médical & Antécédents — ${dossierModalPatient.prenom} ${dossierModalPatient.nom}`}
          onClose={() => setDossierModalPatient(null)}
          size="large"
        >
          <DossierPatientModal
            patient={dossierModalPatient}
            onClose={() => setDossierModalPatient(null)}
            onDossierUpdated={() => loadData(searchTerm)}
          />
        </Modal>
      )}

      {isVisitesListOpen && (
        <ListeVisitesModal
          onClose={() => setIsVisitesListOpen(false)}
          onEditVisite={handleEditVisiteFromList}
        />
      )}
    </main>
  )
}

export default Patients
