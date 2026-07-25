import '../styles/Topbar.css'
import { Link, useNavigate } from 'react-router-dom'
import { logout, getCajaAbierta, getUser } from '../db'

export default function Topbar({ titulo }) {
  const navigate = useNavigate()
  const caja = getCajaAbierta()
  const user = getUser()
  const esAdmin = user?.rol === 'admin'

  function salir() {
    logout()
    navigate('/login', { replace: true })
  }
  return (
    <div className="topbar">
      <strong><span className="topbar-icono">🐾</span> PetShop Amigos — {titulo}</strong>
      <div className="topbar-nav">
        <span className={`badge-caja topbar-badge ${caja ? 'badge-caja--abierta' : 'badge-caja--cerrada'}`}>
          {caja ? '● Caja abierta' : '● Caja cerrada'}
        </span>
        <Link to="/panel">Inicio</Link>
        <Link to="/venta">Venta</Link>
        {esAdmin && <Link to="/productos">Inventario</Link>}
        <Link to="/caja">Caja</Link>
        <Link to="/facturas">Facturas</Link>
        {esAdmin && <Link to="/reportes">Reportes</Link>}
        <button type="button" onClick={salir}>Salir</button>
      </div>
    </div>
  )
}
