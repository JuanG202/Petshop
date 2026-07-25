import '../styles/Panel.css'
import { Link } from 'react-router-dom'
import Topbar from './Topbar'
import { getProductos, getVentas, getCajaAbierta, getVentasJornada, getUser } from '../db'

export default function Panel() {
  const productos = getProductos()
  const ventas = getVentas()
  const caja = getCajaAbierta()
  const ventasHoy = caja ? getVentasJornada() : []
  const totalHoy = ventasHoy.reduce((s, v) => s + v.total, 0)
  const bajoStock = productos.filter((p) => Number(p.stock) <= Number(p.stockMinimo || 5))
  const esAdmin = getUser()?.rol === 'admin'

  return (
    <div>
      <Topbar titulo="Panel Principal" />
      <div className="contenedor">

        <div className="tarjeta panel-bienvenida">
          <div className="panel-bienvenida-icono">🐾</div>
          <div>
            <h2 className="panel-bienvenida-titulo">¡Hola de nuevo!</h2>
            <p className="panel-bienvenida-sub">Aquí tienes el resumen de tu petshop hoy</p>
          </div>
        </div>

        {!caja && (
          <div className="tarjeta panel-alerta-caja">
            <div>
              <h3 className="panel-alerta-titulo">🔴 Caja cerrada</h3>
              <p className="panel-alerta-texto">Abre la caja para poder registrar ventas.</p>
            </div>
            <Link to="/caja"><button>🔓 Abrir caja</button></Link>
          </div>
        )}

        <div className="grid panel-grid">
          <div className="tarjeta">
            <h3 className="panel-card-title">Productos</h3>
            <p className="panel-card-value">{productos.length}</p>
          </div>
          <div className="tarjeta">
            <h3 className="panel-card-title">Ventas de hoy</h3>
            <p className="panel-card-value">{ventasHoy.length}</p>
          </div>
          <div className="tarjeta">
            <h3 className="panel-card-title">Total vendido hoy</h3>
            <p className="panel-card-value">$ {totalHoy.toLocaleString('es-CO')}</p>
          </div>
          <div className="tarjeta">
            <h3 className="panel-card-title">Bajo stock</h3>
            <p className={`panel-card-value ${bajoStock.length ? 'panel-bajo-stock-alerta' : 'panel-bajo-stock-ok'}`}>{bajoStock.length}</p>
          </div>
        </div>

        <div className="tarjeta">
          <h3 className="panel-accesos-title">Accesos rápidos</h3>
          <div className="panel-accesos">
            <Link to="/venta"><button>Nueva venta</button></Link>
            {esAdmin && <Link to="/productos"><button className="secundario">Inventario</button></Link>}
            <Link to="/caja"><button className="secundario">Caja</button></Link>
            <Link to="/facturas"><button className="secundario">Facturas</button></Link>
            {esAdmin && <Link to="/reportes"><button className="secundario">Reportes</button></Link>}
          </div>
        </div>
      </div>
    </div>
  )
}
