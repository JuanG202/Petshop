import '../styles/Topbar.css'
import { Link, useNavigate } from 'react-router-dom'
import { logout, getCajaAbierta } from '../db'

export default function Topbar({ titulo }) {
  const navigate = useNavigate()
  const caja = getCajaAbierta()

  function salir() {
    logout()
    navigate('/login')
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
        <Link to="/productos">Inventario</Link>
        <Link to="/caja">Caja</Link>
        <Link to="/reportes">Reportes</Link>
        <button onClick={salir}>Salir</button>
      </div>
    </div>
  )
}
