import React, { useState, useEffect } from 'react'
import {
  FaFolderOpen,
  FaHeartbeat,
  FaExclamationTriangle,
  FaCut,
  FaFemale,
  FaSyringe,
  FaDna,
  FaSmoking,
  FaSave,
  FaPrint,
  FaPlus,
  FaTrash,
  FaCheckCircle,
  FaCheck,
  FaInfoCircle,
  FaNotesMedical,
  FaIdCard,
  FaCalendarAlt,
  FaClock,
  FaPhoneAlt,
  FaBriefcase,
  FaLayerGroup
} from 'react-icons/fa'
import { dossierPatientApi } from '../api/dossierPatientApi'
import { formatDateTime, formatDate } from '../utils/dateUtils'
import './DossierPatientModal.css'

const GROUPS_CONFIG = [
  {
    key: 'ALL',
    label: 'Toutes les catégories (Vue Complète)',
    shortLabel: 'Tout afficher',
    icon: <FaLayerGroup />,
    tagClass: 'ALL'
  },
  {
    key: 'ALLERGIES',
    number: '1',
    label: 'Allergies & Intolérances',
    shortLabel: 'Allergies',
    icon: <FaExclamationTriangle />,
    tagClass: 'ALLERGIES',
    desc: 'Allergies médicamenteuses, alimentaires, respiratoires, cutanées...',
    placeholder: 'Ex: Allergie pénicilline, sulfamides, piqûre de guêpe...'
  },
  {
    key: 'MEDICAUX',
    number: '2',
    label: 'Antécédents Médicaux',
    shortLabel: 'Médicaux',
    icon: <FaHeartbeat />,
    tagClass: 'MEDICAUX',
    desc: 'HTA, Diabète, Asthme, Cardiopathies, AVC, Insuffisance rénale...',
    placeholder: 'Ex: Insuffisance cardiaque, Ulcère gastro-duodénal, Épilepsie...'
  },
  {
    key: 'CHIRURGICAUX',
    number: '3',
    label: 'Antécédents Chirurgicaux',
    shortLabel: 'Chirurgicaux',
    icon: <FaCut />,
    tagClass: 'CHIRURGICAUX',
    desc: 'Interventions chirurgicales antérieures, laparotomies, prothèses...',
    placeholder: 'Ex: Ostéosynthèse fémur, Cholécystectomie, Amygdalectomie...'
  },
  {
    key: 'GYNECO_OBSTETRIQUES',
    number: '4',
    label: 'Gynécologiques & Obstétriques',
    shortLabel: 'Gynéco-Obst.',
    icon: <FaFemale />,
    tagClass: 'GYNECO_OBSTETRIQUES',
    desc: 'Grossesses, parité, césariennes antérieures, contraception, cycles...',
    placeholder: 'Ex: Endométriose, Fibromes utérins, Salpingite...'
  },
  {
    key: 'VACCINATIONS',
    number: '5',
    label: 'Vaccinations & Immunisations',
    shortLabel: 'Vaccinations',
    icon: <FaSyringe />,
    tagClass: 'VACCINATIONS',
    desc: 'BCG, DTP, Hépatite B, Fièvre Jaune, Covid-19, ROR, Méningite...',
    placeholder: 'Ex: Vaccin Pneumocoque, Rage, Choléra...'
  },
  {
    key: 'FAMILIAUX',
    number: '6',
    label: 'Antécédents Familiaux',
    shortLabel: 'Familiaux',
    icon: <FaDna />,
    tagClass: 'FAMILIAUX',
    desc: 'Pathologies héréditaires, cardiopathies précoces, cancers familiaux...',
    placeholder: 'Ex: Cancer du côlon maternel, HTA précoce paternelle...'
  },
  {
    key: 'HABITUDES_VIE',
    number: '7',
    label: 'Habitudes de vie & Facteurs de risque',
    shortLabel: 'Habitudes de vie',
    icon: <FaSmoking />,
    tagClass: 'HABITUDES_VIE',
    desc: 'Tabagisme, alcool, sédentarité, toxiques, régime alimentaire...',
    placeholder: 'Ex: Chicha, Exposition professionnelle, Alimentation salée...'
  },
]

function calculateIMC(poids, taille) {
  if (!poids || !taille || poids <= 0 || taille <= 0) return null
  const tailleM = taille / 100
  const imc = poids / (tailleM * tailleM)
  return Number(imc.toFixed(1))
}

