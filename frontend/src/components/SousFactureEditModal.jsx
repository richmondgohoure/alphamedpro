import { useState, useEffect } from 'react'
import {
  FaTimes,
  FaSave,
  FaPlus,
  FaTrash,
  FaUserMd,
  FaFileInvoiceDollar,
  FaExclamationTriangle,
  FaStethoscope,
  FaFlask,
  FaXRay,
} from 'react-icons/fa'
import Modal from './Modal'
import { medecinsApi } from '../api/medecinsApi'
import { visitesApi } from '../api/visitesApi'
import './SousFactureEditModal.css'

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

export default function SousFactureEditModal({ sousFacture, onClose, onSaveSuccess }) {
  const [medecins, setMedecins] = useState([])
  const [selectedMedecinId, setSelectedMedecinId] = useState(
    sousFacture.medecinId ? String(sousFacture.medecinId) : ''
  )
  const [libelleCategorie, setLibelleCategorie] = useState(
    sousFacture.libelleCategorie || ''
  )

  // Liste des lignes d'actes
  const [details, setDetails] = useState(() => {
    if (sousFacture.details && sousFacture.details.length > 0) {
      return sousFacture.details.map((d) => ({
        id: d.id,
        acteId: d.acteId,
        libelleActe: d.libelleActe || '',
        category: d.category || sousFacture.libelleCategorie || '',
        prixUnitaire: Number(d.prixUnitaire || 0),
        quantite: Number(d.quantite || 1),
        montantBrut: Number(d.montantBrut || 0),
        partAssurance: Number(d.partAssurance || 0),
        partPatient: Number(d.partPatient || 0),
        tauxCouverture: d.tauxCouverture != null ? Number(d.tauxCouverture) : 80,
        typeCouverture: d.typeCouverture || 'POURCENTAGE',
        montantForfait: d.montantForfait != null ? Number(d.montantForfait) : null,
        coefficientInfo: d.coefficientInfo || '',
        tarifFormula: d.tarifFormula || '',
      }))
    }
    return [
      {
        libelleActe: '',
        category: sousFacture.libelleCategorie || '',
        prixUnitaire: Number(sousFacture.montantBrut || 0),
        quantite: 1,
        montantBrut: Number(sousFacture.montantBrut || 0),
        partAssurance: Number(sousFacture.partAssurance || 0),
        partPatient: Number(sousFacture.partPatient || 0),
        tauxCouverture: 80,
        typeCouverture: 'POURCENTAGE',
      },
    ]
  })

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchMedecins = async () => {
      try {
        const data = await medecinsApi.list()
        setMedecins(data || [])
      } catch {
        // Silencieux
      }
    }
    fetchMedecins()
  }, [])

  // Mise à jour d'un champ d'une ligne d'acte avec recalcul
  const handleDetailChange = (index, field, value) => {
    setDetails((prev) => {
      const copy = [...prev]
      const row = { ...copy[index], [field]: value }

      if (field === 'prixUnitaire' || field === 'quantite') {
        const pu = field === 'prixUnitaire' ? Number(value || 0) : Number(row.prixUnitaire || 0)
        const qte = field === 'quantite' ? Math.max(1, Number(value || 1)) : Number(row.quantite || 1)
        const brut = pu * qte
        row.prixUnitaire = pu
        row.quantite = qte
        row.montantBrut = brut

        // Recalcul part assurance / part patient selon taux
        const taux = Number(row.tauxCouverture || 0)
        if (row.typeCouverture === 'FORFAIT' && row.montantForfait != null) {
          const forfait = Number(row.montantForfait)
          row.partAssurance = Math.min(brut, forfait * qte)
          row.partPatient = Math.max(0, brut - row.partAssurance)
        } else {
          row.partAssurance = Math.round((brut * taux) / 100)
          row.partPatient = Math.max(0, brut - row.partAssurance)
        }
      } else if (field === 'partAssurance') {
        const partAssur = Math.max(0, Number(value || 0))
        const brut = Number(row.montantBrut || 0)
        row.partAssurance = partAssur
        row.partPatient = Math.max(0, brut - partAssur)
      } else if (field === 'partPatient') {
        const partPat = Math.max(0, Number(value || 0))
        const brut = Number(row.montantBrut || 0)
        row.partPatient = partPat
        row.partAssurance = Math.max(0, brut - partPat)
      }

      copy[index] = row
      return copy
    })
  }

  // Ajouter une nouvelle ligne d'acte
  const handleAddRow = () => {
    setDetails((prev) => [
      ...prev,
      {
        libelleActe: '',
        category: libelleCategorie || sousFacture.libelleCategorie || '',
        prixUnitaire: 0,
        quantite: 1,
        montantBrut: 0,
        partAssurance: 0,
        partPatient: 0,
        tauxCouverture: 80,
        typeCouverture: 'POURCENTAGE',
      },
    ])
  }

  // Supprimer une ligne d'acte
  const handleRemoveRow = (index) => {
    if (details.length <= 1) {
      alert('La sous-facture doit contenir au moins un acte médical.')
      return
    }
    setDetails((prev) => prev.filter((_, i) => i !== index))
  }

  // Calcul des totaux
  const totalBrut = details.reduce((sum, d) => sum + Number(d.montantBrut || 0), 0)
  const totalAssurance = details.reduce((sum, d) => sum + Number(d.partAssurance || 0), 0)
  const totalPatient = details.reduce((sum, d) => sum + Number(d.partPatient || 0), 0)

  // Soumission
  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    // Vérifier les libellés
    const invalidRow = details.find((d) => !d.libelleActe || !d.libelleActe.trim())
    if (invalidRow) {
      setError('Veuillez renseigner le libellé de tous les actes médicaux.')
      return
    }

    setSaving(true)
    try {
      const payload = {
        codeCategorie: sousFacture.codeCategorie,
        libelleCategorie: libelleCategorie || sousFacture.libelleCategorie,
        assuranceId: sousFacture.assuranceId,
        garantId: sousFacture.garantId,
        medecinId: selectedMedecinId ? Number(selectedMedecinId) : null,
        montantBrut: totalBrut,
        partAssurance: totalAssurance,
        partPatient: totalPatient,
        details: details.map((d) => ({
          id: d.id || null,
          acteId: d.acteId || null,
          libelleActe: d.libelleActe.trim(),
          category: d.category || libelleCategorie || sousFacture.libelleCategorie,
          prixUnitaire: Number(d.prixUnitaire || 0),
          quantite: Number(d.quantite || 1),
          montantBrut: Number(d.montantBrut || 0),
          partAssurance: Number(d.partAssurance || 0),
          partPatient: Number(d.partPatient || 0),
          tauxCouverture: d.tauxCouverture != null ? Number(d.tauxCouverture) : 80,
          typeCouverture: d.typeCouverture || 'POURCENTAGE',
          montantForfait: d.montantForfait != null ? Number(d.montantForfait) : null,
          coefficientInfo: d.coefficientInfo || null,
          tarifFormula: d.tarifFormula || null,
          medecinId: selectedMedecinId ? Number(selectedMedecinId) : null,
        })),
      }

      const updated = await visitesApi.updateSousFacture(sousFacture.id, payload)
      onSaveSuccess(updated)
    } catch (err) {
      setError(err.message || 'Erreur lors de la modification de la sous-facture.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      title={
        <div className="sf-edit-modal-title">
          <span className="sf-edit-title-icon">
            {getCategoryIcon(sousFacture.codeCategorie)}
          </span>
          <div>
            <span>Modifier la Sous-Facture N° {sousFacture.numeroSousFacture}</span>
            <span className="sf-edit-modal-subtitle">
              Catégorie : {sousFacture.libelleCategorie || sousFacture.codeCategorie} — Patient :{' '}
              {sousFacture.patientPrenom} {sousFacture.patientNom}
            </span>
          </div>
        </div>
      }
      onClose={onClose}
      size="xl"
    >
      <form onSubmit={handleSubmit} className="sf-edit-form">
        {error && (
          <div className="sf-edit-error-banner">
            <FaExclamationTriangle /> {error}
          </div>
        )}

        {/* METADONNEES : CATEGORIE & PRATICIEN */}
        <div className="sf-edit-meta-grid">
          <div className="sf-edit-meta-field">
            <label>Libellé de la Catégorie :</label>
            <input
              type="text"
              className="form-control"
              value={libelleCategorie}
              onChange={(e) => setLibelleCategorie(e.target.value)}
              placeholder="Ex: Consultation, Analyses Médicales..."
              required
            />
          </div>

          <div className="sf-edit-meta-field">
            <label>
              <FaUserMd /> Praticien / Prescripteur assigné :
            </label>
            <select
              className="form-control"
              value={selectedMedecinId}
              onChange={(e) => setSelectedMedecinId(e.target.value)}
            >
              <option value="">-- Aucun praticien spécifié --</option>
              {medecins.map((m) => {
                const titre = m.titre ? `${m.titre} ` : ''
                const spe = m.specialite ? ` (${m.specialite})` : ''
                return (
                  <option key={m.id} value={m.id}>
                    {titre}{m.nom} {m.prenom}{spe}
                  </option>
                )
              })}
            </select>
          </div>
        </div>

        {/* TABLEAU DES ACTES */}
        <div className="sf-edit-table-section">
          <div className="sf-edit-table-header-row">
            <h5>Actes médicaux & examens inclus ({details.length})</h5>
            <button
              type="button"
              className="btn btn-secondary sf-btn-add-row"
              onClick={handleAddRow}
            >
              <FaPlus /> Ajouter un acte
            </button>
          </div>

          <div className="sf-edit-table-wrap">
            <table className="sf-edit-table">
              <thead>
                <tr>
                  <th style={{ width: '35%' }}>Acte / Examen</th>
                  <th style={{ width: '15%' }} className="text-right">Prix Unitaire</th>
                  <th style={{ width: '10%' }} className="text-center">Qté</th>
                  <th style={{ width: '14%' }} className="text-right">Total Brut</th>
                  <th style={{ width: '13%' }} className="text-right">Part Assurance</th>
                  <th style={{ width: '13%' }} className="text-right">Part Patient</th>
                  <th style={{ width: '5%' }} className="text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {details.map((row, idx) => (
                  <tr key={idx}>
                    <td>
                      <input
                        type="text"
                        className="sf-input-cell sf-input-text"
                        placeholder="Désignation de l'acte..."
                        value={row.libelleActe}
                        onChange={(e) => handleDetailChange(idx, 'libelleActe', e.target.value)}
                        required
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        min="0"
                        step="100"
                        className="sf-input-cell text-right"
                        value={row.prixUnitaire}
                        onChange={(e) => handleDetailChange(idx, 'prixUnitaire', e.target.value)}
                        required
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        min="1"
                        className="sf-input-cell text-center"
                        value={row.quantite}
                        onChange={(e) => handleDetailChange(idx, 'quantite', e.target.value)}
                        required
                      />
                    </td>
                    <td className="text-right font-bold">
                      <span className="sf-computed-val">{formatPrice(row.montantBrut)}</span>
                    </td>
                    <td>
                      <input
                        type="number"
                        min="0"
                        className="sf-input-cell text-right text-assurance"
                        value={row.partAssurance}
                        onChange={(e) => handleDetailChange(idx, 'partAssurance', e.target.value)}
                        required
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        min="0"
                        className="sf-input-cell text-right text-patient font-bold"
                        value={row.partPatient}
                        onChange={(e) => handleDetailChange(idx, 'partPatient', e.target.value)}
                        required
                      />
                    </td>
                    <td className="text-center">
                      <button
                        type="button"
                        className="sf-btn-remove-row"
                        onClick={() => handleRemoveRow(idx)}
                        title="Supprimer cette ligne"
                        disabled={details.length <= 1}
                      >
                        <FaTrash />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* SYNTHESE FINANCIERE */}
        <div className="sf-edit-summary-bar">
          <div className="sf-summary-box">
            <span className="sf-summary-label">Total Brut Révisé</span>
            <strong className="sf-summary-value text-violet">{formatPrice(totalBrut)}</strong>
          </div>
          <div className="sf-summary-box">
            <span className="sf-summary-label">Part Assurance</span>
            <strong className="sf-summary-value text-assurance">{formatPrice(totalAssurance)}</strong>
          </div>
          <div className="sf-summary-box">
            <span className="sf-summary-label">Part Patient (Reste dû)</span>
            <strong className="sf-summary-value text-patient">{formatPrice(totalPatient)}</strong>
          </div>
        </div>

        {/* PIED DE MODALE */}
        <div className="sf-edit-modal-footer">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            disabled={saving}
          >
            Annuler
          </button>
          <button
            type="submit"
            className="btn btn-primary sf-btn-save"
            disabled={saving}
          >
            <FaSave /> {saving ? 'Enregistrement en cours...' : 'Enregistrer les modifications'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
