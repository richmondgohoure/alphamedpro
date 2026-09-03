import { useState } from 'react'
import {
  FaHeartbeat,
  FaArrowRight,
  FaShieldAlt,
  FaCheckCircle,
  FaClock,
  FaSearch,
  FaClinicMedical,
  FaTimes,
} from 'react-icons/fa'
import { MENU_ITEMS, MENU_CATEGORIES } from '../components/Sidebar'
import './MainMenu.css'

function MainMenu({ activeKey, onSelect }) {
  const [filterCategory, setFilterCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  const active = MENU_ITEMS.find((item) => item.key === activeKey)
  const isDevModule = active && active.status === 'dev'

  const filteredItems = MENU_ITEMS.filter((item) => {
    // Exclude dashboard itself from the module cards grid so it focuses on actionable clinic modules
    if (item.key === 'dashboard') return false

    const matchesCategory =
      filterCategory === 'all' ||
      (filterCategory === 'medical' && item.category === 'Soins & Médical') ||
      (filterCategory === 'gestion' && item.category === 'Gestion & Logistique') ||
      (filterCategory === 'system' && item.category === 'Système')

    const matchesSearch =
      item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.category && item.category.toLowerCase().includes(searchQuery.toLowerCase()))

    return matchesCategory && matchesSearch
  })

  const readyCount = MENU_ITEMS.filter((i) => i.status === 'ready' && i.key !== 'dashboard').length
  const totalModulesCount = MENU_ITEMS.filter((i) => i.key !== 'dashboard').length

  return (
    <main className="main-menu">
      {/* Hero Header */}
      <section className="hero-banner">
        <div className="hero-backdrop-glow" />
        <div className="hero-content">
          <div className="hero-badge">
            <FaClinicMedical className="badge-icon" />
            <span>Portail Clinique & Médical</span>
          </div>
          <h1 className="hero-title">
            Bienvenue sur <span className="highlight-text">AlphaMedPro</span>
          </h1>
          <p className="hero-description">
            Système unifié de gestion hospitalière : fiches patients, tarification des actes,
            conventions d'assurance et coordination des soins cliniques.
          </p>

          <div className="hero-pills-row">
            <div className="hero-pill">
              <span className="pill-dot active-dot" />
              <strong>{readyCount} Modules Actifs</strong>
            </div>
            <div className="hero-pill">
              <FaShieldAlt className="pill-icon" />
              <span>Conformité & Données Sécurisées</span>
            </div>
            <div className="hero-pill">
              <FaHeartbeat className="pill-icon" />
              <span>Soins de Santé Connectés</span>
            </div>
          </div>
        </div>
      </section>

      {/* Development Notice Banner when a dev module is active */}
      {isDevModule && (
        <section className="dev-module-banner">
          <div className="dev-banner-icon-wrap">
            <active.icon className="dev-banner-icon" />
          </div>
          <div className="dev-banner-text">
            <div className="dev-banner-header">
              <span className="dev-tag">
                <FaClock /> En cours de finalisation
              </span>
              <h2>Module : {active.label}</h2>
            </div>
            <p>
              Ce module fait partie de la prochaine vague de déploiement d'AlphaMedPro. Les
              fonctionnalités de gestion associées seront activées très prochainement.
            </p>
          </div>
          <button
            type="button"
            className="dev-banner-close-btn"
            onClick={() => onSelect('dashboard')}
            title="Retourner à l'accueil"
          >
            Voir les modules disponibles
          </button>
        </section>
      )}

      {/* Explorer / Filter Bar */}
      <section className="modules-explorer-section">
        <div className="explorer-header">
          <div className="explorer-title-group">
            <h2>Modules & Services Cliniques</h2>
            <p>Sélectionnez un espace de travail pour démarrer vos opérations</p>
          </div>

          <div className="explorer-controls">
            {/* Search Input */}
            <div className="explorer-search">
              <FaSearch className="search-icon" />
              <input
                type="text"
                placeholder="Rechercher un module..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  type="button"
                  className="search-clear"
                  onClick={() => setSearchQuery('')}
                  title="Effacer"
                >
                  <FaTimes />
                </button>
              )}
            </div>

            {/* Filter Tabs */}
            <div className="category-tabs">
              <button
                type="button"
                className={`category-tab ${filterCategory === 'all' ? 'is-active' : ''}`}
                onClick={() => setFilterCategory('all')}
              >
                Tous ({totalModulesCount})
              </button>
              <button
                type="button"
                className={`category-tab ${filterCategory === 'medical' ? 'is-active' : ''}`}
                onClick={() => setFilterCategory('medical')}
              >
                Soins & Médical
              </button>
              <button
                type="button"
                className={`category-tab ${filterCategory === 'gestion' ? 'is-active' : ''}`}
                onClick={() => setFilterCategory('gestion')}
              >
                Gestion & Finance
              </button>
              <button
                type="button"
                className={`category-tab ${filterCategory === 'system' ? 'is-active' : ''}`}
                onClick={() => setFilterCategory('system')}
              >
                Système
              </button>
            </div>
          </div>
        </div>

        {/* Modules Cards Grid */}
        <div className="modules-grid">
          {filteredItems.map(({ key, label, icon: Icon, description, category, status, badge }) => {
            const isReady = status === 'ready'
            const isCardActive = activeKey === key

            return (
              <div
                key={key}
                className={`module-glass-card ${isCardActive ? 'is-active' : ''} ${isReady ? 'is-ready' : 'is-dev'}`}
                onClick={() => onSelect(key)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    onSelect(key)
                  }
                }}
              >
                <div className="card-top-row">
                  <div className="card-icon-halo">
                    <Icon className="card-icon" />
                  </div>
                  <span className={`card-status-pill ${isReady ? 'status-pill-ready' : 'status-pill-dev'}`}>
                    {isReady ? (
                      <>
                        <span className="mini-led-ready" /> {badge || 'Disponible'}
                      </>
                    ) : (
                      <>
                        <FaClock className="mini-clock" /> {badge || 'Bientôt'}
                      </>
                    )}
                  </span>
                </div>

                <div className="card-body">
                  <span className="card-category-tag">{category}</span>
                  <h3 className="card-title">{label}</h3>
                  <p className="card-description">{description}</p>
                </div>

                <div className="card-footer">
                  <span className="card-action-label">
                    {isReady ? 'Accéder au module' : 'En savoir plus'}
                  </span>
                  <span className="card-action-icon-wrap">
                    <FaArrowRight className="card-action-icon" />
                  </span>
                </div>
              </div>
            )
          })}
        </div>

        {filteredItems.length === 0 && (
          <div className="no-modules-found">
            <p>Aucun module ne correspond à votre recherche "{searchQuery}".</p>
            <button
              type="button"
              className="reset-search-btn"
              onClick={() => {
                setSearchQuery('')
                setFilterCategory('all')
              }}
            >
              Réinitialiser les filtres
            </button>
          </div>
        )}
      </section>
    </main>
  )
}

export default MainMenu
