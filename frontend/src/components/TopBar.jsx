import { FaBars, FaHeartbeat } from 'react-icons/fa'
import './TopBar.css'

function TopBar({ onToggleMenu, isMenuOpen, backendStatus }) {
  return (
    <header className="topbar">
      <button
        type="button"
        className="menu-button"
        onClick={onToggleMenu}
        aria-label="Ouvrir ou fermer le menu principal"
        aria-expanded={isMenuOpen}
      >
        <FaBars />
        <span>Menu</span>
      </button>

      <div className="topbar-brand">
        <FaHeartbeat className="topbar-logo" />
        <span>AlphaMedPro</span>
      </div>

      <div className={`backend-status status-${backendStatus}`}>
        <span className="status-dot" />
        {backendStatus === 'up' && 'Serveur connecté'}
        {backendStatus === 'down' && 'Serveur hors ligne'}
        {backendStatus === 'checking' && 'Connexion...'}
      </div>
    </header>
  )
}

export default TopBar
