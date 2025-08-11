import React, { useState, useEffect, useCallback, useContext, memo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { apiContext } from '../context/api_context';

// --- ESTRUCTURA DE MENÚ LÓGICA Y ACTUALIZADA ---
const menuGroups = {
    dashboard: {
        title: "Dashboard",
        icon: <i className="bi bi-columns-gap"></i>,
        items: [
            { path: "/dashboard", label: "Inicio", icon: <i className="bi bi-house-door-fill"></i> },
            { path: "/metricas", label: "Métricas", icon: <i className="bi bi-bar-chart-line-fill"></i> },
            { path: "/create-factura", label: "crear Facturas 'BETA'", icon: <i className="bi bi-bar-chart-line-fill"></i> },
            { path: "/ver-facturas", label: "Historial de Facturas", icon: <i className="bi bi-receipt"></i> },
            
        ]
    },
    ventas: {
        title: "Ventas",
        icon: <i className="bi bi-cart3"></i>,
        items: [
            { path: "/tiket/create", label: "Nueva Venta / Cobrar", icon: <i className="bi bi-cash-coin"></i> },
            { path: "/get-puntoVenta", label: "Puntos de Venta", icon: <i className="bi bi-shop"></i> },
            { path: "/tiket/get", label: "Historial de tikets", icon: <i className="bi bi-receipt"></i> },
        ]
    },
    inventario: {
        title: "Inventario",
        icon: <i className="bi bi-box-seam-fill"></i>,
        items: [
            { path: "/productos", label: "Productos", icon: <i className="bi bi-card-checklist"></i> },
        ]
    },
    caja: {
        title: "Caja",
        icon: <i className="bi bi-safe2-fill"></i>,
        items: [
            { path: "/get-cajas-empresa", label: "Cajas", icon: <i className="bi bi-archive-fill"></i> }
        ]
    },
    configuracion: {
        title: "Configuración",
        icon: <i className="bi bi-gear-fill"></i>,
        items: [
            { path: "/add-vendedor", label: "Agregar vendedores", icon: <i className="bi bi-person-add"></i> }
        ]
    },
};


// --- SUB-COMPONENTES MEMOIZADOS Y REDISEÑADOS ---

// ✨ CAMBIO: El perfil de usuario ahora es un único componente interactivo
const UserProfile = memo(({ user }) => {
    if (!user) return null;
    const fullName = `${user.nombre || ''} ${user.apellido || ''}`.trim();

    const getInitials = (name = '') => {
        const names = name.split(' ').filter(n => n);
        return names.length > 1 
            ? `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase()
            : name.substring(0, 2).toUpperCase();
    };

    return (
        <Link 
            to="/update-user" 
            className="group flex items-center justify-between w-full p-2 rounded-lg hover:bg-white/10 transition-colors duration-200"
            title="Ajustes de Perfil"
        >
            {/* Contenedor para Avatar y Nombre/Rol */}
            <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-9 h-9 rounded-full bg-[var(--principal-activo)] flex items-center justify-center font-bold text-white text-sm shrink-0">
                    {user.avatarUrl ? (
                        <img src={user.avatarUrl} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                    ) : (
                        <span>{getInitials(fullName)}</span>
                    )}
                </div>
                <div className="overflow-hidden">
                    <p className="text-sm font-semibold text-white truncate">
                        {fullName || 'Usuario'}
                    </p>
                    {user.rol && (
                         <span className="text-indigo-100 text-xs font-medium">
                             {user.rol}
                         </span>
                    )}
                </div>
            </div>
            
            {/* Icono de Ajustes */}
            <i className="bi bi-gear-fill text-lg text-white/80 shrink-0 group-hover:rotate-45 transition-transform duration-300"></i>
        </Link>
    );
});


const MenuItem = memo(({ item, isActive }) => (
    <Link to={item.path} className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium ${isActive ? 'bg-[var(--principal-activo)] text-white' : 'text-white hover:bg-white/10 hover:text-white'} transition-colors duration-200 ease-in-out group`}>
        <span className="mr-3 text-lg">{item.icon}</span>
        <span>{item.label}</span>
    </Link>
));

const SubMenu = memo(({ group, open, isActivePath, toggleSubmenu }) => {
    const isGroupActive = group.items.some(isActivePath);
    return (
        <div className="mb-1">
            <button onClick={toggleSubmenu} className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg ${isGroupActive ? 'text-white' : 'text-white hover:bg-white/10 hover:text-white'} transition-colors duration-200 ease-in-out text-left`}>
                <div className="flex items-center">
                    <span className="mr-3 text-xl">{group.icon}</span>
                    <span className="font-semibold text-base">{group.title}</span>
                </div>
                <i className={`bi bi-chevron-down transform transition-transform duration-300 ${open ? 'rotate-180' : ''}`}></i>
            </button>
            <div className={`ml-4 pl-4 border-l-2 border-white/10 mt-2 space-y-1 overflow-hidden transition-all duration-300 ease-in-out ${open ? 'max-h-96' : 'max-h-0'}`}>
                {group.items.map((item) => <MenuItem key={item.path} item={item} isActive={isActivePath(item.path)} />)}
            </div>
        </div>
    );
});


// --- COMPONENTE PRINCIPAL (SIDE PANEL) ---

export default function SidePanel() {
    const [isOpen, setIsOpen] = useState(window.innerWidth >= 768);
    const [openSubmenu, setOpenSubmenu] = useState(null);
    const location = useLocation();
    const { logout, userData, companyData } = useContext(apiContext);

    useEffect(() => {
        const handleResize = () => setIsOpen(window.innerWidth >= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        const activeGroup = Object.keys(menuGroups).find(key =>
            menuGroups[key].items.some(item => location.pathname.startsWith(item.path))
        );
        setOpenSubmenu(activeGroup || null);
    }, [location.pathname]);

    const togglePanel = useCallback(() => setIsOpen(prev => !prev), []);
    const toggleSubmenu = useCallback((menuKey) => setOpenSubmenu(prev => (prev === menuKey ? null : menuKey)), []);
    const isActivePath = useCallback((path) => location.pathname.startsWith(path), [location.pathname]);

    return (
        <>
            <aside className={`fixed inset-y-0 left-0 transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 z-50 transition-transform duration-300 ease-in-out bg-[var(--principal)] text-white w-64 shadow-xl flex flex-col`}>
                
                <header className="p-4 border-b border-white/10 text-center">
                    <Link to="/" className="text-2xl font-bold flex items-center justify-center text-white mb-4">
                        <i className="bi bi-check2-all text-3xl text-indigo-200 mr-2"></i>
                        <span>FACSTOCK</span>
                    </Link>
                    
                    {companyData && (
                        <Link 
                            to="/update-empresa" 
                            className="group bg-black/20 p-2 rounded-lg text-sm font-semibold text-indigo-200 flex items-center justify-between transition-colors hover:bg-black/30"
                            title="Editar datos de la empresa"
                        >
                            <div className="flex items-center gap-2 overflow-hidden">
                                <i className="bi bi-briefcase-fill shrink-0"></i>
                                <span className="truncate">{companyData.nombreEmpresa || 'Empresa'}</span>
                            </div>
                            <i className="bi bi-gear-fill text-white/80 ml-2 group-hover:rotate-45 transition-transform duration-300"></i>
                        </Link>
                    )}
                </header>

                <nav className="p-3 flex-grow overflow-y-auto custom-scrollbar">
                    {Object.entries(menuGroups).map(([key, group]) => (
                        <SubMenu key={key} group={group} open={openSubmenu === key} isActivePath={isActivePath} toggleSubmenu={() => toggleSubmenu(key)} />
                    ))}
                </nav>

                <footer className="mt-auto p-4 border-t border-white/10 space-y-2">
                    <UserProfile user={userData} />
                    <button onClick={logout} className="flex items-center w-full p-2.5 rounded-lg text-gray-200 hover:bg-red-500/80 hover:text-white transition-colors duration-200 ease-in-out group">
                        <i className="bi bi-box-arrow-left text-lg mr-3"></i>
                        <span className="font-semibold">Cerrar Sesión</span>
                    </button>
                </footer>
            </aside>

            {isOpen && <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={togglePanel}></div>}
            
            {!isOpen && (
                <button onClick={togglePanel} className="fixed bottom-4 left-4 z-30 md:hidden bg-[var(--principal)] text-white w-14 h-14 flex items-center justify-center rounded-full shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--principal-shadow)]" aria-label="Abrir panel">
                    <i className="bi bi-list text-2xl"></i>
                </button>
            )}
        </>
    );
}