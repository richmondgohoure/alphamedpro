import { FaBars, FaHeartbeat, FaSyncAlt } from 'react-icons/fa'
import './TopBar.css'

function TopBar({ onToggleMenu, isMenuOpen, backendStatus, onRefreshBackendStatus }) {
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
        {onRefreshBackendStatus && (
          <button
            type="button"
            className="backend-status-refresh"
            onClick={onRefreshBackendStatus}
            disabled={backendStatus === 'checking'}
            aria-label="Actualiser la connexion au serveur"
            title="Actualiser la connexion"
          >
            <FaSyncAlt className={backendStatus === 'checking' ? 'spinning' : ''} />
          </button>
        )}
      </div>
    </header>
  )
}

export default TopBar
