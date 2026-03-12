import { useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { API_URL } from './config'

function Login() {
  const navigate = useNavigate()
  const { restaurantSlug } = useParams()
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    
    try {
      console.log('Slug capturado:', restaurantSlug)
      const restaurantResponse = await fetch(`${API_URL}/restaurant/${restaurantSlug}/info`)
      
      if (!restaurantResponse.ok) {
        setError('Restaurante não encontrado')
        setLoading(false)
        return
      }
      
      const restaurantData = await restaurantResponse.json()
      const restaurant_id = restaurantData.data.id
      
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          restaurant_id
        })
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        setError(data.message || 'Erro ao fazer login')
        setLoading(false)
        return
      }
      
      localStorage.setItem('token', data.data.token)
      localStorage.setItem('restaurantSlug', restaurantSlug)
      localStorage.setItem('restaurantId', data.data.user.restaurant_id)
      navigate(`/${restaurantSlug}/home`)
    } catch (err) {
      setError('Erro ao conectar com o servidor')
      setLoading(false)
    }
  }

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
      <div className="card shadow" style={{width: '400px'}}>
        <div className="card-body p-4">
          <h3 className="text-center mb-4">Login</h3>
          
          {error && <div className="alert alert-danger">{error}</div>}
          
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label">Email</label>
              <input 
                type="email" 
                className="form-control" 
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                required
              />
            </div>
            
            <div className="mb-3">
              <label className="form-label">Senha</label>
              <input 
                type="password" 
                className="form-control" 
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                required
              />
            </div>
            
            <button type="submit" className="btn btn-primary w-100" disabled={loading}>
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
          
          <div className="text-center mt-3">
            <Link to={`/${restaurantSlug}/cadastro`} className="text-decoration-none">
              Não tem conta? Cadastre-se
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
