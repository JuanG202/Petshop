import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Panel from './pages/Panel'
import Venta from './pages/Venta'
import Productos from './pages/Productos'
import Reportes from './pages/Reportes'
import Caja from './pages/Caja'
import Facturas from './pages/Facturas'
import Clientes from './pages/Clientes'
import { getUser } from './db'

function Privada({ children }) {
  return getUser() ? children : <Navigate to="/login" replace />
}

function SoloAdmin({ children }) {
  const user = getUser()
  if (!user) return <Navigate to="/login" replace />
  if (user.rol !== 'admin') return <Navigate to="/venta" replace />
  return children
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/panel" element={<Privada><Panel /></Privada>} />
        <Route path="/venta" element={<Privada><Venta /></Privada>} />
        <Route path="/productos" element={<SoloAdmin><Productos /></SoloAdmin>} />
        <Route path="/caja" element={<Privada><Caja /></Privada>} />
        <Route path="/facturas" element={<Privada><Facturas /></Privada>} />
        <Route path="/clientes" element={<SoloAdmin><Clientes /></SoloAdmin>} />
        <Route path="/reportes" element={<SoloAdmin><Reportes /></SoloAdmin>} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
