import { useEffect, useMemo, useState } from 'react'
import {
  FaEdit,
  FaTrash,
  FaFlask,
  FaXRay,
  FaStethoscope,
  FaCogs,
  FaPlus,
  FaLayerGroup,
} from 'react-icons/fa'
import PageHeader from '../components/PageHeader'
import Modal from '../components/Modal'
import { actTypesApi } from '../api/actTypesApi'
import { actesApi } from '../api/actesApi'
import '../styles/table.css'
import '../styles/form.css'
import './GestionActes.css'

const initialActTypeForm = { code: '', libelle: '' }
const initialActForm = {
  actTypeId: '',
  libelle: '',
  prixFixe: '',
  coefficientB: '',
  unitePrincipale: '',
  uniteSecondaire: '',
  typeAnalyse: '',
  referenceHommeAdulte: '',
  referenceFemmeAdulte: '',
  referenceEnfant: '',
  referenceNourrisson: '',
  numeroOrdre: '',
  coefficientZ: '',
  coefficientK: '',
  typeConsultation: '',
}

function normalizeNumber(value) {
  if (value === '' || value === null || value === undefined) {
    return null
  }
  const parsed = Number(value)
  return Number.isNaN(parsed) ? null : parsed
}

function formatPrice(price) {
  if (price === null || price === undefined || price === '') {
    return '—'
  }
  const num = Number(price)
  if (Number.isNaN(num)) {
    return price
  }
  return `${new Intl.NumberFormat('fr-FR').format(num)} FCFA`
}

function InlineCoeffInput({ prefix, value, onSave, placeholder = '0', ariaLabel }) {
  const [val, setVal] = useState(value !== null && value !== undefined ? String(value) : '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setVal(value !== null && value !== undefined ? String(value) : '')
  }, [value])

  const handleBlur = async () => {
    const originalStr = value !== null && value !== undefined ? String(value) : ''
    if (val.trim() === originalStr.trim()) return
    setSaving(true)
    try {
      await onSave(val.trim())
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      console.error(err)
      setVal(originalStr)
    } finally {
      setSaving(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.target.blur()
    } else if (e.key === 'Escape') {
      setVal(value !== null && value !== undefined ? String(value) : '')
      e.target.blur()
    }
  }

  return (
    <div className="table-inline-input-wrapper" title="Cliquer pour modifier directement">
      {prefix && <span className="table-inline-prefix">{prefix}</span>}
      <input
        type="number"
        min="0"
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className="table-inline-input"
        placeholder={placeholder}
        aria-label={ariaLabel}
        disabled={saving}
      />
      {saved && <span className="table-inline-saved-badge">✓</span>}
    </div>
  )
}

function isLaboType(actType) {
  if (!actType) return false
  const code = (actType.code || '').toUpperCase()
  const lib = (actType.libelle || '').toUpperCase()
  return (
    code === 'ANALYSE_MEDICAL' ||
    code === 'ANALYSE_MEDICALE' ||
    code === 'ANALYSES_MEDICALES' ||
    code === 'LABO' ||
    code === 'LABORATOIRE' ||
    code === 'ANALYSE' ||
    code === 'ANALYSES' ||
    lib.includes('LABORATOIRE') ||
    lib.includes('ANALYSE') ||
    lib.includes('LABO')
  )
}

function isRadioType(actType) {
  if (!actType) return false
  const code = (actType.code || '').toUpperCase()
  const lib = (actType.libelle || '').toUpperCase()
  return (
    code === 'RADIOLOGIE' ||
    code === 'RADIO' ||
    code === 'IMAGERIE' ||
    code === 'IMAGERIE_MEDICALE' ||
    lib.includes('RADIOLOGIE') ||
    lib.includes('RADIO') ||
    lib.includes('IMAGERIE')
  )
}

