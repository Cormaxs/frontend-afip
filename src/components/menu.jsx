import React, { useState, useEffect, useCallback, useContext, memo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { apiContext } from '../context/api_context';

// --- ESTRUCTURA DE MENÚ LÓGICA Y ACTUALIZADA ---
const menuGroups = {
    dashboard: {
        title: "Dashboard",
        icon: <i className="bi bi-columns-gap"></i>,
        items: [
            { path: "/dashboard", label: "Inicio", icon: <i className="bi bi-house-fill"></i> },
            { path: "/metricas", label: "Métricas", icon: <i className="bi bi-bar-chart-line"></i> }
        ]
    },
    ventas: {
        title: "Ventas",
        icon: <i className="bi bi-cart3"></i>,
        items: [
            { path: "/tiket/create", label: "Nueva Venta / Cobrar", icon: <i className="bi bi-cash-coin"></i> },
            { path: "/get-puntoVenta", label: "Puntos de Venta", icon: <i className="bi bi-shop"></i> },
            { path: "/tiket/get", label: "Historial de tikets", icon: <i className="bi bi-receipt"></i> },
            //{ path: "/create-factura", label: "Crear Factura", icon: <i className="bi bi-file-earmark-text"></i> },
        ]
    },
    inventario: {
        title: "Inventario",
        icon: <i className="bi bi-box-seam"></i>,
        items: [
            { path: "/productos", label: "Gestión de Productos", icon: <i className="bi bi-card-checklist"></i> },
        ]
    },
    caja: {
        title: "Caja",
        icon: <i className="bi bi-safe2"></i>,
        items: [
            // Apunta al nuevo componente unificado
            { path: "/gestion-cajas", label: "Gestión de Cajas", icon: <i className="bi bi-arrow-repeat"></i> },
            { path: "/get-cajas-empresa", label: "Historial de Cajas", icon: <i className="bi bi-archive"></i> }
        ]
    },
    configuracion: {
        title: "Configuración",
        icon: <i className="bi bi-gear-fill"></i>,
        items: [
           // { path: "/usuarios", label: "Personal y Usuarios", icon: <i className="bi bi-people"></i> },
            { path: "/add-vendedor", label: "Agregar Vendedor", icon: <i className="bi bi-person-add"></i> }
        ]
    },
    // Sección para la configuración inicial de la empresa
   /* setup: {
        title: "Primeros Pasos",
        icon: <i className="bi bi-rocket-takeoff"></i>,
        items: [
            { path: "/empresa-register", label: "Registrar Empresa", icon: <i className="bi bi-building-add"></i> },
            { path: "/generate-key-crs", label: "Generar Clave Digital", icon: <i className="bi bi-key"></i> },
            { path: "/generate-crt", label: "Subir Certificado", icon: <i className="bi bi-patch-check"></i> },
        ]
    }*/
};


// --- SUB-COMPONENTES MEMOIZADOS (SIN CAMBIOS) ---

const UserProfile = memo(({ user }) => {
    if (!user) return null;
    const fullName = `${user.nombre || ''} ${user.apellido || ''}`.trim();

    const getInitials = (name = '') => {
        const names = name.split(' ').filter(n => n);
        if (names.length > 1) {
            return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    };

    return (
        <div className="p-2 rounded-lg hover:bg-black/20 transition-colors duration-200">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[var(--principal-activo)] flex items-center justify-center font-bold text-white shrink-0">
                    {user.avatarUrl ? (
                        <img src={user.avatarUrl} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                    ) : (
                        <span>{getInitials(fullName)}</span>
                    )}
                </div>
                <div className="overflow-hidden">
                    <p className="text-sm font-semibold text-white truncate" title={fullName}>
                        {fullName || 'Usuario'}
                    </p>
                    {user.rol && (
                         <span className="bg-indigo-500/50 text-indigo-100 text-xs font-medium px-2 py-0.5 rounded-full">
                             {user.rol}
                         </span>
                    )}
                </div>
            </div>
        </div>
    );
});

const MenuItem = memo(({ item, isActive }) => (
    <Link to={item.path} className={`flex items-center p-2 rounded-md text-sm font-medium ${isActive ? 'bg-[var(--principal-activo)] text-white shadow-md' : 'text-gray-100 hover:bg-[var(--principal-shadow)]'} transition duration-200 ease-in-out group`}>
        <span className="mr-3 text-lg group-hover:scale-110 transition-transform">{item.icon}</span>
        <span>{item.label}</span>
    </Link>
));

const SubMenu = memo(({ group, open, isActivePath, toggleSubmenu }) => {
    const isGroupActive = group.items.some(isActivePath);
    return (
        <div className="mb-2">
            <button onClick={toggleSubmenu} className={`w-full flex items-center justify-between p-2 rounded-md ${isGroupActive ? 'bg-black/20 text-white' : 'text-gray-200 hover:bg-black/20 hover:text-white'} transition-colors duration-200 ease-in-out text-left`}>
                <div className="flex items-center">
                    <span className="mr-3 text-xl">{group.icon}</span>
                    <span className="font-semibold text-sm uppercase tracking-wider">{group.title}</span>
                </div>
                <i className={`bi bi-chevron-down transform transition-transform duration-300 ${open ? 'rotate-180' : ''}`}></i>
            </button>
            <div className={`ml-4 pl-4 border-l-2 border-white/10 mt-2 space-y-1 overflow-hidden transition-all duration-300 ease-in-out ${open ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'}`}>
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
        handleResize();
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        const activeGroup = Object.keys(menuGroups).find(key =>
            menuGroups[key].items.some(item => location.pathname === item.path)
        );
        setOpenSubmenu(activeGroup || null);
    }, [location.pathname]);

    const togglePanel = useCallback(() => setIsOpen(prev => !prev), []);
    const toggleSubmenu = useCallback((menuKey) => setOpenSubmenu(prev => (prev === menuKey ? null : menuKey)), []);
    const isActivePath = useCallback((path) => location.pathname === path, [location.pathname]);

    return (
        <>
            <aside className={`fixed inset-y-0 left-0 transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 z-50 transition-transform duration-300 ease-in-out bg-gradient-to-b from-[var(--principal)] to-[var(--principal-shadow)] text-white w-64 shadow-xl flex flex-col`}>
                
                <header className="p-4 border-b border-white/10 text-center">
                    <div className="flex items-center justify-center gap-2">
                        <Link to="/" className="text-2xl font-extrabold flex items-center text-white">
                            <i className="bi bi-check2-all text-3xl text-indigo-200 mr-2"></i>
                            <span>FACSTOCK</span>
                        </Link>
                    </div>
                    {companyData && (
                        <div className="mt-2 bg-black/20 p-2 rounded-md text-xs font-medium text-indigo-200 flex items-center justify-center gap-2">
                            <i className="bi bi-briefcase-fill"></i>
                            <span className="truncate">{companyData.nombreEmpresa || 'Empresa Activa'}</span>
                        </div>
                    )}
                </header>

                <nav className="p-2 flex-grow overflow-y-auto custom-scrollbar">
                    {Object.entries(menuGroups).map(([key, group]) => (
                        <SubMenu key={key} group={group} open={openSubmenu === key} isActivePath={isActivePath} toggleSubmenu={() => toggleSubmenu(key)} />
                    ))}
                </nav>

                <footer className="mt-auto p-4 border-t border-white/10">
                    <UserProfile user={userData} />
                    
                    <button onClick={logout} className="flex items-center w-full p-2 mt-4 rounded-md text-gray-200 hover:bg-red-500/80 hover:text-white transition-colors duration-200 ease-in-out group">
                        <i className="bi bi-box-arrow-left text-lg mr-3 group-hover:scale-110 transition-transform"></i>
                        <span className="font-semibold">Cerrar Sesión</span>
                    </button>
                </footer>
            </aside>

            {isOpen && <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={togglePanel}></div>}
            
            {!isOpen && (
                <button onClick={togglePanel} className="fixed bottom-4 left-4 z-30 md:hidden bg-[var(--principal)] text-white p-3 rounded-full shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--principal-shadow)]" aria-label="Abrir panel">
                    <i className="bi bi-list text-2xl"></i>
                </button>
            )}
        </>
    );
}