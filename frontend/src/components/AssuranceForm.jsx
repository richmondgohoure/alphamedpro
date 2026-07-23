import { useState } from 'react'
import { FaPlus } from 'react-icons/fa'
import { garantsApi } from '../api/garantsApi'
import '../styles/form.css'

const EMPTY_ASSURANCE = {
  libelle: '',
  ncc: '',
  numeroTelephone: '',
  email: '',
  prixConsultationGeneraliste: '',
  prixConsultationSpecialiste: '',
  coutB: '',
  coutZ: '',
  coutK: '',
  prixChambreTriple: '',
  prixChambreDouble: '',
  prixChambreIndividuelleSimple: '',
  prixChambreVip: '',
  prixChambreVvip: '',
  garantIds: [],
}

const EMPTY_GARANT = { libelle: '', numeroTelephone: '', email: '' }

const PRICE_FIELDS = [
  { key: 'prixConsultationGeneraliste', label: 'Prix consultation généraliste' },
  { key: 'prixConsultationSpecialiste', label: 'Prix consultation spécialiste' },
  { key: 'coutB', label: 'Coût du B' },
  { key: 'coutZ', label: 'Coût du Z' },
  { key: 'coutK', label: 'Coût du K' },
]

const ROOM_FIELDS = [
  { key: 'prixChambreTriple', label: 'Chambre triple' },
  { key: 'prixChambreDouble', label: 'Chambre double' },
  { key: 'prixChambreIndividuelleSimple', label: 'Chambre individuelle simple' },
  { key: 'prixChambreVip', label: 'Chambre VIP' },
  { key: 'prixChambreVvip', label: 'Chambre VVIP' },
]

function AssuranceForm({ initialValue, garants, onGarantCreated, onSubmit, onCancel, submitting, serverError }) {
  const [values, setValues] = useState({ ...EMPTY_ASSURANCE, ...initialValue })
  const [newGarant, setNewGarant] = useState(EMPTY_GARANT)
  const [garantSubmitting, setGarantSubmitting] = useState(false)
  const [garantError, setGarantError] = useState(null)

  const handleChange = (field) => (e) => {
    setValues((prev) => ({ ...prev, [field]: e.target.value }))
  }

  const toggleGarant = (id) => {
    setValues((prev) => {
      const has = prev.garantIds.includes(id)
      return {
        ...prev,
        garantIds: has
          ? prev.garantIds.filter((existingId) => existingId !== id)
          : [...prev.garantIds, id],
      }
    })
  }

  const handleAddGarant = async () => {
    if (!newGarant.libelle.trim()) {
      setGarantError('Le libellé du garant est obligatoire')
      return
    }
    setGarantSubmitting(true)
    setGarantError(null)
    try {
      const created = await garantsApi.create(newGarant)
      onGarantCreated(created)
      setValues((prev) => ({ ...prev, garantIds: [...prev.garantIds, created.id] }))
      setNewGarant(EMPTY_GARANT)
    } catch (err) {
      setGarantError(err.message)
    } finally {
      setGarantSubmitting(false)
    }
  }

  const toNumberOrNull = (value) => (value === '' || value === null || value === undefined ? null : Number(value))

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit({
      ...values,
      prixConsultationGeneraliste: toNumberOrNull(values.prixConsultationGeneraliste),
      prixConsultationSpecialiste: toNumberOrNull(values.prixConsultationSpecialiste),
      coutB: toNumberOrNull(values.coutB),
      coutZ: toNumberOrNull(values.coutZ),
      coutK: toNumberOrNull(values.coutK),
      prixChambreTriple: toNumberOrNull(values.prixChambreTriple),
      prixChambreDouble: toNumberOrNull(values.prixChambreDouble),
      prixChambreIndividuelleSimple: toNumberOrNull(values.prixChambreIndividuelleSimple),
      prixChambreVip: toNumberOrNull(values.prixChambreVip),
      prixChambreVvip: toNumberOrNull(values.prixChambreVvip),
    })
  }

  return (
    <form onSubmit={handleSubmit}>
      {serverError && <div className="form-error-banner">{serverError}</div>}

      <div className="form-grid">
        <div className="form-section-title">Informations générales</div>
        <div className="form-field">
          <label>Libellé</label>
          <input value={values.libelle} onChange={handleChange('libelle')} required />
        </div>
        <div className="form-field">
          <label>NCC</label>
          <input value={values.ncc} onChange={handleChange('ncc')} />
        </div>
        <div className="form-field">
          <label>Numéro de téléphone</label>
          <input type="tel" value={values.numeroTelephone} onChange={handleChange('numeroTelephone')} />
        </div>
        <div className="form-field">
          <label>Email</label>
          <input type="email" value={values.email} onChange={handleChange('email')} />
        </div>

        <div className="form-section-title">Tarifs consultations et actes</div>
        {PRICE_FIELDS.map(({ key, label }) => (
          <div className="form-field" key={key}>
            <label>{label}</label>
            <input type="number" step="0.01" min="0" value={values[key]} onChange={handleChange(key)} />
          </div>
        ))}

        <div className="form-section-title">Tarifs chambres</div>
        {ROOM_FIELDS.map(({ key, label }) => (
          <div className="form-field" key={key}>
            <label>{label}</label>
            <input type="number" step="0.01" min="0" value={values[key]} onChange={handleChange(key)} />
          </div>
        ))}

        <div className="form-field full-width">
          <label>Garants</label>
          {garants.length === 0 ? (
            <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>
              Aucun garant enregistré pour le moment.
            </p>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {garants.map((garant) => (
                <label key={garant.id} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                  <input
                    type="checkbox"
                    checked={values.garantIds.includes(garant.id)}
                    onChange={() => toggleGarant(garant.id)}
                  />
                  {garant.libelle}
                </label>
              ))}
            </div>
          )}

          <div className="garant-inline-form">
            {garantError && <div className="form-error-banner">{garantError}</div>}
            <input
              placeholder="Libellé du garant"
              value={newGarant.libelle}
              onChange={(e) => setNewGarant((prev) => ({ ...prev, libelle: e.target.value }))}
            />
            <input
              placeholder="Téléphone"
              value={newGarant.numeroTelephone}
              onChange={(e) => setNewGarant((prev) => ({ ...prev, numeroTelephone: e.target.value }))}
            />
            <input
              placeholder="Email"
              value={newGarant.email}
              onChange={(e) => setNewGarant((prev) => ({ ...prev, email: e.target.value }))}
            />
            <button type="button" className="btn-secondary" onClick={handleAddGarant} disabled={garantSubmitting}>
              <FaPlus /> Ajouter
            </button>
          </div>
        </div>
      </div>

      <div className="form-actions">
        <button type="button" className="btn-secondary" onClick={onCancel}>
          Annuler
        </button>
        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? 'Enregistrement...' : 'Enregistrer'}
        </button>
      </div>
    </form>
  )
}

export default AssuranceForm
