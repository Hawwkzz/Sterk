import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import { LoadingScreen } from './components/ui'
import Layout from './components/Layout'

// Lazy load toutes les pages — chargées uniquement quand on y navigue
const LoginPage = lazy(() => import('./pages/LoginPage'))
const HomePage = lazy(() => import('./pages/HomePage'))
const ChantiersPage = lazy(() => import('./pages/ChantiersPage'))
const ChantierDetailPage = lazy(() => import('./pages/ChantierDetailPage'))
const PrimePage = lazy(() => import('./pages/PrimePage'))
const ClassementPage = lazy(() => import('./pages/ClassementPage'))
const AdminPage = lazy(() => import('./pages/AdminPage'))
const ClientValidationPage = lazy(() => import('./pages/ClientValidationPage'))
const EntrepriseDashboardPage = lazy(() => import('./pages/EntrepriseDashboardPage'))
const DossiersCEEPage = lazy(() => import('./pages/DossiersCEEPage'))
const DossierCEEDetailPage = lazy(() => import('./pages/DossierCEEDetailPage'))
const EntrepriseEquipesPage = lazy(() => import('./pages/EntrepriseEquipesPage'))
const EntrepriseParametresPage = lazy(() => import('./pages/EntrepriseParametresPage'))

function ProtectedRoute({ children, adminOnly = false, entrepriseOnly = false }) {
  const { user, loading, isAdmin, isEntreprise } = useAuth()

  if (loading) return <LoadingScreen />
  if (!user) return <Navigate to="/login" replace />
  if (adminOnly && !isAdmin) return <Navigate to="/" replace />
  if (entrepriseOnly && !isEntreprise) return <Navigate to="/" replace />

  return children
}

function RoleRedirect() {
  const { isEntreprise } = useAuth()
  if (isEntreprise) return <Navigate to="/entreprise" replace />
  return <HomePage />
}

export default function App() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/validation/:token" element={<ClientValidationPage />} />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<RoleRedirect />} />
          <Route path="chantiers" element={<ChantiersPage />} />
          <Route path="chantiers/:id" element={<ChantierDetailPage />} />
          <Route path="prime" element={<PrimePage />} />
          <Route path="classement" element={<ClassementPage />} />
        </Route>

        <Route
          path="/admin"
          element={
            <ProtectedRoute adminOnly>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminPage />} />
        </Route>

        <Route
          path="/entreprise"
          element={
            <ProtectedRoute entrepriseOnly>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<EntrepriseDashboardPage />} />
          <Route path="dossiers" element={<DossiersCEEPage />} />
          <Route path="dossiers/:id" element={<DossierCEEDetailPage />} />
          <Route path="equipes" element={<EntrepriseEquipesPage />} />
          <Route path="parametres" element={<EntrepriseParametresPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}