function GestionActes() {
  const [actTypes, setActTypes] = useState([])
  const [actes, setActes] = useState([])
  const [activeTab, setActiveTab] = useState('all') // 'all' | 'labo' | 'radio' | 'autres' | 'types'
  const [autresFilterTypeId, setAutresFilterTypeId] = useState('all')
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)

  const [typeForm, setTypeForm] = useState(initialActTypeForm)
  const [editingActType, setEditingActType] = useState(null)
  const [isTypeModalOpen, setIsTypeModalOpen] = useState(false)
  const [typeSubmitting, setTypeSubmitting] = useState(false)
  const [typeError, setTypeError] = useState(null)

  const [actForm, setActForm] = useState(initialActForm)
  const [editingAct, setEditingAct] = useState(null)
  const [actModalCategory, setActModalCategory] = useState(null) // 'labo' | 'radio' | 'autres' | null
  const [isActModalOpen, setIsActModalOpen] = useState(false)
  const [actSubmitting, setActSubmitting] = useState(false)
  const [actError, setActError] = useState(null)

  const loadData = async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const [typesData, actesData] = await Promise.all([actTypesApi.list(), actesApi.list()])
      setActTypes(typesData)
      setActes(actesData)
    } catch (err) {
      setLoadError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Partition actes by category
  const laboActes = useMemo(() => {
    return actes
      .filter((act) => isLaboType(act.actType))
      .sort((a, b) => {
        const orderA = a.numeroOrdre ?? Number.MAX_SAFE_INTEGER
        const orderB = b.numeroOrdre ?? Number.MAX_SAFE_INTEGER
        if (orderA !== orderB) return orderA - orderB
        return (a.libelle || '').localeCompare(b.libelle || '')
      })
  }, [actes])

  const radioActes = useMemo(() => {
    return actes
      .filter((act) => isRadioType(act.actType))
      .sort((a, b) => (a.libelle || '').localeCompare(b.libelle || ''))
  }, [actes])

  const laboActTypes = useMemo(() => {
    return actTypes.filter((type) => isLaboType(type))
  }, [actTypes])

  const radioActTypes = useMemo(() => {
    return actTypes.filter((type) => isRadioType(type))
  }, [actTypes])

  const otherActTypes = useMemo(() => {
    return actTypes.filter((type) => !isLaboType(type) && !isRadioType(type))
  }, [actTypes])

  const modalAvailableActTypes = useMemo(() => {
    if (actModalCategory === 'labo') {
      return laboActTypes
    }
    if (actModalCategory === 'radio') {
      return radioActTypes
    }
    if (actModalCategory === 'autres') {
      return otherActTypes
    }
    return actTypes
  }, [actModalCategory, laboActTypes, radioActTypes, otherActTypes, actTypes])

  const filteredAutresActes = useMemo(() => {
    return actes
      .filter((act) => !isLaboType(act.actType) && !isRadioType(act.actType))
      .filter((act) => {
        if (autresFilterTypeId === 'all') return true
        return String(act.actType?.id) === String(autresFilterTypeId)
      })
      .sort((a, b) => (a.libelle || '').localeCompare(b.libelle || ''))
  }, [actes, autresFilterTypeId])

  const selectedFormActType = useMemo(() => {
    if (!actForm.actTypeId) {
      return modalAvailableActTypes[0] || null
    }
    return actTypes.find((type) => String(type.id) === String(actForm.actTypeId)) || null
  }, [actForm.actTypeId, modalAvailableActTypes, actTypes])

  const formActTypeKey = (selectedFormActType?.code || '').toUpperCase()

  const openCreateType = () => {
    setEditingActType(null)
    setTypeForm(initialActTypeForm)
    setTypeError(null)
    setIsTypeModalOpen(true)
  }

  const openEditType = (actType) => {
    setEditingActType(actType)
    setTypeForm({ code: actType.code, libelle: actType.libelle })
    setTypeError(null)
    setIsTypeModalOpen(true)
  }

  const closeTypeModal = () => {
    setIsTypeModalOpen(false)
    setEditingActType(null)
    setTypeForm(initialActTypeForm)
  }

  const getNextNumeroOrdre = (actTypeId) => {
    const targetType = actTypes.find((t) => String(t.id) === String(actTypeId))
    if (isLaboType(targetType)) {
      const analyses = actes.filter((a) => isLaboType(a.actType))
      return analyses.length + 1
    }
    return ''
  }

  const openCreateAct = (category = null) => {
    setEditingAct(null)
    setActModalCategory(category)
    let defaultTypeId = ''

    if (category === 'labo') {
      const laboType = laboActTypes[0]
      if (laboType) defaultTypeId = String(laboType.id)
    } else if (category === 'radio') {
      const radioType = radioActTypes[0]
      if (radioType) defaultTypeId = String(radioType.id)
    } else if (category === 'autres') {
      const firstOther = otherActTypes[0]
      if (firstOther) defaultTypeId = String(firstOther.id)
    }

    if (!defaultTypeId && actTypes.length > 0) {
      if (category === 'labo') {
        const laboType = laboActTypes[0]
        if (laboType) defaultTypeId = String(laboType.id)
      } else if (category === 'radio') {
        const radioType = radioActTypes[0]
        if (radioType) defaultTypeId = String(radioType.id)
      } else if (category === 'autres') {
        const firstOther = otherActTypes[0]
        if (firstOther) defaultTypeId = String(firstOther.id)
      } else {
        defaultTypeId = String(actTypes[0].id)
      }
    }

    setActForm({
      ...initialActForm,
      actTypeId: defaultTypeId,
      numeroOrdre: getNextNumeroOrdre(defaultTypeId),
    })
    setActError(null)
    setIsActModalOpen(true)
  }

  const openEditAct = (act) => {
    setEditingAct(act)
    let category = 'autres'
    if (isLaboType(act.actType)) {
      category = 'labo'
    } else if (isRadioType(act.actType)) {
      category = 'radio'
    }
    setActModalCategory(category)

    let initialNumeroOrdre = act.numeroOrdre ?? ''
    if (isLaboType(act.actType) && (initialNumeroOrdre === '' || initialNumeroOrdre === null || initialNumeroOrdre === undefined)) {
      const analyses = actes.filter((a) => isLaboType(a.actType))
      const idx = analyses.findIndex((a) => a.id === act.id)
      initialNumeroOrdre = idx >= 0 ? idx + 1 : analyses.length + 1
    }

    setActForm({
      actTypeId: act.actType?.id ? String(act.actType.id) : '',
      libelle: act.libelle || '',
      prixFixe: act.prixFixe ?? '',
      coefficientB: act.coefficientB ?? '',
      unitePrincipale: act.unitePrincipale || '',
      uniteSecondaire: act.uniteSecondaire || '',
      typeAnalyse: act.typeAnalyse
        ? (act.typeAnalyse.toUpperCase() === 'COMPOSE' || act.typeAnalyse.toUpperCase() === 'COMPOSÉ'
          ? 'COMPOSE'
          : act.typeAnalyse.toUpperCase() === 'SIMPLE'
            ? 'SIMPLE'
            : act.typeAnalyse)
        : '',
      referenceHommeAdulte: act.referenceHommeAdulte || '',
      referenceFemmeAdulte: act.referenceFemmeAdulte || '',
      referenceEnfant: act.referenceEnfant || '',
      referenceNourrisson: act.referenceNourrisson || '',
      numeroOrdre: initialNumeroOrdre,
      coefficientZ: act.coefficientZ ?? '',
      coefficientK: act.coefficientK ?? '',
      typeConsultation: act.typeConsultation || '',
    })
    setActError(null)
    setIsActModalOpen(true)
  }

  const closeActModal = () => {
    setIsActModalOpen(false)
    setEditingAct(null)
    setActModalCategory(null)
    setActForm(initialActForm)
  }

  const handleTypeSubmit = async (event) => {
    event.preventDefault()
    setTypeSubmitting(true)
    setTypeError(null)
    try {
      const payload = {
        code: typeForm.code.trim(),
        libelle: typeForm.libelle.trim(),
      }
      if (editingActType) {
        await actTypesApi.update(editingActType.id, payload)
      } else {
        await actTypesApi.create(payload)
      }
      closeTypeModal()
      await loadData()
    } catch (err) {
      setTypeError(err.message)
    } finally {
      setTypeSubmitting(false)
    }
  }

  const handleActSubmit = async (event) => {
    event.preventDefault()
    setActSubmitting(true)
    setActError(null)
    try {
      const payload = {
        actTypeId: Number(actForm.actTypeId),
        libelle: actForm.libelle.trim(),
        prixFixe: formShowConsultationFields ? null : normalizeNumber(actForm.prixFixe),
        coefficientB: normalizeNumber(actForm.coefficientB),
        unitePrincipale: actForm.unitePrincipale.trim(),
        uniteSecondaire: actForm.uniteSecondaire.trim(),
        typeAnalyse: actForm.typeAnalyse.trim(),
        referenceHommeAdulte: actForm.referenceHommeAdulte.trim(),
        referenceFemmeAdulte: actForm.referenceFemmeAdulte.trim(),
        referenceEnfant: actForm.referenceEnfant.trim(),
        referenceNourrisson: actForm.referenceNourrisson.trim(),
        numeroOrdre: normalizeNumber(actForm.numeroOrdre),
        coefficientZ: normalizeNumber(actForm.coefficientZ),
        coefficientK: normalizeNumber(actForm.coefficientK),
        typeConsultation: actForm.typeConsultation.trim(),
      }
      if (editingAct) {
        await actesApi.update(editingAct.id, payload)
      } else {
        await actesApi.create(payload)
      }
      closeActModal()
      await loadData()
    } catch (err) {
      setActError(err.message)
    } finally {
      setActSubmitting(false)
    }
  }

  const handleDeleteType = async (actType) => {
    if (!window.confirm(`Supprimer le type d'acte "${actType.libelle}" ?`)) {
      return
    }
    try {
      await actTypesApi.remove(actType.id)
      await loadData()
    } catch (err) {
      window.alert(err.message)
    }
  }

  const handleDeleteAct = async (act) => {
    if (!window.confirm(`Supprimer l'acte "${act.libelle}" ?`)) {
      return
    }
    try {
      await actesApi.remove(act.id)
      await loadData()
    } catch (err) {
      window.alert(err.message)
    }
  }

  const handleInlineActUpdate = async (act, field, newValue) => {
    const numVal = normalizeNumber(newValue)
    const payload = {
      actTypeId: act.actType?.id,
      libelle: act.libelle,
      prixFixe: act.prixFixe,
      coefficientB: field === 'coefficientB' ? numVal : act.coefficientB,
      unitePrincipale: act.unitePrincipale || '',
      uniteSecondaire: act.uniteSecondaire || '',
      typeAnalyse: act.typeAnalyse || '',
      referenceHommeAdulte: act.referenceHommeAdulte || '',
      referenceFemmeAdulte: act.referenceFemmeAdulte || '',
      referenceEnfant: act.referenceEnfant || '',
      referenceNourrisson: act.referenceNourrisson || '',
      numeroOrdre: act.numeroOrdre,
      coefficientZ: field === 'coefficientZ' ? numVal : act.coefficientZ,
      coefficientK: field === 'coefficientK' ? numVal : act.coefficientK,
      typeConsultation: act.typeConsultation || '',
    }
    const updated = await actesApi.update(act.id, payload)
    setActes((prev) => prev.map((a) => (a.id === act.id ? updated : a)))
  }

  const formShowLaboratoireFields = isLaboType(selectedFormActType)
  const formShowRadiologieFields = isRadioType(selectedFormActType)
  const formShowScannerFields = formActTypeKey === 'SCANNER'
  const formShowConsultationFields = formActTypeKey === 'CONSULTATION'
  const formShowEchographieFields = formActTypeKey === 'ECHOGRAPHIE'
  const formShowChirurgieFields = formActTypeKey === 'CHIRURGIE'
  const formShowPrelevementFields = formActTypeKey === 'PRELEVEMENT'
  const formShowSoinFields = formActTypeKey === 'SOINS'
  const formShowAutreFields = formActTypeKey === 'AUTRES'

  const renderReferenceValues = (act) => {
    const hasHomme = Boolean(act.referenceHommeAdulte)
    const hasFemme = Boolean(act.referenceFemmeAdulte)
    const hasEnfant = Boolean(act.referenceEnfant)
    const hasNourrisson = Boolean(act.referenceNourrisson)

    if (!hasHomme && !hasFemme && !hasEnfant && !hasNourrisson) {
      return <span className="cell-muted">—</span>
    }

    return (
      <div className="ref-values-grid">
        {hasHomme && (
          <span className="ref-tag-item" title="Homme adulte">
            <span className="ref-tag-label">H :</span> {act.referenceHommeAdulte}
          </span>
        )}
        {hasFemme && (
          <span className="ref-tag-item" title="Femme adulte">
            <span className="ref-tag-label">F :</span> {act.referenceFemmeAdulte}
          </span>
        )}
        {hasEnfant && (
          <span className="ref-tag-item" title="Enfant">
            <span className="ref-tag-label">E :</span> {act.referenceEnfant}
          </span>
        )}
        {hasNourrisson && (
          <span className="ref-tag-item" title="Nourrisson">
            <span className="ref-tag-label">N :</span> {act.referenceNourrisson}
          </span>
        )}
      </div>
    )
  }

  const renderUnits = (act) => {
    if (!act.unitePrincipale && !act.uniteSecondaire) {
      return <span className="cell-muted">—</span>
    }
    return (
      <div className="unit-display">
        {act.unitePrincipale && <span className="unit-primary">{act.unitePrincipale}</span>}
        {act.uniteSecondaire && <span className="unit-secondary"> ({act.uniteSecondaire})</span>}
      </div>
    )
  }

  const renderActTypeBadge = (actType) => {
    if (!actType) return null
    return <span className="table-badge type-badge">{actType.libelle}</span>
  }

  const renderOtherActSpecificity = (act) => {
    const code = (act.actType?.code || '').toUpperCase()
    if (code === 'CHIRURGIE' && act.coefficientK != null) {
      return <span className="badge-param">Coeff. K : {act.coefficientK}</span>
    }
    if (code === 'CONSULTATION' && act.typeConsultation) {
      return (
        <span className="badge-param">
          Consultation {act.typeConsultation === 'GENERALISTE' ? 'Généraliste' : act.typeConsultation === 'SPECIALISTE' ? 'Spécialiste' : act.typeConsultation}
        </span>
      )
    }
    return <span className="cell-muted">—</span>
  }

  // Section Laboratoire
  const showLaboSection = activeTab === 'all' || activeTab === 'labo'
  // Section Radiologie
  const showRadioSection = activeTab === 'all' || activeTab === 'radio'
  // Section Autres Actes
  const showAutresSection = activeTab === 'all' || activeTab === 'autres'
  // Section Types
  const showTypesSection = activeTab === 'all' || activeTab === 'types'

  return (
    <main className="management-page">
      <PageHeader
        title="Gestion des actes cliniques"
        subtitle="Tableaux dédiés et structurés pour le laboratoire, la radiologie et les autres actes médicaux"
      />

      {/* Navigation tabs for category selection */}
      <div className="act-category-tabs">
        <button
          type="button"
          className={`act-category-tab ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          <FaLayerGroup /> Tous les tableaux
        </button>
        <button
          type="button"
          className={`act-category-tab ${activeTab === 'labo' ? 'active' : ''}`}
          onClick={() => setActiveTab('labo')}
        >
          <FaFlask /> Laboratoire ({laboActes.length})
        </button>
        <button
          type="button"
          className={`act-category-tab ${activeTab === 'radio' ? 'active' : ''}`}
          onClick={() => setActiveTab('radio')}
        >
          <FaXRay /> Radiologie ({radioActes.length})
        </button>
        <button
          type="button"
          className={`act-category-tab ${activeTab === 'autres' ? 'active' : ''}`}
          onClick={() => setActiveTab('autres')}
        >
          <FaStethoscope /> Autres actes ({actes.length - laboActes.length - radioActes.length})
        </button>
        <button
          type="button"
          className={`act-category-tab ${activeTab === 'types' ? 'active' : ''}`}
          onClick={() => setActiveTab('types')}
        >
          <FaCogs /> Types d'actes ({actTypes.length})
        </button>
      </div>

      {/* 1. TABLEAU SÉPARÉ : ACTES DE LABORATOIRE (ANALYSES MÉDICALES) */}
      {showLaboSection && (
        <section className="management-section labo-section">
          <div className="section-title-row">
            <div className="section-title-group">
              <span className="section-icon labo-icon"><FaFlask /></span>
              <div>
                <h2>Actes de Laboratoire / Analyses Médicales</h2>
                <p className="section-subtitle">
                  Tableau dédié aux items spécifiques du laboratoire : N° d'ordre, coefficient B, unités et normes de référence
                </p>
              </div>
              <span className="count-pill">{laboActes.length} analyses</span>
            </div>
            <button
              type="button"
              className="page-header-action labo-action"
              onClick={() => openCreateAct('labo')}
            >
              <FaPlus /> Nouvelle analyse
            </button>
          </div>

          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '85px' }}>N° Ordre</th>
                  <th>Désignation de l'analyse</th>
                  <th>Type d'analyse</th>
                  <th>Coeff. B</th>
                  <th>Unités (Princ. / Second.)</th>
                  <th>Valeurs de référence (Normes)</th>
                  <th>Prix fixé</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr className="empty-row">
                    <td colSpan={8}>Chargement des analyses...</td>
                  </tr>
                )}
                {!loading && loadError && (
                  <tr className="empty-row">
                    <td colSpan={8}>Erreur : {loadError}</td>
                  </tr>
                )}
                {!loading && !loadError && laboActes.length === 0 && (
                  <tr className="empty-row">
                    <td colSpan={8}>Aucune analyse médicale enregistrée. Cliquez sur "Nouvelle analyse" pour en ajouter une.</td>
                  </tr>
                )}
                {!loading &&
                  !loadError &&
                  laboActes.map((act) => (
                    <tr key={act.id}>
                      <td>
                        <span className="order-badge">{act.numeroOrdre ?? '—'}</span>
                      </td>
                      <td>
                        <div className="act-title-cell">
                          <strong>{act.libelle}</strong>
                        </div>
                      </td>
                      <td>
                        {act.typeAnalyse ? (
                          <span className={`analysis-type-badge ${(act.typeAnalyse || '').toUpperCase().includes('COMP') ? 'type-compose' : 'type-simple'}`}>
                            {(act.typeAnalyse || '').toUpperCase().includes('COMP') ? 'Composé' : 'Simple'}
                          </span>
                        ) : (
                          <span className="cell-muted">—</span>
                        )}
                      </td>
                      <td>
                        <InlineCoeffInput
                          prefix="B"
                          value={act.coefficientB}
                          onSave={(val) => handleInlineActUpdate(act, 'coefficientB', val)}
                          placeholder="0"
                          ariaLabel={`Coefficient B pour ${act.libelle}`}
                        />
                      </td>
                      <td>{renderUnits(act)}</td>
                      <td>{renderReferenceValues(act)}</td>
                      <td>
                        <span className="price-cell">{formatPrice(act.prixFixe)}</span>
                      </td>
                      <td>
                        <div className="table-actions justify-end">
                          <button
                            type="button"
                            className="table-action-btn"
                            onClick={() => openEditAct(act)}
                            title="Modifier cette analyse"
                          >
                            <FaEdit /> Modifier
                          </button>
                          <button
                            type="button"
                            className="table-action-btn danger"
                            onClick={() => handleDeleteAct(act)}
                            title="Supprimer cette analyse"
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
        </section>
      )}

      {/* 2. TABLEAU SÉPARÉ : ACTES DE RADIOLOGIE */}
      {showRadioSection && (
        <section className="management-section radio-section">
          <div className="section-title-row">
            <div className="section-title-group">
              <span className="section-icon radio-icon"><FaXRay /></span>
              <div>
                <h2>Actes de Radiologie</h2>
                <p className="section-subtitle">
                  Tableau dédié aux examens de radiologie avec coefficient Z et tarification
                </p>
              </div>
              <span className="count-pill">{radioActes.length} examens</span>
            </div>
            <button
              type="button"
              className="page-header-action radio-action"
              onClick={() => openCreateAct('radio')}
            >
              <FaPlus /> Nouvel examen radio
            </button>
          </div>

          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Examen radiologique</th>
                  <th>Coefficient Z</th>
                  <th>Prix fixé</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr className="empty-row">
                    <td colSpan={4}>Chargement des examens de radiologie...</td>
                  </tr>
                )}
                {!loading && loadError && (
                  <tr className="empty-row">
                    <td colSpan={4}>Erreur : {loadError}</td>
                  </tr>
                )}
                {!loading && !loadError && radioActes.length === 0 && (
                  <tr className="empty-row">
                    <td colSpan={4}>Aucun acte de radiologie enregistré. Cliquez sur "Nouvel examen radio" pour en ajouter.</td>
                  </tr>
                )}
                {!loading &&
                  !loadError &&
                  radioActes.map((act) => (
                    <tr key={act.id}>
                      <td>
                        <strong>{act.libelle}</strong>
                      </td>
                      <td>
                        <InlineCoeffInput
                          prefix="Z"
                          value={act.coefficientZ}
                          onSave={(val) => handleInlineActUpdate(act, 'coefficientZ', val)}
                          placeholder="0"
                          ariaLabel={`Coefficient Z pour ${act.libelle}`}
                        />
                      </td>
                      <td>
                        <span className="price-cell">{formatPrice(act.prixFixe)}</span>
                      </td>
                      <td>
                        <div className="table-actions justify-end">
                          <button
                            type="button"
                            className="table-action-btn"
                            onClick={() => openEditAct(act)}
                            title="Modifier cet examen"
                          >
                            <FaEdit /> Modifier
                          </button>
                          <button
                            type="button"
                            className="table-action-btn danger"
                            onClick={() => handleDeleteAct(act)}
                            title="Supprimer cet examen"
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
        </section>
      )}

      {/* 3. TABLEAU SÉPARÉ : AUTRES ACTES MÉDICAUX & CLINIQUES */}
      {showAutresSection && (
        <section className="management-section autres-section">
          <div className="section-title-row">
            <div className="section-title-group">
              <span className="section-icon autres-icon"><FaStethoscope /></span>
              <div>
                <h2>Autres Actes Cliniques & Médicaux</h2>
                <p className="section-subtitle">
                  Consultations, chirurgie, échographie, scanner, soins et actes divers
                </p>
              </div>
              <span className="count-pill">{filteredAutresActes.length} actes</span>
            </div>
            <button
              type="button"
              className="page-header-action"
              onClick={() => openCreateAct('autres')}
            >
              <FaPlus /> Nouvel acte
            </button>
          </div>

          {/* Sub-filter chips for other act categories */}
          {otherActTypes.length > 0 && (
            <div className="act-types-filter">
              <span className="filter-chip-label">Filtrer par catégorie :</span>
              <button
                type="button"
                className={`act-type-chip ${autresFilterTypeId === 'all' ? 'active' : ''}`}
                onClick={() => setAutresFilterTypeId('all')}
              >
                Tous les autres actes
              </button>
              {otherActTypes.map((actType) => (
                <button
                  key={actType.id}
                  type="button"
                  className={`act-type-chip ${String(autresFilterTypeId) === String(actType.id) ? 'active' : ''}`}
                  onClick={() => setAutresFilterTypeId(String(actType.id))}
                >
                  {actType.libelle}
                </button>
              ))}
            </div>
          )}

          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Catégorie / Type</th>
                  <th>Libellé de l'acte</th>
                  <th>Spécificités / Paramètres</th>
                  <th>Prix fixé</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr className="empty-row">
                    <td colSpan={5}>Chargement des actes...</td>
                  </tr>
                )}
                {!loading && loadError && (
                  <tr className="empty-row">
                    <td colSpan={5}>Erreur : {loadError}</td>
                  </tr>
                )}
                {!loading && !loadError && filteredAutresActes.length === 0 && (
                  <tr className="empty-row">
                    <td colSpan={5}>Aucun acte trouvé pour cette catégorie.</td>
                  </tr>
                )}
                {!loading &&
                  !loadError &&
                  filteredAutresActes.map((act) => (
                    <tr key={act.id}>
                      <td>{renderActTypeBadge(act.actType)}</td>
                      <td>
                        <strong>{act.libelle}</strong>
                      </td>
                      <td>{renderOtherActSpecificity(act)}</td>
                      <td>
                        <span className="price-cell">
                          {(act.actType?.code || '').toUpperCase() === 'CONSULTATION'
                            ? <span className="cell-muted">Selon assurance</span>
                            : formatPrice(act.prixFixe)}
                        </span>
                      </td>
                      <td>
                        <div className="table-actions justify-end">
                          <button
                            type="button"
                            className="table-action-btn"
                            onClick={() => openEditAct(act)}
                          >
                            <FaEdit /> Modifier
                          </button>
                          <button
                            type="button"
                            className="table-action-btn danger"
                            onClick={() => handleDeleteAct(act)}
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
        </section>
      )}

      {/* 4. TABLEAU SÉPARÉ : TYPES D'ACTES */}
      {showTypesSection && (
        <section className="management-section types-section">
          <div className="section-title-row">
            <div className="section-title-group">
              <span className="section-icon types-icon"><FaCogs /></span>
              <div>
                <h2>Configuration des Types d'actes</h2>
                <p className="section-subtitle">
                  Gestion des catégories d'actes disponibles dans l'application
                </p>
              </div>
              <span className="count-pill">{actTypes.length} types</span>
            </div>
            <button type="button" className="page-header-action" onClick={openCreateType}>
              <FaPlus /> Nouveau type
            </button>
          </div>
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Libellé</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr className="empty-row">
                    <td colSpan={3}>Chargement...</td>
                  </tr>
                )}
                {!loading && loadError && (
                  <tr className="empty-row">
                    <td colSpan={3}>Erreur : {loadError}</td>
                  </tr>
                )}
                {!loading && !loadError && actTypes.length === 0 && (
                  <tr className="empty-row">
                    <td colSpan={3}>Aucun type d'acte enregistré.</td>
                  </tr>
                )}
                {!loading &&
                  !loadError &&
                  actTypes.map((actType) => (
                    <tr key={actType.id}>
                      <td>
                        <code className="code-pill">{actType.code}</code>
                      </td>
                      <td>
                        <strong>{actType.libelle}</strong>
                      </td>
                      <td>
                        <div className="table-actions justify-end">
                          <button
                            type="button"
                            className="table-action-btn"
                            onClick={() => openEditType(actType)}
                          >
                            <FaEdit /> Modifier
                          </button>
                          <button
                            type="button"
                            className="table-action-btn danger"
                            onClick={() => handleDeleteType(actType)}
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
        </section>
      )}

      {/* MODAL : TYPE D'ACTE */}
      {isTypeModalOpen && (
        <Modal
          title={editingActType ? "Modifier le type d'acte" : "Nouveau type d'acte"}
          onClose={closeTypeModal}
          size="medium"
        >
          <form onSubmit={handleTypeSubmit}>
            {typeError && <div className="form-error-banner">{typeError}</div>}
            <div className="form-grid">
              <div className="form-field">
                <label htmlFor="type-code">Code</label>
                <input
                  id="type-code"
                  value={typeForm.code}
                  onChange={(event) =>
                    setTypeForm((prev) => ({ ...prev, code: event.target.value }))
                  }
                  required
                />
              </div>
              <div className="form-field">
                <label htmlFor="type-libelle">Libellé</label>
                <input
                  id="type-libelle"
                  value={typeForm.libelle}
                  onChange={(event) =>
                    setTypeForm((prev) => ({ ...prev, libelle: event.target.value }))
                  }
                  required
                />
              </div>
            </div>
            <div className="form-actions">
              <button type="button" className="btn-secondary" onClick={closeTypeModal}>
                Annuler
              </button>
              <button type="submit" className="btn-primary" disabled={typeSubmitting}>
                {typeSubmitting ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL : ACTE CLINIQUE */}
      {isActModalOpen && (
        <Modal
          title={
            editingAct
              ? actModalCategory === 'labo'
                ? "Modifier l'analyse de laboratoire"
                : actModalCategory === 'radio'
                  ? "Modifier l'examen de radiologie"
                  : "Modifier l'acte clinique"
              : actModalCategory === 'labo'
                ? 'Nouvelle analyse de laboratoire'
                : actModalCategory === 'radio'
                  ? 'Nouvel examen de radiologie'
                  : 'Nouvel acte clinique'
          }
          onClose={closeActModal}
          size="large"
        >
          <form onSubmit={handleActSubmit}>
            {actError && <div className="form-error-banner">{actError}</div>}
            <div className="form-grid">
              <div className="form-field">
                <label htmlFor="act-type">
                  {actModalCategory === 'labo'
                    ? "Type d'analyse (Laboratoire)"
                    : actModalCategory === 'radio'
                      ? "Type d'examen (Radiologie)"
                      : "Catégorie / Type d'acte"}
                </label>
                <select
                  id="act-type"
                  value={actForm.actTypeId}
                  onChange={(event) => {
                    const newTypeId = event.target.value
                    setActForm((prev) => {
                      let nextOrdre = prev.numeroOrdre
                      const targetType = actTypes.find((t) => String(t.id) === String(newTypeId))
                      if (isLaboType(targetType)) {
                        if (!editingAct) {
                          nextOrdre = getNextNumeroOrdre(newTypeId)
                        } else if (
                          editingAct.actType?.id &&
                          String(editingAct.actType.id) === String(newTypeId) &&
                          editingAct.numeroOrdre != null
                        ) {
                          nextOrdre = editingAct.numeroOrdre
                        } else {
                          nextOrdre = getNextNumeroOrdre(newTypeId)
                        }
                      } else {
                        nextOrdre = ''
                      }
                      return {
                        ...prev,
                        actTypeId: newTypeId,
                        numeroOrdre: nextOrdre,
                      }
                    })
                  }}
                  required
                >
                  <option value="">Sélectionnez un type</option>
                  {modalAvailableActTypes.map((actType) => (
                    <option key={actType.id} value={actType.id}>
                      {actType.libelle}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-field">
                <label htmlFor="act-libelle">Libellé / Désignation</label>
                <input
                  id="act-libelle"
                  value={actForm.libelle}
                  onChange={(event) =>
                    setActForm((prev) => ({ ...prev, libelle: event.target.value }))
                  }
                  placeholder="Ex: Hémogramme complet, Radiographie thorax, etc."
                  required
                />
              </div>

              {!formShowConsultationFields && (
                <div className="form-field">
                  <label htmlFor="act-prix">Prix fixé (FCFA)</label>
                  <input
                    id="act-prix"
                    type="number"
                    step="0.01"
                    value={actForm.prixFixe}
                    onChange={(event) =>
                      setActForm((prev) => ({ ...prev, prixFixe: event.target.value }))
                    }
                    placeholder="Ex: 5000"
                    required
                  />
                </div>
              )}

              {/* CHAMPS SPÉCIFIQUES LABORATOIRE */}
              {formShowLaboratoireFields && (
                <>
                  <div className="form-section-title">Paramètres de Laboratoire</div>
                  <div className="form-field">
                    <label htmlFor="coeff-b">Coefficient B</label>
                    <input
                      id="coeff-b"
                      type="number"
                      step="0.01"
                      value={actForm.coefficientB}
                      onChange={(event) =>
                        setActForm((prev) => ({ ...prev, coefficientB: event.target.value }))
                      }
                      placeholder="Ex: 20"
                      required
                    />
                  </div>
                  <div className="form-field">
                    <label htmlFor="unit-principale">Unité principale</label>
                    <input
                      id="unit-principale"
                      value={actForm.unitePrincipale}
                      onChange={(event) =>
                        setActForm((prev) => ({ ...prev, unitePrincipale: event.target.value }))
                      }
                      placeholder="Ex: g/dL, mm3, mg/L"
                      required
                    />
                  </div>
                  <div className="form-field">
                    <label htmlFor="unit-secondaire">Unité secondaire (optionnelle)</label>
                    <input
                      id="unit-secondaire"
                      value={actForm.uniteSecondaire}
                      onChange={(event) =>
                        setActForm((prev) => ({ ...prev, uniteSecondaire: event.target.value }))
                      }
                      placeholder="Ex: mmol/L"
                    />
                  </div>
                  <div className="form-field">
                    <label htmlFor="type-analyse">Type d'analyse</label>
                    <select
                      id="type-analyse"
                      value={actForm.typeAnalyse}
                      onChange={(event) =>
                        setActForm((prev) => ({ ...prev, typeAnalyse: event.target.value }))
                      }
                      required
                    >
                      <option value="">Sélectionnez</option>
                      <option value="SIMPLE">Simple</option>
                      <option value="COMPOSE">Composé</option>
                    </select>
                  </div>
                  <div className="form-field">
                    <label htmlFor="ref-homme">Valeur de référence Homme adulte</label>
                    <input
                      id="ref-homme"
                      value={actForm.referenceHommeAdulte}
                      onChange={(event) =>
                        setActForm((prev) => ({ ...prev, referenceHommeAdulte: event.target.value }))
                      }
                      placeholder="Ex: 13.0 - 17.0"
                    />
                  </div>
                  <div className="form-field">
                    <label htmlFor="ref-femme">Valeur de référence Femme adulte</label>
                    <input
                      id="ref-femme"
                      value={actForm.referenceFemmeAdulte}
                      onChange={(event) =>
                        setActForm((prev) => ({ ...prev, referenceFemmeAdulte: event.target.value }))
                      }
                      placeholder="Ex: 12.0 - 15.5"
                    />
                  </div>
                  <div className="form-field">
                    <label htmlFor="ref-enfant">Valeur de référence Enfant</label>
                    <input
                      id="ref-enfant"
                      value={actForm.referenceEnfant}
                      onChange={(event) =>
                        setActForm((prev) => ({ ...prev, referenceEnfant: event.target.value }))
                      }
                      placeholder="Ex: 11.5 - 14.5"
                    />
                  </div>
                  <div className="form-field">
                    <label htmlFor="ref-nourrisson">Valeur de référence Nourrisson</label>
                    <input
                      id="ref-nourrisson"
                      value={actForm.referenceNourrisson}
                      onChange={(event) =>
                        setActForm((prev) => ({ ...prev, referenceNourrisson: event.target.value }))
                      }
                      placeholder="Ex: 10.0 - 14.0"
                    />
                  </div>
                  <div className="form-field">
                    <label htmlFor="numero-ordre">Numéro d'ordre (Position automatique)</label>
                    <input
                      id="numero-ordre"
                      type="number"
                      value={actForm.numeroOrdre}
                      readOnly
                      placeholder="Automatique"
                      title="Le numéro d'ordre correspond automatiquement à la position de l'analyse"
                    />
                  </div>
                </>
              )}

              {/* CHAMPS SPÉCIFIQUES RADIOLOGIE */}
              {formShowRadiologieFields && (
                <>
                  <div className="form-section-title">Paramètres de Radiologie</div>
                  <div className="form-field">
                    <label htmlFor="coeff-z">Coefficient Z</label>
                    <input
                      id="coeff-z"
                      type="number"
                      step="0.01"
                      value={actForm.coefficientZ}
                      onChange={(event) =>
                        setActForm((prev) => ({ ...prev, coefficientZ: event.target.value }))
                      }
                      placeholder="Ex: 15"
                      required
                    />
                  </div>
                </>
              )}

              {formShowScannerFields && (
                <div className="form-section-title">Paramètres Scanner</div>
              )}

              {/* CHAMPS SPÉCIFIQUES CONSULTATION */}
              {formShowConsultationFields && (
                <>
                  <div className="form-section-title">Paramètres Consultation</div>
                  <div className="form-field">
                    <label htmlFor="type-consultation">Type consultation</label>
                    <select
                      id="type-consultation"
                      value={actForm.typeConsultation}
                      onChange={(event) =>
                        setActForm((prev) => ({ ...prev, typeConsultation: event.target.value }))
                      }
                      required
                    >
                      <option value="">Sélectionnez</option>
                      <option value="GENERALISTE">Généraliste</option>
                      <option value="SPECIALISTE">Spécialiste</option>
                    </select>
                  </div>
                </>
              )}

              {formShowEchographieFields && (
                <div className="form-section-title">Paramètres Échographie</div>
              )}

              {/* CHAMPS SPÉCIFIQUES CHIRURGIE */}
              {formShowChirurgieFields && (
                <>
                  <div className="form-section-title">Paramètres Chirurgie</div>
                  <div className="form-field">
                    <label htmlFor="coeff-k">Coefficient K</label>
                    <input
                      id="coeff-k"
                      type="number"
                      step="0.01"
                      value={actForm.coefficientK}
                      onChange={(event) =>
                        setActForm((prev) => ({ ...prev, coefficientK: event.target.value }))
                      }
                      placeholder="Ex: 50"
                      required
                    />
                  </div>
                </>
              )}

              {formShowPrelevementFields && (
                <div className="form-section-title">Paramètres Prélèvement</div>
              )}

              {(formShowSoinFields || formShowAutreFields) && (
                <div className="form-section-title">Paramètres Actes Divers</div>
              )}
            </div>

            <div className="form-actions">
              <button type="button" className="btn-secondary" onClick={closeActModal}>
                Annuler
              </button>
              <button type="submit" className="btn-primary" disabled={actSubmitting}>
                {actSubmitting ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </main>
  )
}

export default GestionActes
