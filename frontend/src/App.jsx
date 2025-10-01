import React, { useState } from 'react'
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { Toaster } from 'sonner'
import Header from './components/layout/Header/Header.jsx'
import AuthModal from './components/feature/Auth/AuthModal.jsx'
import Footer from './components/layout/Footer/Footer.jsx'
import Sidebar from './components/layout/Sidebar/Sidebar.jsx'
import Home from './pages/Home/Home.jsx'
import NotFound from './pages/NotFound/NotFound.jsx'
import AccountManagement from './pages/AccountManagement/AccountManagement.jsx'
import AdsManagement from './pages/AdsManagement/AdsManagement.jsx'
import ConnectPage from './pages/ConnectPage/ConnectPage.jsx'
import ScrollToTop from './utils/ScrollToTop.jsx'

// Layout cho trang Home (có Footer)
function HomeLayout({ children }) {
  return (
    <>
      <main className="page-content">
        {children}
      </main>
      <Footer />
    </>
  )
}

// Layout cho các trang khác (có Sidebar)
function DashboardLayout({ children }) {
  return (
    <>
      <main className="page-with-sidebar">
        {children}
      </main>
      <Sidebar />
    </>
  )
}

function AppContent() {
  const [authVisible, setAuthVisible] = useState(false)
  const [authMode, setAuthMode] = useState('login')
  const navigate = useNavigate()
  const location = useLocation()

  const handleLoginClick = () => {
    setAuthMode('login')
    setAuthVisible(true)
  }

  // Cấu hình các trang có Header
  const validRoutes = ['/', '/account-management', '/ads', '/reports', '/stats']
  const shouldShowHeader = validRoutes.includes(location.pathname)

  return (
    <>
      {shouldShowHeader && <Header onLoginClick={handleLoginClick}/>}
      <Routes>
        <Route 
          path="/" 
          element={
            <HomeLayout>
              <Home onStart={() => navigate('/account-management')} />
            </HomeLayout>
          } 
        />
        <Route 
          path="/account-management" 
          element={
            <DashboardLayout>
              <AccountManagement />
            </DashboardLayout>
          } 
        />
        <Route 
          path="/ads" 
          element={
            <DashboardLayout>
              <AdsManagement />
            </DashboardLayout>
          } 
        />
        <Route 
          path="/reports" 
          element={
            <DashboardLayout>
              <div className="page-placeholder">
                <h2>Báo cáo</h2>
                <p>Chức năng đang được phát triển...</p>
              </div>
            </DashboardLayout>
          } 
        />
        <Route 
          path="/stats" 
          element={
            <DashboardLayout>
              <div className="page-placeholder">
                <h2>Thống kê</h2>
                <p>Chức năng đang được phát triển...</p>
              </div>
            </DashboardLayout>
          } 
        />
        <Route 
          path="/connect" 
          element={<ConnectPage />}
        />
        <Route path="*" element={<NotFound/>}/>
      </Routes>


      <AuthModal 
        visible={authVisible} 
        mode={authMode}
        onClose={() => setAuthVisible(false)}
        onChangeMode={setAuthMode}
      />
    </>
  )
}

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <AppContent />
      <Toaster richColors/>
    </BrowserRouter>
  )
}
export default App
