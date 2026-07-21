import '../styles/Venta.css'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import Topbar from './Topbar'
import Factura from './Factura'
import { getProductoPorCodigo, updateProducto, addVenta, getNextFacturaNumero, getCajaAbierta, IVA } from '../db'

export default function Venta() {
  const [codigo, setCodigo] = useState('')
  const [carrito, setCarrito] = useState([])
  const [mensaje, setMensaje] = useState('')
  const [ultimaFactura, setUltimaFactura] = useState(null)
  const inputRef = useRef(null)
  const caja = getCajaAbierta()

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

  function agregarProducto(codigoBuscado) {
    const prod = getProductoPorCodigo(codigoBuscado.trim())
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
      return [...prev, { id: prod.id, nombre: prod.nombre, precio: Number(prod.precio), cantidad: 1, descuento: 0 }]
    })
  }

  function handleScan(e) {
    e.preventDefault()
    if (!codigo) return
    agregarProducto(codigo)
    setCodigo('')
  }

  function cambiarCantidad(id, delta) {
    setCarrito((prev) =>
      prev.map((i) => (i.id === id ? { ...i, cantidad: i.cantidad + delta } : i)).filter((i) => i.cantidad > 0)
    )
  }

  function cambiarDescuento(id, valor) {
    let d = Number(valor)
    if (isNaN(d)) d = 0
    if (d < 0) d = 0
    if (d > 100) d = 100
    setCarrito((prev) => prev.map((i) => (i.id === id ? { ...i, descuento: d } : i)))
  }

  function quitar(id) {
    setCarrito((prev) => prev.filter((i) => i.id !== id))
  }

  const subtotal = carrito.reduce((s, i) => s + i.precio * i.cantidad, 0)
  const totalDescuento = carrito.reduce((s, i) => s + i.precio * i.cantidad * (i.descuento / 100), 0)
  const baseGravable = subtotal - totalDescuento
  const valorIva = Math.round(baseGravable * IVA)
  const total = Math.round(baseGravable + valorIva)

  function cobrar() {
    if (carrito.length === 0) return

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
      iva: valorIva,
      total,
    }
    addVenta(venta)
    setUltimaFactura(venta)
    setCarrito([])
  }

  return (
    <div>
      <Topbar titulo="Punto de Venta" />
      <div className="contenedor venta-layout">
        <div>
          <div className="tarjeta">
            <form onSubmit={handleScan}>
              <label>Escanear / ingresar código de barras</label>
              <input
                ref={inputRef}
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
                autoFocus
                placeholder="Escanea aquí..."
              />
            </form>
            {mensaje && <p className="venta-mensaje">{mensaje}</p>}
          </div>

          <div className="tarjeta">
            <table>
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Precio</th>
                  <th>Cant.</th>
                  <th>Desc. %</th>
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
                      <button className="secundario" onClick={() => cambiarCantidad(i.id, -1)}>-</button>
                      {' '}{i.cantidad}{' '}
                      <button className="secundario" onClick={() => cambiarCantidad(i.id, 1)}>+</button>
                    </td>
                    <td>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={i.descuento}
                        onChange={(e) => cambiarDescuento(i.id, e.target.value)}
                        className="venta-input-desc"
                      />
                    </td>
                    <td>$ {(i.precio * i.cantidad * (1 - i.descuento / 100)).toLocaleString('es-CO', { maximumFractionDigits: 0 })}</td>
                    <td><button className="peligro" onClick={() => quitar(i.id)}>X</button></td>
                  </tr>
                ))}
                {carrito.length === 0 && (
                  <tr><td colSpan="6" className="venta-tabla-vacia">Carrito vacío</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <div className="tarjeta">
            <div className="venta-resumen-fila">
              <span>Subtotal</span><span>$ {subtotal.toLocaleString('es-CO')}</span>
            </div>
            {totalDescuento > 0 && (
              <div className="venta-resumen-fila venta-resumen-descuento">
                <span>Descuento</span><span>- $ {totalDescuento.toLocaleString('es-CO', { maximumFractionDigits: 0 })}</span>
              </div>
            )}
            <div className="venta-resumen-fila venta-resumen-iva">
              <span>IVA (19%)</span><span>$ {valorIva.toLocaleString('es-CO')}</span>
            </div>
            <h2 className="venta-total">Total: $ {total.toLocaleString('es-CO')}</h2>
            <button className="venta-btn-cobrar" onClick={cobrar} disabled={carrito.length === 0}>
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
