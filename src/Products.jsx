import { useNavigate, useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { API_URL } from './config'

function Products() {
  const navigate = useNavigate()
  const { restaurantSlug } = useParams()
  const [activeTab, setActiveTab] = useState('products')
  
  const [measures, setMeasures] = useState([])
  const [additionals, setAdditionals] = useState([])
  const [variations, setVariations] = useState([])
  const [flavors, setFlavors] = useState([])
  const [categories, setCategories] = useState([])
  const [products, setProducts] = useState([])
  const [categoryAdditionals, setCategoryAdditionals] = useState([])
  const [loading, setLoading] = useState(false)
  const [filterCategory, setFilterCategory] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [showAdditionalsModal, setShowAdditionalsModal] = useState(false)
  const [showEditAdditionalModal, setShowEditAdditionalModal] = useState(false)
  const [editingAdditional, setEditingAdditional] = useState(null)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [modalType, setModalType] = useState('create')
  const [currentItem, setCurrentItem] = useState(null)
  const [formData, setFormData] = useState({ name: '', is_active: true })
  const [productFormData, setProductFormData] = useState({
    name: '',
    description: '',
    category_id: '',
    measure_id: '',
    is_active: true,
    variation_prices: [],
    flavor_ids: []
  })

  useEffect(() => {
    fetchData()
    if (activeTab === 'products') {
      fetchAllData()
      fetchCategoryAdditionals()
    }
  }, [activeTab])

  const fetchAllData = async () => {
    const token = localStorage.getItem('token')
    setLoading(true)
    try {
      const [measuresRes, additionalsRes, variationsRes, flavorsRes, categoriesRes] = await Promise.all([
        fetch(`${API_URL}/product-measures`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_URL}/additionals`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_URL}/variations`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_URL}/flavors`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_URL}/categories`, { headers: { 'Authorization': `Bearer ${token}` } })
      ])
      
      // Verificar se todas as respostas são OK
      if (!measuresRes.ok || !additionalsRes.ok || !variationsRes.ok || !flavorsRes.ok || !categoriesRes.ok) {
        console.error('Erro em uma ou mais requisições')
        alert('Erro ao carregar dados auxiliares. Verifique se a API está rodando.')
        return
      }
      
      const [measuresData, additionalsData, variationsData, flavorsData, categoriesData] = await Promise.all([
        measuresRes.json(),
        additionalsRes.json(),
        variationsRes.json(),
        flavorsRes.json(),
        categoriesRes.json()
      ])
      
      setMeasures(measuresData.data || [])
      setAdditionals(additionalsData.data || [])
      setVariations(variationsData.data || [])
      setFlavors(flavorsData.data || [])
      setCategories(categoriesData.data || [])
    } catch (err) {
      console.error('Erro ao buscar dados auxiliares:', err)
      alert('Erro ao conectar com a API. Verifique se o servidor está rodando.')
    } finally {
      setLoading(false)
    }
  }

  const fetchData = async () => {
    const token = localStorage.getItem('token')
    const endpoints = {
      measures: '/product-measures',
      additionals: '/additionals',
      variations: '/variations',
      flavors: '/flavors',
      categories: '/categories',
      products: '/products'
    }
    
    setLoading(true)
    try {
      const response = await fetch(`${API_URL}${endpoints[activeTab]}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        alert('Erro ao carregar dados: ' + (data.message || 'Erro desconhecido'))
        return
      }
      
      switch(activeTab) {
        case 'measures': setMeasures(data.data); break
        case 'additionals': setAdditionals(data.data); break
        case 'variations': setVariations(data.data); break
        case 'flavors': setFlavors(data.data); break
        case 'categories': setCategories(data.data); break
        case 'products': setProducts(data.data); break
      }
    } catch (err) {
      console.error('Erro ao buscar dados:', err)
      alert('Erro ao buscar dados: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const getCurrentData = () => {
    switch(activeTab) {
      case 'measures': return measures
      case 'additionals': return additionals
      case 'variations': return variations
      case 'flavors': return flavors
      case 'categories': return categories
      case 'products': return products
      default: return []
    }
  }

  const getEndpoint = () => {
    const endpoints = {
      measures: '/product-measures',
      additionals: '/additionals',
      variations: '/variations',
      flavors: '/flavors',
      categories: '/categories',
      products: '/products'
    }
    return endpoints[activeTab]
  }

  const openCreateModal = () => {
    setModalType('create')
    if (activeTab === 'products') {
      setProductFormData({
        name: '',
        description: '',
        category_id: '',
        measure_id: '',
        is_active: true,
        variation_prices: [],
        flavor_ids: []
      })
    } else {
      setFormData({ name: '', is_active: true })
    }
    setCurrentItem(null)
    setShowModal(true)
  }

  const openEditModal = async (item) => {
    setModalType('edit')
    if (activeTab === 'products') {
      const token = localStorage.getItem('token')
      setLoading(true)
      try {
        const pricesRes = await fetch(`${API_URL}/products/${item.id}/variation-prices`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        
        const pricesData = await pricesRes.json()
        
        // Encontrar o sabor pelo nome do produto
        const matchingFlavor = flavors.find(f => f.name === item.name)
        
        setProductFormData({
          name: item.name,
          description: item.description || '',
          category_id: item.category_id,
          measure_id: item.measure_id,
          is_active: item.is_active ?? true,
          variation_prices: pricesData.data.map(vp => ({
            variation_id: vp.variation_id,
            price: parseFloat(vp.price)
          })) || [],
          flavor_ids: matchingFlavor ? [matchingFlavor.id] : []
        })
      } catch (err) {
        console.error('Erro ao buscar dados do produto:', err)
        const matchingFlavor = flavors.find(f => f.name === item.name)
        setProductFormData({
          name: item.name,
          description: item.description || '',
          category_id: item.category_id,
          measure_id: item.measure_id,
          is_active: item.is_active ?? true,
          variation_prices: [],
          flavor_ids: matchingFlavor ? [matchingFlavor.id] : []
        })
      } finally {
        setLoading(false)
      }
    } else {
      setFormData({ name: item.name, is_active: item.is_active ?? true })
    }
    setCurrentItem(item)
    setShowModal(true)
  }

  const openDeleteModal = (item) => {
    setModalType('delete')
    setCurrentItem(item)
    setShowModal(true)
  }

  const openAdditionalsModal = async (product) => {
    const token = localStorage.getItem('token')
    setLoading(true)
    try {
      // Buscar adicionais cadastrados para este produto
      const response = await fetch(`${API_URL}/products/${product.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      
      // Buscar preços dos adicionais por categoria
      const pricesResponse = await fetch(`${API_URL}/category-additionals`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const pricesData = await pricesResponse.json()
      
      // Filtrar preços desta categoria
      const categoryPrices = pricesData.data.filter(
        p => p.category_id === product.category_id
      )
      
      // Mapear para o formato esperado
      const formattedPrices = categoryPrices.map(p => ({
        category_id: p.category_id,
        variation_id: p.variation_id,
        additional_id: p.additional_id,
        price: parseFloat(p.price)
      }))
      
      // Extrair IDs únicos dos adicionais
      const additionalIds = [...new Set(categoryPrices.map(p => p.additional_id))]
      
      setSelectedProduct({
        ...product,
        additional_ids: additionalIds,
        category_variation_additional_prices: formattedPrices
      })
    } catch (err) {
      console.error('Erro ao buscar adicionais:', err)
      setSelectedProduct({
        ...product,
        additional_ids: [],
        category_variation_additional_prices: []
      })
    } finally {
      setLoading(false)
    }
    setShowAdditionalsModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const token = localStorage.getItem('token')
    const endpoint = getEndpoint()
    let dataToSend = activeTab === 'products' ? productFormData : formData
    
    // Validações para produtos
    if (activeTab === 'products') {
      if (!categories.length || !measures.length || !variations.length || !flavors.length) {
        alert('Erro: Cadastre primeiro as categorias, medidas, variações e sabores!')
        return
      }
      if (!productFormData.category_id || !productFormData.measure_id) {
        alert('Erro: Selecione categoria e medida!')
        return
      }
      if (!productFormData.flavor_ids.length) {
        alert('Erro: Selecione um sabor!')
        return
      }
      if (!productFormData.variation_prices.length || productFormData.variation_prices.length !== variations.length) {
        alert('Erro: Defina os preços para todas as variações!')
        return
      }
      
      // Garantir que os preços estão no formato correto
      dataToSend = {
        name: productFormData.name,
        description: productFormData.description || '',
        category_id: parseInt(productFormData.category_id),
        measure_id: parseInt(productFormData.measure_id),
        is_active: productFormData.is_active,
        flavor_ids: productFormData.flavor_ids,
        variation_prices: productFormData.variation_prices.map(vp => ({
          variation_id: parseInt(vp.variation_id),
          price: parseFloat(vp.price) || 0
        }))
      }
      
      console.log('Dados do produto a enviar:', dataToSend)
    }
    
    setLoading(true)
    try {
      if (modalType === 'create') {
        const response = await fetch(`${API_URL}${endpoint}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(dataToSend)
        })
        
        const data = await response.json()
        
        if (!response.ok) {
          alert('Erro ao cadastrar: ' + (data.message || 'Erro desconhecido'))
          return
        }
      } else if (modalType === 'edit') {
        console.log('Editando produto - Payload:', JSON.stringify(dataToSend, null, 2))
        
        const response = await fetch(`${API_URL}${endpoint}/${currentItem.id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(dataToSend)
        })
        
        const data = await response.json()
        console.log('Resposta da API:', data)
        
        if (!response.ok) {
          alert('Erro ao editar: ' + (data.message || 'Erro desconhecido'))
          return
        }
        
        alert('Produto editado com sucesso!')
      }
      
      setShowModal(false)
      fetchData()
    } catch (err) {
      console.error('Erro ao salvar:', err)
      alert('Erro ao salvar: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    const token = localStorage.getItem('token')
    const endpoint = getEndpoint()
    setLoading(true)
    
    try {
      const response = await fetch(`${API_URL}${endpoint}/${currentItem.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        alert('Erro ao excluir: ' + (data.message || 'Erro desconhecido'))
        return
      }
      
      alert('Excluído com sucesso!')
      setShowModal(false)
      fetchData()
    } catch (err) {
      console.error('Erro ao deletar:', err)
      alert('Erro ao excluir: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const getFilteredProducts = () => {
    return products.filter(product => {
      const matchCategory = !filterCategory || product.category_id === parseInt(filterCategory)
      const matchStatus = !filterStatus || (filterStatus === 'active' ? product.is_active : !product.is_active)
      return matchCategory && matchStatus
    })
  }

  const openEditAdditionalModal = (item) => {
    console.log('Abrindo modal de edição com item:', item)
    setEditingAdditional(item)
    setShowEditAdditionalModal(true)
  }

  const saveEditAdditional = async () => {
    if (!editingAdditional.category_id || !editingAdditional.variation_id || !editingAdditional.additional_id) {
      alert('Erro: Dados incompletos para editar o adicional')
      return
    }

    const token = localStorage.getItem('token')
    setLoading(true)
    try {
      const payload = {
        category_id: parseInt(editingAdditional.category_id),
        variation_id: parseInt(editingAdditional.variation_id),
        additional_id: parseInt(editingAdditional.additional_id),
        price: parseFloat(editingAdditional.price)
      }
      
      console.log('Editando adicional - Payload:', payload)
      
      const response = await fetch(`${API_URL}/category-additionals`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })
      
      const data = await response.json()
      console.log('Resposta da API:', data)
      
      if (response.ok) {
        alert('Preço atualizado com sucesso!')
        setShowEditAdditionalModal(false)
        fetchCategoryAdditionals()
      } else {
        alert('Erro ao atualizar preço: ' + (data.message || 'Erro desconhecido'))
      }
    } catch (err) {
      console.error('Erro:', err)
      alert('Erro ao atualizar: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const deleteAdditionalPrice = async (item) => {
    if (!item.category_id || !item.variation_id || !item.additional_id) {
      alert('Erro: Dados incompletos para excluir o adicional')
      return
    }

    const token = localStorage.getItem('token')
    setLoading(true)
    try {
      const payload = {
        category_id: parseInt(item.category_id),
        variation_id: parseInt(item.variation_id),
        additional_id: parseInt(item.additional_id)
      }
      
      console.log('Excluindo adicional - Payload:', payload)
      
      const response = await fetch(`${API_URL}/category-additionals`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })
      
      const data = await response.json()
      console.log('Resposta da API:', data)
      
      if (response.ok) {
        alert('Preço excluído com sucesso!')
        fetchCategoryAdditionals()
      } else {
        alert('Erro ao excluir preço: ' + (data.message || 'Erro desconhecido'))
      }
    } catch (err) {
      console.error('Erro:', err)
      alert('Erro ao excluir: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const activateAdditionalPrice = async (item) => {
    const token = localStorage.getItem('token')
    setLoading(true)
    try {
      const response = await fetch(`${API_URL}/category-additionals/activate`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          category_id: item.category_id,
          variation_id: item.variation_id,
          additional_id: item.additional_id
        })
      })
      
      if (response.ok) {
        alert('Preço ativado com sucesso!')
        fetchCategoryAdditionals()
      } else {
        const data = await response.json()
        alert('Erro ao ativar preço: ' + (data.message || 'Erro desconhecido'))
      }
    } catch (err) {
      console.error('Erro:', err)
      alert('Erro ao ativar')
    } finally {
      setLoading(false)
    }
  }

  const toggleActiveStatus = async (item) => {
    const token = localStorage.getItem('token')
    const endpoint = getEndpoint()
    setLoading(true)
    
    // Preparar dados completos para cada tipo
    let updateData = {}
    
    if (activeTab === 'products') {
      updateData = {
        name: item.name,
        description: item.description || '',
        category_id: item.category_id,
        measure_id: item.measure_id,
        is_active: !item.is_active
      }
    } else if (activeTab === 'measures') {
      updateData = {
        name: item.name,
        is_active: !item.is_active
      }
    } else if (activeTab === 'categories' || activeTab === 'variations' || activeTab === 'flavors' || activeTab === 'additionals') {
      updateData = {
        name: item.name,
        is_active: !item.is_active
      }
    }
    
    try {
      const response = await fetch(`${API_URL}${endpoint}/${item.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      })
      
      if (response.ok) {
        alert(`${getTabTitle()} ${!item.is_active ? 'ativado' : 'desativado'} com sucesso!`)
        fetchData()
      } else {
        const data = await response.json()
        alert('Erro ao alterar status: ' + (data.message || 'Erro desconhecido'))
      }
    } catch (err) {
      console.error('Erro:', err)
      alert('Erro ao alterar status: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const getTabTitle = () => {
    const titles = {
      measures: 'Medidas',
      additionals: 'Adicionais',
      variations: 'Variações',
      flavors: 'Sabores',
      categories: 'Categorias',
      products: 'Produtos'
    }
    return titles[activeTab]
  }

  const handleVariationPriceChange = (variationId, price) => {
    setProductFormData(prev => {
      const exists = prev.variation_prices.find(vp => vp.variation_id === variationId)
      
      if (exists) {
        return {
          ...prev,
          variation_prices: prev.variation_prices.map(vp =>
            vp.variation_id === variationId ? { ...vp, price: parseFloat(price) || 0 } : vp
          )
        }
      } else {
        return {
          ...prev,
          variation_prices: [...prev.variation_prices, { variation_id: variationId, price: parseFloat(price) || 0 }]
        }
      }
    })
  }

  const handleFlavorToggle = (flavorId) => {
    const selectedFlavor = flavors.find(f => f.id === parseInt(flavorId))
    setProductFormData(prev => ({
      ...prev,
      flavor_ids: flavorId ? [parseInt(flavorId)] : [],
      name: selectedFlavor ? selectedFlavor.name : ''
    }))
  }

  const handleAdditionalToggle = (additionalId) => {
    setSelectedProduct(prev => {
      const isSelected = prev.additional_ids?.includes(additionalId) || false
      
      if (isSelected) {
        return {
          ...prev,
          additional_ids: prev.additional_ids.filter(id => id !== additionalId),
          category_variation_additional_prices: prev.category_variation_additional_prices.filter(
            p => p.additional_id !== additionalId
          )
        }
      } else {
        const newPrices = variations.map(variation => ({
          category_id: parseInt(prev.category_id),
          variation_id: variation.id,
          additional_id: additionalId,
          price: 0
        }))
        
        return {
          ...prev,
          additional_ids: [...(prev.additional_ids || []), additionalId],
          category_variation_additional_prices: [...(prev.category_variation_additional_prices || []), ...newPrices]
        }
      }
    })
  }

  const handleAdditionalPriceChange = (variationId, additionalId, price) => {
    setSelectedProduct(prev => {
      const existingPrice = prev.category_variation_additional_prices?.find(
        p => p.variation_id === variationId && p.additional_id === additionalId
      )
      
      if (existingPrice) {
        // Atualizar preço existente
        return {
          ...prev,
          category_variation_additional_prices: prev.category_variation_additional_prices.map(p =>
            p.variation_id === variationId && p.additional_id === additionalId
              ? { ...p, price: parseFloat(price) || 0 }
              : p
          )
        }
      } else {
        // Criar novo preço se não existir
        return {
          ...prev,
          category_variation_additional_prices: [
            ...(prev.category_variation_additional_prices || []),
            {
              category_id: parseInt(prev.category_id),
              variation_id: variationId,
              additional_id: additionalId,
              price: parseFloat(price) || 0
            }
          ]
        }
      }
    })
  }

  const fetchCategoryAdditionals = async () => {
    const token = localStorage.getItem('token')
    try {
      console.log('Buscando adicionais por categoria...')
      const response = await fetch(`${API_URL}/category-additionals`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      console.log('Resposta category-additionals:', data)
      if (response.ok) {
        setCategoryAdditionals(data.data || [])
      } else {
        console.error('Erro na resposta:', data)
      }
    } catch (err) {
      console.error('Erro ao buscar adicionais por categoria:', err)
    }
  }

  const saveAdditionals = async () => {
    const token = localStorage.getItem('token')
    try {
      const payload = {
        name: selectedProduct.name,
        description: selectedProduct.description,
        category_id: selectedProduct.category_id,
        measure_id: selectedProduct.measure_id,
        is_active: selectedProduct.is_active,
        additional_ids: selectedProduct.additional_ids || [],
        category_variation_additional_prices: selectedProduct.category_variation_additional_prices || []
      }
      
      console.log('Payload enviado:', JSON.stringify(payload, null, 2))
      
      const response = await fetch(`${API_URL}/products/${selectedProduct.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })
      
      const data = await response.json()
      console.log('Resposta da API:', data)
      
      if (!response.ok) {
        alert('Erro: ' + (data.message || 'Erro ao salvar'))
        return
      }
      
      alert('Adicionais salvos com sucesso!')
      setShowAdditionalsModal(false)
      fetchData()
      fetchCategoryAdditionals()
    } catch (err) {
      console.error('Erro:', err)
      alert('Erro ao salvar adicionais')
    }
  }

  return (
    <div className="min-vh-100 bg-light">
      <nav className="navbar navbar-expand-lg navbar-dark bg-primary">
        <div className="container">
          <span className="navbar-brand">Gerenciar Produtos</span>
          <button className="btn btn-outline-light" onClick={() => navigate(`/${restaurantSlug}/home`)}>
            Voltar
          </button>
        </div>
      </nav>

      <div className="container mt-4">
        <ul className="nav nav-tabs mb-4">
          <li className="nav-item">
            <button className={`nav-link ${activeTab === 'products' ? 'active' : ''}`} onClick={() => setActiveTab('products')}>
              Produtos
            </button>
          </li>
          <li className="nav-item">
            <button className={`nav-link ${activeTab === 'measures' ? 'active' : ''}`} onClick={() => setActiveTab('measures')}>
              Medidas
            </button>
          </li>
          <li className="nav-item">
            <button className={`nav-link ${activeTab === 'additionals' ? 'active' : ''}`} onClick={() => setActiveTab('additionals')}>
              Adicionais
            </button>
          </li>
          <li className="nav-item">
            <button className={`nav-link ${activeTab === 'variations' ? 'active' : ''}`} onClick={() => setActiveTab('variations')}>
              Variações
            </button>
          </li>
          <li className="nav-item">
            <button className={`nav-link ${activeTab === 'flavors' ? 'active' : ''}`} onClick={() => setActiveTab('flavors')}>
              Sabores
            </button>
          </li>
          <li className="nav-item">
            <button className={`nav-link ${activeTab === 'categories' ? 'active' : ''}`} onClick={() => setActiveTab('categories')}>
              Categorias
            </button>
          </li>
        </ul>

        <div className="d-flex justify-content-between align-items-center mb-3">
          <h4>{getTabTitle()}</h4>
          <button className="btn btn-primary" onClick={openCreateModal} disabled={loading}>
            + Cadastrar {getTabTitle()}
          </button>
        </div>

        {activeTab === 'products' && (
          <div className="row mb-3">
            <div className="col-md-4">
              <label className="form-label">Filtrar por Categoria</label>
              <select 
                className="form-select" 
                value={filterCategory} 
                onChange={(e) => setFilterCategory(e.target.value)}
              >
                <option value="">Todas</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div className="col-md-4">
              <label className="form-label">Filtrar por Status</label>
              <select 
                className="form-select" 
                value={filterStatus} 
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="">Todos</option>
                <option value="active">Ativo</option>
                <option value="inactive">Inativo</option>
              </select>
            </div>
          </div>
        )}

        <div className="card">
          <div className="card-body">
            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Carregando...</span>
                </div>
                <p className="mt-2">Carregando dados...</p>
              </div>
            ) : activeTab === 'products' ? (
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Nome</th>
                    <th>Descrição</th>
                    <th>Categoria</th>
                    <th>Medida</th>
                    <th>Preços</th>
                    <th>Status</th>
                    <th style={{width: '250px'}}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {getFilteredProducts().map(item => (
                    <tr key={item.id}>
                      <td>{item.id}</td>
                      <td>{item.name}</td>
                      <td>{item.description}</td>
                      <td>{item.category_name}</td>
                      <td>{item.measure_name}</td>
                      <td>
                        <button 
                          className="btn btn-sm btn-outline-primary" 
                          onClick={async () => {
                            const token = localStorage.getItem('token')
                            const res = await fetch(`${API_URL}/products/${item.id}/variation-prices`, {
                              headers: { 'Authorization': `Bearer ${token}` }
                            })
                            const data = await res.json()
                            const prices = data.data.map(p => `${p.variation_name}: R$ ${parseFloat(p.price).toFixed(2)}`).join('\n')
                            alert(prices || 'Sem preços cadastrados')
                          }}
                        >
                          Ver Preços
                        </button>
                      </td>
                      <td>
                        <span className={`badge ${item.is_active ? 'bg-success' : 'bg-secondary'}`}>
                          {item.is_active ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td>
                        <button className="btn btn-sm btn-info me-1" onClick={() => openAdditionalsModal(item)}>
                          Adicionais
                        </button>
                        <button className="btn btn-sm btn-warning me-1" onClick={() => openEditModal(item)}>
                          Editar
                        </button>
                        {!item.is_active ? (
                          <button className="btn btn-sm btn-success me-1" onClick={() => toggleActiveStatus(item)}>
                            Ativar
                          </button>
                        ) : (
                          <button className="btn btn-sm btn-secondary me-1" onClick={() => toggleActiveStatus(item)}>
                            Desativar
                          </button>
                        )}
                        <button className="btn btn-sm btn-danger" onClick={() => openDeleteModal(item)}>
                          Excluir
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Nome</th>
                    {activeTab !== 'measures' && <th>Status</th>}
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {getCurrentData().map(item => (
                    <tr key={item.id}>
                      <td>{item.id}</td>
                      <td>{item.name}</td>
                      {activeTab !== 'measures' && (
                        <td>
                          <span className={`badge ${item.is_active ? 'bg-success' : 'bg-secondary'}`}>
                            {item.is_active ? 'Ativo' : 'Inativo'}
                          </span>
                        </td>
                      )}
                      {activeTab === 'measures' && (
                        <td>
                          <span className={`badge ${item.is_active ? 'bg-success' : 'bg-secondary'}`}>
                            {item.is_active ? 'Ativo' : 'Inativo'}
                          </span>
                        </td>
                      )}
                      <td>
                        <button className="btn btn-sm btn-warning me-1" onClick={() => openEditModal(item)}>
                          Editar
                        </button>
                        {!item.is_active ? (
                          <button className="btn btn-sm btn-success me-1" onClick={() => toggleActiveStatus(item)}>
                            Ativar
                          </button>
                        ) : (
                          <button className="btn btn-sm btn-secondary me-1" onClick={() => toggleActiveStatus(item)}>
                            Desativar
                          </button>
                        )}
                        <button className="btn btn-sm btn-danger" onClick={() => openDeleteModal(item)}>
                          Excluir
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {getCurrentData().length === 0 && !loading && (
              <p className="text-center text-muted">Nenhum registro encontrado</p>
            )}
          </div>
        </div>

        {activeTab === 'products' && (
          <>
            <div className="d-flex justify-content-between align-items-center mb-3 mt-4">
              <h4>Adicionais por Categoria</h4>
            </div>

            <div className="card mt-4">
              <div className="card-body">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>Adicional</th>
                      <th>Categoria</th>
                      <th>Variação</th>
                      <th>Preço</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categoryAdditionals.map((item, index) => (
                      <tr key={index}>
                        <td>{item.additional_name}</td>
                        <td>{item.category_name}</td>
                        <td>{item.variation_name}</td>
                        <td>R$ {parseFloat(item.price).toFixed(2)}</td>
                        <td>
                          <button 
                            className="btn btn-sm btn-warning me-1" 
                            onClick={() => openEditAdditionalModal(item)}
                          >
                            Editar
                          </button>
                          {item.deleted_at ? (
                            <button 
                              className="btn btn-sm btn-success" 
                              onClick={() => activateAdditionalPrice(item)}
                            >
                              Ativar
                            </button>
                          ) : (
                            <button 
                              className="btn btn-sm btn-danger" 
                              onClick={() => {
                                if (window.confirm(`Excluir preço do adicional ${item.additional_name}?`)) {
                                  deleteAdditionalPrice(item)
                                }
                              }}
                            >
                              Excluir
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {categoryAdditionals.length === 0 && (
                  <p className="text-center text-muted">Nenhum adicional cadastrado</p>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modal Principal */}
      {showModal && (
        <div className="modal show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
          <div className={`modal-dialog ${activeTab === 'products' ? 'modal-lg' : ''}`}>
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {modalType === 'create' && `Cadastrar ${getTabTitle()}`}
                  {modalType === 'edit' && `Editar ${getTabTitle()}`}
                  {modalType === 'delete' && `Excluir ${getTabTitle()}`}
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              
              {modalType === 'delete' ? (
                <>
                  <div className="modal-body">
                    <p>Tem certeza que deseja excluir <strong>{currentItem?.name}</strong>?</p>
                  </div>
                  <div className="modal-footer">
                    <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                    <button className="btn btn-danger" onClick={handleDelete}>Excluir</button>
                  </div>
                </>
              ) : (
                <form onSubmit={handleSubmit}>
                  <div className="modal-body">
                    {activeTab === 'products' ? (
                      <>
                        <div className="mb-3">
                          <label className="form-label">Descrição</label>
                          <textarea
                            className="form-control"
                            rows="2"
                            value={productFormData.description}
                            onChange={(e) => setProductFormData({...productFormData, description: e.target.value})}
                          />
                        </div>
                        
                        <div className="row">
                          <div className="col-md-6 mb-3">
                            <label className="form-label">Categoria *</label>
                            <select
                              className="form-select"
                              value={productFormData.category_id}
                              onChange={(e) => setProductFormData({...productFormData, category_id: parseInt(e.target.value)})}
                              required
                            >
                              <option value="">Selecione...</option>
                              {categories.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                              ))}
                            </select>
                          </div>
                          
                          <div className="col-md-6 mb-3">
                            <label className="form-label">Medida *</label>
                            <select
                              className="form-select"
                              value={productFormData.measure_id}
                              onChange={(e) => setProductFormData({...productFormData, measure_id: parseInt(e.target.value)})}
                              required
                            >
                              <option value="">Selecione...</option>
                              {measures.map(measure => (
                                <option key={measure.id} value={measure.id}>{measure.name}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="mb-3">
                          <label className="form-label fw-bold">Sabor *</label>
                          <select
                            className="form-select"
                            value={productFormData.flavor_ids[0] || ''}
                            onChange={(e) => handleFlavorToggle(e.target.value)}
                            required
                          >
                            <option value="">Selecione um sabor...</option>
                            {flavors.map(flavor => (
                              <option key={flavor.id} value={flavor.id}>{flavor.name}</option>
                            ))}
                          </select>
                          <small className="text-muted">O nome do produto será o sabor selecionado</small>
                        </div>

                        {productFormData.name && (
                          <div className="alert alert-info mb-3">
                            <strong>Nome do produto:</strong> {productFormData.name}
                          </div>
                        )}

                        <div className="mb-3">
                          <label className="form-label fw-bold">Preços por Variação *</label>
                          <div className="border rounded p-3">
                            {variations.map(variation => (
                              <div key={variation.id} className="row mb-2">
                                <div className="col-6">
                                  <label className="form-label mb-0">{variation.name}</label>
                                </div>
                                <div className="col-6">
                                  <input
                                    type="number"
                                    step="0.01"
                                    className="form-control form-control-sm"
                                    placeholder="0.00"
                                    value={productFormData.variation_prices.find(vp => vp.variation_id === variation.id)?.price || ''}
                                    onChange={(e) => handleVariationPriceChange(variation.id, e.target.value)}
                                    required
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="mb-3">
                          <div className="form-check">
                            <input
                              type="checkbox"
                              className="form-check-input"
                              checked={productFormData.is_active}
                              onChange={(e) => setProductFormData({...productFormData, is_active: e.target.checked})}
                            />
                            <label className="form-check-label">Ativo</label>
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="mb-3">
                          <label className="form-label">Nome</label>
                          <input
                            type="text"
                            className="form-control"
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                            required
                          />
                        </div>
                        {activeTab !== 'measures' && (
                          <div className="mb-3">
                            <div className="form-check">
                              <input
                                type="checkbox"
                                className="form-check-input"
                                checked={formData.is_active}
                                onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                              />
                              <label className="form-check-label">Ativo</label>
                            </div>
                          </div>
                        )}
                        {activeTab === 'measures' && (
                          <div className="mb-3">
                            <div className="form-check">
                              <input
                                type="checkbox"
                                className="form-check-input"
                                checked={formData.is_active}
                                onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                              />
                              <label className="form-check-label">Ativo</label>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                      Cancelar
                    </button>
                    <button type="submit" className="btn btn-primary">
                      {modalType === 'create' ? 'Cadastrar' : 'Salvar'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Adicionais */}
      {showAdditionalsModal && selectedProduct && (
        <div className="modal show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Adicionais - {selectedProduct.name}</h5>
                <button type="button" className="btn-close" onClick={() => setShowAdditionalsModal(false)}></button>
              </div>
              
              <div className="modal-body">
                <div style={{maxHeight: '500px', overflowY: 'auto'}}>
                  {additionals.map(additional => {
                    const isSelected = selectedProduct.additional_ids?.includes(additional.id) || false
                    return (
                      <div key={additional.id} className="mb-3 border rounded p-3">
                        <div className="form-check mb-2">
                          <input
                            type="checkbox"
                            className="form-check-input"
                            checked={isSelected}
                            onChange={() => handleAdditionalToggle(additional.id)}
                          />
                          <label className="form-check-label fw-bold">{additional.name}</label>
                        </div>
                        {isSelected && (
                          <div className="ms-4">
                            <small className="text-muted d-block mb-2">Preços por variação:</small>
                            {variations.map(v => (
                              <div key={v.id} className="row mb-2">
                                <div className="col-5">
                                  <label className="form-label mb-0 small">{v.name}</label>
                                </div>
                                <div className="col-7">
                                  <input
                                    type="number"
                                    step="0.01"
                                    className="form-control form-control-sm"
                                    placeholder="0.00"
                                    value={
                                      selectedProduct.category_variation_additional_prices?.find(
                                        p => p.variation_id === v.id && p.additional_id === additional.id
                                      )?.price || ''
                                    }
                                    onChange={(e) => handleAdditionalPriceChange(v.id, additional.id, e.target.value)}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
              
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowAdditionalsModal(false)}>
                  Cancelar
                </button>
                <button className="btn btn-primary" onClick={saveAdditionals}>
                  Salvar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Edição de Adicional */}
      {showEditAdditionalModal && editingAdditional && (
        <div className="modal show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Editar Preço do Adicional</h5>
                <button type="button" className="btn-close" onClick={() => setShowEditAdditionalModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Adicional</label>
                  <input type="text" className="form-control" value={editingAdditional.additional_name || ''} disabled />
                </div>
                <div className="mb-3">
                  <label className="form-label">Categoria</label>
                  <input type="text" className="form-control" value={editingAdditional.category_name || ''} disabled />
                </div>
                <div className="mb-3">
                  <label className="form-label">Variação</label>
                  <input type="text" className="form-control" value={editingAdditional.variation_name || ''} disabled />
                </div>
                <div className="mb-3">
                  <label className="form-label">Preço *</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    className="form-control" 
                    value={editingAdditional.price || ''}
                    onChange={(e) => setEditingAdditional({...editingAdditional, price: e.target.value})}
                    required
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowEditAdditionalModal(false)}>
                  Cancelar
                </button>
                <button className="btn btn-primary" onClick={saveEditAdditional} disabled={loading}>
                  {loading ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Products
