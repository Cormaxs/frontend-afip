import React, { useContext, useEffect, useState } from "react";
import { apiContext } from "../../context/api_context";

// Componente principal para mostrar el historial de cajas
export function HistorialCajas() {
    // ESTADOS
    const { companyData, get_caja_company } = useContext(apiContext);
    const [currentPage, setCurrentPage] = useState(1);
    const [apiData, setApiData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [expandedRowId, setExpandedRowId] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [rowDetails, setRowDetails] = useState(null);

    // EFECTO PARA OBTENER DATOS
    useEffect(() => {
        const companyId = companyData?._id;
        if (!companyId) {
            setLoading(false);
            return;
        }
        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await get_caja_company(companyId, currentPage);
                setApiData(response);
            } catch (err) {
                setError("No se pudieron cargar los registros de caja.");
                console.error("Error al obtener las cajas:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [companyData?._id, currentPage, get_caja_company]);

    // MANEJADOR DE CLIC EN FILA
    const handleRowClick = (caja) => {
        if (expandedRowId === caja._id) {
            setExpandedRowId(null);
            return;
        }
        setExpandedRowId(caja._id);
        setDetailLoading(true);
        // Simulamos la carga, ya que los datos ya están disponibles en el objeto 'caja'
        setTimeout(() => {
            setRowDetails(caja);
            setDetailLoading(false);
        }, 300);
    };

    // FUNCIONES DE FORMATEO
    const formatDateTime = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    };
    const formatCurrency = (amount) => {
        if (typeof amount !== 'number') return '-';
        return `$${amount.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    // LÓGICA DE RENDERIZADO
    const renderContent = () => {
        if (loading) return <p className="text-center text-gray-500 py-10">Cargando historial...</p>;
        if (error) return <p className="text-center text-red-600 py-10">{error}</p>;
        if (!apiData?.cajas?.length) return <p className="text-center text-gray-500 py-10">No se encontraron registros de caja.</p>;

        return (
            <>
                <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg mb-6">
                    <div className="overflow-x-auto">
                        <table className="min-w-full w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-2 py-3"></th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">P. Venta / Vendedor</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">F. Apertura</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">M. Final</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Diferencia</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {apiData.cajas.map(caja => {
                                    const isExpanded = expandedRowId === caja._id;
                                    // --- Clases de fondo para la fila según el estado ---
                                    const rowBgClass = caja.estado === 'abierta' ? 'bg-green-50' : 'bg-red-50';

                                    return (
                                        <React.Fragment key={caja._id}>
                                            {/* Fila Principal Clickeable */}
                                            <tr onClick={() => handleRowClick(caja)} className={`hover:bg-gray-200 cursor-pointer ${rowBgClass}`}>
                                                <td className="px-2 py-4 text-center">
                                                    <span className={`transform transition-transform duration-200 inline-block ${isExpanded ? 'rotate-90' : ''}`}>▶</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${caja.estado === 'abierta' ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>{caja.estado}</span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                                                    <div className="font-medium">{caja.puntoDeVenta?.nombre || 'N/A'}</div>
                                                    <div className="text-gray-500">{caja.vendedorAsignado?.nombre || 'N/A'}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDateTime(caja.fechaApertura)}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 text-right">{formatCurrency(caja.montoFinalReal)}</td>
                                                <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium text-right ${caja.diferencia < 0 ? 'text-red-600' : 'text-green-600'}`}>{formatCurrency(caja.diferencia)}</td>
                                            </tr>
                                            {/* Fila de Detalles */}
                                            {isExpanded && (
                                                <tr>
                                                    <td colSpan="6" className="p-0">
                                                        <div className="p-4 bg-gray-100">
                                                            {detailLoading ? <p>Cargando...</p> : (
                                                                // --- Nuevo diseño de la vista de detalles con un grid ---
                                                                <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-6 bg-white rounded-md border">
                                                                    {/* Columna 1: Resumen de la Caja */}
                                                                    <div className="space-y-2">
                                                                        <h4 className="font-bold text-gray-700 border-b pb-2">Resumen de Caja</h4>
                                                                        <div className="flex justify-between text-sm"><span className="text-gray-600">Monto Inicial:</span> <span className="font-medium">{formatCurrency(rowDetails.montoInicial)}</span></div>
                                                                        <div className="flex justify-between text-sm"><span className="text-gray-600">Ingresos Totales:</span> <span className="font-medium text-green-600">{formatCurrency(rowDetails.ingresos)}</span></div>
                                                                        <div className="flex justify-between text-sm"><span className="text-gray-600">Egresos Totales:</span> <span className="font-medium text-red-600">{formatCurrency(rowDetails.egresos)}</span></div>
                                                                        <div className="flex justify-between text-sm pt-2 border-t"><span className="text-gray-600">Monto Final Esperado:</span> <span className="font-medium">{formatCurrency(rowDetails.montoFinalEsperado)}</span></div>
                                                                    </div>
                                                                    {/* Columna 2: Lista de Transacciones */}
                                                                    <div>
                                                                        <h4 className="font-bold text-gray-700 border-b pb-2">Movimientos</h4>
                                                                        {!rowDetails?.transacciones?.length ? <p className="text-sm text-gray-500 mt-2">No hay movimientos para mostrar.</p> : (
                                                                            <ul className="divide-y divide-gray-200 max-h-48 overflow-y-auto">
                                                                                {rowDetails.transacciones.map(t => (
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
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Controles de Paginación */}
                <div className="flex justify-between items-center">
                    <button onClick={() => setCurrentPage(p => p - 1)} disabled={!apiData.pagination.hasPrevPage} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">Anterior</button>
                    <span className="text-sm text-gray-700">Página {apiData.pagination.currentPage} de {apiData.pagination.totalPages}</span>
                    <button onClick={() => setCurrentPage(p => p + 1)} disabled={!apiData.pagination.hasNextPage} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">Siguiente</button>
                </div>
            </>
        );
    };

    return (
        <div className="p-4 md:p-6 font-sans">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Historial de Cajas</h2>
            {renderContent()}
        </div>
    );
}