import { FaBars, FaHeartbeat, FaSyncAlt, FaCircle } from 'react-icons/fa'
import './TopBar.css'

function TopBar({ onToggleMenu, isMenuOpen, backendStatus, onRefreshBackendStatus, onGoHome }) {
  const getStatusText = () => {
    switch (backendStatus) {
      case 'up':
        return 'Serveur connecté'
      case 'down':
        return 'Serveur hors ligne'
      case 'checking':
        return 'Vérification...'
      default:
        return 'Statut inconnu'
    }
  }

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button
          type="button"
          className={`menu-button ${isMenuOpen ? 'is-active' : ''}`}
          onClick={onToggleMenu}
          aria-label="Ouvrir ou fermer le menu principal"
          aria-expanded={isMenuOpen}
        >
          <div className="menu-icon-bars">
            <FaBars />
          </div>
          <span className="menu-button-text">Menu</span>
        </button>

        <div
          className="topbar-brand"
          onClick={onGoHome}
          role={onGoHome ? 'button' : undefined}
          tabIndex={onGoHome ? 0 : undefined}
          style={onGoHome ? { cursor: 'pointer' } : {}}
          title="Retour au tableau de bord"
        >
          <div className="topbar-logo-badge">
            <FaHeartbeat className="topbar-logo" />
          </div>
          <div className="topbar-brand-info">
            <span className="topbar-brand-title">AlphaMedPro</span>
            <span className="topbar-brand-tag">Clinique Médicale</span>
          </div>
        </div>
      </div>

      <div className="topbar-right">
        <div className={`backend-status status-${backendStatus}`}>
          <span className="status-radar-dot">
            <span className="radar-ping" />
            <FaCircle className="radar-core" />
          </span>
          <span className="status-label">{getStatusText()}</span>
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
      </div>
    </header>
  )
}

export default TopBar
