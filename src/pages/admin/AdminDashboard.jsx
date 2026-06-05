import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    getCompaniesSummary,
    getCompanyDetails,
    getCompanyProducts,
    getCompanyTickets,
    getCompanyFacturas,
    getCompanyNotasPedido,
    getCompanyCajas,
    getCompanyPuntosVenta,
    getCompanyPagosProveedor,
    getCompanyCuentasPagar,
    getCompanyPayments
} from '../../services/admin/admin.service.js';
import { LogOut, Users, Package, FileText, ClipboardList, ShoppingBag, Banknote, Building, ClipboardCheck, Store, DollarSign, Zap, CreditCard } from 'lucide-react';
import AdminDataView from './AdminDataView.jsx';
import PlanLimitsView from './PlanLimitsView.jsx';
import PlanManagementView from './PlanManagementView.jsx';
import '../../styles/admin.css';

export default function AdminDashboard() {
    const [companies, setCompanies] = useState([]);
    const [selectedCompany, setSelectedCompany] = useState(null);
    const [companyDetails, setCompanyDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('overview');
    const [mainView, setMainView] = useState('companies'); // 'companies' o 'plans'
    const [tabData, setTabData] = useState(null);
    const [tabLoading, setTabLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        loadCompanies();
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('isAdminLoggedIn');
        localStorage.removeItem('adminAuthToken');
        navigate('/admin/login');
    };

    const loadCompanies = async () => {
        try {
            setLoading(true);
            const data = await getCompaniesSummary();
            setCompanies(data.companies || []);
            setError(null);
        } catch (err) {
            const apiBase = (import.meta.env.VITE_API_URL || "http://localhost:3010").replace(/\/$/, "");
            setError(`Error al cargar las empresas. Verifica la conexión con el backend en ${apiBase}.`);
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectCompany = async (company) => {
        try {
            setLoading(true);
            setSelectedCompany(company._id);
            const details = await getCompanyDetails(company._id);
            setCompanyDetails(details);
            setActiveTab('overview');
            setError(null);
        } catch (err) {
            setError('Error al cargar los detalles de la empresa.');
            console.error(err);
            setCompanyDetails(null);
        } finally {
            setLoading(false);
        }
    };

    const loadTabData = async (tabName) => {
        if (!selectedCompany) return;

        try {
            setTabLoading(true);
            let data = null;

            switch (tabName) {
                case 'products':
                    data = await getCompanyProducts(selectedCompany);
                    break;
                case 'tickets':
                    data = await getCompanyTickets(selectedCompany);
                    break;
                case 'facturas':
                    data = await getCompanyFacturas(selectedCompany);
                    break;
                case 'notas':
                    data = await getCompanyNotasPedido(selectedCompany);
                    break;
                case 'cajas':
                    data = await getCompanyCajas(selectedCompany);
                    break;
                case 'puntos':
                    data = await getCompanyPuntosVenta(selectedCompany);
                    break;
                case 'pagos':
                    data = await getCompanyPagosProveedor(selectedCompany);
                    break;
                case 'cuentas':
                    data = await getCompanyCuentasPagar(selectedCompany);
                    break;
                case 'payments':
                    data = await getCompanyPayments(selectedCompany);
                    break;
            }

            setTabData(data);
            setActiveTab(tabName);
        } catch (err) {
            setError(`Error al cargar datos de ${tabName}`);
            console.error(err);
        } finally {
            setTabLoading(false);
        }
    };

    const filteredCompanies = companies.filter(c =>
        c.nombreEmpresa?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.cuit?.includes(searchTerm)
    );

    const tabsConfig = [
        { id: 'overview', label: 'Resumen', icon: Building, iconJSX: <Building size={18} /> },
        { id: 'plan', label: 'Plan', icon: Zap, iconJSX: <Zap size={18} />, isPlanTab: true },
        { id: 'products', label: 'Productos', icon: Package, iconJSX: <Package size={18} />, dataKey: 'products' },
        { id: 'facturas', label: 'Facturas', icon: FileText, iconJSX: <FileText size={18} />, dataKey: 'facturas' },
        { id: 'tickets', label: 'Tickets', icon: ClipboardList, iconJSX: <ClipboardList size={18} />, dataKey: 'tickets' },
        { id: 'notas', label: 'Notas de Pedido', icon: ClipboardCheck, iconJSX: <ClipboardCheck size={18} />, dataKey: 'notas' },
        { id: 'cajas', label: 'Cajas', icon: ShoppingBag, iconJSX: <ShoppingBag size={18} />, dataKey: 'cajas' },
        { id: 'puntos', label: 'P. Venta', icon: Store, iconJSX: <Store size={18} />, dataKey: 'puntos' },
        { id: 'pagos', label: 'Pagos Prov.', icon: DollarSign, iconJSX: <DollarSign size={18} />, dataKey: 'pagos' },
        { id: 'cuentas', label: 'C. Pagar', icon: Banknote, iconJSX: <Banknote size={18} />, dataKey: 'cuentas' },
        { id: 'payments', label: 'Pagos MP', icon: CreditCard, iconJSX: <CreditCard size={18} />, dataKey: 'payments' },
    ];

    return (
        <div className="admin-dashboard">
            {/* Header */}
            <header className="admin-header">
                <div className="admin-header-left">
                    <div className="flex items-center gap-6">
                        <div>
                            <h1>Panel de Administración</h1>
                            <p>Gestión centralizada del SaaS</p>
                        </div>
                        <nav className="flex gap-4">
                            <button 
                                onClick={() => setMainView('companies')}
                                className={`btn ${mainView === 'companies' ? 'btn-primary' : 'btn-outline'}`}
                                style={{ margin: 0, padding: '8px 16px' }}
                            >
                                <Building size={18} className="mr-2" /> Empresas
                            </button>
                            <button 
                                onClick={() => setMainView('plans')}
                                className={`btn ${mainView === 'plans' ? 'btn-primary' : 'btn-outline'}`}
                                style={{ margin: 0, padding: '8px 16px' }}
                            >
                                <Zap size={18} className="mr-2" /> Gestión de Planes
                            </button>
                        </nav>
                    </div>
                </div>
                <button
                    onClick={handleLogout}
                    className="admin-logout-btn"
                >
                    <LogOut size={20} />
                    Cerrar Sesión
                </button>
            </header>

            <div className="admin-container">
                {/* Error Message */}
                {error && (
                    <div className="admin-alert admin-alert--error">
                        <span>⚠️ {error}</span>
                        <button onClick={loadCompanies} className="admin-alert-retry">
                            Reintentar
                        </button>
                    </div>
                )}

                {mainView === 'plans' ? (
                    <div className="p-6">
                        <PlanManagementView />
                    </div>
                ) : (
                    <div className="admin-grid">
                        {/* Panel Izquierdo - Lista de Empresas */}
                        <div className="admin-sidebar">
                        <div className="admin-sidebar-header">
                            <h2>Empresas ({companies.length})</h2>
                        </div>

                        <div className="admin-search">
                            <input
                                type="text"
                                placeholder="Buscar empresa..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="admin-search-input"
                            />
                        </div>

                        <div className="admin-companies-list">
                            {loading && companies.length === 0 ? (
                                <div className="admin-empty-state">
                                    <div className="admin-spinner"></div>
                                    <p>Cargando empresas...</p>
                                </div>
                            ) : filteredCompanies.length === 0 ? (
                                <div className="admin-empty-state">
                                    <p>No hay empresas</p>
                                </div>
                            ) : (
                                filteredCompanies.map(company => (
                                    <button
                                        key={company._id}
                                        onClick={() => handleSelectCompany(company)}
                                        className={`admin-company-item ${
                                            selectedCompany === company._id ? 'admin-company-item--active' : ''
                                        }`}
                                    >
                                        <div className="admin-company-item-header">
                                            <h3>{company.nombreEmpresa}</h3>
                                            <span className="admin-company-badge">{company.counts?.users || 0}</span>
                                        </div>
                                        <p className="admin-company-cuit">{company.cuit || 'Sin CUIT'}</p>
                                        <div className="admin-company-stats">
                                            <span title="Usuarios"><Users size={14} /> {company.counts?.users || 0}</span>
                                            <span title="Productos"><Package size={14} /> {company.counts?.products || 0}</span>
                                            <span title="Facturas"><FileText size={14} /> {company.counts?.facturas || 0}</span>
                                            <span title="Notas de pedido"><ClipboardList size={14} /> {company.counts?.notasPedido || 0}</span>
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Panel Derecho - Detalles */}
                    <div className="admin-content">
                        {selectedCompany && companyDetails ? (
                            <>
                                {/* Tabs Navigation */}
                                <div className="admin-tabs">
                                    {tabsConfig.map(tab => (
                                        <button
                                            key={tab.id}
                                            className={`admin-tab ${activeTab === tab.id ? 'admin-tab--active' : ''}`}
                                            onClick={() => {
                                                if (tab.id === 'overview') {
                                                    setActiveTab('overview');
                                                } else {
                                                    loadTabData(tab.id);
                                                }
                                            }}
                                            disabled={tabLoading}
                                        >
                                            {tab.iconJSX}
                                            <span>{tab.label}</span>
                                        </button>
                                    ))}
                                </div>

                                {/* Tab Content */}
                                <div className="admin-tabs-content">
                                    {activeTab === 'overview' && (
                                        <div className="admin-details">
                                            <div className="admin-details-header">
                                                <div>
                                                    <h2>{companyDetails.company?.nombreEmpresa}</h2>
                                                    <p className="admin-text-muted">{companyDetails.company?.razonSocial || 'N/A'}</p>
                                                </div>
                                            </div>

                                            <div className="admin-info-grid">
                                                <div className="admin-info-card">
                                                    <label>CUIT</label>
                                                    <p>{companyDetails.company?.cuit || 'No registrado'}</p>
                                                </div>
                                                <div className="admin-info-card">
                                                    <label>Email</label>
                                                    <p>{companyDetails.company?.emailContacto || 'N/A'}</p>
                                                </div>
                                                <div className="admin-info-card">
                                                    <label>Teléfono</label>
                                                    <p>{companyDetails.company?.telefonoContacto || 'N/A'}</p>
                                                </div>
                                                <div className="admin-info-card">
                                                    <label>Provincia</label>
                                                    <p>{companyDetails.company?.provincia || 'N/A'}</p>
                                                </div>
                                                <div className="admin-info-card">
                                                    <label>Estado MP</label>
                                                    <p>
                                                        <span className={`admin-badge ${
                                                            companyDetails.company?.mpStatus === 'authorized' 
                                                                ? 'admin-badge--success' 
                                                                : 'admin-badge--warning'
                                                        }`}>
                                                            {companyDetails.company?.mpStatus || 'No vinculado'}
                                                        </span>
                                                    </p>
                                                </div>
                                                <div className="admin-info-card">
                                                    <label>Próximo Pago</label>
                                                    <p>{companyDetails.company?.proximoPago ? new Date(companyDetails.company.proximoPago).toLocaleDateString('es-AR') : 'N/A'}</p>
                                                </div>
                                                <div className="admin-info-card admin-info-card--full">
                                                    <label>Dirección</label>
                                                    <p>{companyDetails.company?.direccion || 'N/A'}</p>
                                                </div>
                                            </div>

                                            {/* Estadísticas */}
                                            <div className="admin-stats-section">
                                                <h3>Estadísticas de Datos</h3>
                                                <div className="admin-stats-grid">
                                                    {[
                                                        { label: 'Usuarios', value: companyDetails.counts?.users || 0, icon: <Users size={20} />, color: '#3b82f6' },
                                                        { label: 'Productos', value: companyDetails.counts?.products || 0, icon: <Package size={20} />, color: '#10b981' },
                                                        { label: 'Clientes', value: companyDetails.counts?.clients || 0, icon: <ShoppingBag size={20} />, color: '#f59e0b' },
                                                        { label: 'Facturas', value: companyDetails.counts?.facturas || 0, icon: <FileText size={20} />, color: '#6366f1' },
                                                        { label: 'Notas de pedido', value: companyDetails.counts?.notasPedido || 0, icon: <ClipboardList size={20} />, color: '#ec4899' },
                                                        { label: 'Tickets', value: companyDetails.counts?.tickets || 0, icon: <Building size={20} />, color: '#8b5cf6' },
                                                        { label: 'P. Venta', value: companyDetails.counts?.puntosVenta || 0, icon: <Store size={20} />, color: '#ec4899' },
                                                        { label: 'Cajas', value: companyDetails.counts?.cajas || 0, icon: <ShoppingBag size={20} />, color: '#6366f1' },
                                                        { label: 'C. Pagar', value: companyDetails.counts?.cuentasPagar || 0, icon: <ClipboardCheck size={20} />, color: '#ef4444' },
                                                        { label: 'Pagos Prov.', value: companyDetails.counts?.pagosProveedor || 0, icon: <DollarSign size={20} />, color: '#16a34a' },
                                                        { label: 'Pagos MP', value: companyDetails.counts?.payments || 0, icon: <CreditCard size={20} />, color: '#3b82f6' },
                                                    ].map((stat, idx) => (
                                                        <div key={idx} className="admin-stat-card" style={{ borderLeftColor: stat.color }}>
                                                            <div className="admin-stat-icon">{stat.icon}</div>
                                                            <div className="admin-stat-content">
                                                                <p className="admin-stat-label">{stat.label}</p>
                                                                <p className="admin-stat-value">{stat.value}</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Usuarios */}
                                            <div className="admin-users-section">
                                                <h3>Usuarios de la Empresa ({companyDetails.users?.length || 0})</h3>
                                                {companyDetails.users && companyDetails.users.length > 0 ? (
                                                    <div className="admin-table-wrapper">
                                                        <table className="admin-table">
                                                            <thead>
                                                                <tr>
                                                                    <th>Usuario</th>
                                                                    <th>Email</th>
                                                                    <th>Rol</th>
                                                                    <th>Estado</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {companyDetails.users.map(user => (
                                                                    <tr key={user._id}>
                                                                        <td className="admin-table-bold">
                                                                            {user.nombre || user.username}
                                                                        </td>
                                                                        <td>{user.email}</td>
                                                                        <td>
                                                                            <span className="admin-badge admin-badge--role">
                                                                                {user.rol}
                                                                            </span>
                                                                        </td>
                                                                        <td>
                                                                            <span className={`admin-badge ${
                                                                                user.activo
                                                                                    ? 'admin-badge--success'
                                                                                    : 'admin-badge--danger'
                                                                            }`}>
                                                                                {user.activo ? 'Activo' : 'Inactivo'}
                                                                            </span>
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                ) : (
                                                    <div className="admin-empty-state">
                                                        <p>No hay usuarios en esta empresa</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {activeTab !== 'overview' && activeTab !== 'plan' && tabData && (
                                        <AdminDataView
                                            title={tabsConfig.find(t => t.id === activeTab)?.label}
                                            icon={tabsConfig.find(t => t.id === activeTab)?.icon}
                                            data={tabData[Object.keys(tabData)[0]] || tabData.data || []}
                                            columns={getColumnsForTab(activeTab)}
                                            onClose={() => setActiveTab('overview')}
                                        />
                                    )}

                                    {activeTab === 'plan' && selectedCompany && (
                                        <PlanLimitsView
                                            companyId={selectedCompany}
                                            companyName={companyDetails?.company?.nombreEmpresa}
                                        />
                                    )}

                                    {tabLoading && (
                                        <div className="admin-loading-overlay">
                                            <div className="admin-spinner"></div>
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className="admin-empty-main">
                                <div className="admin-empty-main-icon"><FileText size={48} /></div>
                                <h3>Selecciona una empresa</h3>
                                <p>Elige una empresa de la lista para ver sus detalles</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    </div>
);
}

// Función auxiliar para obtener columnas según el tab
function getColumnsForTab(tabId) {
    const columnsMap = {
        products: [
            { key: 'producto', label: 'Producto' },
            { key: 'codigoInterno', label: 'Código' },
            { key: 'precioCosto', label: 'Costo' },
            { key: 'precioLista', label: 'Venta' },
            { key: 'stock_disponible', label: 'Stock' },
            { key: 'alic_IVA', label: 'IVA %' },
        ],
        facturas: [
            { key: 'numeroComprobante', label: 'Número' },
            { key: 'tipoComprobante', label: 'Tipo' },
            { key: 'fechaHora', label: 'Fecha' },
            { key: 'estadoFactura', label: 'Estado' },
            { key: 'totales', label: 'Total' },
        ],
        tickets: [
            { key: 'numeroComprobante', label: 'Número' },
            { key: 'fechaHora', label: 'Fecha' },
            { key: 'estadoFactura', label: 'Estado' },
            { key: 'totales', label: 'Monto' },
            { key: 'source', label: 'Origen' },
        ],
        notas: [
            { key: 'pedidoId', label: 'ID Pedido' },
            { key: 'fechaHora', label: 'Fecha' },
            { key: 'estado', label: 'Estado' },
            { key: 'totales', label: 'Total' },
            { key: 'vendedor', label: 'Vendedor' },
        ],
        cajas: [
            { key: 'nombreCaja', label: 'Caja' },
            { key: 'estado', label: 'Estado' },
            { key: 'fechaApertura', label: 'Apertura' },
            { key: 'montoInicial', label: 'Inicial' },
            { key: 'montoFinalReal', label: 'Real' },
            { key: 'diferencia', label: 'Diferencia' },
        ],
        puntos: [
            { key: 'nombre', label: 'Nombre' },
            { key: 'numero', label: 'Número' },
            { key: 'activo', label: 'Activo' },
            { key: 'ultimoCbteAutorizado', label: 'Últ. Comp.' },
            { key: 'direccion', label: 'Dirección' },
        ],
        pagos: [
            { key: 'proveedor', label: 'Proveedor' },
            { key: 'montoPagado', label: 'Monto' },
            { key: 'metodoPago', label: 'Método' },
            { key: 'fechaPago', label: 'Fecha' },
        ],
        cuentas: [
            { key: 'proveedor', label: 'Proveedor' },
            { key: 'montoTotal', label: 'Total' },
            { key: 'montoPendiente', label: 'Pendiente' },
            { key: 'estado', label: 'Estado' },
            { key: 'fechaVencimiento', label: 'Vencimiento' },
        ],
        payments: [
            { key: 'monto', label: 'Monto' },
            { key: 'moneda', label: 'Moneda' },
            { key: 'fechaPago', label: 'Fecha' },
            { key: 'metodoPago', label: 'Método' },
            { key: 'estado', label: 'Estado' },
            { key: 'referenciaPago', label: 'Ref. MP' },
        ],
    };
    return columnsMap[tabId] || [];
}
