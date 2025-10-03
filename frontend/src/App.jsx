import { useState } from 'react'
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { Toaster } from 'sonner'
import ErrorBoundary from './components/common/ErrorBoundary/ErrorBoundary.jsx'
import ProtectedRoute from './components/common/ProtectedRoute/ProtectedRoute.jsx'
import { AuthProvider } from './contexts/AuthContext.jsx'
import Header from './components/layout/Header/Header.jsx'
import AuthModal from './components/feature/Auth/AuthModal.jsx'
import Footer from './components/layout/Footer/Footer.jsx'
import Sidebar from './components/layout/Sidebar/Sidebar.jsx'
import Home from './pages/Home/Home.jsx'
import NotFound from './pages/NotFound/NotFound.jsx'
import AccountManagement from './pages/AccountManagement/AccountManagement.jsx'
import AdsManagement from './pages/AdsManagement/AdsManagement.jsx'
import ConnectPage from './pages/ConnectPage/ConnectPage.jsx'
import VerifyEmail from './pages/VerifyEmail/VerifyEmail.jsx'
import ResetPassword from './pages/ResetPassword/ResetPassword.jsx'
import ScrollToTop from './utils/ScrollToTop.jsx'
import { ROUTES, HEADER_ROUTES, AUTH_MODES } from './constants/app.constants'

// Re-export useAuth for convenience
export { useAuth } from './hooks/useAuth.js'

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

// Layout cho các trang auth (không có Header/Footer)
function AuthLayout({ children }) {
  return (
    <main className="auth-page">
      {children}
    </main>
  )
}

function AppContent() {
  const [authVisible, setAuthVisible] = useState(false)
  const [authMode, setAuthMode] = useState(AUTH_MODES.LOGIN)
  const navigate = useNavigate()
  const location = useLocation()

  const handleLoginClick = () => {
    setAuthMode(AUTH_MODES.LOGIN)
    setAuthVisible(true)
  }

  const shouldShowHeader = HEADER_ROUTES.includes(location.pathname)

  return (
    <>
      {shouldShowHeader && <Header onLoginClick={handleLoginClick} />}
      <Routes>
        <Route 
          path={ROUTES.HOME}
          element={
            <HomeLayout>
              <Home onStart={() => navigate(ROUTES.ACCOUNT_MANAGEMENT)} />
            </HomeLayout>
          } 
        />
        <Route 
          path={ROUTES.ACCOUNT_MANAGEMENT}
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <AccountManagement />
              </DashboardLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path={ROUTES.ADS_MANAGEMENT}
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <AdsManagement />
              </DashboardLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path={ROUTES.REPORTS}
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <div className="page-placeholder">
                  <h2>Báo cáo</h2>
                  <p>Chức năng đang được phát triển...</p>
                </div>
              </DashboardLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path={ROUTES.STATS}
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <div className="page-placeholder">
                  <h2>Thống kê</h2>
                  <p>Chức năng đang được phát triển...</p>
                </div>
              </DashboardLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path={ROUTES.CONNECT}
          element={<ConnectPage />}
        />
        
        {/* Auth routes */}
        <Route 
          path={ROUTES.VERIFY_EMAIL}
          element={
            <AuthLayout>
              <VerifyEmail />
            </AuthLayout>
          }
        />
        <Route 
          path={ROUTES.RESET_PASSWORD}
          element={
            <AuthLayout>
              <ResetPassword />
            </AuthLayout>
          }
        />
        
        <Route path={ROUTES.NOT_FOUND} element={<NotFound />} />
      </Routes>

      {authVisible && (
        <AuthModal 
          visible={authVisible} 
          mode={authMode}
          onClose={() => setAuthVisible(false)}
          onChangeMode={setAuthMode}
        />
      )}
    </>
  )
}

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <ScrollToTop />
          <AppContent />
          <Toaster 
            richColors 
            position="top-right" 
            expand={true}
            duration={4000}
            closeButton={true}
            limit={3}
            offset="20px"
          />
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  )
}

export default App
