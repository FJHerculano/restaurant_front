import { useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { API_URL } from './config'

function Register() {
  const navigate = useNavigate()
  const { restaurantSlug } = useParams()
  const [formData, setFormData] = useState({ 
    name: '', 
    email: '', 
    phone: '', 
    password: '',
    birth_date: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    
    try {
      const restaurantResponse = await fetch(`${API_URL}/restaurant/${restaurantSlug}/info`)
      
      if (!restaurantResponse.ok) {
        setError('Restaurante não encontrado')
        setLoading(false)
        return
      }
      
      const restaurantData = await restaurantResponse.json()
      const restaurant_id = restaurantData.data.id
      
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
          birth_date: formData.birth_date || undefined,
          restaurant_id
        })
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        setError(data.message || 'Erro ao fazer cadastro')
        setLoading(false)
        return
      }
      
      localStorage.setItem('token', data.data.token)
      localStorage.setItem('restaurantSlug', restaurantSlug)
      navigate(`/${restaurantSlug}/home`)
    } catch (err) {
      setError('Erro ao conectar com o servidor')
      setLoading(false)
    }
  }

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
      <div className="card shadow" style={{width: '450px'}}>
        <div className="card-body p-4">
          <h3 className="text-center mb-4">Criar Conta</h3>
          
          {error && <div className="alert alert-danger">{error}</div>}
          
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label">Nome Completo</label>
              <input 
                type="text" 
                className="form-control" 
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required
                minLength={3}
              />
            </div>
            
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
              <label className="form-label">Telefone</label>
              <input 
                type="tel" 
                className="form-control" 
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                required
                minLength={10}
                placeholder="(88) 99999-9999"
              />
            </div>
            
            <div className="mb-3">
              <label className="form-label">Data de Nascimento (opcional)</label>
              <input 
                type="date" 
                className="form-control" 
                value={formData.birth_date}
                onChange={(e) => setFormData({...formData, birth_date: e.target.value})}
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
                minLength={6}
              />
            </div>
            
            <button type="submit" className="btn btn-primary w-100" disabled={loading}>
              {loading ? 'Cadastrando...' : 'Cadastrar'}
            </button>
          </form>
          
          <div className="text-center mt-3">
            <Link to={`/${restaurantSlug}/login`} className="text-decoration-none">
              Já tem conta? Faça login
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Register
