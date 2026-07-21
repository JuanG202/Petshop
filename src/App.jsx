import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Panel from './pages/Panel'
import Venta from './pages/Venta'
import Productos from './pages/Productos'
import Reportes from './pages/Reportes'
import Caja from './pages/Caja'
import { getUser } from './db'

function Privada({ children }) {
  return getUser() ? children : <Navigate to="/login" replace />
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/panel" element={<Privada><Panel /></Privada>} />
        <Route path="/venta" element={<Privada><Venta /></Privada>} />
        <Route path="/productos" element={<Privada><Productos /></Privada>} />
        <Route path="/caja" element={<Privada><Caja /></Privada>} />
        <Route path="/reportes" element={<Privada><Reportes /></Privada>} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
