import React, { useEffect, useState } from 'react'
import './App.css'
import Header from './components/layout/Header/Header.jsx'
import AuthModal from './components/feature/Auth/AuthModal.jsx'
import Footer from './components/layout/Footer/Footer.jsx'
import Sidebar from './components/layout/Sidebar/Sidebar.jsx'
import Home from './pages/Home/Home.jsx'
import AccountManagement from './pages/AccountManagement/AccountManagement.jsx'
import AdsManagement from './pages/AdsManagement/AdsManagement.jsx'
import { useScrollOnMount, useScrollOnRouteChange } from './hooks/useScrollToTop'
import { SCROLL_OPTIONS } from './utils/scrollConstants'

function App() {
  const [route, setRoute] = useState('home')
  const [authVisible, setAuthVisible] = useState(false)
  const [authMode, setAuthMode] = useState('login')

  // Bộ dịnh tuyến chuyển đổi giữa các trang
  useEffect(() => {
    const syncRoute = () => {
      const hash = window.location.hash.replace('#', '')
      if (hash === 'account-management' || hash === 'ads' || hash === 'home') {
        setRoute(hash || 'home')
      }
    }
    syncRoute()
    window.addEventListener('hashchange', syncRoute)
    return () => window.removeEventListener('hashchange', syncRoute)
  }, [])

  // Cuộn lên đầu khi load lại trang
  useScrollOnMount(SCROLL_OPTIONS.SMOOTH_TO_TOP)

  // Cuộn lên đầu khi chuyển trang
  useScrollOnRouteChange(route, SCROLL_OPTIONS.SMOOTH_TO_TOP)

  return (
    <>
      <Header 
        onLoginClick={() => { setAuthMode('login'); setAuthVisible(true) }} 
        // onRegisterClick={() => { setAuthMode('register'); setAuthVisible(true) }} 
      />
      {/* Kiểm tra xem nếu ở Home thì hiển thị component, Button ở Home được gắn onStart sẽ làm 2 việc: cập nhật URL và cập nhật trạng thái ứng dụng */}
      {route === 'home' && (
        <main className="page-content">
          <Home onStart={() => { 
            window.location.hash = 'account-management'; 
            setRoute('account-management');
          }} />
        </main>
      )}

      {/* Kiểm tra xem nếu ở AccountManagement thì hiển thị component */}
      {route === 'account-management' && (
        <main className="page-with-sidebar">
          <AccountManagement />
        </main>
      )}

      {/* Kiểm tra xem nếu ở AdsManagement thì hiển thị component */}
      {route === 'ads' && (
        <main className="page-with-sidebar">
          <AdsManagement />
        </main>
      )}

      {/* Kiểm tra nếu ở Home thì không hiển thị Sidebar */}
      {route !== 'home' && <Sidebar />}

      {/* Kiểm tra nếu ở Home thì hiển thị Footer */}
      {route === 'home' && <Footer />}

      <AuthModal 
        visible={authVisible} 
        mode={authMode}
        onClose={() => setAuthVisible(false)}
        onChangeMode={setAuthMode}
      />
    </>
  )
}
export default App
