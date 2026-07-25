export const IVA = 0;

const KEYS = {
  productos: 'ps_productos',
  ventas: 'ps_ventas',
  user: 'ps_user',
  caja: 'ps_caja_abierta',
  historialCaja: 'ps_historial_caja',
  consecutivo: 'ps_consecutivo',
  gastos: 'ps_gastos',
  usuarios: 'ps_usuarios',
  clientes: 'ps_clientes',
};

function read(key, def) {
  const raw = localStorage.getItem(key);
  return raw ? JSON.parse(raw) : def;
}
function write(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function getProductos() {
  return read(KEYS.productos, []);
}
export function saveProductos(list) {
  write(KEYS.productos, list);
}
export function addProducto(p) {
  const list = getProductos();
  list.push(p);
  saveProductos(list);
}
export function updateProducto(id, data) {
  const list = getProductos().map((p) => (p.id === id ? { ...p, ...data } : p));
  saveProductos(list);
}
export function deleteProducto(id) {
  saveProductos(getProductos().filter((p) => p.id !== id));
}
export function getProductoPorCodigo(codigo) {
  return getProductos().find((p) => (p.codigos || []).includes(codigo));
}
export function codigoExiste(codigo, idExcluir) {
  return getProductos().some((p) => p.id !== idExcluir && (p.codigos || []).includes(codigo));
}

export function getVentas() {
  return read(KEYS.ventas, []);
}
export function addVenta(venta) {
  const list = getVentas();
  list.push(venta);
  write(KEYS.ventas, list);
}

export function getNextFacturaNumero() {
  const actual = Number(read(KEYS.consecutivo, 0)) + 1;
  write(KEYS.consecutivo, actual);
  return String(actual).padStart(3, '0');
}

function getUsuariosBase() {
  return [
    { usuario: 'admin', clave: 'admin123', rol: 'admin' },
    { usuario: 'vendedora', clave: 'venta123', rol: 'vendedora' },
  ];
}
export function getUsuarios() {
  let list = read(KEYS.usuarios, null);
  if (!list) {
    list = getUsuariosBase();
    write(KEYS.usuarios, list);
  }
  return list;
}
export function saveUsuarios(list) {
  write(KEYS.usuarios, list);
}
export function addUsuario(u) {
  const list = getUsuarios();
  list.push(u);
  saveUsuarios(list);
}
export function deleteUsuario(usuario) {
  saveUsuarios(getUsuarios().filter((u) => u.usuario !== usuario));
}

export function login(usuario, clave) {
  const encontrado = getUsuarios().find((u) => u.usuario === usuario && u.clave === clave);
  if (encontrado) {
    write(KEYS.user, { usuario: encontrado.usuario, rol: encontrado.rol });
    return true;
  }
  return false;
}
export function logout() {
  localStorage.removeItem(KEYS.user);
}
export function getUser() {
  return read(KEYS.user, null);
}

/* ── Caja: apertura y cierre ── */
export function getCajaAbierta() {
  return read(KEYS.caja, null);
}
export function abrirCaja(montoInicial, nota) {
  const caja = {
    timestamp: Date.now(),
    fecha: new Date().toLocaleDateString('es-CO'),
    hora: new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
    montoInicial: Number(montoInicial) || 0,
    nota: nota || '',
  };
  write(KEYS.caja, caja);
  return caja;
}
/* ── Gastos de caja ── */
export function getGastos() {
  return read(KEYS.gastos, []);
}
export function addGasto(gasto) {
  const list = getGastos();
  list.push({
    id: Date.now(),
    timestamp: Date.now(),
    fecha: new Date().toLocaleDateString('es-CO'),
    hora: new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
    concepto: gasto.concepto,
    valor: Number(gasto.valor) || 0,
  });
  write(KEYS.gastos, list);
}
export function getGastosJornada() {
  const caja = getCajaAbierta();
  if (!caja) return [];
  return getGastos().filter((g) => (g.timestamp || 0) >= caja.timestamp);
}

export function cerrarCaja(montoCierre, notaCierre) {
  const caja = getCajaAbierta();
  if (!caja) return null;
  const ventasJornada = getVentas().filter((v) => (v.timestamp || 0) >= caja.timestamp);
  const totalVentas = ventasJornada.reduce((s, v) => s + v.total, 0);
  const gastosJornada = getGastos().filter((g) => (g.timestamp || 0) >= caja.timestamp);
  const totalGastos = gastosJornada.reduce((s, g) => s + g.valor, 0);
  const registro = {
    ...caja,
    cierreTimestamp: Date.now(),
    fechaCierre: new Date().toLocaleDateString('es-CO'),
    horaCierre: new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
    ventas: totalVentas,
    cantidadVentas: ventasJornada.length,
    gastos: totalGastos,
    montoCierre: Number(montoCierre) || 0,
    diferencia: (Number(montoCierre) || 0) - (caja.montoInicial + totalVentas - totalGastos),
    notaCierre: notaCierre || '',
  };
  const historial = read(KEYS.historialCaja, []);
  write(KEYS.historialCaja, [registro, ...historial]);
  localStorage.removeItem(KEYS.caja);
  return registro;
}
export function getHistorialCaja() {
  return read(KEYS.historialCaja, []);
}
export function getVentasJornada() {
  const caja = getCajaAbierta();
  if (!caja) return [];
  return getVentas().filter((v) => (v.timestamp || 0) >= caja.timestamp);
}

/* ── Clientes ── */
export function getClientes() {
  return read(KEYS.clientes, []);
}
export function saveClientes(list) {
  write(KEYS.clientes, list);
}
export function addCliente(c) {
  const list = getClientes();
  const cliente = { id: Date.now(), nombre: c.nombre, documento: c.documento, telefono: c.telefono || '' };
  list.push(cliente);
  saveClientes(list);
  return cliente;
}
export function updateCliente(id, data) {
  const list = getClientes().map((c) => (c.id === id ? { ...c, ...data } : c));
  saveClientes(list);
}
export function deleteCliente(id) {
  saveClientes(getClientes().filter((c) => c.id !== id));
}
export function buscarClientes(termino) {
  const term = (termino || '').trim().toLowerCase();
  if (!term) return [];
  return getClientes().filter(
    (c) => c.nombre.toLowerCase().includes(term) || (c.documento || '').toLowerCase().includes(term)
  );
}
export function getClientePorDocumento(documento) {
  return getClientes().find((c) => c.documento === documento);
}
