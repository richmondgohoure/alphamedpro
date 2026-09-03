import { useState, useEffect, useMemo, Fragment } from 'react'
import {
  FaArrowLeft,
  FaUserInjured,
  FaShieldAlt,
  FaPercent,
  FaMoneyBillWave,
  FaShoppingCart,
  FaPlus,
  FaCheck,
  FaTrash,
  FaSearch,
  FaCalculator,
  FaCheckCircle,
  FaFileInvoiceDollar,
  FaPrint,
  FaTimes,
  FaInfoCircle,
  FaCalendarAlt,
  FaPhoneAlt,
  FaMapMarkerAlt,
  FaBriefcase,
  FaIdCard,
  FaUserMd,
  FaUserTie,
  FaStethoscope,
  FaCogs,
  FaFolderOpen,
  FaNotesMedical,
  FaHandshake,
  FaListUl,
} from 'react-icons/fa'
import { priseEnChargeApi } from '../api/priseEnChargeApi'
import { actesApi } from '../api/actesApi'
import { assurancesApi } from '../api/assurancesApi'
import { medecinsApi } from '../api/medecinsApi'
import { visitesApi } from '../api/visitesApi'
import Modal from '../components/Modal'
import GestionActes from './GestionActes'
import MedecinForm from '../components/MedecinForm'
import DossierPatientModal from '../components/DossierPatientModal'
import VisitesPatientModal from '../components/VisitesPatientModal'
import { formatDateTime, formatDate } from '../utils/dateUtils'
import './PriseEnChargePage.css'
import '../styles/table.css'
import '../styles/form.css'

const formatPrice = (price) => {
  if (price == null || price === '') return '0 FCFA'
  return `${Number(price).toLocaleString('fr-FR')} FCFA`
}

function getInitials(nom, prenom) {
  const n = (nom || '').trim()
  const p = (prenom || '').trim()
  const first = n ? n[0].toUpperCase() : ''
  const second = p ? p[0].toUpperCase() : ''
  return `${first}${second}` || 'P'
}

function isLaboType(actType, act) {
  if (act?.coefficientB != null && act?.coefficientB !== '' && Number(act?.coefficientB) > 0) return true
  if (act?.typeAnalyse) return true
  if (!actType) return false
  const code = (actType.code || '').toUpperCase()
  const lib = (actType.libelle || '').toUpperCase()
  return (
    code.includes('LABO') ||
    code.includes('ANALYSE') ||
    code.includes('BIO') ||
    lib.includes('LABORATOIRE') ||
    lib.includes('ANALYSE') ||
    lib.includes('LABO') ||
    lib.includes('BIOLOGIE')
  )
}

function isRadioType(actType, act) {
  if (act?.coefficientZ != null && act?.coefficientZ !== '' && Number(act?.coefficientZ) > 0) return true
  if (!actType) return false
  const code = (actType.code || '').toUpperCase()
  const lib = (actType.libelle || '').toUpperCase()
  return (
    code.includes('RADIO') ||
    code.includes('IMAG') ||
    code.includes('SCANNER') ||
    code.includes('ECHO') ||
    code.includes('IRM') ||
    code.includes('RAYON') ||
    lib.includes('RADIOLOGIE') ||
    lib.includes('RADIO') ||
    lib.includes('IMAGERIE') ||
    lib.includes('SCANNER') ||
    lib.includes('ECHOGRAPHIE') ||
    lib.includes('IRM') ||
    lib.includes('RAYONS')
  )
}

function isConsultationType(actType, act) {
  if (act?.typeConsultation) return true
  if (!actType) return false
  const code = (actType.code || '').toUpperCase()
  const lib = (actType.libelle || '').toUpperCase()
  return (
    code.includes('CONSULT') ||
    lib.includes('CONSULT') ||
    code.includes('VISITE') ||
    lib.includes('VISITE')
  )
}

function isChirurgieType(actType, act) {
  if (act?.coefficientK != null && act?.coefficientK !== '' && Number(act?.coefficientK) > 0) return true
  if (!actType) return false
  const code = (actType.code || '').toUpperCase()
  const lib = (actType.libelle || '').toUpperCase()
  return (
    code.includes('CHIRURG') ||
    lib.includes('CHIRURG') ||
    code.includes('OPERA') ||
    lib.includes('OPERA') ||
    code.includes('BLOC') ||
    lib.includes('BLOC')
  )
}

function isConsultationCategory(categoryName, items = []) {
  if (items && items.some((it) => isConsultationType(null, it))) return true
  const c = (categoryName || '').toUpperCase()
  return c.includes('CONSULT') || c.includes('VISITE')
}

function isPrescriptionCategory(categoryName, items = []) {
  if (items && items.some((it) => isLaboType(null, it) || isRadioType(null, it))) return true
  const c = (categoryName || '').toUpperCase()
  return (
    c.includes('LABO') ||
    c.includes('ANALYSE') ||
    c.includes('BIO') ||
    c.includes('RADIO') ||
    c.includes('SCANNER') ||
    c.includes('ECHO') ||
    c.includes('IMAG') ||
    c.includes('IRM') ||
    c.includes('RAYON')
  )
}

// Calcul du prix unitaire et de la formule tarifaire selon l'assurance
function computeActTarification(act, assurance) {
  if (!act) return { price: 0, formula: '0 FCFA', type: 'NONE', coutB: null, coutZ: null, coutK: null }

  // 1. Consultation : Prix dépend de l'assurance (Généraliste vs Spécialiste)
  if (isConsultationType(act.actType, act)) {
    const typeCons = (act.typeConsultation || '').toUpperCase()
    if (assurance) {
      if (typeCons === 'SPECIALISTE') {
        if (assurance.prixConsultationSpecialiste != null && assurance.prixConsultationSpecialiste !== '') {
          const p = Number(assurance.prixConsultationSpecialiste)
          return {
            price: p,
            formula: `Tarif Spécialiste (${formatPrice(p)})`,
            type: 'CONSULTATION_SPECIALISTE',
            coutB: null,
            coutZ: null,
            coutK: null,
          }
        }
      } else if (typeCons === 'GENERALISTE') {
        if (assurance.prixConsultationGeneraliste != null && assurance.prixConsultationGeneraliste !== '') {
          const p = Number(assurance.prixConsultationGeneraliste)
          return {
            price: p,
            formula: `Tarif Généraliste (${formatPrice(p)})`,
            type: 'CONSULTATION_GENERALISTE',
            coutB: null,
            coutZ: null,
            coutK: null,
          }
        }
      } else {
        // Type consultation non spécifié : priorité tarif généraliste puis spécialiste
        if (assurance.prixConsultationGeneraliste != null && assurance.prixConsultationGeneraliste !== '') {
          const p = Number(assurance.prixConsultationGeneraliste)
          return {
            price: p,
            formula: `Tarif Consultation (${formatPrice(p)})`,
            type: 'CONSULTATION_GENERALISTE',
            coutB: null,
            coutZ: null,
            coutK: null,
          }
        }
        if (assurance.prixConsultationSpecialiste != null && assurance.prixConsultationSpecialiste !== '') {
          const p = Number(assurance.prixConsultationSpecialiste)
          return {
            price: p,
            formula: `Tarif Spécialiste (${formatPrice(p)})`,
            type: 'CONSULTATION_SPECIALISTE',
            coutB: null,
            coutZ: null,
            coutK: null,
          }
        }
      }
    }
    // Sans assurance ou tarif assurance absent : fallback prix fixe
    if (act.prixFixe != null && act.prixFixe !== '') {
      const p = Number(act.prixFixe)
      return {
        price: p,
        formula: `Prix standard (${formatPrice(p)})`,
        type: 'PRIX_FIXE',
        coutB: null,
        coutZ: null,
        coutK: null,
      }
    }
    return { price: 0, formula: 'Tarif non configuré', type: 'NONE', coutB: null, coutZ: null, coutK: null }
  }

  // 2. Laboratoire : B * coût du B selon l'assurance
  if (act.coefficientB != null && act.coefficientB !== '' && Number(act.coefficientB) > 0) {
    const coeffB = Number(act.coefficientB)
    const coutB =
      assurance && assurance.coutB != null && assurance.coutB !== '' && Number(assurance.coutB) > 0
        ? Number(assurance.coutB)
        : null

    if (coutB != null) {
      const calculatedPrice = Math.round(coeffB * coutB)
      return {
        price: calculatedPrice,
        formula: `B ${coeffB} × ${coutB} F = ${formatPrice(calculatedPrice)}`,
        type: 'COEFF_B',
        coeffB,
        coutB,
        coutZ: null,
        coutK: null,
      }
    }
    if (act.prixFixe != null && act.prixFixe !== '') {
      const p = Number(act.prixFixe)
      return {
        price: p,
        formula: `Prix standard (B ${coeffB})`,
        type: 'PRIX_FIXE',
        coeffB,
        coutB: null,
        coutZ: null,
        coutK: null,
      }
    }
    return {
      price: 0,
      formula: `B ${coeffB} (Coût B non défini)`,
      type: 'COEFF_B_MISSING',
      coeffB,
      coutB: null,
      coutZ: null,
      coutK: null,
    }
  }

  // 3. Radiologie : Z * coût du Z selon l'assurance
  if (act.coefficientZ != null && act.coefficientZ !== '' && Number(act.coefficientZ) > 0) {
    const coeffZ = Number(act.coefficientZ)
    const coutZ =
      assurance && assurance.coutZ != null && assurance.coutZ !== '' && Number(assurance.coutZ) > 0
        ? Number(assurance.coutZ)
        : null

    if (coutZ != null) {
      const calculatedPrice = Math.round(coeffZ * coutZ)
      return {
        price: calculatedPrice,
        formula: `Z ${coeffZ} × ${coutZ} F = ${formatPrice(calculatedPrice)}`,
        type: 'COEFF_Z',
        coeffZ,
        coutB: null,
        coutZ,
        coutK: null,
      }
    }
    if (act.prixFixe != null && act.prixFixe !== '') {
      const p = Number(act.prixFixe)
      return {
        price: p,
        formula: `Prix standard (Z ${coeffZ})`,
        type: 'PRIX_FIXE',
        coeffZ,
        coutB: null,
        coutZ: null,
        coutK: null,
      }
    }
    return {
      price: 0,
      formula: `Z ${coeffZ} (Coût Z non défini)`,
      type: 'COEFF_Z_MISSING',
      coeffZ,
      coutB: null,
      coutZ: null,
      coutK: null,
    }
  }

  // 4. Chirurgie : K * coût du K selon l'assurance
  if (act.coefficientK != null && act.coefficientK !== '' && Number(act.coefficientK) > 0) {
    const coeffK = Number(act.coefficientK)
    const coutK =
      assurance && assurance.coutK != null && assurance.coutK !== '' && Number(assurance.coutK) > 0
        ? Number(assurance.coutK)
        : null

    if (coutK != null) {
      const calculatedPrice = Math.round(coeffK * coutK)
      return {
        price: calculatedPrice,
        formula: `K ${coeffK} × ${coutK} F = ${formatPrice(calculatedPrice)}`,
        type: 'COEFF_K',
        coeffK,
        coutB: null,
        coutZ: null,
        coutK,
      }
    }
    if (act.prixFixe != null && act.prixFixe !== '') {
      const p = Number(act.prixFixe)
      return {
        price: p,
        formula: `Prix standard (K ${coeffK})`,
        type: 'PRIX_FIXE',
        coeffK,
        coutB: null,
        coutZ: null,
        coutK: null,
      }
    }
    return {
      price: 0,
      formula: `K ${coeffK} (Coût K non défini)`,
      type: 'COEFF_K_MISSING',
      coeffK,
      coutB: null,
      coutZ: null,
      coutK: null,
    }
  }

  // 5. Autres actes : Prix fixe
  if (act.prixFixe != null && act.prixFixe !== '') {
    const p = Number(act.prixFixe)
    return {
      price: p,
      formula: `Prix fixe (${formatPrice(p)})`,
      type: 'PRIX_FIXE',
      coutB: null,
      coutZ: null,
      coutK: null,
    }
  }

  return { price: 0, formula: '0 FCFA', type: 'NONE', coutB: null, coutZ: null, coutK: null }
}

