import { useState, useEffect, useMemo } from 'react'
import {
  FaCalendarAlt,
  FaFileInvoiceDollar,
  FaFolderOpen,
  FaCheckCircle,
  FaClock,
  FaExclamationCircle,
  FaUserMd,
  FaStethoscope,
  FaFlask,
  FaXRay,
  FaListUl,
  FaSync,
  FaChevronDown,
  FaChevronUp,
  FaSearch,
  FaTimes,
  FaUserInjured,
  FaShieldAlt,
  FaHandHoldingUsd,
  FaEdit,
  FaTrash,
} from 'react-icons/fa'
import Modal from './Modal'
import { visitesApi } from '../api/visitesApi'
import { formatDateTime } from '../utils/dateUtils'
import './ListeVisitesModal.css'

const formatPrice = (val) => {
  if (val == null || isNaN(val)) return '0 FCFA'
  return Math.round(Number(val)).toLocaleString('fr-FR') + ' FCFA'
}

const getCategoryIcon = (code) => {
  switch (code) {
    case 'CO':
      return <FaStethoscope />
    case 'EB':
      return <FaFlask />
    case 'RA':
    case 'SC':
    case 'EC':
      return <FaXRay />
    default:
      return <FaFileInvoiceDollar />
  }
}

// Calcul du nombre de sous-factures non soldées d'une visite
const getNonSoldeesCount = (visite) => {
  if (!visite.sousFactures || visite.sousFactures.length === 0) {
    return visite.statutPaiement === 'PAYE' ? 0 : 1
  }
  return visite.sousFactures.filter((sf) => {
    const partPat = Number(sf.partPatient || 0)
    const rem = Number(sf.remise || 0)
    const paye = Number(sf.montantPaye || 0)
    const reste = Math.max(0, partPat - rem - paye)
    return sf.statutPaiement !== 'PAYE' && (reste > 0 || (paye === 0 && rem === 0 && partPat > 0))
  }).length
}

