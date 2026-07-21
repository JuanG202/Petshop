export const IVA = 0.19;

const KEYS = {
  productos: 'ps_productos',
  ventas: 'ps_ventas',
  user: 'ps_user',
  caja: 'ps_caja_abierta',
  historialCaja: 'ps_historial_caja',
  consecutivo: 'ps_consecutivo',
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

export function login(usuario, clave) {
  if (usuario === 'admin' && clave === 'admin123') {
    write(KEYS.user, { usuario: 'admin' });
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
export function cerrarCaja(montoCierre, notaCierre) {
  const caja = getCajaAbierta();
  if (!caja) return null;
  const ventasJornada = getVentas().filter((v) => (v.timestamp || 0) >= caja.timestamp);
  const totalVentas = ventasJornada.reduce((s, v) => s + v.total, 0);
  const registro = {
    ...caja,
    cierreTimestamp: Date.now(),
    fechaCierre: new Date().toLocaleDateString('es-CO'),
    horaCierre: new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
    ventas: totalVentas,
    cantidadVentas: ventasJornada.length,
    montoCierre: Number(montoCierre) || 0,
    diferencia: (Number(montoCierre) || 0) - (caja.montoInicial + totalVentas),
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
