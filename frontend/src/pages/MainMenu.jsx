import { MENU_ITEMS } from '../components/Sidebar'
import './MainMenu.css'

function MainMenu({ activeKey, onSelect }) {
  const active = MENU_ITEMS.find((item) => item.key === activeKey)

  return (
    <main className="main-menu">
      <section className="hero">
        <div className="hero-text">
          <h1>Bienvenue sur AlphaMedPro</h1>
          <p>Le système de gestion de votre clinique médicale : simple, rapide et fiable.</p>
        </div>
      </section>

      {active && active.key !== 'dashboard' && (
        <section className="module-banner">
          <active.icon className="module-banner-icon" />
          <div>
            <h2>{active.label}</h2>
            <p>Ce module est en cours de développement.</p>
          </div>
        </section>
      )}

      <section className="module-grid">
        {MENU_ITEMS.map(({ key, label, icon: Icon }) => (
          <button
            type="button"
            key={key}
            className={`module-card ${activeKey === key ? 'is-active' : ''}`}
            onClick={() => onSelect(key)}
          >
            <Icon className="module-card-icon" />
            <span>{label}</span>
          </button>
        ))}
      </section>
    </main>
  )
}

export default MainMenu
