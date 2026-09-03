import { useState, useEffect } from 'react'
import {
  FaCashRegister,
  FaCheckCircle,
  FaTimes,
  FaFileInvoiceDollar,
  FaPercent,
  FaCoins,
  FaCreditCard,
  FaMobileAlt,
  FaMoneyCheckAlt,
  FaExchangeAlt,
  FaUserCheck,
  FaReceipt,
  FaCalendarAlt,
  FaShieldAlt,
  FaHandshake,
  FaUserMd,
  FaNotesMedical,
  FaChevronDown,
  FaChevronUp,
} from 'react-icons/fa'
import { caisseApi } from '../api/caisseApi'
import { formatDateTime, getCurrentDateTimeLocal } from '../utils/dateUtils'
import './CaisseEncaissementModal.css'

const MODES_PAIEMENT = [
  { key: 'ESPECES', label: 'Espèces', icon: FaCoins, color: '#16a34a' },
  { key: 'WAVE', label: 'Wave', icon: FaMobileAlt, color: '#0284c7' },
  { key: 'ORANGE_MONEY', label: 'Orange Money', icon: FaMobileAlt, color: '#ea580c' },
  { key: 'MTN_MOMO', label: 'MTN MoMo', icon: FaMobileAlt, color: '#eab308' },
  { key: 'MOOV_MONEY', label: 'Moov Money', icon: FaMobileAlt, color: '#2563eb' },
  { key: 'CARTE_BANCAIRE', label: 'Carte Bancaire', icon: FaCreditCard, color: '#6366f1' },
  { key: 'CHEQUE', label: 'Chèque', icon: FaMoneyCheckAlt, color: '#7c3aed' },
  { key: 'VIREMENT', label: 'Virement', icon: FaExchangeAlt, color: '#475569' },
]

