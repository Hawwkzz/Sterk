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

// Entreprise pages
import EntrepriseDashboardPage from './pages/EntrepriseDashboardPage'
import DossiersCEEPage from './pages/DossiersCEEPage'
import DossierCEEDetailPage from './pages/DossierCEEDetailPage'
import EntrepriseEquipesPage from './pages/EntrepriseEquipesPage'

// Protected Route wrapper
function ProtectedRoute({ children, adminOnly = false, entrepriseOnly = false }) {
  const { user, loading, isAdmin, isEntreprise } = useAuth()

  if (loading) {
    return <LoadingScreen />
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/" replace />
  }

  if (entrepriseOnly && !isEntreprise) {
    return <Navigate to="/" replace />
  }

  return children
}

// Redirect based on role
function RoleRedirect() {
  const { isEntreprise, loading } = useAuth()

  if (loading) return <LoadingScreen />

  if (isEntreprise) {
    return <Navigate to="/entreprise" replace />
  }

  return <HomePage />
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
        {/* Equipe + Admin routes */}
        <Route index element={<RoleRedirect />} />
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

        {/* Entreprise routes */}
        <Route
          path="entreprise"
          element={
            <ProtectedRoute entrepriseOnly>
              <EntrepriseDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="entreprise/dossiers"
          element={
            <ProtectedRoute entrepriseOnly>
              <DossiersCEEPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="entreprise/dossiers/:id"
          element={
            <ProtectedRoute entrepriseOnly>
              <DossierCEEDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="entreprise/equipes"
          element={
            <ProtectedRoute entrepriseOnly>
              <EntrepriseEquipesPage />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