export default function PriseEnChargePage({ patient, initialVisite = null, onBack, onPatientUpdated }) {
  // Visite en cours d'édition (si ouverture en mode modification)
  const [editingVisite, setEditingVisite] = useState(initialVisite)

  // Liste des actes disponibles dans le système
  const [allActes, setAllActes] = useState([])
  const [allAssurances, setAllAssurances] = useState([])
  const [allMedecins, setAllMedecins] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)

  // Assurance sélectionnée
  const [selectedAssuranceId, setSelectedAssuranceId] = useState(() => {
    if (initialVisite && initialVisite.assuranceId) {
      return initialVisite.assuranceId
    }
    if (patient.assurances && patient.assurances.length > 0) {
      return patient.assurances[0].assuranceId
    }
    return ''
  })

  // Type de couverture : 'POURCENTAGE' (défaut) ou 'FORFAIT'
  const [typeCouverture, setTypeCouverture] = useState('POURCENTAGE')
  const [tauxCouvertureGlobal, setTauxCouvertureGlobal] = useState(80)
  const [montantForfait, setMontantForfait] = useState('')

  // Panier à actes
  const [cart, setCart] = useState([])
  const [actSearch, setActSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('ALL')

  // Médecins / Prescripteurs par catégorie d'actes (Consultation -> Médecin, Analyses/Radio/Scanner/Echo -> Prescripteur)
  const [categoryPractitioners, setCategoryPractitioners] = useState({})

  const updateCategoryPractitioner = (category, value) => {
    setCategoryPractitioners((prev) => ({
      ...prev,
      [category]: value,
    }))
  }

  // Formulaire de prise en charge
  const [dateDemande, setDateDemande] = useState(() => new Date().toISOString())
  const [motif, setMotif] = useState('Prise en charge soins et actes médicaux')
  const [statut, setStatut] = useState('EN_ATTENTE')
  const [observation, setObservation] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState(null)
  const [errorMessage, setErrorMessage] = useState(null)
  const [lastVisite, setLastVisite] = useState(null)

  // Modale d'impression / Bon de prise en charge
  const [printModalData, setPrintModalData] = useState(null)

  // Modale de gestion des actes
  const [isGestionActesOpen, setIsGestionActesOpen] = useState(false)

  // Modale d'ajout personnalisé
  const [isCustomActOpen, setIsCustomActOpen] = useState(false)
  const [customActName, setCustomActName] = useState('')
  const [customActPrice, setCustomActPrice] = useState('')
  const [customActCategory, setCustomActCategory] = useState('AUTRES')

  // Modale d'ajout rapide d'un nouveau médecin / praticien
  const [isNewMedecinOpen, setIsNewMedecinOpen] = useState(false)
  const [targetCategoryForNewMedecin, setTargetCategoryForNewMedecin] = useState(null)
  const [newMedecinInitial, setNewMedecinInitial] = useState(null)
  const [newMedecinSubmitting, setNewMedecinSubmitting] = useState(false)
  const [newMedecinError, setNewMedecinError] = useState(null)

  // Modale du Dossier Médical / Antécédents
  const [isDossierModalOpen, setIsDossierModalOpen] = useState(false)

  // Modale de l'historique des visites du patient
  const [isVisitesModalOpen, setIsVisitesModalOpen] = useState(false)

  // Chargement des données
  const loadData = async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const [actesData, assurancesData, medecinsData] = await Promise.all([
        actesApi.list(),
        assurancesApi.list(),
        medecinsApi.list().catch(() => []),
      ])
      setAllActes(actesData)
      setAllAssurances(assurancesData)
      setAllMedecins(medecinsData || [])
    } catch (err) {
      setLoadError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCloseGestionActes = async () => {
    setIsGestionActesOpen(false)
    await loadData()
  }

  const openNewMedecinModal = (categoryName) => {
    setTargetCategoryForNewMedecin(categoryName || null)
    if (categoryName && isPrescriptionCategory(categoryName)) {
      setNewMedecinInitial({ typeMedecin: 'EXTERNE' })
    } else {
      setNewMedecinInitial({ typeMedecin: 'INTERNE' })
    }
    setNewMedecinError(null)
    setIsNewMedecinOpen(true)
  }

  const closeNewMedecinModal = () => {
    setIsNewMedecinOpen(false)
    setTargetCategoryForNewMedecin(null)
    setNewMedecinInitial(null)
    setNewMedecinError(null)
  }

  const handleCreateMedecin = async (payload) => {
    setNewMedecinSubmitting(true)
    setNewMedecinError(null)
    try {
      const createdMedecin = await medecinsApi.create(payload)
      const freshMedecins = await medecinsApi.list()
      setAllMedecins(freshMedecins || [])

      const nomComplet =
        createdMedecin.nomComplet ||
        `${createdMedecin.titre || 'Dr.'} ${createdMedecin.nom} ${createdMedecin.prenom}`
      let newLabel = ''
      if (targetCategoryForNewMedecin && isPrescriptionCategory(targetCategoryForNewMedecin)) {
        if (createdMedecin.typeMedecin === 'EXTERNE') {
          const center = createdMedecin.centreDeSante
            ? ` (${createdMedecin.centreDeSante})`
            : ' (Prescripteur externe)'
          newLabel = `${nomComplet}${center}`
        } else {
          newLabel = `${nomComplet} (Médecin interne)`
        }
      } else {
        const typeStr =
          createdMedecin.typeMedecin === 'INTERNE'
            ? 'Interne'
            : createdMedecin.centreDeSante
              ? createdMedecin.centreDeSante
              : 'Externe'
        newLabel = `${nomComplet} (${createdMedecin.specialite || 'Général'} — ${typeStr})`
      }

      if (targetCategoryForNewMedecin) {
        updateCategoryPractitioner(targetCategoryForNewMedecin, newLabel)
      }

      closeNewMedecinModal()
    } catch (err) {
      setNewMedecinError(err.message || 'Erreur lors de la création du praticien')
    } finally {
      setNewMedecinSubmitting(false)
    }
  }

  // Charger les informations d'une visite pour modification
  const loadVisiteData = (visiteToLoad) => {
    if (!visiteToLoad) return
    setEditingVisite(visiteToLoad)
    if (visiteToLoad.assuranceId) {
      setSelectedAssuranceId(String(visiteToLoad.assuranceId))
    } else if (visiteToLoad.sousFactures && visiteToLoad.sousFactures[0]?.assuranceId) {
      setSelectedAssuranceId(String(visiteToLoad.sousFactures[0].assuranceId))
    }
    if (visiteToLoad.dateVisite) {
      setDateDemande(visiteToLoad.dateVisite)
    }

    const loadedCart = []
    const practitioners = {}
    let detectedTypeCouverture = 'POURCENTAGE'
    let detectedTauxCouverture = 80
    let detectedMontantForfait = ''

    if (visiteToLoad.sousFactures && visiteToLoad.sousFactures.length > 0) {
      visiteToLoad.sousFactures.forEach((sf) => {
        let medecinVal = sf.medecinNomComplet || (sf.medecinId ? String(sf.medecinId) : null)
        if (!medecinVal && sf.details && sf.details.length > 0) {
          const detWithMed = sf.details.find((d) => d.medecinNomComplet || d.medecinId)
          if (detWithMed) {
            medecinVal =
              detWithMed.medecinNomComplet ||
              (detWithMed.medecinId ? String(detWithMed.medecinId) : null)
          }
        }

        if (medecinVal) {
          if (sf.libelleCategorie) practitioners[sf.libelleCategorie] = medecinVal
          if (sf.codeCategorie) practitioners[sf.codeCategorie] = medecinVal
          if (sf.codeCategorie === 'CO') {
            practitioners['Consultations'] = medecinVal
            practitioners['Consultation'] = medecinVal
            practitioners['Consultations Médicales'] = medecinVal
          } else if (sf.codeCategorie === 'EB') {
            practitioners['Laboratoire'] = medecinVal
            practitioners['Analyses Médicales'] = medecinVal
            practitioners['Examens Biologiques / Labo'] = medecinVal
          } else if (sf.codeCategorie === 'RA') {
            practitioners['Radiologie'] = medecinVal
            practitioners['Imagerie'] = medecinVal
          } else if (sf.codeCategorie === 'SC') {
            practitioners['Scanner'] = medecinVal
          } else if (sf.codeCategorie === 'EC') {
            practitioners['Échographie'] = medecinVal
            practitioners['Echographie'] = medecinVal
          } else if (sf.codeCategorie === 'PR') {
            practitioners['Prélèvement'] = medecinVal
            practitioners['Prelevement'] = medecinVal
          } else if (sf.codeCategorie === 'AU') {
            practitioners['Autres actes'] = medecinVal
          }

          if (sf.details && sf.details.length > 0) {
            sf.details.forEach((d) => {
              if (d.category) {
                practitioners[d.category] =
                  d.medecinNomComplet || (d.medecinId ? String(d.medecinId) : medecinVal)
              }
            })
          }
        }

        if (sf.details && sf.details.length > 0) {
          sf.details.forEach((d, idx) => {
            if (d.typeCouverture) detectedTypeCouverture = d.typeCouverture
            if (d.tauxCouverture != null) detectedTauxCouverture = Number(d.tauxCouverture)
            if (d.montantForfait != null) detectedMontantForfait = Number(d.montantForfait)

            loadedCart.push({
              id: `visite-detail-${d.id || Math.random()}-${idx}`,
              actId: d.acteId || null,
              libelle: d.libelleActe,
              category: d.category || sf.libelleCategorie || 'Autres actes',
              codeCategory: sf.codeCategorie || '',
              prixUnitaire: Number(d.prixUnitaire || 0),
              tarifFormula: d.tarifFormula || '',
              quantite: Number(d.quantite || 1),
              typeCouverture: d.typeCouverture || 'POURCENTAGE',
              tauxCouverture: d.tauxCouverture != null ? Number(d.tauxCouverture) : 80,
              montantForfait: d.montantForfait != null ? Number(d.montantForfait) : '',
              isCustom: !d.acteId,
              coefficientInfo: d.coefficientInfo || null,
              coefficientB: null,
              coefficientZ: null,
              coefficientK: null,
              coutB: '',
              coutZ: '',
              coutK: '',
            })
          })
        } else {
          const rate =
            sf.montantBrut > 0
              ? Math.round((Number(sf.partAssurance || 0) / Number(sf.montantBrut)) * 100)
              : 80
          loadedCart.push({
            id: `visite-sf-${sf.id || Math.random()}`,
            actId: null,
            libelle: sf.libelleCategorie || sf.codeCategorie,
            category: sf.libelleCategorie || 'Autres actes',
            codeCategory: sf.codeCategorie || '',
            prixUnitaire: Number(sf.montantBrut || 0),
            tarifFormula: '',
            quantite: 1,
            typeCouverture: 'POURCENTAGE',
            tauxCouverture: rate,
            montantForfait: '',
            isCustom: true,
            coefficientInfo: null,
            coefficientB: null,
            coefficientZ: null,
            coefficientK: null,
            coutB: '',
            coutZ: '',
            coutK: '',
          })
        }
      })
    }

    setCategoryPractitioners((prev) => ({ ...prev, ...practitioners }))
    setCart(loadedCart)
    setTypeCouverture(detectedTypeCouverture)
    setTauxCouvertureGlobal(detectedTauxCouverture)
    if (detectedMontantForfait) setMontantForfait(detectedMontantForfait)
    setSuccessMessage(null)
    setErrorMessage(null)
    setLastVisite(null)
  }

  useEffect(() => {
    if (initialVisite) {
      loadVisiteData(initialVisite)
    }
  }, [initialVisite, allMedecins])

  useEffect(() => {
    loadData()
  }, [patient.id])

  // Trouver l'objet assurance complet
  const currentAssurance = useMemo(() => {
    if (!selectedAssuranceId) return null
    return allAssurances.find((a) => String(a.id) === String(selectedAssuranceId)) || null
  }, [selectedAssuranceId, allAssurances])

  // Options dynamiques pour les listes de praticiens & prescripteurs (provenant exclusivement de la base de données)
  const medecinsOptions = useMemo(() => {
    if (!allMedecins || allMedecins.length === 0) return []
    return allMedecins.map((m) => {
      const nomComplet = m.nomComplet || `${m.titre || 'Dr.'} ${m.nom} ${m.prenom}`
      const typeStr =
        m.typeMedecin === 'INTERNE'
          ? 'Interne'
          : m.centreDeSante
            ? m.centreDeSante
            : 'Externe'
      const label = `${nomComplet} (${m.specialite || 'Général'} — ${typeStr})`
      return {
        id: m.id,
        label,
        nomComplet,
        typeMedecin: m.typeMedecin,
        medecin: m,
      }
    })
  }, [allMedecins])

  const prescripteursOptions = useMemo(() => {
    if (!allMedecins || allMedecins.length === 0) return []
    return allMedecins.map((m) => {
      const nomComplet = m.nomComplet || `${m.titre || 'Dr.'} ${m.nom} ${m.prenom}`
      let label = ''
      if (m.typeMedecin === 'EXTERNE') {
        const center = m.centreDeSante ? ` (${m.centreDeSante})` : ' (Prescripteur externe)'
        label = `${nomComplet}${center}`
      } else {
        label = `${nomComplet} (Médecin interne)`
      }
      return {
        id: m.id,
        label,
        nomComplet,
        typeMedecin: m.typeMedecin,
        medecin: m,
      }
    })
  }, [allMedecins])

  // Résout la valeur affichée dans le select du praticien pour une catégorie
  const getPractitionerSelectValue = (category, options) => {
    let current = categoryPractitioners[category]
    if (!current) {
      for (const [key, val] of Object.entries(categoryPractitioners)) {
        if (
          val &&
          (key.toLowerCase().includes((category || '').toLowerCase()) ||
            (category || '').toLowerCase().includes(key.toLowerCase()))
        ) {
          current = val
          break
        }
      }
    }
    if (!current) return ''

    // Recherche de correspondance exacte ou approchante dans les options
    const found = options.find(
      (o) =>
        o.label === current ||
        String(o.id) === String(current) ||
        o.nomComplet === current ||
        (o.nomComplet && typeof current === 'string' && current.includes(o.nomComplet)) ||
        (o.label && typeof current === 'string' && current.includes(o.label))
    )
    if (found) return found.label
    return current
  }

  // Trouver le matricule du patient pour l'assurance sélectionnée
  const currentMatricule = useMemo(() => {
    if (!selectedAssuranceId || !patient.assurances) return ''
    const match = patient.assurances.find(
      (a) => String(a.assuranceId) === String(selectedAssuranceId)
    )
    return match ? match.numeroMatricule : ''
  }, [selectedAssuranceId, patient.assurances])

  // Trouver le garant rattaché à l'assurance sélectionnée
  const currentGarantId = useMemo(() => {
    if (!selectedAssuranceId || !patient.assurances) return null
    const match = patient.assurances.find(
      (a) => String(a.assuranceId) === String(selectedAssuranceId)
    )
    return match ? match.garantId : null
  }, [selectedAssuranceId, patient.assurances])

  const currentGarantLibelle = useMemo(() => {
    if (!selectedAssuranceId || !patient.assurances) return ''
    const match = patient.assurances.find(
      (a) => String(a.assuranceId) === String(selectedAssuranceId)
    )
    return match ? match.garantLibelle : ''
  }, [selectedAssuranceId, patient.assurances])

  // Recalculer les prix du panier quand l'assurance change
  const handleAssuranceChange = (newAssuranceId) => {
    setSelectedAssuranceId(newAssuranceId)
    const newAssurance = allAssurances.find((a) => String(a.id) === String(newAssuranceId)) || null
    setCart((prevCart) =>
      prevCart.map((item) => {
        if (item.isCustom) return item
        const originalAct = allActes.find((a) => a.id === item.actId)
        if (!originalAct) return item
        const tarif = computeActTarification(originalAct, newAssurance)
        return {
          ...item,
          prixUnitaire: tarif.price,
          tarifFormula: tarif.formula,
          coutB:
            tarif.coutB !== undefined && tarif.coutB !== null
              ? tarif.coutB
              : newAssurance?.coutB != null
                ? Number(newAssurance.coutB)
                : '',
          coutZ:
            tarif.coutZ !== undefined && tarif.coutZ !== null
              ? tarif.coutZ
              : newAssurance?.coutZ != null
                ? Number(newAssurance.coutZ)
                : '',
          coutK:
            tarif.coutK !== undefined && tarif.coutK !== null
              ? tarif.coutK
              : newAssurance?.coutK != null
                ? Number(newAssurance.coutK)
                : '',
        }
      })
    )
  }

  // Ajouter un acte au panier
  const addToCart = (act) => {
    const tarif = computeActTarification(act, currentAssurance)
    const existingIndex = cart.findIndex((item) => !item.isCustom && item.actId === act.id)

    if (existingIndex >= 0) {
      // Acte déjà présent dans le panier
      return
    }

    setCart((prev) => [
      ...prev,
      {
        id: `act-${act.id}-${Date.now()}`,
        actId: act.id,
        libelle: act.libelle,
        category: act.actType?.libelle || act.actType?.code || 'Autres actes',
        codeCategory: act.actType?.code || '',
        prixUnitaire: tarif.price,
        tarifFormula: tarif.formula,
        quantite: 1,
        typeCouverture: typeCouverture,
        tauxCouverture: tauxCouvertureGlobal,
        montantForfait: typeCouverture === 'FORFAIT' && montantForfait ? Number(montantForfait) : '',
        isCustom: false,
        coefficientB:
          act.coefficientB != null && act.coefficientB !== '' ? Number(act.coefficientB) : null,
        coefficientZ:
          act.coefficientZ != null && act.coefficientZ !== '' ? Number(act.coefficientZ) : null,
        coefficientK:
          act.coefficientK != null && act.coefficientK !== '' ? Number(act.coefficientK) : null,
        coutB:
          tarif.coutB !== undefined && tarif.coutB !== null
            ? tarif.coutB
            : currentAssurance?.coutB != null
              ? Number(currentAssurance.coutB)
              : '',
        coutZ:
          tarif.coutZ !== undefined && tarif.coutZ !== null
            ? tarif.coutZ
            : currentAssurance?.coutZ != null
              ? Number(currentAssurance.coutZ)
              : '',
        coutK:
          tarif.coutK !== undefined && tarif.coutK !== null
            ? tarif.coutK
            : currentAssurance?.coutK != null
              ? Number(currentAssurance.coutK)
              : '',
        coefficientInfo: act.coefficientB
          ? `B ${act.coefficientB}`
          : act.coefficientZ
            ? `Z ${act.coefficientZ}`
            : act.coefficientK
              ? `K ${act.coefficientK}`
              : null,
      },
    ])
  }

  // Ajouter un acte manuel personnalisé
  const handleAddCustomAct = (e) => {
    e.preventDefault()
    if (!customActName.trim()) return
    const price = Number(customActPrice) || 0
    setCart((prev) => [
      ...prev,
      {
        id: `custom-${Date.now()}`,
        actId: null,
        libelle: customActName.trim(),
        category: customActCategory,
        codeCategory: customActCategory,
        prixUnitaire: price,
        quantite: 1,
        typeCouverture: typeCouverture,
        tauxCouverture: tauxCouvertureGlobal,
        montantForfait: typeCouverture === 'FORFAIT' && montantForfait ? Number(montantForfait) : '',
        isCustom: true,
        coefficientB: null,
        coefficientZ: null,
        coefficientK: null,
        coutB: '',
        coutZ: '',
        coutK: '',
        coefficientInfo: null,
      },
    ])
    setCustomActName('')
    setCustomActPrice('')
    setIsCustomActOpen(false)
  }

  // Modifier type de couverture d'un acte spécifique
  const updateItemType = (itemId, newType) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item
        return {
          ...item,
          typeCouverture: newType,
          montantForfait: item.montantForfait != null ? item.montantForfait : '',
        }
      })
    )
  }

  // Modifier forfait d'un acte spécifique
  const updateItemForfait = (itemId, newForfait) => {
    setCart((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? {
              ...item,
              montantForfait:
                newForfait === '' ? '' : Math.max(0, Number(newForfait) || 0),
            }
          : item
      )
    )
  }

  // Modifier prix unitaire dans le panier
  const updateUnitPrice = (itemId, newPrice) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item
        const p = Math.max(0, Number(newPrice) || 0)
        let updatedFormula = item.tarifFormula
        let updatedCoutB = item.coutB
        let updatedCoutZ = item.coutZ
        let updatedCoutK = item.coutK

        if (item.coefficientB != null && Number(item.coefficientB) > 0) {
          const coeff = Number(item.coefficientB)
          updatedCoutB = Math.round(p / coeff)
          updatedFormula = `B ${coeff} × ${updatedCoutB} F = ${formatPrice(p)}`
        } else if (item.coefficientZ != null && Number(item.coefficientZ) > 0) {
          const coeff = Number(item.coefficientZ)
          updatedCoutZ = Math.round(p / coeff)
          updatedFormula = `Z ${coeff} × ${updatedCoutZ} F = ${formatPrice(p)}`
        } else if (item.coefficientK != null && Number(item.coefficientK) > 0) {
          const coeff = Number(item.coefficientK)
          updatedCoutK = Math.round(p / coeff)
          updatedFormula = `K ${coeff} × ${updatedCoutK} F = ${formatPrice(p)}`
        } else {
          updatedFormula = `Tarif ajusté (${formatPrice(p)})`
        }

        return {
          ...item,
          prixUnitaire: p,
          tarifFormula: updatedFormula,
          coutB: updatedCoutB,
          coutZ: updatedCoutZ,
          coutK: updatedCoutK,
        }
      })
    )
  }

  // Modifier le coût du B pour un acte individuel
  const updateItemCoutB = (itemId, newCout) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item
        const numCout = newCout === '' ? '' : Math.max(0, Number(newCout) || 0)
        const coeff = item.coefficientB != null ? Number(item.coefficientB) : 0
        const newPrice = numCout !== '' ? Math.round(coeff * Number(numCout)) : 0
        const formula =
          numCout !== ''
            ? `B ${coeff} × ${numCout} F = ${formatPrice(newPrice)}`
            : `B ${coeff} (Coût B non défini)`
        return {
          ...item,
          coutB: numCout,
          prixUnitaire: newPrice,
          tarifFormula: formula,
        }
      })
    )
  }

  // Modifier le coût du Z pour un acte individuel
  const updateItemCoutZ = (itemId, newCout) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item
        const numCout = newCout === '' ? '' : Math.max(0, Number(newCout) || 0)
        const coeff = item.coefficientZ != null ? Number(item.coefficientZ) : 0
        const newPrice = numCout !== '' ? Math.round(coeff * Number(numCout)) : 0
        const formula =
          numCout !== ''
            ? `Z ${coeff} × ${numCout} F = ${formatPrice(newPrice)}`
            : `Z ${coeff} (Coût Z non défini)`
        return {
          ...item,
          coutZ: numCout,
          prixUnitaire: newPrice,
          tarifFormula: formula,
        }
      })
    )
  }

  // Modifier le coût du K pour un acte individuel
  const updateItemCoutK = (itemId, newCout) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item
        const numCout = newCout === '' ? '' : Math.max(0, Number(newCout) || 0)
        const coeff = item.coefficientK != null ? Number(item.coefficientK) : 0
        const newPrice = numCout !== '' ? Math.round(coeff * Number(numCout)) : 0
        const formula =
          numCout !== ''
            ? `K ${coeff} × ${numCout} F = ${formatPrice(newPrice)}`
            : `K ${coeff} (Coût K non défini)`
        return {
          ...item,
          coutK: numCout,
          prixUnitaire: newPrice,
          tarifFormula: formula,
        }
      })
    )
  }

  // Appliquer le coût du B à tous les actes de la catégorie dans le panier
  const applyCategoryCoutB = (category, newCout) => {
    const numCout = newCout === '' ? '' : Math.max(0, Number(newCout) || 0)
    setCart((prev) =>
      prev.map((item) => {
        if ((item.category === category || isLaboType(null, item)) && item.coefficientB != null) {
          const coeff = Number(item.coefficientB) || 0
          const newPrice = numCout !== '' ? Math.round(coeff * Number(numCout)) : 0
          const formula =
            numCout !== ''
              ? `B ${coeff} × ${numCout} F = ${formatPrice(newPrice)}`
              : `B ${coeff} (Coût B non défini)`
          return {
            ...item,
            coutB: numCout,
            prixUnitaire: newPrice,
            tarifFormula: formula,
          }
        }
        return item
      })
    )
  }

  // Appliquer le coût du Z à tous les actes de la catégorie dans le panier
  const applyCategoryCoutZ = (category, newCout) => {
    const numCout = newCout === '' ? '' : Math.max(0, Number(newCout) || 0)
    setCart((prev) =>
      prev.map((item) => {
        if ((item.category === category || isRadioType(null, item)) && item.coefficientZ != null) {
          const coeff = Number(item.coefficientZ) || 0
          const newPrice = numCout !== '' ? Math.round(coeff * Number(numCout)) : 0
          const formula =
            numCout !== ''
              ? `Z ${coeff} × ${numCout} F = ${formatPrice(newPrice)}`
              : `Z ${coeff} (Coût Z non défini)`
          return {
            ...item,
            coutZ: numCout,
            prixUnitaire: newPrice,
            tarifFormula: formula,
          }
        }
        return item
      })
    )
  }

  // Modifier taux de couverture d'un acte spécifique
  const updateItemTaux = (itemId, newTaux) => {
    setCart((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? {
              ...item,
              tauxCouverture:
                newTaux === '' ? 0 : Math.max(0, Math.min(100, Number(newTaux) || 0)),
            }
          : item
      )
    )
  }

  // Supprimer un acte du panier
  const removeFromCart = (itemId) => {
    setCart((prev) => prev.filter((item) => item.id !== itemId))
  }

  // Vider le panier
  const clearCart = () => {
    if (cart.length > 0 && window.confirm('Êtes-vous sûr de vouloir vider le panier à actes ?')) {
      setCart([])
    }
  }

  // Changement du mode global de couverture
  const handleTypeCouvertureChange = (mode) => {
    setTypeCouverture(mode)
    setCart((prev) =>
      prev.map((item) => ({
        ...item,
        typeCouverture: mode,
      }))
    )
  }

  // Application du taux global à tous les items
  const handleGlobalTauxChange = (val) => {
    const num = Math.max(0, Math.min(100, Number(val) || 0))
    setTauxCouvertureGlobal(num)
    setCart((prev) => prev.map((item) => ({ ...item, tauxCouverture: num })))
  }

  // CALCULS FINANCIERS SELON LES RÈGLES
  const calculations = useMemo(() => {
    // 1. Calcul ligne par ligne
    const calculatedItems = cart.map((item) => {
      const montantLigne = Number(item.prixUnitaire) || 0
      const itemType = item.typeCouverture || typeCouverture
      let partAssuranceLigne = 0
      let partPatientLigne = montantLigne

      if (itemType === 'POURCENTAGE') {
        const taux = item.tauxCouverture != null ? item.tauxCouverture : tauxCouvertureGlobal
        partAssuranceLigne = Math.round(montantLigne * (taux / 100))
        partPatientLigne = Math.max(0, montantLigne - partAssuranceLigne)
      } else {
        // FORFAIT pour cet acte
        const fVal =
          item.montantForfait !== '' && item.montantForfait != null
            ? Number(item.montantForfait)
            : typeCouverture === 'FORFAIT' && montantForfait
              ? Number(montantForfait)
              : 0
        partAssuranceLigne = Math.min(montantLigne, Math.max(0, fVal))
        partPatientLigne = Math.max(0, montantLigne - partAssuranceLigne)
      }

      return {
        ...item,
        montantLigne,
        partAssuranceLigne,
        partPatientLigne,
      }
    })

    const totalBrut = calculatedItems.reduce((acc, it) => acc + it.montantLigne, 0)
    const totalPartAssurance = calculatedItems.reduce((acc, it) => acc + it.partAssuranceLigne, 0)
    const totalPartPatient = calculatedItems.reduce((acc, it) => acc + it.partPatientLigne, 0)

    // 2. Regroupement et calcul des sous-totaux par type / catégorie d'acte
    const categoriesMap = {}
    calculatedItems.forEach((item) => {
      const cat = item.category || 'Autres actes'
      if (!categoriesMap[cat]) {
        categoriesMap[cat] = {
          category: cat,
          items: [],
          totalBrut: 0,
          totalPartAssurance: 0,
          totalPartPatient: 0,
          count: 0,
        }
      }
      categoriesMap[cat].items.push(item)
      categoriesMap[cat].totalBrut += item.montantLigne
      categoriesMap[cat].totalPartAssurance += item.partAssuranceLigne
      categoriesMap[cat].totalPartPatient += item.partPatientLigne
      categoriesMap[cat].count += 1
    })

    const categorySubtotals = Object.values(categoriesMap).map((group) => {
      const isConsult = isConsultationCategory(group.category, group.items)
      const isPrescr = isPrescriptionCategory(group.category, group.items)
      const practitionerType = isConsult ? 'MEDECIN' : isPrescr ? 'PRESCRIPTEUR' : 'PRATICIEN'
      const practitioner = categoryPractitioners[group.category] || ''
      return {
        ...group,
        isConsultation: isConsult,
        isPrescription: isPrescr,
        practitionerType,
        practitioner,
      }
    })

    return {
      items: calculatedItems,
      categorySubtotals,
      totalBrut,
      totalPartAssurance,
      totalPartPatient,
    }
  }, [cart, typeCouverture, tauxCouvertureGlobal, montantForfait, categoryPractitioners])

  // Filtrage du catalogue d'actes pour la recherche et les catégories
  const filteredActes = useMemo(() => {
    return allActes.filter((act) => {
      const code = (act.actType?.code || '').toUpperCase()
      const libelle = (act.libelle || '').toLowerCase()
      const libType = (act.actType?.libelle || '').toLowerCase()
      const search = actSearch.toLowerCase().trim()

      const matchSearch =
        !search ||
        libelle.includes(search) ||
        code.toLowerCase().includes(search) ||
        libType.includes(search)

      if (!matchSearch) return false

      if (selectedCategory === 'ALL') return true
      if (selectedCategory === 'LABO') {
        return isLaboType(act.actType, act)
      }
      if (selectedCategory === 'RADIO') {
        return isRadioType(act.actType, act)
      }
      if (selectedCategory === 'CONSULTATION') {
        return isConsultationType(act.actType, act)
      }
      if (selectedCategory === 'CHIRURGIE') {
        return isChirurgieType(act.actType, act)
      }
      if (selectedCategory === 'AUTRES') {
        return (
          !isLaboType(act.actType, act) &&
          !isRadioType(act.actType, act) &&
          !isConsultationType(act.actType, act) &&
          !isChirurgieType(act.actType, act)
        )
      }

      return false
    })
  }, [allActes, actSearch, selectedCategory])

  // Détermine le code de sous-facture selon le nom de catégorie
  const getCategorieCode = (categoryName, items = []) => {
    const c = (categoryName || '').toUpperCase()
    // Vérifier aussi les items pour affiner la détection
    const hasScanner = items.some((it) => {
      const code = (it.actType?.code || '').toUpperCase()
      const lib = ((it.actType?.libelle || '') + (it.libelle || '')).toUpperCase()
      return code.includes('SCANNER') || lib.includes('SCANNER')
    })
    const hasEcho = items.some((it) => {
      const code = (it.actType?.code || '').toUpperCase()
      const lib = ((it.actType?.libelle || '') + (it.libelle || '')).toUpperCase()
      return code.includes('ECHO') || lib.includes('ECHO')
    })
    const hasPrelevement = items.some((it) => {
      const code = (it.actType?.code || '').toUpperCase()
      const lib = ((it.actType?.libelle || '') + (it.libelle || '')).toUpperCase()
      return code.includes('PRELEV') || lib.includes('PRÉLÈV') || lib.includes('PRELEV')
    })

    if (c.includes('CONSULT') || c.includes('VISITE')) return { code: 'CO', libelle: 'Consultation' }
    if (c.includes('LABO') || c.includes('ANALYSE') || c.includes('BIO')) return { code: 'EB', libelle: 'Examens Biologiques / Labo' }
    if (hasScanner || c.includes('SCANNER')) return { code: 'SC', libelle: 'Scanner' }
    if (hasEcho || c.includes('ECHO')) return { code: 'EC', libelle: 'Échographie' }
    if (hasPrelevement || c.includes('PRELEV')) return { code: 'PR', libelle: 'Prélèvement' }
    if (c.includes('RADIO') || c.includes('IMAG') || c.includes('RAYON') || c.includes('IRM')) return { code: 'RA', libelle: 'Radiologie' }
    return { code: 'AU', libelle: 'Autres actes' }
  }

  // Trouve l'ID du praticien / médecin sélectionné pour une catégorie
  const getPractitionerIdForCategory = (categoryName) => {
    let val = categoryPractitioners[categoryName]
    if (!val) {
      for (const [key, v] of Object.entries(categoryPractitioners)) {
        if (
          v &&
          (key.toLowerCase().includes((categoryName || '').toLowerCase()) ||
            (categoryName || '').toLowerCase().includes(key.toLowerCase()))
        ) {
          val = v
          break
        }
      }
    }
    if (!val) return null
    if (typeof val === 'number') return val
    if (!isNaN(val) && String(Number(val)) === String(val).trim()) {
      return Number(val)
    }
    const found = allMedecins.find((m) => {
      const nomComplet = m.nomComplet || `${m.titre || 'Dr.'} ${m.nom} ${m.prenom}`
      return (
        m.id === Number(val) ||
        nomComplet === val ||
        val.startsWith(nomComplet) ||
        (m.nom && m.prenom && val.includes(m.nom) && val.includes(m.prenom))
      )
    })
    return found ? found.id : null
  }

  // Soumission / Enregistrement de la prise en charge
  const handleSavePriseEnCharge = async (e) => {
    if (e) e.preventDefault()
    if (cart.length === 0) {
      setErrorMessage('Veuillez ajouter au moins un acte dans le panier.')
      return
    }

    setSubmitting(true)
    setErrorMessage(null)
    setSuccessMessage(null)

    const payload = {
      assuranceId: selectedAssuranceId ? Number(selectedAssuranceId) : null,
      dateDemande,
      motif: motif || 'Prise en charge médicale',
      montant: calculations.totalPartAssurance, // Montant pris en charge par l'assurance
      typeCouverture,
      tauxCouverture: typeCouverture === 'POURCENTAGE' ? Number(tauxCouvertureGlobal) : null,
      montantForfait: typeCouverture === 'FORFAIT' ? Number(montantForfait) || 0 : null,
      montantTotal: calculations.totalBrut,
      partAssurance: calculations.totalPartAssurance,
      partPatient: calculations.totalPartPatient,
      detailsActes: JSON.stringify({
        items: calculations.items.map((it) => ({
          libelle: it.libelle,
          category: it.category,
          prixUnitaire: it.prixUnitaire,
          quantite: it.quantite,
          montantLigne: it.montantLigne,
          tauxCouverture: it.tauxCouverture,
          partAssurance: it.partAssuranceLigne,
          partPatient: it.partPatientLigne,
          typeCouverture: it.typeCouverture,
          montantForfait: it.montantForfait,
          coefficientInfo: it.coefficientInfo,
          tarifFormula: it.tarifFormula,
        })),
        categoryPractitioners,
        categorySubtotals: calculations.categorySubtotals,
      }),
      statut,
      observation: observation || null,
    }

    try {
      let resPriseEnCharge = null
      if (editingVisite && editingVisite.priseEnChargeId) {
        try {
          resPriseEnCharge = await priseEnChargeApi.update(editingVisite.priseEnChargeId, payload)
        } catch (pecErr) {
          console.warn('Mise à jour PEC existante échouée, création d une nouvelle :', pecErr)
          resPriseEnCharge = await priseEnChargeApi.create(patient.id, payload)
        }
      } else {
        resPriseEnCharge = await priseEnChargeApi.create(patient.id, payload)
      }

      // Préparer les sous-factures et leurs détails
      const sousFactures = calculations.categorySubtotals.map((cat) => {
        const { code, libelle } = getCategorieCode(cat.category, cat.items)
        const medecinId = getPractitionerIdForCategory(cat.category)
        const itemsDetails = (cat.items || []).map((it) => ({
          acteId: it.actId || null,
          libelleActe: it.libelle,
          category: it.category,
          prixUnitaire: it.prixUnitaire,
          quantite: it.quantite || 1,
          montantBrut: it.montantLigne,
          partAssurance: it.partAssuranceLigne,
          partPatient: it.partPatientLigne,
          tauxCouverture: it.tauxCouverture != null ? Number(it.tauxCouverture) : null,
          typeCouverture: it.typeCouverture || typeCouverture,
          montantForfait:
            it.montantForfait != null && it.montantForfait !== ''
              ? Number(it.montantForfait)
              : null,
          coefficientInfo: it.coefficientInfo || null,
          tarifFormula: it.tarifFormula || null,
          medecinId: medecinId,
        }))

        return {
          codeCategorie: code,
          libelleCategorie: libelle,
          assuranceId: selectedAssuranceId ? Number(selectedAssuranceId) : null,
          garantId: currentGarantId ? Number(currentGarantId) : null,
          medecinId: medecinId,
          montantBrut: cat.totalBrut,
          partAssurance: cat.totalPartAssurance,
          partPatient: cat.totalPartPatient,
          dateCreation: new Date().toISOString(),
          details: itemsDetails,
        }
      })

      const visitePayload = {
        priseEnChargeId: resPriseEnCharge?.id || null,
        assuranceId: selectedAssuranceId ? Number(selectedAssuranceId) : null,
        garantId: currentGarantId ? Number(currentGarantId) : null,
        dateVisite: dateDemande || new Date().toISOString(),
        sousFactures,
      }

      let visiteSaved = null
      if (editingVisite && editingVisite.id) {
        visiteSaved = await visitesApi.updateVisite(editingVisite.id, visitePayload)
        setSuccessMessage(`Visite N° ${visiteSaved.numeroVisite || editingVisite.numeroVisite} modifiée avec succès !`)
      } else {
        visiteSaved = await visitesApi.creerVisite(patient.id, visitePayload)
        setSuccessMessage('Prise en charge et Visite enregistrées avec succès !')
      }

      setLastVisite(visiteSaved)
      setCart([])
      await loadData()
      if (onPatientUpdated) onPatientUpdated()
    } catch (err) {
      setErrorMessage(err.message || "Erreur lors de l'enregistrement de la prise en charge.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="management-page pec-page">
      {/* BARRE SUPÉRIEURE DE NAVIGATION */}
      <div className="pec-top-nav">
        <button type="button" className="pec-back-btn" onClick={onBack}>
          <FaArrowLeft /> {editingVisite ? 'Retour à la liste des visites' : 'Retour à la liste des patients'}
        </button>
        <div className="pec-nav-title">
          <h1>
            {editingVisite ? (
              <>
                Modification de la Visite <span className="pec-edit-visite-badge">{editingVisite.numeroVisite}</span>
              </>
            ) : (
              'Nouvelle Visite'
            )}
          </h1>
        </div>
      </div>

      {/* 1 & 2. SECTIONS SUPÉRIEURES CÔTE À CÔTE : PATIENT / ASSURANCE & TYPE DE COUVERTURE */}
      <div className="pec-top-sections-row">
        {/* 1. EN HAUT : FICHE D'INFORMATIONS DU PATIENT */}
        <section className="management-section pec-patient-card-section">
          <div className="pec-patient-card-header">
            <div className="pec-patient-avatar">
              <span>{getInitials(patient.nom, patient.prenom)}</span>
            </div>
            <div className="pec-patient-main-info">
              <div className="pec-patient-title-row">
                <span className="pec-doit-label">DOIT :</span>
                <h2>
                  {patient.prenom} {patient.nom}
                </h2>
                <button
                  type="button"
                  className="table-action-btn dp-table-chip"
                  style={{ cursor: 'pointer', border: '1px solid #fde047' }}
                  onClick={() => setIsDossierModalOpen(true)}
                  title="Consulter le dossier médical & antécédents"
                >
                  <FaFolderOpen /> {patient.numeroDossier || `DP-${String(patient.id || 1).padStart(7, '0')}`}
                </button>
                <button
                  type="button"
                  className="table-action-btn dossier-action-btn"
                  onClick={() => setIsDossierModalOpen(true)}
                  title="Consulter et mettre à jour les antécédents médicaux"
                  style={{ marginLeft: 4 }}
                >
                  <FaNotesMedical /> Antécédents
                </button>
                {patient.code && (
                  <span className="pec-code-tag">
                    <FaIdCard /> {patient.code}
                  </span>
                )}
              </div>
              <p className="pec-patient-meta">
                {patient.dateNaissance && (
                  <span>
                    <FaCalendarAlt className="meta-icon" /> Né(e) le {formatDate(patient.dateNaissance)}
                  </span>
                )}
                {patient.numeroTelephone && (
                  <span>
                    <FaPhoneAlt className="meta-icon" /> {patient.numeroTelephone}
                  </span>
                )}
                {patient.quartier && (
                  <span>
                    <FaMapMarkerAlt className="meta-icon" /> {patient.quartier}
                  </span>
                )}
                {patient.profession && (
                  <span>
                    <FaBriefcase className="meta-icon" /> {patient.profession}
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* 2. SÉLECTION DE L'ASSURANCE DU PATIENT */}
          <div className="pec-assurance-selector-block">
            <div className="pec-block-title">
              <FaShieldAlt className="title-icon" />
              <h3>Assurance de prise en charge du patient</h3>
              <span className="pec-step-badge">Étape 1</span>
            </div>

            {patient.assurances && patient.assurances.length > 0 ? (
              <div className="pec-assurance-grid">
                {patient.assurances.map((aff) => {
                  const isSelected = String(selectedAssuranceId) === String(aff.assuranceId)
                  const assObj = allAssurances.find((a) => a.id === aff.assuranceId)
                  return (
                    <div
                      key={aff.assuranceId}
                      className={`pec-assurance-card ${isSelected ? 'active' : ''}`}
                      onClick={() => handleAssuranceChange(aff.assuranceId)}
                    >
                      <div className="pec-assurance-radio">
                        <input
                          type="radio"
                          id={`ass-${aff.assuranceId}`}
                          name="patientAssurance"
                          checked={isSelected}
                          onChange={() => handleAssuranceChange(aff.assuranceId)}
                        />
                      </div>
                      <div className="pec-assurance-info">
                        <strong>{aff.libelle}</strong>
                        {aff.garantLibelle && (
                          <div className="pec-garant-tag" style={{ fontSize: '0.8rem', color: '#1e40af', fontWeight: 600, marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <FaHandshake style={{ color: '#2563eb' }} />
                            <span>Garant : {aff.garantLibelle}</span>
                          </div>
                        )}
                        <div className="pec-matricule-info">
                          Matricule : <code>{aff.numeroMatricule || 'Non renseigné'}</code>
                        </div>
                        {assObj && (
                          <div className="pec-tarifs-mini">
                            {assObj.prixConsultationGeneraliste != null && (
                              <span title="Tarif consultation généraliste">
                                Gén: {Number(assObj.prixConsultationGeneraliste).toLocaleString('fr-FR')} F
                              </span>
                            )}
                            {assObj.prixConsultationSpecialiste != null && (
                              <span title="Tarif consultation spécialiste">
                                Spéc: {Number(assObj.prixConsultationSpecialiste).toLocaleString('fr-FR')} F
                              </span>
                            )}
                            {assObj.coutB != null && (
                              <span title="Coût de la lettre-clé B (Laboratoire)">
                                B: {assObj.coutB} F
                              </span>
                            )}
                            {assObj.coutZ != null && (
                              <span title="Coût de la lettre-clé Z (Radiologie)">
                                Z: {assObj.coutZ} F
                              </span>
                            )}
                            {assObj.coutK != null && (
                              <span title="Coût de la lettre-clé K (Chirurgie)">
                                K: {assObj.coutK} F
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      {isSelected && <span className="pec-selected-pill">Sélectionnée</span>}
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="pec-no-patient-assurance">
                <FaInfoCircle /> Ce patient n'a pas d'assurance affiliée dans son dossier. Vous pouvez sélectionner une assurance dans la liste ci-dessous.
                <div style={{ marginTop: 10 }}>
                  <select
                    value={selectedAssuranceId}
                    onChange={(e) => handleAssuranceChange(e.target.value)}
                    className="pec-select-inline"
                  >
                    <option value="">-- Sélectionner une assurance --</option>
                    {allAssurances.map((ass) => (
                      <option key={ass.id} value={ass.id}>
                        {ass.libelle}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* 3. TYPE DE COUVERTURE : POURCENTAGE OU FORFAIT */}
        <section className="management-section pec-coverage-section">
          <div className="pec-block-title">
            <FaCalculator className="title-icon" />
            <h3>Paramétrage du type de couverture</h3>
            <span className="pec-step-badge">Étape 2</span>
          </div>

          <div className="pec-coverage-modes">
            <button
              type="button"
              className={`pec-mode-btn ${typeCouverture === 'POURCENTAGE' ? 'active' : ''}`}
              onClick={() => handleTypeCouvertureChange('POURCENTAGE')}
            >
              <FaPercent className="mode-icon" />
              <div className="mode-text">
                <strong>Couverture en Pourcentage (%)</strong>
                <span>
                  Calcul proportionnel par acte (taux par défaut ou individualisé par examen)
                </span>
              </div>
              {typeCouverture === 'POURCENTAGE' && <span className="mode-check">✓ Actif</span>}
            </button>

            <button
              type="button"
              className={`pec-mode-btn ${typeCouverture === 'FORFAIT' ? 'active' : ''}`}
              onClick={() => handleTypeCouvertureChange('FORFAIT')}
            >
              <FaMoneyBillWave className="mode-icon" />
              <div className="mode-text">
                <strong>Couverture au Forfait (FCFA)</strong>
                <span>
                  Prise en charge forfaitaire globale ou personnalisable par acte
                </span>
              </div>
              {typeCouverture === 'FORFAIT' && <span className="mode-check">✓ Actif</span>}
            </button>
          </div>

          {/* REGLAGE SPECIFIQUE DU MODE CHOISI */}
          <div className="pec-coverage-settings">
            {typeCouverture === 'POURCENTAGE' ? (
              <div className="pec-setting-card percentage-card">
                <label htmlFor="pec-global-taux">
                  <strong>Taux de couverture global de l'assurance (%) :</strong>
                </label>
                <div className="pec-taux-input-group">
                  <input
                    id="pec-global-taux"
                    type="number"
                    min="0"
                    max="100"
                    value={tauxCouvertureGlobal}
                    onChange={(e) => handleGlobalTauxChange(e.target.value)}
                    className="pec-taux-input"
                  />
                  <span className="taux-symbol">%</span>
                  <div className="pec-quick-taux">
                    {[100, 80, 75, 70, 50].map((t) => (
                      <button
                        key={t}
                        type="button"
                        className={`quick-taux-btn ${tauxCouvertureGlobal === t ? 'active' : ''}`}
                        onClick={() => handleGlobalTauxChange(t)}
                      >
                        {t}%
                      </button>
                    ))}
                  </div>
                </div>
                <p className="pec-setting-hint">
                  💡 Chaque acte dans le panier recevra ce taux de couverture (80% par défaut),
                  ajustable à tout moment.
                </p>
              </div>
            ) : (
              <div className="pec-setting-card forfait-card">
                <label htmlFor="pec-forfait-input">
                  <strong>Montant du Forfait pris en charge par l'assurance (FCFA) :</strong>
                </label>
                <div className="pec-forfait-input-group">
                  <input
                    id="pec-forfait-input"
                    type="number"
                    min="0"
                    step="1000"
                    placeholder="Ex: 50 000"
                    value={montantForfait}
                    onChange={(e) => setMontantForfait(e.target.value)}
                    className="pec-forfait-input"
                  />
                  <span className="currency-symbol">FCFA</span>
                </div>
                <p className="pec-setting-hint">
                  💡 Règle appliquée : Le total brut de tous les actes est calculé avec un taux de 0%,
                  puis le forfait est déduit du total pour obtenir la part assurance et le reste à
                  charge patient.
                </p>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* 4. PANIER À ACTES & SÉLECTION D'ACTES */}
      <section className="management-section pec-cart-section">
        <div className="pec-block-title">
          <FaShoppingCart className="title-icon" />
          <h3>Panier des actes médicaux & soins</h3>
          <span className="pec-step-badge">Étape 3</span>
        </div>

        <div className="pec-actes-layout">
          {/* CATALOGUE D'AJOUT RAPIDE */}
          <div className="pec-catalog-panel">
            <div className="pec-catalog-header">
              <h4>Catalogue des Actes Médicaux</h4>
              <button
                type="button"
                className="pec-custom-act-btn pec-manage-actes-btn"
                onClick={() => setIsGestionActesOpen(true)}
                title="Ouvrir la gestion et la tarification des actes"
              >
                <FaCogs /> Gérer les actes
              </button>
            </div>

            {/* Barre de recherche d'actes */}
            <div className="pec-catalog-search">
              <FaSearch className="search-icon" />
              <input
                type="text"
                placeholder="Rechercher un acte (analyse, radio, consultation...)"
                value={actSearch}
                onChange={(e) => setActSearch(e.target.value)}
              />
              {actSearch && (
                <button
                  type="button"
                  className="search-clear-btn"
                  onClick={() => setActSearch('')}
                >
                  <FaTimes />
                </button>
              )}
            </div>

            {/* Filtres de catégorie */}
            <div className="pec-catalog-tabs">
              {[
                { id: 'ALL', label: 'Tous' },
                { id: 'LABO', label: 'Laboratoire' },
                { id: 'RADIO', label: 'Radiologie' },
                { id: 'CONSULTATION', label: 'Consultations' },
                { id: 'CHIRURGIE', label: 'Chirurgie' },
                { id: 'AUTRES', label: 'Autres' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  className={`catalog-tab-btn ${selectedCategory === tab.id ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Liste scrollable des actes disponibles */}
            <div className="pec-actes-list">
              {filteredActes.length === 0 ? (
                <div className="pec-actes-empty">
                  Aucun acte trouvé dans cette catégorie pour la recherche.
                </div>
              ) : (
                filteredActes.map((act) => {
                  const tarif = computeActTarification(act, currentAssurance)
                  const isInCart = cart.some((it) => !it.isCustom && it.actId === act.id)
                  return (
                    <div
                      key={act.id}
                      className={`pec-act-item ${isInCart ? 'already-in-cart' : ''}`}
                      onClick={() => {
                        if (!isInCart) addToCart(act)
                      }}
                      title={
                        isInCart
                          ? 'Cet acte est déjà présent dans le panier'
                          : 'Cliquer pour ajouter au panier'
                      }
                    >
                      <div className="pec-act-item-left">
                        <span className="pec-act-title">{act.libelle}</span>
                        <div className="pec-act-tags">
                          <span className="pec-act-category">
                            {act.actType?.libelle || act.actType?.code}
                          </span>
                          {act.coefficientB && (
                            <span className="pec-coeff-tag">B {act.coefficientB}</span>
                          )}
                          {act.coefficientZ && (
                            <span className="pec-coeff-tag">Z {act.coefficientZ}</span>
                          )}
                          {act.coefficientK && (
                            <span className="pec-coeff-tag">K {act.coefficientK}</span>
                          )}
                          {act.typeConsultation && (
                            <span className="pec-coeff-tag">{act.typeConsultation}</span>
                          )}
                          {tarif.formula && (
                            <span className="pec-formula-tag">{tarif.formula}</span>
                          )}
                          {isInCart && (
                            <span className="pec-in-cart-tag">
                              <FaCheck /> Déjà ajouté
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="pec-act-item-right">
                        <span className="pec-act-price">{formatPrice(tarif.price)}</span>
                        <button
                          type="button"
                          className={`pec-add-btn ${isInCart ? 'in-cart disabled' : ''}`}
                          disabled={isInCart}
                          title={isInCart ? 'Déjà ajouté au panier' : 'Ajouter au panier'}
                          onClick={(e) => {
                            e.stopPropagation()
                            if (!isInCart) addToCart(act)
                          }}
                        >
                          {isInCart ? <FaCheck /> : <FaPlus />}
                        </button>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* TABLEAU DU PANIER */}
          <div className="pec-cart-table-panel">
            <div className="pec-cart-header">
              <div className="pec-cart-title-group">
                <h4>Panier Actuel</h4>
                <span className="cart-count-pill">
                  {cart.length} acte{cart.length > 1 ? 's' : ''}
                </span>
              </div>
              {cart.length > 0 && (
                <button type="button" className="pec-clear-btn" onClick={clearCart}>
                  <FaTrash /> Vider le panier
                </button>
              )}
            </div>

            <div className="data-table-wrapper pec-cart-wrapper">
              <table className="data-table pec-cart-table">
                <thead>
                  <tr>
                    <th>Acte médical</th>
                    <th>Catégorie</th>
                    <th style={{ width: 125 }}>Prix unit.</th>
                    <th style={{ width: 130 }}>Type PEC</th>
                    <th style={{ width: 130 }}>Taux / Forfait</th>
                    <th className="th-assurance">Part Assurance</th>
                    <th className="th-patient">Part Patient</th>
                    <th style={{ width: 44 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {calculations.items.length === 0 ? (
                    <tr className="empty-row">
                      <td colSpan={8}>
                        <div className="empty-cart-state">
                          <FaShoppingCart className="empty-cart-icon" />
                          <strong>Le panier à actes est vide</strong>
                          <p>
                            Cliquez sur un acte dans le catalogue à gauche ou utilisez le bouton
                            "Gérer les actes" pour configurer le catalogue.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    calculations.categorySubtotals.map((catGroup) => (
                      <Fragment key={catGroup.category}>
                        {/* EN-TÊTE DU GROUPE DE CATÉGORIE */}
                        <tr className="pec-cart-category-header">
                          <td colSpan={8}>
                            <div className="cat-header-content">
                              <div className="cat-header-left">
                                <span className="cat-header-name">{catGroup.category}</span>
                                <span className="cat-header-badge">
                                  {catGroup.count} acte{catGroup.count > 1 ? 's' : ''}
                                </span>
                              </div>
                              {catGroup.items.some(
                                (it) => it.coefficientB != null && Number(it.coefficientB) > 0
                              ) && (
                                <div
                                  className="cat-header-rate-tools"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <span className="cat-rate-title">Coût du B :</span>
                                  <input
                                    type="number"
                                    min="0"
                                    placeholder="0"
                                    value={
                                      catGroup.items.find(
                                        (it) =>
                                          it.coefficientB != null &&
                                          it.coutB !== '' &&
                                          it.coutB != null
                                      )?.coutB ?? ''
                                    }
                                    onChange={(e) =>
                                      applyCategoryCoutB(catGroup.category, e.target.value)
                                    }
                                    className="cat-rate-input"
                                    title="Modifier le Coût du B pour tous les actes de cette catégorie"
                                  />
                                  <span className="cat-rate-unit">FCFA</span>
                                  <span className="cat-rate-hint">(groupe)</span>
                                </div>
                              )}
                              {catGroup.items.some(
                                (it) => it.coefficientZ != null && Number(it.coefficientZ) > 0
                              ) && (
                                <div
                                  className="cat-header-rate-tools"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <span className="cat-rate-title">Coût du Z :</span>
                                  <input
                                    type="number"
                                    min="0"
                                    placeholder="0"
                                    value={
                                      catGroup.items.find(
                                        (it) =>
                                          it.coefficientZ != null &&
                                          it.coutZ !== '' &&
                                          it.coutZ != null
                                      )?.coutZ ?? ''
                                    }
                                    onChange={(e) =>
                                      applyCategoryCoutZ(catGroup.category, e.target.value)
                                    }
                                    className="cat-rate-input"
                                    title="Modifier le Coût du Z pour tous les actes de cette catégorie"
                                  />
                                  <span className="cat-rate-unit">FCFA</span>
                                  <span className="cat-rate-hint">(groupe)</span>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>

                        {/* ACTES DU GROUPE */}
                        {catGroup.items.map((item) => (
                          <tr key={item.id} className="pec-cart-item-row">
                            <td>
                              <div className="cart-item-info">
                                <strong className="cart-act-name">{item.libelle}</strong>
                                <div className="cart-item-subtags">
                                  {item.coefficientB != null && Number(item.coefficientB) > 0 ? (
                                    <div
                                      className="cart-rate-edit-wrapper"
                                      title="Modifier le Coût du B pour cet acte"
                                    >
                                      <span className="cart-coeff-badge coeff-b">
                                        B {item.coefficientB}
                                      </span>
                                      <span className="cart-rate-times">×</span>
                                      <div className="cart-rate-box">
                                        <span className="cart-rate-lbl">Coût B :</span>
                                        <input
                                          type="number"
                                          min="0"
                                          value={
                                            item.coutB !== null && item.coutB !== undefined
                                              ? item.coutB
                                              : ''
                                          }
                                          onChange={(e) => updateItemCoutB(item.id, e.target.value)}
                                          className="cart-inline-rate-input"
                                          placeholder="0"
                                        />
                                        <span className="cart-rate-unit">F</span>
                                      </div>
                                    </div>
                                  ) : item.coefficientZ != null && Number(item.coefficientZ) > 0 ? (
                                    <div
                                      className="cart-rate-edit-wrapper"
                                      title="Modifier le Coût du Z pour cet acte"
                                    >
                                      <span className="cart-coeff-badge coeff-z">
                                        Z {item.coefficientZ}
                                      </span>
                                      <span className="cart-rate-times">×</span>
                                      <div className="cart-rate-box">
                                        <span className="cart-rate-lbl">Coût Z :</span>
                                        <input
                                          type="number"
                                          min="0"
                                          value={
                                            item.coutZ !== null && item.coutZ !== undefined
                                              ? item.coutZ
                                              : ''
                                          }
                                          onChange={(e) => updateItemCoutZ(item.id, e.target.value)}
                                          className="cart-inline-rate-input"
                                          placeholder="0"
                                        />
                                        <span className="cart-rate-unit">F</span>
                                      </div>
                                    </div>
                                  ) : item.coefficientK != null && Number(item.coefficientK) > 0 ? (
                                    <div
                                      className="cart-rate-edit-wrapper"
                                      title="Modifier le Coût du K pour cet acte"
                                    >
                                      <span className="cart-coeff-badge coeff-k">
                                        K {item.coefficientK}
                                      </span>
                                      <span className="cart-rate-times">×</span>
                                      <div className="cart-rate-box">
                                        <span className="cart-rate-lbl">Coût K :</span>
                                        <input
                                          type="number"
                                          min="0"
                                          value={
                                            item.coutK !== null && item.coutK !== undefined
                                              ? item.coutK
                                              : ''
                                          }
                                          onChange={(e) => updateItemCoutK(item.id, e.target.value)}
                                          className="cart-inline-rate-input"
                                          placeholder="0"
                                        />
                                        <span className="cart-rate-unit">F</span>
                                      </div>
                                    </div>
                                  ) : (
                                    <>
                                      {item.coefficientInfo && (
                                        <span className="cart-item-coeff">
                                          {item.coefficientInfo}
                                        </span>
                                      )}
                                      {item.tarifFormula && (
                                        <span className="cart-item-formula">
                                          {item.tarifFormula}
                                        </span>
                                      )}
                                    </>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td>
                              <span className="pec-category-pill">{item.category}</span>
                            </td>
                            <td>
                              <input
                                type="number"
                                min="0"
                                value={item.prixUnitaire}
                                onChange={(e) => updateUnitPrice(item.id, e.target.value)}
                                className="cart-input-price"
                                title="Modifier le prix unitaire si besoin"
                              />
                            </td>
                            <td>
                              <div className="cart-type-toggle">
                                <button
                                  type="button"
                                  className={`cart-type-btn ${item.typeCouverture === 'POURCENTAGE' ? 'active' : ''}`}
                                  onClick={() => updateItemType(item.id, 'POURCENTAGE')}
                                  title="Prise en charge au Pourcentage"
                                >
                                  %
                                </button>
                                <button
                                  type="button"
                                  className={`cart-type-btn ${item.typeCouverture === 'FORFAIT' ? 'active' : ''}`}
                                  onClick={() => updateItemType(item.id, 'FORFAIT')}
                                  title="Prise en charge au Forfait"
                                >
                                  Forfait
                                </button>
                              </div>
                            </td>
                            <td>
                              {item.typeCouverture === 'POURCENTAGE' ? (
                                <div className="cart-val-group">
                                  <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={
                                      item.tauxCouverture != null
                                        ? item.tauxCouverture
                                        : tauxCouvertureGlobal
                                    }
                                    onChange={(e) => updateItemTaux(item.id, e.target.value)}
                                    className="cart-input-taux"
                                    title="Taux de couverture %"
                                  />
                                  <span className="cart-unit-label">%</span>
                                </div>
                              ) : (
                                <div className="cart-val-group">
                                  <input
                                    type="number"
                                    min="0"
                                    step="500"
                                    placeholder="0"
                                    value={item.montantForfait != null ? item.montantForfait : ''}
                                    onChange={(e) => updateItemForfait(item.id, e.target.value)}
                                    className="cart-input-forfait"
                                    title="Montant forfaitaire couvert par l'assurance pour cet acte"
                                  />
                                  <span className="cart-unit-label">F</span>
                                </div>
                              )}
                            </td>
                            <td className="td-assurance">
                              <span className="assurance-amount">
                                {formatPrice(item.partAssuranceLigne)}
                              </span>
                            </td>
                            <td className="td-patient">
                              <span className="patient-amount">
                                {formatPrice(item.partPatientLigne)}
                              </span>
                            </td>
                            <td>
                              <button
                                type="button"
                                className="cart-delete-btn"
                                onClick={() => removeFromCart(item.id)}
                                title="Retirer de la prise en charge"
                              >
                                <FaTrash />
                              </button>
                            </td>
                          </tr>
                        ))}

                        {/* LIGNE DE SOUS-TOTAL DU TYPE D'ACTE */}
                        <tr className="pec-cart-subtotal-row">
                          <td colSpan={2} className="subtotal-title-cell">
                            <div className="subtotal-header-line">
                              <span className="subtotal-category-label">
                                Sous-total {catGroup.category}
                              </span>
                              {isConsultationCategory(catGroup.category, catGroup.items) ? (
                                <div
                                  className="subtotal-practitioner-control medecin"
                                  title="Médecin qui effectuera la consultation"
                                >
                                  <FaUserMd className="practitioner-icon" />
                                  <span className="practitioner-label">Médecin :</span>
                                  <div className="practitioner-input-wrapper">
                                    <select
                                      value={getPractitionerSelectValue(catGroup.category, medecinsOptions)}
                                      onChange={(e) => {
                                        if (e.target.value === '__NEW__') {
                                          openNewMedecinModal(catGroup.category)
                                        } else {
                                          updateCategoryPractitioner(catGroup.category, e.target.value)
                                        }
                                      }}
                                      className="practitioner-select-input"
                                    >
                                      <option value="">
                                        {medecinsOptions.length === 0
                                          ? 'Aucun médecin enregistré'
                                          : '-- Sélectionner le médecin --'}
                                      </option>
                                      {medecinsOptions.map((m) => (
                                        <option key={m.id} value={m.label}>
                                          {m.label}
                                        </option>
                                      ))}
                                      {categoryPractitioners[catGroup.category] &&
                                        !medecinsOptions.some(
                                          (o) =>
                                            o.label ===
                                            getPractitionerSelectValue(
                                              catGroup.category,
                                              medecinsOptions
                                            )
                                        ) && (
                                          <option
                                            value={getPractitionerSelectValue(
                                              catGroup.category,
                                              medecinsOptions
                                            )}
                                          >
                                            {getPractitionerSelectValue(
                                              catGroup.category,
                                              medecinsOptions
                                            )}
                                          </option>
                                        )}
                                    </select>
                                    <button
                                      type="button"
                                      className="practitioner-add-btn"
                                      onClick={() => openNewMedecinModal(catGroup.category)}
                                      title="Créer un nouveau médecin"
                                      aria-label="Créer un nouveau médecin"
                                    >
                                      <FaPlus />
                                    </button>
                                    {categoryPractitioners[catGroup.category] && (
                                      <button
                                        type="button"
                                        className="practitioner-clear-btn"
                                        onClick={() =>
                                          updateCategoryPractitioner(catGroup.category, '')
                                        }
                                        title="Effacer le médecin"
                                      >
                                        <FaTimes />
                                      </button>
                                    )}
                                  </div>
                                </div>
                              ) : isPrescriptionCategory(catGroup.category, catGroup.items) ? (
                                <div
                                  className="subtotal-practitioner-control prescripteur"
                                  title="Prescripteur des analyses / imageries (radio, scanner, échographie)"
                                >
                                  <FaUserTie className="practitioner-icon" />
                                  <span className="practitioner-label">Prescripteur :</span>
                                  <div className="practitioner-input-wrapper">
                                    <select
                                      value={getPractitionerSelectValue(catGroup.category, prescripteursOptions)}
                                      onChange={(e) => {
                                        if (e.target.value === '__NEW__') {
                                          openNewMedecinModal(catGroup.category)
                                        } else {
                                          updateCategoryPractitioner(catGroup.category, e.target.value)
                                        }
                                      }}
                                      className="practitioner-select-input"
                                    >
                                      <option value="">
                                        {prescripteursOptions.length === 0
                                          ? 'Aucun prescripteur enregistré'
                                          : '-- Sélectionner le prescripteur --'}
                                      </option>
                                      {prescripteursOptions.map((p) => (
                                        <option key={p.id} value={p.label}>
                                          {p.label}
                                        </option>
                                      ))}
                                      {categoryPractitioners[catGroup.category] &&
                                        !prescripteursOptions.some(
                                          (o) =>
                                            o.label ===
                                            getPractitionerSelectValue(
                                              catGroup.category,
                                              prescripteursOptions
                                            )
                                        ) && (
                                          <option
                                            value={getPractitionerSelectValue(
                                              catGroup.category,
                                              prescripteursOptions
                                            )}
                                          >
                                            {getPractitionerSelectValue(
                                              catGroup.category,
                                              prescripteursOptions
                                            )}
                                          </option>
                                        )}
                                    </select>
                                    <button
                                      type="button"
                                      className="practitioner-add-btn"
                                      onClick={() => openNewMedecinModal(catGroup.category)}
                                      title="Créer un nouveau prescripteur / médecin"
                                      aria-label="Créer un nouveau prescripteur"
                                    >
                                      <FaPlus />
                                    </button>
                                    {categoryPractitioners[catGroup.category] && (
                                      <button
                                        type="button"
                                        className="practitioner-clear-btn"
                                        onClick={() =>
                                          updateCategoryPractitioner(catGroup.category, '')
                                        }
                                        title="Effacer le prescripteur"
                                      >
                                        <FaTimes />
                                      </button>
                                    )}
                                  </div>
                                </div>
                              ) : (
                                <div
                                  className="subtotal-practitioner-control generic"
                                  title="Praticien / Intervenant responsable"
                                >
                                  <FaUserMd className="practitioner-icon" />
                                  <span className="practitioner-label">Praticien :</span>
                                  <div className="practitioner-input-wrapper">
                                    <select
                                      value={getPractitionerSelectValue(catGroup.category, medecinsOptions)}
                                      onChange={(e) => {
                                        if (e.target.value === '__NEW__') {
                                          openNewMedecinModal(catGroup.category)
                                        } else {
                                          updateCategoryPractitioner(catGroup.category, e.target.value)
                                        }
                                      }}
                                      className="practitioner-select-input"
                                    >
                                      <option value="">
                                        {medecinsOptions.length === 0
                                          ? 'Aucun praticien enregistré'
                                          : '-- Sélectionner le praticien --'}
                                      </option>
                                      {medecinsOptions.map((m) => (
                                        <option key={m.id} value={m.label}>
                                          {m.label}
                                        </option>
                                      ))}
                                      {categoryPractitioners[catGroup.category] &&
                                        !medecinsOptions.some(
                                          (o) =>
                                            o.label ===
                                            getPractitionerSelectValue(
                                              catGroup.category,
                                              medecinsOptions
                                            )
                                        ) && (
                                          <option
                                            value={getPractitionerSelectValue(
                                              catGroup.category,
                                              medecinsOptions
                                            )}
                                          >
                                            {getPractitionerSelectValue(
                                              catGroup.category,
                                              medecinsOptions
                                            )}
                                          </option>
                                        )}
                                    </select>
                                    <button
                                      type="button"
                                      className="practitioner-add-btn"
                                      onClick={() => openNewMedecinModal(catGroup.category)}
                                      title="Créer un nouveau praticien"
                                      aria-label="Créer un nouveau praticien"
                                    >
                                      <FaPlus />
                                    </button>
                                    {categoryPractitioners[catGroup.category] && (
                                      <button
                                        type="button"
                                        className="practitioner-clear-btn"
                                        onClick={() =>
                                          updateCategoryPractitioner(catGroup.category, '')
                                        }
                                        title="Effacer"
                                      >
                                        <FaTimes />
                                      </button>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="subtotal-brut-cell">
                            <strong>{formatPrice(catGroup.totalBrut)}</strong>
                          </td>
                          <td colSpan={2} className="subtotal-count-cell">
                            {catGroup.count} acte{catGroup.count > 1 ? 's' : ''}
                          </td>
                          <td className="subtotal-assurance-cell td-assurance">
                            <strong>{formatPrice(catGroup.totalPartAssurance)}</strong>
                          </td>
                          <td className="subtotal-patient-cell td-patient">
                            <strong>{formatPrice(catGroup.totalPartPatient)}</strong>
                          </td>
                          <td></td>
                        </tr>
                      </Fragment>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* BARRE RÉCAPITULATIVE DES SOUS-TOTAUX PAR TYPE D'ACTE */}
            {calculations.categorySubtotals.length > 0 && (
              <div className="pec-subtotals-summary">
                <div className="pec-subtotals-title">
                  <h5>Sous-totaux par type d'acte :</h5>
                </div>
                <div className="pec-subtotals-chips">
                  {calculations.categorySubtotals.map((cat) => (
                    <div key={cat.category} className="pec-subtotal-chip">
                      <span className="chip-cat">{cat.category} ({cat.count})</span>
                      <span className="chip-divider">•</span>
                      <span className="chip-brut">Brut: {formatPrice(cat.totalBrut)}</span>
                      <span className="chip-divider">•</span>
                      <span className="chip-ass text-assurance">Ass: {formatPrice(cat.totalPartAssurance)}</span>
                      <span className="chip-divider">•</span>
                      <span className="chip-pat text-patient">Pat: {formatPrice(cat.totalPartPatient)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 5. EN BAS : BLOC TOTALISATION & VALIDATION */}
      <section className="management-section pec-totals-section">
        <div className="pec-block-title">
          <FaFileInvoiceDollar className="title-icon" />
          <h3>Synthèse Financière</h3>
          <span className="pec-step-badge">Étape 4</span>
        </div>

        {/* 3 GRANDES CARTES DE SYNTHÈSE */}
        <div className="pec-summary-cards">
          <div className="pec-summary-card card-total">
            <span className="card-label">MONTANT TOTAL BRUT DES ACTES</span>
            <span className="card-value">{formatPrice(calculations.totalBrut)}</span>
            <span className="card-desc">{cart.length} acte(s) dans le devis</span>
          </div>

          <div className="pec-summary-card card-assurance">
            <span className="card-label">
              PART PRISE EN CHARGE ASSURANCE{' '}
              {typeCouverture === 'POURCENTAGE' ? `(${tauxCouvertureGlobal}%)` : '(FORFAIT)'}
            </span>
            <span className="card-value">{formatPrice(calculations.totalPartAssurance)}</span>
            <span className="card-desc">
              {currentAssurance ? currentAssurance.libelle : 'Tarif direct'}
              {currentMatricule ? ` — Matr: ${currentMatricule}` : ''}
            </span>
          </div>

          <div className="pec-summary-card card-patient">
            <span className="card-label">PART RESTANTE PATIENT (TICKET MODÉRATEUR)</span>
            <span className="card-value">{formatPrice(calculations.totalPartPatient)}</span>
            <span className="card-desc">Montant net à régler par le patient</span>
          </div>
        </div>

        {/* VALIDATION / BOUTON ENREGISTRER */}
        <div className="pec-validation-container">
          {errorMessage && <div className="form-error-banner">{errorMessage}</div>}
          {successMessage && (
            <div className="form-success-banner">
              <FaCheckCircle /> {successMessage}
            </div>
          )}
          {lastVisite && (
            <div className="pec-visite-banner">
              <div className="pec-visite-header-row">
                <div className="pec-visite-numero">
                  <span className="pec-visite-label">N° Dossier :</span>
                  <span className="pec-visite-dossier-value">
                    {patient.numeroDossier || lastVisite.patientNumeroDossier || `DP-${String(patient.id || 1).padStart(7, '0')}`}
                  </span>
                </div>
                <div className="pec-visite-numero">
                  <span className="pec-visite-label">N° Visite :</span>
                  <span className="pec-visite-value">{lastVisite.numeroVisite}</span>
                </div>
              </div>

              {lastVisite.sousFactures && lastVisite.sousFactures.length > 0 && (
                <div className="pec-sousfactures-list">
                  <span className="pec-visite-label">Sous-factures :</span>
                  {lastVisite.sousFactures.map((sf) => (
                    <span key={sf.id || sf.numeroSousFacture} className="pec-sousfacture-chip">
                      <strong>{sf.codeCategorie}</strong> — {sf.numeroSousFacture}
                    </span>
                  ))}
                </div>
              )}

              <div className="pec-visite-banner-actions">
                <button
                  type="button"
                  className="pec-banner-btn pec-banner-btn-back"
                  onClick={onBack}
                >
                  <FaArrowLeft /> {editingVisite ? 'Retour à la liste des visites' : 'Retour à la liste des patients'}
                </button>
                <button
                  type="button"
                  className="pec-banner-btn pec-banner-btn-visites"
                  onClick={() => setIsVisitesModalOpen(true)}
                >
                  <FaListUl /> Afficher les visites
                </button>
              </div>
            </div>
          )}

          <div className="pec-form-actions">
            <button
              type="button"
              className="pec-submit-btn"
              disabled={submitting || cart.length === 0}
              onClick={() => { setLastVisite(null); setSuccessMessage(null); handleSavePriseEnCharge() }}
            >
              <FaCheckCircle />{' '}
              {submitting
                ? 'Enregistrement en cours...'
                : editingVisite
                  ? 'Enregistrer les modifications'
                  : 'Enregistrer'}
            </button>
          </div>
        </div>
      </section>

      {/* MODALE D'ACTE PERSONNALISÉ */}
      {isCustomActOpen && (
        <Modal
          title="Ajouter un acte médical personnalisé"
          onClose={() => setIsCustomActOpen(false)}
          size="medium"
        >
          <form onSubmit={handleAddCustomAct}>
            <div className="form-grid">
              <div className="form-field full-width">
                <label htmlFor="custom-act-name">Nom de l'acte / examen *</label>
                <input
                  id="custom-act-name"
                  type="text"
                  value={customActName}
                  onChange={(e) => setCustomActName(e.target.value)}
                  placeholder="Ex: Soin infirmier spécifique, Pansement complexe..."
                  required
                />
              </div>

              <div className="form-field">
                <label htmlFor="custom-act-cat">Catégorie</label>
                <select
                  id="custom-act-cat"
                  value={customActCategory}
                  onChange={(e) => setCustomActCategory(e.target.value)}
                >
                  <option value="LABORATOIRE">Laboratoire</option>
                  <option value="RADIOLOGIE">Radiologie</option>
                  <option value="CONSULTATION">Consultation</option>
                  <option value="CHIRURGIE">Chirurgie</option>
                  <option value="SOINS">Soins infirmiers</option>
                  <option value="AUTRES">Autres actes</option>
                </select>
              </div>

              <div className="form-field">
                <label htmlFor="custom-act-price">Prix unitaire (FCFA) *</label>
                <input
                  id="custom-act-price"
                  type="number"
                  min="0"
                  step="500"
                  value={customActPrice}
                  onChange={(e) => setCustomActPrice(e.target.value)}
                  placeholder="Ex: 15000"
                  required
                />
              </div>
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setIsCustomActOpen(false)}
              >
                Annuler
              </button>
              <button type="submit" className="btn btn-primary">
                Ajouter au panier
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* MODALE D'IMPRESSION DU BON DE PRISE EN CHARGE */}
      {printModalData && (
        <Modal
          title="Bon de Prise en Charge Médicale"
          onClose={() => setPrintModalData(null)}
          size="large"
        >
          <div className="pec-print-wrapper" id="pec-printable-doc">
            <div className="pec-print-header">
              <div className="print-clinic-logo">
                <h2>AlphaMedPro</h2>
                <span>Clinique Médicale & Centre Hospitalier</span>
                <p>Service Facturation & Prises en Charge</p>
              </div>
              <div className="print-doc-meta">
                <h3>BON DE PRISE EN CHARGE</h3>
                <p>
                  <strong>Date & Heure :</strong> {formatDateTime(printModalData.dateDemande)}
                </p>
                <p>
                  <strong>Statut :</strong>{' '}
                  {printModalData.statut === 'ACCEPTEE'
                    ? 'Validée'
                    : printModalData.statut === 'REFUSEE'
                      ? 'Refusée'
                      : 'En attente'}
                </p>
              </div>
            </div>

            <div className="print-info-grid">
              <div className="print-box">
                <h4>DOIT : PATIENT BÉNÉFICIAIRE</h4>
                <p>
                  <strong>Doit :</strong> {printModalData.patient?.prenom}{' '}
                  {printModalData.patient?.nom}
                </p>
                <p>
                  <strong>Code Dossier :</strong> {printModalData.patient?.code || '—'}
                </p>
                <p>
                  <strong>Date de Naissance :</strong>{' '}
                  {formatDate(printModalData.patient?.dateNaissance)}
                </p>
                <p>
                  <strong>Téléphone :</strong> {printModalData.patient?.numeroTelephone || '—'}
                </p>
              </div>

              <div className="print-box">
                <h4>ORGANISME ASSUREUR & COUVERTURE</h4>
                <p>
                  <strong>Assurance :</strong> {printModalData.assuranceLibelle}
                </p>
                {printModalData.garantLibelle && (
                  <p>
                    <strong>Garant Rattaché :</strong> {printModalData.garantLibelle}
                  </p>
                )}
                <p>
                  <strong>N° Matricule Assuré :</strong> {printModalData.matricule || 'Non affilié'}
                </p>
                <p>
                  <strong>Type de Couverture :</strong>{' '}
                  {printModalData.typeCouverture === 'FORFAIT'
                    ? `Forfaitaire (${formatPrice(printModalData.montantForfait)})`
                    : `Pourcentage (${printModalData.tauxCouverture}%)`}
                </p>
                <p>
                  <strong>Motif :</strong> {printModalData.motif}
                </p>
              </div>
            </div>

            <div className="print-table-wrapper">
              <table className="print-table">
                <thead>
                  <tr>
                    <th>Acte médical / Examen</th>
                    <th>Catégorie</th>
                    <th className="text-center">Couverture</th>
                    <th className="text-right">Total Brut</th>
                    <th className="text-right">Part Assurance</th>
                    <th className="text-right">Part Patient</th>
                  </tr>
                </thead>
                <tbody>
                  {printModalData.items.map((it, idx) => {
                    const isForfait = it.typeCouverture === 'FORFAIT'
                    const coverageDisplay = isForfait
                      ? `Forfait (${formatPrice(it.montantForfait || 0)})`
                      : `% (${it.tauxCouverture ?? printModalData.tauxCouverture ?? 80}%)`

                    return (
                      <tr key={idx}>
                        <td>
                          <strong>{it.libelle}</strong>
                          <div className="print-act-subinfo">
                            {it.coefficientInfo && (
                              <span className="cart-item-coeff" style={{ marginRight: 6 }}>
                                {it.coefficientInfo}
                              </span>
                            )}
                            {it.tarifFormula && (
                              <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                                ({it.tarifFormula})
                              </span>
                            )}
                          </div>
                        </td>
                        <td>{it.category}</td>
                        <td className="text-center">
                          <span className="pec-type-badge">{coverageDisplay}</span>
                        </td>
                        <td className="text-right">{formatPrice(it.montantLigne)}</td>
                        <td className="text-right text-assurance">
                          {formatPrice(it.partAssuranceLigne)}
                        </td>
                        <td className="text-right text-patient">
                          {formatPrice(it.partPatientLigne)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
                {printModalData.categorySubtotals && printModalData.categorySubtotals.length > 1 && (
                  <tbody className="print-subtotals-body">
                    <tr className="print-subtotals-divider">
                      <td colSpan={6}>
                        <strong>SOUS-TOTAUX PAR TYPE D'ACTE</strong>
                      </td>
                    </tr>
                    {printModalData.categorySubtotals.map((sub, sIdx) => {
                      const practitioner =
                        sub.practitioner ||
                        (printModalData.categoryPractitioners &&
                          printModalData.categoryPractitioners[sub.category])
                      const isConsult =
                        sub.isConsultation ||
                        isConsultationCategory(sub.category, sub.items)
                      const isPrescr =
                        sub.isPrescription ||
                        isPrescriptionCategory(sub.category, sub.items)

                      return (
                        <tr key={`sub-${sIdx}`} className="print-subtotal-row">
                          <td colSpan={2}>
                            <div className="print-subtotal-label-box">
                              <strong>
                                Sous-total {sub.category} ({sub.count} acte{sub.count > 1 ? 's' : ''})
                              </strong>
                              {practitioner && (
                                <span className="print-subtotal-practitioner-tag">
                                  {isConsult
                                    ? ` — Médecin consultant : ${practitioner}`
                                    : isPrescr
                                      ? ` — Prescripteur : ${practitioner}`
                                      : ` — Praticien : ${practitioner}`}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="text-center">—</td>
                          <td className="text-right">{formatPrice(sub.totalBrut)}</td>
                          <td className="text-right text-assurance">{formatPrice(sub.totalPartAssurance)}</td>
                          <td className="text-right text-patient">{formatPrice(sub.totalPartPatient)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                )}
                <tfoot>
                  <tr className="print-total-row">
                    <td colSpan={3}>
                      <strong>TOTAL GÉNÉRAL</strong>
                    </td>
                    <td className="text-right">
                      <strong>{formatPrice(printModalData.totalBrut)}</strong>
                    </td>
                    <td className="text-right text-assurance">
                      <strong>{formatPrice(printModalData.totalPartAssurance)}</strong>
                    </td>
                    <td className="text-right text-patient">
                      <strong>{formatPrice(printModalData.totalPartPatient)}</strong>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {(() => {
              const practitionersMap = printModalData.categoryPractitioners || {}
              let medecinNom = ''
              let prescripteurNom = ''

              Object.entries(practitionersMap).forEach(([cat, name]) => {
                if (name) {
                  if (isConsultationCategory(cat)) {
                    medecinNom = name
                  } else if (isPrescriptionCategory(cat)) {
                    prescripteurNom = name
                  }
                }
              })

              return (
                <div className="print-signatures">
                  <div className="sig-box">
                    <span>Le Patient / L'Assuré</span>
                    <div className="sig-space"></div>
                  </div>
                  {medecinNom ? (
                    <div className="sig-box">
                      <span>Le Médecin Consultant</span>
                      <strong className="sig-named">{medecinNom}</strong>
                      <div className="sig-space"></div>
                    </div>
                  ) : (
                    <div className="sig-box">
                      <span>Le Praticien / Médecin</span>
                      <div className="sig-space"></div>
                    </div>
                  )}
                  {prescripteurNom ? (
                    <div className="sig-box">
                      <span>Le Prescripteur</span>
                      <strong className="sig-named">{prescripteurNom}</strong>
                      <div className="sig-space"></div>
                    </div>
                  ) : (
                    <div className="sig-box">
                      <span>Le Prescripteur / Intervenant</span>
                      <div className="sig-space"></div>
                    </div>
                  )}
                  <div className="sig-box">
                    <span>Le Responsable Facturation</span>
                    <div className="sig-space"></div>
                  </div>
                </div>
              )
            })()}
          </div>

          <div className="form-actions" style={{ marginTop: 20 }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => window.print()}
            >
              <FaPrint /> Lancer l'impression
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setPrintModalData(null)}
            >
              Fermer
            </button>
          </div>
        </Modal>
      )}

      {/* MODALE DE GESTION DES ACTES */}
      {isGestionActesOpen && (
        <Modal
          title="Gestion du Catalogue des Actes Médicaux & Tarification"
          onClose={handleCloseGestionActes}
          size="xl"
        >
          <div className="pec-gestion-actes-modal-container">
            <GestionActes />
          </div>
        </Modal>
      )}

      {/* MODALE DE CRÉATION RAPIDE D'UN MÉDECIN / PRATICIEN */}
      {isNewMedecinOpen && (
        <Modal
          title="Ajouter un Nouveau Médecin / Praticien"
          onClose={closeNewMedecinModal}
          size="large"
        >
          <MedecinForm
            initialValue={newMedecinInitial}
            onSubmit={handleCreateMedecin}
            onCancel={closeNewMedecinModal}
            submitting={newMedecinSubmitting}
            serverError={newMedecinError}
          />
        </Modal>
      )}

      {/* MODALE DU DOSSIER MÉDICAL & ANTÉCÉDENTS */}
      {isDossierModalOpen && (
        <Modal
          title={`Dossier Médical & Antécédents — ${patient.prenom} ${patient.nom}`}
          onClose={() => setIsDossierModalOpen(false)}
          size="large"
        >
          <DossierPatientModal
            patient={patient}
            onClose={() => setIsDossierModalOpen(false)}
            onDossierUpdated={onPatientUpdated}
          />
        </Modal>
      )}

      {/* MODALE HISTORIQUE DES VISITES DU PATIENT */}
      {isVisitesModalOpen && (
        <VisitesPatientModal
          patient={patient}
          onClose={() => setIsVisitesModalOpen(false)}
          onEditVisite={(visite) => {
            setIsVisitesModalOpen(false)
            loadVisiteData(visite)
          }}
        />
      )}
    </div>
  )
}
