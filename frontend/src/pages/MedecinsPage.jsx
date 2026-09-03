import { useEffect, useState } from 'react'
import {
  FaUserMd,
  FaHospital,
  FaClinicMedical,
  FaPlus,
  FaSearch,
  FaTimes,
  FaEdit,
  FaTrash,
  FaPhoneAlt,
  FaEnvelope,
  FaMapMarkerAlt,
  FaStethoscope,
  FaIdCard,
  FaCheckCircle,
  FaUsers,
  FaEye,
  FaBuilding,
  FaThLarge,
  FaList,
  FaBriefcaseMedical,
  FaHeartbeat,
  FaFileAlt,
  FaGlobe,
} from 'react-icons/fa'
import PageHeader from '../components/PageHeader'
import Modal from '../components/Modal'
import MedecinForm from '../components/MedecinForm'
import { medecinsApi } from '../api/medecinsApi'
import '../styles/table.css'
import '../styles/form.css'
import './MedecinsPage.css'

function getInitials(nom, prenom) {
  const n = (nom || '').trim()
  const p = (prenom || '').trim()
  const first = n ? n[0].toUpperCase() : ''
  const second = p ? p[0].toUpperCase() : ''
  return `${first}${second}` || 'MD'
}

function MedecinsPage() {
  const [medecins, setMedecins] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('ALL')
  const [specialiteFilter, setSpecialiteFilter] = useState('ALL')
  const [viewMode, setViewMode] = useState('table') // 'table' | 'cards'

  const [editingMedecin, setEditingMedecin] = useState(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState(null)

  const [deletingMedecin, setDeletingMedecin] = useState(null)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [deleteSubmitting, setDeleteSubmitting] = useState(false)

  const [detailMedecin, setDetailMedecin] = useState(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)

  const loadData = async (query = searchTerm, type = typeFilter) => {
    setLoading(true)
    setLoadError(null)
    try {
      const data = await medecinsApi.list(query, type)
      setMedecins(data)
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
      loadData(searchTerm, typeFilter)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchTerm, typeFilter])

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value)
  }

  const handleTypeFilterChange = (type) => {
    setTypeFilter(type)
  }

  const openCreateForm = () => {
    setEditingMedecin(null)
    setFormError(null)
    setIsFormOpen(true)
  }

  const openEditForm = (medecin) => {
    setEditingMedecin(medecin)
    setFormError(null)
    setIsFormOpen(true)
  }

  const closeForm = () => {
    setIsFormOpen(false)
    setEditingMedecin(null)
    setFormError(null)
  }

  const openDetailModal = (medecin) => {
    setDetailMedecin(medecin)
    setIsDetailModalOpen(true)
  }

  const closeDetailModal = () => {
    setDetailMedecin(null)
    setIsDetailModalOpen(false)
  }

  const openDeleteModal = (medecin) => {
    setDeletingMedecin(medecin)
    setIsDeleteModalOpen(true)
  }

  const closeDeleteModal = () => {
    setDeletingMedecin(null)
    setIsDeleteModalOpen(false)
  }

  const handleFormSubmit = async (payload) => {
    setSubmitting(true)
    setFormError(null)
    try {
      if (editingMedecin) {
        await medecinsApi.update(editingMedecin.id, payload)
      } else {
        await medecinsApi.create(payload)
      }
      closeForm()
      await loadData()
    } catch (err) {
      setFormError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deletingMedecin) return
    setDeleteSubmitting(true)
    try {
      await medecinsApi.remove(deletingMedecin.id)
      closeDeleteModal()
      await loadData()
    } catch (err) {
      alert(err.message)
    } finally {
      setDeleteSubmitting(false)
    }
  }

  // Filtrage local selon la spécialité sélectionnée
  const filteredMedecins = medecins.filter((m) => {
    if (specialiteFilter === 'ALL') return true
    return m.specialite === specialiteFilter
  })

  // Extraction unique des spécialités existantes
  const availableSpecialites = Array.from(
    new Set(medecins.map((m) => m.specialite).filter(Boolean))
  ).sort()

  // Calcul des statistiques rapides
  const countTotal = medecins.length
  const countInternes = medecins.filter((m) => (m.typeMedecin || '').toUpperCase() === 'INTERNE').length
  const countExternes = medecins.filter((m) => (m.typeMedecin || '').toUpperCase() === 'EXTERNE').length
  const countSpecialites = availableSpecialites.length

  const pctInternes = countTotal > 0 ? Math.round((countInternes / countTotal) * 100) : 0
  const pctExternes = countTotal > 0 ? Math.round((countExternes / countTotal) * 100) : 0

  return (
    <div className="management-page medecins-management-page">
      <PageHeader
        title="Répertoire du Corps Médical & Praticiens"
        subtitle="Fiches complètes des praticiens internes de la clinique, consultants externes et prescripteurs partenaires."
        actionLabel="Ajouter un médecin"
        onAction={openCreateForm}
      />

      {/* Cartes statistiques KPI */}
      <div className="medecins-kpi-grid">
        <div className="medecin-kpi-card total">
          <div className="kpi-icon-wrapper total-icon">
            <FaUserMd />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Total Praticiens</span>
            <strong className="kpi-value">{countTotal}</strong>
            <span className="kpi-subtext">Médecins & spécialistes enregistrés</span>
          </div>
          <div className="kpi-card-glow total-glow" />
        </div>

        <div className="medecin-kpi-card internes">
          <div className="kpi-icon-wrapper interne-icon">
            <FaClinicMedical />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Praticiens Internes</span>
            <strong className="kpi-value">{countInternes}</strong>
            <span className="kpi-subtext">
              <span className="kpi-badge-pct interne-pct">{pctInternes}%</span> Corps médical clinique
            </span>
          </div>
          <div className="kpi-card-glow interne-glow" />
        </div>

        <div className="medecin-kpi-card externes">
          <div className="kpi-icon-wrapper externe-icon">
            <FaHospital />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Praticiens Externes</span>
            <strong className="kpi-value">{countExternes}</strong>
            <span className="kpi-subtext">
              <span className="kpi-badge-pct externe-pct">{pctExternes}%</span> Prescripteurs partenaires
            </span>
          </div>
          <div className="kpi-card-glow externe-glow" />
        </div>

        <div className="medecin-kpi-card specialites">
          <div className="kpi-icon-wrapper spec-icon">
            <FaStethoscope />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Disciplines Médicales</span>
            <strong className="kpi-value">{countSpecialites}</strong>
            <span className="kpi-subtext">Spécialités représentées</span>
          </div>
          <div className="kpi-card-glow spec-glow" />
        </div>
      </div>

      {/* Section de gestion principale */}
      <section className="management-section medecin-section">
        <div className="section-title-row">
          <div className="section-title-group">
            <div className="section-icon medecin-icon">
              <FaUserMd />
            </div>
            <div>
              <h2>Annuaire des Médecins & Prescripteurs</h2>
              <span className="section-subtitle">
                Consultez, ajoutez ou modifiez les fiches des praticiens et leurs affiliations
              </span>
            </div>
            <span className="count-pill">
              <span className="pulse-indicator" />
              {filteredMedecins.length} {filteredMedecins.length > 1 ? 'praticiens' : 'praticien'}
            </span>
          </div>
        </div>

        {/* Toolbar avec barre de recherche & filtres */}
        <div className="medecins-toolbar">
          <div className="search-box">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Rechercher par nom, prénom, spécialité, centre, contact..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="search-input"
            />
            {searchTerm && (
              <button
                type="button"
                className="clear-search-btn"
                onClick={() => setSearchTerm('')}
                title="Effacer la recherche"
              >
                <FaTimes />
              </button>
            )}
          </div>

          <div className="toolbar-filters-group">
            {/* Filtre Type (Tous / Interne / Externe) */}
            <div className="type-filter-tabs">
              <button
                type="button"
                className={`type-tab ${typeFilter === 'ALL' ? 'active' : ''}`}
                onClick={() => handleTypeFilterChange('ALL')}
              >
                Tous ({countTotal})
              </button>
              <button
                type="button"
                className={`type-tab internal ${typeFilter === 'INTERNE' ? 'active' : ''}`}
                onClick={() => handleTypeFilterChange('INTERNE')}
              >
                <FaClinicMedical className="tab-icon" /> Internes ({countInternes})
              </button>
              <button
                type="button"
                className={`type-tab external ${typeFilter === 'EXTERNE' ? 'active' : ''}`}
                onClick={() => handleTypeFilterChange('EXTERNE')}
              >
                <FaHospital className="tab-icon" /> Externes ({countExternes})
              </button>
            </div>

            {/* Filtre Spécialité */}
            {availableSpecialites.length > 0 && (
              <div className="specialite-filter-wrapper">
                <select
                  value={specialiteFilter}
                  onChange={(e) => setSpecialiteFilter(e.target.value)}
                  className="specialite-filter-select"
                >
                  <option value="ALL">Toutes les spécialités ({availableSpecialites.length})</option>
                  {availableSpecialites.map((spec, i) => (
                    <option key={i} value={spec}>
                      {spec}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Sélecteur de mode de vue (Tableau / Cartes) */}
            <div className="view-mode-toggle" title="Changer le mode d'affichage">
              <button
                type="button"
                className={`view-toggle-btn ${viewMode === 'table' ? 'active' : ''}`}
                onClick={() => setViewMode('table')}
                title="Affichage en tableau"
              >
                <FaList />
                <span>Tableau</span>
              </button>
              <button
                type="button"
                className={`view-toggle-btn ${viewMode === 'cards' ? 'active' : ''}`}
                onClick={() => setViewMode('cards')}
                title="Affichage en cartes trombinoscope"
              >
                <FaThLarge />
                <span>Cartes</span>
              </button>
            </div>
          </div>
        </div>

        {/* Puces de filtres rapides par spécialités populaires */}
        {availableSpecialites.length > 1 && (
          <div className="specialites-quick-bar">
            <span className="quick-bar-label">Filtres rapides :</span>
            <div className="quick-bar-scroll">
              <button
                type="button"
                className={`quick-spec-chip ${specialiteFilter === 'ALL' ? 'active' : ''}`}
                onClick={() => setSpecialiteFilter('ALL')}
              >
                Toutes ({countTotal})
              </button>
              {availableSpecialites.map((spec, idx) => {
                const count = medecins.filter((m) => m.specialite === spec).length
                return (
                  <button
                    key={idx}
                    type="button"
                    className={`quick-spec-chip ${specialiteFilter === spec ? 'active' : ''}`}
                    onClick={() => setSpecialiteFilter(spec)}
                  >
                    <FaStethoscope className="chip-icon" />
                    <span>{spec}</span>
                    <span className="chip-count">{count}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Affichage des états d'erreur / chargement / tableau / cartes */}
        {loadError && (
          <div className="error-banner">
            <strong>Erreur de chargement :</strong> {loadError}
          </div>
        )}

        {viewMode === 'table' ? (
          <div className="data-table-wrapper">
            <table className="data-table medecins-table">
              <thead>
                <tr>
                  <th style={{ width: '280px' }}>Praticien & Identité</th>
                  <th style={{ width: '200px' }}>Spécialité</th>
                  <th style={{ width: '150px' }}>Statut</th>
                  <th style={{ width: '240px' }}>Établissement / Centre</th>
                  <th style={{ width: '230px' }}>Contacts</th>
                  <th style={{ width: '160px' }}>Bureau / Adresse</th>
                  <th style={{ width: '130px', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr className="empty-row loading-row">
                    <td colSpan={7}>
                      <div className="medecin-loading-state">
                        <div className="medecin-spinner"></div>
                        <span>Chargement des fiches médecins...</span>
                      </div>
                    </td>
                  </tr>
                )}
                {!loading && filteredMedecins.length === 0 && (
                  <tr className="empty-row">
                    <td colSpan={7}>
                      <div className="medecin-empty-state">
                        <div className="medecin-empty-icon-wrap">
                          <FaUserMd />
                        </div>
                        <h3 className="medecin-empty-title">Aucun médecin trouvé</h3>
                        <p className="medecin-empty-desc">
                          {searchTerm || typeFilter !== 'ALL' || specialiteFilter !== 'ALL'
                            ? 'Aucun praticien ne correspond aux critères de recherche ou aux filtres sélectionnés.'
                            : 'Aucun médecin n\'est enregistré dans l\'annuaire pour le moment.'}
                        </p>
                        {searchTerm || typeFilter !== 'ALL' || specialiteFilter !== 'ALL' ? (
                          <button
                            type="button"
                            className="medecin-empty-action-btn"
                            onClick={() => {
                              setSearchTerm('')
                              setTypeFilter('ALL')
                              setSpecialiteFilter('ALL')
                            }}
                          >
                            <FaTimes /> Réinitialiser les filtres
                          </button>
                        ) : (
                          <button type="button" className="medecin-empty-action-btn primary" onClick={openCreateForm}>
                            <FaPlus /> Ajouter un médecin
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
                {!loading &&
                  filteredMedecins.map((medecin) => {
                  const isInterne = (medecin.typeMedecin || '').toUpperCase() === 'INTERNE'
                  return (
                    <tr key={medecin.id} className="medecin-row">
                      {/* Praticien & Identité */}
                      <td>
                        <div className="medecin-identity-cell">
                          <div className={`medecin-avatar ${isInterne ? 'internal-avatar' : 'external-avatar'}`}>
                            {getInitials(medecin.nom, medecin.prenom)}
                            <span className={`avatar-status-dot ${isInterne ? 'dot-internal' : 'dot-external'}`} />
                          </div>
                          <div className="medecin-identity-info">
                            <div className="medecin-name-row">
                              <span className="medecin-title-tag">{medecin.titre || 'Dr.'}</span>
                              <strong className="medecin-full-name">
                                {medecin.nom} {medecin.prenom}
                              </strong>
                            </div>
                            {medecin.code ? (
                              <span className="medecin-code-badge" title="Code / Matricule">
                                <FaIdCard className="code-icon" /> {medecin.code}
                              </span>
                            ) : (
                              <span className="medecin-code-badge placeholder-code">
                                <FaIdCard className="code-icon" /> N/A
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Spécialité */}
                      <td>
                        <span className="specialite-badge">
                          <FaStethoscope className="spec-badge-icon" />
                          <span>{medecin.specialite}</span>
                        </span>
                      </td>

                      {/* Statut Interne / Externe */}
                      <td>
                        {isInterne ? (
                          <span className="status-pill status-internal" title="Praticien au sein de la clinique">
                            <FaClinicMedical className="status-pill-icon" />
                            Praticien Interne
                          </span>
                        ) : (
                          <span className="status-pill status-external" title="Prescripteur externe / partenaire">
                            <FaHospital className="status-pill-icon" />
                            Praticien Externe
                          </span>
                        )}
                      </td>

                      {/* Établissement / Centre de santé */}
                      <td>
                        {isInterne ? (
                          <div className="centre-sante-cell internal-centre" title="Praticien Interne">
                            <FaClinicMedical className="centre-icon internal-icon" />
                            <strong className="centre-name">Interne</strong>
                          </div>
                        ) : medecin.centreDeSante ? (
                          <div className="centre-sante-cell external-centre" title={medecin.centreDeSante}>
                            <FaHospital className="centre-icon" />
                            <strong className="centre-name">{medecin.centreDeSante}</strong>
                          </div>
                        ) : (
                          <span className="centre-empty-tag">Cabinet privé / Libéral</span>
                        )}
                      </td>

                      {/* Contacts */}
                      <td>
                        <div className="medecin-contacts-cell">
                          {medecin.numeroTelephone && (
                            <a
                              href={`tel:${medecin.numeroTelephone}`}
                              className="contact-pill phone-pill"
                              title="Appeler le médecin"
                            >
                              <FaPhoneAlt className="contact-icon" />
                              <span>{medecin.numeroTelephone}</span>
                            </a>
                          )}
                          {medecin.email && (
                            <a
                              href={`mailto:${medecin.email}`}
                              className="contact-pill email-pill"
                              title={`Envoyer un email à ${medecin.email}`}
                            >
                              <FaEnvelope className="contact-icon" />
                              <span>{medecin.email}</span>
                            </a>
                          )}
                        </div>
                      </td>

                      {/* Adresse / Bureau */}
                      <td>
                        {medecin.adresse ? (
                          <span className="adresse-cell" title={medecin.adresse}>
                            <FaMapMarkerAlt className="adresse-icon" />
                            <span>{medecin.adresse}</span>
                          </span>
                        ) : (
                          <span className="text-muted-dash">—</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td style={{ textAlign: 'center' }}>
                        <div className="table-actions">
                          <button
                            type="button"
                            className="table-action-btn view-btn"
                            title="Voir la fiche détaillée"
                            onClick={() => openDetailModal(medecin)}
                          >
                            <FaEye />
                          </button>
                          <button
                            type="button"
                            className="table-action-btn edit-btn"
                            title="Modifier ce médecin"
                            onClick={() => openEditForm(medecin)}
                          >
                            <FaEdit />
                          </button>
                          <button
                            type="button"
                            className="table-action-btn delete-btn"
                            title="Supprimer ce médecin"
                            onClick={() => openDeleteModal(medecin)}
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : loading ? (
          <div className="medecin-loading-state">
            <div className="medecin-spinner"></div>
            <span>Chargement des fiches médecins...</span>
          </div>
        ) : filteredMedecins.length === 0 ? (
          <div className="medecin-empty-state cards-empty">
            <div className="medecin-empty-icon-wrap">
              <FaUserMd />
            </div>
            <h3 className="medecin-empty-title">Aucun médecin trouvé</h3>
            <p className="medecin-empty-desc">
              {searchTerm || typeFilter !== 'ALL' || specialiteFilter !== 'ALL'
                ? 'Aucun praticien ne correspond aux critères de recherche ou aux filtres sélectionnés.'
                : 'Aucun médecin n\'est enregistré dans l\'annuaire pour le moment.'}
            </p>
            {searchTerm || typeFilter !== 'ALL' || specialiteFilter !== 'ALL' ? (
              <button
                type="button"
                className="medecin-empty-action-btn"
                onClick={() => {
                  setSearchTerm('')
                  setTypeFilter('ALL')
                  setSpecialiteFilter('ALL')
                }}
              >
                <FaTimes /> Réinitialiser les filtres
              </button>
            ) : (
              <button type="button" className="medecin-empty-action-btn primary" onClick={openCreateForm}>
                <FaPlus /> Ajouter un médecin
              </button>
            )}
          </div>
        ) : (
          /* Vue Cartes / Trombinoscope */
          <div className="medecins-cards-grid">
            {filteredMedecins.map((medecin) => {
              const isInterne = (medecin.typeMedecin || '').toUpperCase() === 'INTERNE'
              return (
                <div key={medecin.id} className={`medecin-profile-card ${isInterne ? 'card-internal' : 'card-external'}`}>
                  <div className="profile-card-top">
                    <span className={`profile-status-badge ${isInterne ? 'badge-internal' : 'badge-external'}`}>
                      {isInterne ? <FaClinicMedical /> : <FaHospital />}
                      <span>{isInterne ? 'Praticien Interne' : 'Praticien Externe'}</span>
                    </span>
                    {medecin.code && (
                      <span className="profile-code-chip">
                        <FaIdCard /> {medecin.code}
                      </span>
                    )}
                  </div>

                  <div className="profile-card-avatar-wrap">
                    <div className={`profile-avatar ${isInterne ? 'avatar-internal' : 'avatar-external'}`}>
                      {getInitials(medecin.nom, medecin.prenom)}
                    </div>
                  </div>

                  <div className="profile-card-main-info">
                    <span className="profile-titre">{medecin.titre || 'Dr.'}</span>
                    <h3 className="profile-name">
                      {medecin.nom} {medecin.prenom}
                    </h3>
                    <div className="profile-specialite">
                      <FaStethoscope className="spec-icon" />
                      <span>{medecin.specialite}</span>
                    </div>
                  </div>

                  <div className="profile-card-details">
                    <div className="profile-detail-row">
                      <span className="detail-label">
                        <FaBuilding className="row-icon" /> Établissement
                      </span>
                      <strong className="detail-val">
                        {medecin.centreDeSante || (isInterne ? 'Interne' : 'Cabinet privé / Libéral')}
                      </strong>
                    </div>

                    {medecin.numeroTelephone && (
                      <div className="profile-detail-row">
                        <span className="detail-label">
                          <FaPhoneAlt className="row-icon" /> Téléphone
                        </span>
                        <a href={`tel:${medecin.numeroTelephone}`} className="detail-link phone-link">
                          {medecin.numeroTelephone}
                        </a>
                      </div>
                    )}

                    {medecin.email && (
                      <div className="profile-detail-row">
                        <span className="detail-label">
                          <FaEnvelope className="row-icon" /> Email
                        </span>
                        <a href={`mailto:${medecin.email}`} className="detail-link email-link">
                          {medecin.email}
                        </a>
                      </div>
                    )}

                    {medecin.adresse && (
                      <div className="profile-detail-row">
                        <span className="detail-label">
                          <FaMapMarkerAlt className="row-icon" /> Bureau / Adresse
                        </span>
                        <span className="detail-val">{medecin.adresse}</span>
                      </div>
                    )}
                  </div>

                  <div className="profile-card-actions">
                    <button
                      type="button"
                      className="card-action-btn view-card-btn"
                      onClick={() => openDetailModal(medecin)}
                      title="Consulter la fiche détaillée"
                    >
                      <FaEye /> Voir fiche
                    </button>
                    <button
                      type="button"
                      className="card-action-btn edit-card-btn"
                      onClick={() => openEditForm(medecin)}
                      title="Modifier les coordonnées"
                    >
                      <FaEdit />
                    </button>
                    <button
                      type="button"
                      className="card-action-btn delete-card-btn"
                      onClick={() => openDeleteModal(medecin)}
                      title="Supprimer ce médecin"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* Modale d'ajout / modification de médecin */}
      {isFormOpen && (
        <Modal
          isOpen={isFormOpen}
          onClose={closeForm}
          title={editingMedecin ? `Modifier la fiche : ${editingMedecin.nomComplet || `${editingMedecin.titre || 'Dr.'} ${editingMedecin.nom} ${editingMedecin.prenom}`}` : 'Nouveau Médecin / Praticien'}
          size="large"
        >
          <MedecinForm
            initialValue={editingMedecin || undefined}
            onSubmit={handleFormSubmit}
            onCancel={closeForm}
            submitting={submitting}
            serverError={formError}
          />
        </Modal>
      )}

      {/* Modale de visualisation fiche praticien */}
      {isDetailModalOpen && detailMedecin && (
        <Modal
          isOpen={isDetailModalOpen}
          onClose={closeDetailModal}
          title="Fiche Praticien Médical"
          size="large"
        >
          <div className="medecin-detail-sheet">
            <div className="detail-sheet-header">
              <div className={`detail-sheet-avatar ${detailMedecin.typeMedecin === 'INTERNE' ? 'internal-avatar' : 'external-avatar'}`}>
                {getInitials(detailMedecin.nom, detailMedecin.prenom)}
              </div>
              <div className="detail-sheet-title-info">
                <span className={`detail-sheet-type-pill ${detailMedecin.typeMedecin === 'INTERNE' ? 'type-internal' : 'type-external'}`}>
                  {detailMedecin.typeMedecin === 'INTERNE' ? (
                    <>
                      <FaClinicMedical /> Praticien Interne Clinique
                    </>
                  ) : (
                    <>
                      <FaHospital /> Praticien Externe / Prescripteur
                    </>
                  )}
                </span>
                <h3>{detailMedecin.nomComplet || `${detailMedecin.titre || 'Dr.'} ${detailMedecin.nom} ${detailMedecin.prenom}`}</h3>
                <span className="detail-sheet-specialite">
                  <FaStethoscope /> {detailMedecin.specialite}
                </span>
              </div>
            </div>

            <div className="detail-sheet-grid">
              <div className="detail-sheet-item">
                <label>Nom & Prénom</label>
                <strong>{detailMedecin.nom} {detailMedecin.prenom}</strong>
              </div>

              <div className="detail-sheet-item">
                <label>Spécialité Médicale</label>
                <strong>{detailMedecin.specialite}</strong>
              </div>

              <div className="detail-sheet-item">
                <label>Statut / Type d'exercice</label>
                <strong>{detailMedecin.typeMedecin === 'INTERNE' ? 'Praticien Interne' : 'Praticien Externe / Prescripteur'}</strong>
              </div>

              <div className="detail-sheet-item">
                <label>Établissement / Centre de santé</label>
                <strong>{detailMedecin.centreDeSante || (detailMedecin.typeMedecin === 'INTERNE' ? 'Interne' : 'Cabinet privé / Libéral')}</strong>
              </div>

              <div className="detail-sheet-item">
                <label>Numéro de Téléphone</label>
                <strong>{detailMedecin.numeroTelephone || '—'}</strong>
              </div>

              <div className="detail-sheet-item">
                <label>Adresse Email</label>
                <strong>{detailMedecin.email || '—'}</strong>
              </div>

              <div className="detail-sheet-item">
                <label>Code / Matricule Ordre</label>
                <strong>{detailMedecin.code || '—'}</strong>
              </div>

              <div className="detail-sheet-item">
                <label>Bureau / Localisation</label>
                <strong>{detailMedecin.adresse || '—'}</strong>
              </div>
            </div>

            <div className="detail-sheet-actions">
              {detailMedecin.numeroTelephone && (
                <a href={`tel:${detailMedecin.numeroTelephone}`} className="detail-quick-action-btn call-btn">
                  <FaPhoneAlt /> Appeler ({detailMedecin.numeroTelephone})
                </a>
              )}
              {detailMedecin.email && (
                <a href={`mailto:${detailMedecin.email}`} className="detail-quick-action-btn mail-btn">
                  <FaEnvelope /> Écrire un email
                </a>
              )}
            </div>

            <div className="form-actions" style={{ marginTop: '24px' }}>
              <button type="button" className="btn-secondary" onClick={closeDetailModal}>
                Fermer
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={() => {
                  closeDetailModal()
                  openEditForm(detailMedecin)
                }}
              >
                <FaEdit /> Modifier la fiche
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modale de confirmation de suppression */}
      {isDeleteModalOpen && deletingMedecin && (
        <Modal
          isOpen={isDeleteModalOpen}
          onClose={closeDeleteModal}
          title="Confirmer la suppression"
        >
          <div className="delete-confirm-modal">
            <p>
              Êtes-vous sûr de vouloir supprimer définitivement la fiche du médecin :
            </p>
            <div className="delete-target-card">
              <strong>{deletingMedecin.nomComplet || `${deletingMedecin.titre || 'Dr.'} ${deletingMedecin.nom} ${deletingMedecin.prenom}`}</strong>
              <span>Spécialité : {deletingMedecin.specialite}</span>
              <span>Type : {deletingMedecin.typeMedecin === 'INTERNE' ? 'Praticien Interne' : 'Praticien Externe'}</span>
              {deletingMedecin.centreDeSante && <span>Centre : {deletingMedecin.centreDeSante}</span>}
            </div>
            <p className="delete-warning-text">
              Cette action est irréversible et supprimera toutes les informations de ce praticien.
            </p>
            <div className="form-actions">
              <button type="button" className="btn-secondary" onClick={closeDeleteModal}>
                Annuler
              </button>
              <button
                type="button"
                className="btn-danger"
                disabled={deleteSubmitting}
                onClick={handleDeleteConfirm}
              >
                {deleteSubmitting ? 'Suppression en cours...' : 'Supprimer définitivement'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

export default MedecinsPage
