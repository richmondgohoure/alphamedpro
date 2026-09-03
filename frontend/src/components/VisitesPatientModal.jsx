import { useState, useEffect } from 'react'
import {
  FaTimes,
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
  FaEdit,
  FaTrash,
} from 'react-icons/fa'
import Modal from './Modal'
import { visitesApi } from '../api/visitesApi'
import { formatDateTime, formatDate } from '../utils/dateUtils'
import './VisitesPatientModal.css'

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

export default function VisitesPatientModal({ patient, onClose, onEditVisite }) {
  const [visites, setVisites] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [expandedVisiteId, setExpandedVisiteId] = useState(null)

  const loadVisites = async () => {
    if (!patient?.id) return
    setLoading(true)
    setError(null)
    try {
      const data = await visitesApi.findByPatient(patient.id)
      setVisites(data || [])
      if (data && data.length > 0 && !expandedVisiteId) {
        setExpandedVisiteId(data[0].id)
      }
    } catch (err) {
      setError(err.message || 'Erreur lors du chargement des visites du patient.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadVisites()
  }, [patient?.id])

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

  const getStatusBadge = (visite) => {
    const nonSoldees = getNonSoldeesCount(visite)
    const totalSf = visite.sousFactures?.length || 0

    if (visite.statutPaiement === 'PAYE' || (totalSf > 0 && nonSoldees === 0)) {
      return (
        <span className="vpm-status-badge vpm-status-paye">
          <FaCheckCircle /> Toutes soldées ({totalSf})
        </span>
      )
    }

    if (visite.statutPaiement === 'PARTIELLEMENT_PAYE') {
      return (
        <span className="vpm-status-badge vpm-status-partiel">
          <FaClock /> {nonSoldees} sous-facture{nonSoldees > 1 ? 's' : ''} non soldée{nonSoldees > 1 ? 's' : ''} (Acompte)
        </span>
      )
    }

    return (
      <span className="vpm-status-badge vpm-status-non-paye">
        <FaExclamationCircle /> {nonSoldees} sous-facture{nonSoldees > 1 ? 's' : ''} non soldée{nonSoldees > 1 ? 's' : ''}
      </span>
    )
  }

  return (
    <Modal
      title={
        <div className="vpm-modal-title">
          <FaListUl className="vpm-title-icon" />
          <div>
            <span>Historique des Visites & Sous-Factures</span>
            <span className="vpm-modal-subtitle">
              Patient : {patient.prenom} {patient.nom} — N° Dossier :{' '}
              <strong>
                {patient.numeroDossier || `DP-${String(patient.id || 1).padStart(7, '0')}`}
              </strong>
            </span>
          </div>
        </div>
      }
      onClose={onClose}
      size="xl"
    >
      <div className="vpm-container">
        {/* EN-TÊTE RÉCAPITULATIF PATIENT */}
        <div className="vpm-patient-summary">
          <div className="vpm-patient-info-block">
            <span className="vpm-info-label">Patient</span>
            <strong className="vpm-info-val">
              {patient.prenom} {patient.nom}
            </strong>
          </div>
          <div className="vpm-patient-info-block">
            <span className="vpm-info-label">N° Dossier</span>
            <span className="vpm-code-badge">
              <FaFolderOpen /> {patient.numeroDossier || `DP-${String(patient.id || 1).padStart(7, '0')}`}
            </span>
          </div>
          {patient.code && (
            <div className="vpm-patient-info-block">
              <span className="vpm-info-label">Code Carte</span>
              <span className="vpm-code-badge">{patient.code}</span>
            </div>
          )}
          <div className="vpm-patient-info-block ml-auto">
            <button
              type="button"
              className="vpm-refresh-btn"
              onClick={loadVisites}
              disabled={loading}
              title="Actualiser la liste des visites"
            >
              <FaSync className={loading ? 'fa-spin' : ''} /> Actualiser
            </button>
          </div>
        </div>

        {/* ÉTAT CHARGEMENT & ERREUR */}
        {loading && (
          <div className="vpm-loading">
            <div className="vpm-spinner" />
            <p>Chargement des visites et sous-factures...</p>
          </div>
        )}

        {error && <div className="vpm-error-banner">{error}</div>}

        {/* LISTE DES VISITES */}
        {!loading && !error && visites.length === 0 && (
          <div className="vpm-empty-state">
            <FaFileInvoiceDollar className="vpm-empty-icon" />
            <h4>Aucune visite enregistrée</h4>
            <p>Ce patient n'a encore aucune visite médicale ou sous-facture dans le système.</p>
          </div>
        )}

        {!loading && !error && visites.length > 0 && (
          <div className="vpm-visites-list">
            <div className="vpm-count-bar">
              <span>
                <strong>{visites.length}</strong> visite(s) enregistrée(s) pour ce patient
              </span>
            </div>

            {visites.map((visite) => {
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
                  className={`vpm-visite-card ${isExpanded ? 'is-expanded' : ''}`}
                >
                  {/* EN-TÊTE DE LA CARTE VISITE */}
                  <div
                    className="vpm-visite-card-header"
                    onClick={() => toggleExpand(visite.id)}
                  >
                    <div className="vpm-visite-header-left">
                      <span className="vpm-visite-num-badge">
                        {visite.numeroVisite}
                      </span>
                      <span className="vpm-visite-date">
                        <FaCalendarAlt /> {formatDateTime(visite.dateVisite || visite.dateCreation)}
                      </span>
                      {getStatusBadge(visite)}
                    </div>

                    <div className="vpm-visite-header-right">
                      <div className="vpm-visite-amounts-mini">
                        <span className="vpm-amount-item">
                          <small>Brut :</small> <strong>{formatPrice(totalBrut)}</strong>
                        </span>
                        <span className="vpm-amount-item text-assurance">
                          <small>Assurance :</small> {formatPrice(totalAssur)}
                        </span>
                        <span className="vpm-amount-item text-patient">
                          <small>Patient :</small> {formatPrice(totalPat)}
                        </span>
                        {reste > 0 && (
                          <span className="vpm-amount-item text-reste">
                            <small>Reste dû :</small> <strong>{formatPrice(reste)}</strong>
                          </span>
                        )}
                      </div>
                      {onEditVisite && (
                        <button
                          type="button"
                          className="vpm-visite-edit-btn"
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
                        className="vpm-toggle-btn"
                        aria-label="Déplier / Replier"
                      >
                        {isExpanded ? <FaChevronUp /> : <FaChevronDown />}
                      </button>
                    </div>
                  </div>

                  {/* CORPS DÉPLIÉ AVEC SOUS-FACTURES & ACTES */}
                  {isExpanded && (
                    <div className="vpm-visite-card-body">
                      {visite.sousFactures && visite.sousFactures.length > 0 ? (
                        <div className="vpm-sousfactures-container">
                          <div className="vpm-sf-section-header-row">
                            <h5 className="vpm-sf-section-title">
                              Sous-factures de la visite ({visite.sousFactures.length})
                            </h5>
                            {onEditVisite && (
                              <button
                                type="button"
                                className="vpm-visite-edit-btn vpm-visite-edit-btn-inline"
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

                          <div className="vpm-sf-grid">
                            {visite.sousFactures.map((sf) => {
                              const isLocked =
                                Number(sf.montantPaye || 0) > 0 ||
                                Number(sf.remise || 0) > 0 ||
                                sf.statutPaiement === 'PAYE' ||
                                sf.statutPaiement === 'PARTIELLEMENT_PAYE'

                              return (
                              <div key={sf.id || sf.numeroSousFacture} className="vpm-sf-item-card">
                                <div className="vpm-sf-item-header">
                                  <div className="vpm-sf-category-title">
                                    <span className="vpm-cat-icon">
                                      {getCategoryIcon(sf.codeCategorie)}
                                    </span>
                                    <div>
                                      <strong className="vpm-cat-label">
                                        {sf.libelleCategorie || sf.codeCategorie}
                                      </strong>
                                      <span className="vpm-sf-num">
                                        N° {sf.numeroSousFacture}
                                      </span>
                                    </div>
                                  </div>

                                  <div className="vpm-sf-header-right">
                                    <div className="vpm-sf-practitioner">
                                      {sf.medecinNomComplet ? (
                                        <span className="vpm-practitioner-chip">
                                          <FaUserMd /> {sf.medecinNomComplet}
                                        </span>
                                      ) : (
                                        <span className="vpm-no-practitioner">
                                          Praticien non spécifié
                                        </span>
                                      )}
                                    </div>

                                    <div className="vpm-sf-actions-group">
                                      <button
                                        type="button"
                                        className="vpm-sf-action-btn vpm-sf-delete-btn"
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
                                  <div className="vpm-sf-details-table-wrap">
                                    <table className="vpm-sf-table">
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
                                                <small className="vpm-det-formula">
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
                                <div className="vpm-sf-totals-bar">
                                  <div className="vpm-sf-total-group">
                                    <span>Total Brut :</span>
                                    <strong>{formatPrice(sf.montantBrut)}</strong>
                                  </div>
                                  <div className="vpm-sf-total-group text-assurance">
                                    <span>Part Assurance :</span>
                                    <strong>{formatPrice(sf.partAssurance)}</strong>
                                  </div>
                                  <div className="vpm-sf-total-group text-patient">
                                    <span>Part Patient :</span>
                                    <strong>{formatPrice(sf.partPatient)}</strong>
                                  </div>
                                </div>
                              </div>
                            )})}
                          </div>
                        </div>
                      ) : (
                        <p className="vpm-no-sf">Aucune sous-facture attachée à cette visite.</p>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* PIED DE MODALE */}
        <div className="vpm-modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Fermer
          </button>
        </div>
      </div>
    </Modal>
  )
}
