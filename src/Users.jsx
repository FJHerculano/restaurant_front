import { useNavigate, useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { API_URL } from './config'

function Users() {
  const navigate = useNavigate()
  const { restaurantSlug } = useParams()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [filterType, setFilterType] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [modalType, setModalType] = useState('employee')
  const [currentUser, setCurrentUser] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    birth_date: '',
    profile_photo: ''
  })

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    const token = localStorage.getItem('token')
    setLoading(true)
    try {
      const response = await fetch(`${API_URL}/restaurant/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        alert('Erro ao carregar usuários: ' + (data.message || 'Erro desconhecido'))
        return
      }
      
      const data = await response.json()
      setUsers(data.data.filter(user => user.type_id !== 1))
    } catch (err) {
      console.error('Erro ao buscar usuários:', err)
      alert('Erro ao buscar usuários. Verifique se a API está rodando.')
    } finally {
      setLoading(false)
    }
  }

  const openCreateModal = (type) => {
    setModalType(type)
    setCurrentUser(null)
    setFormData({
      name: '',
      email: '',
      phone: '',
      password: '',
      birth_date: '',
      profile_photo: ''
    })
    setShowModal(true)
  }

  const openEditModal = (user) => {
    setCurrentUser(user)
    setModalType(user.type_id === 3 ? 'employee' : 'client')
    setFormData({
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      password: '',
      birth_date: user.birth_date || '',
      profile_photo: user.profile_photo || ''
    })
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const token = localStorage.getItem('token')
    const restaurantId = localStorage.getItem('restaurantId')
    
    if (!restaurantId) {
      alert('❌ Erro: ID do restaurante não encontrado. Faça login novamente.')
      return
    }
    
    let endpoint, method, dataToSend, headers
    
    if (currentUser) {
      endpoint = `/restaurant/users/${currentUser.id}`
      method = 'PUT'
      headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
      dataToSend = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone
      }
      if (formData.password) dataToSend.password = formData.password
      if (modalType === 'employee') {
        if (formData.birth_date) dataToSend.birth_date = formData.birth_date
        if (formData.profile_photo) dataToSend.profile_photo = formData.profile_photo
      }
    } else {
      if (modalType === 'employee') {
        endpoint = '/restaurant/users/employees'
        headers = {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
        dataToSend = {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
          restaurant_id: parseInt(restaurantId)
        }
        if (formData.birth_date) dataToSend.birth_date = formData.birth_date
        if (formData.profile_photo) dataToSend.profile_photo = formData.profile_photo
      } else {
        endpoint = '/auth/register'
        headers = { 'Content-Type': 'application/json' }
        dataToSend = {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
          restaurant_id: parseInt(restaurantId),
          type_id: 4
        }
      }
      method = 'POST'
    }
    
    setLoading(true)
    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method,
        headers,
        body: JSON.stringify(dataToSend)
      })
      
      const data = await response.json().catch(() => ({}))
      
      if (!response.ok) {
        if (response.status === 400 && data.message) {
          if (data.message.includes('Email already')) {
            alert('❌ Erro: Este email já está cadastrado no sistema!')
          } else if (data.message.includes('already in use')) {
            alert('❌ Erro: Este email já está sendo usado por outro usuário!')
          } else {
            alert('❌ Erro: ' + data.message)
          }
        } else {
          alert('❌ Erro ao salvar: ' + (data.message || 'Erro desconhecido'))
        }
        return
      }
      
      alert('✅ ' + (currentUser ? 'Usuário atualizado com sucesso!' : 'Usuário cadastrado com sucesso!'))
      setShowModal(false)
      fetchUsers()
    } catch (err) {
      console.error('Erro ao salvar:', err)
      alert('❌ Erro ao salvar: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (user) => {
    if (!window.confirm(`Tem certeza que deseja excluir ${user.name}?`)) return
    
    const token = localStorage.getItem('token')
    setLoading(true)
    
    try {
      const response = await fetch(`${API_URL}/restaurant/users/${user.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        alert('Erro ao excluir: ' + (data.message || 'Erro desconhecido'))
        return
      }
      
      alert('Usuário excluído com sucesso!')
      fetchUsers()
    } catch (err) {
      console.error('Erro ao deletar:', err)
      alert('Erro ao excluir: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const getFilteredUsers = () => {
    if (!filterType) return users
    return users.filter(user => user.type_id === parseInt(filterType))
  }

  const getUserTypeName = (typeId) => {
    const types = { 2: 'Admin', 3: 'Funcionário', 4: 'Cliente' }
    return types[typeId] || 'Desconhecido'
  }

  return (
    <div className="min-vh-100 bg-light">
      <nav className="navbar navbar-expand-lg navbar-dark bg-primary">
        <div className="container">
          <span className="navbar-brand">Gerenciar Usuários</span>
          <button className="btn btn-outline-light" onClick={() => navigate(`/${restaurantSlug}/dashboard`)}>
            Voltar
          </button>
        </div>
      </nav>

      <div className="container mt-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h4>Usuários</h4>
          <div>
            <button className="btn btn-primary me-2" onClick={() => openCreateModal('employee')} disabled={loading}>
              + Funcionário
            </button>
            <button className="btn btn-success" onClick={() => openCreateModal('client')} disabled={loading}>
              + Cliente
            </button>
          </div>
        </div>

        <div className="row mb-3">
          <div className="col-md-4">
            <label className="form-label">Filtrar por Tipo</label>
            <select 
              className="form-select" 
              value={filterType} 
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="">Todos</option>
              <option value="2">Admin</option>
              <option value="3">Funcionário</option>
              <option value="4">Cliente</option>
            </select>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Carregando...</span>
                </div>
              </div>
            ) : (
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Nome</th>
                    <th>Email</th>
                    <th>Telefone</th>
                    <th>Tipo</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {getFilteredUsers().map(user => (
                    <tr key={user.id}>
                      <td>{user.id}</td>
                      <td>{user.name}</td>
                      <td>{user.email}</td>
                      <td>{user.phone || '-'}</td>
                      <td>
                        <span className={`badge ${user.type_id === 2 ? 'bg-danger' : user.type_id === 3 ? 'bg-primary' : 'bg-success'}`}>
                          {getUserTypeName(user.type_id)}
                        </span>
                      </td>
                      <td>
                        <button className="btn btn-sm btn-warning me-1" onClick={() => openEditModal(user)}>
                          Editar
                        </button>
                        <button className="btn btn-sm btn-danger" onClick={() => handleDelete(user)}>
                          Excluir
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {getFilteredUsers().length === 0 && !loading && (
              <p className="text-center text-muted">Nenhum usuário encontrado</p>
            )}
          </div>
        </div>
      </div>

      {showModal && (
        <div className="modal show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {currentUser ? 'Editar' : 'Cadastrar'} {modalType === 'employee' ? 'Funcionário' : 'Cliente'}
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Nome *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      required
                    />
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label">Email *</label>
                    <input
                      type="email"
                      className="form-control"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      required
                    />
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label">Telefone *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      required
                    />
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label">Senha {currentUser && '(deixe em branco para não alterar)'}</label>
                    <input
                      type="password"
                      className="form-control"
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      required={!currentUser}
                    />
                  </div>
                  
                  {modalType === 'employee' && (
                    <>
                      <div className="mb-3">
                        <label className="form-label">Data de Nascimento</label>
                        <input
                          type="date"
                          className="form-control"
                          value={formData.birth_date}
                          onChange={(e) => setFormData({...formData, birth_date: e.target.value})}
                        />
                      </div>
                      
                      <div className="mb-3">
                        <label className="form-label">Foto de Perfil (URL)</label>
                        <input
                          type="text"
                          className="form-control"
                          value={formData.profile_photo}
                          onChange={(e) => setFormData({...formData, profile_photo: e.target.value})}
                          placeholder="https://exemplo.com/foto.jpg"
                        />
                      </div>
                    </>
                  )}
                </div>
                
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? 'Salvando...' : currentUser ? 'Salvar' : 'Cadastrar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Users
