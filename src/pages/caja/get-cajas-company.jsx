import React, { useContext, useEffect, useState, useCallback, useRef, useMemo } from "react";
import { apiContext } from "../../context/api_context";
import Swal from 'sweetalert2';

// --- FUNCIONES DE UTILIDAD Y CONSTANTES (Fuera del componente) ---
const INITIAL_FILTERS = {
    puntoVenta: '',
    vendedor: '',
    fechaDesde: '',
    fechaHasta: '',
    estado: '',
};

const formatDateTime = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const formatCurrency = (amount) => {
    if (typeof amount !== 'number') return '$ 0,00';
    return `$ ${amount.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

// --- ÍCONOS REUTILIZABLES (Del segundo componente) ---
const Icon = ({ path, className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d={path} />
    </svg>
);
const SpinnerIcon = (props) => <Icon path="M12 3v1m0 16v1m8.4-15.4l-.7.7m-11.4 0l.7.7M21 12h-1M4 12H3m15.4 8.4l-.7-.7m-11.4 0l.7-.7" {...props} className={`animate-spin ${props.className || 'h-5 w-5'}`} />;
const OpenIcon = (props) => <Icon path="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.658-.463 1.243-1.117 1.243H4.557c-.654 0-1.187-.585-1.117-1.243l1.263-12a1.125 1.125 0 011.117-1.007h8.878c.553 0 1.026.43 1.117 1.007z" {...props} />;
const CloseIcon = (props) => <Icon path="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" {...props} />;
const MovementIcon = (props) => <Icon path="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" {...props} />;


// --- SUB-COMPONENTE MEMOIZADO PARA LA FILA DEL HISTORIAL ---
const RowItem = React.memo(({ caja, isExpanded, onRowClick }) => (
    <React.Fragment>
        {/* Fila Principal */}
        <tr onClick={() => onRowClick(caja._id)} className={`hover:bg-gray-100 cursor-pointer ${isExpanded ? 'bg-gray-100' : ''}`}>
            <td className="px-4 py-2 text-center">
                <span className={`transform transition-transform duration-200 inline-block ${isExpanded ? 'rotate-90' : ''}`}>▶</span>
            </td>
            <td className="px-4 py-2">
                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${caja.estado === 'abierta' ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>{caja.estado}</span>
            </td>
            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-800">
                <div className="font-medium">{caja.puntoDeVenta?.nombre || 'N/A'}</div>
                <div className="text-gray-500">{caja.vendedorAsignado?.nombre || 'N/A'}</div>
            </td>
            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{formatDateTime(caja.fechaApertura)}</td>
            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-800 text-right">{formatCurrency(caja.montoFinalReal)}</td>
            <td className={`px-4 py-2 whitespace-nowrap text-sm font-medium text-right ${caja.diferencia < 0 ? 'text-red-600' : 'text-green-600'}`}>{formatCurrency(caja.diferencia)}</td>
        </tr>
        {/* Fila de Detalles */}
        {isExpanded && (
            <tr>
                <td colSpan="6" className="p-0 bg-gray-50">
                    <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-b">
                        {/* Resumen de Caja */}
                        <div className="space-y-2">
                            <h4 className="font-bold text-gray-700 border-b pb-2">Resumen de Caja</h4>
                            <div className="flex justify-between text-sm"><span className="text-gray-600">Monto Inicial:</span> <span className="font-medium">{formatCurrency(caja.montoInicial)}</span></div>
                            <div className="flex justify-between text-sm"><span className="text-gray-600">Ingresos Totales:</span> <span className="font-medium text-green-600">{formatCurrency(caja.ingresos)}</span></div>
                            <div className="flex justify-between text-sm"><span className="text-gray-600">Egresos Totales:</span> <span className="font-medium text-red-600">{formatCurrency(caja.egresos)}</span></div>
                            <div className="flex justify-between text-sm pt-2 border-t"><span className="text-gray-600">M. Final Esperado:</span> <span className="font-medium">{formatCurrency(caja.montoFinalEsperado)}</span></div>
                        </div>
                         {/* Lista de Transacciones */}
                        <div>
                            <h4 className="font-bold text-gray-700 border-b pb-2">Movimientos</h4>
                            {caja.transacciones?.length > 0 ? (
                                <ul className="divide-y divide-gray-200 max-h-48 overflow-y-auto">
                                    {caja.transacciones.map(t => (
                                        <li key={t._id} className="py-2 flex justify-between items-center">
                                            <span className="text-sm text-gray-700">{t.descripcion || 'Sin descripción'} ({t.metodoPago})</span>
                                            <span className={`font-medium text-sm ${t.tipo === 'ingreso' ? 'text-green-600' : 'text-red-600'}`}>
                                                {t.tipo === 'ingreso' ? '+' : '-'}{formatCurrency(t.monto)}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-sm text-gray-500 mt-2">No hay movimientos para mostrar.</p>
                            )}
                        </div>
                    </div>
                </td>
            </tr>
        )}
    </React.Fragment>
));


// --- COMPONENTE PRINCIPAL UNIFICADO ---
export default function HistorialCajas() {
    // --- CONTEXTO ---
    const { userData, companyData, get_caja_company, getPointsByCompany, abrirCaja, cerrarCaja, ingreso_egreso } = useContext(apiContext);

    // --- ESTADOS PARA HISTORIAL Y FILTROS ---
    const [apiData, setApiData] = useState({ cajas: [], pagination: {} });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [hasSearched, setHasSearched] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [filters, setFilters] = useState(INITIAL_FILTERS);
    const [puntosDeVenta, setPuntosDeVenta] = useState([]);
    const [expandedRowId, setExpandedRowId] = useState(null);
    const isInitialMount = useRef(true);

    // --- ESTADOS PARA EL MODAL DE GESTIÓN ---
    const [isGestionModalOpen, setIsGestionModalOpen] = useState(false);
    const [isModalLoading, setIsModalLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [activeTab, setActiveTab] = useState('abrir');
    const [cajasAbiertas, setCajasAbiertas] = useState([]);
    const [formAbrir, setFormAbrir] = useState({ puntoVenta: '', nombreCaja: '', montoInicial: '', fechaApertura: new Date().toISOString().split('T')[0] });
    const [formCerrar, setFormCerrar] = useState({ cajaId: '', montoFinal: '', observaciones: '' });
    const [formMovimiento, setFormMovimiento] = useState({ cajaId: '', tipo: 'ingreso', monto: '', descripcion: '', metodoPago: 'Efectivo' });
    
    // --- FUNCIÓN PARA REFESCAR TODOS LOS DATOS ---
    const refreshAllData = useCallback(async () => {
        // Refresca el historial de fondo
        if (hasSearched) {
            await fetchData(currentPage, filters);
        }
        // Refresca los datos del modal (cajas abiertas)
        if (companyData?._id) {
            try {
                const cajasRes = await get_caja_company(companyData._id, 1, { estado: 'abierta', limit: 500 });
                setCajasAbiertas(cajasRes?.cajas || []);
            } catch (err) {
                console.error("Error al refrescar las cajas abiertas:", err);
            }
        }
    }, [hasSearched, currentPage, filters, companyData?._id]); // Dependencias clave para el refresco

    // --- LÓGICA DE CARGA DE DATOS ---

    // 1. Cargar Puntos de Venta (una sola vez)
    useEffect(() => {
        const fetchPuntosDeVenta = async (companyId) => {
            try {
                const response = await getPointsByCompany(companyId, 1, 500); // Límite alto para traer todos
                if (response?.puntosDeVenta) {
                    setPuntosDeVenta(response.puntosDeVenta);
                }
            } catch (err) {
                console.error("Error al obtener los puntos de venta:", err);
                setError("No se pudieron cargar los puntos de venta.");
            }
        };
        if (companyData?._id) {
            fetchPuntosDeVenta(companyData._id);
        }
    }, [companyData?._id, getPointsByCompany]);
    
    // 2. Cargar Cajas Abiertas (para el modal) cuando se abre
    useEffect(() => {
        const fetchCajasAbiertas = async () => {
            if (!companyData?._id) return;
            setIsModalLoading(true);
            try {
                const cajasRes = await get_caja_company(companyData._id, 1, { estado: 'abierta', limit: 500 });
                setCajasAbiertas(cajasRes?.cajas || []);
            } catch (err) {
                Swal.fire('Error', 'No se pudieron cargar las cajas abiertas.', 'error');
                console.error(err);
            } finally {
                setIsModalLoading(false);
            }
        };

        if (isGestionModalOpen) {
            fetchCajasAbiertas();
        }
    }, [isGestionModalOpen, companyData?._id, get_caja_company]);


    // 3. Función para obtener el HISTORIAL (memoizada)
    const fetchData = useCallback(async (page, currentFilters) => {
        if (!companyData?._id) return;
        setLoading(true);
        setError(null);
        setHasSearched(true);
        try {
            const response = await get_caja_company(companyData._id, page, currentFilters);
            setApiData(response || { cajas: [], pagination: {} });
        } catch (err) {
            setError("No se pudieron cargar los registros de caja.");
            console.error("Error al obtener las cajas:", err);
        } finally {
            setLoading(false);
        }
    }, [companyData?._id, get_caja_company]);
    
    // 4. Efecto para buscar en el HISTORIAL cuando cambian filtros o página
    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false;
            return;
        }
        if (hasSearched) {
            fetchData(currentPage, filters);
        }
    }, [currentPage, filters, hasSearched, fetchData]);

    // --- MANEJADORES DE EVENTOS DEL HISTORIAL ---
    const handleFilterChange = useCallback((e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    }, []);

    const handleFilterSubmit = (e) => {
        e.preventDefault();
        setCurrentPage(1);
        fetchData(1, filters);
    };

    const handleClearFilters = useCallback(() => {
        setFilters(INITIAL_FILTERS);
        setCurrentPage(1);
        setApiData({ cajas: [], pagination: {} });
        setHasSearched(false);
        setError(null);
        isInitialMount.current = true;
    }, []);
    
    const handleRowClick = useCallback((cajaId) => {
        setExpandedRowId(prevId => (prevId === cajaId ? null : cajaId));
    }, []);

    // --- MANEJADORES DE ACCIONES DEL MODAL DE GESTIÓN ---
    const handleAbrirCaja = async (e) => {
        e.preventDefault();
        if (!formAbrir.puntoVenta || !formAbrir.nombreCaja.trim()) {
            return Swal.fire('Atención', 'Debés seleccionar un punto de venta y darle un nombre a la caja.', 'warning');
        }
        setIsSubmitting(true);
        try {
            await abrirCaja({
                empresa: companyData._id,
                puntoDeVenta: formAbrir.puntoVenta,
                nombreCaja: formAbrir.nombreCaja.trim(),
                vendedorAsignado: userData._id,
                montoInicial: parseFloat(formAbrir.montoInicial) || 0,
                fechaApertura: formAbrir.fechaApertura,
            });
            await Swal.fire('¡Éxito!', 'La caja se abrió correctamente.', 'success');
            setFormAbrir({ puntoVenta: '', nombreCaja: '', montoInicial: '', fechaApertura: new Date().toISOString().split('T')[0] });
            await refreshAllData(); // Refresca todo
            setActiveTab('movimientos');
        } catch (err) {
            Swal.fire('Error', err.message || "No se pudo abrir la caja.", 'error');
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleCerrarCaja = async (e) => {
        e.preventDefault();
        const cajaSeleccionada = cajasAbiertas.find(c => c._id === formCerrar.cajaId);
        if (!cajaSeleccionada) {
            return Swal.fire('Error', 'Debes seleccionar una caja para cerrar.', 'error');
        }
        const result = await Swal.fire({
            title: '¿Estás seguro?', text: `Vas a cerrar la caja "${cajaSeleccionada.nombreCaja}". Esta acción no se puede deshacer.`,
            icon: 'warning', showCancelButton: true, confirmButtonColor: '#d33', cancelButtonText: 'Cancelar', confirmButtonText: 'Sí, cerrar caja'
        });
        if (!result.isConfirmed) return;

        setIsSubmitting(true);
        try {
            await cerrarCaja({
                montoFinalReal: parseFloat(formCerrar.montoFinal) || 0,
                observacionesCierre: formCerrar.observaciones,
                usuarioCierre: userData?._id
            }, formCerrar.cajaId);
            await Swal.fire('¡Éxito!', 'Caja cerrada exitosamente.', 'success');
            setFormCerrar({ cajaId: '', montoFinal: '', observaciones: '' });
            await refreshAllData(); // Refresca todo
            if (cajasAbiertas.length - 1 === 0) setActiveTab('abrir'); // Si no quedan cajas, vuelve a "abrir"
        } catch (err) {
            Swal.fire('Error', err.message || "No se pudo cerrar la caja.", 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleMovimiento = async (e) => {
        e.preventDefault();
        if (!formMovimiento.cajaId || !formMovimiento.descripcion.trim() || parseFloat(formMovimiento.monto) <= 0) {
            return Swal.fire('Atención', 'Seleccioná una caja, ingresá un monto mayor a cero y una descripción.', 'warning');
        }
        setIsSubmitting(true);
        try {
            await ingreso_egreso({
                tipo: formMovimiento.tipo,
                monto: parseFloat(formMovimiento.monto),
                descripcion: formMovimiento.descripcion,
                metodoPago: formMovimiento.metodoPago,
            }, formMovimiento.cajaId);
            Swal.fire('¡Éxito!', `Movimiento de "${formMovimiento.tipo}" registrado.`, 'success');
            setFormMovimiento(prev => ({ ...prev, monto: '', descripcion: '' }));
            await refreshAllData(); // Refresca todo
        } catch (err) {
            Swal.fire('Error', err.message || "No se pudo registrar el movimiento.", 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- LÓGICA DERIVADA (useMemo) PARA EL MODAL ---
    const cajaSeleccionadaParaCerrar = useMemo(() => cajasAbiertas.find(c => c._id === formCerrar.cajaId), [cajasAbiertas, formCerrar.cajaId]);
    const diferenciaCierre = useMemo(() => {
        if (!cajaSeleccionadaParaCerrar || !cajaSeleccionadaParaCerrar.montoFinalEsperado) return 0;
        const esperado = cajaSeleccionadaParaCerrar.montoFinalEsperado || 0;
        const final = parseFloat(formCerrar.montoFinal) || 0;
        return final - esperado;
    }, [cajaSeleccionadaParaCerrar, formCerrar.montoFinal]);


    // --- RENDERIZADO DEL CONTENIDO DE LA TABLA ---
    const renderTableContent = () => {
        if (loading) return <p className="text-center text-gray-500 py-12">Cargando historial...</p>;
        if (error) return <p className="text-center text-red-600 py-12">{error}</p>;
        if (!hasSearched) return <p className="text-center text-gray-500 py-12">Utilice los filtros para buscar en el historial de cajas.</p>;
        if (!apiData?.cajas?.length) return <p className="text-center text-gray-500 py-12">No se encontraron registros con los filtros aplicados.</p>;

        return (
            <>
                <div className="overflow-x-auto">
                    <table className="min-w-full w-full divide-y divide-gray-200">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="w-12"></th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Estado</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">P. Venta / Vendedor</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">F. Apertura</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase">M. Final</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase">Diferencia</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {apiData.cajas.map(caja => (
                                <RowItem key={caja._id} caja={caja} isExpanded={expandedRowId === caja._id} onRowClick={handleRowClick} />
                            ))}
                        </tbody>
                    </table>
                </div>
                {/* Paginación */}
                <div className="p-4 flex justify-between items-center border-t">
                    <span className="text-sm text-gray-600">Total: {apiData.pagination.totalDocs || 0} registros</span>
                    <div className="flex items-center space-x-2">
                        <button onClick={() => setCurrentPage(p => p - 1)} disabled={!apiData.pagination.hasPrevPage || loading} className="px-3 py-1 text-sm bg-white border rounded-md disabled:opacity-50">Anterior</button>
                        <span className="text-sm text-gray-700">Página {apiData.pagination.currentPage || 0} de {apiData.pagination.totalPages || 0}</span>
                        <button onClick={() => setCurrentPage(p => p + 1)} disabled={!apiData.pagination.hasNextPage || loading} className="px-3 py-1 text-sm bg-white border rounded-md disabled:opacity-50">Siguiente</button>
                    </div>
                </div>
            </>
        );
    };

    return (
        <>
            <div className="p-4 md:p-6 bg-gray-50 min-h-screen">
                <div className="max-w-7xl mx-auto">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-3xl font-bold text-gray-800">Historial de Cajas</h2>
                        <button onClick={() => setIsGestionModalOpen(true)} className="bg-[var(--principal)] text-white font-bold py-2 px-4 rounded-lg shadow hover:bg-[var(--principal-shadow)] transition-colors flex items-center gap-2">
                           <Icon path="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" className="w-5 h-5"/>
                            Gestionar Caja
                        </button>
                    </div>

                    {/* Panel de Filtros */}
                    <div className="bg-white p-4 rounded-lg shadow-sm mb-6 border">
                        <form onSubmit={handleFilterSubmit} className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 items-end">
                            <div className="lg:col-span-1">
                                <label htmlFor="puntoVenta" className="block text-sm font-medium text-gray-700">P. de Venta</label>
                                <select name="puntoVenta" value={filters.puntoVenta} onChange={handleFilterChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm text-sm">
                                    <option value="">Todos</option>
                                    {puntosDeVenta.map(punto => (<option key={punto._id} value={punto._id}>{punto.nombre}</option>))}
                                </select>
                            </div>
                             <div className="lg:col-span-1">
                                <label htmlFor="estado" className="block text-sm font-medium text-gray-700">Estado</label>
                                <select name="estado" value={filters.estado} onChange={handleFilterChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm text-sm">
                                    <option value="">Todos</option>
                                    <option value="abierta">Abierta</option>
                                    <option value="cerrada">Cerrada</option>
                                </select>
                            </div>
                            <div className="lg:col-span-1">
                                <label htmlFor="vendedor" className="block text-sm font-medium text-gray-700">Vendedor</label>
                                <input type="text" name="vendedor" value={filters.vendedor} onChange={handleFilterChange} placeholder="Nombre o parte" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm text-sm" />
                            </div>
                            <div>
                                <label htmlFor="fechaDesde" className="block text-sm font-medium text-gray-700">Desde</label>
                                <input type="date" name="fechaDesde" value={filters.fechaDesde} onChange={handleFilterChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm text-sm" />
                            </div>
                            <div>
                                <label htmlFor="fechaHasta" className="block text-sm font-medium text-gray-700">Hasta</label>
                                <input type="date" name="fechaHasta" value={filters.fechaHasta} onChange={handleFilterChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm text-sm" />
                            </div>
                            <div className="flex space-x-2">
                                <button type="submit" className="w-full bg-[var(--principal)] text-white py-2 px-4 rounded-md shadow-sm hover:bg-[var(--principal-shadow)] text-sm font-semibold" disabled={loading}>{loading ? 'Buscando...' : 'Filtrar'}</button>
                                <button type="button" onClick={handleClearFilters} className="w-full bg-gray-200 text-gray-700 py-2 px-4 rounded-md shadow-sm hover:bg-gray-300 text-sm">Limpiar</button>
                            </div>
                        </form>
                    </div>
                    
                    {/* Contenedor de la Tabla */}
                    <div className="bg-white rounded-lg shadow-md overflow-hidden">
                        {renderTableContent()}
                    </div>
                </div>
            </div>

            {/* --- MODAL DE GESTIÓN DE CAJA --- */}
            {isGestionModalOpen && (
                <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex justify-center items-center z-50 p-4" onClick={() => setIsGestionModalOpen(false)}>
                    <div className="bg-gray-100 rounded-xl shadow-2xl w-full max-w-2xl transform transition-all" onClick={e => e.stopPropagation()}>
                       <div className="flex justify-between items-center p-4 border-b">
                            <h2 className="text-2xl font-bold text-gray-800">Gestión de Caja</h2>
                            <button onClick={() => setIsGestionModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <Icon path="M6 18L18 6M6 6l12 12" className="w-6 h-6"/>
                            </button>
                       </div>

                        {isModalLoading ? (
                             <div className="flex justify-center items-center p-20"><SpinnerIcon className="w-12 h-12 text-[var(--principal)]"/></div>
                        ) : (
                            <div className="bg-white rounded-b-xl">
                                {/* Pestañas de Navegación */}
                                <div className="flex border-b border-gray-200">
                                    <TabButton icon={<OpenIcon/>} text="Abrir Caja" isActive={activeTab === 'abrir'} onClick={() => setActiveTab('abrir')} />
                                    <TabButton icon={<MovementIcon/>} text="Movimientos" isActive={activeTab === 'movimientos'} onClick={() => setActiveTab('movimientos')} disabled={cajasAbiertas.length === 0} />
                                    <TabButton icon={<CloseIcon/>} text="Cerrar Caja" isActive={activeTab === 'cerrar'} onClick={() => setActiveTab('cerrar')} disabled={cajasAbiertas.length === 0} />
                                </div>
                                {/* Contenido de la Pestaña Activa */}
                                <div className="p-6 sm:p-8">
                                    {activeTab === 'abrir' && <AbrirCajaForm formState={formAbrir} setFormState={setFormAbrir} puntosDeVenta={puntosDeVenta} onSubmit={handleAbrirCaja} isSubmitting={isSubmitting} />}
                                    {activeTab === 'movimientos' && <MovimientoForm formState={formMovimiento} setFormState={setFormMovimiento} cajasAbiertas={cajasAbiertas} onSubmit={handleMovimiento} isSubmitting={isSubmitting} />}
                                    {activeTab === 'cerrar' && <CerrarCajaForm formState={formCerrar} setFormState={setFormCerrar} cajasAbiertas={cajasAbiertas} selectedCaja={cajaSeleccionadaParaCerrar} diferencia={diferenciaCierre} onSubmit={handleCerrarCaja} isSubmitting={isSubmitting} />}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}


// --- SUB-COMPONENTES PARA EL MODAL DE GESTIÓN (formularios, etc.) ---

const TabButton = ({ icon, text, isActive, disabled, onClick }) => (
    <button onClick={onClick} disabled={disabled} className={`flex-1 flex items-center justify-center gap-2 p-4 text-sm font-bold border-b-2 transition-all duration-200 ${isActive ? 'border-[var(--principal)] text-[var(--principal)]' : 'border-transparent text-gray-500 hover:bg-gray-50 hover:text-gray-700'} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
        {icon} <span className="hidden sm:inline">{text}</span>
    </button>
);