function getImcStatus(imc) {
  if (!imc) return null
  if (imc < 18.5) return { label: `${imc} (Maigreur)`, className: 'surpoids' }
  if (imc <= 24.9) return { label: `${imc} (Normal)`, className: 'normal' }
  if (imc <= 29.9) return { label: `${imc} (Surpoids)`, className: 'surpoids' }
  return { label: `${imc} (Obésité)`, className: 'obesite' }
}

function calculateAge(dateNaissance) {
  if (!dateNaissance) return null
  const today = new Date()
  const birth = new Date(dateNaissance)
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--
  }
  return age >= 0 ? `${age} ans` : null
}

export default function DossierPatientModal({ patient, onClose, onDossierUpdated }) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [feedback, setFeedback] = useState(null)

  const [dossier, setDossier] = useState(null)
  const [activeGroup, setActiveGroup] = useState('ALL')

  // Vitals
  const [groupeSanguin, setGroupeSanguin] = useState('')
  const [rhesus, setRhesus] = useState('')
  const [poids, setPoids] = useState('')
  const [taille, setTaille] = useState('')
  const [tensionArterielle, setTensionArterielle] = useState('')
  const [observationsGenerales, setObservationsGenerales] = useState('')

  // Antecedents list
  const [antecedents, setAntecedents] = useState([])

  // Custom inputs per group
  const [customInputs, setCustomInputs] = useState({})

  useEffect(() => {
    if (!patient?.id) return
    loadDossier()
  }, [patient?.id])

  const loadDossier = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await dossierPatientApi.getByPatientId(patient.id)
      setDossier(data)
      setGroupeSanguin(data.groupeSanguin || '')
      setRhesus(data.rhesus || '')
      setPoids(data.poids || '')
      setTaille(data.taille || '')
      setTensionArterielle(data.tensionArterielle || '')
      setObservationsGenerales(data.observationsGenerales || '')
      setAntecedents(data.antecedents || [])
    } catch (err) {
      setError(err.message || 'Erreur lors du chargement du dossier patient')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleAntecedent = (index, isActif) => {
    setAntecedents((prev) => {
      const updated = [...prev]
      updated[index] = {
        ...updated[index],
        actif: isActif,
      }
      return updated
    })
  }

  const handleDetailsChange = (index, details) => {
    setAntecedents((prev) => {
      const updated = [...prev]
      updated[index] = {
        ...updated[index],
        details,
      }
      return updated
    })
  }

  const handleAnneeChange = (index, annee) => {
    setAntecedents((prev) => {
      const updated = [...prev]
      updated[index] = {
        ...updated[index],
        annee: annee ? parseInt(annee, 10) : null,
      }
      return updated
    })
  }

  const handleCustomInputChange = (groupKey, field, value) => {
    setCustomInputs((prev) => ({
      ...prev,
      [groupKey]: {
        ...(prev[groupKey] || {}),
        [field]: value,
      },
    }))
  }

  const handleAddCustomAntecedentToGroup = (e, groupKey) => {
    e.preventDefault()
    const input = customInputs[groupKey] || {}
    const libelle = (input.libelle || '').trim()
    if (!libelle) return

    const newAnt = {
      groupe: groupKey,
      libelle,
      actif: true, // Automatiquement coché et vert lors de l'ajout
      details: (input.details || '').trim() || null,
      annee: input.annee ? parseInt(input.annee, 10) : null,
      ordre: antecedents.length + 1,
    }

    setAntecedents((prev) => [...prev, newAnt])
    setCustomInputs((prev) => ({
      ...prev,
      [groupKey]: { libelle: '', details: '', annee: '' },
    }))
  }

  const handleRemoveAntecedent = async (index, ant) => {
    if (ant.id) {
      if (!window.confirm(`Supprimer l'antécédent "${ant.libelle}" ?`)) return
      try {
        await dossierPatientApi.deleteAntecedent(ant.id)
      } catch (err) {
        window.alert(err.message)
        return
      }
    }
    setAntecedents((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    setFeedback(null)

    const payload = {
      groupeSanguin: groupeSanguin || null,
      rhesus: rhesus || null,
      poids: poids ? parseFloat(poids) : null,
      taille: taille ? parseFloat(taille) : null,
      tensionArterielle: tensionArterielle.trim() || null,
      observationsGenerales: observationsGenerales.trim() || null,
      antecedents: antecedents.map((a) => ({
        id: a.id || null,
        groupe: a.groupe,
        libelle: a.libelle,
        actif: !!a.actif,
        details: a.details || null,
        annee: a.annee || null,
        ordre: a.ordre || 0,
      })),
    }

    try {
      const updated = await dossierPatientApi.updateDossier(patient.id, payload)
      setDossier(updated)
      setAntecedents(updated.antecedents || [])
      setFeedback('Dossier patient et antécédents enregistrés avec succès !')
      if (onDossierUpdated) {
        onDossierUpdated(updated)
      }
      setTimeout(() => setFeedback(null), 4000)
    } catch (err) {
      setError(err.message || "Erreur lors de l'enregistrement du dossier")
    } finally {
      setSaving(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const imcValue = calculateIMC(parseFloat(poids), parseFloat(taille))
  const imcStatus = getImcStatus(imcValue)

  const activeAntecedentsCount = antecedents.filter((a) => a.actif).length

  // Filter groups to display according to active tab
  const groupsToDisplay = activeGroup === 'ALL'
    ? GROUPS_CONFIG.filter((g) => g.key !== 'ALL')
    : GROUPS_CONFIG.filter((g) => g.key === activeGroup)

  return (
    <div className="dossier-modal-container">
      {/* En-tête Dossier Patient */}
      <div className="dossier-header-card">
        <div className="dossier-patient-identity">
          <div className="dossier-avatar">
            {patient?.nom ? patient.nom[0].toUpperCase() : 'P'}
            {patient?.prenom ? patient.prenom[0].toUpperCase() : ''}
          </div>
          <div className="dossier-patient-details">
            <h3>
              {patient?.nom} {patient?.prenom}
            </h3>
            <div className="dossier-patient-tags">
              <span className="dp-number-badge">
                <FaFolderOpen /> N° {dossier?.numeroDossier || `DP-${String(patient?.id || 1).padStart(7, '0')}`}
              </span>
              {patient?.code && (
                <span className="dossier-meta-tag">
                  <FaIdCard /> {patient.code}
                </span>
              )}
              {patient?.dateNaissance && (
                <span className="dossier-meta-tag">
                  <FaCalendarAlt /> {calculateAge(patient.dateNaissance) || patient.dateNaissance}
                </span>
              )}
              {patient?.numeroTelephone && (
                <span className="dossier-meta-tag">
                  <FaPhoneAlt /> {patient.numeroTelephone}
                </span>
              )}
              {patient?.profession && (
                <span className="dossier-meta-tag">
                  <FaBriefcase /> {patient.profession}
                </span>
              )}
              {(dossier?.dateDerniereModification || dossier?.dateCreation) && (
                <span className="dossier-meta-tag" title="Dernière mise à jour du dossier">
                  <FaClock /> Màj : {formatDateTime(dossier.dateDerniereModification || dossier.dateCreation)}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="dossier-header-actions">
          <button type="button" className="dossier-print-btn" onClick={handlePrint} title="Imprimer le dossier">
            <FaPrint /> Imprimer
          </button>
        </div>
      </div>

      {error && (
        <div className="error-message" style={{ margin: '4px 0' }}>
          ⚠️ {error}
        </div>
      )}

      {feedback && (
        <div className="dossier-feedback-msg">
          <FaCheckCircle /> {feedback}
        </div>
      )}

      {/* Constantes & Paramètres Cliniques */}
      <div className="dossier-vitals-card">
        <div className="vitals-title">
          <FaHeartbeat /> Constantes & Profil Médical
        </div>
        <div className="vitals-grid">
          <div className="vital-field">
            <label>Groupe Sanguin</label>
            <select value={groupeSanguin} onChange={(e) => setGroupeSanguin(e.target.value)}>
              <option value="">Non déterminé</option>
              <option value="A+">A+</option>
              <option value="A-">A-</option>
              <option value="B+">B+</option>
              <option value="B-">B-</option>
              <option value="AB+">AB+</option>
              <option value="AB-">AB-</option>
              <option value="O+">O+</option>
              <option value="O-">O-</option>
            </select>
          </div>

          <div className="vital-field">
            <label>Rhésus</label>
            <select value={rhesus} onChange={(e) => setRhesus(e.target.value)}>
              <option value="">--</option>
              <option value="Positif (+)">Positif (+)</option>
              <option value="Négatif (-)">Négatif (-)</option>
            </select>
          </div>

          <div className="vital-field">
            <label>Tension Artérielle</label>
            <input
              type="text"
              placeholder="Ex: 12/8 cmHg"
              value={tensionArterielle}
              onChange={(e) => setTensionArterielle(e.target.value)}
            />
          </div>

          <div className="vital-field">
            <label>Poids (kg)</label>
            <input
              type="number"
              step="0.1"
              placeholder="Ex: 70"
              value={poids}
              onChange={(e) => setPoids(e.target.value)}
            />
          </div>

          <div className="vital-field">
            <label>Taille (cm)</label>
            <input
              type="number"
              step="1"
              placeholder="Ex: 175"
              value={taille}
              onChange={(e) => setTaille(e.target.value)}
            />
          </div>

          <div className="vital-field">
            <label>Indice IMC</label>
            {imcStatus ? (
              <span className={`imc-badge ${imcStatus.className}`}>{imcStatus.label}</span>
            ) : (
              <span className="imc-badge">—</span>
            )}
          </div>
        </div>
      </div>

      {/* Synthèse générale des antécédents actifs (Oui) */}
      <div className="dossier-summary-banner">
        <h4>
          <FaInfoCircle /> Synthèse des antécédents déclarés positifs ({activeAntecedentsCount}) :
        </h4>
        <div className="summary-badges-list">
          {activeAntecedentsCount === 0 ? (
            <span className="summary-clean-badge">
              <FaCheckCircle /> Aucun antécédent particulier signalé pour le moment (Tous à "Non").
            </span>
          ) : (
            antecedents
              .filter((a) => a.actif)
              .map((a, i) => (
                <span
                  key={a.id || `active-${i}`}
                  className={`summary-positive-badge ${a.groupe === 'ALLERGIES' ? 'allergy' : ''}`}
                >
                  {a.groupe === 'ALLERGIES' && '⚠️ '}
                  <strong>{a.libelle}</strong>
                  {a.annee && ` (${a.annee})`}
                  {a.details && ` : ${a.details}`}
                </span>
              ))
          )}
        </div>
      </div>

      {/* Navigation par Onglets de filtrage rapide */}
      <div className="dossier-tabs-nav">
        {GROUPS_CONFIG.map((grp) => {
          const groupActives =
            grp.key === 'ALL'
              ? activeAntecedentsCount
              : antecedents.filter((a) => a.groupe === grp.key && a.actif).length

          return (
            <button
              key={grp.key}
              type="button"
              className={`dossier-tab-btn ${activeGroup === grp.key ? 'active' : ''}`}
              onClick={() => setActiveGroup(grp.key)}
            >
              {grp.icon}
              <span>{grp.shortLabel || grp.label}</span>
              <span className={`tab-count-badge ${groupActives > 0 ? 'has-active' : ''}`}>
                {groupActives}
              </span>
            </button>
          )
        })}
      </div>

      {/* Organisation en Cartes Modulaires par Famille Clinique */}
      <div className="dossier-modules-container">
        {loading && <div className="dossier-loading-box">Chargement du dossier patient...</div>}

        {!loading &&
          groupsToDisplay.map((grp) => {
            const groupAntecedents = antecedents.filter((a) => a.groupe === grp.key)
            const activeInGroup = groupAntecedents.filter((a) => a.actif).length
            const currentInput = customInputs[grp.key] || {}

            return (
              <div key={grp.key} className="form-module-card dossier-group-card">
                {/* En-tête de la carte */}
                <div className="form-module-header dossier-group-header">
                  <div className="module-header-title dossier-group-title">
                    <span className={`dossier-group-icon ${grp.tagClass}`}>{grp.icon}</span>
                    <div className="dossier-group-title-text">
                      <strong>
                        {grp.number ? `${grp.number}. ` : ''}
                        {grp.label}
                      </strong>
                      <span className="dossier-group-desc">{grp.desc}</span>
                    </div>
                  </div>
                  <span className={`module-header-badge dossier-group-badge ${activeInGroup > 0 ? 'badge-active' : ''}`}>
                    {activeInGroup > 0 ? `${activeInGroup} coché(s)` : '0 coché'}
                  </span>
                </div>

                {/* Grille des antécédents avec cases à cocher interactives */}
                <div className="dossier-checkbox-grid">
                  {groupAntecedents.length === 0 && (
                    <div className="cell-muted" style={{ padding: '12px', textAlign: 'center', gridColumn: '1 / -1' }}>
                      Aucun antécédent pré-configuré. Vous pouvez en ajouter ci-dessous.
                    </div>
                  )}

                  {groupAntecedents.map((ant) => {
                    const actualIndex = antecedents.findIndex((item) => item === ant)
                    const isChecked = !!ant.actif

                    return (
                      <div
                        key={ant.id || `ant-${actualIndex}`}
                        className={`dossier-checkbox-item ${isChecked ? 'is-checked' : ''} ${
                          ant.groupe === 'ALLERGIES' && isChecked ? 'is-allergy-checked' : ''
                        }`}
                      >
                        {/* Ligne de sélection avec case à cocher */}
                        <div
                          className="checkbox-item-header"
                          onClick={() => handleToggleAntecedent(actualIndex, !isChecked)}
                        >
                          <div className="custom-checkbox-wrapper">
                            <input
                              type="checkbox"
                              id={`chk-${actualIndex}`}
                              checked={isChecked}
                              onChange={(e) => handleToggleAntecedent(actualIndex, e.target.checked)}
                              onClick={(e) => e.stopPropagation()}
                            />
                            <label
                              htmlFor={`chk-${actualIndex}`}
                              className={`custom-checkbox-box ${isChecked ? 'box-checked' : ''}`}
                              onClick={(e) => e.stopPropagation()}
                            >
                              {isChecked && <FaCheck className="checkbox-check-icon" />}
                            </label>
                          </div>

                          <div className="checkbox-item-label-content">
                            <label
                              htmlFor={`chk-${actualIndex}`}
                              className="checkbox-label-text"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {ant.libelle}
                            </label>
                          </div>

                          {isChecked && (
                            <span className="checked-indicator-badge">
                              <FaCheck /> OUI
                            </span>
                          )}
                        </div>

                        {/* Dès que la case est cochée, elle devient verte et le champ de détail apparaît devant pour écrire */}
                        {isChecked && (
                          <div className="checkbox-item-details-panel">
                            <div className="detail-inputs-row">
                              <div className="detail-input-annee-group">
                                <label>Année :</label>
                                <input
                                  type="number"
                                  placeholder="Ex: 2022"
                                  value={ant.annee || ''}
                                  onChange={(e) => handleAnneeChange(actualIndex, e.target.value)}
                                  className="detail-input-annee"
                                />
                              </div>

                              <div className="detail-input-text-group">
                                <label>Détails & Précisions :</label>
                                <input
                                  type="text"
                                  placeholder="Préciser les réactions, traitements, localisation, observations..."
                                  value={ant.details || ''}
                                  onChange={(e) => handleDetailsChange(actualIndex, e.target.value)}
                                  className="detail-input-text"
                                />
                              </div>

                              <button
                                type="button"
                                className="detail-delete-btn"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleRemoveAntecedent(actualIndex, ant)
                                }}
                                title="Supprimer cet antécédent"
                              >
                                <FaTrash />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>

                {/* Formulaire d'ajout rapide pour ce groupe */}
                <div className="group-add-custom-card">
                  <div className="group-add-custom-title">
                    <FaPlus /> Ajouter un élément spécifique dans « {grp.label} » :
                  </div>
                  <form
                    className="group-add-custom-form"
                    onSubmit={(e) => handleAddCustomAntecedentToGroup(e, grp.key)}
                  >
                    <input
                      type="text"
                      className="group-add-input-libelle"
                      placeholder={grp.placeholder || "Libellé de l'antécédent..."}
                      value={currentInput.libelle || ''}
                      onChange={(e) => handleCustomInputChange(grp.key, 'libelle', e.target.value)}
                      required
                    />
                    <input
                      type="number"
                      className="group-add-input-annee"
                      placeholder="Année"
                      value={currentInput.annee || ''}
                      onChange={(e) => handleCustomInputChange(grp.key, 'annee', e.target.value)}
                    />
                    <input
                      type="text"
                      className="group-add-input-details"
                      placeholder="Détails / Précisions immédiates..."
                      value={currentInput.details || ''}
                      onChange={(e) => handleCustomInputChange(grp.key, 'details', e.target.value)}
                    />
                    <button type="submit" className="group-add-btn">
                      <FaPlus /> Ajouter
                    </button>
                  </form>
                </div>
              </div>
            )
          })}
      </div>

      {/* Observations générales / Notes cliniques */}
      <div className="dossier-notes-card">
        <label>Observations cliniques générales & Note du praticien :</label>
        <textarea
          placeholder="Renseignez ici les remarques cliniques, particularités, antécédents spécifiques non répertoriés..."
          value={observationsGenerales}
          onChange={(e) => setObservationsGenerales(e.target.value)}
        />
      </div>

      {/* Pied de page avec bouton Enregistrer */}
      <div className="dossier-modal-footer">
        <button type="button" className="table-action-btn" onClick={onClose}>
          Fermer
        </button>

        <button
          type="button"
          className="dossier-save-btn"
          onClick={handleSave}
          disabled={saving}
        >
          <FaSave /> {saving ? 'Enregistrement en cours...' : 'Enregistrer le dossier patient'}
        </button>
      </div>
    </div>
  )
}
