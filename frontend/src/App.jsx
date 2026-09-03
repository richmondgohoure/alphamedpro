import { useEffect, useState } from 'react'
import TopBar from './components/TopBar'
import Sidebar from './components/Sidebar'
import MainMenu from './pages/MainMenu'
import Patients from './pages/Patients'
import Assurances from './pages/Assurances'
import GestionActes from './pages/GestionActes'
import ServicesPage from './pages/ServicesPage'
import MedecinsPage from './pages/MedecinsPage'
import CaissePage from './pages/CaissePage'
import { API_BASE_URL } from './api/http'

function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [activeKey, setActiveKey] = useState('dashboard')
  const [backendStatus, setBackendStatus] = useState('checking')

  const pingBackend = (showChecking) => {
    if (showChecking) {
      setBackendStatus('checking')
    }
    fetch(`${API_BASE_URL}/api/health`)
      .then((res) => (res.ok ? setBackendStatus('up') : setBackendStatus('down')))
      .catch(() => setBackendStatus('down'))
  }

  const checkBackendStatus = () => pingBackend(true)

  useEffect(() => {
    pingBackend(true)
    const intervalId = setInterval(() => pingBackend(false), 15000)
    return () => clearInterval(intervalId)
  }, [])

  const handleSelect = (key) => {
    setActiveKey(key)
    setIsMenuOpen(false)
  }

  const renderContent = () => {
    if (activeKey === 'patients') {
      return <Patients />
    }
    if (activeKey === 'assurances') {
      return <Assurances />
    }
    if (activeKey === 'actes') {
      return <GestionActes />
    }
    if (activeKey === 'services') {
      return <ServicesPage />
    }
    if (activeKey === 'medecins') {
      return <MedecinsPage />
    }
    if (activeKey === 'caisse' || activeKey === 'facturation') {
      return <CaissePage />
    }
    return <MainMenu activeKey={activeKey} onSelect={handleSelect} />
  }

  return (
    <div className="app-shell">
      <TopBar
        onToggleMenu={() => setIsMenuOpen((open) => !open)}
        isMenuOpen={isMenuOpen}
        backendStatus={backendStatus}
        onRefreshBackendStatus={checkBackendStatus}
        onGoHome={() => handleSelect('dashboard')}
      />
      <Sidebar
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        activeKey={activeKey}
        onSelect={handleSelect}
      />
      {renderContent()}
    </div>
  )
}

export default App
