import '../styles/Reportes.css'
import { useEffect, useState } from 'react'
import Topbar from './Topbar'
import Factura from './Factura'
import { getVentas } from '../db'

export default function Reportes() {
  const [ventas] = useState(getVentas())
  const [facturaAImprimir, setFacturaAImprimir] = useState(null)
  const hoy = new Date().toISOString().slice(0, 10)
  const mesActual = hoy.slice(0, 7)

  const ventasHoy = ventas.filter((v) => v.fecha.slice(0, 10) === hoy)
  const ventasMes = ventas.filter((v) => v.fecha.slice(0, 7) === mesActual)

  const totalHoy = ventasHoy.reduce((s, v) => s + v.total, 0)
  const totalMes = ventasMes.reduce((s, v) => s + v.total, 0)

  const productosVendidos = {}
  ventasMes.forEach((v) =>
    v.items.forEach((i) => {
      productosVendidos[i.nombre] = (productosVendidos[i.nombre] || 0) + i.cantidad
    })
  )
  const topProductos = Object.entries(productosVendidos).sort((a, b) => b[1] - a[1]).slice(0, 5)

  useEffect(() => {
    function cerrarAlImprimir() {
      setFacturaAImprimir(null)
    }
    window.addEventListener('afterprint', cerrarAlImprimir)
    return () => window.removeEventListener('afterprint', cerrarAlImprimir)
  }, [])

  return (
    <div>
      <Topbar titulo="Reportes" />
      <div className="contenedor">
        <div className="grid rep-grid">
          <div className="tarjeta">
            <h3>Ventas de hoy</h3>
            <p className="rep-total">{ventasHoy.length} ventas — $ {totalHoy.toLocaleString('es-CO')}</p>
          </div>
          <div className="tarjeta">
            <h3>Ventas del mes</h3>
            <p className="rep-total">{ventasMes.length} ventas — $ {totalMes.toLocaleString('es-CO')}</p>
          </div>
        </div>

        <div className="tarjeta">
          <h3 className="rep-title">Productos más vendidos (mes)</h3>
          <table>
            <thead><tr><th>Producto</th><th>Cantidad vendida</th></tr></thead>
            <tbody>
              {topProductos.map(([nombre, cant]) => (
                <tr key={nombre}><td>{nombre}</td><td>{cant}</td></tr>
              ))}
              {topProductos.length === 0 && (
                <tr><td colSpan="2" className="rep-tabla-vacia">Sin datos aún</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {facturaAImprimir && (
          <Factura venta={facturaAImprimir} onImprimir={() => window.print()} />
        )}

        <div className="tarjeta">
          <h3 className="rep-title">Historial de ventas</h3>
          <table>
            <thead><tr><th>Factura</th><th>Fecha</th><th>N° items</th><th>Total</th><th></th></tr></thead>
            <tbody>
              {[...ventas].reverse().map((v) => (
                <tr key={v.id}>
                  <td>{v.numeroFactura || '—'}</td>
                  <td>{new Date(v.fecha).toLocaleString('es-CO')}</td>
                  <td>{v.items.reduce((s, i) => s + i.cantidad, 0)}</td>
                  <td>$ {v.total.toLocaleString('es-CO')}</td>
                  <td><button className="secundario" onClick={() => setFacturaAImprimir(v)}>🖨️ Reimprimir</button></td>
                </tr>
              ))}
              {ventas.length === 0 && (
                <tr><td colSpan="5" className="rep-tabla-vacia">Sin ventas registradas</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
