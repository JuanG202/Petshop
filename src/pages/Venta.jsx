import '../styles/Venta.css'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import Topbar from './Topbar'
import Factura from './Factura'
import { getProductoPorCodigo, updateProducto, addVenta, getNextFacturaNumero, getCajaAbierta, buscarClientes, addCliente } from '../db'

function formatearNumero(valor) {
  const soloNumeros = valor.replace(/\D/g, '')
  if (!soloNumeros) return ''
  return Number(soloNumeros).toLocaleString('es-CO')
}

export default function Venta() {
  const [codigo, setCodigo] = useState('')
  const [sugerenciasProducto, setSugerenciasProducto] = useState([])
  const [carrito, setCarrito] = useState([])
  const [descuento, setDescuento] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [ultimaFactura, setUltimaFactura] = useState(null)
  const [buscarCliente, setBuscarCliente] = useState('')
  const [clienteSel, setClienteSel] = useState(null)
  const [mostrarNuevoCliente, setMostrarNuevoCliente] = useState(false)
  const [nuevoNombre, setNuevoNombre] = useState('')
  const [nuevoDocumento, setNuevoDocumento] = useState('')
  const [metodoPago, setMetodoPago] = useState('efectivo')
  const [pagoEfectivo, setPagoEfectivo] = useState('')
  const [pagoNequi, setPagoNequi] = useState('')
  const [pagoRecibido, setPagoRecibido] = useState('')
  const inputRef = useRef(null)
  const caja = getCajaAbierta()
  const sugerenciasCliente = buscarCliente && !clienteSel ? buscarClientes(buscarCliente) : []

  function seleccionarCliente(c) {
    setClienteSel(c)
    setBuscarCliente(c.nombre)
    setMostrarNuevoCliente(false)
  }

  function quitarCliente() {
    setClienteSel(null)
    setBuscarCliente('')
    setMostrarNuevoCliente(false)
    setNuevoNombre('')
    setNuevoDocumento('')
  }

  function guardarClienteNuevo() {
    if (!nuevoNombre) return
    const c = addCliente({ nombre: nuevoNombre, documento: nuevoDocumento })
    seleccionarCliente(c)
    setNuevoNombre('')
    setNuevoDocumento('')
  }

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    function cerrarAlImprimir() {
      setUltimaFactura(null)
    }
    window.addEventListener('afterprint', cerrarAlImprimir)
    return () => window.removeEventListener('afterprint', cerrarAlImprimir)
  }, [])

  if (!caja) {
    return (
      <div>
        <Topbar titulo="Punto de Venta" />
        <div className="contenedor">
          <div className="tarjeta venta-cerrada-tarjeta">
            <div className="venta-cerrada-icono">🔴</div>
            <h2 className="venta-cerrada-titulo">La caja está cerrada</h2>
            <p className="venta-cerrada-texto">
              Debes abrir la caja antes de registrar ventas.
            </p>
            <Link to="/caja"><button>🔓 Ir a abrir caja</button></Link>
          </div>
        </div>
      </div>
    )
  }

  function buscarProductosPorTexto(texto) {
    const productos = JSON.parse(localStorage.getItem('ps_productos') || '[]')
    const t = texto.trim().toLowerCase()
    if (!t) return []
    return productos.filter(
      (p) =>
        (p.codigos || []).some((c) => (c || '').toLowerCase().includes(t)) ||
        (p.nombre || '').toLowerCase().includes(t)
    ).slice(0, 8)
  }

  function handleCodigoChange(e) {
    const valor = e.target.value
    setCodigo(valor)
    setSugerenciasProducto(buscarProductosPorTexto(valor))
  }

  function seleccionarSugerenciaProducto(prod) {
    agregarProductoObj(prod)
    setCodigo('')
    setSugerenciasProducto([])
    inputRef.current?.focus()
  }

  function agregarProducto(codigoBuscado) {
    const prod = getProductoPorCodigo(codigoBuscado.trim())
    agregarProductoObj(prod)
  }

  function agregarProductoObj(prod) {
    if (!prod) {
      setMensaje('Producto no encontrado')
      setTimeout(() => setMensaje(''), 2000)
      return
    }
    if (Number(prod.stock) <= 0) {
      setMensaje('Sin stock disponible')
      setTimeout(() => setMensaje(''), 2000)
      return
    }

    setCarrito((prev) => {
      const existente = prev.find((i) => i.id === prod.id)
      if (existente) {
        if (existente.cantidad >= Number(prod.stock)) {
          setMensaje('No hay más stock de este producto')
          setTimeout(() => setMensaje(''), 2000)
          return prev
        }
        return prev.map((i) => (i.id === prod.id ? { ...i, cantidad: i.cantidad + 1 } : i))
      }
      return [...prev, { id: prod.id, nombre: prod.nombre, precio: Number(prod.precio), cantidad: 1 }]
    })
  }

  function handleScan(e) {
    e.preventDefault()
    if (!codigo) return
    agregarProducto(codigo)
    setCodigo('')
    setSugerenciasProducto([])
  }

  function cambiarCantidad(id, delta) {
    if (delta > 0) {
      const productos = JSON.parse(localStorage.getItem('ps_productos') || '[]')
      const prod = productos.find((p) => p.id === id)
      const item = carrito.find((i) => i.id === id)
      if (prod && item && item.cantidad >= Number(prod.stock)) {
        setMensaje('No hay más stock de este producto')
        setTimeout(() => setMensaje(''), 2000)
        return
      }
    }
    setCarrito((prev) =>
      prev.map((i) => (i.id === id ? { ...i, cantidad: i.cantidad + delta } : i)).filter((i) => i.cantidad > 0)
    )
  }

  function quitar(id) {
    setCarrito((prev) => prev.filter((i) => i.id !== id))
  }

  function handleDescuentoChange(e) {
    setDescuento(formatearNumero(e.target.value))
  }

  function handlePagoEfectivoChange(e) {
    setPagoEfectivo(formatearNumero(e.target.value))
  }
  function handlePagoNequiChange(e) {
    setPagoNequi(formatearNumero(e.target.value))
  }
  function handlePagoRecibidoChange(e) {
    setPagoRecibido(formatearNumero(e.target.value))
  }

  const descuentoNumero = Number(descuento.replace(/\./g, '')) || 0

  const subtotal = carrito.reduce((s, i) => s + i.precio * i.cantidad, 0)
  let totalDescuento = descuentoNumero
  if (totalDescuento < 0) totalDescuento = 0
  if (totalDescuento > subtotal) totalDescuento = subtotal
  const total = Math.round(subtotal - totalDescuento)

  const pagoEfectivoNum = Number(pagoEfectivo.replace(/\./g, '')) || 0
  const pagoNequiNum = Number(pagoNequi.replace(/\./g, '')) || 0
  const sumaMixto = pagoEfectivoNum + pagoNequiNum
  const mixtoValido = metodoPago !== 'mixto' || sumaMixto === total

  const pagoRecibidoNum = Number(pagoRecibido.replace(/\./g, '')) || 0
  const vueltas = metodoPago === 'efectivo' && pagoRecibidoNum > total ? pagoRecibidoNum - total : 0
  const faltaRecibir = metodoPago === 'efectivo' && pagoRecibidoNum > 0 && pagoRecibidoNum < total
  const recibidoValido = metodoPago !== 'efectivo' || pagoRecibidoNum >= total

  function cobrar() {
    if (carrito.length === 0) return
    if (!mixtoValido) {
      setMensaje('La suma de Efectivo + Nequi debe ser igual al total')
      setTimeout(() => setMensaje(''), 3000)
      return
    }
    if (!recibidoValido) {
      setMensaje('El valor recibido debe ser igual o mayor al total')
      setTimeout(() => setMensaje(''), 3000)
      return
    }

    carrito.forEach((item) => {
      const productos = JSON.parse(localStorage.getItem('ps_productos') || '[]')
      const prod = productos.find((p) => p.id === item.id)
      if (prod) {
        updateProducto(item.id, { stock: Number(prod.stock) - item.cantidad })
      }
    })

    const numeroFactura = getNextFacturaNumero()
    const venta = {
      id: Date.now(),
      numeroFactura,
      timestamp: Date.now(),
      fecha: new Date().toISOString(),
      items: carrito,
      subtotal,
      descuento: totalDescuento,
      total,
      cliente: clienteSel ? { nombre: clienteSel.nombre, documento: clienteSel.documento } : null,
      metodoPago,
      pagoEfectivo: metodoPago === 'nequi' ? 0 : metodoPago === 'mixto' ? pagoEfectivoNum : total,
      pagoNequi: metodoPago === 'efectivo' ? 0 : metodoPago === 'mixto' ? pagoNequiNum : total,
      recibido: metodoPago === 'efectivo' ? pagoRecibidoNum : null,
      vueltas: metodoPago === 'efectivo' ? vueltas : 0,
    }
    addVenta(venta)
    setUltimaFactura(venta)
    setCarrito([])
    setDescuento('')
    setMetodoPago('efectivo')
    setPagoEfectivo('')
    setPagoNequi('')
    setPagoRecibido('')
    quitarCliente()
  }

  return (
    <div>
      <Topbar titulo="Punto de Venta" />
      <div className="contenedor venta-layout">
        <div>
          <div className="tarjeta">
            <form onSubmit={handleScan}>
              <label>Escanear código de barras o buscar por nombre</label>
              <input
                ref={inputRef}
                value={codigo}
                onChange={handleCodigoChange}
                autoFocus
                placeholder="Escanea o escribe el nombre..."
                autoComplete="off"
              />
            </form>
            {sugerenciasProducto.length > 0 && (
              <div className="venta-cliente-sugerencias">
                {sugerenciasProducto.map((p) => (
                  <div key={p.id} className="venta-cliente-sugerencia" onClick={() => seleccionarSugerenciaProducto(p)}>
                    {p.nombre} {(p.codigos || [])[0] ? `— ${p.codigos[0]}` : ''} {Number(p.stock) <= 0 ? '(sin stock)' : ''}
                  </div>
                ))}
              </div>
            )}
            {mensaje && <p className="venta-mensaje">{mensaje}</p>}
          </div>

          <div className="tarjeta">
            <div className="tabla-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Precio</th>
                    <th>Cant.</th>
                    <th>Subtotal</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {carrito.map((i) => (
                    <tr key={i.id}>
                      <td>{i.nombre}</td>
                      <td>$ {i.precio.toLocaleString('es-CO')}</td>
                      <td>
                        <div className="venta-cant-control">
                          <button className="secundario" onClick={() => cambiarCantidad(i.id, -1)}>-</button>
                          <span>{i.cantidad}</span>
                          <button className="secundario" onClick={() => cambiarCantidad(i.id, 1)}>+</button>
                        </div>
                      </td>
                      <td>$ {(i.precio * i.cantidad).toLocaleString('es-CO', { maximumFractionDigits: 0 })}</td>
                      <td><button className="peligro" onClick={() => quitar(i.id)}>X</button></td>
                    </tr>
                  ))}
                  {carrito.length === 0 && (
                    <tr><td colSpan="5" className="venta-tabla-vacia">Carrito vacío</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div>
          <div className="tarjeta venta-cliente-box">
            <label>Cliente (nombre, NIT o cédula)</label>
            {clienteSel ? (
              <div className="venta-cliente-seleccionado">
                <span>👤 {clienteSel.nombre}{clienteSel.documento ? ` — ${clienteSel.documento}` : ''}</span>
                <button className="secundario" onClick={quitarCliente}>Cambiar</button>
              </div>
            ) : (
              <>
                <input
                  value={buscarCliente}
                  onChange={(e) => { setBuscarCliente(e.target.value); setMostrarNuevoCliente(false) }}
                  placeholder="Buscar cliente..."
                />
                {sugerenciasCliente.length > 0 && (
                  <div className="venta-cliente-sugerencias">
                    {sugerenciasCliente.map((c) => (
                      <div key={c.id} className="venta-cliente-sugerencia" onClick={() => seleccionarCliente(c)}>
                        {c.nombre} {c.documento ? `— ${c.documento}` : ''}
                      </div>
                    ))}
                  </div>
                )}
                {buscarCliente && sugerenciasCliente.length === 0 && !mostrarNuevoCliente && (
                  <button className="secundario venta-cliente-btn-nuevo" onClick={() => { setMostrarNuevoCliente(true); setNuevoNombre(buscarCliente) }}>
                    ➕ Cliente no existe, crear nuevo
                  </button>
                )}
                {mostrarNuevoCliente && (
                  <div className="venta-cliente-nuevo">
                    <input placeholder="Nombre" value={nuevoNombre} onChange={(e) => setNuevoNombre(e.target.value)} />
                    <input placeholder="NIT / Cédula" value={nuevoDocumento} onChange={(e) => setNuevoDocumento(e.target.value)} />
                    <button onClick={guardarClienteNuevo}>Guardar cliente</button>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="tarjeta">
            <div className="venta-resumen-fila">
              <span>Subtotal</span><span>$ {subtotal.toLocaleString('es-CO')}</span>
            </div>
            <div className="venta-resumen-fila venta-resumen-descuento">
              <span>Descuento ($)</span>
              <input
                type="text"
                inputMode="numeric"
                value={descuento}
                onChange={handleDescuentoChange}
                className="venta-input-desc"
              />
            </div>
            <h2 className="venta-total">Total: $ {total.toLocaleString('es-CO')}</h2>

            <div className="venta-pago-box">
              <label>Método de pago</label>
              <div className="venta-pago-tabs">
                <button type="button" className={metodoPago === 'efectivo' ? '' : 'secundario'} onClick={() => setMetodoPago('efectivo')}>💵 Efectivo</button>
                <button type="button" className={metodoPago === 'nequi' ? '' : 'secundario'} onClick={() => setMetodoPago('nequi')}>📲 Nequi</button>
                <button type="button" className={metodoPago === 'mixto' ? '' : 'secundario'} onClick={() => setMetodoPago('mixto')}>🔀 Mixto</button>
              </div>
              {metodoPago === 'mixto' && (
                <div className="venta-pago-mixto">
                  <div>
                    <label>Efectivo ($)</label>
                    <input type="text" inputMode="numeric" value={pagoEfectivo} onChange={handlePagoEfectivoChange} />
                  </div>
                  <div>
                    <label>Nequi ($)</label>
                    <input type="text" inputMode="numeric" value={pagoNequi} onChange={handlePagoNequiChange} />
                  </div>
                  <p className={mixtoValido ? 'venta-pago-suma-ok' : 'venta-pago-suma-error'}>
                    Suma: $ {sumaMixto.toLocaleString('es-CO')} / Total: $ {total.toLocaleString('es-CO')}
                  </p>
                </div>
              )}

              {metodoPago === 'efectivo' && (
                <div className="venta-pago-recibido">
                  <label>Recibe ($)</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={pagoRecibido}
                    onChange={handlePagoRecibidoChange}
                    placeholder="Ej: 100.000"
                  />
                  {faltaRecibir && (
                    <p className="venta-pago-suma-error">
                      Falta: $ {(total - pagoRecibidoNum).toLocaleString('es-CO')}
                    </p>
                  )}
                  {vueltas > 0 && (
                    <p className="venta-pago-devuelve">
                      Devuelve: $ {vueltas.toLocaleString('es-CO')}
                    </p>
                  )}
                </div>
              )}
            </div>

            <button
              className="venta-btn-cobrar"
              onClick={cobrar}
              disabled={carrito.length === 0 || !mixtoValido || !recibidoValido}
            >
              Cobrar
            </button>
          </div>

          {ultimaFactura && (
            <Factura venta={ultimaFactura} onImprimir={() => window.print()} />
          )}
        </div>
      </div>
    </div>
  )
}