const AbrirCajaForm = ({ formState, setFormState, puntosDeVenta, onSubmit, isSubmitting }) => {
    const handleChange = (e) => setFormState(prev => ({...prev, [e.target.name]: e.target.value}));
    return (
        <form onSubmit={onSubmit} className="space-y-6 animate-fade-in">
            <h3 className="text-xl font-semibold text-gray-700">Completá los datos para iniciar el día</h3>
            <div>
                <label htmlFor="puntoVenta" className="block text-sm font-medium text-gray-700">Punto de Venta*</label>
                <select id="puntoVenta" name="puntoVenta" value={formState.puntoVenta} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                    <option value="">-- Seleccione un punto --</option>
                    {puntosDeVenta.map(p => <option key={p._id} value={p._id}>{p.nombre}</option>)}
                </select>
            </div>
            <div>
                <label htmlFor="nombreCaja" className="block text-sm font-medium text-gray-700">Nombre de la Caja*</label>
                <input type="text" id="nombreCaja" name="nombreCaja" value={formState.nombreCaja} onChange={handleChange} required placeholder="Ej: Caja Principal, Turno Mañana" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" />
            </div>
            <div>
                <label htmlFor="montoInicial" className="block text-sm font-medium text-gray-700">Monto Inicial ($)</label>
                <input type="number" id="montoInicial" name="montoInicial" value={formState.montoInicial} onChange={handleChange} min="0" step="any" placeholder="0.00" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" />
            </div>
            <button type="submit" disabled={isSubmitting} className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[var(--principal)] hover:bg-[var(--principal-shadow)] disabled:bg-indigo-400">
                {isSubmitting ? <><SpinnerIcon /> Abriendo...</> : 'Abrir Caja'}
            </button>
        </form>
    );
};

