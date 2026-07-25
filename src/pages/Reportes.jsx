import '../styles/Reportes.css'
import { useEffect, useMemo, useState } from 'react'
import Topbar from './Topbar'
import Factura from './Factura'
import { getVentas, getProductos, getUser } from '../db'

const PERIODOS = [
  { key: 'hoy', label: 'Hoy' },
  { key: 'semana', label: '7 días' },
  { key: 'mes', label: 'Este mes' },
  { key: 'todo', label: 'Histórico' },
  { key: 'personalizado', label: 'Personalizado' },
]

function formatCOP(n) {
  return `$ ${Math.round(n || 0).toLocaleString('es-CO')}`
}
function inicioDelDia(d) {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}
function finDelDia(d) {
  const x = new Date(d)
  x.setHours(23, 59, 59, 999)
  return x
}
function calcularRango(periodo, desde, hasta) {
  const hoy = new Date()
  if (periodo === 'hoy') return { inicio: inicioDelDia(hoy), fin: finDelDia(hoy) }
  if (periodo === 'semana') {
    return { inicio: inicioDelDia(new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() - 6)), fin: finDelDia(hoy) }
  }
  if (periodo === 'mes') {
    return { inicio: new Date(hoy.getFullYear(), hoy.getMonth(), 1), fin: finDelDia(new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0)) }
  }
  if (periodo === 'todo') {
    return { inicio: new Date(2000, 0, 1), fin: finDelDia(hoy) }
  }
  // personalizado
  const inicio = desde ? inicioDelDia(new Date(desde + 'T00:00:00')) : inicioDelDia(hoy)
  const fin = hasta ? finDelDia(new Date(hasta + 'T00:00:00')) : finDelDia(hoy)
  return { inicio, fin }
}
function rangoAnterior({ inicio, fin }) {
  const duracion = fin.getTime() - inicio.getTime()
  const finAnterior = new Date(inicio.getTime() - 1)
  const inicioAnterior = new Date(finAnterior.getTime() - duracion)
  return { inicio: inicioAnterior, fin: finAnterior }
}
function enRango(v, rango) {
  const ts = v.timestamp || new Date(v.fecha).getTime()
  return ts >= rango.inicio.getTime() && ts <= rango.fin.getTime()
}
function construirSerie(ventasPeriodo, inicio, fin) {
  const diasTotales = Math.max(1, Math.round((fin - inicio) / 86400000) + 1)
  const totales = {}
  ventasPeriodo.forEach((v) => {
    const ts = v.timestamp || new Date(v.fecha).getTime()
    const key = diasTotales <= 45 ? new Date(ts).toISOString().slice(0, 10) : new Date(ts).toISOString().slice(0, 7)
    totales[key] = (totales[key] || 0) + v.total
  })
  if (diasTotales <= 45) {
    const datos = []
    for (let i = 0; i < diasTotales; i++) {
      const d = new Date(inicio.getTime() + i * 86400000)
      const key = d.toISOString().slice(0, 10)
      datos.push({ label: d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' }), value: totales[key] || 0 })
    }
    return datos
  }
  return Object.keys(totales)
    .sort()
    .map((k) => {
      const [y, m] = k.split('-')
      const d = new Date(Number(y), Number(m) - 1, 1)
      return { label: d.toLocaleDateString('es-CO', { month: 'short', year: '2-digit' }), value: totales[k] }
    })
}
function deltaPct(actual, anterior) {
  if (!anterior) return null
  return ((actual - anterior) / anterior) * 100
}
function descargarCSV(filas, nombreArchivo) {
  const csv = filas.map((f) => f.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nombreArchivo
  a.click()
  URL.revokeObjectURL(url)
}

function Delta({ pct }) {
  if (pct === null) return <span className="rep-delta rep-delta--neutral">sin dato previo</span>
  const positivo = pct >= 0
  return (
    <span className={`rep-delta ${positivo ? 'rep-delta--up' : 'rep-delta--down'}`}>
      {positivo ? '▲' : '▼'} {Math.abs(pct).toFixed(1)}%
    </span>
  )
}

function GraficoBarras({ datos }) {
  if (datos.length === 0 || datos.every((d) => d.value === 0)) {
    return <p className="rep-tabla-vacia">Sin datos para graficar en este periodo</p>
  }
  const max = Math.max(...datos.map((d) => d.value), 1)
  const unidad = 30
  const W = Math.max(datos.length * unidad, 600)
  const H = 200
  const padBottom = 8
  const barW = W / datos.length
  const saltarEtiqueta = datos.length > 20 ? Math.ceil(datos.length / 16) : 1
  return (
    <div className="rep-chart-scroll">
      <div style={{ minWidth: W }}>
        <svg viewBox={`0 0 ${W} ${H}`} className="rep-chart-svg" preserveAspectRatio="none">
          {datos.map((d, i) => {
            const h = (d.value / max) * (H - padBottom - 14)
            const x = i * barW
            const y = H - padBottom - h
            return (
              <rect key={i} x={x + barW * 0.18} y={y} width={barW * 0.64} height={Math.max(h, d.value > 0 ? 2 : 0)} rx="2.5" className="rep-barra">
                <title>{`${d.label}: ${formatCOP(d.value)}`}</title>
              </rect>
            )
          })}
          <line x1="0" y1={H - padBottom} x2={W} y2={H - padBottom} className="rep-chart-eje" />
        </svg>
        <div className="rep-chart-labels">
          {datos.map((d, i) => (
            <span key={i} className="rep-chart-label" style={{ width: barW }}>
              {i % saltarEtiqueta === 0 ? d.label : ''}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function Reportes() {
  const [ventas] = useState(getVentas())
  const [productos] = useState(getProductos())
  const [facturaAImprimir, setFacturaAImprimir] = useState(null)
  const [periodo, setPeriodo] = useState('mes')
  const hoyISO = new Date().toISOString().slice(0, 10)
  const [desde, setDesde] = useState(hoyISO)
  const [hasta, setHasta] = useState(hoyISO)
  const [busqueda, setBusqueda] = useState('')
  const [visibleCount, setVisibleCount] = useState(15)
  const usuario = getUser()

  useEffect(() => setVisibleCount(15), [periodo, busqueda, desde, hasta])

  useEffect(() => {
    function cerrarAlImprimir() {
      setFacturaAImprimir(null)
    }
    window.addEventListener('afterprint', cerrarAlImprimir)
    return () => window.removeEventListener('afterprint', cerrarAlImprimir)
  }, [])

  const rango = useMemo(() => calcularRango(periodo, desde, hasta), [periodo, desde, hasta])
  const rangoPrev = useMemo(() => rangoAnterior(rango), [rango])

  const ventasPeriodo = useMemo(() => ventas.filter((v) => enRango(v, rango)), [ventas, rango])
  const ventasPrev = useMemo(
    () => (periodo === 'todo' ? [] : ventas.filter((v) => enRango(v, rangoPrev))),
    [ventas, rangoPrev, periodo]
  )

  const productosPorId = useMemo(() => {
    const m = {}
    productos.forEach((p) => (m[p.id] = p))
    return m
  }, [productos])

  const totalIngresos = ventasPeriodo.reduce((s, v) => s + v.total, 0)
  const cantidadVentas = ventasPeriodo.length
  const ticketPromedio = cantidadVentas ? totalIngresos / cantidadVentas : 0
  const totalDescuentos = ventasPeriodo.reduce((s, v) => s + (v.descuento || 0), 0)

  const { utilidadEstimada, huboProductosSinCosto } = useMemo(() => {
    let utilidad = 0
    let faltantes = false
    ventasPeriodo.forEach((v) =>
      v.items.forEach((i) => {
        const prod = productosPorId[i.id]
        if (prod && prod.costo !== undefined && prod.costo !== '') {
          utilidad += (i.precio - Number(prod.costo)) * i.cantidad
        } else {
          faltantes = true
        }
      })
    )
    return { utilidadEstimada: utilidad, huboProductosSinCosto: faltantes }
  }, [ventasPeriodo, productosPorId])

  const ingresosPrev = ventasPrev.reduce((s, v) => s + v.total, 0)
  const cantidadPrev = ventasPrev.length
  const mostrarComparativo = periodo !== 'todo'

  const serie = useMemo(() => construirSerie(ventasPeriodo, rango.inicio, rango.fin), [ventasPeriodo, rango])

  const topProductos = useMemo(() => {
    const map = {}
    ventasPeriodo.forEach((v) =>
      v.items.forEach((i) => {
        if (!map[i.nombre]) map[i.nombre] = { cantidad: 0, ingresos: 0 }
        map[i.nombre].cantidad += i.cantidad
        map[i.nombre].ingresos += i.precio * i.cantidad
      })
    )
    return Object.entries(map)
      .sort((a, b) => b[1].ingresos - a[1].ingresos)
      .slice(0, 5)
  }, [ventasPeriodo])

  const categorias = useMemo(() => {
    const map = {}
    ventasPeriodo.forEach((v) =>
      v.items.forEach((i) => {
        const cat = productosPorId[i.id]?.categoria || 'Sin categoría'
        map[cat] = (map[cat] || 0) + i.precio * i.cantidad
      })
    )
    const total = Object.values(map).reduce((s, v) => s + v, 0) || 1
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .map(([cat, valor]) => ({ cat, valor, pct: (valor / total) * 100 }))
  }, [ventasPeriodo, productosPorId])

  const historialFiltrado = useMemo(() => {
    const term = busqueda.trim().toLowerCase()
    const lista = [...ventasPeriodo].reverse()
    if (!term) return lista
    return lista.filter(
      (v) => (v.numeroFactura || '').toLowerCase().includes(term) || v.items.some((i) => i.nombre.toLowerCase().includes(term))
    )
  }, [ventasPeriodo, busqueda])

  const periodoLabel = `${rango.inicio.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })} — ${rango.fin.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}`

  function exportarCSV() {
    const filas = [['N° Factura', 'Fecha', 'N° Items', 'Subtotal', 'Descuento', 'Total']]
    historialFiltrado.forEach((v) => {
      filas.push([
        v.numeroFactura || '',
        new Date(v.fecha).toLocaleString('es-CO'),
        v.items.reduce((s, i) => s + i.cantidad, 0),
        v.subtotal ?? v.total,
        v.descuento ?? 0,
        v.total,
      ])
    })
    descargarCSV(filas, `reporte-ventas-${hoyISO}.csv`)
  }

  const medallas = ['🥇', '🥈', '🥉']

  return (
    <div>
      <Topbar titulo="Reportes" />
      <div className="contenedor" id={facturaAImprimir ? undefined : 'reporte-imprimible'}>
        <div className="tarjeta rep-encabezado">
          <div>
            <h1 className="rep-encabezado-titulo">Reporte de ventas</h1>
            <p className="rep-encabezado-sub">PetShop Amigos · {periodoLabel}</p>
            <p className="rep-encabezado-meta">
              Generado el {new Date().toLocaleString('es-CO')} {usuario ? `por ${usuario.usuario}` : ''}
            </p>
          </div>
          <div className="rep-encabezado-acciones no-print">
            <button className="secundario" onClick={exportarCSV}>⬇️ Exportar CSV</button>
            <button onClick={() => window.print()}>🖨️ Imprimir reporte</button>
          </div>
        </div>

        <div className="tarjeta rep-filtros no-print">
          <div className="rep-filtros-botones">
            {PERIODOS.map((p) => (
              <button key={p.key} className={periodo === p.key ? '' : 'secundario'} onClick={() => setPeriodo(p.key)}>
                {p.label}
              </button>
            ))}
          </div>
          {periodo === 'personalizado' && (
            <div className="rep-filtros-fechas">
              <div>
                <label>Desde</label>
                <input type="date" value={desde} max={hasta} onChange={(e) => setDesde(e.target.value)} />
              </div>
              <div>
                <label>Hasta</label>
                <input type="date" value={hasta} min={desde} max={hoyISO} onChange={(e) => setHasta(e.target.value)} />
              </div>
            </div>
          )}
        </div>

        <div className="grid rep-grid">
          <div className="tarjeta rep-kpi">
            <h3 className="rep-kpi-label">Ingresos del periodo</h3>
            <p className="rep-kpi-valor">{formatCOP(totalIngresos)}</p>
            {mostrarComparativo && <Delta pct={deltaPct(totalIngresos, ingresosPrev)} />}
          </div>
          <div className="tarjeta rep-kpi">
            <h3 className="rep-kpi-label">N° de ventas</h3>
            <p className="rep-kpi-valor">{cantidadVentas}</p>
            {mostrarComparativo && <Delta pct={deltaPct(cantidadVentas, cantidadPrev)} />}
          </div>
          <div className="tarjeta rep-kpi">
            <h3 className="rep-kpi-label">Ticket promedio</h3>
            <p className="rep-kpi-valor">{formatCOP(ticketPromedio)}</p>
          </div>
          <div className="tarjeta rep-kpi">
            <h3 className="rep-kpi-label">Descuentos otorgados</h3>
            <p className="rep-kpi-valor">{formatCOP(totalDescuentos)}</p>
          </div>
          <div className="tarjeta rep-kpi">
            <h3 className="rep-kpi-label">Utilidad estimada</h3>
            <p className="rep-kpi-valor">{formatCOP(utilidadEstimada)}</p>
            {huboProductosSinCosto && <span className="rep-kpi-nota">*según costos actuales en inventario</span>}
          </div>
        </div>

        <div className="tarjeta">
          <h3 className="rep-title">Tendencia de ventas</h3>
          <GraficoBarras datos={serie} />
        </div>

        <div className="rep-dos-columnas">
          <div className="tarjeta">
            <h3 className="rep-title">Productos más vendidos</h3>
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Producto</th>
                  <th>Cant.</th>
                  <th>Ingresos</th>
                </tr>
              </thead>
              <tbody>
                {topProductos.map(([nombre, datos], idx) => (
                  <tr key={nombre}>
                    <td>{medallas[idx] || idx + 1}</td>
                    <td>{nombre}</td>
                    <td>{datos.cantidad}</td>
                    <td>{formatCOP(datos.ingresos)}</td>
                  </tr>
                ))}
                {topProductos.length === 0 && (
                  <tr>
                    <td colSpan="4" className="rep-tabla-vacia">Sin datos aún</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="tarjeta">
            <h3 className="rep-title">Ventas por categoría</h3>
            {categorias.length === 0 && <p className="rep-tabla-vacia">Sin datos aún</p>}
            {categorias.map((c) => (
              <div key={c.cat} className="rep-cat-fila">
                <div className="rep-cat-info">
                  <span>{c.cat}</span>
                  <span>{formatCOP(c.valor)} · {c.pct.toFixed(0)}%</span>
                </div>
                <div className="rep-cat-barra-fondo">
                  <div className="rep-cat-barra" style={{ width: `${c.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {facturaAImprimir && <Factura venta={facturaAImprimir} onImprimir={() => window.print()} />}
      </div>
    </div>
  )
}
