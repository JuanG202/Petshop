import "../styles/Productos.css";
import { useState } from "react";
import Topbar from "./Topbar";
import { getClientes, addCliente, updateCliente, deleteCliente } from "../db";
import "../styles/Cliente.css";

const vacio = { id: "", nombre: "", documento: "", telefono: "" };

export default function Clientes() {
  const [clientes, setClientes] = useState(getClientes());
  const [form, setForm] = useState(vacio);
  const [editando, setEditando] = useState(false);
  const [busqueda, setBusqueda] = useState("");

  function refrescar() {
    setClientes(getClientes());
  }

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.nombre) {
      alert("Ingresa el nombre del cliente");
      return;
    }
    if (editando) {
      updateCliente(form.id, form);
    } else {
      addCliente(form);
    }
    setForm(vacio);
    setEditando(false);
    refrescar();
  }

  function handleEditar(c) {
    setForm(c);
    setEditando(true);
  }

  function handleEliminar(id) {
    if (confirm("¿Eliminar este cliente?")) {
      deleteCliente(id);
      refrescar();
    }
  }

  const filtrados = clientes.filter(
    (c) =>
      c.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      (c.documento || "").toLowerCase().includes(busqueda.toLowerCase()),
  );

  return (
    <div>
      <Topbar titulo="Clientes" />
      <div className="contenedor">
        <div className="tarjeta">
          <h3 className="prod-form-title">
            {editando ? "Editar cliente" : "Nuevo cliente"}
          </h3>
          <form onSubmit={handleSubmit}>
            <div className="grid">
              <div>
                <label>Nombre</label>
                <input
                  name="nombre"
                  value={form.nombre}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <label>NIT / Cédula</label>
                <input
                  name="documento"
                  value={form.documento}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label>Teléfono</label>
                <input
                  name="telefono"
                  value={form.telefono}
                  onChange={handleChange}
                />
              </div>
            </div>
            <div className="prod-form-acciones">
              <button type="submit">
                {editando ? "Guardar cambios" : "➕ Agregar cliente"}
              </button>
              {editando && (
                <button
                  type="button"
                  className="secundario"
                  onClick={() => {
                    setForm(vacio);
                    setEditando(false);
                  }}
                >
                  Cancelar
                </button>
              )}
            </div>
          </form>
        </div>

        <div className="tarjeta">
          <div className="prod-header-flex">
            <h3 className="prod-form-title">Clientes registrados</h3>
            <input
              className="prod-buscador"
              placeholder="Buscar por nombre o documento"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>
          <div className="tabla-scroll">
            <table>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>NIT / Cédula</th>
                  <th>Teléfono</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtrados.map((c) => (
                  <tr key={c.id}>
                    <td>{c.nombre}</td>
                    <td>{c.documento}</td>
                    <td>{c.telefono}</td>
                    <td>
                      <div className="acciones-tabla">
                        <button className="secundario" onClick={() => handleEditar(c)}>
                          Editar
                        </button>
                        <button className="peligro" onClick={() => handleEliminar(c.id)}>
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtrados.length === 0 && (
                  <tr>
                    <td colSpan="4" className="prod-tabla-vacia">
                      Sin clientes registrados
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