export default function ListeVisitesModal({ onClose, onSelectPatient, onEditVisite }) {
  const [visites, setVisites] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [expandedVisiteId, setExpandedVisiteId] = useState(null)

  // Filtres
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('tous') // 'tous' | 'non_paye' | 'partiel' | 'paye'
  const [dateFilter, setDateFilter] = useState('')

  const loadVisites = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await visitesApi.getAll()
      setVisites(data || [])
      if (data && data.length > 0 && !expandedVisiteId) {
        setExpandedVisiteId(data[0].id)
      }
    } catch (err) {
      setError(err.message || 'Erreur lors du chargement de la liste des visites.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadVisites()
  }, [])

  const toggleExpand = (id) => {
    setExpandedVisiteId((prev) => (prev === id ? null : id))
  }

  // Suppression d'une sous-facture
  const handleDeleteSousFacture = async (sf) => {
    const isLocked =
      Number(sf.montantPaye || 0) > 0 ||
      Number(sf.remise || 0) > 0 ||
      sf.statutPaiement === 'PAYE' ||
      sf.statutPaiement === 'PARTIELLEMENT_PAYE'

    if (isLocked) {
      alert("Cette sous-facture a déjà fait l'objet d'un versement et ne peut plus être supprimée.")
      return
    }

    const confirmMsg = `Êtes-vous sûr de vouloir supprimer la sous-facture N° ${sf.numeroSousFacture} (${sf.libelleCategorie || sf.codeCategorie}) ?\nMontant : ${formatPrice(sf.montantBrut)}.\nCette action est irréversible.`
    if (!window.confirm(confirmMsg)) return

    try {
      await visitesApi.deleteSousFacture(sf.id)
      await loadVisites()
    } catch (err) {
      alert(err.message || 'Erreur lors de la suppression de la sous-facture.')
    }
  }

  // Filtrage
  const filteredVisites = useMemo(() => {
    return visites.filter((v) => {
      const nonSoldees = getNonSoldeesCount(v)

      // Filtre statut
      if (statusFilter === 'non_paye' && nonSoldees === 0) return false
      if (statusFilter === 'partiel' && v.statutPaiement !== 'PARTIELLEMENT_PAYE') return false
      if (statusFilter === 'paye' && (v.statutPaiement !== 'PAYE' && nonSoldees > 0)) return false

      // Filtre date
      if (dateFilter) {
        const vDate = (v.dateVisite || v.dateCreation || '').slice(0, 10)
        if (vDate !== dateFilter) return false
      }

      // Filtre recherche textuelle
      if (searchTerm) {
        const q = searchTerm.toLowerCase().trim()
        const matchNum = v.numeroVisite?.toLowerCase().includes(q)
        const matchNom = v.patientNom?.toLowerCase().includes(q)
        const matchPrenom = v.patientPrenom?.toLowerCase().includes(q)
        const matchTel = v.patientTelephone?.toLowerCase().includes(q)
        const matchCode = v.patientCode?.toLowerCase().includes(q)
        const matchDossier = v.patientNumeroDossier?.toLowerCase().includes(q)
        return matchNum || matchNom || matchPrenom || matchTel || matchCode || matchDossier
      }

      return true
    })
  }, [visites, statusFilter, dateFilter, searchTerm])

  // Statistiques calculées
  const stats = useMemo(() => {
    let totalBrut = 0
    let totalAssur = 0
    let totalPat = 0
    let totalReste = 0

    filteredVisites.forEach((v) => {
      totalBrut += Number(v.montantTotalBrut || 0)
      totalAssur += Number(v.totalPartAssurance || 0)
      totalPat += Number(v.totalPartPatient || 0)
      totalReste += Number(v.totalResteAPayer != null ? v.totalResteAPayer : v.totalPartPatient || 0)
    })

    return { totalBrut, totalAssur, totalPat, totalReste }
  }, [filteredVisites])

  const getStatusBadge = (visite) => {
    const nonSoldees = getNonSoldeesCount(visite)
    const totalSf = visite.sousFactures?.length || 0

    if (visite.statutPaiement === 'PAYE' || (totalSf > 0 && nonSoldees === 0)) {
      return (
        <span className="lvm-status-badge lvm-status-paye">
          <FaCheckCircle /> Toutes soldées ({totalSf})
        </span>
      )
    }

    if (visite.statutPaiement === 'PARTIELLEMENT_PAYE') {
      return (
        <span className="lvm-status-badge lvm-status-partiel">
          <FaClock /> {nonSoldees} sous-facture{nonSoldees > 1 ? 's' : ''} non soldée{nonSoldees > 1 ? 's' : ''} (Acompte)
        </span>
      )
    }

    return (
      <span className="lvm-status-badge lvm-status-non-paye">
        <FaExclamationCircle /> {nonSoldees} sous-facture{nonSoldees > 1 ? 's' : ''} non soldée{nonSoldees > 1 ? 's' : ''}
      </span>
    )
  }

  return (
    <Modal
      title={
        <div className="lvm-modal-title">
          <FaListUl className="lvm-title-icon" />
          <div>
            <span>Liste Générale des Visites Médicales</span>
            <span className="lvm-modal-subtitle">
              Historique complet des visites enregistrées, dossiers patients et sous-factures
            </span>
          </div>
        </div>
      }
      onClose={onClose}
      size="xl"
    >
      <div className="lvm-container">
        {/* BARRE DE FILTRES ET RECHERCHE */}
        <div className="lvm-filters-panel">
          <div className="lvm-search-row">
            <div className="lvm-search-input-group">
              <FaSearch className="lvm-search-icon" />
              <input
                type="text"
                placeholder="Rechercher par N° Visite, Patient, N° Dossier, Téléphone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button
                  type="button"
                  className="lvm-clear-btn"
                  onClick={() => setSearchTerm('')}
                  title="Effacer la recherche"
                >
                  <FaTimes />
                </button>
              )}
            </div>

            <div className="lvm-date-filter-group">
              <FaCalendarAlt className="lvm-date-icon" />
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                title="Filtrer par date de visite"
              />
              {dateFilter && (
                <button
                  type="button"
                  className="lvm-clear-date-btn"
                  onClick={() => setDateFilter('')}
                  title="Effacer le filtre date"
                >
                  <FaTimes />
                </button>
              )}
            </div>

            <button
              type="button"
              className="lvm-refresh-btn"
              onClick={loadVisites}
              disabled={loading}
              title="Actualiser la liste"
            >
              <FaSync className={loading ? 'fa-spin' : ''} /> Actualiser
            </button>
          </div>

          {/* ONGLETS DE STATUT */}
          <div className="lvm-status-tabs">
            <button
              type="button"
              className={`lvm-tab ${statusFilter === 'tous' ? 'active' : ''}`}
              onClick={() => setStatusFilter('tous')}
            >
              Toutes les visites ({visites.length})
            </button>
            <button
              type="button"
              className={`lvm-tab lvm-tab-non-paye ${statusFilter === 'non_paye' ? 'active' : ''}`}
              onClick={() => setStatusFilter('non_paye')}
            >
              Non soldées ({visites.filter((v) => getNonSoldeesCount(v) > 0).length})
            </button>
            <button
              type="button"
              className={`lvm-tab lvm-tab-partiel ${statusFilter === 'partiel' ? 'active' : ''}`}
              onClick={() => setStatusFilter('partiel')}
            >
              Acomptes ({visites.filter((v) => v.statutPaiement === 'PARTIELLEMENT_PAYE').length})
            </button>
            <button
              type="button"
              className={`lvm-tab lvm-tab-paye ${statusFilter === 'paye' ? 'active' : ''}`}
              onClick={() => setStatusFilter('paye')}
            >
              Soldées ({visites.filter((v) => getNonSoldeesCount(v) === 0 || v.statutPaiement === 'PAYE').length})
            </button>
          </div>
        </div>

        {/* BANDEAU STATISTIQUES */}
        <div className="lvm-stats-summary">
          <div className="lvm-stat-item">
            <span className="lvm-stat-label">Visites affichées</span>
            <strong className="lvm-stat-val">{filteredVisites.length}</strong>
          </div>
          <div className="lvm-stat-item">
            <span className="lvm-stat-label">Total Brut</span>
            <strong className="lvm-stat-val text-violet">{formatPrice(stats.totalBrut)}</strong>
          </div>
          <div className="lvm-stat-item">
            <span className="lvm-stat-label">Part Assurance</span>
            <strong className="lvm-stat-val text-assurance">{formatPrice(stats.totalAssur)}</strong>
          </div>
          <div className="lvm-stat-item">
            <span className="lvm-stat-label">Part Patient</span>
            <strong className="lvm-stat-val text-patient">{formatPrice(stats.totalPat)}</strong>
          </div>
          <div className="lvm-stat-item">
            <span className="lvm-stat-label">Reste à payer</span>
            <strong className="lvm-stat-val text-reste">{formatPrice(stats.totalReste)}</strong>
          </div>
        </div>

        {/* CHARGEMENT / ERREUR */}
        {loading && (
          <div className="lvm-loading">
            <div className="lvm-spinner" />
            <p>Chargement des visites en cours...</p>
          </div>
        )}

        {error && <div className="lvm-error-banner">{error}</div>}

        {/* ÉTAT VIDE */}
        {!loading && !error && filteredVisites.length === 0 && (
          <div className="lvm-empty-state">
            <FaFileInvoiceDollar className="lvm-empty-icon" />
            <h4>Aucune visite trouvée</h4>
            <p>
              {searchTerm || dateFilter || statusFilter !== 'tous'
                ? 'Aucune visite ne correspond aux filtres sélectionnés.'
                : 'Aucune visite médicale n’a encore été enregistrée.'}
            </p>
          </div>
        )}

        {/* LISTE DES VISITES */}
        {!loading && !error && filteredVisites.length > 0 && (
          <div className="lvm-visites-list">
            {filteredVisites.map((visite) => {
              const isExpanded = expandedVisiteId === visite.id
              const totalBrut = Number(visite.montantTotalBrut || 0)
              const totalAssur = Number(visite.totalPartAssurance || 0)
              const totalPat = Number(visite.totalPartPatient || 0)
              const reste = Number(visite.totalResteAPayer != null ? visite.totalResteAPayer : totalPat)
              const isVisiteLocked =
                Number(visite.totalPaye || 0) > 0 ||
                visite.statutPaiement === 'PAYE' ||
                visite.statutPaiement === 'PARTIELLEMENT_PAYE' ||
                (visite.sousFactures &&
                  visite.sousFactures.some(
                    (sf) =>
                      Number(sf.montantPaye || 0) > 0 ||
                      Number(sf.remise || 0) > 0 ||
                      sf.statutPaiement === 'PAYE' ||
                      sf.statutPaiement === 'PARTIELLEMENT_PAYE'
                  ))

              return (
                <div
                  key={visite.id}
                  className={`lvm-visite-card ${isExpanded ? 'is-expanded' : ''}`}
                >
                  {/* EN-TÊTE DE CARTE VISITE */}
                  <div
                    className="lvm-visite-card-header"
                    onClick={() => toggleExpand(visite.id)}
                  >
                    <div className="lvm-visite-header-left">
                      <span className="lvm-visite-num-badge">
                        {visite.numeroVisite}
                      </span>
                      <div className="lvm-patient-identity-box">
                        <strong className="lvm-patient-name">
                          <FaUserInjured className="lvm-pat-icon" /> {visite.patientPrenom} {visite.patientNom}
                        </strong>
                        <span className="lvm-dossier-pill">
                          <FaFolderOpen /> {visite.patientNumeroDossier || `DP-${String(visite.patientId || 1).padStart(7, '0')}`}
                        </span>
                      </div>
                      <span className="lvm-visite-date">
                        <FaCalendarAlt /> {formatDateTime(visite.dateVisite || visite.dateCreation)}
                      </span>
                      {getStatusBadge(visite)}
                    </div>

                    <div className="lvm-visite-header-right">
                      <div className="lvm-visite-amounts-mini">
                        <span className="lvm-amount-item">
                          <small>Brut :</small> <strong>{formatPrice(totalBrut)}</strong>
                        </span>
                        <span className="lvm-amount-item text-assurance">
                          <small>Assurance :</small> {formatPrice(totalAssur)}
                        </span>
                        <span className="lvm-amount-item text-patient">
                          <small>Patient :</small> {formatPrice(totalPat)}
                        </span>
                        {reste > 0 && (
                          <span className="lvm-amount-item text-reste">
                            <small>Reste dû :</small> <strong>{formatPrice(reste)}</strong>
                          </span>
                        )}
                      </div>
                      {onEditVisite && (
                        <button
                          type="button"
                          className="lvm-visite-edit-btn"
                          onClick={(e) => {
                            e.stopPropagation()
                            if (isVisiteLocked) {
                              alert("Cette visite a déjà fait l'objet d'un versement et ne peut plus être modifiée dans son ensemble.")
                              return
                            }
                            onEditVisite(visite)
                          }}
                          disabled={isVisiteLocked}
                          title={
                            isVisiteLocked
                              ? "Versement déjà effectué — Non modifiable"
                              : "Modifier cette visite (ouvrir la fiche Nouvelle Visite et charger ses actes dans le panier)"
                          }
                        >
                          <FaEdit /> Modifier la visite
                        </button>
                      )}
                      <button
                        type="button"
                        className="lvm-toggle-btn"
                        aria-label="Déplier / Replier"
                      >
                        {isExpanded ? <FaChevronUp /> : <FaChevronDown />}
                      </button>
                    </div>
                  </div>

                  {/* CORPS DÉPLIÉ AVEC SOUS-FACTURES & ACTES */}
                  {isExpanded && (
                    <div className="lvm-visite-card-body">
                      {visite.sousFactures && visite.sousFactures.length > 0 ? (
                        <div className="lvm-sousfactures-container">
                          <div className="lvm-sf-section-header-row">
                            <h5 className="lvm-sf-section-title">
                              Sous-factures de la visite ({visite.sousFactures.length})
                            </h5>
                            {onEditVisite && (
                              <button
                                type="button"
                                className="lvm-visite-edit-btn lvm-visite-edit-btn-inline"
                                onClick={() => {
                                  if (isVisiteLocked) {
                                    alert("Cette visite a déjà fait l'objet d'un versement et ne peut plus être modifiée dans son ensemble.")
                                    return
                                  }
                                  onEditVisite(visite)
                                }}
                                disabled={isVisiteLocked}
                                title={
                                  isVisiteLocked
                                    ? "Versement déjà effectué — Non modifiable"
                                    : "Modifier cette visite (ouvrir la fiche Nouvelle Visite et charger ses actes dans le panier)"
                                }
                              >
                                <FaEdit /> Modifier la visite
                              </button>
                            )}
                          </div>

                          <div className="lvm-sf-grid">
                            {visite.sousFactures.map((sf) => {
                              const isLocked =
                                Number(sf.montantPaye || 0) > 0 ||
                                Number(sf.remise || 0) > 0 ||
                                sf.statutPaiement === 'PAYE' ||
                                sf.statutPaiement === 'PARTIELLEMENT_PAYE'

                              return (
                              <div key={sf.id || sf.numeroSousFacture} className="lvm-sf-item-card">
                                <div className="lvm-sf-item-header">
                                  <div className="lvm-sf-category-title">
                                    <span className="lvm-cat-icon">
                                      {getCategoryIcon(sf.codeCategorie)}
                                    </span>
                                    <div>
                                      <strong className="lvm-cat-label">
                                        {sf.libelleCategorie || sf.codeCategorie}
                                      </strong>
                                      <span className="lvm-sf-num">
                                        N° {sf.numeroSousFacture}
                                      </span>
                                    </div>
                                  </div>

                                  <div className="lvm-sf-header-right">
                                    <div className="lvm-sf-practitioner">
                                      {sf.medecinNomComplet ? (
                                        <span className="lvm-practitioner-chip">
                                          <FaUserMd /> {sf.medecinNomComplet}
                                        </span>
                                      ) : (
                                        <span className="lvm-no-practitioner">
                                          Praticien non spécifié
                                        </span>
                                      )}
                                    </div>

                                    <div className="lvm-sf-actions-group">
                                      <button
                                        type="button"
                                        className="lvm-sf-action-btn lvm-sf-delete-btn"
                                        onClick={() => handleDeleteSousFacture(sf)}
                                        disabled={isLocked}
                                        title={
                                          isLocked
                                            ? "Versement déjà effectué — Non supprimable"
                                            : "Supprimer cette sous-facture"
                                        }
                                      >
                                        <FaTrash /> Supprimer
                                      </button>
                                    </div>
                                  </div>
                                </div>

                                {/* TABLEAU DES ACTES DE LA SOUS-FACTURE */}
                                {sf.details && sf.details.length > 0 && (
                                  <div className="lvm-sf-details-table-wrap">
                                    <table className="lvm-sf-table">
                                      <thead>
                                        <tr>
                                          <th>Acte / Examen</th>
                                          <th className="text-right">Prix Unitaire</th>
                                          <th className="text-center">Qté</th>
                                          <th className="text-right">Total Brut</th>
                                          <th className="text-right">Part Assurance</th>
                                          <th className="text-right">Part Patient</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {sf.details.map((det, idx) => (
                                          <tr key={det.id || idx}>
                                            <td>
                                              <strong>{det.libelleActe}</strong>
                                              {det.tarifFormula && (
                                                <small className="lvm-det-formula">
                                                  ({det.tarifFormula})
                                                </small>
                                              )}
                                            </td>
                                            <td className="text-right">
                                              {formatPrice(det.prixUnitaire)}
                                            </td>
                                            <td className="text-center">
                                              {det.quantite || 1}
                                            </td>
                                            <td className="text-right font-bold">
                                              {formatPrice(det.montantBrut)}
                                            </td>
                                            <td className="text-right text-assurance">
                                              {formatPrice(det.partAssurance)}
                                            </td>
                                            <td className="text-right text-patient font-bold">
                                              {formatPrice(det.partPatient)}
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                )}

                                {/* SYNTHÈSE DE LA SOUS-FACTURE */}
                                <div className="lvm-sf-totals-bar">
                                  <div className="lvm-sf-total-group">
                                    <span>Total Brut :</span>
                                    <strong>{formatPrice(sf.montantBrut)}</strong>
                                  </div>
                                  <div className="lvm-sf-total-group text-assurance">
                                    <span>Part Assurance :</span>
                                    <strong>{formatPrice(sf.partAssurance)}</strong>
                                  </div>
                                  <div className="lvm-sf-total-group text-patient">
                                    <span>Part Patient :</span>
                                    <strong>{formatPrice(sf.partPatient)}</strong>
                                  </div>
                                </div>
                              </div>
                            )})}
                          </div>
                        </div>
                      ) : (
                        <p className="lvm-no-sf">Aucune sous-facture attachée à cette visite.</p>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* PIED DE MODALE */}
        <div className="lvm-modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Fermer
          </button>
        </div>
      </div>
    </Modal>
  )
}
