import { useState, useEffect, useMemo } from 'react'
import {
  FaCashRegister,
  FaReceipt,
  FaSearch,
  FaTimes,
  FaCalendarAlt,
  FaCheckCircle,
  FaClock,
  FaExclamationCircle,
  FaCoins,
  FaUser,
  FaShieldAlt,
  FaSync,
  FaFileInvoiceDollar,
  FaFolderOpen,
  FaHandHoldingUsd,
  FaListUl,
} from 'react-icons/fa'
import PageHeader from '../components/PageHeader'
import Modal from '../components/Modal'
import CaisseEncaissementModal from '../components/CaisseEncaissementModal'
import RecuCaisseModal from '../components/RecuCaisseModal'
import { caisseApi } from '../api/caisseApi'
import { formatDateTime, formatDate } from '../utils/dateUtils'
import './CaissePage.css'

export default function CaissePage() {
  const [visites, setVisites] = useState([])
  const [versements, setVersements] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Filtres
  const [activeTab, setActiveTab] = useState('tous') // 'tous' | 'non_paye' | 'partiel' | 'paye' | 'journal'
  const [searchTerm, setSearchTerm] = useState('')
  const [dateFilter, setDateFilter] = useState('')

  // Modales
  const [encaissementVisiteId, setEncaissementVisiteId] = useState(null)
  const [activeRecuVersement, setActiveRecuVersement] = useState(null)

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [visitesData, versementsData] = await Promise.all([
        caisseApi.getVisites(),
        caisseApi.getAllVersements(),
      ])
      setVisites(visitesData)
      setVersements(versementsData)
    } catch (err) {
      setError(err.message || 'Impossible de charger les données de la caisse.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Filtrage des visites
  const filteredVisites = useMemo(() => {
    return visites.filter((v) => {
      // Filtre d'onglet
      if (activeTab === 'non_paye' && v.statutPaiement !== 'NON_PAYE') return false
      if (activeTab === 'partiel' && v.statutPaiement !== 'PARTIELLEMENT_PAYE') return false
      if (activeTab === 'paye' && v.statutPaiement !== 'PAYE') return false

      // Filtre de date
      if (dateFilter && (!v.dateVisite || !v.dateVisite.startsWith(dateFilter))) return false

      // Filtre de recherche textuelle
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
  }, [visites, activeTab, dateFilter, searchTerm])

  // Filtrage du journal des versements
  const filteredVersements = useMemo(() => {
    return versements.filter((ver) => {
      if (dateFilter) {
        const verDate = ver.dateVersement?.slice(0, 10)
        if (verDate !== dateFilter) return false
      }
      if (searchTerm) {
        const q = searchTerm.toLowerCase().trim()
        const matchNum = ver.numeroVersement?.toLowerCase().includes(q)
        const matchVis = ver.numeroVisite?.toLowerCase().includes(q)
        const matchNom = ver.patientNom?.toLowerCase().includes(q)
        const matchPrenom = ver.patientPrenom?.toLowerCase().includes(q)
        const matchMode = ver.modePaiement?.toLowerCase().includes(q)
        const matchCaissier = ver.caissier?.toLowerCase().includes(q)
        const matchRef = ver.referencePaiement?.toLowerCase().includes(q)
        return matchNum || matchVis || matchNom || matchPrenom || matchMode || matchCaissier || matchRef
      }
      return true
    })
  }, [versements, dateFilter, searchTerm])

  // KPI globaux
  const kpiTotalVisites = visites.length
  const kpiTotalEncaisse = versements.reduce((acc, v) => acc + Number(v.montantVerse || 0), 0)
  const kpiTotalReste = visites.reduce((acc, v) => acc + Number(v.totalResteAPayer || 0), 0)
  const kpiTotalRemises = versements.reduce((acc, v) => acc + Number(v.remise || 0), 0)

  // Compteurs d'onglets
  const countNonPaye = visites.filter((v) => v.statutPaiement === 'NON_PAYE').length
  const countPartiel = visites.filter((v) => v.statutPaiement === 'PARTIELLEMENT_PAYE').length
  const countPaye = visites.filter((v) => v.statutPaiement === 'PAYE').length

  const handlePaymentSuccess = () => {
    loadData()
  }

  const handleResetFilters = () => {
    setSearchTerm('')
    setDateFilter('')
  }

  return (
    <main className="caisse-page">
      <PageHeader
        title="Caisse & Encaissements"
        subtitle="Règlement des sous-factures de prise en charge, application de remises et suivi des versements"
      >
        <button
          type="button"
          className="btn btn-secondary caisse-refresh-btn"
          onClick={loadData}
          disabled={loading}
          title="Actualiser les dossiers"
        >
          <FaSync className={loading ? 'caisse-spin' : ''} /> Actualiser
        </button>
      </PageHeader>

      {/* Cartes KPI 3D */}
      <section className="caisse-kpi-grid">
        <div className="caisse-kpi-card">
          <div className="kpi-icon-wrap icon-purple">
            <FaFileInvoiceDollar />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Dossiers Visites</span>
            <strong className="kpi-value">{kpiTotalVisites}</strong>
            <span className="kpi-sub">
              {countNonPaye} en attente • {countPartiel} partiel(s)
            </span>
          </div>
        </div>

        <div className="caisse-kpi-card">
          <div className="kpi-icon-wrap icon-green">
            <FaCoins />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Total Encaissé</span>
            <strong className="kpi-value text-green">
              {kpiTotalEncaisse.toLocaleString()} <small>FCFA</small>
            </strong>
            <span className="kpi-sub">{versements.length} versement(s) au total</span>
          </div>
        </div>

        <div className="caisse-kpi-card">
          <div className="kpi-icon-wrap icon-red">
            <FaHandHoldingUsd />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Reste à Recouvrer</span>
            <strong className="kpi-value text-danger">
              {kpiTotalReste.toLocaleString()} <small>FCFA</small>
            </strong>
            <span className="kpi-sub">Ticket modérateur restant</span>
          </div>
        </div>

        <div className="caisse-kpi-card">
          <div className="kpi-icon-wrap icon-orange">
            <FaReceipt />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Remises Accordées</span>
            <strong className="kpi-value text-orange">
              {kpiTotalRemises.toLocaleString()} <small>FCFA</small>
            </strong>
            <span className="kpi-sub">Gestes & exonérations</span>
          </div>
        </div>
      </section>

      {/* Section Principale */}
      <section className="caisse-main-section">
        {/* Navigation par Onglets */}
        <div className="caisse-tabs-bar">
          <button
            type="button"
            className={`caisse-tab ${activeTab === 'tous' ? 'active' : ''}`}
            onClick={() => setActiveTab('tous')}
          >
            <FaListUl /> Toutes les Visites
            <span className="tab-pill">{visites.length}</span>
          </button>

          <button
            type="button"
            className={`caisse-tab ${activeTab === 'non_paye' ? 'active' : ''}`}
            onClick={() => setActiveTab('non_paye')}
          >
            <FaExclamationCircle className="tab-icon-red" /> En attente / Non payé
            {countNonPaye > 0 && <span className="tab-pill pill-red">{countNonPaye}</span>}
          </button>

          <button
            type="button"
            className={`caisse-tab ${activeTab === 'partiel' ? 'active' : ''}`}
            onClick={() => setActiveTab('partiel')}
          >
            <FaClock className="tab-icon-blue" /> Partiellement payé
            {countPartiel > 0 && <span className="tab-pill pill-blue">{countPartiel}</span>}
          </button>

          <button
            type="button"
            className={`caisse-tab ${activeTab === 'paye' ? 'active' : ''}`}
            onClick={() => setActiveTab('paye')}
          >
            <FaCheckCircle className="tab-icon-green" /> Soldé / Réglé
            <span className="tab-pill">{countPaye}</span>
          </button>

          <button
            type="button"
            className={`caisse-tab ${activeTab === 'journal' ? 'active' : ''}`}
            onClick={() => setActiveTab('journal')}
          >
            <FaReceipt /> Journal des Versements
            <span className="tab-pill pill-purple">{versements.length}</span>
          </button>
        </div>

        {/* Barre de Recherche & Filtre de Date */}
        <div className="caisse-toolbar">
          <div className="caisse-search-wrap">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Rechercher par N° Visite, patient, N° dossier, téléphone, N° reçu..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="caisse-search-input"
            />
            {searchTerm && (
              <button
                type="button"
                className="btn-clear-search"
                onClick={() => setSearchTerm('')}
                title="Effacer la recherche"
              >
                <FaTimes />
              </button>
            )}
          </div>

          <div className="caisse-date-wrap">
            <label>
              <FaCalendarAlt /> Date :
            </label>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="caisse-date-input"
            />
          </div>

          {(searchTerm || dateFilter) && (
            <button
              type="button"
              className="btn btn-secondary btn-reset-filters"
              onClick={handleResetFilters}
            >
              <FaTimes /> Réinitialiser
            </button>
          )}
        </div>

        {/* Tableau Visites ou Journal */}
        {error && <div className="caisse-alert alert-error">{error}</div>}

        {activeTab !== 'journal' ? (
          <div className="data-table-container caisse-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>N° Visite</th>
                  <th>Date & Heure</th>
                  <th>Patient & Dossier</th>
                  <th className="text-right">Total Brut</th>
                  <th className="text-right">Part Assurance</th>
                  <th className="text-right">Part Patient</th>
                  <th className="text-right">Déjà Payé</th>
                  <th className="text-right">Reste Dû</th>
                  <th className="text-center">Statut</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="10" className="text-center py-6">
                      <div className="caisse-spinner" style={{ margin: '0 auto' }} />
                      <p className="mt-2 text-muted">Chargement des visites...</p>
                    </td>
                  </tr>
                ) : filteredVisites.length === 0 ? (
                  <tr>
                    <td colSpan="10" className="text-center py-8">
                      <div className="caisse-empty-wrap">
                        <FaFileInvoiceDollar className="empty-icon" />
                        <h3>Aucune visite trouvée</h3>
                        <p className="text-muted">
                          {searchTerm || dateFilter
                            ? 'Aucun résultat ne correspond à vos filtres.'
                            : 'Toutes les visites enregistrées apparaîtront ici automatiquement dès validation de la prise en charge.'}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredVisites.map((visite) => {
                    const initials = `${visite.patientPrenom?.[0] || 'P'}${
                      visite.patientNom?.[0] || ''
                    }`
                    const isSolde = visite.statutPaiement === 'PAYE'
                    const isPartiel = visite.statutPaiement === 'PARTIELLEMENT_PAYE'

                    return (
                      <tr key={visite.id} className={isSolde ? 'row-solde' : ''}>
                        <td>
                          <span className="code-pill caisse-visite-pill">
                            <FaReceipt className="pill-icon" />
                            {visite.numeroVisite}
                          </span>
                        </td>
                        <td>
                          <span className="caisse-date-cell">
                            <FaCalendarAlt style={{ marginRight: 5, opacity: 0.7 }} />
                            {formatDateTime(visite.dateVisite)}
                          </span>
                        </td>
                        <td>
                          <div className="patient-identity-cell">
                            <div className="patient-avatar-mini">{initials}</div>
                            <div className="patient-text-group">
                              <strong className="patient-name">
                                {visite.patientPrenom} {visite.patientNom}
                              </strong>
                              <div className="patient-sub-pills">
                                <span className="dp-mini-pill">
                                  <FaFolderOpen />{' '}
                                  {visite.patientNumeroDossier ||
                                    `DP-${String(visite.patientId).padStart(7, '0')}`}
                                </span>
                                {visite.patientTelephone && (
                                  <span className="tel-mini">📞 {visite.patientTelephone}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="text-right font-semibold">
                          {Number(visite.montantTotalBrut || 0).toLocaleString()} F
                        </td>
                        <td className="text-right text-blue font-semibold">
                          {Number(visite.totalPartAssurance || 0).toLocaleString()} F
                        </td>
                        <td className="text-right text-purple font-bold">
                          {Number(visite.totalPartPatient || 0).toLocaleString()} F
                        </td>
                        <td className="text-right text-green font-bold">
                          {Number(visite.totalPaye || 0) > 0
                            ? `${Number(visite.totalPaye).toLocaleString()} F`
                            : '-'}
                        </td>
                        <td className="text-right">
                          <strong
                            className={
                              Number(visite.totalResteAPayer || 0) > 0
                                ? 'text-danger font-bold'
                                : 'text-green font-bold'
                            }
                          >
                            {Number(visite.totalResteAPayer || 0).toLocaleString()} F
                          </strong>
                        </td>
                        <td className="text-center">
                          <span
                            className={`caisse-status-badge status-${
                              visite.statutPaiement?.toLowerCase() || 'non_paye'
                            }`}
                          >
                            {isSolde ? '✓ Soldé' : isPartiel ? '⏳ Partiel' : '⚠️ Non payé'}
                          </span>
                        </td>
                        <td className="text-right">
                          <div className="table-actions justify-end">
                            <button
                              type="button"
                              className="table-action-btn caisse-encaissement-btn"
                              onClick={() => setEncaissementVisiteId(visite.id)}
                              title="Ouvrir la visite pour encaisser les sous-factures"
                            >
                              <FaCashRegister /> {isSolde ? 'Détail' : 'Encaisser'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        ) : (
          /* Journal des Versements */
          <div className="data-table-container caisse-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>N° Reçu</th>
                  <th>Date & Heure</th>
                  <th>Patient</th>
                  <th>N° Visite</th>
                  <th className="text-right">Montant Versé</th>
                  <th className="text-right">Remise</th>
                  <th className="text-right">Reste Visite</th>
                  <th className="text-center">Mode</th>
                  <th>Caissier</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="10" className="text-center py-6">
                      <div className="caisse-spinner" style={{ margin: '0 auto' }} />
                      <p className="mt-2 text-muted">Chargement du journal des versements...</p>
                    </td>
                  </tr>
                ) : filteredVersements.length === 0 ? (
                  <tr>
                    <td colSpan="10" className="text-center py-8">
                      <div className="caisse-empty-wrap">
                        <FaReceipt className="empty-icon" />
                        <h3>Aucun versement enregistré</h3>
                        <p className="text-muted">
                          Tous les encaissements et versements effectués généreront un reçu officiel
                          listé ici.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredVersements.map((v) => (
                    <tr key={v.id}>
                      <td>
                        <span className="code-pill caisse-recu-pill">
                          <FaReceipt /> {v.numeroVersement}
                        </span>
                      </td>
                      <td>
                        <FaCalendarAlt style={{ marginRight: 5, opacity: 0.7 }} />
                        {formatDateTime(v.dateVersement)}
                      </td>
                      <td>
                        <strong>
                          {v.patientPrenom} {v.patientNom}
                        </strong>
                      </td>
                      <td>
                        <span className="monospace text-purple font-bold">{v.numeroVisite}</span>
                      </td>
                      <td className="text-right font-bold text-green">
                        {Number(v.montantVerse || 0).toLocaleString()} FCFA
                      </td>
                      <td className="text-right">
                        {Number(v.remise || 0) > 0 ? (
                          <span className="text-orange font-bold">
                            -{Number(v.remise).toLocaleString()} F
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="text-right">
                        <span
                          className={
                            Number(v.resteAPayer || 0) === 0 ? 'text-green font-bold' : 'text-danger'
                          }
                        >
                          {Number(v.resteAPayer || 0) === 0
                            ? '0 F (Soldé)'
                            : `${Number(v.resteAPayer).toLocaleString()} F`}
                        </span>
                      </td>
                      <td className="text-center">
                        <span className="caisse-mode-chip">{v.modePaiement}</span>
                      </td>
                      <td>{v.caissier || 'Caisse'}</td>
                      <td className="text-right">
                        <button
                          type="button"
                          className="table-action-btn recu-print-action-btn"
                          onClick={() => setActiveRecuVersement(v)}
                          title="Imprimer / Visualiser le reçu de caisse"
                        >
                          <FaReceipt /> Reçu
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Modale d'Encaissement */}
      {encaissementVisiteId && (
        <Modal
          title="Encaissement & Règlement de Visite — Caisse AlphaMedPro"
          onClose={() => setEncaissementVisiteId(null)}
          size="xl"
        >
          <CaisseEncaissementModal
            visiteId={encaissementVisiteId}
            onClose={() => setEncaissementVisiteId(null)}
            onPaymentSuccess={handlePaymentSuccess}
            onOpenRecu={(versement) => setActiveRecuVersement(versement)}
          />
        </Modal>
      )}

      {/* Modale Reçu de Caisse Officiel */}
      {activeRecuVersement && (
        <Modal
          title={`Reçu de Caisse Officiel — ${activeRecuVersement.numeroVersement}`}
          onClose={() => setActiveRecuVersement(null)}
          size="large"
        >
          <RecuCaisseModal
            versement={activeRecuVersement}
            onClose={() => setActiveRecuVersement(null)}
          />
        </Modal>
      )}
    </main>
  )
}
