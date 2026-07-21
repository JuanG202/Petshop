import '../styles/Login.css'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login } from '../db'

export default function Login() {
  const [usuario, setUsuario] = useState('')
  const [clave, setClave] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  function handleSubmit(e) {
    e.preventDefault()
    if (login(usuario, clave)) {
      navigate('/panel')
    } else {
      setError('Usuario o clave incorrectos')
    }
  }

  return (
    <div className="login-fondo">
      <div className="huellas-fondo">
        <span className="login-huella login-huella-1">🐾</span>
        <span className="login-huella login-huella-2">🐾</span>
        <span className="login-huella login-huella-3">🐾</span>
        <span className="login-huella login-huella-4">🐾</span>
        <span className="login-huella login-huella-5">🐾</span>
      </div>
      <form onSubmit={handleSubmit} className="tarjeta login-form">
        <div className="login-encabezado">
          <div className="login-icono">🐾</div>
          <h2 className="login-titulo">PetShop Amigos</h2>
          <p className="login-subtitulo">Punto de venta</p>
        </div>
        <div className="login-campo">
          <label>Usuario</label>
          <input value={usuario} onChange={(e) => setUsuario(e.target.value)} required />
        </div>
        <div className="login-campo">
          <label>Clave</label>
          <input type="password" value={clave} onChange={(e) => setClave(e.target.value)} required />
        </div>
        {error && <p className="login-error">{error}</p>}
        <button type="submit" className="login-btn">Entrar</button>
        <p className="login-nota">usuario: admin / clave: admin123</p>
      </form>
    </div>
  )
}