const CerrarCajaForm = ({ formState, setFormState, cajasAbiertas, selectedCaja, diferencia, onSubmit, isSubmitting }) => {
    const handleChange = (e) => setFormState(prev => ({...prev, [e.target.name]: e.target.value}));
    if (cajasAbiertas.length === 0) return <div className="text-center p-6 bg-gray-50 rounded-lg animate-fade-in"><p className="text-gray-600">No hay cajas abiertas para cerrar.</p></div>;
    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <label htmlFor="cajaId" className="block text-sm font-medium text-gray-700">Seleccioná la Caja a Cerrar*</label>
                <select id="cajaId" name="cajaId" value={formState.cajaId} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                    <option value="">-- Por favor, elige una opción --</option>
                    {cajasAbiertas.map(c => <option key={c._id} value={c._id}>{c.nombreCaja} (P.V: {c.puntoDeVenta?.nombre || 'N/A'})</option>)}
                </select>
            </div>
            {selectedCaja && (
                <form onSubmit={onSubmit} className="space-y-6 border-t pt-6 animate-fade-in">
                    <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                        <h4 className="font-bold text-lg text-gray-700 mb-2">Resumen de Caja</h4>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                            <p className="font-semibold">Monto Esperado:</p><p className="font-bold text-lg">{formatCurrency(selectedCaja.montoFinalEsperado)}</p>
                        </div>
                    </div>
                    <div>
                        <label htmlFor="montoFinal" className="block text-sm font-medium text-gray-700">Monto Final Contado (Dinero real en caja)*</label>
                        <input type="number" id="montoFinal" name="montoFinal" value={formState.montoFinal} onChange={handleChange} required min="0" step="0.01" className="text-lg mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" placeholder="0.00" />
                    </div>
                    <div className={`p-3 text-center rounded-lg border font-semibold ${diferencia === 0 ? 'bg-gray-100' : diferencia < 0 ? 'bg-red-100 text-red-800 border-red-200' : 'bg-green-100 text-green-800 border-green-200'}`}>
                        Diferencia de Caja: {formatCurrency(diferencia)}
                    </div>
                    <div>
                        <label htmlFor="observaciones" className="block text-sm font-medium text-gray-700">Observaciones (Opcional)</label>
                        <textarea id="observaciones" name="observaciones" value={formState.observaciones} onChange={handleChange} rows="3" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" placeholder="Ej: Faltante por error en vuelto, etc." />
                    </div>
                    <button type="submit" disabled={isSubmitting} className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:bg-red-400">
                        {isSubmitting ? <><SpinnerIcon /> Cerrando...</> : 'Confirmar y Cerrar Caja'}
                    </button>
                </form>
            )}
        </div>
    );
};

