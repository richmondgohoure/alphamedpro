import { useEffect, useState } from 'react'
import { FaTrash } from 'react-icons/fa'
import { priseEnChargeApi } from '../api/priseEnChargeApi'
import '../styles/form.css'
import '../styles/table.css'

const EMPTY_PRISE_EN_CHARGE = {
  assuranceId: '',
  dateDemande: '',
  motif: '',
  montant: '',
  statut: 'EN_ATTENTE',
  observation: '',
}

const STATUT_LABELS = {
  EN_ATTENTE: 'En attente',
  ACCEPTEE: 'Acceptée',
  REFUSEE: 'Refusée',
}

const formatDate = (isoDate) => {
  if (!isoDate) return null
  const [year, month, day] = isoDate.split('-')
  return `${day}/${month}/${year}`
}

function PriseEnChargeForm({ patient }) {
  const [prisesEnCharge, setPrisesEnCharge] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)

  const [values, setValues] = useState(EMPTY_PRISE_EN_CHARGE)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState(null)

  const loadPrisesEnCharge = async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const data = await priseEnChargeApi.listByPatient(patient.id)
      setPrisesEnCharge(data)
    } catch (err) {
      setLoadError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPrisesEnCharge()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patient.id])

  const handleChange = (field) => (e) => {
    setValues((prev) => ({ ...prev, [field]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setFormError(null)
    try {
      await priseEnChargeApi.create(patient.id, {
        assuranceId: values.assuranceId || null,
        dateDemande: values.dateDemande || null,
        motif: values.motif,
        montant: values.montant === '' ? null : values.montant,
        statut: values.statut,
        observation: values.observation || null,
      })
      setValues(EMPTY_PRISE_EN_CHARGE)
      await loadPrisesEnCharge()
    } catch (err) {
      setFormError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (priseEnCharge) => {
    if (!window.confirm('Supprimer cette prise en charge ?')) {
      return
    }
    try {
      await priseEnChargeApi.remove(priseEnCharge.id)
      await loadPrisesEnCharge()
    } catch (err) {
      window.alert(err.message)
    }
  }

  return (
    <div>
      <div className="data-table-wrapper" style={{ marginBottom: 20 }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Assurance</th>
              <th>Motif</th>
              <th>Montant</th>
              <th>Statut</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr className="empty-row">
                <td colSpan={6}>Chargement...</td>
              </tr>
            )}
            {!loading && loadError && (
              <tr className="empty-row">
                <td colSpan={6}>Erreur : {loadError}</td>
              </tr>
            )}
            {!loading && !loadError && prisesEnCharge.length === 0 && (
              <tr className="empty-row">
                <td colSpan={6}>Aucune prise en charge enregistrée pour ce patient.</td>
              </tr>
            )}
            {!loading &&
              !loadError &&
              prisesEnCharge.map((priseEnCharge) => (
                <tr key={priseEnCharge.id}>
                  <td>{formatDate(priseEnCharge.dateDemande) || '—'}</td>
                  <td>{priseEnCharge.assuranceLibelle || '—'}</td>
                  <td>{priseEnCharge.motif}</td>
                  <td>{priseEnCharge.montant ?? '—'}</td>
                  <td>{STATUT_LABELS[priseEnCharge.statut] || priseEnCharge.statut}</td>
                  <td>
                    <div className="table-actions">
                      <button
                        type="button"
                        className="table-action-btn danger"
                        onClick={() => handleDelete(priseEnCharge)}
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

      <form onSubmit={handleSubmit}>
        {formError && <div className="form-error-banner">{formError}</div>}

        <div className="form-section-title">Nouvelle prise en charge</div>
        <div className="form-grid">
          <div className="form-field">
            <label>Assurance</label>
            <select value={values.assuranceId} onChange={handleChange('assuranceId')}>
              <option value="">Aucune</option>
              {patient.assurances.map((assurance) => (
                <option key={assurance.assuranceId} value={assurance.assuranceId}>
                  {assurance.libelle}
                </option>
              ))}
            </select>
          </div>
          <div className="form-field">
            <label>Date de la demande</label>
            <input type="date" value={values.dateDemande} onChange={handleChange('dateDemande')} required />
          </div>
          <div className="form-field">
            <label>Motif</label>
            <input value={values.motif} onChange={handleChange('motif')} required />
          </div>
          <div className="form-field">
            <label>Montant</label>
            <input type="number" step="0.01" value={values.montant} onChange={handleChange('montant')} />
          </div>
          <div className="form-field">
            <label>Statut</label>
            <select value={values.statut} onChange={handleChange('statut')}>
              {Object.entries(STATUT_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className="form-field full-width">
            <label>Observation</label>
            <input value={values.observation} onChange={handleChange('observation')} />
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? 'Enregistrement...' : 'Ajouter la prise en charge'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default PriseEnChargeForm
