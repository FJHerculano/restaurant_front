import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './Login'
import Register from './Register'
import Home from './Home'
import Dashboard from './Dashboard'
import Products from './Products'

function PrivateRoute({ children }) {
  const token = localStorage.getItem('token')
  return token ? children : <Navigate to="/" />
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/:restaurantSlug/login" element={<Login />} />
        <Route path="/:restaurantSlug/cadastro" element={<Register />} />
        <Route path="/:restaurantSlug/home" element={<PrivateRoute><Home /></PrivateRoute>} />
        <Route path="/:restaurantSlug/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/:restaurantSlug/products" element={<PrivateRoute><Products /></PrivateRoute>} />
        <Route path="/" element={<Navigate to="/mao-de-vaca/login" />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
