import { useState } from 'react'
import '../styles/form.css'

const EMPTY_PATIENT = {
  nom: '',
  prenom: '',
  dateNaissance: '',
  numeroTelephone: '',
  quartier: '',
  profession: '',
  assurances: [],
}

function PatientForm({ initialValue, assurances, onSubmit, onCancel, submitting, serverError }) {
  const [values, setValues] = useState({ ...EMPTY_PATIENT, ...initialValue })

  const handleChange = (field) => (e) => {
    setValues((prev) => ({ ...prev, [field]: e.target.value }))
  }

  const isAssuranceSelected = (assuranceId) =>
    values.assurances.some((a) => a.assuranceId === assuranceId)

  const getNumeroMatricule = (assuranceId) =>
    values.assurances.find((a) => a.assuranceId === assuranceId)?.numeroMatricule || ''

  const toggleAssurance = (assuranceId) => {
    setValues((prev) => {
      const has = prev.assurances.some((a) => a.assuranceId === assuranceId)
      return {
        ...prev,
        assurances: has
          ? prev.assurances.filter((a) => a.assuranceId !== assuranceId)
          : [...prev.assurances, { assuranceId, numeroMatricule: '' }],
      }
    })
  }

  const updateNumeroMatricule = (assuranceId, numeroMatricule) => {
    setValues((prev) => ({
      ...prev,
      assurances: prev.assurances.map((a) =>
        a.assuranceId === assuranceId ? { ...a, numeroMatricule } : a
      ),
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit({
      ...values,
      dateNaissance: values.dateNaissance || null,
    })
  }

  return (
    <form onSubmit={handleSubmit}>
      {serverError && <div className="form-error-banner">{serverError}</div>}

      <div className="form-grid">
        <div className="form-field">
          <label>Nom</label>
          <input value={values.nom} onChange={handleChange('nom')} required />
        </div>
        <div className="form-field">
          <label>Prénom</label>
          <input value={values.prenom} onChange={handleChange('prenom')} required />
        </div>
        <div className="form-field">
          <label>Date de naissance</label>
          <input type="date" value={values.dateNaissance || ''} onChange={handleChange('dateNaissance')} />
        </div>
        <div className="form-field">
          <label>Numéro de téléphone</label>
          <input type="tel" value={values.numeroTelephone} onChange={handleChange('numeroTelephone')} />
        </div>
        <div className="form-field">
          <label>Quartier</label>
          <input value={values.quartier} onChange={handleChange('quartier')} />
        </div>
        <div className="form-field">
          <label>Profession</label>
          <input value={values.profession} onChange={handleChange('profession')} />
        </div>

        <div className="form-field full-width">
          <label>Assurances</label>
          {assurances.length === 0 ? (
            <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>
              Aucune assurance enregistrée pour le moment.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {assurances.map((assurance) => {
                const selected = isAssuranceSelected(assurance.id)
                return (
                  <div
                    key={assurance.id}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}
                  >
                    <label
                      style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, minWidth: 160 }}
                    >
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => toggleAssurance(assurance.id)}
                      />
                      {assurance.libelle}
                    </label>
                    {selected && (
                      <input
                        type="text"
                        placeholder="Numéro matricule de l'assuré"
                        value={getNumeroMatricule(assurance.id)}
                        onChange={(e) => updateNumeroMatricule(assurance.id, e.target.value)}
                        style={{ flex: '1 1 220px', minWidth: 180 }}
                      />
                    )}
                  </div>
                )
              })}
            </div>
          )}
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

export default PatientForm
