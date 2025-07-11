import React, { useContext, useEffect, useState, useCallback } from "react";
import { apiContext } from "../../context/api_context";
import Swal from 'sweetalert2';

// --- Componente principal para mostrar el historial de cajas ---
export default function HistorialCajas() {
    // --- ESTADOS ---
    const { companyData, get_caja_company, getPointsByCompany } = useContext(apiContext);
    const [apiData, setApiData] = useState({ cajas: [], pagination: {} });
    const [loading, setLoading] = useState(false); // No carga datos al inicio
    const [error, setError] = useState(null);
    const [hasSearched, setHasSearched] = useState(false); // Para saber si ya se hizo una búsqueda

    // Estados para la paginación y filtros
    const [currentPage, setCurrentPage] = useState(1);
    const [filters, setFilters] = useState({
        puntoVenta: '',
        vendedor: '',
        fechaDesde: '',
        fechaHasta: '',
    });
    const [puntosDeVenta, setPuntosDeVenta] = useState([]);

    // Estados para la UI
    const [expandedRowId, setExpandedRowId] = useState(null);

    // --- EFECTO PARA CARGAR PUNTOS DE VENTA (UNA SOLA VEZ) ---
    useEffect(() => {
        const fetchPuntosDeVenta = async () => {
            const companyId = companyData?._id;
            if (!companyId) return;
            try {
                const response = await getPointsByCompany(companyId, 1, 500); // Límite alto para traer todos
                if (response && response.puntosDeVenta) {
                    setPuntosDeVenta(response.puntosDeVenta);
                }
            } catch (err) {
                console.error("Error al obtener los puntos de venta:", err);
                // Opcional: mostrar un error al usuario
            }
        };
        fetchPuntosDeVenta();
    }, [companyData?._id, getPointsByCompany]);

    // --- OBTENCIÓN DE DATOS (AHORA MANUAL) ---
    const fetchData = useCallback(async (page = 1) => {
        const companyId = companyData?._id;
        if (!companyId) {
            setLoading(false);
            return;
        }
        setLoading(true);
        setError(null);
        setHasSearched(true); // Marca que se ha realizado al menos una búsqueda
        try {
            const response = await get_caja_company(companyId, page, filters);
            setApiData(response || { cajas: [], pagination: {} });
        } catch (err) {
            setError("No se pudieron cargar los registros de caja.");
            console.error("Error al obtener las cajas:", err);
        } finally {
            setLoading(false);
        }
    }, [companyData?._id, filters, get_caja_company]);
    
    // Efecto para cambiar de página
    useEffect(() => {
        if(hasSearched) { // Solo busca si ya se hizo una búsqueda inicial
            fetchData(currentPage);
        }
    }, [currentPage, hasSearched]);


    // --- MANEJADORES DE EVENTOS ---
    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const handleFilterSubmit = (e) => {
        e.preventDefault();
        setCurrentPage(1); // Reinicia a la página 1
        fetchData(1);      // Inicia la búsqueda en la página 1
    };

    const handleClearFilters = () => {
        setFilters({ puntoVenta: '', vendedor: '', fechaDesde: '', fechaHasta: '' });
        setCurrentPage(1);
        setApiData({ cajas: [], pagination: {} }); // Limpia los resultados
        setHasSearched(false); // Resetea el estado de búsqueda
    };
    
    const handleRowClick = (cajaId) => {
        setExpandedRowId(prevId => (prevId === cajaId ? null : cajaId));
    };

    // --- FUNCIONES DE FORMATEO ---
    const formatDateTime = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    };
    const formatCurrency = (amount) => {
        if (typeof amount !== 'number') return '$ 0,00';
        return `$ ${amount.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    // --- RENDERIZADO DEL COMPONENTE ---
    return (
        <div className="p-4 md:p-6 bg-gray-50 min-h-screen">
            <div className="max-w-7xl mx-auto">
                <h2 className="text-3xl font-bold text-gray-800 mb-6">Historial de Cajas</h2>

                {/* Panel de Filtros */}
                <div className="bg-white p-4 rounded-lg shadow-sm mb-6 border">
                    <form onSubmit={handleFilterSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                        <div className="lg:col-span-1">
                            <label htmlFor="puntoVenta" className="block text-sm font-medium text-gray-700">P. de Venta</label>
                            <select
                                name="puntoVenta"
                                value={filters.puntoVenta}
                                onChange={handleFilterChange}
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm text-sm"
                            >
                                <option value="">Todos</option>
                                {puntosDeVenta.map(punto => (
                                    <option key={punto._id} value={punto._id}>{punto.nombre}</option>
                                ))}
                            </select>
                        </div>
                        <div className="lg:col-span-1">
                            <label htmlFor="vendedor" className="block text-sm font-medium text-gray-700">Vendedor</label>
                            <input type="text" name="vendedor" value={filters.vendedor} onChange={handleFilterChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm text-sm" />
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
                            <button type="submit" className="w-full bg-blue-600 text-white py-2 px-4 rounded-md shadow-sm hover:bg-blue-700 text-sm font-semibold" disabled={loading}>
                                {loading ? 'Buscando...' : 'Filtrar'}
                            </button>
                            <button type="button" onClick={handleClearFilters} className="w-full bg-gray-200 text-gray-700 py-2 px-4 rounded-md shadow-sm hover:bg-gray-300 text-sm">Limpiar</button>
                        </div>
                    </form>
                </div>
                
                {/* Contenedor de la Tabla */}
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                    {loading ? (
                        <p className="text-center text-gray-500 py-12">Cargando historial...</p>
                    ) : error ? (
                        <p className="text-center text-red-600 py-12">{error}</p>
                    ) : !hasSearched ? (
                         <p className="text-center text-gray-500 py-12">Utilice los filtros para buscar en el historial de cajas.</p>
                    ) : !apiData?.cajas?.length ? (
                        <p className="text-center text-gray-500 py-12">No se encontraron registros de caja con los filtros aplicados.</p>
                    ) : (
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
                                            <RowItem key={caja._id} caja={caja} isExpanded={expandedRowId === caja._id} onRowClick={handleRowClick} formatCurrency={formatCurrency} formatDateTime={formatDateTime} />
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
                    )}
                </div>
            </div>
        </div>
    );
}


// --- SUB-COMPONENTE PARA LA FILA Y SUS DETALLES (SIN CAMBIOS) ---
function RowItem({ caja, isExpanded, onRowClick, formatCurrency, formatDateTime }) {
    // ... (El código de este sub-componente permanece igual)
    return (
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
                    <td colSpan="6" className="p-0 bg-gray-100">
                        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-b">
                            {/* Columna 1: Resumen de Caja */}
                            <div className="space-y-2">
                                <h4 className="font-bold text-gray-700 border-b pb-2">Resumen de Caja</h4>
                                <div className="flex justify-between text-sm"><span className="text-gray-600">Monto Inicial:</span> <span className="font-medium">{formatCurrency(caja.montoInicial)}</span></div>
                                <div className="flex justify-between text-sm"><span className="text-gray-600">Ingresos Totales:</span> <span className="font-medium text-green-600">{formatCurrency(caja.ingresos)}</span></div>
                                <div className="flex justify-between text-sm"><span className="text-gray-600">Egresos Totales:</span> <span className="font-medium text-red-600">{formatCurrency(caja.egresos)}</span></div>
                                <div className="flex justify-between text-sm pt-2 border-t"><span className="text-gray-600">Monto Final Esperado:</span> <span className="font-medium">{formatCurrency(caja.montoFinalEsperado)}</span></div>
                            </div>
                             {/* Columna 2: Lista de Transacciones */}
                             <div>
                                <h4 className="font-bold text-gray-700 border-b pb-2">Movimientos</h4>
                                {!caja?.transacciones?.length ? <p className="text-sm text-gray-500 mt-2">No hay movimientos para mostrar.</p> : (
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
                                )}
                            </div>
                        </div>
                    </td>
                </tr>
            )}
        </React.Fragment>
    );
}