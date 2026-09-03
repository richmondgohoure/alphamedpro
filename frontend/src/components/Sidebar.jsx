import {
  FaTachometerAlt,
  FaUserInjured,
  FaShieldAlt,
  FaCalendarAlt,
  FaUserMd,
  FaUsers,
  FaFileInvoiceDollar,
  FaPills,
  FaClipboardList,
  FaHospital,
  FaCog,
  FaTimes,
  FaHeartbeat,
  FaChevronRight,
  FaClinicMedical,
  FaCashRegister,
} from 'react-icons/fa'
import './Sidebar.css'

const MENU_CATEGORIES = [
  {
    id: 'general',
    title: 'Général',
    items: ['dashboard'],
  },
  {
    id: 'medical',
    title: 'Soins & Médical',
    items: ['patients', 'assurances', 'actes', 'services', 'rendez-vous', 'medecins'],
  },
  {
    id: 'gestion',
    title: 'Gestion & Logistique',
    items: ['caisse', 'personnel', 'pharmacie'],
  },
  {
    id: 'system',
    title: 'Système',
    items: ['parametres'],
  },
]

const MENU_ITEMS = [
  {
    key: 'dashboard',
    label: 'Tableau de bord',
    icon: FaTachometerAlt,
    category: 'Général',
    description: 'Accueil & vue synthétique',
    status: 'ready',
    badge: 'Accueil',
  },
  {
    key: 'patients',
    label: 'Patients',
    icon: FaUserInjured,
    category: 'Soins & Médical',
    description: 'Dossiers, cartes & affiliations',
    status: 'ready',
    badge: 'Actif',
  },
  {
    key: 'assurances',
    label: 'Assurances',
    icon: FaShieldAlt,
    category: 'Soins & Médical',
    description: 'Grilles tarifaires & garants',
    status: 'ready',
    badge: 'Actif',
  },
  {
    key: 'actes',
    label: 'Gestion des actes',
    icon: FaClipboardList,
    category: 'Soins & Médical',
    description: 'Laboratoire, radiologie & chirurgie',
    status: 'ready',
    badge: 'Actif',
  },
  {
    key: 'services',
    label: 'Services',
    icon: FaHospital,
    category: 'Soins & Médical',
    description: 'Départements & hospitalisation',
    status: 'ready',
    badge: 'Actif',
  },
  {
    key: 'rendez-vous',
    label: 'Rendez-vous',
    icon: FaCalendarAlt,
    category: 'Soins & Médical',
    description: 'Planning & consultations',
    status: 'dev',
    badge: 'Bientôt',
  },
  {
    key: 'medecins',
    label: 'Médecins',
    icon: FaUserMd,
    category: 'Soins & Médical',
    description: 'Praticiens & spécialités',
    status: 'ready',
    badge: 'Actif',
  },
  {
    key: 'caisse',
    label: 'Caisse & Règlements',
    icon: FaCashRegister,
    category: 'Gestion & Logistique',
    description: 'Encaissements, remises & versements',
    status: 'ready',
    badge: 'Actif',
  },
  {
    key: 'personnel',
    label: 'Personnel',
    icon: FaUsers,
    category: 'Gestion & Logistique',
    description: 'Équipes & ressources',
    status: 'dev',
    badge: 'Bientôt',
  },
  {
    key: 'pharmacie',
    label: 'Pharmacie',
    icon: FaPills,
    category: 'Gestion & Logistique',
    description: 'Stocks & ordonnances',
    status: 'dev',
    badge: 'Bientôt',
  },
  {
    key: 'parametres',
    label: 'Paramètres',
    icon: FaCog,
    category: 'Système',
    description: 'Configuration & sécurité',
    status: 'dev',
    badge: 'Bientôt',
  },
]

function Sidebar({ isOpen, onClose, activeKey, onSelect }) {
  const itemsMap = new Map(MENU_ITEMS.map((item) => [item.key, item]))

  return (
    <>
      <div
        className={`sidebar-backdrop ${isOpen ? 'is-visible' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside className={`sidebar ${isOpen ? 'is-open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-brand-wrapper">
            <div className="sidebar-logo-glow">
              <FaHeartbeat className="sidebar-logo" />
            </div>
            <div className="sidebar-brand-text">
              <span className="sidebar-title">AlphaMedPro</span>
              <span className="sidebar-subtitle">
                <FaClinicMedical className="mini-icon" /> Clinique Médicale
              </span>
            </div>
          </div>
          <button
            type="button"
            className="sidebar-close"
            onClick={onClose}
            aria-label="Fermer le menu"
            title="Fermer le menu"
          >
            <FaTimes />
          </button>
        </div>

        <nav className="sidebar-nav">
          {MENU_CATEGORIES.map((cat) => (
            <div key={cat.id} className="sidebar-section">
              <div className="sidebar-section-title">{cat.title}</div>
              <div className="sidebar-section-items">
                {cat.items.map((key) => {
                  const item = itemsMap.get(key)
                  if (!item) return null
                  const { label, icon: Icon, badge, status } = item
                  const isActive = activeKey === key

                  return (
                    <button
                      type="button"
                      key={key}
                      className={`sidebar-link ${isActive ? 'is-active' : ''} ${status === 'ready' ? 'status-ready' : 'status-dev'}`}
                      onClick={() => onSelect(key)}
                    >
                      <div className="sidebar-icon-container">
                        <Icon className="sidebar-icon" />
                      </div>
                      <div className="sidebar-link-content">
                        <span className="sidebar-link-label">{label}</span>
                      </div>
                      {badge && (
                        <span className={`sidebar-item-badge ${status === 'ready' ? 'badge-ready' : 'badge-dev'}`}>
                          {badge}
                        </span>
                      )}
                      <FaChevronRight className="sidebar-link-arrow" />
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-footer-info">
            <span className="pulse-indicator" />
            <div>
              <strong>Système Clinique v1.2</strong>
              <small>AlphaMedPro © 2026</small>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}

export default Sidebar
export { MENU_ITEMS, MENU_CATEGORIES }
