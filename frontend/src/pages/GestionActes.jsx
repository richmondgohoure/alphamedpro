import { useEffect, useMemo, useState } from 'react'
import { FaEdit, FaTrash } from 'react-icons/fa'
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

function GestionActes() {
  const [actTypes, setActTypes] = useState([])
  const [actes, setActes] = useState([])
  const [selectedActTypeId, setSelectedActTypeId] = useState('all')
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)

  const [typeForm, setTypeForm] = useState(initialActTypeForm)
  const [editingActType, setEditingActType] = useState(null)
  const [isTypeModalOpen, setIsTypeModalOpen] = useState(false)
  const [typeSubmitting, setTypeSubmitting] = useState(false)
  const [typeError, setTypeError] = useState(null)

  const [actForm, setActForm] = useState(initialActForm)
  const [editingAct, setEditingAct] = useState(null)
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

  const selectedActType = useMemo(() => {
    if (!actForm.actTypeId) {
      return actTypes[0] || null
    }
    return actTypes.find((type) => String(type.id) === String(actForm.actTypeId)) || null
  }, [actForm.actTypeId, actTypes])

  const filteredActes = useMemo(() => {
    if (selectedActTypeId === 'all') {
      return actes
    }
    return actes.filter((act) => String(act.actType?.id) === String(selectedActTypeId))
  }, [actes, selectedActTypeId])

  const actTypeKey = (selectedActType?.code || '').toUpperCase()

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

  const openCreateAct = () => {
    setEditingAct(null)
    setActForm((prev) => ({
      ...initialActForm,
      actTypeId: actTypes[0]?.id ? String(actTypes[0].id) : '',
    }))
    setActError(null)
    setIsActModalOpen(true)
  }

  const openEditAct = (act) => {
    setEditingAct(act)
    setActForm({
      actTypeId: act.actType?.id ? String(act.actType.id) : '',
      libelle: act.libelle || '',
      prixFixe: act.prixFixe ?? '',
      coefficientB: act.coefficientB ?? '',
      unitePrincipale: act.unitePrincipale || '',
      uniteSecondaire: act.uniteSecondaire || '',
      typeAnalyse: act.typeAnalyse || '',
      referenceHommeAdulte: act.referenceHommeAdulte || '',
      referenceFemmeAdulte: act.referenceFemmeAdulte || '',
      referenceEnfant: act.referenceEnfant || '',
      referenceNourrisson: act.referenceNourrisson || '',
      numeroOrdre: act.numeroOrdre ?? '',
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
        prixFixe: normalizeNumber(actForm.prixFixe),
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
    if (!window.confirm(`Supprimer le type d'acte ${actType.libelle} ?`)) {
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
    if (!window.confirm(`Supprimer l'acte ${act.libelle} ?`)) {
      return
    }
    try {
      await actesApi.remove(act.id)
      await loadData()
    } catch (err) {
      window.alert(err.message)
    }
  }

  const showLaboratoireFields = actTypeKey === 'ANALYSE_MEDICAL'
  const showRadiologieFields = actTypeKey === 'RADIOLOGIE'
  const showScannerFields = actTypeKey === 'SCANNER'
  const showConsultationFields = actTypeKey === 'CONSULTATION'
  const showEchographieFields = actTypeKey === 'ECHOGRAPHIE'
  const showChirurgieFields = actTypeKey === 'CHIRURGIE'
  const showPrelevementFields = actTypeKey === 'PRELEVEMENT'
  const showSoinFields = actTypeKey === 'SOINS'
  const showAutreFields = actTypeKey === 'AUTRES'

  return (
    <main className="management-page">
      <PageHeader
        title="Gestion des actes"
        subtitle="Gérez les types d'actes, les actes cliniques et leurs paramètres"
      />

      <section className="management-section">
        <div className="section-title-row">
          <h2>Actes</h2>
          <button type="button" className="page-header-action" onClick={openCreateAct}>
            Nouvel acte
          </button>
        </div>

        <div className="act-types-filter">
          <button
            type="button"
            className={`act-type-chip ${selectedActTypeId === 'all' ? 'active' : ''}`}
            onClick={() => setSelectedActTypeId('all')}
          >
            Tous les actes
          </button>
          {actTypes.map((actType) => (
            <button
              key={actType.id}
              type="button"
              className={`act-type-chip ${String(selectedActTypeId) === String(actType.id) ? 'active' : ''}`}
              onClick={() => setSelectedActTypeId(String(actType.id))}
            >
              {actType.libelle}
            </button>
          ))}
        </div>

        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Libellé</th>
                <th>Prix fixé</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {!loading && !loadError && filteredActes.length === 0 && (
                <tr className="empty-row">
                  <td colSpan={4}>Aucun acte enregistré.</td>
                </tr>
              )}
              {!loading &&
                !loadError &&
                filteredActes.map((act) => (
                  <tr key={act.id}>
                    <td>{act.actType?.libelle}</td>
                    <td>{act.libelle}</td>
                    <td>{act.prixFixe ?? '—'}</td>
                    <td>
                      <div className="table-actions">
                        <button type="button" className="table-action-btn" onClick={() => openEditAct(act)}>
                          <FaEdit /> Modifier
                        </button>
                        <button type="button" className="table-action-btn danger" onClick={() => handleDeleteAct(act)}>
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

      <section className="management-section">
        <div className="section-title-row">
          <h2>Types d'actes</h2>
          <button type="button" className="page-header-action" onClick={openCreateType}>
            Nouveau type
          </button>
        </div>
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Libellé</th>
                <th></th>
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
                    <td>{actType.code}</td>
                    <td>{actType.libelle}</td>
                    <td>
                      <div className="table-actions">
                        <button type="button" className="table-action-btn" onClick={() => openEditType(actType)}>
                          <FaEdit /> Modifier
                        </button>
                        <button type="button" className="table-action-btn danger" onClick={() => handleDeleteType(actType)}>
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

      {isTypeModalOpen && (
        <Modal title={editingActType ? 'Modifier le type d\'acte' : 'Nouveau type d\'acte'} onClose={closeTypeModal} size="medium">
          <form onSubmit={handleTypeSubmit}>
            {typeError && <div className="form-error-banner">{typeError}</div>}
            <div className="form-grid">
              <div className="form-field">
                <label htmlFor="type-code">Code</label>
                <input id="type-code" value={typeForm.code} onChange={(event) => setTypeForm((prev) => ({ ...prev, code: event.target.value }))} required />
              </div>
              <div className="form-field">
                <label htmlFor="type-libelle">Libellé</label>
                <input id="type-libelle" value={typeForm.libelle} onChange={(event) => setTypeForm((prev) => ({ ...prev, libelle: event.target.value }))} required />
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

      {isActModalOpen && (
        <Modal title={editingAct ? 'Modifier l\'acte' : 'Nouvel acte'} onClose={closeActModal} size="large">
          <form onSubmit={handleActSubmit}>
            {actError && <div className="form-error-banner">{actError}</div>}
            <div className="form-grid">
              <div className="form-field">
                <label htmlFor="act-type">Type d'acte</label>
                <select id="act-type" value={actForm.actTypeId} onChange={(event) => setActForm((prev) => ({ ...prev, actTypeId: event.target.value }))} required>
                  <option value="">Sélectionnez un type</option>
                  {actTypes.map((actType) => (
                    <option key={actType.id} value={actType.id}>
                      {actType.libelle}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-field">
                <label htmlFor="act-libelle">Libellé</label>
                <input id="act-libelle" value={actForm.libelle} onChange={(event) => setActForm((prev) => ({ ...prev, libelle: event.target.value }))} required />
              </div>
              <div className="form-field">
                <label htmlFor="act-prix">Prix fixé</label>
                <input id="act-prix" type="number" step="0.01" value={actForm.prixFixe} onChange={(event) => setActForm((prev) => ({ ...prev, prixFixe: event.target.value }))} />
              </div>

              {showLaboratoireFields && (
                <>
                  <div className="form-section-title">Laboratoire</div>
                  <div className="form-field">
                    <label htmlFor="coeff-b">Coefficient B</label>
                    <input id="coeff-b" type="number" step="0.01" value={actForm.coefficientB} onChange={(event) => setActForm((prev) => ({ ...prev, coefficientB: event.target.value }))} />
                  </div>
                  <div className="form-field">
                    <label htmlFor="unit-principale">Unité principale</label>
                    <input id="unit-principale" value={actForm.unitePrincipale} onChange={(event) => setActForm((prev) => ({ ...prev, unitePrincipale: event.target.value }))} />
                  </div>
                  <div className="form-field">
                    <label htmlFor="unit-secondaire">Unité secondaire</label>
                    <input id="unit-secondaire" value={actForm.uniteSecondaire} onChange={(event) => setActForm((prev) => ({ ...prev, uniteSecondaire: event.target.value }))} />
                  </div>
                  <div className="form-field">
                    <label htmlFor="type-analyse">Type analyse</label>
                    <input id="type-analyse" value={actForm.typeAnalyse} onChange={(event) => setActForm((prev) => ({ ...prev, typeAnalyse: event.target.value }))} />
                  </div>
                  <div className="form-field">
                    <label htmlFor="ref-homme">Référence homme adulte</label>
                    <input id="ref-homme" value={actForm.referenceHommeAdulte} onChange={(event) => setActForm((prev) => ({ ...prev, referenceHommeAdulte: event.target.value }))} />
                  </div>
                  <div className="form-field">
                    <label htmlFor="ref-femme">Référence femme adulte</label>
                    <input id="ref-femme" value={actForm.referenceFemmeAdulte} onChange={(event) => setActForm((prev) => ({ ...prev, referenceFemmeAdulte: event.target.value }))} />
                  </div>
                  <div className="form-field">
                    <label htmlFor="ref-enfant">Référence enfant</label>
                    <input id="ref-enfant" value={actForm.referenceEnfant} onChange={(event) => setActForm((prev) => ({ ...prev, referenceEnfant: event.target.value }))} />
                  </div>
                  <div className="form-field">
                    <label htmlFor="ref-nourrisson">Référence nourrisson</label>
                    <input id="ref-nourrisson" value={actForm.referenceNourrisson} onChange={(event) => setActForm((prev) => ({ ...prev, referenceNourrisson: event.target.value }))} />
                  </div>
                  <div className="form-field">
                    <label htmlFor="numero-ordre">Numéro d'ordre</label>
                    <input id="numero-ordre" type="number" value={actForm.numeroOrdre} onChange={(event) => setActForm((prev) => ({ ...prev, numeroOrdre: event.target.value }))} />
                  </div>
                </>
              )}

              {showRadiologieFields && (
                <>
                  <div className="form-section-title">Radiologie</div>
                  <div className="form-field">
                    <label htmlFor="coeff-z">Coefficient Z</label>
                    <input id="coeff-z" type="number" step="0.01" value={actForm.coefficientZ} onChange={(event) => setActForm((prev) => ({ ...prev, coefficientZ: event.target.value }))} />
                  </div>
                </>
              )}

              {showScannerFields && (
                <div className="form-section-title">Scanner</div>
              )}

              {showConsultationFields && (
                <>
                  <div className="form-section-title">Consultation</div>
                  <div className="form-field">
                    <label htmlFor="type-consultation">Type consultation</label>
                    <select id="type-consultation" value={actForm.typeConsultation} onChange={(event) => setActForm((prev) => ({ ...prev, typeConsultation: event.target.value }))}>
                      <option value="">Sélectionnez</option>
                      <option value="GENERALISTE">Généraliste</option>
                      <option value="SPECIALISTE">Spécialiste</option>
                    </select>
                  </div>
                </>
              )}

              {showEchographieFields && (
                <div className="form-section-title">Échographie</div>
              )}

              {showChirurgieFields && (
                <>
                  <div className="form-section-title">Chirurgie</div>
                  <div className="form-field">
                    <label htmlFor="coeff-k">Coefficient K</label>
                    <input id="coeff-k" type="number" step="0.01" value={actForm.coefficientK} onChange={(event) => setActForm((prev) => ({ ...prev, coefficientK: event.target.value }))} />
                  </div>
                </>
              )}

              {showPrelevementFields && (
                <div className="form-section-title">Prélèvement</div>
              )}

              {(showSoinFields || showAutreFields) && (
                <div className="form-section-title">Autres</div>
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
