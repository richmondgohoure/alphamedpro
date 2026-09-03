import { useState } from 'react'
import {
  FaShieldAlt,
  FaHandshake,
  FaIdCard,
  FaCheck,
  FaInfoCircle,
} from 'react-icons/fa'
import '../styles/form.css'

const EMPTY_PATIENT = {
  nom: '',
  prenom: '',
  dateNaissance: '',
  numeroTelephone: '',
  quartier: '',
  profession: '',
  code: '',
  assurances: [],
}

function PatientForm({ initialValue, assurances, onSubmit, onCancel, submitting, serverError }) {
  const [values, setValues] = useState(() => {
    if (!initialValue) return EMPTY_PATIENT
    return {
      ...EMPTY_PATIENT,
      ...initialValue,
      assurances: (initialValue.assurances || []).map((a) => ({
        assuranceId: a.assuranceId,
        garantId: a.garantId || '',
        numeroMatricule: a.numeroMatricule || '',
      })),
    }
  })

  const handleChange = (field) => (e) => {
    setValues((prev) => ({ ...prev, [field]: e.target.value }))
  }

  const isAssuranceSelected = (assuranceId) =>
    values.assurances.some((a) => a.assuranceId === assuranceId)

  const getAssuranceEntry = (assuranceId) =>
    values.assurances.find((a) => a.assuranceId === assuranceId)

  const getNumeroMatricule = (assuranceId) =>
    getAssuranceEntry(assuranceId)?.numeroMatricule || ''

  const getGarantId = (assuranceId) =>
    getAssuranceEntry(assuranceId)?.garantId ?? ''

  const toggleAssurance = (assuranceId) => {
    setValues((prev) => {
      const has = prev.assurances.some((a) => a.assuranceId === assuranceId)
      if (has) {
        return {
          ...prev,
          assurances: prev.assurances.filter((a) => a.assuranceId !== assuranceId),
        }
      } else {
        const assObj = (assurances || []).find((a) => a.id === assuranceId)
        // Pré-sélectionner automatiquement le premier garant s'il n'y en a qu'un
        const defaultGarantId =
          assObj?.garants && assObj.garants.length === 1 ? assObj.garants[0].id : ''
        return {
          ...prev,
          assurances: [
            ...prev.assurances,
            { assuranceId, garantId: defaultGarantId, numeroMatricule: '' },
          ],
        }
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

  const updateGarant = (assuranceId, garantId) => {
    setValues((prev) => ({
      ...prev,
      assurances: prev.assurances.map((a) =>
        a.assuranceId === assuranceId
          ? { ...a, garantId: garantId ? Number(garantId) : '' }
          : a
      ),
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit({
      ...values,
      dateNaissance: values.dateNaissance || null,
      assurances: values.assurances.map((a) => ({
        assuranceId: a.assuranceId,
        garantId: a.garantId ? Number(a.garantId) : null,
        numeroMatricule: a.numeroMatricule || '',
      })),
    })
  }

  return (
    <form onSubmit={handleSubmit}>
      {serverError && <div className="form-error-banner">{serverError}</div>}

      <div className="form-grid">
        <div className="form-field">
          <label>Nom</label>
          <input
            value={values.nom}
            onChange={handleChange('nom')}
            placeholder="Ex: Kouamé"
            required
          />
        </div>
        <div className="form-field">
          <label>Prénom</label>
          <input
            value={values.prenom}
            onChange={handleChange('prenom')}
            placeholder="Ex: Jean-Luc"
            required
          />
        </div>
        <div className="form-field">
          <label>Date de naissance</label>
          <input
            type="date"
            value={values.dateNaissance || ''}
            onChange={handleChange('dateNaissance')}
          />
        </div>
        <div className="form-field">
          <label>Numéro de téléphone</label>
          <input
            type="tel"
            value={values.numeroTelephone}
            onChange={handleChange('numeroTelephone')}
            placeholder="Ex: 07 01 02 03 04"
          />
        </div>
        <div className="form-field">
          <label>Quartier</label>
          <input
            value={values.quartier}
            onChange={handleChange('quartier')}
            placeholder="Ex: Cocody Angré"
          />
        </div>
        <div className="form-field">
          <label>Profession</label>
          <input
            value={values.profession}
            onChange={handleChange('profession')}
            placeholder="Ex: Enseignant"
          />
        </div>
        <div className="form-field">
          <label>Code de la carte patient</label>
          <input
            value={values.code}
            onChange={handleChange('code')}
            placeholder="Ex: CARD-000001"
          />
        </div>

        {/* Section Affiliation Assurance & Garant rattaché */}
        <div className="form-field full-width patient-assurances-container">
          <div className="patient-assurances-header">
            <div className="patient-assurances-title">
              <FaShieldAlt className="title-icon" />
              <div>
                <strong>Affiliation Assurance & Garant</strong>
                <p className="patient-assurances-subtext">
                  Sélectionnez la compagnie d'assurance du patient, puis le garant rattaché à cette assurance
                </p>
              </div>
            </div>
          </div>

          {(!assurances || assurances.length === 0) ? (
            <div className="patient-no-assurances">
              <FaInfoCircle /> Aucune assurance enregistrée pour le moment.
            </div>
          ) : (
            <div className="patient-assurances-list">
              {assurances.map((assurance) => {
                const selected = isAssuranceSelected(assurance.id)
                const garantsList = assurance.garants || []
                const selectedGarantId = getGarantId(assurance.id)

                return (
                  <div
                    key={assurance.id}
                    className={`patient-assurance-card ${selected ? 'is-selected' : ''}`}
                  >
                    <div
                      className="patient-assurance-card-header"
                      onClick={() => toggleAssurance(assurance.id)}
                    >
                      <div className="patient-assurance-checkbox-wrapper">
                        <input
                          type="checkbox"
                          id={`chk-ass-${assurance.id}`}
                          checked={selected}
                          onChange={() => toggleAssurance(assurance.id)}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <label
                          htmlFor={`chk-ass-${assurance.id}`}
                          className={`patient-custom-checkbox ${selected ? 'checked' : ''}`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {selected && <FaCheck />}
                        </label>
                      </div>

                      <div className="patient-assurance-main-info">
                        <span className="patient-assurance-name">{assurance.libelle}</span>
                        {assurance.ncc && (
                          <span className="patient-assurance-ncc">NCC: {assurance.ncc}</span>
                        )}
                      </div>

                      <div className="patient-assurance-garants-count">
                        <FaHandshake className="garant-count-icon" />
                        <span>
                          {garantsList.length} garant{garantsList.length > 1 ? 's' : ''} rattaché{garantsList.length > 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>

                    {selected && (
                      <div className="patient-assurance-details-panel">
                        <div className="patient-assurance-inputs-grid">
                          {/* Choix du Garant rattaché à cette assurance */}
                          <div className="patient-subfield">
                            <label>
                              <FaHandshake className="field-icon" /> Garant rattaché :
                            </label>
                            {garantsList.length > 0 ? (
                              <select
                                className="patient-garant-select"
                                value={selectedGarantId}
                                onChange={(e) => updateGarant(assurance.id, e.target.value)}
                              >
                                <option value="">-- Choisir un garant rattaché ({garantsList.length}) --</option>
                                {garantsList.map((g) => (
                                  <option key={g.id} value={g.id}>
                                    {g.libelle}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <div className="patient-no-garant-alert">
                                <FaInfoCircle /> Aucun garant rattaché à cette assurance
                              </div>
                            )}
                          </div>

                          {/* Saisie du Numéro Matricule */}
                          <div className="patient-subfield">
                            <label>
                              <FaIdCard className="field-icon" /> N° Matricule de l'assuré :
                            </label>
                            <input
                              type="text"
                              className="patient-matricule-input"
                              placeholder="Ex: MAT-12345678"
                              value={getNumeroMatricule(assurance.id)}
                              onChange={(e) => updateNumeroMatricule(assurance.id, e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
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
