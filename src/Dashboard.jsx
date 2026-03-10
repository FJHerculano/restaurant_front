import { useNavigate, useParams } from 'react-router-dom'

function Dashboard() {
  const navigate = useNavigate()
  const { restaurantSlug } = useParams()

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('restaurantSlug')
    navigate(`/${restaurantSlug}/login`)
  }

  const handleBack = () => {
    navigate(`/${restaurantSlug}/home`)
  }

  return (
    <div className="min-vh-100 bg-light">
      <nav className="navbar navbar-expand-lg navbar-dark bg-primary">
        <div className="container">
          <span className="navbar-brand">Dashboard</span>
          <div>
            <button className="btn btn-outline-light me-2" onClick={handleBack}>Voltar</button>
            <button className="btn btn-outline-light" onClick={handleLogout}>Sair</button>
          </div>
        </div>
      </nav>
      
      <div className="container mt-5">
        <div className="d-flex justify-content-center align-items-center" style={{minHeight: '60vh'}}>
          <div className="row g-4" style={{maxWidth: '800px'}}>
            <div className="col-md-6">
              <button className="btn btn-primary btn-lg w-100 p-4" onClick={() => navigate(`/${restaurantSlug}/products`)}>
                Gerir Produtos
              </button>
            </div>
            <div className="col-md-6">
              <button className="btn btn-primary btn-lg w-100 p-4">
                Gerir Usuários
              </button>
            </div>
            <div className="col-md-6">
              <button className="btn btn-primary btn-lg w-100 p-4">
                Gerir Pedidos
              </button>
            </div>
            <div className="col-md-6">
              <button className="btn btn-primary btn-lg w-100 p-4">
                Gerir Clientes
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
