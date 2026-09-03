import { useState } from 'react'
import { FaUserMd, FaHospital, FaClinicMedical, FaPhoneAlt, FaEnvelope, FaMapMarkerAlt, FaIdCard, FaStethoscope, FaCheck } from 'react-icons/fa'
import '../styles/form.css'

const POPULAR_SPECIALITES = [
  'Médecine Générale',
  'Pédiatrie',
  'Cardiologie',
  'Gynécologie - Obstétrique',
  'Chirurgie Générale',
  'Radiologie & Imagerie',
  'Biologie Médicale / Analyses',
  'Ophtalmologie',
  'Dermatologie',
  'Gastro-entérologie',
  'ORL',
  'Pneumologie',
  'Neurologie',
  'Anesthésie - Réanimation',
  'Traumatologie & Orthopédie',
  'Urologie',
  'Soins Infirmiers',
  'Maïeutique / Maternité',
]

const QUICK_SPECIALITE_SUGGESTIONS = [
  'Médecine Générale',
  'Pédiatrie',
  'Cardiologie',
  'Gynécologie - Obstétrique',
  'Chirurgie Générale',
  'Radiologie & Imagerie',
  'Soins Infirmiers',
  'Maïeutique / Maternité',
]

const EMPTY_MEDECIN = {
  titre: 'Dr.',
  nom: '',
  prenom: '',
  specialite: '',
  typeMedecin: 'INTERNE',
  numeroTelephone: '',
  email: '',
  centreDeSante: '',
  code: '',
  adresse: '',
  actif: true,
}

