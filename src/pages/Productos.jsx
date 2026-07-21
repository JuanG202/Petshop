import '../styles/Productos.css'
import { useState } from 'react'
import Topbar from './Topbar'
import { getProductos, addProducto, updateProducto, deleteProducto, codigoExiste } from '../db'

const vacio = { id: '', codigos: [], nombre: '', categoria: 'Alimento', precio: '', costo: '', stock: '', stockMinimo: 5 }

function formatMiles(valor) {
  const limpio = String(valor).replace(/\D/g, '')
  return limpio ? new Intl.NumberFormat('es-CO').format(limpio) : ''
}
function soloNumero(valor) {
  return Number(String(valor).replace(/\./g, '')) || 0
}

export default function Productos() {
  const [productos, setProductos] = useState(getProductos())
  const [form, setForm] = useState(vacio)
  const [codigoNuevo, setCodigoNuevo] = useState('')
  const [editando, setEditando] = useState(false)
  const [busqueda, setBusqueda] = useState('')
  const [vista, setVista] = useState('inventario') // inventario | precios

  function refrescar() {
    setProductos(getProductos())
  }

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  function handlePrecio(e) {
    setForm({ ...form, [e.target.name]: formatMiles(e.target.value) })
  }

  function agregarCodigo() {
    const c = codigoNuevo.trim()
    if (!c) return
    if (codigoExiste(c, form.id) || form.codigos.includes(c)) {
      alert('Ese código de barras ya está en uso')
      return
    }
    setForm({ ...form, codigos: [...form.codigos, c] })
    setCodigoNuevo('')
  }

  function quitarCodigo(c) {
    setForm({ ...form, codigos: form.codigos.filter((x) => x !== c) })
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!form.nombre || !form.precio || !form.stock || form.codigos.length === 0) {
      alert('Completa nombre, precio, stock y al menos un código de barras')
      return
    }

    const datos = {
      ...form,
      precio: soloNumero(form.precio),
      costo: soloNumero(form.costo),
      id: form.id || 'p' + Date.now(),
    }

    if (editando) {
      updateProducto(form.id, datos)
    } else {
      addProducto(datos)
    }
    setForm(vacio)
    setCodigoNuevo('')
    setEditando(false)
    refrescar()
  }

  function handleEditar(p) {
    setForm({ ...p, precio: formatMiles(p.precio), costo: formatMiles(p.costo), codigos: p.codigos || [] })
    setEditando(true)
  }

  function handleEliminar(id) {
    if (confirm('¿Eliminar este producto?')) {
      deleteProducto(id)
      refrescar()
    }
  }

  const filtrados = productos.filter(
    (p) =>
      p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      (p.codigos || []).some((c) => c.includes(busqueda))
  )

  return (
    <div>
      <Topbar titulo="Inventario" />
      <div className="contenedor">

        <div className="prod-tabs">
          <button className={vista === 'inventario' ? '' : 'secundario'} onClick={() => setVista('inventario')}>📦 Inventario</button>
          <button className={vista === 'precios' ? '' : 'secundario'} onClick={() => setVista('precios')}>🏷️ Lista de precios</button>
        </div>

        {vista === 'inventario' && (
          <>
            <div className="tarjeta">
              <h3 className="prod-form-title">{editando ? 'Editar producto' : 'Agregar producto'}</h3>
              <form onSubmit={handleSubmit}>
                <div className="grid">
                  <div>
                    <label>Nombre</label>
                    <input name="nombre" value={form.nombre} onChange={handleChange} placeholder="Ej: Concentrado Perro Adulto" required />
                  </div>
                  <div>
                    <label>Categoría</label>
                    <select name="categoria" value={form.categoria} onChange={handleChange}>
                      <option>Alimento</option>
                      <option>Accesorio</option>
                      <option>Higiene</option>
                      <option>Medicina</option>
                      <option>Otro</option>
                    </select>
                  </div>
                  <div>
                    <label>Precio de venta (sin IVA)</label>
                    <input name="precio" value={form.precio} onChange={handlePrecio} placeholder="Ej: 45.000" inputMode="numeric" required />
                  </div>
                  <div>
                    <label>Costo</label>
                    <input name="costo" value={form.costo} onChange={handlePrecio} placeholder="Ej: 30.000" inputMode="numeric" />
                  </div>
                  <div>
                    <label>Stock</label>
                    <input type="number" name="stock" value={form.stock} onChange={handleChange} required />
                  </div>
                  <div>
                    <label>Stock mínimo</label>
                    <input type="number" name="stockMinimo" value={form.stockMinimo} onChange={handleChange} />
                  </div>
                </div>

                <div className="prod-codigos-block">
                  <label>Códigos de barras (puede tener varios, ej. distintas presentaciones)</label>
                  <div className="prod-codigo-input-row">
                    <input
                      value={codigoNuevo}
                      onChange={(e) => setCodigoNuevo(e.target.value)}
                      placeholder="Escanear o escribir código"
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); agregarCodigo() } }}
                    />
                    <button type="button" className="secundario" onClick={agregarCodigo}>+ Agregar</button>
                  </div>
                  <div className="prod-codigos-lista">
                    {form.codigos.map((c) => (
                      <span key={c} className="prod-codigo-chip">
                        {c}
                        <span className="prod-codigo-quitar" onClick={() => quitarCodigo(c)}>×</span>
                      </span>
                    ))}
                    {form.codigos.length === 0 && <span className="prod-sin-codigos">Sin códigos agregados</span>}
                  </div>
                </div>

                <div className="prod-form-acciones">
                  <button type="submit">{editando ? 'Guardar cambios' : 'Agregar producto'}</button>
                  {editando && (
                    <button type="button" className="secundario" onClick={() => { setForm(vacio); setCodigoNuevo(''); setEditando(false) }}>
                      Cancelar
                    </button>
                  )}
                </div>
              </form>
            </div>

            <div className="tarjeta">
              <input
                placeholder="Buscar por nombre o código..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="prod-buscador"
              />
              <table>
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Categoría</th>
                    <th>Códigos</th>
                    <th>Precio</th>
                    <th>Stock</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filtrados.map((p) => (
                    <tr key={p.id}>
                      <td>{p.nombre}</td>
                      <td>{p.categoria}</td>
                      <td className="prod-tabla-codigos">{(p.codigos || []).join(', ')}</td>
                      <td>$ {Number(p.precio).toLocaleString('es-CO')}</td>
                      <td className={Number(p.stock) <= Number(p.stockMinimo || 5) ? 'prod-stock-bajo' : 'prod-stock-ok'}>
                        {p.stock}
                      </td>
                      <td>
                        <button className="secundario prod-btn-editar" onClick={() => handleEditar(p)}>Editar</button>
                        <button className="peligro" onClick={() => handleEliminar(p.id)}>Eliminar</button>
                      </td>
                    </tr>
                  ))}
                  {filtrados.length === 0 && (
                    <tr><td colSpan="6" className="prod-tabla-vacia">Sin productos</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {vista === 'precios' && (
          <div className="tarjeta">
            <h3 className="prod-form-title">Lista de precios (IVA 19% incluido)</h3>
            <table>
              <thead>
                <tr><th>Producto</th><th>Categoría</th><th>Precio sin IVA</th><th>IVA (19%)</th><th>Precio final</th></tr>
              </thead>
              <tbody>
                {productos.map((p) => {
                  const iva = Math.round(p.precio * 0.19)
                  return (
                    <tr key={p.id}>
                      <td>{p.nombre}</td>
                      <td>{p.categoria}</td>
                      <td>$ {Number(p.precio).toLocaleString('es-CO')}</td>
                      <td>$ {iva.toLocaleString('es-CO')}</td>
                      <td className="prod-precio-final">$ {(p.precio + iva).toLocaleString('es-CO')}</td>
                    </tr>
                  )
                })}
                {productos.length === 0 && (
                  <tr><td colSpan="5" className="prod-tabla-vacia">Sin productos</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
