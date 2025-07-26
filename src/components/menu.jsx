import React, { useState, useEffect, useCallback, useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { apiContext } from '../context/api_context';

// Definición de los grupos de menú fuera del componente para evitar re-renders innecesarios
// Objeto de configuración de menú, completo y sincronizado con tus rutas
const menuGroups = {
    dashboard: {
        title: "general",
        icon: <i className="bi bi-columns-gap"></i>,
        items: [
            { path: "/dashboard", label: "Inicio", icon: <i className="bi bi-house-fill"></i> },
            { path: "/metricas", label: "Métricas", icon: <i className="bi bi-bar-chart-line"></i> }
        ]
    },

    ventas: {
        title: "ventas 'BETA' ",
        icon: <i className="bi bi-columns-gap"></i>,
        items: [
            { path: "/tiket/create", label: "Cobrar", icon: <i className="bi bi-cash-coin"></i> },
            { path: "/get-puntoVenta", label: "Puntos venta", icon: <i className="bi bi-list-ol"></i> },
            { path: "/productos", label: "Productos", icon: <i className="bi bi-box-seam"></i> },
            { path: "/get-cajas-empresa", label: "Historial cajas", icon: <i className="bi bi-file-medical"></i> },
            { path: "/tiket/get", label: "Historial tikets", icon: <i className="bi bi-ticket-detailed"></i> }
        ]
    },
   /* operations: {
        title: "Operaciones",
        icon: <i className="bi bi-collection"></i>,
        items: [
            { path: "/ventas", label: "Ventas", icon: <i className="bi bi-bag-fill"></i> },
            { path: "/create-factura", label: "Facturación", icon: <i className="bi bi-receipt-cutoff"></i> }
        ]
    },*/
    caja: {
        title: "Caja",
        icon: <i className="bi bi-box"></i>,
        items: [
            { path: "/abrir-caja", label: "Abrir Caja", icon: <i className="bi bi-check-circle-fill"></i> },
            { path: "/cerrar-caja", label: "Cerrar Caja", icon: <i className="bi bi-x-circle-fill"></i> },
           // { path: "/ingreso-egreso-caja", label: "Ingreso/Egreso", icon: <i className="bi bi-currency-dollar"></i> },
            { path: "/get-cajas-empresa", label: "Historial cajas", icon: <i className="bi bi-file-medical"></i> }
        ]
    },
    products: {
        title: "Productos",
        icon: <i className="bi bi-diagram-3"></i>,
        items: [
            { path: "/productos", label: "Listado", icon: <i className="bi bi-card-checklist"></i> },
            { path: "/add-product", label: "Agregar", icon: <i className="bi bi-file-earmark-plus"></i> },
            { path: "/carga-masiva-productos", label: "Carga Masiva", icon: <i className="bi bi-folder-plus"></i> }
        ]
    },
    salesPoints: {
        title: "Puntos de Venta",
        icon:<i className="bi bi-buildings"></i>,
        items: [
            { path: "/add-puntoVenta", label: "Agregar", icon: <i className="bi bi-house-add"></i> },
            { path: "/get-puntoVenta", label: "Listado ", icon: <i className="bi bi-list-ol"></i> }
        ]
    },
    personal: {
        title: "Personal",
        icon: <i className="bi bi-person-badge"></i>,
        items: [
            { path: "/add-vendedor", label: "Agregar vendedor", icon: <i className="bi bi-person-add"></i> },
            { path: "/usuarios", label: "Ver usuarios", icon: <i className="bi bi-people"></i>}
        ]
    },
    tickets: {
        title: "Tickets",
        icon: <i className="bi bi-file-earmark"></i>,
        items: [
            { path: "/tiket/create", label: "Crear Ticket", icon: <i className="bi bi-ticket-perforated-fill"></i> },
            { path: "/tiket/get", label: "Ver Tickets", icon: <i className="bi bi-ticket-detailed"></i> }
        ]
    },
   /* config: {
        title: "Configuración AFIP",
        icon: <i className="bi bi-gear-wide-connected"></i>,
        items: [
            { path: "/empresa-register", label: "Empresa", icon: <i className="bi bi-building"></i> },
            { path: "/generate-key-crs", label: "Key/CSR", icon: <i className="bi bi-key"></i> },
            { path: "/generate-crt", label: "Certificado", icon: <i className="bi bi-newspaper"></i> }
        ]
    },
     auth: {
        title: "Autenticación",
        icon: <i className="bi bi-person-check"></i>,
        items: [
            { path: "/login", label: "Login", icon: <i className="bi bi-box-arrow-in-right"></i> },
            { path: "/register", label: "Registro", icon: <i className="bi bi-plus-square"></i> }
        ]
    },*/
};

// Componente para un solo ítem de menú
const MenuItem = ({ item, isActive }) => (
    <Link
        to={item.path}
        className={`flex items-center p-2 rounded-md text-sm font-medium
            ${isActive ? 'bg-[var(--principal-activo)] text-white shadow-md' : 'text-gray-100 hover:bg-[var(--principal-shadow)]'}
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
                    ${isGroupActive ? 'bg-[var(--principal-activo)] text-white shadow-md' : 'text-gray-100 hover:bg-[var(--principal-shadow)]'}
                    transition duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--principal-shadow)]`}
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

export default function SidePanel() {
    const [isOpen, setIsOpen] = useState(false); // Por defecto cerrado en móvil para un enfoque empresarial
    const [openSubmenu, setOpenSubmenu] = useState(null);
    const location = useLocation();
    const {logout} = useContext(apiContext)

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
                bg-gradient-to-b from-[var(--principal)] to-[var(--principal-shadow)] text-white w-64 shadow-xl flex flex-col`}>
                {/* Encabezado del panel */}
                <div className="flex items-center justify-between p-4 border-b border-[var(--principal-shadow)]">
                    <Link to="/" className="text-2xl font-extrabold flex items-center text-white">
                        <i className="bi bi-check2-all w-8 h-8 mr-2 text-indigo-200"></i>
                        FACSTOCK
                    </Link>
                    <button
                        onClick={togglePanel}
                        className="md:hidden text-white focus:outline-none p-1 rounded-md hover:bg-[var(--principal-shadow)]"
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
                    <div className="mt-8 pt-4 border-t border-[var(--principal-shadow)]">
                        <button
                            className="flex items-center w-full p-2 rounded-md text-gray-100 hover:bg-[var(--principal-shadow)] transition duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--principal-shadow)]"
                            onClick={() => { logout();}}
                        >
                           
                            <i className="bi bi-x-square w-5 h-5 mr-3"></i>
                            <span className="font-semibold">Cerrar Sesión</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Botón para abrir panel en móvil */}
            {!isOpen && (
                <button
                    onClick={togglePanel}
                    className="fixed bottom-4 left-4 z-40 md:hidden bg-[var(--principal)] text-white p-3 rounded-full shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--principal-shadow)]"
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