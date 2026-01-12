import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import { LoadingScreen } from './components/ui'

// Layouts
import Layout from './components/Layout'

// Pages
import LoginPage from './pages/LoginPage'
import HomePage from './pages/HomePage'
import ChantiersPage from './pages/ChantiersPage'
import ChantierDetailPage from './pages/ChantierDetailPage'
import PrimePage from './pages/PrimePage'
import ClassementPage from './pages/ClassementPage'
import AdminPage from './pages/AdminPage'
import ClientValidationPage from './pages/ClientValidationPage'

// Protected Route wrapper
function ProtectedRoute({ children, adminOnly = false }) {
  const { user, loading, isAdmin } = useAuth()

  if (loading) {
    return <LoadingScreen />
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/" replace />
  }

  return children
}

export default function App() {
  const { loading } = useAuth()

  if (loading) {
    return <LoadingScreen />
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/validation/:token" element={<ClientValidationPage />} />

      {/* Protected routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<HomePage />} />
        <Route path="chantiers" element={<ChantiersPage />} />
        <Route path="chantiers/:id" element={<ChantierDetailPage />} />
        <Route path="prime" element={<PrimePage />} />
        <Route path="classement" element={<ClassementPage />} />
        <Route
          path="admin"
          element={
            <ProtectedRoute adminOnly>
              <AdminPage />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
