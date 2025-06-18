import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

export function SidePanel() {
  const [isOpen, setIsOpen] = useState(true);
  const [openSubmenu, setOpenSubmenu] = useState(null);
  const location = useLocation();

  // Estado inicial para móviles
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsOpen(false);
      } else {
        setIsOpen(true);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const togglePanel = () => setIsOpen(!isOpen);
  const toggleSubmenu = (menu) => {
    setOpenSubmenu(openSubmenu === menu ? null : menu);
  };

  // Grupos de menú
  const menuGroups = {
    dashboard: {
      title: "Dashboard",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      ),
      items: [
        { path: "/", label: "Inicio", icon: "🏠" }
      ]
    },
    auth: {
      title: "Autenticación",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      ),
      items: [
        { path: "/login", label: "Login", icon: "🔑" },
        { path: "/register", label: "Registro", icon: "📝" }
      ]
    },
    config: {
      title: "Configuración",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      items: [
        { path: "/empresa-register", label: "Empresa", icon: "🏢" },
        { path: "/generate-key-crs", label: "Key/CSR", icon: "🔐" },
        { path: "/generate-crt", label: "Certificado", icon: "📄" }
      ]
    },
    products: {
      title: "Productos",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
      items: [
        { path: "/productos", label: "Listado", icon: "📋" },
        { path: "/add-product", label: "Agregar", icon: "➕" }
      ]
    },
    salesPoints: {
      title: "Puntos de Venta",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      items: [
        { path: "/add-puntoVenta", label: "Agregar", icon: "🏪" },
        { path: "/get-puntoVenta", label: "Listado", icon: "📋" }
      ]
    },
    personnel: {
      title: "Personal",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      items: [
        { path: "/add-vendedor", label: "Vendedores", icon: "👤" },
        { path: "/usuarios", label: "Usuarios", icon: "👥" }
      ]
    },
    operations: {
      title: "Operaciones",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
      items: [
        { path: "/create-factura", label: "Facturación", icon: "🧾" }
      ]
    }
  };

  // Verificar si una ruta está activa
  const isActive = (path) => {
    return location.pathname === path;
  };

  // Verificar si algún item del grupo está activo
  const isGroupActive = (group) => {
    return group.items.some(item => isActive(item.path));
  };

  return (
    <div className="flex">
      {/* Panel lateral */}
      <div className={`fixed inset-y-0 left-0 transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 z-50 transition-transform duration-300 ease-in-out bg-gradient-to-b from-blue-600 to-blue-800 text-white w-64 shadow-xl`}>
        {/* Encabezado del panel */}
        <div className="flex items-center justify-between p-4 border-b border-blue-500">
          <Link to="/" className="text-xl font-bold flex items-center">
            <svg className="w-8 h-8 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
            </svg>
            FacStock
          </Link>
          <button 
            onClick={togglePanel}
            className="md:hidden text-white focus:outline-none"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Contenido del panel */}
        <div className="p-4 overflow-y-auto h-[calc(100vh-65px)]">
          {Object.entries(menuGroups).map(([key, group]) => (
            <div key={key} className="mb-2">
              <button
                onClick={() => toggleSubmenu(key)}
                className={`w-full flex items-center justify-between p-2 rounded-lg ${isGroupActive(group) ? 'bg-blue-500' : 'hover:bg-blue-700'} transition duration-200`}
              >
                <div className="flex items-center">
                  <span className="mr-3">{group.icon}</span>
                  <span>{group.title}</span>
                </div>
                <svg 
                  className={`w-4 h-4 transform transition-transform ${openSubmenu === key ? 'rotate-180' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              <div className={`ml-8 mt-1 ${openSubmenu === key ? 'block' : 'hidden'}`}>
                {group.items.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center p-2 rounded-lg ${isActive(item.path) ? 'bg-blue-400' : 'hover:bg-blue-600'} transition duration-200`}
                  >
                    <span className="mr-2">{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                ))}
              </div>
            </div>
          ))}

          {/* Botón de cerrar sesión */}
          <div className="mt-8 pt-4 border-t border-blue-500">
            <button
              className="flex items-center w-full p-2 rounded-lg hover:bg-blue-700 transition duration-200"
              onClick={() => {
                // Lógica para cerrar sesión
              }}
            >
              <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Cerrar Sesión
            </button>
          </div>
        </div>
      </div>

      {/* Botón para abrir panel en móvil (solo visible cuando el panel está cerrado) */}
      {!isOpen && (
        <button
          onClick={togglePanel}
          className="fixed bottom-4 left-4 z-40 md:hidden bg-blue-600 text-white p-3 rounded-full shadow-lg"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      )}
    </div>
  );
}