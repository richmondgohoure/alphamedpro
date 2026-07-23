import {
  FaTachometerAlt,
  FaUserInjured,
  FaShieldAlt,
  FaCalendarAlt,
  FaUserMd,
  FaUsers,
  FaFileInvoiceDollar,
  FaPills,
  FaCog,
  FaTimes,
  FaHeartbeat,
} from 'react-icons/fa'
import './Sidebar.css'

const MENU_ITEMS = [
  { key: 'dashboard', label: 'Tableau de bord', icon: FaTachometerAlt },
  { key: 'patients', label: 'Patients', icon: FaUserInjured },
  { key: 'assurances', label: 'Assurances', icon: FaShieldAlt },
  { key: 'rendez-vous', label: 'Rendez-vous', icon: FaCalendarAlt },
  { key: 'medecins', label: 'Médecins', icon: FaUserMd },
  { key: 'personnel', label: 'Personnel', icon: FaUsers },
  { key: 'facturation', label: 'Facturation', icon: FaFileInvoiceDollar },
  { key: 'pharmacie', label: 'Pharmacie', icon: FaPills },
  { key: 'parametres', label: 'Paramètres', icon: FaCog },
]

function Sidebar({ isOpen, onClose, activeKey, onSelect }) {
  return (
    <>
      <div
        className={`sidebar-backdrop ${isOpen ? 'is-visible' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside className={`sidebar ${isOpen ? 'is-open' : ''}`}>
        <div className="sidebar-header">
          <FaHeartbeat className="sidebar-logo" />
          <span className="sidebar-title">AlphaMedPro</span>
          <button
            type="button"
            className="sidebar-close"
            onClick={onClose}
            aria-label="Fermer le menu"
          >
            <FaTimes />
          </button>
        </div>

        <nav className="sidebar-nav">
          {MENU_ITEMS.map(({ key, label, icon: Icon }) => (
            <button
              type="button"
              key={key}
              className={`sidebar-link ${activeKey === key ? 'is-active' : ''}`}
              onClick={() => onSelect(key)}
            >
              <Icon className="sidebar-icon" />
              <span>{label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <span>AlphaMedPro © 2026</span>
        </div>
      </aside>
    </>
  )
}

export default Sidebar
export { MENU_ITEMS }