export default function CaisseEncaissementModal({
  visiteId,
  onClose,
  onPaymentSuccess,
  onOpenRecu,
}) {
  const [visite, setVisite] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [successMsg, setSuccessMsg] = useState(null)

  // Selection de sous-factures
  const [selectedSfIds, setSelectedSfIds] = useState([])

  // Remise
  const [remiseType, setRemiseType] = useState('montant') // 'montant' | 'pourcentage'
  const [remiseValue, setRemiseValue] = useState('')
  const [remiseMotif, setRemiseMotif] = useState('')

  // Versement
  const [montantVerse, setMontantVerse] = useState('')
  const [modePaiement, setModePaiement] = useState('ESPECES')
  const [referencePaiement, setReferencePaiement] = useState('')
  const [caissier, setCaissier] = useState('Caisse Principale')
  const [dateVersement, setDateVersement] = useState(() => getCurrentDateTimeLocal())
  const [observations, setObservations] = useState('')
  const [expandedSfId, setExpandedSfId] = useState(null)

  const loadVisite = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await caisseApi.getVisiteById(visiteId)
      setVisite(data)

      // Sélectionner par défaut toutes les sous-factures non soldées
      if (data.sousFactures && data.sousFactures.length > 0) {
        const nonSoldees = data.sousFactures
          .filter((sf) => (sf.resteAPayer != null ? sf.resteAPayer : sf.partPatient) > 0)
          .map((sf) => sf.id)
        setSelectedSfIds(nonSoldees.length > 0 ? nonSoldees : data.sousFactures.map((sf) => sf.id))
      }
    } catch (err) {
      setError(err.message || 'Impossible de charger les détails de la visite.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (visiteId) {
      loadVisite()
    }
  }, [visiteId])

  // Calculs financiers
  const sousFactures = visite?.sousFactures || []
  const selectedSousFactures = sousFactures.filter((sf) => selectedSfIds.includes(sf.id))

  const totalPartPatientSelected = selectedSousFactures.reduce((acc, sf) => {
    const reste = sf.resteAPayer != null ? Number(sf.resteAPayer) : Number(sf.partPatient || 0)
    return acc + Math.max(0, reste)
  }, 0)

  // Calcul montant de remise
  let remiseNum = 0
  if (remiseValue && !isNaN(Number(remiseValue))) {
    if (remiseType === 'montant') {
      remiseNum = Math.min(totalPartPatientSelected, Math.max(0, Number(remiseValue)))
    } else {
      const pct = Math.min(100, Math.max(0, Number(remiseValue)))
      remiseNum = Math.round((totalPartPatientSelected * pct) / 100)
    }
  }

  const netAPayer = Math.max(0, totalPartPatientSelected - remiseNum)

  // Auto-ajustement du montant versé lors des changements de sélection ou de remise
  useEffect(() => {
    setMontantVerse(netAPayer > 0 ? String(netAPayer) : '0')
  }, [netAPayer, selectedSfIds])

  const montantVerseNum = Math.max(0, Number(montantVerse) || 0)
  const resteApresVersement = Math.max(0, netAPayer - montantVerseNum)
  const monnaieRendue =
    modePaiement === 'ESPECES' && montantVerseNum > netAPayer ? montantVerseNum - netAPayer : 0

  const toggleSelectSf = (id) => {
    setSelectedSfIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  const toggleSelectAll = () => {
    const payableIds = sousFactures
      .filter((sf) => (sf.resteAPayer != null ? sf.resteAPayer : sf.partPatient) > 0)
      .map((sf) => sf.id)

    if (selectedSfIds.length === payableIds.length && payableIds.length > 0) {
      setSelectedSfIds([])
    } else {
      setSelectedSfIds(payableIds.length > 0 ? payableIds : sousFactures.map((sf) => sf.id))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (selectedSfIds.length === 0) {
      setError('Veuillez cocher au moins une sous-facture à encaisser.')
      return
    }

    if (montantVerseNum <= 0 && remiseNum <= 0 && netAPayer > 0) {
      setError('Veuillez saisir un montant de versement ou une remise valide.')
      return
    }

    setSubmitting(true)
    setError(null)
    try {
      const payload = {
        dateVersement: dateVersement ? `${dateVersement}:00` : null,
        montantVerse: montantVerseNum,
        remise: remiseNum,
        modePaiement,
        referencePaiement: referencePaiement || null,
        caissier: caissier || 'Caisse Principale',
        observations: [remiseMotif ? `Motif remise: ${remiseMotif}` : '', observations]
          .filter(Boolean)
          .join(' | ') || null,
        sousFactureIds: selectedSfIds,
      }

      const versementRes = await caisseApi.enregistrerVersement(visite.id, payload)
      setSuccessMsg(`Versement N° ${versementRes.numeroVersement} enregistré avec succès !`)

      // Recharger la visite
      const updatedVisite = await caisseApi.getVisiteById(visite.id)
      setVisite(updatedVisite)

      if (onPaymentSuccess) {
        onPaymentSuccess(updatedVisite, versementRes)
      }

      // Proposer d'ouvrir le reçu
      if (onOpenRecu) {
        onOpenRecu(versementRes)
      }
    } catch (err) {
      setError(err.message || "Échec de l'enregistrement du versement.")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="caisse-modal-loading">
        <div className="caisse-spinner" />
        <p>Chargement du dossier de caisse...</p>
      </div>
    )
  }

  if (!visite) {
    return (
      <div className="caisse-modal-error">
        <p>{error || 'Visite introuvable.'}</p>
        <button type="button" className="btn btn-secondary" onClick={onClose}>
          Fermer
        </button>
      </div>
    )
  }

  const patient = {
    nom: visite.patientNom,
    prenom: visite.patientPrenom,
    telephone: visite.patientTelephone,
    code: visite.patientCode,
    numeroDossier: visite.patientNumeroDossier,
  }

  return (
    <div className="caisse-modal-container">
      {/* Bannière Patient & Visite */}
      <div className="caisse-patient-banner">
        <div className="caisse-patient-avatar">
          {patient.prenom?.[0] || 'P'}
          {patient.nom?.[0] || ''}
        </div>
        <div className="caisse-patient-info">
          <div className="caisse-patient-name-row">
            <h3>
              {patient.prenom} {patient.nom}
            </h3>
            <span className="code-pill dp-pill">
              {patient.numeroDossier || `DP-${String(visite.patientId).padStart(7, '0')}`}
            </span>
            <span className="caisse-visite-pill">
              <FaReceipt /> {visite.numeroVisite}
            </span>
            <span
              className={`caisse-status-badge status-${visite.statutPaiement?.toLowerCase() || 'non_paye'}`}
            >
              {visite.statutPaiement === 'PAYE'
                ? '✓ Soldé'
                : visite.statutPaiement === 'PARTIELLEMENT_PAYE'
                ? '⏳ Partiel'
                : '⚠️ Non payé'}
            </span>
          </div>
          <div className="caisse-patient-meta">
            {patient.telephone && <span>📞 {patient.telephone}</span>}
            <span>📅 Visite du : {formatDateTime(visite.dateVisite)}</span>
            {visite.versementsCount > 0 && (
              <span className="caisse-versements-count">
                💳 {visite.versementsCount} versement(s) effectué(s)
              </span>
            )}
          </div>
        </div>
      </div>

      {error && <div className="caisse-alert alert-error">{error}</div>}
      {successMsg && <div className="caisse-alert alert-success">{successMsg}</div>}

      <div className="caisse-layout-grid">
        {/* Colonne Gauche : Sélection des Sous-Factures */}
        <div className="caisse-left-panel">
          <div className="caisse-panel-header">
            <div className="caisse-panel-title">
              <FaFileInvoiceDollar /> Sous-factures de la Visite
            </div>
            <button
              type="button"
              className="caisse-btn-select-all"
              onClick={toggleSelectAll}
              title="Tout cocher / Décocher"
            >
              {selectedSfIds.length === sousFactures.length
                ? 'Tout désélectionner'
                : 'Tout sélectionner'}
            </button>
          </div>

          <div className="caisse-sf-list">
            {sousFactures.map((sf) => {
              const isSelected = selectedSfIds.includes(sf.id)
              const reste =
                sf.resteAPayer != null ? Number(sf.resteAPayer) : Number(sf.partPatient || 0)
              const isPaid = sf.statutPaiement === 'PAYE' || reste <= 0
              const isExpanded = expandedSfId === sf.id

              return (
                <div
                  key={sf.id}
                  className={`caisse-sf-card ${isSelected ? 'is-selected' : ''} ${
                    isPaid ? 'is-paid' : ''
                  }`}
                >
                  <div className="caisse-sf-card-header">
                    <label className="caisse-checkbox-label">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectSf(sf.id)}
                        disabled={isPaid}
                      />
                      <span className="caisse-sf-num">{sf.numeroSousFacture}</span>
                      <span className={`caisse-cat-tag cat-${sf.codeCategorie?.toLowerCase()}`}>
                        {sf.libelleCategorie}
                      </span>
                    </label>

                    <span
                      className={`caisse-sf-badge status-${sf.statutPaiement?.toLowerCase() || 'non_paye'}`}
                    >
                      {sf.statutPaiement === 'PAYE'
                        ? 'Payé'
                        : sf.statutPaiement === 'PARTIELLEMENT_PAYE'
                        ? 'Partiel'
                        : 'En attente'}
                    </span>
                  </div>

                  <div className="caisse-sf-body">
                    <div className="caisse-sf-amounts-grid">
                      <div className="caisse-amount-item">
                        <span className="lbl">Total Brut</span>
                        <span className="val">{Number(sf.montantBrut || 0).toLocaleString()} F</span>
                      </div>
                      <div className="caisse-amount-item">
                        <span className="lbl">Part Assurance</span>
                        <span className="val text-blue">
                          {Number(sf.partAssurance || 0).toLocaleString()} F
                        </span>
                      </div>
                      <div className="caisse-amount-item highlight">
                        <span className="lbl">Part Patient</span>
                        <span className="val text-purple">
                          {Number(sf.partPatient || 0).toLocaleString()} F
                        </span>
                      </div>
                      {Number(sf.remise || 0) > 0 && (
                        <div className="caisse-amount-item">
                          <span className="lbl">Remise</span>
                          <span className="val text-orange">
                            -{Number(sf.remise).toLocaleString()} F
                          </span>
                        </div>
                      )}
                      {Number(sf.montantPaye || 0) > 0 && (
                        <div className="caisse-amount-item">
                          <span className="lbl">Déjà Versé</span>
                          <span className="val text-green">
                            {Number(sf.montantPaye).toLocaleString()} F
                          </span>
                        </div>
                      )}
                      <div className="caisse-amount-item reste-item">
                        <span className="lbl">Reste Dû</span>
                        <span className="val text-danger">
                          {Number(reste).toLocaleString()} F
                        </span>
                      </div>
                    </div>

                    {/* Médecin / Prescripteur */}
                    {sf.medecinNomComplet && (
                      <div className="caisse-sf-practitioner">
                        <FaUserMd className="mini-icon" /> Praticien : {sf.medecinNomComplet}
                      </div>
                    )}

                    {/* Assurance & Garant */}
                    {sf.assuranceLibelle && (
                      <div className="caisse-sf-assurance">
                        <FaShieldAlt className="mini-icon" /> Assurance : {sf.assuranceLibelle}
                        {sf.garantLibelle && ` (${sf.garantLibelle})`}
                      </div>
                    )}

                    {/* Actes détaillés */}
                    {sf.details && sf.details.length > 0 && (
                      <div className="caisse-sf-details-toggle">
                        <button
                          type="button"
                          className="btn-toggle-details"
                          onClick={() => setExpandedSfId(isExpanded ? null : sf.id)}
                        >
                          {isExpanded ? <FaChevronUp /> : <FaChevronDown />}{' '}
                          {sf.details.length} acte(s) détaillé(s)
                        </button>

                        {isExpanded && (
                          <div className="caisse-sf-details-table-wrap">
                            <table className="caisse-details-table">
                              <thead>
                                <tr>
                                  <th>Acte</th>
                                  <th>PU</th>
                                  <th>Qté</th>
                                  <th>Total Brut</th>
                                  <th>Part Patient</th>
                                </tr>
                              </thead>
                              <tbody>
                                {sf.details.map((d, idx) => (
                                  <tr key={idx}>
                                    <td>{d.libelleActe}</td>
                                    <td>{Number(d.prixUnitaire || 0).toLocaleString()}</td>
                                    <td>{d.quantite || 1}</td>
                                    <td>{Number(d.montantBrut || 0).toLocaleString()} F</td>
                                    <td>
                                      <strong>
                                        {Number(d.partPatient || 0).toLocaleString()} F
                                      </strong>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Colonne Droite : Formulaire d'Encaissement & Versement */}
        <div className="caisse-right-panel">
          <form onSubmit={handleSubmit} className="caisse-payment-form">
            <div className="caisse-summary-box">
              <div className="caisse-summary-header">
                <FaCashRegister /> Encaissement & Règlement
              </div>

              <div className="caisse-summary-row">
                <span>Sous-factures cochées :</span>
                <strong>{selectedSousFactures.length} sélectionnée(s)</strong>
              </div>

              <div className="caisse-summary-row">
                <span>Total Reste Patient sélectionné :</span>
                <span className="summary-val">
                  {totalPartPatientSelected.toLocaleString()} FCFA
                </span>
              </div>

              {/* Bloc Remise */}
              <div className="caisse-remise-section">
                <div className="caisse-remise-header">
                  <label className="remise-label">
                    <FaPercent className="mini-icon" /> Remise commerciale / Indigence
                  </label>
                  <div className="remise-type-toggle">
                    <button
                      type="button"
                      className={`btn-toggle-type ${remiseType === 'montant' ? 'active' : ''}`}
                      onClick={() => setRemiseType('montant')}
                    >
                      FCFA
                    </button>
                    <button
                      type="button"
                      className={`btn-toggle-type ${remiseType === 'pourcentage' ? 'active' : ''}`}
                      onClick={() => setRemiseType('pourcentage')}
                    >
                      %
                    </button>
                  </div>
                </div>

                <div className="caisse-remise-inputs">
                  <div className="remise-input-group">
                    <input
                      type="number"
                      min="0"
                      max={remiseType === 'pourcentage' ? '100' : totalPartPatientSelected}
                      placeholder={remiseType === 'montant' ? 'Montant en FCFA' : 'Taux en %'}
                      value={remiseValue}
                      onChange={(e) => setRemiseValue(e.target.value)}
                      className="caisse-input"
                    />
                    <span className="input-suffix">
                      {remiseType === 'montant' ? 'FCFA' : '%'}
                    </span>
                  </div>

                  <input
                    type="text"
                    placeholder="Motif de la remise (ex: Geste, Personnel...)"
                    value={remiseMotif}
                    onChange={(e) => setRemiseMotif(e.target.value)}
                    className="caisse-input remise-motif"
                  />
                </div>

                {remiseNum > 0 && (
                  <div className="remise-applied-pill">
                    Remise calculée : <strong>-{remiseNum.toLocaleString()} FCFA</strong>
                  </div>
                )}
              </div>

              {/* Net à Payer Banner */}
              <div className="caisse-net-banner">
                <span className="net-label">Net à Payer (Patient) :</span>
                <span className="net-value">{netAPayer.toLocaleString()} FCFA</span>
              </div>

              {/* Montant Versé & Tranches */}
              <div className="caisse-versement-section">
                <label className="section-label">
                  <FaCoins className="mini-icon" /> Montant Versé / Encaissé (FCFA) *
                </label>
                <div className="versement-input-group">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    required
                    placeholder="Saisir le montant payé"
                    value={montantVerse}
                    onChange={(e) => setMontantVerse(e.target.value)}
                    className="caisse-input input-large"
                  />
                  <button
                    type="button"
                    className="btn-quick-fill"
                    onClick={() => setMontantVerse(String(netAPayer))}
                    title="Payer l'intégralité du net"
                  >
                    Tout solder
                  </button>
                </div>

                {/* Statut de paiement résultant */}
                <div className="caisse-payment-feedback">
                  {resteApresVersement > 0 ? (
                    <div className="feedback-badge tranche-badge">
                      <span>Reste à payer (Tranche suivante) :</span>
                      <strong>{resteApresVersement.toLocaleString()} FCFA</strong>
                    </div>
                  ) : monnaieRendue > 0 ? (
                    <div className="feedback-badge monnaie-badge">
                      <span>Monnaie à rendre :</span>
                      <strong>{monnaieRendue.toLocaleString()} FCFA</strong>
                    </div>
                  ) : (
                    <div className="feedback-badge solde-badge">
                      <FaCheckCircle /> Règlement intégral (Soldé)
                    </div>
                  )}
                </div>
              </div>

              {/* Mode de Règlement */}
              <div className="caisse-mode-section">
                <label className="section-label">Mode de Règlement *</label>
                <div className="caisse-modes-grid">
                  {MODES_PAIEMENT.map((m) => {
                    const Icon = m.icon
                    const isSelected = modePaiement === m.key
                    return (
                      <button
                        type="button"
                        key={m.key}
                        className={`caisse-mode-card ${isSelected ? 'active' : ''}`}
                        onClick={() => setModePaiement(m.key)}
                      >
                        <Icon className="mode-icon" style={{ color: m.color }} />
                        <span className="mode-label">{m.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Métadonnées du Versement */}
              <div className="caisse-meta-grid">
                <div className="form-group">
                  <label>
                    <FaCalendarAlt className="mini-icon" /> Date & Heure du Versement *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={dateVersement}
                    onChange={(e) => setDateVersement(e.target.value)}
                    className="caisse-input"
                  />
                </div>

                <div className="form-group">
                  <label>
                    <FaUserCheck className="mini-icon" /> Nom du Caissier *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Nom de l'agent"
                    value={caissier}
                    onChange={(e) => setCaissier(e.target.value)}
                    className="caisse-input"
                  />
                </div>
              </div>

              <div className="caisse-meta-grid">
                <div className="form-group">
                  <label>N° Référence / Chèque / Transaction (optionnel)</label>
                  <input
                    type="text"
                    placeholder="Ex: WAVE-TX123, CHQ-456"
                    value={referencePaiement}
                    onChange={(e) => setReferencePaiement(e.target.value)}
                    className="caisse-input"
                  />
                </div>

                <div className="form-group">
                  <label>Observations / Notes</label>
                  <input
                    type="text"
                    placeholder="Remarques éventuelles"
                    value={observations}
                    onChange={(e) => setObservations(e.target.value)}
                    className="caisse-input"
                  />
                </div>
              </div>

              {/* Bouton de validation */}
              <div className="caisse-actions-bar">
                <button
                  type="submit"
                  className="btn btn-primary caisse-submit-btn"
                  disabled={submitting || selectedSfIds.length === 0}
                >
                  <FaCashRegister />
                  {submitting
                    ? 'Enregistrement en cours...'
                    : `Valider l'encaissement (${montantVerseNum.toLocaleString()} FCFA)`}
                </button>
              </div>
            </div>
          </form>

          {/* Historique des Versements Antérieurs */}
          {visite.versements && visite.versements.length > 0 && (
            <div className="caisse-history-box">
              <div className="caisse-history-title">
                <FaReceipt /> Historique des Versements ({visite.versements.length})
              </div>
              <div className="caisse-history-list">
                {visite.versements.map((v) => (
                  <div key={v.id} className="caisse-history-item">
                    <div className="history-main">
                      <div className="history-num-row">
                        <span className="history-recu-num">{v.numeroVersement}</span>
                        <span className="history-date">
                          {formatDateTime(v.dateVersement)}
                        </span>
                      </div>
                      <div className="history-meta-row">
                        <span>
                          Mode : <strong>{v.modePaiement}</strong>
                        </span>
                        {v.caissier && <span>Caissier : {v.caissier}</span>}
                        {Number(v.remise || 0) > 0 && (
                          <span className="text-orange">
                            Remise : -{Number(v.remise).toLocaleString()} F
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="history-amount-action">
                      <span className="history-amount">
                        {Number(v.montantVerse).toLocaleString()} FCFA
                      </span>
                      {onOpenRecu && (
                        <button
                          type="button"
                          className="btn-print-mini"
                          onClick={() => onOpenRecu(v)}
                          title="Imprimer le reçu"
                        >
                          <FaReceipt /> Reçu
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
