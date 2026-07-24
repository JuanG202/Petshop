import '../styles/Caja.css'
import { useState } from 'react'
import Topbar from './Topbar'
import { getCajaAbierta, abrirCaja, cerrarCaja, getHistorialCaja, getVentasJornada, getGastosJornada, addGasto } from '../db'

function formatMoney(v) {
  return '$ ' + Number(v || 0).toLocaleString('es-CO')
}
function formatMiles(valor) {
  const limpio = valor.replace(/\D/g, '')
  return limpio ? new Intl.NumberFormat('es-CO').format(limpio) : ''
}

export default function Caja() {
  const [caja, setCaja] = useState(getCajaAbierta())
  const [montoInicial, setMontoInicial] = useState('')
  const [nota, setNota] = useState('')
  const [confirmando, setConfirmando] = useState(false)
  const [montoCierre, setMontoCierre] = useState('')
  const [notaCierre, setNotaCierre] = useState('')
  const [historial, setHistorial] = useState(getHistorialCaja())
  const [gastos, setGastos] = useState(getGastosJornada())
  const [conceptoGasto, setConceptoGasto] = useState('')
  const [valorGasto, setValorGasto] = useState('')

  const ventasJornada = caja ? getVentasJornada() : []
  const totalVentas = ventasJornada.reduce((s, v) => s + v.total, 0)
  const totalGastos = gastos.reduce((s, g) => s + g.valor, 0)

  function handleAgregarGasto() {
    if (!conceptoGasto || !valorGasto) return
    addGasto({ concepto: conceptoGasto, valor: valorGasto.replace(/\./g, '') })
    setGastos(getGastosJornada())
    setConceptoGasto('')
    setValorGasto('')
  }

  function handleAbrir() {
    const nueva = abrirCaja(montoInicial.replace(/\./g, ''), nota)
    setCaja(nueva)
    setMontoInicial('')
    setNota('')
    setGastos(getGastosJornada())
  }

  function handleCerrar() {
    const registro = cerrarCaja(montoCierre.replace(/\./g, ''), notaCierre)
    setCaja(null)
    setHistorial(getHistorialCaja())
    setConfirmando(false)
    setMontoCierre('')
    setNotaCierre('')
    setGastos([])
    void registro
  }

  const diferenciaPreview = montoCierre
    ? Number(montoCierre.replace(/\./g, '')) - ((caja?.montoInicial || 0) + totalVentas - totalGastos)
    : null

  return (
    <div>
      <Topbar titulo="Apertura y Cierre de Caja" />
      <div className="contenedor">

        <div className="tarjeta caja-estado-tarjeta">
          <div className="caja-estado-icono">{caja ? '🟢' : '🔴'}</div>
          <div>
            <p className="caja-estado-label">Estado de caja</p>
            <h3>{caja ? 'ABIERTA' : 'CERRADA'}</h3>
            {caja && (
              <p className="caja-estado-fecha">
                Apertura: {caja.fecha} {caja.hora} — Monto inicial: {formatMoney(caja.montoInicial)}
              </p>
            )}
          </div>
        </div>

        {caja ? (
          <>
            <div className="grid caja-grid">
              <div className="tarjeta">
                <h3 className="caja-card-title">Monto inicial</h3>
                <p className="caja-card-value">{formatMoney(caja.montoInicial)}</p>
              </div>
              <div className="tarjeta">
                <h3 className="caja-card-title">Ventas en jornada</h3>
                <p className="caja-card-value caja-card-value-verde">{formatMoney(totalVentas)}</p>
              </div>
              <div className="tarjeta">
                <h3 className="caja-card-title">N° de ventas</h3>
                <p className="caja-card-value">{ventasJornada.length}</p>
              </div>
              <div className="tarjeta">
                <h3 className="caja-card-title">Gastos en jornada</h3>
                <p className="caja-card-value caja-card-value-roja">- {formatMoney(totalGastos)}</p>
              </div>
              <div className="tarjeta">
                <h3 className="caja-card-title">Total esperado</h3>
                <p className="caja-card-value">{formatMoney(caja.montoInicial + totalVentas - totalGastos)}</p>
              </div>
            </div>

            <div className="tarjeta">
              <h3 className="caja-cierre-title">Gastos de caja</h3>
              <div className="caja-form-group">
                <label>Concepto</label>
                <input value={conceptoGasto} onChange={(e) => setConceptoGasto(e.target.value)} placeholder="Ej: Almuerzo" />
              </div>
              <div className="caja-form-group">
                <label>Valor</label>
                <input value={valorGasto} onChange={(e) => setValorGasto(formatMiles(e.target.value))} placeholder="Ej: 10.000" />
              </div>
              <button onClick={handleAgregarGasto}>➕ Registrar gasto</button>

              {gastos.length > 0 && (
                <table>
                  <thead>
                    <tr><th>Hora</th><th>Concepto</th><th>Valor</th></tr>
                  </thead>
                  <tbody>
                    {gastos.map((g) => (
                      <tr key={g.id}>
                        <td>{g.hora}</td>
                        <td>{g.concepto}</td>
                        <td>{formatMoney(g.valor)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {!confirmando ? (
              <div className="tarjeta">
                <button className="peligro caja-btn-cerrar" onClick={() => setConfirmando(true)}>
                  🔒 Cerrar caja
                </button>
              </div>
            ) : (
              <div className="tarjeta">
                <h3 className="caja-cierre-title">Cierre de caja</h3>
                <div className="caja-form-group">
                  <label>Monto contado (efectivo real)</label>
                  <input value={montoCierre} onChange={(e) => setMontoCierre(formatMiles(e.target.value))} placeholder="Ej: 350.000" />
                </div>
                <div className="caja-form-group">
                  <label>Nota de cierre (opcional)</label>
                  <input value={notaCierre} onChange={(e) => setNotaCierre(e.target.value)} placeholder="Observaciones..." />
                </div>
                {diferenciaPreview !== null && (
                  <p className={`caja-diferencia ${diferenciaPreview >= 0 ? 'caja-diferencia-positiva' : 'caja-diferencia-negativa'}`}>
                    Diferencia: {formatMoney(diferenciaPreview)}
                  </p>
                )}
                <div className="caja-acciones">
                  <button className="secundario caja-btn-cancelar" onClick={() => setConfirmando(false)}>Cancelar</button>
                  <button className="caja-btn-confirmar" onClick={handleCerrar}>✅ Confirmar cierre</button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="tarjeta">
            <h3 className="caja-cierre-title">Apertura de caja</h3>
            <div className="caja-form-group">
              <label>Monto inicial en caja</label>
              <input value={montoInicial} onChange={(e) => setMontoInicial(formatMiles(e.target.value))} placeholder="Ej: 100.000" />
            </div>
            <div className="caja-form-group">
              <label>Nota de apertura (opcional)</label>
              <input value={nota} onChange={(e) => setNota(e.target.value)} placeholder="Observaciones..." />
            </div>
            <button className="caja-btn-abrir" onClick={handleAbrir}>🔓 Abrir caja</button>
          </div>
        )}

        {historial.length > 0 && (
          <div className="tarjeta">
            <h3 className="caja-historial-title">Historial de jornadas</h3>
            <table>
              <thead>
                <tr><th>Apertura</th><th>Cierre</th><th>Inicial</th><th>Ventas</th><th>Gastos</th><th>Diferencia</th></tr>
              </thead>
              <tbody>
                {historial.slice(0, 10).map((c, i) => (
                  <tr key={i}>
                    <td>{c.fecha} {c.hora}</td>
                    <td>{c.fechaCierre} {c.horaCierre}</td>
                    <td>{formatMoney(c.montoInicial)}</td>
                    <td>{formatMoney(c.ventas)}</td>
                    <td>{formatMoney(c.gastos)}</td>
                    <td className={c.diferencia >= 0 ? 'caja-dif-positiva' : 'caja-dif-negativa'}>
                      {formatMoney(c.diferencia)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
