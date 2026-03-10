import { useNavigate, useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { API_URL } from './config'

function Home() {
  const navigate = useNavigate()
  const { restaurantSlug } = useParams()
  const [services, setServices] = useState([])
  const [permissions, setPermissions] = useState([])
  const [restaurant, setRestaurant] = useState(null)
  const [userTypeId, setUserTypeId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchServices()
  }, [])

  const fetchServices = async () => {
    try {
      const token = localStorage.getItem('token')
      console.log('Token:', token)
      console.log('Slug:', restaurantSlug)
      
      const response = await fetch(`${API_URL}/restaurant/${restaurantSlug}/services`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      console.log('Response status:', response.status)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('Erro da API:', errorData)
        setError('Erro ao carregar serviços')
        setLoading(false)
        return
      }
      
      const data = await response.json()
      console.log('Dados recebidos:', data)
      setRestaurant(data.restaurant)
      setServices(data.services)
      setPermissions(data.permissions)
      setUserTypeId(data.user?.type_id)
      setLoading(false)
    } catch (err) {
      console.error('Erro na requisição:', err)
      setError('Erro ao conectar com o servidor')
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('restaurantSlug')
    navigate(`/${restaurantSlug}/login`)
  }

  const hasService = (serviceName) => {
    return services.some(service => service.name === serviceName)
  }

  const hasPermission = (permissionName) => {
    return permissions.some(permission => permission.name === permissionName)
  }

  const isAdmin = () => {
    return userTypeId === 2
  }

  return (
    <div className="min-vh-100 bg-light">
      <nav className="navbar navbar-expand-lg navbar-dark bg-primary">
        <div className="container">
          <span className="navbar-brand">
            {restaurant ? restaurant.name : 'Restaurant Dashboard'}
          </span>
          <div>
            {(hasPermission('padrao_podeDashboard') || isAdmin()) && (
              <button className="btn btn-outline-light me-2" onClick={() => navigate(`/${restaurantSlug}/dashboard`)}>Dashboard</button>
            )}
            <button className="btn btn-outline-light me-2" onClick={() => navigate(`/${restaurantSlug}/products`)}>Produtos</button>
            <button className="btn btn-outline-light" onClick={handleLogout}>Sair</button>
          </div>
        </div>
      </nav>
      
      <div className="container mt-5">
        {loading && (
          <div className="text-center">
            <div className="spinner-border" role="status">
              <span className="visually-hidden">Carregando...</span>
            </div>
          </div>
        )}
        
        {error && <div className="alert alert-danger">{error}</div>}
        
        {!loading && !error && (
          <div className="d-flex justify-content-center align-items-center" style={{minHeight: '60vh'}}>
            <div className="row g-4" style={{maxWidth: '800px'}}>
              {hasService('Garçom') && (hasPermission('padrao_podeAtender') || isAdmin()) && (
                <div className="col-md-6">
                  <button className="btn btn-primary btn-lg w-100 p-4">
                    Garçom
                  </button>
                </div>
              )}
              
              {hasService('Delivery') && (hasPermission('padrao_podeDelivery') || isAdmin()) && (
                <div className="col-md-6">
                  <button className="btn btn-primary btn-lg w-100 p-4">
                    Delivery
                  </button>
                </div>
              )}
              
              {hasService('Presencial') && (hasPermission('padrao_podeMesa') || isAdmin()) && (
                <div className="col-md-6">
                  <button className="btn btn-primary btn-lg w-100 p-4">
                    Presencial
                  </button>
                </div>
              )}
              
              {hasService('Fidelidade') && (hasPermission('padrao_podeFidelidade') || isAdmin()) && (
                <div className="col-md-6">
                  <button className="btn btn-primary btn-lg w-100 p-4">
                    Fidelidade
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Home