function MedecinForm({ initialValue, onSubmit, onCancel, submitting, serverError }) {
  const [values, setValues] = useState({ ...EMPTY_MEDECIN, ...initialValue })

  const handleChange = (field) => (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setValues((prev) => ({ ...prev, [field]: val }))
  }

  const handleTypeSelect = (type) => {
    setValues((prev) => ({ ...prev, typeMedecin: type }))
  }

  const handleSpecialiteSelect = (spec) => {
    setValues((prev) => ({ ...prev, specialite: spec }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit({
      ...values,
      nom: values.nom.trim(),
      prenom: values.prenom.trim(),
      specialite: values.specialite.trim(),
      numeroTelephone: values.numeroTelephone.trim(),
      email: values.email ? values.email.trim() : null,
      centreDeSante: values.typeMedecin === 'EXTERNE' && values.centreDeSante ? values.centreDeSante.trim() : null,
      code: values.code ? values.code.trim() : null,
      adresse: values.adresse ? values.adresse.trim() : null,
    })
  }

  const isEdit = Boolean(initialValue && initialValue.id)

  return (
    <form onSubmit={handleSubmit} className="medecin-modal-form">
      {serverError && <div className="form-error-banner">{serverError}</div>}

      {/* Module 1 : Statut & Type de Praticien */}
      <div className="form-module-card">
        <div className="form-module-header">
          <div className="module-header-title">
            <FaUserMd className="section-title-icon" />
            <span>1. Statut & Type de Praticien</span>
          </div>
          <span className="module-header-badge">Obligatoire</span>
        </div>

        <div className="medecin-type-selector">
          <button
            type="button"
            className={`medecin-type-card ${values.typeMedecin === 'INTERNE' ? 'active internal' : ''}`}
            onClick={() => handleTypeSelect('INTERNE')}
          >
            <div className="type-card-icon">
              <FaClinicMedical />
            </div>
            <div className="type-card-info">
              <strong className="type-title">Praticien Interne</strong>
              <span className="type-desc">Praticien exerçant au sein de l'établissement</span>
            </div>
            {values.typeMedecin === 'INTERNE' && (
              <span className="type-checked-badge">
                <FaCheck /> Sélectionné
              </span>
            )}
          </button>

          <button
            type="button"
            className={`medecin-type-card ${values.typeMedecin === 'EXTERNE' ? 'active external' : ''}`}
            onClick={() => handleTypeSelect('EXTERNE')}
          >
            <div className="type-card-icon external-icon">
              <FaHospital />
            </div>
            <div className="type-card-info">
              <strong className="type-title">Praticien Externe</strong>
              <span className="type-desc">Praticien externe / Prescripteur & Partenaire de santé</span>
            </div>
            {values.typeMedecin === 'EXTERNE' && (
              <span className="type-checked-badge external-badge">
                <FaCheck /> Sélectionné
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Module 2 : Identité & Civilité */}
      <div className="form-module-card">
        <div className="form-module-header">
          <div className="module-header-title">
            <FaStethoscope className="section-title-icon" />
            <span>2. Identité & Civilité du Praticien</span>
          </div>
        </div>

        <div className="form-grid">
          <div className="form-field" style={{ flex: '0 0 160px' }}>
            <label>Civilité / Titre</label>
            <select value={values.titre || 'Dr.'} onChange={handleChange('titre')} className="form-select-pro">
              <option value="Dr.">Dr. (Docteur)</option>
              <option value="Pr.">Pr. (Professeur)</option>
              <option value="IDE">IDE (Infirmier Diplômé d'État)</option>
              <option value="SAGE / MAÏEUTICIEN">SAGE / MAÏEUTICIEN</option>
              <option value="M.">M. (Monsieur)</option>
              <option value="Mme">Mme (Madame)</option>
            </select>
          </div>

          <div className="form-field" style={{ flex: '1 1 200px' }}>
            <label>
              Nom de famille <span className="required-star">*</span>
            </label>
            <input
              value={values.nom}
              onChange={handleChange('nom')}
              placeholder="Ex: KOUASSI"
              required
            />
          </div>

          <div className="form-field" style={{ flex: '1 1 220px' }}>
            <label>
              Prénom(s) <span className="required-star">*</span>
            </label>
            <input
              value={values.prenom}
              onChange={handleChange('prenom')}
              placeholder="Ex: Jean-Baptiste"
              required
            />
          </div>

          <div className="form-field" style={{ flex: '1 1 180px' }}>
            <label>
              <FaIdCard className="field-icon-inline" />
              Code / Matricule Ordre <span className="facultative-tag">(Facultatif)</span>
            </label>
            <input
              value={values.code || ''}
              onChange={handleChange('code')}
              placeholder="Ex: MED-001 ou N° Ordre"
            />
          </div>
        </div>
      </div>

      {/* Module 3 : Discipline & Spécialité Médicale */}
      <div className="form-module-card">
        <div className="form-module-header">
          <div className="module-header-title">
            <FaStethoscope className="section-title-icon" />
            <span>3. Discipline & Spécialité Médicale</span>
          </div>
        </div>

        <div className="form-grid">
          <div className="form-field full-width">
            <label>
              Spécialité médicale / Discipline <span className="required-star">*</span>
            </label>
            <input
              list="specialites-list"
              value={values.specialite}
              onChange={handleChange('specialite')}
              placeholder="Ex: Médecine Générale, Pédiatrie, Cardiologie, Gynécologie..."
              required
            />
            <datalist id="specialites-list">
              {POPULAR_SPECIALITES.map((spec, i) => (
                <option key={i} value={spec} />
              ))}
            </datalist>

            <div className="quick-specialites-chips">
              <span className="chips-label">Suggestions rapides :</span>
              {QUICK_SPECIALITE_SUGGESTIONS.map((spec, idx) => (
                <button
                  key={idx}
                  type="button"
                  className={`quick-spec-btn ${values.specialite === spec ? 'active' : ''}`}
                  onClick={() => handleSpecialiteSelect(spec)}
                >
                  {spec}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Module 4 : Coordonnées de Contact & Localisation */}
      <div className="form-module-card">
        <div className="form-module-header">
          <div className="module-header-title">
            <FaPhoneAlt className="section-title-icon" />
            <span>4. Coordonnées de Contact & Localisation</span>
          </div>
        </div>

        <div className="form-grid">
          <div className="form-field" style={{ flex: '1 1 220px' }}>
            <label>
              <FaPhoneAlt className="field-icon-inline" />
              Numéro de téléphone <span className="required-star">*</span>
            </label>
            <input
              type="tel"
              value={values.numeroTelephone}
              onChange={handleChange('numeroTelephone')}
              placeholder="Ex: +225 07 00 00 00 00"
              required
            />
          </div>

          <div className="form-field" style={{ flex: '1 1 240px' }}>
            <label>
              <FaEnvelope className="field-icon-inline" />
              Adresse Email <span className="facultative-tag">(Facultatif)</span>
            </label>
            <input
              type="email"
              value={values.email || ''}
              onChange={handleChange('email')}
              placeholder="Ex: praticien@alphamed.ci"
            />
          </div>

          {/* Établissement : uniquement pour les praticiens externes */}
          {values.typeMedecin === 'EXTERNE' && (
            <div className="form-field full-width">
              <label>
                <FaHospital className="field-icon-inline" />
                Établissement <span className="facultative-tag">(Facultatif)</span>
              </label>
              <input
                value={values.centreDeSante || ''}
                onChange={handleChange('centreDeSante')}
                placeholder="Ex: CHU de Treichville, Polyclinique Sainte-Anne, Cabinet Médical..."
              />
              <small className="field-hint">
                Structure médicale, clinique ou hôpital d'où provient le praticien prescripteur.
              </small>
            </div>
          )}

          <div className="form-field full-width">
            <label>
              <FaMapMarkerAlt className="field-icon-inline" />
              Bureau / Emplacement précis <span className="facultative-tag">(Facultatif)</span>
            </label>
            <input
              value={values.adresse || ''}
              onChange={handleChange('adresse')}
              placeholder="Ex: Bâtiment A - 1er Étage, Cabinet N° 104"
            />
          </div>
        </div>
      </div>

      <div className="form-actions" style={{ marginTop: '20px' }}>
        <button type="button" className="btn-secondary" onClick={onCancel}>
          Annuler
        </button>
        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting
            ? 'Enregistrement en cours...'
            : isEdit
            ? 'Enregistrer les modifications'
            : 'Enregistrer le Praticien'}
        </button>
      </div>
    </form>
  )
}

export default MedecinForm
