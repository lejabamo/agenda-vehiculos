import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import PublicWizardPage from './pages/public/PublicWizardPage'
import LoginPage from './pages/admin/LoginPage'
import AdminLayout from './pages/admin/AdminLayout'
import DashboardPage from './pages/admin/DashboardPage'
import SolicitudesPage from './pages/admin/SolicitudesPage'
import SolicitudDetailPage from './pages/admin/SolicitudDetailPage'
import VehiculosPage from './pages/admin/VehiculosPage'
import ConductoresPage from './pages/admin/ConductoresPage'
import CalendarioPage from './pages/admin/CalendarioPage'
import AnalyticsPage from './pages/admin/AnalyticsPage'
import DirectorioPage from './pages/admin/DirectorioPage'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { token } = useAuth()
  return token ? <>{children}</> : <Navigate to="/admin/login" replace />
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter basename="/vehiculos">
        <Routes>
          {/* Pública */}
          <Route path="/" element={<PublicWizardPage />} />

          {/* Admin */}
          <Route path="/admin/login" element={<LoginPage />} />
          <Route path="/admin" element={<PrivateRoute><AdminLayout /></PrivateRoute>}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="solicitudes" element={<SolicitudesPage />} />
            <Route path="solicitudes/:id" element={<SolicitudDetailPage />} />
            <Route path="vehiculos" element={<VehiculosPage />} />
            <Route path="conductores" element={<ConductoresPage />} />
            <Route path="calendario" element={<CalendarioPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="directorio" element={<DirectorioPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
