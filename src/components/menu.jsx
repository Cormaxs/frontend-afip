import React, { useState, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';

// Definición de los grupos de menú fuera del componente para evitar re-renders innecesarios
const menuGroups = {
    dashboard: {
        title: "Dashboard",
        icon: (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
        ),
        items: [
            { path: "/", label: "Inicio", icon: "🏠" },
            { path: "/metricas", label: "Métricas", icon: "📊" } // Ruta agregada
        ]
    },
    auth: {
        title: "Autenticación",
        icon: (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
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
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
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
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
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
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
        ),
        items: [
            { path: "/add-puntoVenta", label: "Agregar", icon: "🏪" },
            { path: "/get-puntoVenta", label: "Listado", icon: "📋" }
        ]
    },
    personal: {
        title: "Personal",
        icon: (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
        ),
        items: [
            { path: "/add-vendedor", label: "Vendedores", icon: "👤" },
            { path: "/usuarios", label: "Usuarios", icon: "👥" } // Ruta agregada
        ]
    },
    operations: {
        title: "Operaciones",
        icon: (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
        ),
        items: [
            { path: "/create-factura", label: "Facturación", icon: "🧾" }
        ]
    },
    tickets: {
        title: "Tickets",
        icon: (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M15 5v2m0 4v2m0 4v2M9 9h1a2 2 0 002-2V3a1 1 0 00-1-1H5a1 1 0 00-1 1v2c0 .552.448 1 1 1h1zm0 3H9v2h2v-2zm0 4H9v2h2v-2zm0 4H9v2h2v-2z" />
            </svg>
        ),
        items: [
            { path: "/tiket/create", label: "Crear Ticket", icon: "🎟️" },
            { path: "/tiket/get", label: "Ver Tickets", icon: "📜" }
        ]
    }
};

// Componente para un solo ítem de menú
const MenuItem = ({ item, isActive }) => (
    <Link
        to={item.path}
        className={`flex items-center p-2 rounded-md text-sm font-medium
            ${isActive ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-100 hover:bg-indigo-700'}
            transition duration-200 ease-in-out group`}
    >
        <span className="mr-3 text-lg group-hover:scale-110 transition-transform">{item.icon}</span>
        <span>{item.label}</span>
    </Link>
);

// Componente para el submenú
const SubMenu = ({ group, open, isActivePath, toggleSubmenu }) => {
    const isGroupActive = group.items.some(isActivePath);

    return (
        <div className="mb-2">
            <button
                onClick={toggleSubmenu}
                className={`w-full flex items-center justify-between p-2 rounded-md
                    ${isGroupActive ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-100 hover:bg-indigo-700'}
                    transition duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
            >
                <div className="flex items-center">
                    <span className="mr-3">{group.icon}</span>
                    <span className="font-semibold">{group.title}</span>
                </div>
                <svg
                    className={`w-4 h-4 transform transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <path d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            <div className={`ml-6 mt-1 space-y-1 overflow-hidden transition-all duration-300 ease-in-out ${open ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'}`}>
                {group.items.map((item) => (
                    <MenuItem key={item.path} item={item} isActive={isActivePath(item.path)} />
                ))}
            </div>
        </div>
    );
};

export function SidePanel() {
    const [isOpen, setIsOpen] = useState(false); // Por defecto cerrado en móvil para un enfoque empresarial
    const [openSubmenu, setOpenSubmenu] = useState(null);
    const location = useLocation();

    // Efecto para controlar el estado inicial del panel y el redimensionamiento
    useEffect(() => {
        const handleResize = () => {
            setIsOpen(window.innerWidth >= 768); // Abierto por defecto en desktop
        };

        handleResize(); // Establecer estado inicial
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Abre el submenú si un ítem de ese grupo está activo
    useEffect(() => {
        for (const key in menuGroups) {
            if (menuGroups[key].items.some(item => location.pathname === item.path)) {
                setOpenSubmenu(key);
                return;
            }
        }
        setOpenSubmenu(null); // Cierra si no hay ningún submenú activo
    }, [location.pathname]);

    const togglePanel = useCallback(() => setIsOpen(prev => !prev), []);
    const toggleSubmenu = useCallback((menu) => {
        setOpenSubmenu(prev => (prev === menu ? null : menu));
    }, []);

    const isActivePath = useCallback((path) => location.pathname === path, [location.pathname]);

    return (
        <div className="flex">
            {/* Overlay para cerrar el panel en móvil */}
            {isOpen && window.innerWidth < 768 && (
                <div
                    className="fixed inset-0 bg-black opacity-50 z-40"
                    onClick={togglePanel}
                ></div>
            )}

            {/* Panel lateral */}
            <div className={`fixed inset-y-0 left-0 transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 z-50 transition-transform duration-300 ease-in-out
                bg-gradient-to-b from-[#3f64ec] to-[#4c67f1] text-white w-64 shadow-xl flex flex-col`}>
                {/* Encabezado del panel */}
                <div className="flex items-center justify-between p-4 border-b border-[#4c67f1]">
                    <Link to="/" className="text-2xl font-extrabold flex items-center text-white">
                        <svg className="w-8 h-8 mr-2 text-indigo-200" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                        </svg>
                        FacStock
                    </Link>
                    <button
                        onClick={togglePanel}
                        className="md:hidden text-white focus:outline-none p-1 rounded-md hover:bg-indigo-700"
                        aria-label="Cerrar panel"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                            <path d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Contenido del panel */}
                <div className="p-4 flex-grow overflow-y-auto custom-scrollbar">
                    {Object.entries(menuGroups).map(([key, group]) => (
                        <SubMenu
                            key={key}
                            group={group}
                            open={openSubmenu === key}
                            isActivePath={isActivePath}
                            toggleSubmenu={() => toggleSubmenu(key)}
                        />
                    ))}

                    {/* Botón de cerrar sesión */}
                    <div className="mt-8 pt-4 border-t border-[#4c67f1]">
                        <button
                            className="flex items-center w-full p-2 rounded-md text-gray-100 hover:bg-indigo-700 transition duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            onClick={() => {
                                // Lógica para cerrar sesión
                                console.log("Cerrar sesión");
                            }}
                        >
                            <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            <span className="font-semibold">Cerrar Sesión</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Botón para abrir panel en móvil */}
            {!isOpen && (
                <button
                    onClick={togglePanel}
                    className="fixed bottom-4 left-4 z-40 md:hidden bg-[#3f64ec] text-white p-3 rounded-full shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    aria-label="Abrir panel"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                </button>
            )}
        </div>
    );
}