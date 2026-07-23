import { useEffect, useState } from 'react'
import TopBar from './components/TopBar'
import Sidebar from './components/Sidebar'
import MainMenu from './pages/MainMenu'
import Patients from './pages/Patients'
import Assurances from './pages/Assurances'
import { API_BASE_URL } from './api/http'

function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [activeKey, setActiveKey] = useState('dashboard')
  const [backendStatus, setBackendStatus] = useState('checking')

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/health`)
      .then((res) => (res.ok ? setBackendStatus('up') : setBackendStatus('down')))
      .catch(() => setBackendStatus('down'))
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
    return <MainMenu activeKey={activeKey} onSelect={handleSelect} />
  }

  return (
    <div className="app-shell">
      <TopBar
        onToggleMenu={() => setIsMenuOpen((open) => !open)}
        isMenuOpen={isMenuOpen}
        backendStatus={backendStatus}
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
