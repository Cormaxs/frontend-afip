import { useState } from 'react';
import { Outlet, NavLink, Link } from 'react-router-dom';
import { useAuth } from '../contexts/auth/authContext.jsx';
import { 
  FilePlus, List, Package, User, MapPin, 
  Settings, Menu, LogOut 
} from 'lucide-react';
// Importamos el CSS principal (que a su vez importa todo)
import '../styles/main.css';

const Layout = () => {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const menuGroups = [
    {
      title: 'Ventas',
      items: [
        { path: '/despachador', label: 'Despachador', icon: <FilePlus /> },
        { path: '/buscador-facturas', label: 'Gestión de Ventas', icon: <List /> },
      ]
    },
    {
      title: 'Inventario',
      items: [
        { path: '/buscadorProductos', label: 'Productos y Precios', icon: <Package /> },
        { path: '/categorias-marcas', label: 'Categorías y Marcas', icon: <Package /> },
        { path: '/clientes', label: 'Clientes (CRM)', icon: <User /> },
      ]
    },
    {
      title: 'Operaciones',
      items: [
        { path: '/gestion-cajas', label: 'Gestión de Cajas', icon: <Package /> },
        { path: '/proveedores', label: 'Proveedores', icon: <Package /> },
        { path: '/cuentas-por-pagar', label: 'Cuentas por Pagar', icon: <Package /> },
        { path: '/gestion-vendedores', label: 'Vendedores', icon: <User /> },
      ]
    },
    {
      title: 'Reportes & Analytics',
      items: [
        { path: '/reportes', label: 'Reportes', icon: <List /> },
      ]
    },
    {
      title: 'Configuración',
      items: [
        { path: '/puntos-de-ventas', label: 'Puntos de Venta', icon: <MapPin /> },
        { path: '/datosEmpresa', label: 'Datos de Empresa', icon: <Settings /> },
        { path: '/datosUsuario', label: 'Mi Perfil', icon: <User /> },
      ]
    }
  ];

  return (
    <div className="app-layout">
      {/* Overlay móvil */}
      {sidebarOpen && (
        <div 
          className="mobile-overlay" 
          onClick={() => setSidebarOpen(false)} 
        />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'sidebar--open' : ''}`}>
        <div className="sidebar-header">
          <span className="brand-name">FACSTOCK<span className="brand-dot"></span></span>
          <span className="version-badge">V.0.1</span>
        </div>

        <nav className="sidebar-nav">
          {menuGroups.map((group, i) => (
            <div key={i} className="nav-group">
              <p className="nav-group-title">{group.title}</p>
              {group.items.map(item => (
                <NavLink 
                  key={item.path} 
                  to={item.path} 
                  className={({ isActive }) => `nav-link ${isActive ? 'nav-link--active' : ''}`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <span className="nav-icon">{item.icon}</span>
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
      </aside>

      {/* Contenido principal */}
      <div className="main-content">
        <header className="top-bar">
          <button 
            className="mobile-menu-btn"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={24} />
          </button>

          <div className="user-area">
            <div className="user-info">
              <div className="user-name">{user?.nombre || 'Usuario'}</div>
              <div className="user-role">{user?.rol || 'Administrador'}</div>
            </div>
            
            <Link to="/datosUsuario" className="avatar-link">
              <div className="avatar">
                {user?.nombre?.charAt(0) || 'U'}
              </div>
            </Link>

            <div className="divider-vertical"></div>

            <button onClick={logout} className="btn-logout" title="Cerrar sesión">
              <LogOut />
              <span>Cerrar sesión</span>
            </button>
          </div>
        </header>

        <main className="app-main">
          <div className="content-wrapper">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;