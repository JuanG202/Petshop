//RECIBO DE FACTURA ESTRUCTURA

import '../styles/Factura.css'
export default function Factura({ venta, onImprimir }) {
  if (!venta) return null
  const subtotal = venta.subtotal ?? venta.total
  const descuento = venta.descuento ?? 0
  return (
    <div className="tarjeta" id="factura">
      <div className="fac-header">
        <p className="fac-patas">🐾 🐾 🐾</p>
        <p className="fac-tienda">PETSHOP AMIGOS</p>
        <p className="fac-sub">Alimentos y accesorios para tu mascota</p>
      </div>
      <hr className="fac-linea" />
      <div className="fac-fila">
        <span>Factura N°</span>
        <span className="fac-bold">{venta.numeroFactura}</span>
      </div>
      <p className="fac-fecha">{new Date(venta.fecha).toLocaleString('es-CO')}</p>
      {venta.cliente && (
        <div className="fac-cliente">
          <span className="fac-cliente-label">Cliente</span>
          <span className="fac-cliente-nombre">{venta.cliente.nombre}</span>
          {venta.cliente.documento && <span className="fac-cliente-doc">{venta.cliente.documento}</span>}
        </div>
      )}
      <hr className="fac-linea" />
      {venta.items.map((i) => (
        <div key={i.id} className="fac-item">
          <div className="fac-fila">
            <span>{i.nombre}</span>
            <span className="fac-bold">$ {(i.precio * i.cantidad).toLocaleString('es-CO', { maximumFractionDigits: 0 })}</span>
          </div>
          <div className="fac-detalle">
            {i.cantidad} x $ {i.precio.toLocaleString('es-CO')}
          </div>
        </div>
      ))}
      <hr className="fac-linea" />
      <div className="fac-fila">
        <span>Subtotal</span>
        <span>$ {subtotal.toLocaleString('es-CO')}</span>
      </div>
      {descuento > 0 && (
        <div className="fac-fila">
          <span>Descuento</span>
          <span>- $ {descuento.toLocaleString('es-CO', { maximumFractionDigits: 0 })}</span>
        </div>
      )}
      <hr className="fac-linea" />
      <div className="fac-fila fac-total">
        <span>TOTAL</span>
        <span>$ {venta.total.toLocaleString('es-CO')}</span>
      </div>
      {venta.metodoPago && (
        <p className="fac-pago">
          {venta.metodoPago === 'efectivo' && '💵 Pago en efectivo'}
          {venta.metodoPago === 'nequi' && '📲 Pago por Nequi'}
          {venta.metodoPago === 'mixto' &&
            `🔀 Efectivo $ ${(venta.pagoEfectivo || 0).toLocaleString('es-CO')} + Nequi $ ${(venta.pagoNequi || 0).toLocaleString('es-CO')}`}
        </p>
      )}
      <p className="fac-gracias">¡Gracias por su compra!</p>
      <p className="fac-patas">🐾 🐾 🐾</p>
      {onImprimir && (
        <button className="secundario no-print fac-btn-imprimir" onClick={onImprimir}>
          🖨️ Imprimir factura
        </button>
      )}
    </div>
  )
}