const MovimientoForm = ({ formState, setFormState, cajasAbiertas, onSubmit, isSubmitting }) => {
    const handleChange = (e) => setFormState(prev => ({...prev, [e.target.name]: e.target.value}));
    if (cajasAbiertas.length === 0) return <div className="text-center p-6 bg-gray-50 rounded-lg animate-fade-in"><p className="text-gray-600">Necesitás tener una caja abierta para registrar movimientos.</p></div>;
    const color = formState.tipo === 'ingreso' ? 'green' : 'red';
    return (
        <form onSubmit={onSubmit} className="space-y-6 animate-fade-in">
            <div>
                <label htmlFor="cajaIdMov" className="block text-sm font-medium text-gray-700">Seleccioná la Caja*</label>
                <select id="cajaIdMov" name="cajaId" value={formState.cajaId} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                    <option value="">-- Por favor, elige una opción --</option>
                    {cajasAbiertas.map(c => <option key={c._id} value={c._id}>{c.nombreCaja} (P.V: {c.puntoDeVenta?.nombre || 'N/A'})</option>)}
                </select>
            </div>
            <fieldset className="border border-gray-300 rounded-md p-4">
                <legend className="text-sm font-medium text-gray-700 px-1">Tipo de Movimiento</legend>
                <div className="flex gap-4">
                    <RadioOption label="Ingreso" value="ingreso" color="green" checked={formState.tipo === 'ingreso'} onChange={handleChange} />
                    <RadioOption label="Egreso" value="egreso" color="red" checked={formState.tipo === 'egreso'} onChange={handleChange} />
                </div>
            </fieldset>
             <div>
                <label htmlFor="monto" className="block text-sm font-medium text-gray-700">Monto ($)*</label>
                <input type="number" id="monto" name="monto" value={formState.monto} onChange={handleChange} required min="0.01" step="0.01" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" />
            </div>
            <div>
                <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700">Descripción*</label>
                <textarea id="descripcion" name="descripcion" value={formState.descripcion} onChange={handleChange} required rows="3" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" placeholder="Ej: Pago a proveedor, retiro de efectivo..." />
            </div>
            <button type="submit" disabled={isSubmitting || !formState.cajaId} className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-${color}-600 hover:bg-${color}-700 disabled:bg-gray-400`}>
                {isSubmitting ? <><SpinnerIcon /> Registrando...</> : `Registrar ${formState.tipo}`}
            </button>
        </form>
    );
};

const RadioOption = ({ label, value, color, checked, onChange }) => (
    <label className={`flex-1 flex items-center justify-center p-3 border-2 rounded-lg cursor-pointer transition-all ${checked ? `border-${color}-500 bg-${color}-50` : 'border-gray-300'}`}>
        <input type="radio" name="tipo" value={value} checked={checked} onChange={onChange} className="sr-only" />
        <span className={`text-sm font-semibold ${checked ? `text-${color}-700` : 'text-gray-600'}`}>{label}</span>
    </label>
);