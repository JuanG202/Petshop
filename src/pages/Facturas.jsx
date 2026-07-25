//MODULO DE FACTURA PARA ELL USUARIO DE VENDEDORA

import '../styles/Reportes.css'
import { useEffect, useMemo, useState } from 'react'
import Topbar from './Topbar'
import Factura from './Factura'
import { getVentas } from '../db'

function formatCOP(n) {
  return `$ ${Math.round(n || 0).toLocaleString('es-CO')}`
}

export default function Facturas() {
  const [ventas] = useState(getVentas())
  const [facturaAImprimir, setFacturaAImprimir] = useState(null)
  const [busqueda, setBusqueda] = useState('')
  const [visibleCount, setVisibleCount] = useState(15)

  useEffect(() => setVisibleCount(15), [busqueda])

  useEffect(() => {
    function cerrarAlImprimir() {
      setFacturaAImprimir(null)
    }
    window.addEventListener('afterprint', cerrarAlImprimir)
    return () => window.removeEventListener('afterprint', cerrarAlImprimir)
  }, [])

  const historialFiltrado = useMemo(() => {
    const term = busqueda.trim().toLowerCase()
    const lista = [...ventas].reverse()
    if (!term) return lista
    return lista.filter(
      (v) => (v.numeroFactura || '').toLowerCase().includes(term) || v.items.some((i) => i.nombre.toLowerCase().includes(term))
    )
  }, [ventas, busqueda])

  return (
    <div>
      <Topbar titulo="Facturas" />
      <div className="contenedor">
        <div className="tarjeta">
          <div className="rep-historial-header">
            <h3 className="rep-title">Historial de facturas</h3>
            <input
              className="no-print rep-buscador"
              placeholder="Buscar por N° factura o producto"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>
          <table>
            <thead>
              <tr>
                <th>Factura</th>
                <th>Fecha</th>
                <th>N° items</th>
                <th>Total</th>
                <th className="no-print"></th>
              </tr>
            </thead>
            <tbody>
              {historialFiltrado.slice(0, visibleCount).map((v) => (
                <tr key={v.id}>
                  <td>{v.numeroFactura || '—'}</td>
                  <td>{new Date(v.fecha).toLocaleString('es-CO')}</td>
                  <td>{v.items.reduce((s, i) => s + i.cantidad, 0)}</td>
                  <td>{formatCOP(v.total)}</td>
                  <td className="no-print">
                    <button className="secundario" onClick={() => setFacturaAImprimir(v)}>🖨️ Reimprimir</button>
                  </td>
                </tr>
              ))}
              {historialFiltrado.length === 0 && (
                <tr>
                  <td colSpan="5" className="rep-tabla-vacia">Sin facturas registradas</td>
                </tr>
              )}
            </tbody>
          </table>
          {visibleCount < historialFiltrado.length && (
            <button className="secundario no-print rep-ver-mas" onClick={() => setVisibleCount((c) => c + 15)}>
              Ver más ({historialFiltrado.length - visibleCount} restantes)
            </button>
          )}
        </div>

        {facturaAImprimir && <Factura venta={facturaAImprimir} onImprimir={() => window.print()} />}
      </div>
    </div>
  )
}
